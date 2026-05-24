import { BaseProvider, ProviderError } from "./BaseProvider";

const RESPONSES = {
  default: [
    "Olá! Como posso ajudar você hoje? Estou aqui para auxiliar com conteúdo, marketing, vídeos e muito mais.",
    "Entendi sua solicitação! Deixa eu pensar na melhor forma de ajudar você com isso.",
    "Ótima pergunta! Vou preparar uma resposta completa para você.",
    "Interessante! Aqui estão algumas ideias que podem ajudar.",
  ],
  agent: {
    "branpy-core": [
      "Sou o BRANPY Core AI. Estou analisando seu contexto para oferecer a melhor resposta possível.",
      "Como núcleo central do sistema, posso coordenar vários agentes para resolver sua solicitação.",
      "Entendi. Deixe-me processar isso com todo o ecossistema de agentes disponíveis.",
    ],
    "ai-assistant": [
      "Claro! Como assistente pessoal, posso ajudar com pesquisa, organização e produtividade.",
      "Deixa eu verificar as melhores opções para você.",
      "Perfeito! Vou organizar isso de forma clara e objetiva.",
    ],
    "dev-agent": [
      "Analisando seu código... Aqui estão algumas sugestões de melhoria.",
      "Entendi o problema. Deixe-me pensar na melhor abordagem de arquitetura.",
      "Vou preparar uma solução completa com exemplos de código.",
    ],
    "marketing-agent": [
      "Ótimo! Como especialista em marketing, aqui estão algumas estratégias que recomendo.",
      "Analisei sua solicitação. Esta abordagem de copywriting pode aumentar sua conversão.",
      "Vou preparar um plano de marketing completo para você.",
    ],
    "video-agent": [
      "Entendi o tipo de vídeo! Aqui vai um roteiro otimizado para engajamento.",
      "Como especialista em produção de vídeo, recomendo esta estrutura de storytelling.",
      "Vou criar um plano de edição que vai destacar seu conteúdo.",
    ],
    "design-agent": [
      "Ótimo! Como designer, recomendo esta direção visual para seu projeto.",
      "Analisei sua identidade visual. Aqui estão sugestões de melhoria.",
      "Vou preparar uma paleta de cores e tipografia alinhada com sua marca.",
    ],
  },
};

function getResponse(agentId) {
  const agentResponses = RESPONSES.agent[agentId];
  if (agentResponses) {
    return agentResponses[Math.floor(Math.random() * agentResponses.length)];
  }
  return RESPONSES.default[Math.floor(Math.random() * RESPONSES.default.length)];
}

export class BRANPYLocalDemoProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "branpy-demo",
      name: "BRANPY Local Demo",
      baseUrl: "",
      apiKey: "",
      models: ["branpy-demo"],
      defaultModel: "branpy-demo",
      requiresKey: false,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const agentId = options.agentId || "";
    const userContent = lastUserMsg?.content || "";

    await this.simulateDelay(600);

    const greeting = getResponse(agentId);
    const response = this.buildResponse(greeting, userContent, agentId, messages.length);
    return response;
  }

  async *streamMessage(messages, options = {}) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const agentId = options.agentId || "";
    const userContent = lastUserMsg?.content || "";

    await this.simulateDelay(400);

    const greeting = getResponse(agentId);
    const response = this.buildResponse(greeting, userContent, agentId, messages.length);

    for (let i = 0; i < response.length; i += 3) {
      yield response.slice(i, i + 3);
      await this.simulateDelay(20);
    }
  }

  buildResponse(greeting, userContent, agentId, msgCount) {
    const parts = [greeting];

    if (userContent.length > 5) {
      parts.push(`\n\nAnalisei sua mensagem sobre "${userContent.slice(0, 60)}..."`);
    }

    if (agentId === "marketing-agent") {
      parts.push("\n\n📢 **Estratégia sugerida:**\n• Defina seu público-alvo\n• Crie conteúdo relevante\n• Otimize para conversão\n• Acompanhe métricas\n• Ajuste com base nos resultados");
    } else if (agentId === "dev-agent") {
      parts.push("\n\n💻 **Análise técnica:**\n• Revise a arquitetura atual\n• Identifique pontos de melhoria\n• Implemente boas práticas\n• Teste continuamente");
    } else if (agentId === "video-agent") {
      parts.push("\n\n🎬 **Plano de vídeo:**\n• Hook nos primeiros 3 segundos\n• Storytelling envolvente\n• Call to action claro\n• Miniaturas otimizadas");
    } else if (agentId === "design-agent") {
      parts.push("\n\n🎨 **Direção de design:**\n• Paleta de cores consistente\n• Tipografia legível\n• Espaçamento equilibrado\n• Hierarquia visual clara");
    } else if (msgCount <= 3) {
      parts.push("\n\n💡 **Sugestões rápidas:**\n• Explore os agentes especializados no menu superior\n• Configure providers em AI Providers para respostas reais\n• Use o operador e browser para automações");
    }

    parts.push("\n\n*Esta é uma resposta do modo demonstração. Configure uma chave de API nos providers para respostas com IA real.*");

    return parts.join("");
  }

  async healthCheck() {
    this.healthy = true;
    this.lastHealthCheck = Date.now();
    return true;
  }

  simulateDelay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
