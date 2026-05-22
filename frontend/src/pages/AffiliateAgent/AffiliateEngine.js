const NICHOS = [
  { id: 'tech', nome: 'Tecnologia', icone: '💻', cor: '#2563eb' },
  { id: 'casa', nome: 'Casa & Decor', icone: '🏠', cor: '#059669' },
  { id: 'moda', nome: 'Moda & Acessórios', icone: '👗', cor: '#d97706' },
  { id: 'gamer', nome: 'Gamer', icone: '🎮', cor: '#7c3aed' },
  { id: 'beleza', nome: 'Beleza & Saúde', icone: '💄', cor: '#e11d48' },
];

const PRODUTOS = {
  tech: [
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
  moda: [
    { nome: 'Relógio Digital Esportivo', preco: 149.90, img: '⌚' },
    { nome: 'Mochila Executiva Couro', preco: 259.90, img: '🎒' },
    { nome: 'Óculos Polarizado Premium', preco: 99.90, img: '🕶️' },
    { nome: 'Cinto Couro Legítimo', preco: 79.90, img: '🔗' },
    { nome: 'Bolsa Transversal Casual', preco: 189.90, img: '👜' },
    { nome: 'Tênis Casual Confort', preco: 219.90, img: '👟' },
  ],
  gamer: [
    { nome: 'Headset Gamer 7.1 RGB', preco: 299.90, img: '🎧' },
    { nome: 'Mousepad Gamer XXL', preco: 89.90, img: '🖱️' },
    { nome: 'Controle Pro Sem Fio', preco: 349.90, img: '🎮' },
    { nome: 'Cadeira Gamer Ergônomica', preco: 1299.90, img: '💺' },
    { nome: 'Suporte Articulado Monitor', preco: 159.90, img: '🖥️' },
    { nome: 'Microfone Condensador USB', preco: 199.90, img: '🎤' },
  ],
  beleza: [
    { nome: 'Secador de Cabelo Profissional', preco: 179.90, img: '💇' },
    { nome: 'Barbeador Elétrico à Prova d\'Água', preco: 199.90, img: '🪒' },
    { nome: 'Kit Escova Modeladora', preco: 89.90, img: '🪮' },
    { nome: 'Vaporizador Facial', preco: 129.90, img: '🧖' },
    { nome: 'Massageador Corporal', preco: 149.90, img: '💆' },
    { nome: 'Aparelho de Depilação a Laser', preco: 399.90, img: '✨' },
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
];

function rnd(seed) {
  let s = seed || 0;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function gerarTituloSEO(produto, nicho) {
  const prefixos = {
    tech: ['Oferta Imperdível', 'Melhor Preço', 'Top de Linha', 'Lançamento'],
    casa: ['Transforme sua Casa', 'Oferta Especial', 'Conforto e Estilo'],
    moda: ['Estilo em Alta', 'Peça Essencial', 'Imperdível'],
    gamer: ['Domine o Jogo', 'Setup Perfeito', 'Nível Pro'],
    beleza: ['Realce sua Beleza', 'Cuidado Premium', 'Oferta Especial'],
  };
  const p = prefixos[nicho] || ['Oferta'];
  const r = rnd(nicho.charCodeAt(0) + produto.nome.length);
  return `${p[Math.floor(r() * p.length)]}: ${produto.nome} com ${Math.floor(r() * 30 + 20)}% OFF`;
}

function gerarDescricao(produto) {
  const r = rnd(produto.nome.length);
  const beneficios = ['qualidade premium', 'design moderno', 'alta durabilidade', 'melhor custo-benefício', 'tecnologia de ponta'];
  return `${produto.nome} — produto com ${beneficios[Math.floor(r() * beneficios.length)]}. Ideal para uso diário, oferece conforto e performance. Aproveite a oferta limitada!`;
}

function gerarTextoPost(plataforma, produto, link) {
  const textos = {
    tiktok: `🔥 ${produto.img} ${produto.nome} COM DESCONTO!\n💰 De R$ ${(produto.preco * 1.4).toFixed(2)} por R$ ${produto.preco.toFixed(2)}\n🛒 Link na bio!\n#oferta #promoção #${produto.nome.split(' ')[0].toLowerCase()}`,
    instagram: `${produto.img} APROVEITE A OFERTA!\n\n✨ ${produto.nome}\n💵 R$ ${produto.preco.toFixed(2)}\n📦 Frete Grátis\n🎯 Link nos Stories\n\n#oferta #produto #promoção`,
    pinterest: `${produto.img} ${produto.nome} | Oferta Especial\nClique e compre com desconto!\nR$ ${produto.preco.toFixed(2)}`,
    x: `${produto.img} ${produto.nome}\nR$ ${produto.preco.toFixed(2)} | Frete Grátis\nLink: ${link}\n#oferta #promoção`,
    kwai: `${produto.img} ${produto.nome}\nDe R$ ${(produto.preco * 1.4).toFixed(2)} por R$ ${produto.preco.toFixed(2)}!\n🚀 Aproveite!\n#kwai #oferta`,
  };
  return textos[plataforma] || `${produto.img} ${produto.nome} — R$ ${produto.preco.toFixed(2)}`;
}

export class AffiliateAgent {
  constructor() {
    this._running = false;
    this._timer = null;
    this._interval = 45000;
    this._cycleCount = 0;
    this._allPosts = [];
    this._allProducts = [];
    this._stores = [];
    this._logs = [];
    this._stats = {
      lojasCriadas: 0, produtosEncontrados: 0, postsGerados: 0,
      linksAfiliadosPendentes: 0, vendasMock: 0, comissaoMock: 0,
    };
  }

  get running() { return this._running; }
  get logs() { return [...this._logs]; }
  get stats() { return { ...this._stats }; }
  get allPosts() { return [...this._allPosts]; }
  get allProducts() { return [...this._allProducts]; }
  get stores() { return [...this._stores]; }
  get cycleCount() { return this._cycleCount; }

  _log(tipo, msg) {
    this._logs.unshift({ tipo, msg, data: new Date().toLocaleTimeString('pt-BR'), timestamp: Date.now() });
    if (this._logs.length > 300) this._logs.pop();
  }

  _criarLoja(nicho) {
    if (this._stores.find(s => s.id === nicho.id)) return;
    const store = {
      id: nicho.id,
      nome: nicho.nome,
      icone: nicho.icone,
      cor: nicho.cor,
      produtos: PRODUTOS[nicho.id].map(p => ({
        ...p,
        id: Math.random().toString(36).slice(2, 8),
        tituloSEO: gerarTituloSEO(p, nicho.id),
        descricao: gerarDescricao(p),
        linkAfiliado: null,
        status: 'demo',
      })),
      posts: [],
      criadaEm: new Date().toLocaleString('pt-BR'),
    };
    this._stores.push(store);
    this._stats.lojasCriadas++;
    this._stats.produtosEncontrados += store.produtos.length;
    this._log('success', `Loja "${nicho.nome}" criada com ${store.produtos.length} produtos`);
  }

  _gerarPosts() {
    this._stores.forEach(store => {
      store.produtos.forEach(prod => {
        const link = `https://seu-link-afiliado.com/${store.id}/${prod.id}`;
        const plataformas = ['tiktok', 'instagram', 'pinterest', 'x', 'kwai'];
        plataformas.forEach(plat => {
          const texto = gerarTextoPost(plat, prod, link);
          const post = {
            id: Math.random().toString(36).slice(2, 10),
            produto: prod.nome,
            plataforma: plat,
            texto,
            link,
            geradoEm: new Date().toLocaleString('pt-BR'),
            publicado: false,
          };
          store.posts.push(post);
          this._allPosts.push(post);
          this._stats.postsGerados++;
        });
      });
    });
    this._log('success', `${this._allPosts.length} posts gerados no total`);
  }

  _simularVendas() {
    const v = Math.floor(Math.random() * 5) + 1;
    this._stats.vendasMock += v;
    this._stats.comissaoMock += v * (Math.random() * 15 + 5);
    this._stats.linksAfiliadosPendentes = this._allProducts.length * 2;
    this._log('info', `${v} vendas simuladas | Comissão: R$ ${this._stats.comissaoMock.toFixed(2)}`);
  }

  _ciclo() {
    if (!this._running) return;
    this._cycleCount++;
    this._log('info', `--- Ciclo #${this._cycleCount} ---`);
    this._log('info', 'Analisando nichos lucrativos...');
    const pendentes = NICHOS.filter(n => !this._stores.find(s => s.id === n.id));
    if (pendentes.length > 0) {
      const nicho = pendentes[Math.floor(Math.random() * pendentes.length)];
      this._criarLoja(nicho);
    } else {
      this._log('info', 'Todas as lojas já foram criadas');
    }
    if (this._allPosts.length === 0) this._gerarPosts();
    if (this._cycleCount > 1) this._simularVendas();
    this._log('success', 'Ciclo concluído');
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._log('success', 'Agente Afiliado iniciado');
    this._ciclo();
    this._timer = setInterval(() => this._ciclo(), this._interval);
  }

  stop() {
    this._running = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this._log('warn', 'Agente Afiliado parado');
  }

  executarAgora() {
    this._ciclo();
  }
}

export { NICHOS, PRODUTOS, PLATAFORMAS };
