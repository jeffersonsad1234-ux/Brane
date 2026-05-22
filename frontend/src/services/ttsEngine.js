/**
 * TTS Engine — converts text to PT-BR speech via backend API.
 *   Uses env var REACT_APP_TTS_API_URL (set in Cloudflare Pages / Railway)
 *   NO fallback to localhost/127.0.0.1 in production.
 *   Web Speech API kept as client-side preview only.
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

/**
 * API_BASE resolution:
 *   ONLY from env vars — NO hardcoded localhost/127.0.0.1.
 *   Priority: REACT_APP_TTS_API_URL > REACT_APP_TTS_API > REACT_APP_AGENT_API
 *   If none set, returns empty string (callers must check).
 *   Supports both CRA (process.env) and Vite (import.meta.env).
 */
function resolveApiBase() {
  const candidates = [
    // Vite support (import.meta.env.VITE_TTS_API_URL)
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_TTS_API_URL,
    // CRA support (process.env.REACT_APP_TTS_API_URL)
    process.env.REACT_APP_TTS_API_URL,
    // Runtime injected (Cloudflare Pages)
    window._env_?.REACT_APP_TTS_API_URL,
    // Legacy fallbacks
    process.env.REACT_APP_TTS_API,
    window._env_?.REACT_APP_TTS_API,
    process.env.REACT_APP_AGENT_API,
    window._env_?.REACT_APP_AGENT_API,
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.startsWith('http')) return c.replace(/\/+$/, '');
  }
  return '';
}
const API_BASE = resolveApiBase();

// Connection status tracking
let _backendStatus = API_BASE ? 'unknown' : 'unconfigured';
let _statusListeners = [];
let _healthCache = null;
let _lastCheck = 0;

export function getBackendStatus() { return _backendStatus; }
export function getHealthCache() { return _healthCache; }
export function getApiBase() { return API_BASE; }

export function onStatusChange(fn) {
  _statusListeners.push(fn);
  return () => { _statusListeners = _statusListeners.filter(f => f !== fn); };
}

function notifyStatus(status) {
  _backendStatus = status;
  _statusListeners.forEach(fn => { try { fn(status); } catch {} });
}

const CHECK_INTERVAL = 10000;
const FAST_RETRY = 3000;

/**
 * Check if the TTS backend is reachable.
 * Returns health data or null. Never crashes.
 */
export async function checkBackendHealth() {
  if (!API_BASE) {
    _backendStatus = 'unconfigured';
    _healthCache = null;
    return null;
  }
  const now = Date.now();
  if (_backendStatus === 'online' && now - _lastCheck < CHECK_INTERVAL) {
    return _healthCache;
  }

  notifyStatus('checking');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(`${API_BASE}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();
    _healthCache = data;
    _lastCheck = Date.now();
    notifyStatus('online');
    return data;
  } catch (err) {
    notifyStatus('offline');
    _healthCache = null;
    _lastCheck = Date.now();
    return null;
  }
}

/**
 * Start polling backend health. Returns unsubscribe function.
 */
export function startHealthPolling() {
  if (!API_BASE) {
    notifyStatus('unconfigured');
    return () => {};
  }
  checkBackendHealth();
  const id = setInterval(() => {
    checkBackendHealth();
  }, _backendStatus === 'online' ? CHECK_INTERVAL : FAST_RETRY);
  return () => clearInterval(id);
}

/**
 * Generate TTS audio via backend API.
 * Returns: { success, blob, voiceId, duration, method, error, logs }
 * Never throws — always returns a result object.
 */
export async function generateTTSAudio(text, voiceId = 'pt-BR-FranciscaNeural', onLog) {
  const logs = [];
  const log = (msg) => { logs.push(msg); if (onLog) onLog(msg); };

  if (!API_BASE) {
    log('❌ Variável TTS_API_URL não configurada');
    log('   Configure uma das seguintes variáveis de ambiente:');
    log('   • CRA: REACT_APP_TTS_API_URL');
    log('   • Vite: VITE_TTS_API_URL');
    log('   Defina no Cloudflare Pages (Settings → Environment) ou .env local');
    log('   Exemplo: https://seu-app.up.railway.app');
    return { success: false, blob: null, voiceId, duration: 0, method: 'none', error: 'TTS_API_URL não configurada', logs };
  }

  if (!text || text.trim().length < 3) {
    log('❌ Texto vazio ou muito curto');
    return { success: false, blob: null, voiceId, duration: 0, method: 'none', error: 'Texto vazio', logs };
  }

  log(`📝 Texto: "${text.slice(0, 80)}..." (${text.length} caracteres)`);
  log(`🎤 Voz: ${getVoiceName(voiceId)} (${voiceId})`);
  log(`🌐 ${API_BASE}/api/tts`);

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

    log(`✅ ${voice}`);
    log(`⏱️ ${duration}s`);
    log(`📦 ${sizeKb}KB · ${codec} · ${sampleRate}Hz`);

    return { success: true, blob, voiceId: voice, duration: Math.max(duration, 1), method: 'edge-tts', error: null, logs };
  } catch (err) {
    if (err.name === 'AbortError') {
      log('❌⏱️ Timeout: backend não respondeu em 60s');
    } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      log('❌🔌 Backend de voz offline');
      log(`   ${API_BASE} não está respondendo`);
      notifyStatus('offline');
    } else {
      log(`❌ ${err.message}`);
    }
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
