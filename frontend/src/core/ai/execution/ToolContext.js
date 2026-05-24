import { intentEngine } from "../utils/IntentEngine";
import { getAgent } from "../agents/AgentRegistry";
import { browserEngine } from "../browser/BrowserEngine";
import { aiMemory } from "../memory/AIMemory";

export class ToolContext {
  constructor(options = {}) {
    this.userMessage = options.userMessage || "";
    this.intent = options.intent || intentEngine.classify(options.userMessage || "");
    this.agentId = options.agentId || intentEngine.getAgentForIntent(this.intent.id);
    this.agent = options.agent || getAgent(this.agentId) || null;
    this.provider = options.provider || "branpy-demo";
    this.model = options.model || "";
    this.sessionId = options.sessionId || "";
    this.memory = options.memory || aiMemory;
    this.browser = options.browser || browserEngine;
    this.history = [];
    this.signal = options.signal || null;
    this.metadata = {};
  }

  setHistory(messages) {
    this.history = messages;
  }

  isAborted() {
    return this.signal?.aborted || false;
  }

  toJSON() {
    return {
      intent: this.intent,
      agentId: this.agentId,
      provider: this.provider,
      model: this.model,
      sessionId: this.sessionId,
    };
  }
}
