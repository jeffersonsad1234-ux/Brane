import { BaseProvider, ProviderError } from "./BaseProvider";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
];

export class GroqProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "groq",
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: config.apiKey || localStorage.getItem("groq_api_key") || process.env.REACT_APP_GROQ_API_KEY || "",
      models: config.models || GROQ_MODELS,
      defaultModel: config.defaultModel || "llama-3.3-70b-versatile",
      requiresKey: true,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey) throw new ProviderError("Groq API key não configurada", { code: "NO_KEY", provider: this.id, retryable: false });

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
      throw new ProviderError(`Groq HTTP ${res.status}: ${text}`, { code: "HTTP_ERROR", provider: this.id, status: res.status });
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async *streamMessage(messages, options = {}) {
    if (!this.apiKey) throw new ProviderError("Groq API key não configurada", { code: "NO_KEY", provider: this.id, retryable: false });

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
      throw new ProviderError(`Groq HTTP ${res.status}: ${text}`, { code: "HTTP_ERROR", provider: this.id, status: res.status });
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
