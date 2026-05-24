import { BaseProvider, ProviderError } from "./BaseProvider";

const OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];

export class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "openai",
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      models: config.models || OPENAI_MODELS,
      defaultModel: "gpt-4o-mini",
      requiresKey: true,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey) throw new ProviderError("OpenAI API key não configurada", { code: "NO_KEY", provider: this.id, retryable: false });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        stream: false,
      }),
      signal: options.signal || AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(`OpenAI HTTP ${res.status}: ${text}`, { code: "HTTP_ERROR", provider: this.id, status: res.status });
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async *streamMessage(messages, options = {}) {
    if (!this.apiKey) throw new ProviderError("OpenAI API key não configurada", { code: "NO_KEY", provider: this.id, retryable: false });

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      }),
      signal: options.signal || AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(`OpenAI HTTP ${res.status}: ${text}`, { code: "HTTP_ERROR", provider: this.id, status: res.status });
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
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) yield content;
        } catch {}
      }
    }
  }

  async healthCheck() {
    if (!this.apiKey) return false;
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
