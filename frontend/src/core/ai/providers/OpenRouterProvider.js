import { BaseProvider, ProviderError } from "./BaseProvider";

const OPENROUTER_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

export class OpenRouterProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "openrouter",
      name: "OpenRouter",
      baseUrl: config.baseUrl || OPENROUTER_URL,
      apiKey: config.apiKey || localStorage.getItem("openrouter_key") || "",
      models: config.models || [
        "openai/gpt-4o-mini", "openai/gpt-4o",
        "anthropic/claude-3.5-sonnet", "anthropic/claude-3-haiku",
        "google/gemini-2.0-flash", "meta-llama/llama-3.3-70b",
        "deepseek/deepseek-chat", "qwen/qwen-2.5-72b",
        "mistral/mistral-large", "cohere/command-r-plus",
      ],
      defaultModel: config.defaultModel || DEFAULT_MODEL,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey) {
      throw new ProviderError("OpenRouter requires an API key", {
        code: "NO_API_KEY", provider: this.id, retryable: false,
      });
    }

    const model = options.model || this.defaultModel;

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
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
        throw new ProviderError(`OpenRouter error: ${res.status}`, {
          code: "PROVIDER_ERROR", status: res.status, provider: this.id,
        });
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError(`OpenRouter request failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async *streamMessage(messages, options = {}) {
    if (!this.apiKey) {
      throw new ProviderError("OpenRouter requires an API key", {
        code: "NO_API_KEY", provider: this.id, retryable: false,
      });
    }

    const model = options.model || this.defaultModel;

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
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
        throw new ProviderError(`OpenRouter stream error: ${res.status}`, {
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
      throw new ProviderError(`OpenRouter stream failed: ${err.message}`, {
        code: "NETWORK_ERROR", provider: this.id,
      });
    }
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
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
