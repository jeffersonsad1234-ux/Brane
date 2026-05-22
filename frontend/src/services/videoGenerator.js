function genId() { return Math.random().toString(36).slice(2, 10); }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const MUSICAS = [
  { nome: 'Upbeat Summer — Royalty Free', bpm: 128, vibe: 'energética' },
  { nome: 'Trending Beats — No Copyright', bpm: 140, vibe: 'viral' },
  { nome: 'Soft Piano — Free Music', bpm: 72, vibe: 'emocional' },
  { nome: 'Eletro Pop — Prod Beat', bpm: 120, vibe: 'moderna' },
  { nome: 'Lo-fi Study — Sem Direitos', bpm: 90, vibe: 'descontraída' },
];

const PESSOAS = {
  tecnologia: { nome: 'Ana', idade: 28, estilo: 'jovem criativa em home office', tom: 'entusiasmada' },
  casa: { nome: 'Carla', idade: 35, estilo: 'mulher realista em sala decorada', tom: 'calma' },
  beleza: { nome: 'Julia', idade: 25, estilo: 'influenciadora digital', tom: 'animada' },
  gadgets: { nome: 'Lucas', idade: 30, estilo: 'jovem urbano moderno', tom: 'surpreso' },
  gamer: { nome: 'Rafael', idade: 22, estilo: 'gamer em quarto RGB', tom: 'energético' },
  fitness: { nome: 'Mariana', idade: 27, estilo: 'atleta em academia', tom: 'motivacional' },
  cozinha: { nome: 'Paulo', idade: 40, estilo: 'chef profissional', tom: 'confiante' },
  pets: { nome: 'Fernanda', idade: 32, estilo: 'dona de casa com cachorro', tom: 'afetiva' },
};

function gerarCenas(produtoNome, preco, categoria, descricao) {
  const cenas = [
    {
      id: 1,
      tipo: 'abertura',
      duracao: 4 + Math.random() * 3,
      descricao: `Pessoa apresentando o produto com entusiasmo`,
      narracao: `Você precisa conhecer ${produtoNome}!`,
      legenda: `${produtoNome} — você precisa disso!`,
      cor: '#1a1a2e',
      emoji: '🎬',
    },
    {
      id: 2,
      tipo: 'produto',
      duracao: 5 + Math.random() * 3,
      descricao: `Close no produto com destaque visual`,
      narracao: `${descricao || `O ${produtoNome} é simplesmente incrível!`}`,
      legenda: `${descricao ? descricao.split('.')[0] : `Produto de alta qualidade`}`,
      cor: '#16213e',
      emoji: '📦',
    },
    {
      id: 3,
      tipo: 'beneficio',
      duracao: 5 + Math.random() * 3,
      descricao: `Pessoa usando o produto e mostrando os benefícios`,
      narracao: `Você vai amar a praticidade e qualidade desse produto.`,
      legenda: `Qualidade e praticidade que você merece`,
      cor: '#0f3460',
      emoji: '✨',
    },
    {
      id: 4,
      tipo: 'preco',
      duracao: 4 + Math.random() * 2,
      descricao: `Tela com preço e oferta destacados`,
      narracao: `E o melhor: está saindo por apenas R$ ${preco.toFixed(2)}!`,
      legenda: `De R$ ${(preco * 1.4).toFixed(2)} por apenas R$ ${preco.toFixed(2)}`,
      cor: '#1a1a40',
      emoji: '💰',
    },
    {
      id: 5,
      tipo: 'cta',
      duracao: 4 + Math.random() * 2,
      descricao: `Final com call to action e link da loja`,
      narracao: `Corre que é por tempo limitado! Link na bio e na descrição.`,
      legenda: `Clique no link e garanta o seu!`,
      cor: '#0a0a23',
      emoji: '🔗',
    },
  ];
  return cenas;
}

function gerarRoteiro(produtoNome, preco, categoria, descricao) {
  const cenas = gerarCenas(produtoNome, preco, categoria, descricao);
  const duracaoTotal = cenas.reduce((s, c) => s + c.duracao, 0);
  const pessoa = PESSOAS[categoria] || PESSOAS.tecnologia;
  const musica = pick(MUSICAS);
  const hooks = [
    `🔥 ${produtoNome} — imperdível!`,
    `💰 Oferta especial: ${produtoNome}`,
    `⚡ ${produtoNome} com frete grátis!`,
    `✨ ${produtoNome} — você precisa ver!`,
  ];
  return {
    id: genId(),
    produtoNome,
    preco,
    categoria,
    pessoa,
    musica,
    duracao: Math.round(duracaoTotal),
    hook: pick(hooks),
    cenas,
    cortesRapidos: Math.floor(6 + Math.random() * 5),
    zoom: true,
    legendasAtivadas: true,
    estiloVisual: pick(['cortes rápidos', 'transições suaves', 'viral TikTok', 'cinematográfico']),
  };
}

export function generateVideo(campaign) {
  const { nome, preco, categoria, descricao, imagem, lojaUrl, link } = campaign;
  const roteiro = gerarRoteiro(nome, preco, categoria, descricao);
  const narracaoCompleta = roteiro.cenas.map(c => c.narracao).join(' ');

  const video = {
    id: `vid_${genId()}`,
    campaignId: campaign.id,
    produtoNome: nome,
    preco,
    formato: '9:16',
    resolucao: '1080x1920',
    duracao: roteiro.duracao,
    hook: roteiro.hook,
    cenas: roteiro.cenas,
    pessoa: roteiro.pessoa,
    musica: roteiro.musica,
    cortesRapidos: roteiro.cortesRapidos,
    zoom: roteiro.zoom,
    legendasAtivadas: roteiro.legendasAtivadas,
    estiloVisual: roteiro.estiloVisual,
    narracaoCompleta,
    thumbnail: imagem || '📦',
    lojaUrl,
    link,
    criadoEm: new Date().toISOString(),
  };

  return video;
}

export function regenerateVideo(campaign, oldVideo) {
  return generateVideo(campaign);
}

export function formatDuracao(segundos) {
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${min}:${seg.toString().padStart(2, '0')}`;
}
