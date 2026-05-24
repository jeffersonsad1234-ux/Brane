import { PROVIDER_PRIORITY, getProvider } from "./ProviderFactory";

const FRIENDLY_MAP = {
  opencode: "OpenCode local não está respondendo",
  openrouter: "OpenRouter precisa de uma API key",
  deepseek: "DeepSeek precisa de uma API key",
  qwen: "Qwen (Alibaba) precisa de uma API key",
  llama: "Llama local não está respondendo",
  local: "Ollama local não está respondendo",
};

const DEMO_ID = "branpy-demo";

export class FallbackManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 2;
    this.timeout = options.timeout ?? 15000;
    this.fallbackHistory = [];
  }

  getFriendlyError(providerId, originalError) {
    return FRIENDLY_MAP[providerId] || originalError?.message || "Provider temporariamente indisponível";
  }

  async execute(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;
    let lastError = null;

    for (const providerId of providerOrder) {
      let provider;
      try { provider = getProvider(providerId); } catch { continue; }
      if (!provider.isAvailable()) { this.recordFallback(providerId, "unavailable"); continue; }

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), this.timeout);
          const result = await provider.sendMessage(messages, { ...options, signal: controller.signal });
          clearTimeout(timer);
          this.recordFallback(providerId, "success", { attempt });
          return { content: result, provider: providerId, model: options.model || provider.defaultModel };
        } catch (err) {
          lastError = err;
          if (err.retryable === false) break;
          this.recordFallback(providerId, "error", { error: err.message, attempt });
        }
      }
    }

    // LAST RESORT: BRANPY Local Demo
    return await this._demoFallback(messages, options, lastError, "sendMessage");
  }

  async *executeStream(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;
    let lastError = null;

    for (const providerId of providerOrder) {
      let provider;
      try { provider = getProvider(providerId); } catch { continue; }
      if (!provider.isAvailable()) { this.recordFallback(providerId, "unavailable"); continue; }

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const stream = provider.streamMessage(messages, options);
          let yielded = false;
          for await (const chunk of stream) {
            yielded = true;
            yield { content: chunk, provider: providerId, done: false };
          }
          if (!yielded) throw new Error("Stream vazio");
          this.recordFallback(providerId, "success", { attempt });
          yield { content: "", provider: providerId, done: true };
          return;
        } catch (err) {
          lastError = err;
          this.recordFallback(providerId, "error", { error: err.message, attempt });
          if (err.retryable === false) break;
        }
      }
    }

    // LAST RESORT: BRANPY Local Demo
    const demoProvider = this._getDemoProvider();
    if (demoProvider) {
      console.log("[BRANPY LOCAL DEMO ACTIVE] All providers failed stream — using local demo");
      try {
        const stream = demoProvider.streamMessage(messages, options);
        let yielded = false;
        for await (const chunk of stream) {
          yielded = true;
          yield { content: chunk, provider: DEMO_ID, done: false };
        }
        if (yielded) {
          this.recordFallback(DEMO_ID, "success", { note: "last-resort-stream" });
          yield { content: "", provider: DEMO_ID, done: true };
          return;
        }
      } catch (demoErr) { /* ignore */ }

      // If stream failed or yielded nothing, use sendMessage
      try {
        const fallback = await demoProvider.sendMessage(messages, options);
        yield { content: fallback, provider: DEMO_ID, done: false };
        yield { content: "", provider: DEMO_ID, done: true };
        return;
      } catch (demoErr2) { /* ignore */ }
    }

    // Absolute last resort — inline response
    yield { content: "Olá! Estou em modo de demonstração local. Como posso ajudar?", provider: DEMO_ID, done: false };
    yield { content: "", provider: DEMO_ID, done: true };
  }

  async _demoFallback(messages, options, lastError, mode) {
    const demoProvider = this._getDemoProvider();
    if (!demoProvider) {
      throw new Error(lastError ? this.getFriendlyError(lastError.provider, lastError) : "Nenhum provider disponível");
    }

    console.log("[BRANPY LOCAL DEMO ACTIVE] All providers failed " + mode + " — using local demo");
    try {
      const result = await demoProvider.sendMessage(messages, options);
      this.recordFallback(DEMO_ID, "success", { note: "last-resort-" + mode });
      return { content: result, provider: DEMO_ID, model: "branpy-demo" };
    } catch (demoErr) {
      throw new Error("Erro inesperado no modo demonstração: " + demoErr.message);
    }
  }

  _getDemoProvider() {
    try {
      const p = getProvider(DEMO_ID);
      return p.isAvailable() ? p : null;
    } catch { return null; }
  }

  recordFallback(providerId, status, details = {}) {
    this.fallbackHistory.push({ provider: providerId, status, timestamp: Date.now(), ...details });
  }

  getFallbackHistory() { return this.fallbackHistory; }
  reset() { this.fallbackHistory = []; }
}

export const fallbackManager = new FallbackManager();
