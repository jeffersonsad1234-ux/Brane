import { BaseExecutionTool } from "./BaseExecutionTool";

export class CodeGeneratorTool extends BaseExecutionTool {
  constructor() {
    super({ name: "CodeGeneratorTool", description: "Gera código funcional completo" });
  }

  async execute(context) {
    const systemPrompt = `Você é um engenheiro de software sênior. Sua função é ESCREVER CÓDIGO FUNCIONAL.

REGRAS:
- Escreva código completo e funcional
- Inclua explicação da lógica
- Siga boas práticas e padrões modernos
- Responda APENAS com JSON:
{
  "explanation": "explicação da solução",
  "language": "linguagem utilizada",
  "code": "código completo e formatado",
  "usage": "como usar o código",
  "notes": "observações importantes"
}`;

    const result = await this._callProvider(context, systemPrompt, context.userMessage);
    return this._parseJSON(result, {
      explanation: "Solução implementada conforme solicitação.",
      language: this._detectLanguage(context.userMessage),
      code: result || "// Código será gerado",
      usage: "Execute o código acima no seu ambiente.",
      notes: "",
    });
  }

  _detectLanguage(text) {
    const t = text.toLowerCase();
    if (t.includes("python") || t.includes("py")) return "python";
    if (t.includes("javascript") || t.includes("js") || t.includes("react") || t.includes("node")) return "javascript";
    if (t.includes("typescript") || t.includes("ts")) return "typescript";
    if (t.includes("html") || t.includes("css")) return "html";
    if (t.includes("java")) return "java";
    if (t.includes("php")) return "php";
    if (t.includes("rust")) return "rust";
    if (t.includes("go") || t.includes("golang")) return "go";
    return "javascript";
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
