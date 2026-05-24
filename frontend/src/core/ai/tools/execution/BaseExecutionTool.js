export class BaseExecutionTool {
  constructor(config = {}) {
    this.name = config.name || "BaseTool";
    this.description = config.description || "";
  }

  async execute(context) {
    throw new Error(`${this.name}.execute() not implemented`);
  }

  async _callProvider(context, systemPrompt, userMessage, options = {}) {
    try {
      const { getProvider } = await import("../../providers/ProviderFactory");
      const provider = getProvider(context.provider);
      if (!provider || !provider.isAvailable()) {
        throw new Error(`Provider "${context.provider}" não disponível`);
      }
      return await provider.sendMessage([
        { role: "system", content: systemPrompt },
        ...(context.history || []).slice(-6),
        { role: "user", content: userMessage },
      ], { model: context.model, ...options });
    } catch (err) {
      throw new Error(`Falha ao chamar ${context.provider}: ${err.message || "erro desconhecido"}`);
    }
  }

  async _callProviderStream(context, systemPrompt, userMessage, options = {}) {
    try {
      const { getProvider } = await import("../../providers/ProviderFactory");
      const provider = getProvider(context.provider);
      if (!provider || !provider.isAvailable()) return null;
      return provider.streamMessage([
        { role: "system", content: systemPrompt },
        ...(context.history || []).slice(-6),
        { role: "user", content: userMessage },
      ], { model: context.model, ...options });
    } catch {
      return null;
    }
  }
}
