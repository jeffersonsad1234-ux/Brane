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
        results.push({ tool: toolDef.name, success: true, data });
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

    if (!content && hasSuccessfulTools) {
      const hasData = results.some((r) => r.data && (Array.isArray(r.data?.results) ? r.data.results.length > 0 : true));
      if (hasData) {
        content = results.map((r) => (r.data ? (typeof r.data === "string" ? r.data : JSON.stringify(r.data, null, 2)) : "")).filter(Boolean).join("\n\n");
      }
    }

    if (!content) {
      content = await this._executePrompt(userMessage, context, options);
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

  async _executePrompt(message, context, options) {
    const providerId = context.provider;
    // Skip demo provider — it returns generic templates that ignore system prompts
    if (providerId === "branpy-demo") {
      return this._composeNoProviderResponse(message, context);
    }
    const provider = getProvider(providerId);
    if (!provider || !provider.isAvailable()) {
      return this._composeNoProviderResponse(message, context);
    }
    try {
      const agent = context.agent;
      const systemMsg = agent?.getSystemMessage?.() || "Você é um assistente direto que entrega resultados completos sem rodeios. Responda em português brasileiro. NUNCA diga 'entendi sua pergunta', 'posso ajudar', 'vou analisar' ou frases genéricas.";
      const result = await provider.sendMessage([
        { role: "system", content: systemMsg },
        ...context.history.slice(-4),
        { role: "user", content: message },
      ], { model: context.model });
      return result || "[Resposta vazia do provider]";
    } catch {
      return this._composeNoProviderResponse(message, context);
    }
  }

  _composeNoProviderResponse(message, context) {
    const intent = context.intent;
    if (["news", "search", "browser"].includes(intent.id)) {
      return "## 🔍 Busca Web\n\nA busca web real requer um provider de IA conectado ou uma API de busca (como SerpAPI, Google Search ou Bing).\n\n**O que eu posso fazer agora:**\n- Estruturar conteúdo para seu nicho\n- Criar estratégias de marketing e conteúdo\n- Gerar roteiros, copy e prompts\n- Desenvolver código\n\nConecte uma API key em **AI Providers** para ativar busca web real.";
    }
    return "## 🤖 Modo Demonstração\n\nEstou operando em modo local. Para respostas completas com dados reais da web, conecte uma API key no painel **AI Providers**.\n\nEnquanto isso, posso:\n- Criar prompts profissionais\n- Gerar roteiros e scripts\n- Escrever copy persuasiva\n- Desenvolver código\n- Criar estratégias de marketing\n\n**O que você precisa?**";
  }

  _emitStatus(status) {
    if (this.onStatus) this.onStatus(status);
  }
}

export const toolExecutionEngine = new ToolExecutionEngine({ onStatus: null });
