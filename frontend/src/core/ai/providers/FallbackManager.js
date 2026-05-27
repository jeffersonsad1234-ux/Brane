import { PROVIDER_PRIORITY, getProvider } from "./ProviderFactory";

export class FallbackManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 1;
    this.timeout = options.timeout ?? 30000;
    this.fallbackHistory = [];
  }

  async execute(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;
    if (!providerOrder || !providerOrder.length) {
      throw new Error("Nenhum provider disponível");
    }

    for (const providerId of providerOrder) {
      let provider;
      try { provider = getProvider(providerId); } catch { continue; }
      if (!provider || !provider.isAvailable()) { continue; }

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        let timer = null;
        try {
          const controller = new AbortController();
          timer = setTimeout(() => { try { controller.abort(); } catch {} }, this.timeout);
          const result = await provider.sendMessage(messages, { ...options, signal: controller.signal });
          clearTimeout(timer);
          return { content: result || "", provider: providerId, model: options.model || (provider.defaultModel || "") };
        } catch (err) {
          if (timer) clearTimeout(timer);
          if (err && err.retryable === false) break;
        }
      }
    }

    throw new Error("Nenhum provider conseguiu processar a requisição");
  }

  async *executeStream(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;

    if (providerOrder && providerOrder.length) {
      for (const providerId of providerOrder) {
        let provider;
        try { provider = getProvider(providerId); } catch { continue; }
        if (!provider || !provider.isAvailable()) { continue; }

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
            yield { content: "", provider: providerId, done: true };
            return;
          } catch (err) {
            if (err && err.retryable === false) break;
          }
        }
      }
    }

    yield { content: "", provider: "", done: true, error: "Nenhum provider disponível" };
  }

  getFallbackHistory() { try { return this.fallbackHistory || []; } catch { return []; } }
  reset() { try { this.fallbackHistory = []; } catch {} }
}

export const fallbackManager = new FallbackManager();
