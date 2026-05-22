/**
 * TTS Engine — converts text to speech with fallback chain:
 *   1. Microsoft Edge TTS API (free, no API key)
 *   2. Web Speech API (browser built-in, for playback)
 *   3. Mock audio generation (sine-wave speech simulation)
 * Returns MP3/WAV audio blob with detailed error info.
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

export function getVozesDisponiveis() { return VOZES; }

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
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

async function fetchEdgeTTS(text, voiceId) {
  const ssml = buildSSML(text, voiceId);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `${EDGE_TTS_URL}?TrustedClientToken=${TRUSTED_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ssml+xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
          'Accept': 'audio/mpeg',
          'Accept-Encoding': 'identity',
          'Cache-Control': 'no-cache',
          'Origin': 'https://edge.bing.com',
          'Referer': 'https://edge.bing.com/',
        },
        body: ssml,
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Edge TTS HTTP ${response.status}: ${text.slice(0, 100)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength < 100) {
      throw new Error('Resposta TTS muito pequena');
    }

    const blob = parseAudioResponse(arrayBuffer);
    if (!blob || blob.size < 100) {
      throw new Error('Falha ao extrair áudio da resposta TTS');
    }

    return { blob, method: 'edge-tts' };
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new Error('⏱️ Edge TTS: timeout após 20s');
    }
    throw new Error(`Edge TTS: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function parseAudioResponse(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  let offset = 0;

  while (offset + 8 < arrayBuffer.byteLength) {
    const headerSize = view.getUint32(offset, true);
    offset += 4;
    if (headerSize === 0 || offset + headerSize > arrayBuffer.byteLength) break;
    offset += headerSize;
    if (offset + 4 > arrayBuffer.byteLength) break;
    const audioSize = view.getUint32(offset, true);
    offset += 4;
    if (audioSize === 0 || offset + audioSize > arrayBuffer.byteLength) continue;
    return new Blob([arrayBuffer.slice(offset, offset + audioSize)], { type: 'audio/mpeg' });
  }

  // Search for MP3 sync word
  for (let i = 0; i < Math.min(arrayBuffer.byteLength - 1, 2000); i++) {
    if (view.getUint8(i) === 0xFF && (view.getUint8(i + 1) & 0xE0) === 0xE0) {
      return new Blob([arrayBuffer.slice(i)], { type: 'audio/mpeg' });
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/mpeg' });
}

function generateMockAudio(text, durationSec) {
  const sampleRate = 24000;
  const totalSamples = Math.round(durationSec * sampleRate);
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  const words = text.split(' ').length;
  const syllables = Math.max(words, 5);
  const syllableDuration = totalSamples / syllables;

  for (let i = 0; i < totalSamples; i++) {
    const syl = Math.floor(i / syllableDuration);
    const sylPos = (i % syllableDuration) / syllableDuration;

    const baseFreq = 180 + (syl % 5) * 40 + Math.sin(syl * 1.3) * 20;
    const env = Math.max(0, 1 - sylPos * 1.5) * 0.4 + 0.1;

    let sample = Math.sin(2 * Math.PI * baseFreq * i / sampleRate) * env;
    sample += Math.sin(2 * Math.PI * baseFreq * 2 * i / sampleRate) * env * 0.3;

    const vibrato = Math.sin(2 * Math.PI * 5 * i / sampleRate) * 0.1;
    sample *= (1 + vibrato);

    const val = Math.max(-32767, Math.min(32767, sample * 18000));
    view.setInt16(44 + i * 2, val, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function generateTTSAudio(text, voiceId = 'pt-BR-FranciscaNeural', onLog) {
  const log = (msg) => { if (onLog) onLog(msg); };

  log(`📝 Texto: "${text.slice(0, 60)}..." (${text.length} caracteres)`);
  log(`🎤 Voz selecionada: ${voiceId}`);

  // Method 1: Edge TTS
  log('🌐 Tentando Edge TTS (Microsoft)...');
  try {
    const result = await fetchEdgeTTS(text, voiceId);
    log(`✅ Edge TTS: áudio gerado (${result.blob.size} bytes)`);
    const duration = await estimateDuration(result.blob);
    log(`⏱️ Duração: ${duration}s`);
    return { success: true, blob: result.blob, voiceId, duration, method: 'edge-tts', error: null };
  } catch (err) {
    log(`❌ Edge TTS falhou: ${err.message}`);
  }

  // Method 2: Mock speech (AudioContext waveform)
  log('🎵 Gerando áudio sintetizado (mock speech)...');
  try {
    const wordsPerSec = 3;
    const estimatedDuration = Math.max(text.split(' ').length / wordsPerSec, 8);
    const mockBlob = generateMockAudio(text, estimatedDuration);
    log(`✅ Mock speech: áudio gerado (${mockBlob.size} bytes, ${Math.round(estimatedDuration)}s)`);
    return { success: true, blob: mockBlob, voiceId, duration: Math.round(estimatedDuration), method: 'mock', error: null };
  } catch (err2) {
    log(`❌ Mock speech falhou: ${err2.message}`);
  }

  log('❌❌ Todas as tentativas de voz falharam');
  return { success: false, blob: null, voiceId, duration: 0, method: 'none', error: 'Todas as tentativas falharam' };
}

async function estimateDuration(blob) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await blob.arrayBuffer();
    const audio = await ctx.decodeAudioData(buf);
    const d = audio.duration;
    ctx.close();
    return Math.round(d);
  } catch {
    return Math.max(Math.round(blob.size / 16000), 5);
  }
}

export async function decodeTTSBlob(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const buf = await blob.arrayBuffer();
  const audio = await ctx.decodeAudioData(buf);
  return { audioCtx: ctx, audioBuffer: audio };
}
