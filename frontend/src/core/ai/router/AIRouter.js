import { fallbackManager } from "../providers/FallbackManager";
import { getProvider, PROVIDER_PRIORITY } from "../providers/ProviderFactory";
import { AIMemory } from "../memory/AIMemory";
import { ToolExecutionEngine } from "../execution/ToolExecutionEngine";
import { toolResolver } from "../execution/ToolResolver";
import { intentEngine } from "../utils/IntentEngine";

const UID = () => Math.random().toString(36).slice(2, 9);
const MAX_CHUNK_SIZE = 50000;

export class AIRouter {
  constructor(config = {}) {
    this.id = config.id || UID();
    this.name = config.name || "BRANPY AI Router";
    this.memory = config.memory || new AIMemory();
    this.fallbackManager = config.fallbackManager || fallbackManager;
    this.defaultProvider = config.defaultProvider || "groq";
    this.defaultModel = config.defaultModel || "";
    this.maxContextMessages = config.maxContextMessages ?? 50;
    this.sessionId = config.sessionId || `session_${UID()}`;
    this.middleware = [];
    this.toolEngine = new ToolExecutionEngine({ onStatus: config.onToolStatus || null });
    this.onToolStatus = config.onToolStatus || null;
  }

  use(middlewareFn) {
    if (typeof middlewareFn === "function") this.middleware.push(middlewareFn);
  }

  setToolStatusHandler(handler) {
    this.onToolStatus = handler;
    this.toolEngine.onStatus = handler;
  }

  async chat(message, options = {}) {
    try {
      const sessionId = options.sessionId || this.sessionId;
      const agent = options.agent || null;
      const providerId = options.provider || this.defaultProvider;
      const model = options.model || this.defaultModel;
      const msg = (message || "").slice(0, MAX_CHUNK_SIZE);

      try { await this.memory.addMessage(sessionId, { role: "user", content: msg, agent: agent?.id || null }); } catch { /* memory fail */ }

      const intent = intentEngine ? intentEngine.classify(msg) : { id: "general", label: "Geral" };
      const hasTools = toolResolver ? toolResolver.hasTools(intent.id) : false;

      if (hasTools) {
        try {
          const toolResult = await this.toolEngine.execute(msg, { agent, provider: providerId, model, sessionId, intent });
          if (toolResult && toolResult.content) {
            try { await this.memory.addMessage(sessionId, { role: "assistant", content: toolResult.content, agent: agent?.id || null, provider: toolResult.provider, model }); } catch { /* memory fail */ }
            return { content: toolResult.content, provider: toolResult.provider, model, sessionId, intent: toolResult.intent, executed: true };
          }
        } catch { /* fall through to provider chat */ }
      }

      let messages = [];
      if (agent) {
        try {
          const systemMsg = agent.getSystemMessage ? agent.getSystemMessage() : "";
          if (systemMsg) messages.push({ role: "system", content: systemMsg });
          const agentContext = await this.memory.getAgentContext(agent.id, sessionId);
          if (agentContext && agentContext.length) messages.push(...agentContext);
        } catch { /* agent context fail */ }
      }

      try {
        const history = await this.memory.getConversation(sessionId);
        const recentHistory = (history || []).slice(-this.maxContextMessages);
        for (const ctx of recentHistory) {
          if (!ctx) continue;
          if (ctx.role === "system") continue;
          messages.push({ role: ctx.role, content: (ctx.content || "").slice(0, MAX_CHUNK_SIZE) });
        }
      } catch { /* history fail */ }
      messages.push({ role: "user", content: msg });

      for (const mw of this.middleware) {
        try { const r = mw(messages, { sessionId, agent, providerId, model }); if (r) messages = r; } catch { /* middleware fail */ }
      }

      const result = await this.fallbackManager.execute(messages, { ...options, model: model || undefined, providerPriority: options.providerPriority || PROVIDER_PRIORITY });

      if (result && result.content) {
        try { await this.memory.addMessage(sessionId, { role: "assistant", content: result.content, agent: agent?.id || null, provider: result.provider, model: result.model }); } catch { /* memory fail */ }
      }

      return { content: (result && result.content) || "", provider: result ? result.provider : "", model: result ? result.model : "", sessionId };
    } catch (err) {
      return { content: "", provider: options.provider || this.defaultProvider, model: options.model || this.defaultModel, sessionId: options.sessionId || this.sessionId, error: err ? err.message : "Unknown error" };
    }
  }

