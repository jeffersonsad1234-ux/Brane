import { BaseProvider, ProviderError } from "./BaseProvider";

const OLLAMA_DEFAULT_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen2.5-coder:7b";

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
  }

  async sendMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const endpoint = `${this.baseUrl}/api/chat`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 4096,
          },
        }),
      });

      if (!res.ok) {
        throw new ProviderError(`Ollama error: ${res.status}${res.status === 404 ? " — modelo não encontrado" : ""}`, {
          code: "PROVIDER_ERROR", status: res.status, provider: this.id,
        });
      }

      const data = await res.json();
      return data.message?.content || "";
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      // CORS/localhost detection
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new ProviderError(
          "Ollama local não está acessível. Verifique se o Ollama está rodando (ollama serve). " +
          "Se estiver usando navegador, pode ser necessário configurar CORS ou usar extensão que permita localhost.",
          { code: "CORS_ERROR", provider: this.id, retryable: false }
        );
      }
      throw new ProviderError(`Ollama request failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async *streamMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const endpoint = `${this.baseUrl}/api/chat`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 4096,
          },
        }),
      });

      if (!res.ok) {
        throw new ProviderError(`Ollama stream error: ${res.status}`, {
          code: "PROVIDER_ERROR", status: res.status, provider: this.id,
        });
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            if (content) yield content;
            if (chunk.done) return;
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new ProviderError(
          "Ollama local não está acessível pelo navegador. " +
          "Verifique: 1) Ollama está rodando? 2) Precisa de extensão CORS?",
          { code: "CORS_ERROR", provider: this.id, retryable: false }
        );
      }
      throw new ProviderError(`Ollama stream failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async listModels() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
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
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      this.healthy = res.ok;
      this.lastHealthCheck = Date.now();
      if (this.healthy) {
        // Update model list on health check
        this.listModels().catch(() => {});
      }
      return this.healthy;
    } catch (err) {
      this.healthy = false;
      this.lastHealthCheck = Date.now();
      // CORS detection
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        console.warn("[Ollama] Não foi possível conectar ao Ollama local. CORS pode estar bloqueando.");
      }
      return false;
    }
  }
}
