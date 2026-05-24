import { BaseExecutionTool } from "./BaseExecutionTool";

export class AffiliateContentTool extends BaseExecutionTool {
  constructor() {
    super({ name: "AffiliateContentTool", description: "Gera conteúdo para marketing de afiliados" });
  }

  async execute(context) {
    const systemPrompt = `Você é um especialista em marketing de afiliados.

REGRAS:
- Gere conteúdo persuasivo para converter
- Inclua estratégias de venda e CTAs
- Foque em resultados e comissões
- Responda APENAS com JSON:
{
  "overview": "visão geral da estratégia de afiliados",
  "content": ["ideia de conteúdo 1", "ideia de conteúdo 2", "ideia de conteúdo 3"],
  "strategies": ["estratégia de conversão 1", "estratégia de conversão 2"],
  "ctas": ["CTA 1", "CTA 2"]
}`;

    const result = await this._callProvider(context, systemPrompt, context.userMessage);
    return this._parseJSON(result, {
      overview: "Conteúdo para afiliados baseado na sua solicitação.",
      content: [result || "Conteúdo principal para divulgação"],
      strategies: [],
      ctas: [],
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
