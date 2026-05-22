/**
 * TTS Engine — converts text to PT-BR speech with multi-method fallback.
 *   Method 1: Edge TTS via dev proxy /api/tts (bypasses CORS)
 *   Method 2: Edge TTS direct (works in Electron / bundled apps)
 *   Method 3: Web Speech API playback-only (used for "Ouvir voz")
 *   Method 4: Improved mock formant speech for video track
 * Returns audio blob with detailed status logs.
 */
const EDGE_TTS_DIRECT = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const EDGE_TTS_PROXY = '/api/tts';
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
export function getVoiceName(id) { return VOZES.find(v => v.id === id)?.nome || id; }

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

/** Fetch TTS from Edge API via given URL */
async function fetchEdgeTTSFrom(url, ssml, label) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${url}?TrustedClientToken=${TRUSTED_TOKEN}`, {
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
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 120)}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength < 100) throw new Error('Resposta muito pequena');
    const blob = parseAudioResponse(arrayBuffer);
    if (!blob || blob.size < 100) throw new Error('Falha ao extrair áudio');
    return blob;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('⏱️ Timeout (25s)');
    const msg = err.message.includes('Failed to fetch') || err.message.includes('NetworkError')
      ? `❌ CORS/rede: ${err.message}`
      : err.message;
    throw new Error(`${label}: ${msg}`);
  } finally {
    clearTimeout(timeout);
  }
}

/** Parse Microsoft Speech SDK binary response */
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
  for (let i = 0; i < Math.min(arrayBuffer.byteLength - 1, 3000); i++) {
    if (view.getUint8(i) === 0xFF && (view.getUint8(i + 1) & 0xE0) === 0xE0) {
      return new Blob([arrayBuffer.slice(i)], { type: 'audio/mpeg' });
    }
  }
  return new Blob([arrayBuffer], { type: 'audio/mpeg' });
}

/** Generate mock speech audio using formant synthesis */
function generateMockSpeech(text, durationSec) {
  const sr = 24000;
  const total = Math.round(durationSec * sr);
  const buf = new ArrayBuffer(44 + total * 2);
  const v = new DataView(buf);
  const w = (off, str) => { for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + total * 2, true); w(8, 'WAVE');
  w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, total * 2, true);

  // Generate syllable structure from text
  const words = text.split(/\s+/).filter(Boolean);
  const chars = text.length;
  const syllCount = Math.max(Math.round(chars / 3), 4);
  const syllLen = total / syllCount;

  // Vowel formants for PT-BR
  const vowels = [
    { f1: 700, f2: 1200, f3: 2600 },  // a
    { f1: 400, f2: 2000, f3: 2600 },  // e
    { f1: 350, f2: 2200, f3: 2800 },  // i
    { f1: 450, f2: 900, f3: 2500 },   // o
    { f1: 350, f2: 1600, f3: 2500 },  // u
  ];

  for (let i = 0; i < total; i++) {
    const syl = Math.floor(i / syllLen);
    const pos = (i % syllLen) / syllLen;
    const syllable = Math.min(syl, syllCount - 1);

    // Syllable envelope: attack 10%, sustain 50%, decay 40%
    let env;
    if (pos < 0.1) env = pos / 0.1;
    else if (pos < 0.6) env = 1;
    else env = 1 - (pos - 0.6) / 0.4;
    env = Math.max(0, env);

    // Pick vowel based on syllable position
    const vowel = vowels[syllable % vowels.length];
    // Add pitch contour (natural rise/fall)
    const pitchBase = 160 + (syllable % 7) * 12 + Math.sin(syllable * 0.7) * 15;
    const pitch = pitchBase + Math.sin(i / sr * 2 * Math.PI * 3) * 8;

    // Formant synthesis
    let s = 0;
    // F1 (first formant)
    s += Math.sin(2 * Math.PI * vowel.f1 * i / sr) * env * 0.35;
    // F2 (second formant) 
    s += Math.sin(2 * Math.PI * vowel.f2 * i / sr) * env * 0.25;
    // F3 (third formant)
    s += Math.sin(2 * Math.PI * vowel.f3 * i / sr) * env * 0.12;
    // Pitch harmonic
    s += Math.sin(2 * Math.PI * pitch * i / sr) * env * 0.3;
    // Second harmonic
    s += Math.sin(2 * Math.PI * pitch * 2 * i / sr) * env * 0.08;

    // Consonant-like noise at syllable onset
    if (pos < 0.08) {
      s += (Math.random() * 2 - 1) * (1 - pos / 0.08) * 0.15;
    }

    // Natural vibrato
    s *= (1 + Math.sin(2 * Math.PI * 5.5 * i / sr) * 0.06);

    // Global amplitude shaping
    const globalEnv = 0.5 + 0.5 * Math.sin(Math.PI * i / total);
    s = Math.max(-0.95, Math.min(0.95, s * globalEnv));

    const val = Math.max(-32767, Math.min(32767, s * 20000));
    v.setInt16(44 + i * 2, val, true);
  }

  return new Blob([buf], { type: 'audio/wav' });
}

/** Estimate audio duration from blob by attempting decode */
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

/**
 * Main TTS generation with fallback chain.
 * Returns: { success, blob, voiceId, duration, method, error, logs }
 */
export async function generateTTSAudio(text, voiceId = 'pt-BR-FranciscaNeural', onLog) {
  const logs = [];
  const log = (msg) => { logs.push(msg); if (onLog) onLog(msg); };

  if (!text || text.trim().length < 3) {
    log('❌ Texto vazio ou muito curto');
    return { success: false, blob: null, voiceId, duration: 0, method: 'none', error: 'Texto vazio', logs };
  }

  log(`📝 Texto: "${text.slice(0, 80)}..." (${text.length} caracteres)`);
  log(`🎤 Voz: ${getVoiceName(voiceId)} (${voiceId})`);

  const ssml = buildSSML(text, voiceId);
  let lastError = null;

  // Method 1: Edge TTS via dev proxy (bypasses CORS)
  log('1️⃣  Edge TTS via proxy /api/tts...');
  try {
    const blob = await fetchEdgeTTSFrom(EDGE_TTS_PROXY, ssml, 'Proxy');
    log(`✅ Proxy: áudio MP3 (${blob.size} bytes)`);
    const dur = await estimateDuration(blob);
    log(`⏱️ Duração: ${dur}s`);
    return { success: true, blob, voiceId, duration: dur, method: 'proxy', error: null, logs };
  } catch (err) {
    lastError = err.message;
    log(`❌ Proxy: ${err.message}`);
  }

  // Method 2: Direct Edge TTS
  log('2️⃣  Edge TTS direto...');
  try {
    const blob = await fetchEdgeTTSFrom(EDGE_TTS_DIRECT, ssml, 'Direct');
    log(`✅ Direct: áudio MP3 (${blob.size} bytes)`);
    const dur = await estimateDuration(blob);
    log(`⏱️ Duração: ${dur}s`);
    return { success: true, blob, voiceId, duration: dur, method: 'direct', error: null, logs };
  } catch (err) {
    lastError = err.message;
    log(`❌ Direct: ${err.message}`);
  }

  // Method 3: Mock formant speech
  log('3️⃣  Mock formant speech...');
  try {
    const wordsPerSec = 2.8;
    const estDur = Math.max(Math.ceil(text.split(/\s+/).length / wordsPerSec), 8);
    log(`⏱️ Duração estimada: ${estDur}s`);
    const blob = generateMockSpeech(text, estDur);
    log(`✅ Mock: áudio WAV (${blob.size} bytes, ${estDur}s)`);
    return { success: true, blob, voiceId, duration: estDur, method: 'mock', error: null, logs };
  } catch (err) {
    lastError = err.message;
    log(`❌ Mock: ${err.message}`);
  }

  log('❌❌ Todas as tentativas falharam');
  return { success: false, blob: null, voiceId, duration: 0, method: 'none', error: lastError || 'Todas falharam', logs };
}

/**
 * Play voice using Web Speech API (for preview only, not captured).
 * Returns a promise that resolves when speaking finishes.
 */
export function speakWithWebSpeech(text, voiceId, onLog) {
  return new Promise((resolve, reject) => {
    try {
      if (!window.speechSynthesis) {
        if (onLog) onLog('❌ Web Speech API não disponível');
        reject(new Error('Web Speech API não disponível'));
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a PT-BR voice
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt-BR'));
      if (ptVoice) utterance.voice = ptVoice;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error(e.error || 'Erro SpeechSynthesis'));
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      reject(e);
    }
  });
}

/** Decode TTS blob to AudioBuffer */
export async function decodeTTSBlob(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const buf = await blob.arrayBuffer();
  const audio = await ctx.decodeAudioData(buf);
  return { audioCtx: ctx, audioBuffer: audio };
}
