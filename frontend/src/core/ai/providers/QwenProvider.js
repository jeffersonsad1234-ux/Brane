import { BaseProvider, ProviderError } from "./BaseProvider";

const QWEN_URL = "https://dashscope.aliyuncs.com/api/v1";
const DEFAULT_MODEL = "qwen-plus";

export class QwenProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "qwen",
      name: "Qwen (Alibaba Cloud)",
      baseUrl: config.baseUrl || QWEN_URL,
      apiKey: config.apiKey || localStorage.getItem("qwen_key") || "",
      models: config.models || ["qwen-plus", "qwen-max", "qwen-turbo"],
      defaultModel: config.defaultModel || DEFAULT_MODEL,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey) {
      throw new ProviderError("Qwen requires an API key", {
        code: "NO_API_KEY", provider: this.id, retryable: false,
      });
    }

    const model = options.model || this.defaultModel;

    try {
      const res = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: { messages },
          parameters: {
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
          },
        }),
      });

      if (!res.ok) {
        throw new ProviderError(`Qwen error: ${res.status}`, {
          code: "PROVIDER_ERROR", status: res.status, provider: this.id,
        });
      }

      const data = await res.json();
      return data.output?.text || "";
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(`Qwen request failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async *streamMessage(messages, options = {}) {
    if (!this.apiKey) {
      throw new ProviderError("Qwen requires an API key", {
        code: "NO_API_KEY", provider: this.id, retryable: false,
      });
    }

    const model = options.model || this.defaultModel;

    try {
      const res = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: { messages },
          parameters: {
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
            incremental_output: true,
          },
        }),
      });

      if (!res.ok) {
        throw new ProviderError(`Qwen stream error: ${res.status}`, {
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
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") return;
          try {
            const chunk = JSON.parse(jsonStr);
            const content = chunk.output?.text || "";
            if (content) yield content;
          } catch { }
        }
      }
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(`Qwen stream failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ model: this.defaultModel, input: { messages: [{ role: "user", content: "ping" }] }, parameters: { max_tokens: 1 } }),
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
