import { PROVIDER_PRIORITY, getProvider } from "./ProviderFactory";

const DEFAULT_FRIENDLY_MSG = "Nenhum provider de IA configurado. Configure uma chave de API em AI Providers ou use o modo demonstração local.";

export class FallbackManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 2;
    this.timeout = options.timeout ?? 15000;
    this.fallbackHistory = [];
    this.currentProviderIndex = 0;
  }

  getFriendlyError(providerId, originalError) {
    const friendly = {
      opencode: "OpenCode local não está respondendo. Verifique se o serviço está rodando.",
      openrouter: "OpenRouter precisa de uma API key configurada em AI Providers.",
      deepseek: "DeepSeek precisa de uma API key configurada em AI Providers.",
      qwen: "Qwen (Alibaba) precisa de uma API key configurada em AI Providers.",
      llama: "Llama local não está respondendo. Verifique se o servidor está rodando.",
      local: "Ollama local não está respondendo. Verifique se o serviço está rodando.",
    };
    return friendly[providerId] || originalError?.message || DEFAULT_FRIENDLY_MSG;
  }

  async execute(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;
    let lastError = null;

    for (let i = this.currentProviderIndex; i < providerOrder.length; i++) {
      const providerId = providerOrder[i];
      const provider = getProvider(providerId);

      if (!provider.isAvailable()) {
        const healthy = await provider.healthCheck();
        if (!provider.isAvailable()) {
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
          if (err.retryable === false) break;
          this.recordFallback(providerId, "error", { error: err.message, attempt });
        }
      }
    }

    const friendlyMsg = lastError ? this.getFriendlyError(lastError.provider, lastError) : DEFAULT_FRIENDLY_MSG;
    throw new Error(friendlyMsg);
  }

  async *executeStream(messages, options = {}) {
    const providerOrder = options.providerPriority || PROVIDER_PRIORITY;
    let lastError = null;

    for (let i = this.currentProviderIndex; i < providerOrder.length; i++) {
      const providerId = providerOrder[i];
      const provider = getProvider(providerId);

      if (!provider.isAvailable()) {
        const healthy = await provider.healthCheck();
        if (!provider.isAvailable()) {
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
          lastError = err;
          this.recordFallback(providerId, "error", { error: err.message, attempt });
          if (err.retryable === false) break;
        }
      }
    }

    const friendlyMsg = lastError ? this.getFriendlyError(lastError.provider, lastError) : DEFAULT_FRIENDLY_MSG;
    throw new Error(friendlyMsg);
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