  async *chatStream(message, options = {}) {
    const sessionId = options.sessionId || this.sessionId;
    const agent = options.agent || null;
    const providerId = options.provider || this.defaultProvider;
    const model = options.model || this.defaultModel;
    const msg = (message || "").slice(0, MAX_CHUNK_SIZE);

    try { await this.memory.addMessage(sessionId, { role: "user", content: msg, agent: agent?.id || null }); } catch { /* memory fail */ }

    const intent = intentEngine ? intentEngine.classify(msg) : { id: "general", label: "Geral" };
    const hasTools = toolResolver ? toolResolver.hasTools(intent.id) : false;

    if (hasTools) {
      try {
        const toolResult = await this.toolEngine.execute(msg, { agent, provider: providerId, model, sessionId, intent });
        if (toolResult && toolResult.content) {
          const content = toolResult.content.slice(0, MAX_CHUNK_SIZE);
          const chars = content.split("");
          for (let i = 0; i < chars.length; i += 3) {
            yield { content: chars.slice(i, i + 3).join(""), done: false, provider: toolResult.provider, sessionId };
            if ((i / 3) % 10 === 0) await new Promise((r) => setTimeout(r, 5));
          }
          try { await this.memory.addMessage(sessionId, { role: "assistant", content, agent: agent?.id || null, provider: toolResult.provider, model }); } catch { /* memory fail */ }
          yield { content: "", done: true, provider: toolResult.provider, sessionId, intent: toolResult.intent, executed: true };
          return;
        }
      } catch { /* fall through */ }
    }

    // Fallback to provider streaming
    let messages = [];
    if (agent) {
      try {
        const systemMsg = agent.getSystemMessage ? agent.getSystemMessage() : "";
        if (systemMsg) messages.push({ role: "system", content: systemMsg });
        const agentContext = await this.memory.getAgentContext(agent.id, sessionId);
        if (agentContext && agentContext.length) messages.push(...agentContext);
      } catch { /* agent context fail */ }
    }

    try {
      const history = await this.memory.getConversation(sessionId);
      const recentHistory = (history || []).slice(-this.maxContextMessages);
      for (const ctx of recentHistory) {
        if (!ctx || ctx.role === "system") continue;
        messages.push({ role: ctx.role, content: (ctx.content || "").slice(0, MAX_CHUNK_SIZE) });
      }
    } catch { /* history fail */ }
    messages.push({ role: "user", content: msg });

    for (const mw of this.middleware) {
      try { const r = mw(messages, { sessionId, agent, providerId, model }); if (r) messages = r; } catch { /* middleware fail */ }
    }

    let fullContent = "";
    let responseProvider = "";

    try {
      const stream = this.fallbackManager.executeStream(messages, { ...options, model: model || undefined, providerPriority: options.providerPriority || PROVIDER_PRIORITY });
      for await (const chunk of stream) {
        if (!chunk) continue;
        if (chunk.done) {
          if (chunk.error) break;
          break;
        }
        fullContent += (chunk.content || "");
        responseProvider = chunk.provider || responseProvider;
        yield { content: chunk.content || "", done: false, provider: chunk.provider, sessionId };
        if (fullContent.length > MAX_CHUNK_SIZE) break;
      }
    } catch { /* stream fail */ }

    if (fullContent) {
      try { await this.memory.addMessage(sessionId, { role: "assistant", content: fullContent.slice(0, MAX_CHUNK_SIZE), agent: agent?.id || null, provider: responseProvider, model }); } catch { /* memory fail */ }
    }

    yield { content: "", done: true, provider: responseProvider, sessionId };
  }

  async getHistory(sessionId) {
    try { return await this.memory.getConversation(sessionId || this.sessionId); } catch { return []; }
  }

  async clearHistory(sessionId) {
    try { return await this.memory.clearConversation(sessionId || this.sessionId); } catch { return; }
  }

  async getSessions() {
    try { return await this.memory.listSessions(); } catch { return []; }
  }

  setSession(sessionId) {
    if (sessionId) this.sessionId = sessionId;
  }

  getProviderStatus() {
    try {
      return PROVIDER_PRIORITY.map((id) => {
        try { const p = getProvider(id); return { id, name: p.getName ? p.getName() : id, healthy: p.healthy, available: p.isAvailable ? p.isAvailable() : false }; }
        catch { return { id, name: id, healthy: false, available: false }; }
      });
    } catch { return []; }
  }
}

export const aiRouter = new AIRouter();
