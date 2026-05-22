/**
 * Real Video Generator — orchestrates the full video generation pipeline.
 * Takes campaign data → generates scenes → renders frames → encodes REAL MP4.
 */
import { renderVideo, FPS } from "./videoRender";

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
    {
      id: 1,
      tipo: 'abertura',
      duracao: 5,
      cor: '#1a1a2e',
      narracao: `Você precisa conhecer ${produtoNome}! Esse produto está fazendo o maior sucesso.`,
      legenda: `${produtoNome} — imperdível!`,
    },
    {
      id: 2,
      tipo: 'produto',
      duracao: 7,
      cor: '#16213e',
      narracao: `${descricao || `O ${produtoNome} é simplesmente incrível, com qualidade e acabamento premium.`}`,
      legenda: `${produtoNome} original de alta qualidade`,
    },
    {
      id: 3,
      tipo: 'beneficio',
      duracao: 7,
      cor: '#0f3460',
      narracao: `Você vai amar a praticidade e o design moderno. Perfeito para o seu dia a dia.`,
      legenda: `Praticidade e design que você merece`,
    },
    {
      id: 4,
      tipo: 'preco',
      duracao: 5,
      cor: '#1a1a40',
      narracao: `E o melhor: está saindo por apenas R$ ${preco.toFixed(2)} com frete grátis!`,
      legenda: `De R$ ${(preco * 1.4).toFixed(2)} por R$ ${preco.toFixed(2)}`,
    },
    {
      id: 5,
      tipo: 'cta',
      duracao: 6,
      cor: '#0a0a23',
      narracao: `Corre que é por tempo limitado! Acesse o link na bio e garanta o seu agora.`,
      legenda: `Clique no link e garanta o seu!`,
    },
  ];
}

export async function generateRealVideo(campaign, onProgress) {
  const { nome, preco, categoria, descricao, lojaUrl } = campaign;

  const cenas = gerarCenas(nome, preco, descricao);
  const duracao = cenas.reduce((s, c) => s + c.duracao, 0);
  const musica = MUSICAS[Math.floor(Math.random() * MUSICAS.length)];

  const narracaoCompleta = cenas.map(c => c.narracao).join(' ');

  const videoMeta = {
    id: `vid_${genId()}`,
    campaignId: campaign.id,
    produtoNome: nome,
    preco,
    formato: '9:16',
    resolucao: '540x960',
    duracao,
    cenas,
    musica,
    cortesRapidos: 8 + Math.floor(Math.random() * 4),
    zoom: true,
    legendasAtivadas: true,
    estiloVisual: 'viral TikTok',
    narracaoCompleta,
    thumbnail: '📦',
    lojaUrl,
    link: campaign.link,
    criadoEm: new Date().toISOString(),
  };

  try {
    const result = await renderVideo(nome, preco, lojaUrl, categoria, cenas, duracao, onProgress);
    return {
      videoMeta,
      blob: result.blob,
      url: result.url,
      duration: result.duration,
    };
  } catch (err) {
    console.error('Video render failed:', err);
    return {
      videoMeta,
      blob: null,
      url: null,
      error: err.message,
    };
  }
}

export async function regenerateRealVideo(campaign, oldVideo, onProgress) {
  return generateRealVideo(campaign, onProgress);
}

export function formatDuracao(segundos) {
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${min}:${seg.toString().padStart(2, '0')}`;
}
