/**
 * TTS Engine — converts text to speech using Microsoft Edge TTS API (free, no API key).
 * Returns MP3 audio blob that can be decoded and mixed into videos.
 */
const EDGE_TTS_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';

const VOZES = [
  { id: 'pt-BR-FranciscaNeural', nome: 'Francisca', genero: 'Feminino', estilo: 'natural e calorosa' },
  { id: 'pt-BR-AntonioNeural', nome: 'Antonio', genero: 'Masculino', estilo: 'profissional' },
  { id: 'pt-BR-ThalitaNeural', nome: 'Thalita', genero: 'Feminino', estilo: 'jovem e animada' },
  { id: 'pt-BR-BrendaNeural', nome: 'Brenda', genero: 'Feminino', estilo: 'conversacional' },
  { id: 'pt-BR-DonatoNeural', nome: 'Donato', genero: 'Masculino', estilo: 'calmo e sério' },
  { id: 'pt-BR-ElzaNeural', nome: 'Elza', genero: 'Feminino', estilo: 'madura e firme' },
  { id: 'pt-BR-FabioNeural', nome: 'Fabio', genero: 'Masculino', estilo: 'entusiasmado' },
  { id: 'pt-BR-GiovannaNeural', nome: 'Giovanna', genero: 'Feminino', estilo: 'criativa' },
  { id: 'pt-BR-HumbertoNeural', nome: 'Humberto', genero: 'Masculino', estilo: 'sério' },
  { id: 'pt-BR-JulioNeural', nome: 'Julio', genero: 'Masculino', estilo: 'jovem' },
  { id: 'pt-BR-LeilaNeural', nome: 'Leila', genero: 'Feminino', estilo: 'elegante' },
  { id: 'pt-BR-LeticiaNeural', nome: 'Leticia', genero: 'Feminino', estilo: 'amigável' },
  { id: 'pt-BR-ManuelaNeural', nome: 'Manuela', genero: 'Feminino', estilo: 'expressiva' },
  { id: 'pt-BR-NicolasNeural', nome: 'Nicolas', genero: 'Masculino', estilo: 'carismático' },
  { id: 'pt-BR-ValeriaNeural', nome: 'Valeria', genero: 'Feminino', estilo: 'suave' },
  { id: 'pt-BR-YaraNeural', nome: 'Yara', genero: 'Feminino', estilo: 'vibrante' },
];

export function getVozesDisponiveis() {
  return VOZES;
}

function buildSSML(text, voiceId, rate = 0, pitch = 0) {
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="pt-BR">
    <voice name="${voiceId}">
      <prosody rate="${rate}%" pitch="${pitch}%">
        ${escapeXml(text)}
      </prosody>
    </voice>
  </speak>`;
}

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function fetchWithTimeout(url, options, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function generateTTSAudio(text, voiceId = 'pt-BR-FranciscaNeural') {
  const ssml = buildSSML(text, voiceId);

  try {
    const response = await fetchWithTimeout(
      `${EDGE_TTS_URL}?TrustedClientToken=${TRUSTED_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ssml+xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
          'Accept': 'audio/mpeg',
          'Accept-Encoding': 'identity',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Origin': 'https://edge.bing.com',
          'Referer': 'https://edge.bing.com/',
        },
        body: ssml,
      },
      20000
    );

    if (!response.ok) {
      throw new Error(`Edge TTS HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBlob = parseEdgeTTSResponse(arrayBuffer);

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Empty audio response');
    }

    return {
      success: true,
      blob: audioBlob,
      voiceId,
      duration: await estimateAudioDuration(audioBlob),
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('TTS timeout — servidor não respondeu');
    }
    throw err;
  }
}

function parseEdgeTTSResponse(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  let offset = 0;

  while (offset < arrayBuffer.byteLength) {
    if (arrayBuffer.byteLength - offset < 4) break;
    const headerSize = dataView.getUint32(offset, true);
    offset += 4;

    if (headerSize === 0 || arrayBuffer.byteLength - offset < headerSize) break;
    offset += headerSize;

    if (arrayBuffer.byteLength - offset < 4) break;
    const audioSize = dataView.getUint32(offset, true);
    offset += 4;

    if (audioSize === 0) continue;
    if (arrayBuffer.byteLength - offset < audioSize) break;

    return new Blob([arrayBuffer.slice(offset, offset + audioSize)], { type: 'audio/mpeg' });
  }

  const firstBytes = new Uint8Array(arrayBuffer.slice(0, Math.min(4, arrayBuffer.byteLength)));
  if (firstBytes[0] === 0xFF && (firstBytes[1] & 0xE0) === 0xE0) {
    return new Blob([arrayBuffer], { type: 'audio/mpeg' });
  }

  const textDecoder = new TextDecoder('utf-16le');
  const content = textDecoder.decode(arrayBuffer.slice(0, Math.min(200, arrayBuffer.byteLength)));

  const audioMatch = arrayBuffer.byteLength > 100;
  if (audioMatch) {
    for (let i = 0; i < Math.min(arrayBuffer.byteLength - 1, 500); i++) {
      if (dataView.getUint8(i) === 0xFF && (dataView.getUint8(i + 1) & 0xE0) === 0xE0) {
        return new Blob([arrayBuffer.slice(i)], { type: 'audio/mpeg' });
      }
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/mpeg' });
}

async function estimateAudioDuration(blob) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;
    audioCtx.close();
    return Math.round(duration);
  } catch {
    const sizeInBytes = blob.size;
    const estimatedSeconds = Math.round(sizeInBytes / 16000);
    return Math.max(estimatedSeconds, 5);
  }
}

export async function decodeTTSBlob(blob) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  return { audioCtx, audioBuffer };
}
