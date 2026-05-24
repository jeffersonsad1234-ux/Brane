import { intentEngine } from "../utils/IntentEngine";
import { getAgent } from "../agents/AgentRegistry";
import { getProvider } from "../providers/ProviderFactory";
import { ToolContext } from "./ToolContext";
import { toolResolver } from "./ToolResolver";
import { responseComposer } from "./ResponseComposer";
import { getExecutionTool } from "../tools/execution";

export class ToolExecutionEngine {
  constructor(config = {}) {
    this.timeout = config.timeout ?? 30000;
    this.maxTools = config.maxTools ?? 3;
    this.onStatus = config.onStatus || null;
  }

  async execute(userMessage, options = {}) {
    const context = new ToolContext({
      userMessage,
      agentId: options.agent?.id || options.agentId || "",
      provider: options.provider || "branpy-demo",
      model: options.model || "",
      sessionId: options.sessionId || "",
      signal: options.signal || null,
      intent: options.intent || null,
      agent: options.agent || null,
    });

    const intent = context.intent;
    const tools = toolResolver.resolve(intent.id, options);

    this._emitStatus({ type: "intent", message: `Detectado: ${intent.label}`, intent: intent.id });
    if (tools.length > 0) {
      this._emitStatus({ type: "tools", message: `Executando ${tools.length} ferramenta(s)...`, tools: tools.map((t) => t.name) });
    }

    const results = [];
    for (const toolDef of tools.slice(0, this.maxTools)) {
      if (context.isAborted()) break;

      const ToolClass = await getExecutionTool(toolDef.name);
      if (!ToolClass) {
        results.push({ tool: toolDef.name, success: false, error: `Tool ${toolDef.name} not found` });
        continue;
      }

      this._emitStatus({ type: "tool", message: `▶ ${toolDef.name}...`, tool: toolDef.name });

      try {
        const tool = new ToolClass();
        const data = await this._executeTool(tool, toolDef, context, options);
        results.push({ tool: toolDef.name, success: true, data, formatted: "" });
        this._emitStatus({ type: "tool-done", message: `✓ ${toolDef.name} concluído`, tool: toolDef.name });
      } catch (err) {
        results.push({ tool: toolDef.name, success: false, error: err.message });
        this._emitStatus({ type: "tool-error", message: `✗ ${toolDef.name}: ${err.message}`, tool: toolDef.name });
        if (toolDef.required) break;
      }
    }

    if (context.isAborted()) {
      return { content: "", aborted: true, results };
    }

    this._emitStatus({ type: "composing", message: "Montando resposta..." });

    const hasSuccessfulTools = results.some((r) => r.success);
    let content;

    if (hasSuccessfulTools) {
      content = responseComposer.compose(intent.id, results, context);
    }

    // If no tool content or no tools, fall back to AI provider
    if (!content && hasSuccessfulTools) {
      content = results.map((r) => r.formatted || "").filter(Boolean).join("\n\n");
    }

    if (!content) {
      content = await this._fallbackToProvider(userMessage, context, options);
    }

    this._emitStatus({ type: "done", message: "Resposta pronta" });

    return {
      content,
      provider: context.provider,
      intent: intent.id,
      results,
    };
  }

  async _executeTool(ToolInstance, toolDef, context, options) {
    const timer = setTimeout(() => { throw new Error(`Tool ${toolDef.name} timed out`); }, this.timeout);
    try {
      const data = await ToolInstance.execute(context);
      clearTimeout(timer);
      return data;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  async _fallbackToProvider(message, context, options) {
    const provider = getProvider(context.provider);
    if (!provider || !provider.isAvailable()) return "[Nenhum provider disponível para gerar resposta]";
    try {
      const agent = context.agent;
      const systemMsg = agent?.getSystemMessage?.() || "Você é um assistente útil. Responda em português brasileiro.";
      const result = await provider.sendMessage([
        { role: "system", content: systemMsg },
        { role: "user", content: message },
      ], { model: context.model });
      return result;
    } catch {
      return "[Erro ao gerar resposta]";
    }
  }

  _emitStatus(status) {
    if (this.onStatus) this.onStatus(status);
  }
}

export const toolExecutionEngine = new ToolExecutionEngine({ onStatus: null });
