import { BaseProvider, ProviderError } from "./BaseProvider";

const LOCAL_URL = "http://localhost:11434"; // Ollama default
const DEFAULT_MODEL = "llama3.2";

export class LocalProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "local",
      name: "Local (Ollama)",
      baseUrl: config.baseUrl || localStorage.getItem("ollama_url") || LOCAL_URL,
      apiKey: config.apiKey || "",
      models: config.models || ["llama3.2", "llama3.1", "mistral", "phi3", "gemma2"],
      defaultModel: config.defaultModel || DEFAULT_MODEL,
      requiresKey: false,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 2048,
          },
        }),
      });

      if (!res.ok) {
        throw new ProviderError(`Local/Ollama error: ${res.status}`, {
          code: "PROVIDER_ERROR", status: res.status, provider: this.id,
        });
      }

      const data = await res.json();
      return data.message?.content || "";
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(`Local/Ollama request failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async *streamMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 2048,
          },
        }),
      });

      if (!res.ok) {
        throw new ProviderError(`Local/Ollama stream error: ${res.status}`, {
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
          } catch { }
        }
      }
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(`Local/Ollama stream failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      this.healthy = res.ok;
      this.lastHealthCheck = Date.now();
      return this.healthy;
    } catch {
      this.healthy = false;
      this.lastHealthCheck = Date.now();
      return false;
    }
  }
}
