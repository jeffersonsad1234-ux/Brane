import { PROVIDER_PRIORITY, getProvider } from "./ProviderFactory";

export class FallbackManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 2;
    this.timeout = options.timeout ?? 15000;
    this.fallbackHistory = [];
    this.currentProviderIndex = 0;
  }

  async execute(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;
    let lastError = null;

    for (let i = this.currentProviderIndex; i < providerOrder.length; i++) {
      const providerId = providerOrder[i];
      const provider = getProvider(providerId);

      let available = provider.isAvailable();

      if (!available) {
        const healthy = await provider.healthCheck();
        available = provider.isAvailable();
        if (!available) {
          this.recordFallback(providerId, "unavailable");
          continue;
        }
      }

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);

          const result = await provider.sendMessage(messages, {
            ...options,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          this.recordFallback(providerId, "success", { attempt });
          this.currentProviderIndex = i;
          return { content: result, provider: providerId, model: options.model || provider.defaultModel };
        } catch (err) {
          lastError = err;
          if (!err.retryable && err.retryable !== undefined) {
            break;
          }
          this.recordFallback(providerId, "error", { error: err.message, attempt });
        }
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  async *executeStream(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;

    for (let i = this.currentProviderIndex; i < providerOrder.length; i++) {
      const providerId = providerOrder[i];
      const provider = getProvider(providerId);

      let available = provider.isAvailable();
      if (!available) {
        const healthy = await provider.healthCheck();
        available = provider.isAvailable();
        if (!available) {
          this.recordFallback(providerId, "unavailable");
          continue;
        }
      }

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const stream = provider.streamMessage(messages, options);
          let hasYielded = false;

          for await (const chunk of stream) {
            hasYielded = true;
            yield { content: chunk, provider: providerId, done: false };
          }

          this.recordFallback(providerId, "success", { attempt });
          this.currentProviderIndex = i;
          yield { content: "", provider: providerId, done: true };
          return;
        } catch (err) {
          this.recordFallback(providerId, "error", { error: err.message, attempt });
          if (!err.retryable && err.retryable !== undefined) break;
        }
      }
    }

    throw new Error("All providers failed for stream");
  }

  recordFallback(providerId, status, details = {}) {
    this.fallbackHistory.push({
      provider: providerId,
      status,
      timestamp: Date.now(),
      ...details,
    });
  }

  getFallbackHistory() {
    return this.fallbackHistory;
  }

  reset() {
    this.currentProviderIndex = 0;
    this.fallbackHistory = [];
  }
}

export const fallbackManager = new FallbackManager();
