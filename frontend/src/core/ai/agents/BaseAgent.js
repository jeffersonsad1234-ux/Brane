const UID = () => Math.random().toString(36).slice(2, 9);

export class BaseAgent {
  constructor(config = {}) {
    this.id = config.id || UID();
    this.name = config.name || "Agent";
    this.description = config.description || "";
    this.avatar = config.avatar || "🤖";
    this.category = config.category || "general";
    this.systemPrompt = config.systemPrompt || "You are a helpful AI assistant.";
    this.tools = config.tools || [];
    this.defaultModel = config.defaultModel || "";
    this.defaultProvider = config.defaultProvider || "opencode";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 2048;
    this.color = config.color || "#3b82f6";
    this.capabilities = config.capabilities || ["chat"];
  }

  getSystemMessage() {
    return this.systemPrompt;
  }

  getConfig() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      avatar: this.avatar,
      category: this.category,
      tools: this.tools.map((t) => t.name || t),
      defaultModel: this.defaultModel,
      defaultProvider: this.defaultProvider,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      color: this.color,
      capabilities: this.capabilities,
    };
  }
}
