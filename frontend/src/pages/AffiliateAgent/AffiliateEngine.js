const TRENDS = ['produto em alta', 'produto viral', 'alta conversão', 'muito buscado'];

const NICHOS = [
  { id: 'tecnologia', nome: 'Tecnologia', icone: '💻', cor: '#2563eb' },
  { id: 'casa', nome: 'Casa & Decor', icone: '🏠', cor: '#059669' },
  { id: 'beleza', nome: 'Beleza & Saúde', icone: '💄', cor: '#e11d48' },
  { id: 'gadgets', nome: 'Gadgets', icone: '📱', cor: '#7c3aed' },
  { id: 'gamer', nome: 'Gamer', icone: '🎮', cor: '#f59e0b' },
  { id: 'fitness', nome: 'Fitness', icone: '🏋️', cor: '#0891b2' },
  { id: 'cozinha', nome: 'Cozinha', icone: '🍳', cor: '#ea580c' },
  { id: 'pets', nome: 'Pets', icone: '🐾', cor: '#84cc16' },
];

const PRODUTOS = {
  tecnologia: [
    { nome: 'Fone Bluetooth Pro Max', preco: 189.90, img: '🎧' },
    { nome: 'Carregador Wireless 3 em 1', preco: 129.90, img: '🔋' },
    { nome: 'Mouse Ergonômico Vertical', preco: 89.90, img: '🖱️' },
    { nome: 'Teclado Mecânico RGB', preco: 249.90, img: '⌨️' },
    { nome: 'Monitor 27" 4K HDR', preco: 1899.90, img: '🖥️' },
    { nome: 'Webcam Full HD com microfone', preco: 159.90, img: '📷' },
  ],
  casa: [
    { nome: 'Luminária LED Inteligente', preco: 79.90, img: '💡' },
    { nome: 'Organizador de Gavetas', preco: 49.90, img: '📦' },
    { nome: 'Tapete Antiderrapante', preco: 119.90, img: '🟫' },
    { nome: 'Conjunto de Panelas Antiaderentes', preco: 299.90, img: '🍳' },
    { nome: 'Vaso Decorativo Cerâmica', preco: 69.90, img: '🏺' },
    { nome: 'Cortina Blackout Premium', preco: 159.90, img: '🪟' },
  ],
  beleza: [
    { nome: 'Secador de Cabelo Profissional', preco: 179.90, img: '💇' },
    { nome: 'Barbeador Elétrico à Prova d\'Água', preco: 199.90, img: '🪒' },
    { nome: 'Kit Escova Modeladora', preco: 89.90, img: '🪮' },
    { nome: 'Vaporizador Facial', preco: 129.90, img: '🧖' },
    { nome: 'Massageador Corporal', preco: 149.90, img: '💆' },
    { nome: 'Aparelho de Depilação a Laser', preco: 399.90, img: '✨' },
  ],
  gadgets: [
    { nome: 'Smartwatch Esportivo', preco: 299.90, img: '⌚' },
    { nome: 'Caixa de Som Portátil', preco: 159.90, img: '🔊' },
    { nome: 'Drone Mini com Câmera', preco: 899.90, img: '🛸' },
    { nome: 'Óculos de Realidade Virtual', preco: 1299.90, img: '🥽' },
    { nome: 'Rastreador Inteligente GPS', preco: 69.90, img: '📍' },
    { nome: 'Hub USB-C 12 em 1', preco: 119.90, img: '🔌' },
  ],
  gamer: [
    { nome: 'Headset Gamer 7.1 RGB', preco: 299.90, img: '🎧' },
    { nome: 'Mousepad Gamer XXL', preco: 89.90, img: '🖱️' },
    { nome: 'Controle Pro Sem Fio', preco: 349.90, img: '🎮' },
    { nome: 'Cadeira Gamer Ergonômica', preco: 1299.90, img: '💺' },
    { nome: 'Suporte Articulado Monitor', preco: 159.90, img: '🖥️' },
    { nome: 'Microfone Condensador USB', preco: 199.90, img: '🎤' },
  ],
  fitness: [
    { nome: 'Tapete de Yoga Premium', preco: 89.90, img: '🧘' },
    { nome: 'Kit Haleres Ajustáveis', preco: 399.90, img: '🏋️' },
    { nome: 'Corda de Pular Speed', preco: 49.90, img: '⛹️' },
    { nome: 'Garrafa Térmica 1L', preco: 59.90, img: '🧊' },
    { nome: 'Faixa Elástica Resistência', preco: 39.90, img: '🏃' },
    { nome: 'Balança Digital Smart', preco: 119.90, img: '⚖️' },
  ],
  cozinha: [
    { nome: 'Air Fryer Digital 5L', preco: 299.90, img: '🍟' },
    { nome: 'Mixer Turbo 1000W', preco: 129.90, img: '🥤' },
    { nome: 'Jogo de Facas Premium', preco: 199.90, img: '🔪' },
    { nome: 'Cafeteira Elétrica Programável', preco: 159.90, img: '☕' },
    { nome: 'Panela Elétrica Multifuncional', preco: 259.90, img: '🍲' },
    { nome: 'Kit Temperos Gourmet', preco: 49.90, img: '🧂' },
  ],
  pets: [
    { nome: 'Cama Ortopédica para Cães', preco: 149.90, img: '🛏️' },
    { nome: 'Brinquedo Interativo Pet', preco: 59.90, img: '🧸' },
    { nome: 'Comedouro Automático', preco: 199.90, img: '🍽️' },
    { nome: 'Coleira LED Recarregável', preco: 79.90, img: '🔦' },
    { nome: 'Arranhador para Gatos', preco: 129.90, img: '🐱' },
    { nome: 'Kit Higiene Pet Completo', preco: 89.90, img: '🧴' },
  ],
};

