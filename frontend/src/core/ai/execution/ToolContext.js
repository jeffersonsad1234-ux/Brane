import { intentEngine } from "../utils/IntentEngine";
import { getAgent } from "../agents/AgentRegistry";
import { browserEngine } from "../browser/BrowserEngine";
import { aiMemory } from "../memory/AIMemory";

export class ToolContext {
  constructor(options = {}) {
    try {
      this.userMessage = options.userMessage || "";
      this.intent = options.intent || (intentEngine ? intentEngine.classify(this.userMessage) : { id: "general", label: "Geral" });
      this.agentId = options.agentId || (intentEngine ? intentEngine.getAgentForIntent(this.intent.id) : "branpy-core");
      this.agent = options.agent || (typeof getAgent === "function" ? getAgent(this.agentId) : null) || null;
    } catch {
      this.userMessage = options.userMessage || "";
      this.intent = { id: "general", label: "Geral" };
      this.agentId = "branpy-core";
      this.agent = null;
    }
    this.provider = options.provider || "branpy-demo";
    this.model = options.model || "";
    this.sessionId = options.sessionId || "";
    try { this.memory = options.memory || aiMemory; } catch { this.memory = null; }
    try { this.browser = options.browser || browserEngine; } catch { this.browser = null; }
    this.history = [];
    this.signal = options.signal || null;
    this.metadata = {};
  }

  setHistory(messages) {
    try { this.history = Array.isArray(messages) ? messages : []; } catch { this.history = []; }
  }

  isAborted() {
    try { return this.signal ? this.signal.aborted : false; } catch { return false; }
  }

  toJSON() {
    try {
      return {
        intent: this.intent,
        agentId: this.agentId,
        provider: this.provider,
        model: this.model,
        sessionId: this.sessionId,
      };
    } catch { return {}; }
  }
}
