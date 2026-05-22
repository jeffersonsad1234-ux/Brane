/**
 * Real Video Generator — full pipeline: scenes → voice → render → MP4.
 * Blocks render if voice fails completely. Returns detailed error logs.
 */
import { renderVideo } from "./videoRender";
import { generateVoiceAudio } from "./voiceEngine";

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
    { id: 1, tipo: 'abertura', duracao: 5, cor: '#1a1a2e', narracao: `Você precisa conhecer ${produtoNome}! Esse produto está fazendo o maior sucesso.`, legenda: `${produtoNome} — imperdível!` },
    { id: 2, tipo: 'produto', duracao: 7, cor: '#16213e', narracao: `${descricao || `O ${produtoNome} é simplesmente incrível, com qualidade e acabamento premium.`}`, legenda: `${produtoNome} original de alta qualidade` },
    { id: 3, tipo: 'beneficio', duracao: 7, cor: '#0f3460', narracao: `Você vai amar a praticidade e o design moderno. Perfeito para o seu dia a dia.`, legenda: `Praticidade e design que você merece` },
    { id: 4, tipo: 'preco', duracao: 5, cor: '#1a1a40', narracao: `E o melhor: está saindo por apenas R$ ${preco.toFixed(2)} com frete grátis!`, legenda: `De R$ ${(preco * 1.4).toFixed(2)} por R$ ${preco.toFixed(2)}` },
    { id: 5, tipo: 'cta', duracao: 6, cor: '#0a0a23', narracao: `Corre que é por tempo limitado! Acesse o link na bio e garanta o seu agora.`, legenda: `Clique no link e garanta o seu!` },
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
  const narracaoCompleta = cenas.map(c => c.narracao).join(' ');

  log(`📝 Roteiro: ${narracaoCompleta.slice(0, 80)}...`);
  log(`⏱️ Duração estimada: ${duracao}s`);

  const videoMeta = {
    id: `vid_${genId()}`,
    campaignId: campaign.id,
    produtoNome: nome, preco,
    formato: '9:16', resolucao: '540x960', duracao, cenas, musica,
    cortesRapidos: 8 + Math.floor(Math.random() * 4),
    zoom: true, legendasAtivadas: true,
    estiloVisual: 'viral TikTok', narracaoCompleta,
    thumbnail: '📦', lojaUrl, link: campaign.link,
    criadoEm: new Date().toISOString(),
    voiceId: voiceId || 'pt-BR-FranciscaNeural',
  };

  // Generate voice
  log(`🎤 Voz escolhida: ${voiceId || 'pt-BR-FranciscaNeural'}`);
  let voiceBlob = null;
  let voiceDuration = 0;
  let voiceStatus = 'failed';
  let voiceError = null;

  try {
    const ttsResult = await generateVoiceAudio(narracaoCompleta, videoMeta.voiceId, (msg) => log(`   ${msg}`));
    if (ttsResult.success && ttsResult.blob && ttsResult.blob.size > 100) {
      voiceBlob = ttsResult.blob;
      voiceDuration = ttsResult.duration || duracao;
      voiceStatus = 'generated';
      log(`✅ Áudio gerado: ${ttsResult.method} (${ttsResult.duration}s, ${ttsResult.blob.size} bytes)`);
    } else {
      voiceError = ttsResult.error || 'Áudio vazio ou inválido';
      voiceStatus = 'failed';
      log(`❌ Geração de voz falhou: ${voiceError}`);
    }
  } catch (err) {
    voiceError = err.message;
    voiceStatus = 'failed';
    log(`❌ Exceção na geração de voz: ${voiceError}`);
  }

  if (voiceStatus !== 'generated') {
    log('⛔ Render bloqueado: voz não foi gerada');
    return {
      videoMeta: { ...videoMeta, voiceStatus, voiceError },
      blob: null, url: null,
      error: `Voz não gerada: ${voiceError || 'falha desconhecida'}`,
      voiceBlob: null, voiceStatus, voiceError,
      logs,
    };
  }

  // Render video
  log('🎬 Renderizando vídeo com áudio...');
  try {
    const result = await renderVideo(
      nome, preco, lojaUrl, categoria, cenas, duracao,
      (pct) => { if (onProgress && typeof onProgress === 'function') onProgress(pct, `Renderizando... ${Math.round(pct * 100)}%`); },
      voiceBlob, voiceDuration
    );
    log(`✅ Vídeo MP4 gerado: ${result.duration}s`);
    return {
      videoMeta: { ...videoMeta, voiceStatus },
      blob: result.blob, url: result.url,
      duration: result.duration,
      voiceBlob, voiceStatus, logs,
    };
  } catch (err) {
    log(`❌ Render falhou: ${err.message}`);
    return {
      videoMeta: { ...videoMeta, voiceStatus, voiceError: err.message },
      blob: null, url: null,
      error: err.message,
      voiceBlob, voiceStatus, logs,
    };
  }
}

export async function regenerateRealVideo(campaign, oldVideo, onProgress, voiceId) {
  return generateRealVideo(campaign, onProgress, voiceId);
}

export function formatDuracao(seg) {
  return `${Math.floor(seg / 60)}:${(seg % 60).toString().padStart(2, '0')}`;
}
