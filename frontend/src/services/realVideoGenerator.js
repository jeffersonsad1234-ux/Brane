/**
 * Real Video Generator — full pipeline: scenes → render → MP4.
 * Voice generation moved to brane-media-worker/. Videos render with music only.
 */
import { renderVideo } from "./videoRender";

function genId() { return Math.random().toString(36).slice(2, 10); }

const MUSICAS = [
  { nome: 'Upbeat Summer', bpm: 128, vibe: 'energética' },
  { nome: 'Lo-fi Beats', bpm: 90, vibe: 'descontraída' },
  { nome: 'Eletro Pop', bpm: 120, vibe: 'moderna' },
  { nome: 'Soft Vibes', bpm: 100, vibe: 'suave' },
  { nome: 'Trending Loop', bpm: 140, vibe: 'viral' },
];

export function gerarCenas(produtoNome, preco, descricao) {
  return [
    { id: 1, tipo: 'abertura', duracao: 5, cor: '#1a1a2e', legenda: `${produtoNome} — imperdível!` },
    { id: 2, tipo: 'produto', duracao: 7, cor: '#16213e', legenda: `${produtoNome} original de alta qualidade` },
    { id: 3, tipo: 'beneficio', duracao: 7, cor: '#0f3460', legenda: `Praticidade e design que você merece` },
    { id: 4, tipo: 'preco', duracao: 5, cor: '#1a1a40', legenda: `De R$ ${(preco * 1.4).toFixed(2)} por R$ ${preco.toFixed(2)}` },
    { id: 5, tipo: 'cta', duracao: 6, cor: '#0a0a23', legenda: `Clique no link e garanta o seu!` },
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

  const { nome, preco, categoria, descricao, lojaUrl } = campaign;
  const cenas = gerarCenas(nome, preco, descricao);
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
    estiloVisual: 'viral TikTok',
    thumbnail: '📦', lojaUrl, link: campaign.link,
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
      null, 0
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