const PLATAFORMAS = [
  { id: 'shopee', nome: 'Shopee Afiliados', icone: '🛒' },
  { id: 'amazon', nome: 'Amazon Afiliados', icone: '📦' },
  { id: 'mercado-livre', nome: 'Mercado Livre Afiliados', icone: '🟡' },
  { id: 'aliexpress', nome: 'AliExpress Afiliados', icone: '🌍' },
  { id: 'tiktok', nome: 'TikTok', icone: '🎵' },
  { id: 'instagram', nome: 'Instagram', icone: '📸' },
  { id: 'pinterest', nome: 'Pinterest', icone: '📌' },
  { id: 'x', nome: 'X / Twitter', icone: '🐦' },
  { id: 'kwai', nome: 'Kwai', icone: '📱' },
  { id: 'facebook', nome: 'Facebook', icone: '📘' },
];

const PLATAFORMAS_POST = ['tiktok', 'instagram', 'pinterest', 'x', 'kwai', 'facebook'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function gerarHeadline(nicho, produto) {
  const h = {
    tecnologia: [`O ${produto.nome} que está bombando!`, `${produto.nome} com tecnologia de ponta`, `Oferta relâmpago: ${produto.nome}`],
    casa: [`Transforme seu lar com ${produto.nome}`, `${produto.nome} para uma casa moderna`, `O ${produto.nome} que sua casa merece`],
    beleza: [`Realce sua beleza com ${produto.nome}`, `${produto.nome} para cuidados premium`, `O segredo de beleza: ${produto.nome}`],
    gadgets: [`O gadget do momento: ${produto.nome}`, `${produto.nome} que vai facilitar sua vida`, `Descubra o ${produto.nome} inovador`],
    gamer: [`Domine o jogo com ${produto.nome}`, `${produto.nome} para seu setup gamer`, `Nível pro: ${produto.nome}`],
    fitness: [`Transforme seu treino com ${produto.nome}`, `${produto.nome} para resultados reais`, `Seu parceiro fitness: ${produto.nome}`],
    cozinha: [`O ${produto.nome} que sua cozinha precisa`, `Receitas incríveis com ${produto.nome}`, `${produto.nome} para arrasar na cozinha`],
    pets: [`Seu pet merece ${produto.nome}`, `O ${produto.nome} ideal para seu pet`, `Cuide do seu pet com ${produto.nome}`],
  };
  return pick(h[nicho] || [produto.nome]);
}

function gerarDescSEO(produto, nicho) {
  return `${produto.nome} original — o melhor em ${nicho}. Produto de alta qualidade com preço imperdível. Aproveite o frete grátis e condições especiais. Compre agora e transforme sua experiência!`;
}

function gerarTags(nicho, produto) {
  const base = ['oferta', 'promoção', 'desconto', 'frete grátis', 'compre agora', nicho, produto.nome.split(' ')[0].toLowerCase()];
  return [...new Set(base)];
}

function gerarTextoPost(plataforma, produto, link) {
  const map = {
    tiktok: `🔥 ${produto.img} ${produto.nome} COM DESCONTO!\n💰 De R$ ${(produto.preco * 1.4).toFixed(2)} por R$ ${produto.preco.toFixed(2)}\n🛒 Link na bio!\n#oferta #promoção #${produto.nome.split(' ')[0].toLowerCase()}`,
    instagram: `${produto.img} APROVEITE A OFERTA!\n\n✨ ${produto.nome}\n💵 R$ ${produto.preco.toFixed(2)}\n📦 Frete Grátis\n🎯 Link nos Stories\n\n#oferta #produto #promoção`,
    pinterest: `${produto.img} ${produto.nome} | Oferta Especial\nClique e compre com desconto!\nR$ ${produto.preco.toFixed(2)}`,
    x: `${produto.img} ${produto.nome} R$ ${produto.preco.toFixed(2)} | Frete Grátis\nLink: ${link}\n#oferta #promoção`,
    kwai: `${produto.img} ${produto.nome}\nDe R$ ${(produto.preco * 1.4).toFixed(2)} por R$ ${produto.preco.toFixed(2)}!\n🚀 Aproveite!\n#kwai #oferta`,
    facebook: `${produto.img} ${produto.nome}\n\n🔥 Oferta imperdível! De R$ ${(produto.preco * 1.4).toFixed(2)} por apenas R$ ${produto.preco.toFixed(2)}\n📦 Frete Grátis | 🚀 Entrega Rápida\n\nClique no link para comprar:\n${link}`,
  };
  return map[plataforma] || `${produto.img} ${produto.nome} — R$ ${produto.preco.toFixed(2)}`;
}

const AGENDA = {
  tiktok: { min: 3, max: 5 },
  instagram: { min: 2, max: 4 },
  pinterest: { min: 10, max: 10 },
  x: { min: 1, max: 2 },
  kwai: { min: 1, max: 2 },
  facebook: { min: 1, max: 2 },
};

const ESTILOS_THUMB = ['tiktok-shop', 'shopee', 'amazon'];
const MUSICAS_SUG = ['Sunny Day — Prod By Beat', 'Upbeat Vibes — Free Music', 'Trending 2025 — No Copyright', 'Lo-fi Study Beats', 'Eletro Pop — Royalty Free'];

function gerarRoteiro(produto) {
  return {
    hook: `🔥 ${produto.img} VOCÊ PRECISA DISSO!`,
    cena1: `Abertura: close no ${produto.nome}`,
    cena2: `Mostrando funcionalidades do ${produto.nome}`,
    cena3: `Antes e depois usando ${produto.nome}`,
    cena4: `Final: CTA com desconto`,
    legenda: `🚀 ${produto.nome} com frete grátis!\n💰 Apenas R$ ${produto.preco.toFixed(2)}\n🔗 Link na bio!`,
    musica: pick(MUSICAS_SUG),
    duracao: `${Math.floor(Math.random() * 15 + 15)}s`,
  };
}

export class AffiliateAgent {
  constructor() {
    this._running = false;
    this._timer = null;
    this._interval = 30000;
    this._cycleCount = 0;
    this._allPosts = [];
    this._allProducts = [];
    this._stores = [];
    this._scheduled = [];
    this._logs = [];
    this._learning = {
      melhoresNichos: [],
      melhoresPosts: [],
      produtosVirais: [],
      produtosRuins: [],
    };
    this._stats = {
      lojasCriadas: 0, produtosEncontrados: 0, postsGerados: 0,
      linksAfiliadosPendentes: 0, vendasMock: 0, comissaoMock: 0,
      cliquesMock: 0, ctrMock: 0, conversaoMock: 0,
    };
    this._topProdutos = {};
    this._topLojas = {};
    this._topPosts = [];
    this._mediaLibrary = { thumbnails: [], banners: [], stories: [], videos: [] };
    this._criativosStats = { totalCriativos: 0, thumbsGeradas: 0, bannersGerados: 0, storiesGeradas: 0, videosGerados: 0 };
    this._abTests = [];
    this._melhorThumbnail = null;
    this._melhorPlataforma = null;
  }

  get running() { return this._running; }
  get logs() { return [...this._logs]; }
  get stats() { return { ...this._stats }; }
  get allPosts() { return [...this._allPosts]; }
  get allProducts() { return [...this._allProducts]; }
  get stores() { return [...this._stores]; }
  get scheduled() { return [...this._scheduled]; }
  get cycleCount() { return this._cycleCount; }
  get learning() { return JSON.parse(JSON.stringify(this._learning)); }
  get topProdutos() { return { ...this._topProdutos }; }
  get topLojas() { return { ...this._topLojas }; }
  get topPosts() { return [...this._topPosts]; }
  get mediaLibrary() { return JSON.parse(JSON.stringify(this._mediaLibrary)); }
  get criativosStats() { return { ...this._criativosStats }; }
  get abTests() { return [...this._abTests]; }
  get melhorThumbnail() { return this._melhorThumbnail; }
  get melhorPlataforma() { return this._melhorPlataforma; }

  _log(tipo, msg) {
    this._logs.unshift({ tipo, msg, data: new Date().toLocaleTimeString('pt-BR'), timestamp: Date.now() });
    if (this._logs.length > 300) this._logs.pop();
  }

  _analisarTendencias() {
    const tendencia = pick(TRENDS);
    const nicho = pick(NICHOS);
    const produtoBase = pick(PRODUTOS[nicho.id]);
    this._log('info', `📈 Tendência detectada: ${produtoBase.nome} (${nicho.nome}) — ${tendencia}`);
    return { tendencia, nicho, produto: produtoBase };
  }

  _criarLoja(nicho) {
    if (this._stores.find(s => s.id === nicho.id)) return null;
    const produtos = PRODUTOS[nicho.id].map(p => ({
      ...p,
      id: Math.random().toString(36).slice(2, 8),
      headline: gerarHeadline(nicho.id, p),
      descSEO: gerarDescSEO(p, nicho.id),
      tags: gerarTags(nicho.id, p),
      slug: slugify(p.nome),
      thumbnail: p.img,
      linkAfiliado: null,
      status: 'demo',
      tendencia: pick(TRENDS),
      cliques: 0, conversoes: 0, viralScore: Math.random(),
    }));
    const store = {
      id: nicho.id, nome: nicho.nome, icone: nicho.icone, cor: nicho.cor,
      banner: `${nicho.icone} ${nicho.nome} — Loja Automática`,
      headline: `Melhores produtos de ${nicho.nome}`,
      produtos,
      posts: [],
      criadaEm: new Date().toLocaleString('pt-BR'),
      acessos: 0, vendas: 0,
    };
    this._stores.push(store);
    this._stats.lojasCriadas++;
    this._stats.produtosEncontrados += store.produtos.length;
    store.produtos.forEach(p => {
      this._allProducts.push(p);
      this._topProdutos[p.id] = p;
      this._log('info', `🎨 Gerando criativos IA para ${p.nome}...`);
      this._gerarCriativos(p, store);
    });
    this._log('success', `🏪 Loja "${nicho.nome}" criada com ${store.produtos.length} produtos e criativos`);
    return store;
  }

  _gerarPosts(store) {
    let count = 0;
    store.produtos.forEach(prod => {
      const trendPick = Math.random() > 0.5;
      const plataformas = trendPick ? PLATAFORMAS_POST : [pick(PLATAFORMAS_POST)];
      plataformas.forEach(plat => {
        const link = `https://seu-link-afiliado.com/${store.id}/${prod.id}`;
        const texto = gerarTextoPost(plat, prod, link);
        const post = {
          id: Math.random().toString(36).slice(2, 10),
          produto: prod.nome, produtoId: prod.id,
          loja: store.nome, lojaId: store.id,
          plataforma: plat, texto, link,
          geradoEm: new Date().toLocaleString('pt-BR'),
          publicado: false, agendadoPara: null,
          cliques: 0, viral: Math.random() > 0.7,
        };
        if (AGENDA[plat]) {
          const hora = Math.floor(Math.random() * 12 + 8);
          const minuto = Math.floor(Math.random() * 60);
          post.agendadoPara = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
        }
        store.posts.push(post);
        this._allPosts.push(post);
        this._scheduled.push(post);
        count++;
        this._stats.postsGerados++;
        if (post.viral) {
          this._learning.produtosVirais.push(prod.nome);
          this._log('warn', `🔥 Produto viral detectado: ${prod.nome}`);
        }
        this._log('info', `📝 Post criado para ${prod.nome} → ${plat} ${post.agendadoPara ? 'às ' + post.agendadoPara : ''}`);
      });
    });
    this._log('success', `✅ ${count} posts gerados para ${store.nome}`);
  }

  _simularAnalytics() {
    this._stores.forEach(store => {
      store.acessos += Math.floor(Math.random() * 50 + 10);
      store.vendas += Math.floor(Math.random() * 8);
      store.produtos.forEach(prod => {
        const cls = Math.floor(Math.random() * 20 + 1);
        const conv = Math.floor(Math.random() * 5);
        prod.cliques += cls;
        prod.conversoes += conv;
        this._stats.cliquesMock += cls;
        if (conv > 0) this._stats.conversaoMock += conv;
      });
    });
    this._simularCliquesCriativos();
    this._stats.ctrMock = this._stats.cliquesMock > 0
      ? ((this._stats.conversaoMock / this._stats.cliquesMock) * 100)
      : 0;
    const v = Math.floor(Math.random() * 5) + 1;
    this._stats.vendasMock += v;
    this._stats.comissaoMock += v * (Math.random() * 15 + 5);
    this._stats.linksAfiliadosPendentes = this._allProducts.length * 2;
    this._atualizarTop();
    this._log('info', `📊 Analytics atualizados | CTR: ${this._stats.ctrMock.toFixed(1)}% | Cliques: ${this._stats.cliquesMock}`);
  }

  _atualizarTop() {
    this._topProdutos = {};
    this._stores.forEach(s => s.produtos.forEach(p => { this._topProdutos[p.id] = p; }));
    this._topLojas = {};
    this._stores.forEach(s => { this._topLojas[s.id] = s; });
    const sorted = [...this._allPosts].sort((a, b) => b.cliques - a.cliques);
    this._topPosts = sorted.slice(0, 5);
  }

  _aprender() {
    const nichoCount = {};
    this._stores.forEach(s => {
      const totalVendas = s.produtos.reduce((acc, p) => acc + p.conversoes, 0);
      if (totalVendas > 0) nichoCount[s.nome] = totalVendas;
    });
    this._learning.melhoresNichos = Object.entries(nichoCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    const viralPosts = this._allPosts.filter(p => p.viral);
    this._learning.melhoresPosts = [...new Set(viralPosts.map(p => p.produto))].slice(0, 5);
    const ruins = this._allProducts
      .filter(p => p.conversoes === 0 && p.cliques > 5)
      .map(p => p.nome);
    this._learning.produtosRuins = ruins.slice(0, 5);
    if (ruins.length > 0) this._log('warn', `🧠 Aprendizado: ${ruins.length} produto(s) marcado(s) como baixo desempenho`);
    if (this._learning.melhoresNichos.length > 0) {
      this._log('success', `🧠 Nichos com melhor performance: ${this._learning.melhoresNichos.join(', ')}`);
    }
  }

  _gerarThumbnail(produto, store, estilo) {
    const variantes = {
      'tiktok-shop': {
        estilo: 'TikTok Shop',
        desc: `${produto.img} ${produto.nome} — Fundo vibrante, badge "TOP" "${Math.floor(Math.random() * 50 + 10)}% OFF"`,
        cor: '#fe2c55', rating: (Math.random() * 2 + 3).toFixed(1), vendas: Math.floor(Math.random() * 5000 + 500),
      },
      shopee: {
        estilo: 'Shopee Anúncio',
        desc: `${produto.img} ${produto.nome} — Fundo branco, badge "Frete Grátis" "Env. ${pick(['Hoje', '24h', '48h'])}"`,
        cor: '#ee4d2d', rating: (Math.random() * 1.5 + 3.5).toFixed(1), vendas: Math.floor(Math.random() * 3000 + 200),
      },
      amazon: {
        estilo: 'Amazon Anúncio',
        desc: `${produto.img} ${produto.nome} — Fundo limpo, badge "Best Seller" "Nota ${(Math.random() * 1 + 4).toFixed(1)}"`,
        cor: '#ff9900', rating: (Math.random() * 1 + 4).toFixed(1), vendas: Math.floor(Math.random() * 8000 + 1000),
      },
    };
    const v = variantes[estilo] || variantes['tiktok-shop'];
    return {
      id: Math.random().toString(36).slice(2, 10),
      produtoId: produto.id, produtoNome: produto.nome, loja: store.nome,
      estilo: v.estilo, desc: v.desc, cor: v.cor, rating: v.rating, vendas: v.vendas,
      cliques: 0, ctr: 0, criadoEm: new Date().toLocaleString('pt-BR'),
    };
  }

  _gerarBanner(produto, store) {
    const ofertas = [`${Math.floor(Math.random() * 40 + 10)}% OFF`, `Leve 2 pague 1`, `Frete Grátis`, `Parcele em ${Math.floor(Math.random() * 6 + 3)}x`];
    return {
      id: Math.random().toString(36).slice(2, 10),
      produtoId: produto.id, produtoNome: produto.nome, loja: store.nome,
      headline: gerarHeadline(store.id, produto),
      oferta: pick(ofertas),
      cta: pick(['Compre Agora', 'Aproveitar Oferta', 'Garantir Desconto', 'Quero o Meu']),
      estilo: pick(['Moderno', 'Minimalista', 'Promocional', 'Premium']),
      dimensao: '1200x628',
      cliques: 0, criadoEm: new Date().toLocaleString('pt-BR'),
    };
  }

  _gerarStory(produto, store) {
    return {
      id: Math.random().toString(36).slice(2, 10),
      produtoId: produto.id, produtoNome: produto.nome, loja: store.nome,
      dimensao: '1080x1920',
      headline: `${produto.img} ${gerarHeadline(store.id, produto)}`,
      cta: 'Arraste pra cima',
      cor: pick(['#000000', '#1a1a2e', '#16213e', '#0f3460']),
      cliques: 0, criadoEm: new Date().toLocaleString('pt-BR'),
    };
  }

  _gerarVideoMock(produto, store) {
    const roteiro = gerarRoteiro(produto);
    return {
      id: Math.random().toString(36).slice(2, 10),
      produtoId: produto.id, produtoNome: produto.nome, loja: store.nome,
      roteiro,
      formato: pick(['TikTok 9:16', 'Reels 9:16', 'Shorts 9:16']),
      resolucao: '1080x1920',
      fps: 30,
      cliques: 0, visualizacoes: Math.floor(Math.random() * 2000 + 100),
      criadoEm: new Date().toLocaleString('pt-BR'),
    };
  }

  _gerarCriativos(produto, store) {
    const thumbs = ESTILOS_THUMB.map(e => this._gerarThumbnail(produto, store, e));
    thumbs.forEach(t => {
      this._mediaLibrary.thumbnails.push(t);
      this._criativosStats.thumbsGeradas++;
      this._criativosStats.totalCriativos++;
    });
    const banner = this._gerarBanner(produto, store);
    this._mediaLibrary.banners.push(banner);
    this._criativosStats.bannersGerados++;
    this._criativosStats.totalCriativos++;

    const story = this._gerarStory(produto, store);
    this._mediaLibrary.stories.push(story);
    this._criativosStats.storiesGeradas++;
    this._criativosStats.totalCriativos++;

    const video = this._gerarVideoMock(produto, store);
    this._mediaLibrary.videos.push(video);
    this._criativosStats.videosGerados++;
    this._criativosStats.totalCriativos++;

    const abId = Math.random().toString(36).slice(2, 8);
    const abTest = {
      id: abId, produtoId: produto.id, produtoNome: produto.nome, loja: store.nome,
      variantes: thumbs.map(t => ({
        thumbnailId: t.id, estilo: t.estilo, titulo: gerarHeadline(store.id, produto),
        cliques: 0, impressoes: 0, ctr: 0,
      })),
      vencedor: null, criadoEm: new Date().toLocaleString('pt-BR'),
    };
    this._abTests.push(abTest);

    this._log('info', `🎨 Criativos gerados para ${produto.nome}: ${thumbs.length} thumbs, banner, story, vídeo`);
    return { thumbs, banner, story, video, abTest };
  }

  _simularCliquesCriativos() {
    this._mediaLibrary.thumbnails.forEach(t => {
      const imp = Math.floor(Math.random() * 500 + 50);
      const cl = Math.floor(Math.random() * imp * 0.3);
      t.cliques += cl;
      t.ctr = imp > 0 ? (cl / imp) * 100 : 0;
    });
    this._mediaLibrary.banners.forEach(b => {
      b.cliques += Math.floor(Math.random() * 150 + 10);
    });
    this._mediaLibrary.stories.forEach(s => {
      s.cliques += Math.floor(Math.random() * 80 + 5);
    });
    this._abTests.forEach(test => {
      test.variantes.forEach(v => {
        const imp = Math.floor(Math.random() * 300 + 30);
        const cl = Math.floor(Math.random() * imp * 0.25);
        v.impressoes += imp;
        v.cliques += cl;
        v.ctr = imp > 0 ? (cl / imp) * 100 : 0;
      });
      const sorted = [...test.variantes].sort((a, b) => b.ctr - a.ctr);
      test.vencedor = sorted[0]?.estilo || null;
    });
    const thumbsCtr = this._mediaLibrary.thumbnails.filter(t => t.ctr > 0);
    if (thumbsCtr.length > 0) {
      const best = thumbsCtr.reduce((a, b) => (a.ctr || 0) > (b.ctr || 0) ? a : b);
      this._melhorThumbnail = best.estilo;
      this._log('info', `🏆 Melhor thumbnail: "${best.estilo}" com CTR de ${best.ctr.toFixed(1)}%`);
    }
  }

  _ciclo() {
    if (!this._running) return;
    this._cycleCount++;
    this._log('info', `🔄 --- Ciclo #${this._cycleCount} ---`);

    const analise = this._analisarTendencias();

    const pendentes = NICHOS.filter(n => !this._stores.find(s => s.id === n.id));
    if (pendentes.length > 0 && Math.random() > 0.3) {
      const nicho = pick(pendentes);
      this._log('info', `🏗️ Criando loja automática para ${nicho.nome}...`);
      const store = this._criarLoja(nicho);
      if (store) this._gerarPosts(store);
    } else {
      this._log('info', '⏳ Nenhum novo nicho selecionado neste ciclo');
    }

    if (this._cycleCount > 1) {
      this._simularAnalytics();
      this._aprender();
    }

    const pendAgenda = this._scheduled.filter(p => !p.publicado);
    if (pendAgenda.length > 0 && Math.random() > 0.5) {
      const toPub = pendAgenda.slice(0, Math.floor(Math.random() * 3 + 1));
      toPub.forEach(p => { p.publicado = true; });
      this._log('success', `📅 ${toPub.length} post(s) publicados automaticamente`);
    }

    this._log('success', `✅ Ciclo #${this._cycleCount} concluído`);
  }

  gerarDadosIniciais() {
    if (this._stores.length > 0) return;
    this._log('success', '🚀 Iniciando geração de dados iniciais...');
    const primeirosNichos = NICHOS.filter(n => ['tecnologia', 'casa', 'beleza', 'gadgets', 'gamer'].includes(n.id));
    const alvo = primeirosNichos.slice(0, 3);
    alvo.forEach(n => {
      this._log('info', `🔍 Analisando nicho: ${n.nome}...`);
      const store = this._criarLoja(n);
      if (store) {
        this._log('info', `📱 Gerando posts para ${n.nome}...`);
        this._gerarPosts(store);
      }
    });
    this._log('info', '📊 Simulando métricas iniciais...');
    this._simularAnalytics();
    this._aprender();
    this._log('success', `✅ Dados iniciais gerados: ${this._stats.lojasCriadas} lojas, ${this._stats.produtosEncontrados} produtos, ${this._stats.postsGerados} posts, ${this._criativosStats.totalCriativos} criativos IA`);
    this._cycleCount = 1;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._log('success', '🚀 Agente Afiliado Inteligente iniciado');
    this.gerarDadosIniciais();
    this._ciclo();
    this._timer = setInterval(() => this._ciclo(), this._interval);
  }

  stop() {
    this._running = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._log('warn', '⏹️ Agente Afiliado parado');
  }

  executarAgora() {
    this._ciclo();
  }
}

export { NICHOS, PRODUTOS, PLATAFORMAS, PLATAFORMAS_POST, AGENDA };
