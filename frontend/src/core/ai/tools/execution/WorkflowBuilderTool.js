import { BaseExecutionTool } from "./BaseExecutionTool";

export class WorkflowBuilderTool extends BaseExecutionTool {
  constructor() {
    super({ name: "WorkflowBuilderTool", description: "Cria workflows de automação completos" });
  }

  async execute(context) {
    const systemPrompt = `Você é um engenheiro de automação especializado em criar workflows.

REGRAS:
- Crie workflows completos com passos claros
- Inclua gatilhos, ações e condições
- Pense em termos de automação real
- Responda APENAS com JSON:
{
  "overview": "visão geral do workflow",
  "steps": [
    { "action": "nome da ação", "description": "descrição do passo" }
  ],
  "triggers": ["gatilho 1", "gatilho 2"],
  "tools": "ferramentas necessárias",
  "code": "código de automação (se aplicável)"
}`;

    const result = await this._callProvider(context, systemPrompt, context.userMessage);
    return this._parseJSON(result, {
      overview: "Workflow de automação baseado na sua solicitação.",
      steps: [{ action: "Ação principal", description: result || "" }],
      triggers: [],
      tools: "",
      code: "",
    });
  }

  _parseJSON(text, fallback) {
    if (!text) return fallback;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return fallback;
    } catch { return fallback; }
  }
}
