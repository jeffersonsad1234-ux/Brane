import { fallbackManager } from "../providers/FallbackManager";
import { getProvider, PROVIDER_PRIORITY } from "../providers/ProviderFactory";
import { AIMemory } from "../memory/AIMemory";
import { ToolExecutionEngine } from "../execution/ToolExecutionEngine";
import { toolResolver } from "../execution/ToolResolver";
import { intentEngine } from "../utils/IntentEngine";

const UID = () => Math.random().toString(36).slice(2, 9);

export class AIRouter {
  constructor(config = {}) {
    this.id = config.id || UID();
    this.name = config.name || "BRANPY AI Router";
    this.memory = config.memory || new AIMemory();
    this.fallbackManager = config.fallbackManager || fallbackManager;
    this.defaultProvider = config.defaultProvider || "opencode";
    this.defaultModel = config.defaultModel || "";
    this.maxContextMessages = config.maxContextMessages ?? 50;
    this.sessionId = config.sessionId || `session_${UID()}`;
    this.middleware = [];
    this.toolEngine = new ToolExecutionEngine({ onStatus: config.onToolStatus || null });
    this.onToolStatus = config.onToolStatus || null;
  }

  use(middlewareFn) {
    this.middleware.push(middlewareFn);
  }

  setToolStatusHandler(handler) {
    this.onToolStatus = handler;
    this.toolEngine.onStatus = handler;
  }

  async chat(message, options = {}) {
    const sessionId = options.sessionId || this.sessionId;
    const agent = options.agent || null;
    const providerId = options.provider || this.defaultProvider;
    const model = options.model || this.defaultModel;

    await this.memory.addMessage(sessionId, { role: "user", content: message, agent: agent?.id || null });

    // Try tool execution first
    const intent = intentEngine.classify(message);
    const hasTools = toolResolver.hasTools(intent.id);

    if (hasTools) {
      try {
        const toolResult = await this.toolEngine.execute(message, {
          agent,
          provider: providerId,
          model,
          sessionId,
          intent,
        });

        if (toolResult.content) {
          await this.memory.addMessage(sessionId, {
            role: "assistant", content: toolResult.content,
            agent: agent?.id || null, provider: toolResult.provider, model,
          });
          return { content: toolResult.content, provider: toolResult.provider, model, sessionId, intent: toolResult.intent, executed: true };
        }
      } catch { /* fall through to provider */ }
    }

    // Fallback to provider chat
    let messages = [];
    if (agent) {
      const systemMsg = agent.getSystemMessage?.() || "";
      if (systemMsg) messages.push({ role: "system", content: systemMsg });
      const agentContext = await this.memory.getAgentContext(agent.id, sessionId);
      if (agentContext?.length) messages.push(...agentContext);
    }

    const history = await this.memory.getConversation(sessionId);
    const recentHistory = history.slice(-this.maxContextMessages);
    for (const ctx of recentHistory) {
      if (ctx.role === "system") continue;
      messages.push({ role: ctx.role, content: ctx.content });
    }
    messages.push({ role: "user", content: message });

    for (const mw of this.middleware) {
      messages = mw(messages, { sessionId, agent, providerId, model }) || messages;
    }

    const optionsWithDefaults = {
      ...options,
      model: model || undefined,
      providerPriority: options.providerPriority || PROVIDER_PRIORITY,
    };

    let result;
    try {
      result = await this.fallbackManager.execute(messages, optionsWithDefaults);
    } catch (err) {
      await this.memory.addMessage(sessionId, {
        role: "assistant", content: `[Error: ${err.message}]`,
        agent: agent?.id || null, error: true,
      });
      throw err;
    }

    await this.memory.addMessage(sessionId, {
      role: "assistant", content: result.content,
      agent: agent?.id || null, provider: result.provider, model: result.model,
    });

    return {
      content: result.content,
      provider: result.provider,
      model: result.model,
      sessionId,
    };
  }

