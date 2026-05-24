import { getProvider } from "../providers/ProviderFactory";
import { ToolContext } from "./ToolContext";
import { toolResolver } from "./ToolResolver";
import { responseComposer } from "./ResponseComposer";
import { getExecutionTool } from "../tools/execution";

const MAX_CONTENT_LENGTH = 50000;

export class ToolExecutionEngine {
  constructor(config = {}) {
    this.timeout = config.timeout ?? 15000;
    this.maxTools = config.maxTools ?? 2;
    this.onStatus = config.onStatus || null;
  }

  async execute(userMessage, options = {}) {
    try {
      const context = new ToolContext({
        userMessage: userMessage || "",
        agentId: options.agent?.id || options.agentId || "",
        provider: options.provider || "branpy-demo",
        model: options.model || "",
        sessionId: options.sessionId || "",
        signal: options.signal || null,
        intent: options.intent || null,
        agent: options.agent || null,
      });

      const intent = context.intent;
      if (!intent || !intent.id) {
        return { content: await this._executePrompt(userMessage || "", context, options), provider: context.provider, intent: "general", results: [] };
      }

      const tools = toolResolver.resolve(intent.id, options);
      if (!tools || tools.length === 0) {
        return { content: await this._executePrompt(userMessage || "", context, options), provider: context.provider, intent: intent.id, results: [] };
      }

      this._emitStatus({ type: "intent", message: `Detectado: ${intent.label}`, intent: intent.id });
      this._emitStatus({ type: "tools", message: `Executando ${tools.length} ferramenta(s)...`, tools: tools.map((t) => t.name) });

      const results = [];
      for (const toolDef of tools.slice(0, this.maxTools)) {
        if (context.isAborted()) break;
        if (!toolDef || !toolDef.name) continue;

        let ToolClass;
        try { ToolClass = await getExecutionTool(toolDef.name); } catch { ToolClass = null; }
        if (!ToolClass) {
          results.push({ tool: toolDef.name, success: false, error: "Tool not found" });
          continue;
        }

        this._emitStatus({ type: "tool", message: `▶ ${toolDef.name}...`, tool: toolDef.name });

        try {
          const tool = new ToolClass();
          const data = await this._executeTool(tool, toolDef, context);
          results.push({ tool: toolDef.name, success: true, data: data || {} });
          this._emitStatus({ type: "tool-done", message: `✓ ${toolDef.name} concluído`, tool: toolDef.name });
        } catch (err) {
          results.push({ tool: toolDef.name, success: false, error: err ? err.message : "Unknown error" });
          this._emitStatus({ type: "tool-error", message: `✗ ${toolDef.name}: falha`, tool: toolDef.name });
          if (toolDef.required) break;
        }
      }

      if (context.isAborted()) {
        return { content: "", aborted: true, results, provider: context.provider, intent: intent.id };
      }

      this._emitStatus({ type: "composing", message: "Montando resposta..." });

      const hasSuccessfulTools = results.some((r) => r.success);
      let content = "";

      if (hasSuccessfulTools) {
        try {
          content = responseComposer.compose(intent.id, results, context);
        } catch { content = ""; }
      }

      if (!content || content.length === 0) {
        content = await this._executePrompt(userMessage || "", context, options);
      }

      if (content && content.length > MAX_CONTENT_LENGTH) {
        content = content.slice(0, MAX_CONTENT_LENGTH) + "\n\n*(conteúdo truncado — muito longo)*";
      }

      this._emitStatus({ type: "done", message: "Resposta pronta" });

      return {
        content: content || "",
        provider: context.provider,
        intent: intent.id,
        results,
      };
    } catch (err) {
      this._emitStatus({ type: "done", message: "Erro ao processar" });
      return { content: "", provider: options.provider || "branpy-demo", intent: "general", results: [], error: err ? err.message : "Unknown error" };
    }
  }

  async _executeTool(ToolInstance, toolDef, context) {
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(async () => {
        reject(new Error(`Tool ${toolDef.name} timed out after ${this.timeout}ms`));
      }, this.timeout);

      try {
        const data = await ToolInstance.execute(context);
        clearTimeout(timer);
        resolve(data);
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }

  async _executePrompt(message, context, options) {
    try {
      const providerId = context.provider || "branpy-demo";
      if (providerId === "branpy-demo") {
        return this._composeNoProviderResponse(message, context);
      }
      const provider = getProvider(providerId);
      if (!provider || !provider.isAvailable()) {
        return this._composeNoProviderResponse(message, context);
      }
      const systemMsg = "Você é um assistente direto que entrega resultados completos sem rodeios. Responda em português brasileiro. NUNCA diga 'entendi sua pergunta', 'posso ajudar', 'vou analisar' ou frases genéricas.";
      const history = (context.history || []).slice(-4);
      const result = await provider.sendMessage([
        { role: "system", content: systemMsg },
        ...history,
        { role: "user", content: message },
      ], { model: context.model });
      return result || "";
    } catch {
      return this._composeNoProviderResponse(message, context);
    }
  }

  _composeNoProviderResponse(message, context) {
    try {
      const intent = context && context.intent;
      if (intent && ["news", "search", "browser"].includes(intent.id)) {
        return "Não consegui buscar em tempo real agora, mas posso continuar com uma resposta geral ou tentar outro provider.";
      }
      return "Estou operando em modo local. Para uma resposta completa, conecte uma API key no painel AI Providers ou tente novamente.";
    } catch {
      return "Estou em modo local. Conecte uma API key para respostas completas.";
    }
  }

  _emitStatus(status) {
    try {
      if (this.onStatus && status) this.onStatus(status);
    } catch { /* ignore status errors */ }
  }
}

export const toolExecutionEngine = new ToolExecutionEngine({ onStatus: null });
