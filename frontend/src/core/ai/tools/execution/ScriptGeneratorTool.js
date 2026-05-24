import { BaseExecutionTool } from "./BaseExecutionTool";

export class ScriptGeneratorTool extends BaseExecutionTool {
  constructor() {
    super({ name: "ScriptGeneratorTool", description: "Gera roteiros completos para vídeos" });
  }

  async execute(context) {
    const systemPrompt = `Você é um roteirista profissional especializado em criar roteiros para TikTok, YouTube Reels, YouTube e VSL.

REGRAS:
- Crie roteiros com hook forte (0-3s), problema, solução e CTA
- Adapte ao formato da plataforma solicitada
- Inclua dicas de produção
- Responda APENAS com JSON:
{
  "platform": "TikTok/YouTube/Reels/VSL",
  "duration": "30s/60s/90s",
  "hook": "texto do hook",
  "problem": "descrição do problema",
  "solution": "descrição da solução",
  "cta": "chamada para ação",
  "fullScript": "roteiro completo em formato de cena",
  "tips": ["dica 1", "dica 2"]
}`;

    const result = await this._callProvider(context, systemPrompt, context.userMessage);
    return this._parseJSON(result, {
      platform: this._detectPlatform(context.userMessage),
      duration: "30-60s",
      hook: "",
      problem: "",
      solution: "",
      cta: "",
      fullScript: result || "",
    });
  }

  _detectPlatform(text) {
    const t = text.toLowerCase();
    if (t.includes("tiktok")) return "TikTok";
    if (t.includes("reels") || t.includes("instagram")) return "Instagram Reels";
    if (t.includes("youtube") || t.includes("shorts")) return "YouTube";
    if (t.includes("vsl")) return "VSL";
    return "TikTok";
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