  async *chatStream(message, options = {}) {
    const sessionId = options.sessionId || this.sessionId;
    const agent = options.agent || null;
    const providerId = options.provider || this.defaultProvider;
    const model = options.model || this.defaultModel;

    await this.memory.addMessage(sessionId, { role: "user", content: message, agent: agent?.id || null });

    // Try tool execution first
    const intent = intentEngine.classify(message);
    const hasTools = toolResolver.hasTools(intent.id);

    if (hasTools) {
      try {
        const toolResult = await this.toolEngine.execute(message, {
          agent,
          provider: providerId,
          model,
          sessionId,
          intent,
        });

        if (toolResult.content) {
          // Stream the composed response character by character
          const chars = toolResult.content.split("");
          for (let i = 0; i < chars.length; i += 3) {
            yield { content: chars.slice(i, i + 3).join(""), done: false, provider: toolResult.provider, sessionId };
            if ((i / 3) % 10 === 0) await new Promise((r) => setTimeout(r, 5));
          }

          await this.memory.addMessage(sessionId, {
            role: "assistant", content: toolResult.content,
            agent: agent?.id || null, provider: toolResult.provider, model,
          });

          yield { content: "", done: true, provider: toolResult.provider, sessionId, intent: toolResult.intent, executed: true };
          return;
        }
      } catch { /* fall through to streaming provider */ }
    }

    // Fallback to provider streaming
    let messages = [];
    if (agent) {
      const systemMsg = agent.getSystemMessage?.() || "";
      if (systemMsg) messages.push({ role: "system", content: systemMsg });
      const agentContext = await this.memory.getAgentContext(agent.id, sessionId);
      if (agentContext?.length) messages.push(...agentContext);
    }

    const history = await this.memory.getConversation(sessionId);
    const recentHistory = history.slice(-this.maxContextMessages);
    for (const ctx of recentHistory) {
      if (ctx.role === "system") continue;
      messages.push({ role: ctx.role, content: ctx.content });
    }
    messages.push({ role: "user", content: message });

    for (const mw of this.middleware) {
      messages = mw(messages, { sessionId, agent, providerId, model }) || messages;
    }

    const streamOptions = {
      ...options,
      model: model || undefined,
      providerPriority: options.providerPriority || PROVIDER_PRIORITY,
    };

    let fullContent = "";
    let responseProvider = "";
    let responseModel = "";

    try {
      const stream = this.fallbackManager.executeStream(messages, streamOptions);
      for await (const chunk of stream) {
        if (chunk.done) {
          if (chunk.error) {
            throw new Error(chunk.error);
          }
          break;
        }
        fullContent += chunk.content;
        responseProvider = chunk.provider || responseProvider;
        yield { content: chunk.content, done: false, provider: chunk.provider, sessionId };
      }
      responseModel = model || (agent ? agent.defaultModel : "");
    } catch (err) {
      yield { content: "", done: true, error: err.message, sessionId };
      return;
    }

    if (fullContent) {
      await this.memory.addMessage(sessionId, {
        role: "assistant", content: fullContent,
        agent: agent?.id || null, provider: responseProvider, model: responseModel,
      });
    }

    yield { content: "", done: true, provider: responseProvider, sessionId };
  }

  async getHistory(sessionId) {
    return this.memory.getConversation(sessionId || this.sessionId);
  }

  async clearHistory(sessionId) {
    return this.memory.clearConversation(sessionId || this.sessionId);
  }

  async getSessions() {
    return this.memory.listSessions();
  }

  setSession(sessionId) {
    this.sessionId = sessionId;
  }

  getProviderStatus() {
    return PROVIDER_PRIORITY.map((id) => {
      try {
        const p = getProvider(id);
        return { id, name: p.getName(), healthy: p.healthy, available: p.isAvailable() };
      } catch {
        return { id, name: id, healthy: false, available: false };
      }
    });
  }
}

export const aiRouter = new AIRouter();
