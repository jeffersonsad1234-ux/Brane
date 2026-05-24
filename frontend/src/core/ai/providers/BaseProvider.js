const UID = () => Math.random().toString(36).slice(2, 9);

export class ProviderError extends Error {
  constructor(message, { code, status, provider, retryable = true } = {}) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.status = status;
    this.provider = provider;
    this.retryable = retryable;
  }
}

export class BaseProvider {
  constructor(config = {}) {
    this.id = config.id || UID();
    this.name = config.name || "Base Provider";
    this.models = config.models || [];
    this.defaultModel = config.defaultModel || "";
    this.apiKey = config.apiKey || "";
    this.baseUrl = config.baseUrl || "";
    this.config = config;
    this.healthy = true;
    this.lastHealthCheck = null;
  }

  async sendMessage(messages, options = {}) {
    throw new ProviderError("sendMessage not implemented", {
      code: "NOT_IMPLEMENTED", provider: this.id, retryable: false,
    });
  }

  async *streamMessage(messages, options = {}) {
    throw new ProviderError("streamMessage not implemented", {
      code: "NOT_IMPLEMENTED", provider: this.id, retryable: false,
    });
  }

  async healthCheck() {
    throw new ProviderError("healthCheck not implemented", {
      code: "NOT_IMPLEMENTED", provider: this.id, retryable: false,
    });
  }

  async listModels() {
    return this.models;
  }

  getDefaultModel() {
    return this.defaultModel;
  }

  getName() {
    return this.name;
  }

  getId() {
    return this.id;
  }

  isAvailable() {
    return this.healthy && !!this.apiKey;
  }
}
