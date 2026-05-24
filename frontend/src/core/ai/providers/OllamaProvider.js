import { BaseProvider, ProviderError } from "./BaseProvider";

const OLLAMA_DEFAULT_URL = "http://localhost:11434";
const DEFAULT_MODEL = "qwen2.5-coder:7b";

function buildPayload(model, messages, stream, options = {}) {
  return {
    model,
    messages,
    stream,
    keep_alive: "30m",
    options: {
      temperature: options.temperature ?? 0.7,
      num_predict: options.maxTokens ?? 4096,
    },
  };
}

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
    this._healthInFlight = null;
  }

  async sendMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const body = buildPayload(model, messages, false, options);

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new ProviderError(
          `Modelo "${model}" não encontrado no Ollama. Execute: ollama pull ${model}`,
          { code: "MODEL_NOT_FOUND", provider: this.id, retryable: false }
        );
      }
      throw new ProviderError(`Ollama error: ${res.status}`, {
        code: "PROVIDER_ERROR", status: res.status, provider: this.id,
      });
    }

    const data = await res.json();
    return data.message?.content || "";
  }

  async streamMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const body = buildPayload(model, messages, true, options);

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options.signal,
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new ProviderError(
          `Modelo "${model}" não encontrado. Execute: ollama pull ${model}`,
          { code: "MODEL_NOT_FOUND", provider: this.id, retryable: false }
        );
      }
      throw new ProviderError(`Ollama stream error: ${res.status}`, {
        code: "PROVIDER_ERROR", status: res.status, provider: this.id,
      });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done = false;

    return {
      async next() {
        if (done) return { done: true, value: undefined };
        while (true) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) { done = true; return { done: true, value: undefined }; }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const chunk = JSON.parse(trimmed);
              const content = chunk.message?.content || "";
              if (chunk.done) { done = true; }
              if (content) return { done: false, value: content };
            } catch {}
          }
        }
      },
      [Symbol.asyncIterator]() {
        return this;
      },
    };
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
    this._healthInFlight = (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) this.listModels().catch(() => {});
        return res.ok;
      } catch {
        return false;
      }
    })();
    const result = await this._healthInFlight;
    this._healthInFlight = null;
    return result;
  }
}
