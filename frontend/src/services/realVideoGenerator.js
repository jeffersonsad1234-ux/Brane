import { renderVideo } from "./videoRender";

function genId() { return Math.random().toString(36).slice(2, 10); }

const MUSICAS_POR_CATEGORIA = {
  tecnologia: [
    { nome: 'Tech Phonk', bpm: 140, vibe: 'trap' },
    { nome: 'Neon Bass', bpm: 130, vibe: 'electro' },
  ],
  gamer: [
    { nome: 'Gamer Trap', bpm: 150, vibe: 'phonk' },
    { nome: 'Eletro Fight', bpm: 140, vibe: 'trap' },
  ],
  fitness: [
    { nome: 'Workout Pump', bpm: 140, vibe: 'energética' },
    { nome: 'Power Up', bpm: 150, vibe: 'motivacional' },
  ],
  beleza: [
    { nome: 'Glow Up', bpm: 120, vibe: 'trendy' },
    { nome: 'Soft Lux', bpm: 110, vibe: 'clean' },
  ],
  pet: [
    { nome: 'Funny Beat', bpm: 120, vibe: 'divertido' },
    { nome: 'Play Time', bpm: 130, vibe: 'alegre' },
  ],
  cozinha: [
    { nome: 'Kitchen Groove', bpm: 110, vibe: 'moderna' },
    { nome: 'Fresh Vibes', bpm: 120, vibe: 'clean' },
  ],
};

function MUSICAS(cat) {
  const list = MUSICAS_POR_CATEGORIA[cat];
  if (list && list.length > 0) return list[Math.floor(Math.random() * list.length)];
  return { nome: 'Upbeat Summer', bpm: 128, vibe: 'energética' };
}

function parseImageUrls(input) {
  if (!input || typeof input !== 'string') return [];
  return input.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.startsWith('http'));
}

