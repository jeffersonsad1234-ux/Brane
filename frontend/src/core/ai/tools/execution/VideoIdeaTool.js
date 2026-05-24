import { BaseExecutionTool } from "./BaseExecutionTool";

export class VideoIdeaTool extends BaseExecutionTool {
  constructor() {
    super({ name: "VideoIdeaTool", description: "Gera ideias e estratégias para conteúdo em vídeo" });
  }

  async execute(context) {
    const systemPrompt = `Você é um estrategista de conteúdo em vídeo especializado em TikTok, YouTube e Reels.

REGRAS:
- Crie ideias de vídeo com alto potencial de engajamento
- Inclua formato, duração e dicas de produção
- Adapte ao nicho e plataforma
- Responda APENAS com JSON:
{
  "strategy": "estratégia geral de conteúdo em vídeo",
  "ideas": [
    {
      "title": "título da ideia",
      "format": "formato (tutorial/comparativo/storytelling/etc)",
      "description": "descrição da ideia"
    }
  ],
  "tips": ["dica de produção 1", "dica de produção 2"]
}`;

    const result = await this._callProvider(context, systemPrompt, context.userMessage);
    return this._parseJSON(result, {
      strategy: "",
      ideas: [{ title: "Ideia principal", format: "formato", description: result || "" }],
      tips: [],
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
