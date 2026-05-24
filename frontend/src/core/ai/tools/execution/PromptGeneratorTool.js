import { BaseExecutionTool } from "./BaseExecutionTool";

export class PromptGeneratorTool extends BaseExecutionTool {
  constructor() {
    super({ name: "PromptGeneratorTool", description: "Gera prompts profissionais e completos" });
  }

  async execute(context) {
    const systemPrompt = `Você é um especialista em engenharia de prompt. Sua função é criar prompts profissionais, completos e otimizados.

REGRAS:
- Crie prompts com: objetivo, contexto, instruções, formato da resposta, tom
- Sempre inclua variações do prompt
- Inclua dicas de uso
- Responda APENAS com JSON neste formato:
{
  "objective": "objetivo do prompt",
  "context": "contexto para usar o prompt",
  "instructions": "instruções detalhadas",
  "referencePrompt": "prompt completo e formatado",
  "variations": ["variação 1", "variação 2"],
  "tips": ["dica 1", "dica 2"]
}`;

    const result = await this._callProvider(context, systemPrompt, `Crie um prompt profissional para: ${context.userMessage}`);
    return this._parseJSON(result, {
      objective: context.userMessage,
      instructions: result || "Prompt gerado com base na solicitação.",
      referencePrompt: result || "",
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
