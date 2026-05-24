const INTENT_PATTERNS = [
  { id: "news", label: "Notícias e Busca", patterns: [/notíci/i, /últimas/i, /jornal/i, /aconteceu/i, /hoje\s*no\s*mundo/i, /ontem\s*no\s*mundo/i, /mundo\s*hoje/i, /manchetes/i, /atualidad/i] },
  { id: "search", label: "Pesquisa Web", patterns: [/pesquis[aei]/i, /buscar?/i, /procurar?/i, /encontrar?/i, /busque/i, /pesquise/i, /pesquisa\s*sobre/i, /informações\s*sobre/i, /dados\s*sobre/i, /resultados?\s*sobre/i] },
  { id: "browser", label: "Navegação Web", patterns: [/site/i, /página/i, /url/i, /acess[aeo]/i, /abrir?\s*site/i, /navegar?/i, /web/i, /internet/i, /link/i, /htt(p|ps)/i] },
  { id: "prompt", label: "Criação de Prompt", patterns: [/cri(e|ar|e)\s*(um|o)?\s*prompt/i, /gerar?\s*prompt/i, /monte\s*(um|o)?\s*prompt/i, /elabore\s*(um|o)?\s*prompt/i, /escreva\s*(um|o)?\s*prompt/i, /preciso\s*de\s*(um|o)?\s*prompt/i] },
  { id: "marketing", label: "Marketing", patterns: [/market/i, /estratégia\s*de\s*market/i, /campanha/i, /funil/i, /público.alvo/i, /segmentação/i, /tráfego/i, /anúncio/i, /ads/i] },
  { id: "copywriting", label: "Copywriting", patterns: [/cop(y|i)/i, /texto\s*persuasiv/i, /legenda/i, /descriç[ãa]o\s*de\s*produto/i, /headline/i, /título\s*persuasiv/i, /cta/i, /call.to.action/i] },
  { id: "seo", label: "SEO", patterns: [/seo/i, /otimizaç[ãa]o/i, /palavra.chave/i, /keyword/i, /rank/i, /google\s*topo/i, /posicionamento/i, /tráfego.orgânico/i] },
  { id: "script", label: "Roteiro", patterns: [/roteir[oai]/i, /script/i, /storytell/i, /narrativ/i, /vsl/i, /video.sales.letter/i, /cena/i, /sequência/i] },
  { id: "video", label: "Vídeo", patterns: [/v[ií]deo/i, /tiktok/i, /youtube/i, /reels/i, /shorts/i, /viral/i, /produç[ãa]o.*v[ií]deo/i, /edit/i, /corte/i] },
  { id: "code", label: "Programação", patterns: [/c[óo]dig[oai]/i, /programaç[ãa]o/i, /desenvolv/i, /app/i, /site/i, /software/i, /api/i, /bug/i, /debug/i, /funç[ãa]o/i, /componente/i, /react/i, /node/i, /python/i, /javascript/i] },
  { id: "automation", label: "Automação", patterns: [/automati/i, /workflow/i, /pipelin/i, /fluxo/i, /automatiz/i, /robo/i, /integraç[ãa]o/i] },
  { id: "ads", label: "Anúncios", patterns: [/an[uú]ncio/i, /google.ads/i, /meta.ads/i, /facebook.ads/i, /tiktok.ads/i, /m[ií]dia.paga/i, /ppc/i, /cpm/i, /cpc/i, /roi/i] },
  { id: "branding", label: "Branding", patterns: [/brand/i, /marca/i, /identidade.visual/i, /logo/i, /paleta/i, /tipografi/i, /posicionamento\s*de\s*marca/i] },
  { id: "ecommerce", label: "Ecommerce", patterns: [/ecommerce/i, /e.commerce/i, /loja.virtual/i, /shopify/i, /woocommerce/i, /marketplace/i, /produto\s*digital/i] },
  { id: "affiliate", label: "Afiliados", patterns: [/afiliad/i, /comiss[ãa]o/i, /link\s*pag[ií]vel/i, /programa\s*de\s*afiliado/i, /monetiz/i] },
  { id: "general", label: "Geral", patterns: [/.*/] },
];

export class IntentEngine {
  constructor() {
    this.intents = INTENT_PATTERNS;
  }

  classify(text) {
    for (const intent of this.intents) {
      for (const pattern of intent.patterns) {
        if (pattern.test(text)) {
          return intent;
        }
      }
    }
    return this.intents.find((i) => i.id === "general");
  }

  getAgentForIntent(intentId) {
    const map = {
      news: "research-agent",
      search: "research-agent",
      browser: "research-agent",
      prompt: "branpy-core",
      marketing: "marketing-agent",
      copywriting: "marketing-agent",
      seo: "marketing-agent",
      script: "video-agent",
      video: "video-agent",
      code: "dev-agent",
      automation: "workflow-agent",
      ads: "marketing-agent",
      branding: "design-agent",
      ecommerce: "marketing-agent",
      affiliate: "marketing-agent",
      general: "branpy-core",
    };
    return map[intentId] || "branpy-core";
  }

  shouldExecute(intentId) {
    return ["news", "search", "browser", "prompt", "script", "copywriting", "code", "affiliate", "marketing", "seo", "video", "automation"].includes(intentId);
  }

  generateExecutionPrompt(intentId, userText) {
    const templates = {
      prompt: `Crie um prompt profissional e detalhado para:\n\n${userText}\n\nFormato: objetivo, contexto, tom, formato da resposta, exemplo.`,
      script: `Crie um roteiro completo para:\n\n${userText}\n\nInclua: hook, problema, solução, CTA, dicas de produção.`,
      copywriting: `Escreva um texto persuasivo para:\n\n${userText}\n\nInclua: headline, corpo, CTA, variações.`,
      code: `Desenvolva a solução em código para:\n\n${userText}\n\nInclua: explicação, código completo, exemplos de uso.`,
    };
    return templates[intentId] || userText;
  }
}

export const intentEngine = new IntentEngine();
