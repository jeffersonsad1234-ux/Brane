/**
 * TTS Engine — converts text to PT-BR speech via backend API.
 *   Method 1: Backend POST /api/tts (edge-tts + ffmpeg)
 *   Method 2: Web Speech API preview-only fallback
 * Returns valid audio blob or error.
 */
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

const API_BASE = (window._env_?.REACT_APP_AGENT_API || process.env.REACT_APP_AGENT_API || 'http://localhost:3200').replace(/\/+$/, '');

/**
 * Generate TTS audio via backend API.
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
  log(`🌐 Enviando para backend: ${API_BASE}/api/tts`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${API_BASE}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'audio/wav,audio/mpeg,*/*' },
      body: JSON.stringify({ text, voice: voiceId, rate: '+0%', pitch: '+0Hz' }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${errText.slice(0, 150)}`);
    }

    const blob = await response.blob();
    if (!blob || blob.size < 200) {
      throw new Error(`Áudio muito pequeno: ${blob?.size || 0} bytes`);
    }

    const voice = response.headers.get('X-TTS-Voice') || voiceId;
    const duration = parseInt(response.headers.get('X-TTS-Duration') || '0', 10);
    const sizeKb = response.headers.get('X-TTS-Size') || (blob.size / 1024).toFixed(1);
    const codec = response.headers.get('X-TTS-Codec') || 'pcm_s16le';
    const sampleRate = response.headers.get('X-TTS-SampleRate') || '24000';
    const method = 'edge-tts';

    log(`✅ Edge TTS: ${voice}`);
    log(`⏱️ Duração: ${duration}s`);
    log(`📦 Tamanho: ${sizeKb}KB`);
    log(`🎵 Codec: ${codec} · ${sampleRate}Hz`);

    return { success: true, blob, voiceId: voice, duration: Math.max(duration, 1), method, error: null, logs };
  } catch (err) {
    if (err.name === 'AbortError') {
      log('❌⏱️ Timeout: backend não respondeu em 60s');
    } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      log(`❌🔌 Backend offline: ${API_BASE}/api/tts`);
      log('   Certifique-se de que o servidor backend está rodando (python backend/server.py)');
    } else {
      log(`❌ ${err.message}`);
    }
    log('❌❌ Todas as tentativas de voz falharam');
    return { success: false, blob: null, voiceId, duration: 0, method: 'none', error: err.message, logs };
  }
}

/**
 * Play voice using Web Speech API (for preview only, not captured).
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
