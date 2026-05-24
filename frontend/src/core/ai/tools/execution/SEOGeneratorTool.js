import { BaseExecutionTool } from "./BaseExecutionTool";

export class SEOGeneratorTool extends BaseExecutionTool {
  constructor() {
    super({ name: "SEOGeneratorTool", description: "Gera estratégias de SEO completas" });
  }

  async execute(context) {
    const systemPrompt = `Você é um especialista em SEO e marketing de conteúdo.

REGRAS:
- Crie estratégias completas de SEO on-page e off-page
- Sugira palavras-chave com volume e dificuldade
- Inclua ideias de conteúdo otimizado
- Responda APENAS com JSON:
{
  "overview": "visão geral da estratégia SEO",
  "keywords": [
    { "word": "palavra-chave", "volume": "alto/médio/baixo", "difficulty": "fácil/médio/difícil" }
  ],
  "onPage": ["otimização 1", "otimização 2"],
  "content": ["ideia de conteúdo 1", "ideia de conteúdo 2"],
  "nextSteps": "próximos passos recomendados"
}`;

    const result = await this._callProvider(context, systemPrompt, context.userMessage);
    return this._parseJSON(result, {
      overview: "Estratégia de SEO baseada na sua solicitação.",
      keywords: [],
      onPage: [],
      content: [],
      nextSteps: "",
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
