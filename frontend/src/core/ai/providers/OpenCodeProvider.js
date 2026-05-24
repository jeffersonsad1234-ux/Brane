import { BaseProvider, ProviderError } from "./BaseProvider";

const OPENCODE_DEFAULT_URL = "http://localhost:11434"; // Ollama-compatible local endpoint
const DEFAULT_MODEL = "opencode/big-pickle";

export class OpenCodeProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "opencode",
      name: "OpenCode AI",
      baseUrl: config.baseUrl || localStorage.getItem("opencode_url") || OPENCODE_DEFAULT_URL,
      apiKey: config.apiKey || localStorage.getItem("opencode_key") || "",
      models: config.models || [DEFAULT_MODEL, "opencode/small-pickle", "opencode/tiny-pickle"],
      defaultModel: config.defaultModel || DEFAULT_MODEL,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const endpoint = `${this.baseUrl}/v1/chat/completions`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new ProviderError(`OpenCode error: ${res.status}`, {
          code: "PROVIDER_ERROR", status: res.status, provider: this.id,
        });
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(`OpenCode request failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async *streamMessage(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const endpoint = `${this.baseUrl}/v1/chat/completions`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          stream: true,
        }),
      });

      if (!res.ok) {
        throw new ProviderError(`OpenCode stream error: ${res.status}`, {
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
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") return;
          try {
            const chunk = JSON.parse(jsonStr);
            const content = chunk.choices?.[0]?.delta?.content || "";
            if (content) yield content;
          } catch { }
        }
      }
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(`OpenCode stream failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
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
