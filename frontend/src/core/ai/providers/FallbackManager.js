import { PROVIDER_PRIORITY, getProvider } from "./ProviderFactory";

const DEMO_ID = "branpy-demo";

export class FallbackManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 1;
    this.timeout = options.timeout ?? 15000;
    this.fallbackHistory = [];
  }

  getFriendlyError(providerId, originalError) {
    const map = {
      opencode: "OpenCode local não está respondendo",
      openrouter: "OpenRouter precisa de uma API key",
      deepseek: "DeepSeek precisa de uma API key",
      qwen: "Qwen (Alibaba) precisa de uma API key",
      llama: "Llama local não está respondendo",
      local: "Ollama local não está respondendo",
    };
    return map[providerId] || (originalError ? originalError.message : "Provider temporariamente indisponível");
  }

  async execute(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;
    if (!providerOrder || !providerOrder.length) {
      return await this._demoFallback(messages, options, null, "sendMessage");
    }

    for (const providerId of providerOrder) {
      let provider;
      try { provider = getProvider(providerId); } catch { continue; }
      if (!provider || !provider.isAvailable()) { this.recordFallback(providerId, "unavailable"); continue; }

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        let timer = null;
        try {
          const controller = new AbortController();
          timer = setTimeout(() => { try { controller.abort(); } catch {} }, this.timeout);
          const result = await provider.sendMessage(messages, { ...options, signal: controller.signal });
          clearTimeout(timer);
          this.recordFallback(providerId, "success", { attempt });
          return { content: result || "", provider: providerId, model: options.model || (provider.defaultModel || "") };
        } catch (err) {
          if (timer) clearTimeout(timer);
          if (err && err.retryable === false) break;
          this.recordFallback(providerId, "error", { error: err ? err.message : "Unknown", attempt });
        }
      }
    }

    return await this._demoFallback(messages, options, null, "sendMessage");
  }

  async *executeStream(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;

    if (providerOrder && providerOrder.length) {
      for (const providerId of providerOrder) {
        let provider;
        try { provider = getProvider(providerId); } catch { continue; }
        if (!provider || !provider.isAvailable()) { this.recordFallback(providerId, "unavailable"); continue; }

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
          try {
            const stream = provider.streamMessage(messages, options);
            if (!stream || typeof stream[Symbol.asyncIterator] !== "function") {
              throw new Error("Provider returned non-iterable stream");
            }
            let yielded = false;
            for await (const chunk of stream) {
              if (chunk === null || chunk === undefined) continue;
              yielded = true;
              yield { content: typeof chunk === "string" ? chunk : "", provider: providerId, done: false };
            }
            if (!yielded) throw new Error("Empty stream");
            this.recordFallback(providerId, "success", { attempt });
            yield { content: "", provider: providerId, done: true };
            return;
          } catch (err) {
            this.recordFallback(providerId, "error", { error: err ? err.message : "Unknown", attempt });
            if (err && err.retryable === false) break;
          }
        }
      }
    }

    // Fallback to demo
    try {
      const demoProvider = this._getDemoProvider();
      if (demoProvider) {
        const stream = demoProvider.streamMessage(messages, options);
        if (stream && typeof stream[Symbol.asyncIterator] === "function") {
          let yielded = false;
          for await (const chunk of stream) {
            if (chunk === null || chunk === undefined) continue;
            yielded = true;
            yield { content: typeof chunk === "string" ? chunk : "", provider: DEMO_ID, done: false };
          }
          if (yielded) {
            this.recordFallback(DEMO_ID, "success", { note: "last-resort-stream" });
            yield { content: "", provider: DEMO_ID, done: true };
            return;
          }
        }
        // Fallback to sendMessage if stream fails
        const fallback = await demoProvider.sendMessage(messages, options);
        if (fallback) {
          yield { content: fallback, provider: DEMO_ID, done: false };
          yield { content: "", provider: DEMO_ID, done: true };
          return;
        }
      }
    } catch { /* ignore demo fallback errors */ }

    yield { content: "", provider: DEMO_ID, done: true };
  }

  async _demoFallback(messages, options, lastError, mode) {
    try {
      const demoProvider = this._getDemoProvider();
      if (!demoProvider) {
        return { content: "", provider: DEMO_ID, model: "branpy-demo" };
      }
      const result = await demoProvider.sendMessage(messages, options);
      this.recordFallback(DEMO_ID, "success", { note: "last-resort-" + mode });
      return { content: result || "", provider: DEMO_ID, model: "branpy-demo" };
    } catch {
      return { content: "", provider: DEMO_ID, model: "branpy-demo" };
    }
  }

  _getDemoProvider() {
    try { const p = getProvider(DEMO_ID); return p && p.isAvailable() ? p : null; } catch { return null; }
  }

  recordFallback(providerId, status, details = {}) {
    try { this.fallbackHistory.push({ provider: providerId, status, timestamp: Date.now(), ...details }); } catch { /* ignore */ }
  }

  getFallbackHistory() { try { return this.fallbackHistory || []; } catch { return []; } }
  reset() { try { this.fallbackHistory = []; } catch {} }
}

export const fallbackManager = new FallbackManager();
