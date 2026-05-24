import { BaseProvider } from "./BaseProvider";

const UID = () => Math.random().toString(36).slice(2, 9);

function classifyIntent(text) {
  const t = text.toLowerCase();
  if (/ideias?|sugest[a-zõo]+|criativ|conteúdo|temas?|pauta|trend|tendência|inspiração|o que postar/i.test(t)) return "ideas";
  if (/marketing|estratégia|funil|público|segmentação|campanha|anúncio|ads|google|meta|tráfego/i.test(t)) return "marketing";
  if (/copy|texto|legenda|descrição|bio|persuasiv|vendas?|conversão|cta|headline|título/i.test(t)) return "copy";
  if (/roteir?|script|storytelling|narrativa|story|enredo|cena|sequência/i.test(t)) return "script";
  if (/estratégia|planejament|plano|ação|metas?|objetivo|kpi|resultado/i.test(t)) return "strategy";
  if (/youtube|tiktok|instagram|reels|shorts|vídeo|viral|short|edit/i.test(t)) return "video";
  if (/design|logo|identidade visual|paleta|cor|tipografia|brand|marca/i.test(t)) return "design";
  if (/produt|afiliado|marketplace|shopee|amazon|mercadolivre|ecommerce/i.test(t)) return "affiliate";
  if (/negóci|empreendedor|startup|empresa|crescimento|monetizar|receita/i.test(t)) return "business";
  if (/código|programa|dev|desenvolvimento|app|site|software|api|bug|debug/i.test(t)) return "code";
  return "general";
}

