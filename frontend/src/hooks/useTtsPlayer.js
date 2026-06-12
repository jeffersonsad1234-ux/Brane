import { useState, useCallback, useRef, useEffect, useMemo } from "react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:8000`).trim();

// Voice character presets map to existing TTS endpoint (POST /api/tts)
const VOICE_CHARACTERS = [
  { id: "mulher_jovem",     label: "Mulher Jovem",               voice: "pt-BR-FranciscaNeural",        pitch: "+0Hz",  rate: "+0%" },
  { id: "homem_jovem",      label: "Homem Jovem",                voice: "pt-BR-AntonioNeural",          pitch: "+0Hz",  rate: "+0%" },
  { id: "homem_adulto",     label: "Homem Adulto",               voice: "pt-BR-AntonioNeural",          pitch: "-8Hz",  rate: "-5%" },
  { id: "senhora",          label: "Senhora",                     voice: "pt-BR-ThalitaMultilingualNeural", pitch: "+0Hz", rate: "+0%" },
  { id: "senhor_idoso",     label: "Senhor / Idoso (Narrador)",  voice: "pt-BR-AntonioNeural",          pitch: "-18Hz", rate: "-12%" },
  { id: "animada_quiz",     label: "Voz Animada de Quiz",        voice: "pt-BR-FranciscaNeural",        pitch: "+12Hz", rate: "+18%" },
  { id: "seria_historia",   label: "Voz S\u00e9ria para Hist\u00f3ria", voice: "pt-BR-ThalitaMultilingualNeural", pitch: "-8Hz", rate: "-10%" },
  { id: "infantil_charadas", label: "Voz Infantil / Leve (Charadas)", voice: "pt-BR-FranciscaNeural",   pitch: "+22Hz", rate: "+22%" },
];

export default function useTtsPlayer() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("brane_tts_enabled") !== "false");
  const [voiceId, setVoiceId] = useState(() => localStorage.getItem("brane_tts_voice") || "mulher_jovem");
  const [ready, setReady] = useState(false);
  const [lastError, setLastError] = useState(null);
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const onEndRef = useRef(null);
  const speakingRef = useRef(false);
  const currentBlobUrlRef = useRef(null);

  const revokeCurrent = useCallback(() => {
    if (currentBlobUrlRef.current) {
      try { URL.revokeObjectURL(currentBlobUrlRef.current); } catch (e) { /* ignore */ }
      currentBlobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    setReady(true);
    audio.onended = () => {
      revokeCurrent();
      speakingRef.current = false;
      const next = queueRef.current.shift();
      if (next) {
        playUrl(next);
      } else {
        const cb = onEndRef.current;
        onEndRef.current = null;
        if (cb) setTimeout(cb, 100);
      }
    };
    audio.onerror = () => {
      revokeCurrent();
      speakingRef.current = false;
      queueRef.current = [];
      const cb = onEndRef.current;
      onEndRef.current = null;
      if (cb) setTimeout(cb, 100);
    };
    return () => {
      revokeCurrent();
      audio.pause();
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent WAV base64 for audio unlock (1 sample, 22 bytes)
  const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

  const unlock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.src = SILENT_WAV;
      audio.play().then(() => {
        audio.pause();
        audio.src = "";
        audio.load();
      }).catch(() => {});
    } catch (e) { /* ignore */ }
  }, []);

  const playUrl = useCallback((url) => {
    const audio = audioRef.current;
    if (!audio) return;
    revokeCurrent();
    currentBlobUrlRef.current = url;
    speakingRef.current = true;
    audio.src = url;
    audio.play().catch((err) => {
      console.error("[TTS] play error:", err.message || err);
      setLastError("audio.play: " + (err.message || "bloqueado pelo navegador"));
      revokeCurrent();
      speakingRef.current = false;
      queueRef.current = [];
      const cb = onEndRef.current;
      onEndRef.current = null;
      if (cb) setTimeout(cb, 100);
    });
  }, [revokeCurrent]);

  const characterForId = useCallback((id) => {
    return VOICE_CHARACTERS.find(c => c.id === id) || VOICE_CHARACTERS[0];
  }, []);

  const generate = useCallback(async (text, cId) => {
    const char = characterForId(cId || voiceId);
    try {
      const r = await fetch(`${API_BASE}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: char.voice,
          pitch: char.pitch,
          rate: char.rate,
        }),
      });
      if (!r.ok) throw new Error(`TTS API error: ${r.status}`);
      const blob = await r.blob();
      setLastError(null);
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("[TTS] generate error:", err.message);
      setLastError(err.message);
      return null;
    }
  }, [voiceId, characterForId]);

  const speak = useCallback(async (text, onEnd) => {
    if (!enabled || !text || !audioRef.current) {
      if (onEnd) setTimeout(onEnd, 100);
      return;
    }
    const url = await generate(text);
    if (!url) {
      if (onEnd) setTimeout(onEnd, 100);
      return;
    }
    if (speakingRef.current) {
      queueRef.current.push(url);
      if (!onEndRef.current) onEndRef.current = onEnd;
    } else {
      onEndRef.current = onEnd || null;
      playUrl(url);
    }
  }, [enabled, generate, playUrl]);

  const speakSequence = useCallback(async (items, onEnd) => {
    const filtered = items.filter((item) => item.text);
    if (!enabled || filtered.length === 0) {
      if (onEnd) setTimeout(onEnd, 100);
      return;
    }
    let i = 0;
    const next = () => {
      if (i >= filtered.length) {
        if (onEnd) onEnd();
        return;
      }
      speak(filtered[i].text, () => {
        i++;
        setTimeout(next, filtered[i - 1]?.delayAfter || 300);
      });
    };
    next();
  }, [enabled, speak]);

  const cancel = useCallback(() => {
    revokeCurrent();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    queueRef.current = [];
    speakingRef.current = false;
    onEndRef.current = null;
  }, [revokeCurrent]);

  const changeVoice = useCallback((id) => {
    setVoiceId(id);
    localStorage.setItem("brane_tts_voice", id);
  }, []);

  const setTtsEnabled = useCallback((val) => {
    setEnabled(val);
    localStorage.setItem("brane_tts_enabled", val);
    if (!val) cancel();
  }, [cancel]);

  return useMemo(() => ({
    ttsEnabled: enabled,
    setTtsEnabled,
    voiceId,
    changeVoice,
    voices: VOICE_CHARACTERS,
    ready,
    speak,
    speakSequence,
    cancel,
    unlock,
    lastError,
  }), [enabled, voiceId, ready, speak, speakSequence, cancel, unlock, changeVoice, setTtsEnabled, lastError]);
}