async function preloadImage(url) {
  if (!url || !url.startsWith('http')) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function preloadImages(urls) {
  const results = await Promise.all(urls.map(preloadImage));
  return results.filter(Boolean);
}

function extrairBeneficios(descricao) {
  if (!descricao) return ['ALTA QUALIDADE', 'DESIGN PREMIUM', 'MELHOR ESCOLHA'];
  const lines = descricao.split(/[.,;!?\n]+/).filter(l => l.trim().length > 5);
  if (lines.length === 0) return [descricao.trim().toUpperCase()];
  return lines.slice(0, 4).map(l => l.trim().toUpperCase());
}

export function gerarCenas(produtoNome, preco, descricao, categoria, imageCount) {
  const isTech = categoria === 'tecnologia' || categoria === 'gamer';
  const b = extrairBeneficios(descricao);
  const precoAntigo = (preco * 1.4).toFixed(2);
  const effects = ['zoom-in', 'pan', 'glow', 'shake', 'parallax'];
  const pick = (i) => effects[i % effects.length];

  return [
    {
      id: 1, tipo: 'hook', duracao: 1.8,
      cor: isTech ? '#0a0a1a' : '#1a1a2e',
      texto: isTech ? '⚡ OFERTA IMPERDÍVEL' : '🔥 OFERTA IMPERDÍVEL',
      textStyle: 'big',
      imageIndex: 0 % imageCount, effect: pick(0),
      background: categoria,
    },
    {
      id: 2, tipo: 'showcase', duracao: 2.2,
      cor: isTech ? '#0d0d2b' : '#16213e',
      texto: produtoNome.length > 30 ? produtoNome.slice(0, 28) + '...' : produtoNome,
      textStyle: 'product-name',
      imageIndex: (1 % imageCount) || 0, effect: pick(1),
      background: categoria,
    },
    {
      id: 3, tipo: 'feature', duracao: 2.0,
      cor: isTech ? '#10052a' : '#0f3460',
      texto: b[0] || 'ALTA QUALIDADE',
      textStyle: 'feature',
      imageIndex: (2 % imageCount) || 0, effect: pick(2),
      background: categoria,
    },
    {
      id: 4, tipo: 'feature', duracao: 1.8,
      cor: isTech ? '#0a0020' : '#1a1a2e',
      texto: b[1] || 'DESIGN PREMIUM',
      textStyle: 'feature',
      imageIndex: (3 % imageCount) || 0, effect: pick(3),
      background: categoria,
    },
    {
      id: 5, tipo: 'feature', duracao: 2.0,
      cor: isTech ? '#150030' : '#0d1b2a',
      texto: b[2] || 'MELHOR ESCOLHA',
      textStyle: 'feature',
      imageIndex: (4 % imageCount) || 0, effect: pick(4),
      background: categoria,
    },
    {
      id: 6, tipo: 'price', duracao: 2.5,
      cor: isTech ? '#1a0020' : '#1a1a40',
      texto: `R$ ${preco.toFixed(2)}`,
      textStyle: 'price-big',
      precoAntigo: `De R$ ${precoAntigo}`,
      imageIndex: (5 % imageCount) || 0, effect: 'glow',
      background: categoria,
    },
    {
      id: 7, tipo: 'cta', duracao: 2.5,
      cor: isTech ? '#0a0015' : '#0a0a23',
      texto: '🔗 LINK NA BIO',
      textStyle: 'cta-giant',
      subtexto: 'Confira antes que acabe!',
      imageIndex: (6 % imageCount) || 0, effect: 'parallax',
      background: categoria,
    },
  ];
}

export function getVozes() {
  return [
    { id: 'pt-BR-FranciscaNeural', nome: 'Francisca' },
    { id: 'pt-BR-ThalitaNeural', nome: 'Thalita' },
    { id: 'pt-BR-YaraNeural', nome: 'Yara' },
  ];
}

export async function generateRealVideo(campaign, onProgress, voiceId) {
  const logs = [];
  const log = (msg) => { logs.push(msg); if (onProgress && typeof onProgress === 'function') onProgress(null, msg); };

  const { nome, preco, categoria, descricao, lojaUrl, imagem } = campaign;

  log(`🔍 Carregando imagem(ns) do produto...`);

  const urls = parseImageUrls(imagem);
  let images = await preloadImages(urls.length > 0 ? urls : [imagem]);

  if (images.length === 0) {
    log('❌ Nenhuma imagem carregou. Verifique a URL e tente novamente.');
    return {
      videoMeta: { id: `vid_${genId()}`, campaignId: campaign.id, produtoNome: nome, preco, imagemError: true },
      blob: null, url: null,
      error: 'Imagem do produto não carregou — verifique a URL',
      logs,
    };
  }

  log(`✅ ${images.length} imagem(ns) carregada(s)`);
  if (urls.length > 0) urls.forEach(u => log(`  📸 ${u}`));

  const bgCat = { gamer: 'gamer', tecnologia: 'tecnologia', celular: 'tecnologia', 'eletrônicos': 'tecnologia', cozinha: 'cozinha', beleza: 'beleza', fitness: 'fitness', moda: 'moda', roupa: 'moda', pet: 'pet', casa: 'casa' }[categoria] || 'default';
  log(`🏷️ Categoria detectada: ${categoria}`);
  log(`🎨 Background: ${bgCat === 'default' ? 'padrão (gradiente)' : bgCat}`);

  const imageCount = images.length;
  const cenas = gerarCenas(nome, preco, descricao, categoria, imageCount);
  const duracao = cenas.reduce((s, c) => s + c.duracao, 0);
  const musica = MUSICAS(categoria);

  log(`📝 Roteiro viral: ${cenas.length} cenas · ${duracao}s`);
  log(`🎵 Música: ${musica.nome} (${musica.bpm}BPM · ${musica.vibe})`);

  const videoMeta = {
    id: `vid_${genId()}`,
    campaignId: campaign.id,
    produtoNome: nome, preco,
    formato: '9:16', resolucao: '540x960', duracao, cenas, musica,
    cortesRapidos: cenas.length,
    zoom: true, legendasAtivadas: true,
    estiloVisual: isTech(categoria) ? 'viral neon' : 'viral TikTok',
    imagemUrl: imagem,
    lojaUrl, link: campaign.link,
    criadoEm: new Date().toISOString(),
    voiceId: voiceId || null,
    voiceStatus: 'disabled',
    narracaoCompleta: '',
  };

  log('🎬 Renderizando vídeo viral...');
  try {
    const result = await renderVideo(
      nome, preco, lojaUrl, categoria, cenas, duracao, images,
      (pct) => { if (onProgress && typeof onProgress === 'function') onProgress(pct, `Renderizando... ${Math.round(pct * 100)}%`); },
      null, 0
    );
    log(`✅ Vídeo MP4 gerado: ${result.duration}s · ${cenas.length} cortes`);
    return {
      videoMeta: { ...videoMeta, voiceStatus: 'disabled', voiceError: null },
      blob: result.blob, url: result.url,
      duration: result.duration,
      voiceBlob: null, voiceStatus: 'disabled', logs,
    };
  } catch (err) {
    log(`❌ Render falhou: ${err.message}`);
    return {
      videoMeta: { ...videoMeta, voiceStatus: 'disabled', voiceError: err.message },
      blob: null, url: null,
      error: err.message,
      voiceBlob: null, voiceStatus: 'disabled', logs,
    };
  }
}

function isTech(cat) { return cat === 'tecnologia' || cat === 'gamer'; }

export async function regenerateRealVideo(campaign, oldVideo, onProgress, voiceId) {
  return generateRealVideo(campaign, onProgress, voiceId);
}

export function formatDuracao(seg) {
  return `${Math.floor(seg / 60)}:${(seg % 60).toString().padStart(2, '0')}`;
}
