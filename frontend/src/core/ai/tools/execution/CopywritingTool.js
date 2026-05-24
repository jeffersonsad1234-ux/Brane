import { BaseExecutionTool } from "./BaseExecutionTool";

export class CopywritingTool extends BaseExecutionTool {
  constructor() {
    super({ name: "CopywritingTool", description: "Gera copy persuasiva para anúncios e vendas" });
  }

  async execute(context) {
    const systemPrompt = `Você é um copywriter profissionais especializado em marketing digital e vendas.

REGRAS:
- Use gatilhos mentais (escassez, urgência, prova social, autoridade)
- Crie headlines que param o scroll
- Inclua CTAs persuasivos
- Adapte ao formato (anúncio, legenda, email, página)
- Responda APENAS com JSON:
{
  "problem": "dor do cliente",
  "agitation": "aprofundamento da dor",
  "headlines": ["headline 1", "headline 2", "headline 3"],
  "body": "corpo do texto persuasivo",
  "ctas": ["CTA 1", "CTA 2", "CTA 3"],
  "fullCopy": "copy completa e formatada",
  "tips": ["gatilho usado 1", "gatilho usado 2"]
}`;

    const result = await this._callProvider(context, systemPrompt, context.userMessage);
    return this._parseJSON(result, {
      problem: "",
      headlines: [],
      body: result || "",
      ctas: [],
      fullCopy: result || "",
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
