import { BaseProvider, ProviderError } from "./BaseProvider";

const OLLAMA_DEFAULT_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen2.5-coder:7b";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const HEALTH_DEBOUNCE_MS = 3000;
const CONSECUTIVE_FAILURE_THRESHOLD = 2;

export class OllamaProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "ollama",
      name: "Ollama Local",
      baseUrl: config.baseUrl || localStorage.getItem("ollama_url") || OLLAMA_DEFAULT_URL,
      apiKey: config.apiKey || "",
      models: config.models || [DEFAULT_MODEL],
      defaultModel: config.defaultModel || DEFAULT_MODEL,
      requiresKey: false,
      ...config,
    });
    this.healthy = true;
    this.lastHealthCheck = 0;
    this._consecutiveFailures = 0;
    this._healthInFlight = null;
  }

  _buildPayload(model, messages, stream, options = {}) {
    return {
      model,
      messages,
      stream,
      keep_alive: "30m",
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 4096,
        ...(options.signal ? {} : {}),
      },
    };
  }

  async _fetchWithRetry(url, body, attempt = 0) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const isModelNotFound = res.status === 404;
        throw new ProviderError(
          isModelNotFound ? `Modelo "${body.model}" não encontrado no Ollama. Execute: ollama pull ${body.model}` : `Ollama error: ${res.status}`,
          { code: isModelNotFound ? "MODEL_NOT_FOUND" : "PROVIDER_ERROR", status: res.status, provider: this.id, retryable: !isModelNotFound }
        );
      }
      return res;
    } catch (err) {
      if (err instanceof ProviderError && !err.retryable) throw err;
      if (err.name === "AbortError") throw new ProviderError("Requisição cancelada", { code: "ABORTED", provider: this.id, retryable: false });

      const isCorsOrNetwork = err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("NetworkError"));
      if (isCorsOrNetwork && attempt >= MAX_RETRIES) {
        throw new ProviderError(
          "Ollama local não está acessível. Verifique se o Ollama está rodando (ollama serve). " +
          "Se estiver usando navegador, pode ser necessário configurar CORS ou usar extensão que permita localhost.",
          { code: "CORS_ERROR", provider: this.id, retryable: false }
        );
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        return this._fetchWithRetry(url, body, attempt + 1);
      }

      throw new ProviderError(`Ollama request failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async sendMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const endpoint = `${this.baseUrl}/api/chat`;
    const body = this._buildPayload(model, messages, false, options);

    try {
      const res = await this._fetchWithRetry(endpoint, body);
      const data = await res.json();
      return data.message?.content || "";
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(`Ollama request failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async *streamMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const endpoint = `${this.baseUrl}/api/chat`;
    const body = this._buildPayload(model, messages, true, options);

    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: options.signal,
        });

        if (!res.ok) {
          const isModelNotFound = res.status === 404;
          throw new ProviderError(
            isModelNotFound ? `Modelo "${model}" não encontrado. Execute: ollama pull ${model}` : `Ollama stream error: ${res.status}`,
            { code: isModelNotFound ? "MODEL_NOT_FOUND" : "PROVIDER_ERROR", status: res.status, provider: this.id, retryable: !isModelNotFound }
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let yieldedAny = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed);
              const content = chunk.message?.content || "";
              if (content) {
                yieldedAny = true;
                yield content;
              }
              if (chunk.done) return;
            } catch { /* skip malformed */ }
          }
        }
        return;
      } catch (err) {
        lastError = err;
        if (err instanceof ProviderError && !err.retryable) throw err;
        if (err.name === "AbortError") throw new ProviderError("Stream cancelado", { code: "ABORTED", provider: this.id, retryable: false });

        const isCorsOrNetwork = err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("NetworkError"));
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
          continue;
        }
        if (isCorsOrNetwork) {
          throw new ProviderError(
            "Ollama local não está acessível pelo navegador. " +
            "Verifique: 1) Ollama está rodando? 2) Precisa de extensão CORS?",
            { code: "CORS_ERROR", provider: this.id, retryable: false }
          );
        }
      }
    }
    throw lastError || new ProviderError("Stream failed", { code: "UNKNOWN", provider: this.id });
  }

  async listModels() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return this.models;
      const data = await res.json();
      const models = (data.models || []).map((m) => m.name);
      if (models.length > 0) {
        this.models = models;
        if (!this.defaultModel || !models.includes(this.defaultModel)) {
          this.defaultModel = models[0];
        }
      }
      return models;
    } catch {
      return this.models;
    }
  }

  async healthCheck() {
    if (this._healthInFlight) return this._healthInFlight;

    const now = Date.now();
    if (now - this.lastHealthCheck < HEALTH_DEBOUNCE_MS && this._consecutiveFailures === 0) {
      return this.healthy;
    }

    this._healthInFlight = (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          this._consecutiveFailures = 0;
          this.healthy = true;
          this.lastHealthCheck = Date.now();
          this.listModels().catch(() => {});
        } else {
          this._consecutiveFailures++;
          if (this._consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
            this.healthy = false;
          }
          this.lastHealthCheck = Date.now();
        }
        return this.healthy;
      } catch {
        this._consecutiveFailures++;
        if (this._consecutiveFailures >= CONSECUTIVE_FAILURE_THRESHOLD) {
          this.healthy = false;
        }
        this.lastHealthCheck = Date.now();
        return false;
      }
    })();

    const result = await this._healthInFlight;
    this._healthInFlight = null;
    return result;
  }
}
