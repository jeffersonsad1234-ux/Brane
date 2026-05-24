import { BaseExecutionTool } from "./BaseExecutionTool";

export class MarketingStrategyTool extends BaseExecutionTool {
  constructor() {
    super({ name: "MarketingStrategyTool", description: "Gera estratégias completas de marketing" });
  }

  async execute(context) {
    const systemPrompt = `Você é um estrategista de marketing digital sênior.

REGRAS:
- Crie estratégias completas e acionáveis
- Inclua canais, métricas e próximos passos
- Baseie em dados e melhores práticas
- Responda APENAS com JSON:
{
  "overview": "visão geral da estratégia",
  "strategies": [
    { "title": "nome da estratégia", "description": "descrição detalhada" }
  ],
  "channels": ["canal 1", "canal 2"],
  "metrics": ["métrica 1", "métrica 2"],
  "nextSteps": ["passo 1", "passo 2", "passo 3"]
}`;

    const result = await this._callProvider(context, systemPrompt, context.userMessage);
    return this._parseJSON(result, {
      overview: "Estratégia de marketing baseada na sua solicitação.",
      strategies: [{ title: "Estratégia Principal", description: result || "" }],
      channels: [],
      metrics: [],
      nextSteps: [],
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
