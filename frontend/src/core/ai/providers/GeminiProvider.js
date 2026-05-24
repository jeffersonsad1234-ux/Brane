import { BaseProvider, ProviderError } from "./BaseProvider";

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-pro", "gemini-1.5-flash"];

export class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "gemini",
      name: "Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      models: config.models || GEMINI_MODELS,
      defaultModel: "gemini-2.0-flash",
      requiresKey: true,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    if (!this.apiKey) throw new ProviderError("Gemini API key não configurada", { code: "NO_KEY", provider: this.id, retryable: false });

    const model = options.model || this.defaultModel;
    const contents = this._toGeminiMessages(messages);
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2048,
        },
      }),
      signal: options.signal || AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(`Gemini HTTP ${res.status}: ${text}`, { code: "HTTP_ERROR", provider: this.id, status: res.status });
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  }

  async *streamMessage(messages, options = {}) {
    if (!this.apiKey) throw new ProviderError("Gemini API key não configurada", { code: "NO_KEY", provider: this.id, retryable: false });

    const model = options.model || this.defaultModel;
    const contents = this._toGeminiMessages(messages);
    const url = `${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
        },
      }),
      signal: options.signal || AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(`Gemini HTTP ${res.status}: ${text}`, { code: "HTTP_ERROR", provider: this.id, status: res.status });
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
        if (!trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.slice(6);
        if (!jsonStr || jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const parts = parsed.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.text) yield part.text;
          }
        } catch {}
      }
    }
  }

  _toGeminiMessages(messages) {
    const contents = [];
    let currentRole = null;
    let currentParts = [];

    for (const msg of messages) {
      const role = msg.role === "assistant" ? "model" : "user";
      if (role !== currentRole && currentParts.length > 0) {
        contents.push({ role: currentRole, parts: currentParts });
        currentParts = [];
      }
      currentRole = role;
      currentParts.push({ text: msg.content });
    }
    if (currentParts.length > 0) {
      contents.push({ role: currentRole, parts: currentParts });
    }
    return contents;
  }

  async healthCheck() {
    if (!this.apiKey) return false;
    try {
      const model = "gemini-2.0-flash";
      const res = await fetch(`${this.baseUrl}/models/${model}?key=${this.apiKey}`, {
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
