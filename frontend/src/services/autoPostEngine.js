const SOCIAL_PLATFORMS = [
  { id: 'tiktok', nome: 'TikTok', icone: '🎵', cor: '#000000', maxDiario: 5, intervaloMin: 120, tipo: 'video' },
  { id: 'instagram', nome: 'Instagram', icone: '📸', cor: '#e1306c', maxDiario: 4, intervaloMin: 90, tipo: 'post' },
  { id: 'pinterest', nome: 'Pinterest', icone: '📌', cor: '#e60023', maxDiario: 15, intervaloMin: 15, tipo: 'pin' },
  { id: 'facebook', nome: 'Facebook Page', icone: '📘', cor: '#1877f2', maxDiario: 4, intervaloMin: 60, tipo: 'post' },
  { id: 'youtube', nome: 'YouTube Shorts', icone: '▶️', cor: '#ff0000', maxDiario: 3, intervaloMin: 120, tipo: 'short' },
];

const HASHTAGS_POPULARES = [
  '#oferta', '#promoção', '#desconto', '#fretegrátis', '#produto',
  '#viral', '#trending', '#compreagora', '#imperdível', '#top',
];

const CTAS = ['Compre agora', 'Aproveite a oferta', 'Clique no link', 'Garanta o seu', 'Não perca', 'Corre que é limitado'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function genId() { return Math.random().toString(36).slice(2, 10); }

const LS_SOCIAL_KEY = 'brane_social_connections';

export function loadSocialConnections() {
  try { const d = localStorage.getItem(LS_SOCIAL_KEY); return d ? JSON.parse(d) : null; } catch { return null; }
}

export function saveSocialConnections(conns) {
  try { localStorage.setItem(LS_SOCIAL_KEY, JSON.stringify(conns)); return true; } catch { return false; }
}

function gerarTituloViral(produtoNome, plataforma) {
  const templates = {
    tiktok: [`${pick(['🔥', '⚡', '💥'])} ${produtoNome} que ${pick(['todo mundo', 'ninguém', 'você'])} precisa!`, `O ${produtoNome} mais ${pick(['viral', 'desejado', 'compartilhado'])} do momento!`],
    instagram: [`✨ Transforme seu dia com ${produtoNome}`, `${pick(['Descubra', 'Conheça', 'Aproveite'])} o ${produtoNome} que ${pick(['está bombando', 'vai mudar tudo', 'você vai amar'])}`],
    pinterest: [`${produtoNome} | ${pick(['Oferta', 'Promoção', 'Desconto'])} Especial`, `${pick(['Como usar', 'Melhor preço', 'Onde comprar'])} ${produtoNome}`],
    facebook: [`${produtoNome} — ${pick(['Oferta imperdível', 'Melhor preço da web', 'Frete grátis'])}`, `🔥 ${pick(['Você conhece', 'Já viu', 'Sabe o que é'])} ${produtoNome}?`],
    youtube: [`${pick(['ISSO SIM', 'VOCÊ PRECISA', 'NÃO ACREDITA'])} QUE ${produtoNome.toUpperCase()} FAZ!`, `${produtoNome} — ${pick(['Vale a pena?', 'Review completo', 'Testei por 30 dias'])}`],
  };
  const opts = templates[plataforma] || [produtoNome];
  return pick(opts);
}

function gerarLegenda(produtoNome, preco, plataforma) {
  const descs = {
    tiktok: `${produtoNome} original com frete grátis!\n💰 R$ ${preco.toFixed(2)} na promoção!\n🔥 Aproveite antes de acabar!\n\n#produto #oferta`,
    instagram: `💎 ${produtoNome}\n\n💰 R$ ${preco.toFixed(2)}\n📦 Frete Grátis\n🎯 Link na bio\n\nTransforme sua vida com esse produto incrível!`,
    pinterest: `${produtoNome}\nPreço especial: R$ ${preco.toFixed(2)}\nClique e compre com desconto!`,
    facebook: `🔥 ${produtoNome}\n\n💰 De R$ ${(preco * 1.3).toFixed(2)} por apenas R$ ${preco.toFixed(2)}\n📦 Frete Grátis para todo Brasil\n🎯 Garanta o seu agora!\n\nLink nos comentários 🔗`,
    youtube: `📦 ${produtoNome}\n💰 Preço: R$ ${preco.toFixed(2)}\n👍 Se gostou, compartilhe!\n🔗 Link na descrição`,
  };
  return descs[plataforma] || produtoNome;
}

function gerarHashtags(produtoNome, plataforma) {
  const tags = [
    `#${produtoNome.split(' ')[0].toLowerCase()}`,
    '#oferta', '#promoção', '#fretegrátis',
    ...HASHTAGS_POPULARES.sort(() => Math.random() - 0.5).slice(0, 4),
  ];
  if (plataforma === 'tiktok' || plataforma === 'instagram') {
    tags.push('#viral', '#trending', '#fyp');
  }
  return [...new Set(tags)].slice(0, 10);
}

function gerarThumbnailSocial(produtoNome, plataforma) {
  const cores = { tiktok: '#fe2c55', instagram: '#e1306c', pinterest: '#e60023', facebook: '#1877f2', youtube: '#ff0000' };
  return { cor: cores[plataforma] || '#333', texto: produtoNome.split(' ').slice(0, 2).join(' '), estilo: plataforma };
}

export class AutoPostEngine {
  constructor() {
    this._connections = {};
    this._schedule = [];
    this._published = [];
    this._failed = [];
    this._stats = { totalProgramados: 0, totalPublicados: 0, totalFalhas: 0, totalPlataformas: 0 };
    this._dailyCount = {};
    this._lastPostTime = {};
    this._running = false;
    this._timer = null;
    this._load();
  }

  get connections() { return { ...this._connections }; }
  get schedule() { return [...this._schedule]; }
  get published() { return [...this._published]; }
  get failed() { return [...this._failed]; }
  get stats() { return { ...this._stats }; }
  get running() { return this._running; }

  _load() {
    const saved = loadSocialConnections();
    if (saved) this._connections = saved;
  }

  setConnection(id, data) {
    this._connections[id] = { ...(this._connections[id] || {}), ...data };
    saveSocialConnections(this._connections);
    const connected = Object.values(this._connections).filter(c => c.status === 'conectado').length;
    this._stats.totalPlataformas = connected;
  }

  disconnect(id) {
    delete this._connections[id];
    saveSocialConnections(this._connections);
    const connected = Object.values(this._connections).filter(c => c.status === 'conectado').length;
    this._stats.totalPlataformas = connected;
  }

  _podePublicar(plataforma) {
    const plat = SOCIAL_PLATFORMS.find(p => p.id === plataforma);
    if (!plat) return { ok: false, motivo: 'Plataforma não suportada' };
    const hoje = new Date().toDateString();
    if (!this._dailyCount[hoje]) this._dailyCount[hoje] = {};
    if (!this._dailyCount[hoje][plataforma]) this._dailyCount[hoje][plataforma] = 0;
    if (this._dailyCount[hoje][plataforma] >= plat.maxDiario) {
      return { ok: false, motivo: `Limite diário atingido (${plat.maxDiario}/${plat.maxDiario})` };
    }
    const ultimo = this._lastPostTime[plataforma] || 0;
    if (Date.now() - ultimo < plat.intervaloMin * 60 * 1000) {
      const falta = Math.ceil((plat.intervaloMin * 60 * 1000 - (Date.now() - ultimo)) / 60000);
      return { ok: false, motivo: `Aguardar ${falta} min para próximo post` };
    }
    return { ok: true };
  }

  generatePost(produtoNome, preco, plataforma, loja) {
    const titulo = gerarTituloViral(produtoNome, plataforma);
    const legenda = gerarLegenda(produtoNome, preco, plataforma);
    const hashtags = gerarHashtags(produtoNome, plataforma);
    const cta = pick(CTAS);
    const thumbnail = gerarThumbnailSocial(produtoNome, plataforma);
    return {
      id: genId(),
      plataforma,
      titulo,
      legenda,
      hashtags,
      cta,
      thumbnail,
      produtoNome,
      loja,
      preco,
      criadoEm: new Date().toISOString(),
      agendadoPara: null,
      status: 'rascunho',
    };
  }

  schedulePost(produtoNome, preco, plataforma, loja, horario) {
    const post = this.generatePost(produtoNome, preco, plataforma, loja);
    post.agendadoPara = horario || new Date(Date.now() + Math.random() * 4 * 60 * 60 * 1000).toISOString();
    post.status = 'agendado';
    this._schedule.push(post);
    this._stats.totalProgramados++;
    return post;
  }

  async publishPost(post) {
    const check = this._podePublicar(post.plataforma);
    if (!check.ok) {
      this._failed.push({ ...post, motivo: check.motivo, falhouEm: new Date().toISOString() });
      this._stats.totalFalhas++;
      return { success: false, motivo: check.motivo };
    }
    await new Promise(r => setTimeout(r, 500 + Math.random() * 2000));
    const hoje = new Date().toDateString();
    if (!this._dailyCount[hoje]) this._dailyCount[hoje] = {};
    this._dailyCount[hoje][post.plataforma] = (this._dailyCount[hoje][post.plataforma] || 0) + 1;
    this._lastPostTime[post.plataforma] = Date.now();
    const publicado = {
      ...post,
      status: 'publicado',
      publicadoEm: new Date().toISOString(),
      visualizacoes: Math.floor(Math.random() * 500 + 50),
      cliques: Math.floor(Math.random() * 30 + 2),
    };
    this._published.push(publicado);
    this._schedule = this._schedule.filter(s => s.id !== post.id);
    this._stats.totalPublicados++;
    return { success: true, post: publicado };
  }

  async retryFailedPost(postId) {
    const failed = this._failed.find(f => f.id === postId);
    if (!failed) return { success: false, motivo: 'Post não encontrado' };
    this._failed = this._failed.filter(f => f.id !== postId);
    return await this.publishPost(failed);
  }

  async processSchedule() {
    const agora = new Date();
    const pendentes = this._schedule.filter(p =>
      p.status === 'agendado' && new Date(p.agendadoPara) <= agora
    );
    const results = [];
    for (const post of pendentes.slice(0, 3)) {
      const result = await this.publishPost(post);
      results.push(result);
    }
    return results;
  }

  startAutoPublish(intervalMs = 60000) {
    if (this._running) return;
    this._running = true;
    this._timer = setInterval(async () => {
      await this.processSchedule();
    }, intervalMs);
  }

  stopAutoPublish() {
    this._running = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  gerarPostsParaLoja(store) {
    const posts = [];
    const sociais = SOCIAL_PLATFORMS.filter(p => this._connections[p.id]?.status === 'conectado');
    if (sociais.length === 0) return posts;
    store.produtos.slice(0, 3).forEach(prod => {
      sociais.forEach(plat => {
        const horario = new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString();
        const post = this.schedulePost(prod.nome, prod.preco, plat.id, store.nome, horario);
        posts.push(post);
      });
    });
    return posts;
  }
}

export { SOCIAL_PLATFORMS };