const RESPONSE_TEMPLATES = {
  ideas: (prompt) => {
    const topics = [
      "Tutoriais rápidos (30s resolvendo um problema específico)",
      "Bastidores do seu processo de trabalho",
      "Comparações (antes/depois, vs concorrente)",
      "Respondendo perguntas frequentes dos seguidores",
      "Case studies com resultados reais",
      "Trends e desafios do momento adaptados ao seu nicho",
      "Conteúdo gerado por usuário (republique e comente)",
      "Séries educativas em 3-5 partes",
      "Demonstrações de produtos em uso real",
      "Conteúdo interativo: enquetes, quizzes, desafios",
    ];
    const selected = shuffle(topics).slice(0, 5);
    return [
      `Aqui estão **5 ideias de conteúdo** com base na sua solicitação:\n`,
      ...selected.map((t, i) => `${i + 1}. ${t}`),
      `\n💡 **Dica:** Adapte cada ideia ao formato da plataforma (Reels, TikTok, YouTube Shorts). Conteúdo educativo tem 2x mais engajamento que conteúdo promocional direto.`,
    ].join("\n");
  },
  marketing: (prompt) => {
    const strategies = [
      "**Funil de conteúdo:** Topo (educação) → Meio (solução) → Fundo (conversão). Crie 3 conteúdos para cada etapa.",
      "**Segmentação por interesse:** Use dados de comportamento, não apenas demografia. Públicos quentes convertem 3x mais.",
      "**Remarketing estratégico:** Mostre anúncios para quem já interagiu. A cada R$1 investido, o retorno médio é R$4,50.",
      "**Conteúdo gerado pelo usuário (UGC):** Clientes reais têm 2.4x mais credibilidade que a marca falando de si mesma.",
      "**Prova social:** Depoimentos, cases e números. 92% dos consumidores confiam em recomendações de outros clientes.",
    ];
    const selected = shuffle(strategies).slice(0, 3);
    return [
      `📊 **Estratégias de Marketing:**\n`,
      ...selected.map((t) => `• ${t}`),
      `\n📈 **Métrica chave:** Aumente seu CTR testando 3 variações de criativo por semana. O mercado que não testa, estaciona.`,
    ].join("\n");
  },
  copy: (prompt) => {
    const headlines = [
      '"Você está perdendo [X] por não saber disso"',
      '"O segredo que [concorrentes] não querem que você saiba"',
      '"Em apenas [tempo], você pode [resultado]"',
      '"Pare de [ação errada] e comece a [ação certa]"',
      '"O método que [número] pessoas usaram para [resultado]"',
    ];
    const ctas = [
      '"Comece agora — é grátis"',
      '"Garanta sua vaga — vagas limitadas"',
      '"Baixe o guia completo"',
      '"Clique e veja como funciona"',
      '"Sim, quero [resultado]"',
    ];
    return [
      `✍️ **Copywriting Persuasivo:**\n`,
      `**Headlines que convertem:**`,
      ...shuffle(headlines).slice(0, 3).map((h) => `  • ${h}`),
      `\n**Call to Actions eficazes:**`,
      ...shuffle(ctas).slice(0, 3).map((c) => `  • ${c}`),
      `\n**Estrutura de copy que vende:**`,
      `1. **Problema:** Identifique a dor do cliente`,
      `2. **Agitação:** Aprofunde o desconforto`,
      `3. **Solução:** Apresente seu produto/service`,
      `4. **Prova:** Depoimentos ou dados`,
      `5. **CTA:** Ação clara e urgente`,
      `\n⚡ **Regra de ouro:** Uma boa copy não vende o produto, vende a transformação que o produto proporciona.`,
    ].join("\n");
  },
  script: (prompt) => {
    return [
      `🎬 **Roteiro para Vídeo (30s):**\n`,
      `**Hook (0-3s):** "Você sabia que [fato impactante]? Pois é, a maioria das pessoas faz isso errado."`,
      ``,
      `**Problema (3-10s):** "O maior erro que vejo é [problema comum]. Isso custa tempo, dinheiro e resultados."`,
      ``,
      `**Solução (10-22s):** "A forma correta é [solução]. Deixa eu te mostrar como fazer na prática:"`,
      `  → Mostre o processo passo a passo`,
      `  → Destaque os resultados`,
      `  → Use linguagem simples`,
      ``,
      `**CTA (22-30s):** "Se você curtiu, salva esse vídeo pra ver depois. E me segue pra mais dicas como essa!"`,
      ``,
      `💡 **Dicas de produção:**`,
      `• Iluminação frontal (ring light a 45°)`,
      `• Áudio limpo (microfone de lapela)`,
      `• Cortes rápidos a cada 3-5s para prender atenção`,
      `• Legendas coloridas (aumentam retention em 40%)`,
    ].join("\n");
  },
  strategy: (prompt) => {
    const steps = [
      "**1. Diagnóstico:** Onde você está agora vs onde quer chegar (defina KPIs claros)",
      "**2. Pesquisa:** Conheça seu mercado, concorrentes e público-alvo a fundo",
      "**3. Planejamento:** Defina metas com prazos (SMART) e recursos necessários",
      "**4. Execução:** Comece pequeno, teste rápido, escale o que funciona",
      "**5. Medição:** Acompanhe métricas semanalmente e ajuste a rota",
    ];
    return [
      `📋 **Plano Estratégico:**\n`,
      ...steps,
      `\n📌 **Checklist de execução:**`,
      `• [ ] Defina seu objetivo principal`,
      `• [ ] Identifique 3 ações prioritárias`,
      `• [ ] Estabeleça prazos realistas`,
      `• [ ] Crie um sistema de medição`,
      `• [ ] Revise e ajuste a cada 15 dias`,
      `\n🚀 **Lembre-se:** Estratégia sem execução é apenas um sonho. Comece hoje com uma ação concreta.`,
    ].join("\n");
  },
  video: (prompt) => {
    return [
      `🎥 **Estratégia para Vídeos:**\n`,
      `**Formatos que funcionam em 2026:**`,
      `• **Tutorial rápido:** Resolva 1 problema em 30-60s`,
      `• **Comparação:** Produto A vs Produto B (ajuda na decisão)`,
      `• **Storytelling:** Conte uma história pessoal com lição`,
      `• **FAQ:** Responda as 5 perguntas mais frequentes`,
      `• **Trends:** Adapte trends ao seu nicho com seu toque único`,
      ``,
      `**Otimização por plataforma:**`,
      `| Plataforma | Duração | Formato | Legendas |`,
      `|------------|---------|---------|----------|`,
      `| TikTok     | 15-60s  | 9:16    | Obrigatório |`,
      `| Reels      | 15-90s  | 9:16    | Recomendado |`,
      `| Shorts     | 15-60s  | 9:16    | Obrigatório |`,
      `| YouTube    | 8-15min | 16:9    | Opcional |`,
      ``,
      `🔥 **Dica viral:** Os 3 primeiros segundos decidem 80% do sucesso. Comece com um gancho forte.`,
    ].join("\n");
  },
  design: (prompt) => {
    return [
      `🎨 **Direção de Design:**\n`,
      `**Princípios de identidade visual:**`,
      `• **Cores:** Escolha 3 cores (primária, secundária, destaque). Use 60-30-10.`,
      `• **Tipografia:** Máximo 2 fontes (uma para títulos, uma para corpo)`,
      `• **Espaçamento:** Respire. Espaço em branco é luxo.`,
      `• **Consistência:** Mesmos estilos em todos os materiais`,
      ``,
      `**Paletas recomendadas para 2026:**`,
      `• **Minimalista:** Preto, branco, um destaque azul cobalto`,
      `• **Natureza:** Verde musgo, areia, terracota`,
      `• **Tech:** Azul elétrico, cinza escuro, gradiente neon`,
      `• **Luxo:** Dourado, preto, marinho`,
      ``,
      `🛠 **Ferramentas gratuitas:** Canva (iniciante), Figma (profissional), Coolors (paletas), Unsplash (imagens)`,
    ].join("\n");
  },
  affiliate: (prompt) => {
    return [
      `🛒 **Marketing de Afiliados:**\n`,
      `**Produtos com maior comissão em 2026:**`,
      `• Infoprodutos (cursos, mentorias) — até 70%`,
      `• SaaS e ferramentas digitais — 20-40% recorrente`,
      `• Cosméticos e suplementos — 15-30%`,
      `• Eletrônicos — 5-15%`,
      ``,
      `**Estratégias que convertem:**`,
      `1. **Conteúdo de review:** Mostre o produto em uso REAL`,
      `2. **Comparativo:** Seu link vs concorrência`,
      `3. **Tutorial:** Ensine algo usando o produto`,
      `4. **Cupom exclusivo:** "Use BRANPY10 e ganhe 10% off"`,
      `5. **Prova social:** Print dos seus resultados com o produto`,
      ``,
      `💰 **Métrica chave:** Taxa de conversão média para afiliados é 1-3%. Com conteúdo de qualidade, chega a 8-12%.`,
    ].join("\n");
  },
  business: (prompt) => {
    return [
      `🚀 **Estratégia de Negócios:**\n`,
      `**Os 5 pilares de um negócio digital sustentável:**`,
      `1. **Produto:** Resolva um problema real que as pessoas pagam pra resolver`,
      `2. **Tráfego:** Domine 1 canal antes de expandir (orgânico ou pago)`,
      `3. **Conversão:** Landing page otimizada + copy persuasiva + prova social`,
      `4. **Entrega:** Supere as expectativas. Cliente feliz = recompra + indicação`,
      `5. **Retenção:** CRM ativo, comunidade, conteúdo exclusivo para clientes`,
      ``,
      `📊 **O que medir:** CAC, LTV, MRR, Churn, NPS`,
      `🎯 **Meta inicial:** Faturamento recorrente de R$ 5k-10k/mês em 6 meses`,
      ``,
      `💡 **Comece hoje:** Qual o menor produto que você pode lançar em 7 dias?`,
    ].join("\n");
  },
  code: (prompt) => {
    const tips = [
      "**Arquitetura limpa:** Separe responsabilidades (components, hooks, services, utils)",
      "**Componentes pequenos:** Cada componente deve fazer UMA coisa bem feita",
      null,
      "**Estado gerenciado:** Use hooks (useState, useReducer) ou estado global só quando necessário",
      "**Testes:** Teste comportamento, não implementação. 80% cobertura é suficiente",
      null,
      "**Performance lazy:** Code-splitting, memo, useMemo, useCallback com moderação",
      "**Acessibilidade:** ARIA labels, teclado, contraste, semântica HTML",
    ].filter(Boolean);
    return [
      `💻 **Dicas de Desenvolvimento:**\n`,
      ...tips.map((t) => `• ${t}`),
      `\n📐 **Stack sugerida:** React + Vite + Tailwind + shadcn/ui (frontend), Node + Fastify (backend)`,
      `\n⚡ **Princípio fundamental:** Código é lido 10x mais do que é escrito. Otimize para legibilidade primeiro.`,
    ].join("\n");
  },
  general: (prompt) => {
    const responses = [
      `Entendi sua pergunta! Vou preparar uma análise completa.\n\n**Pontos principais:**\n• Identifiquei o contexto da sua solicitação\n• Tenho informações relevantes para compartilhar\n• Posso oferecer insights práticos e acionáveis\n\n**Sugestão:** Se quiser uma resposta mais específica, me conte mais detalhes sobre o que precisa. Posso ajudar com marketing, conteúdo, vídeos, design, código, estratégia de negócios e muito mais.`,
      `Ótima pergunta! Aqui está o que posso compartilhar:\n\n**Análise inicial:**\n1. Entendi o tema central da sua solicitação\n2. Identifiquei pontos-chave que merecem atenção\n3. Preparei recomendações práticas\n\n💡 **Dica rápida:** Explore os agentes especializados no menu superior para respostas mais focadas (Marketing, Vídeo, Design, Dev). Cada um tem conhecimento aprofundado na sua área.`,
      `Interessante! Deixa eu organizar uma resposta estruturada:\n\n📌 **Resumo do que entendi:**\nVocê está buscando orientação sobre este tema específico. Posso ajudar com:\n\n• **Análise estratégica** do cenário atual\n• **Recomendações práticas** para implementação imediata\n• **Próximos passos** organizados por prioridade\n\nQuer que eu aprofunde em algum aspecto específico?`,
    ];
    return shuffle(responses)[0];
  },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateResponse(prompt, agentId, msgCount) {
  const intent = classifyIntent(prompt);
  const template = RESPONSE_TEMPLATES[intent] || RESPONSE_TEMPLATES.general;

  let body;
  try { body = template(prompt); } catch { body = RESPONSE_TEMPLATES.general(prompt); }

  if (msgCount <= 1 && intent === "general") {
    body += `\n\n💡 **Dica:** Experimente perguntar sobre marketing, copywriting, roteiros, design ou estratégia de negócios. Posso gerar ideias personalizadas para seu nicho.`;
  }

  return body;
}

export class BRANPYLocalDemoProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      id: "branpy-demo",
      name: "BRANPY Local AI",
      baseUrl: "",
      apiKey: "",
      models: ["branpy-demo"],
      defaultModel: "branpy-demo",
      requiresKey: false,
      ...config,
    });
  }

  async sendMessage(messages, options = {}) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const agentId = options.agentId || "";
    const prompt = lastUser?.content || "";
    const msgCount = messages.filter((m) => m.role === "user").length;

    await this._delay(350 + Math.random() * 400);
    return generateResponse(prompt, agentId, msgCount);
  }

  async *streamMessage(messages, options = {}) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const agentId = options.agentId || "";
    const prompt = lastUser?.content || "";
    const msgCount = messages.filter((m) => m.role === "user").length;

    await this._delay(250 + Math.random() * 300);

    const response = generateResponse(prompt, agentId, msgCount);
    const chars = response.split("");
    const chunkSize = 2 + Math.floor(Math.random() * 4);
    const delayPerChunk = 10 + Math.random() * 25;

    for (let i = 0; i < chars.length; i += chunkSize) {
      yield chars.slice(i, i + chunkSize).join("");
      await this._delay(delayPerChunk);
    }
  }

  async healthCheck() {
    this.healthy = true;
    this.lastHealthCheck = Date.now();
    return true;
  }

  _delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
