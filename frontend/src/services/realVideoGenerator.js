import { renderVideo } from "./videoRender";

function genId() { return Math.random().toString(36).slice(2, 10); }

const MUSICAS = [
  { nome: 'Upbeat Summer', bpm: 128, vibe: 'energética' },
  { nome: 'Lo-fi Beats', bpm: 90, vibe: 'descontraída' },
  { nome: 'Eletro Pop', bpm: 120, vibe: 'moderna' },
  { nome: 'Soft Vibes', bpm: 100, vibe: 'suave' },
  { nome: 'Trending Loop', bpm: 140, vibe: 'viral' },
];

async function preloadImage(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function extrairBeneficios(descricao) {
  if (!descricao) return ['Produto de alta qualidade', 'Frete grátis', 'Oferta imperdível'];
  const lines = descricao.split(/[.,;!?\n]+/).filter(l => l.trim().length > 10);
  if (lines.length === 0) return [descricao.trim()];
  return lines.slice(0, 3).map(l => l.trim());
}

export function gerarCenas(produtoNome, preco, descricao, categoria, imageLoaded) {
  const isTech = categoria === 'tecnologia' || categoria === 'gamer';
  const beneficios = extrairBeneficios(descricao);
  const precoAntigo = (preco * 1.4).toFixed(2);

  return [
    {
      id: 1, tipo: 'abertura', duracao: 5,
      cor: isTech ? '#0a0a1a' : '#1a1a2e',
      legenda: '🔥 Oferta por tempo limitado!',
      emoji: '🔥',
      narracao: `Abertura — ${produtoNome}`,
      hasImage: imageLoaded,
      nome: produtoNome,
    },
    {
      id: 2, tipo: 'produto', duracao: 8,
      cor: isTech ? '#0d0d2b' : '#16213e',
      legenda: imageLoaded ? '' : produtoNome,
      emoji: imageLoaded ? '' : '📦',
      narracao: `Produto — ${produtoNome}`,
      nome: produtoNome,
      hasImage: imageLoaded,
    },
    {
      id: 3, tipo: 'beneficio', duracao: 7,
      cor: isTech ? '#10052a' : '#0f3460',
      legenda: beneficios.join('\n'),
      emoji: '✨',
      narracao: 'Benefícios do produto',
      beneficios,
    },
    {
      id: 4, tipo: 'preco', duracao: 6,
      cor: isTech ? '#1a0020' : '#1a1a40',
      legenda: `De R$ ${precoAntigo} por R$ ${preco.toFixed(2)}`,
      emoji: '💰',
      narracao: `Preço: R$ ${preco.toFixed(2)}, de R$ ${precoAntigo}`,
      preco,
      precoAntigo: parseFloat(precoAntigo),
    },
    {
      id: 5, tipo: 'cta', duracao: 6,
      cor: isTech ? '#0a0015' : '#0a0a23',
      legenda: 'Acesse o link na bio!\nConfira antes que acabe!',
      emoji: '🔗',
      narracao: 'Chamada para ação — link na bio',
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

  log(`🔍 Carregando imagem do produto...`);
  const productImage = await preloadImage(imagem);

  if (!productImage) {
    log('❌ Imagem do produto não carregou. Verifique a URL e tente novamente.');
    log('💡 Informe uma URL direta de imagem (jpg/png) no campo "Imagem / Thumbnail".');
    return {
      videoMeta: {
        id: `vid_${genId()}`,
        campaignId: campaign.id,
        produtoNome: nome, preco,
        imagemError: true,
      },
      blob: null, url: null,
      error: 'Imagem do produto não carregou — verifique a URL',
      logs,
    };
  }

  log(`✅ Imagem carregada com sucesso: ${imagem}`);

  const cenas = gerarCenas(nome, preco, descricao, categoria, true);
  const duracao = cenas.reduce((s, c) => s + c.duracao, 0);
  const musica = MUSICAS[Math.floor(Math.random() * MUSICAS.length)];

  log(`📝 Roteiro visual: ${cenas.length} cenas · ${duracao}s`);
  log(`⏱️ Duração estimada: ${duracao}s`);

  const videoMeta = {
    id: `vid_${genId()}`,
    campaignId: campaign.id,
    produtoNome: nome, preco,
    formato: '9:16', resolucao: '540x960', duracao, cenas, musica,
    cortesRapidos: 8 + Math.floor(Math.random() * 4),
    zoom: true, legendasAtivadas: true,
    estiloVisual: categoria === 'tecnologia' || categoria === 'gamer' ? 'neon tech' : 'viral TikTok',
    imagemUrl: imagem,
    lojaUrl, link: campaign.link,
    criadoEm: new Date().toISOString(),
    voiceId: voiceId || null,
    voiceStatus: 'disabled',
    narracaoCompleta: '',
  };

  log('🎬 Renderizando vídeo com música...');
  try {
    const result = await renderVideo(
      nome, preco, lojaUrl, categoria, cenas, duracao,
      (pct) => { if (onProgress && typeof onProgress === 'function') onProgress(pct, `Renderizando... ${Math.round(pct * 100)}%`); },
      null, 0, productImage
    );
    log(`✅ Vídeo MP4 gerado: ${result.duration}s`);
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

export async function regenerateRealVideo(campaign, oldVideo, onProgress, voiceId) {
  return generateRealVideo(campaign, onProgress, voiceId);
}

export function formatDuracao(seg) {
  return `${Math.floor(seg / 60)}:${(seg % 60).toString().padStart(2, '0')}`;
}
