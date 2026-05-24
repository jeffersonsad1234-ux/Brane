export class BaseExecutionTool {
  constructor(config = {}) {
    this.name = config.name || "BaseTool";
    this.description = config.description || "";
  }

  async execute(context) {
    throw new Error(`${this.name}.execute() not implemented`);
  }

  async _callProvider(context, systemPrompt, userMessage, options = {}) {
    const provider = (await import("../../providers/ProviderFactory")).getProvider(context.provider);
    if (!provider || !provider.isAvailable()) {
      return this._fallback(context, systemPrompt, userMessage);
    }
    return provider.sendMessage([
      { role: "system", content: systemPrompt },
      ...context.history.slice(-6),
      { role: "user", content: userMessage },
    ], { model: context.model, ...options });
  }

  async _callProviderStream(context, systemPrompt, userMessage, options = {}) {
    const provider = (await import("../../providers/ProviderFactory")).getProvider(context.provider);
    if (!provider || !provider.isAvailable()) return null;
    return provider.streamMessage([
      { role: "system", content: systemPrompt },
      ...context.history.slice(-6),
      { role: "user", content: userMessage },
    ], { model: context.model, ...options });
  }

  _fallback(context, systemPrompt, userMessage) {
    return "";
  }
}
