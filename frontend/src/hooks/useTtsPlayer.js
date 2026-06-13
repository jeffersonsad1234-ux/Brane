import { useState, useCallback, useRef, useEffect, useMemo } from "react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:8080`).trim();

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
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem("brane_tts_unlocked") === "true");
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState(null);
  const [speedRate, setSpeedRate] = useState(() => {
    const saved = localStorage.getItem("brane_tts_speed_rate");
    return saved ? parseFloat(saved) : 1.0;
  });
  const audioRef = useRef(null);
  const onEndRef = useRef(null);
  const speakingRef = useRef(false);
  const speakRequestIdRef = useRef(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    setReady(true);
    audio.onended = () => {
      console.log("[TTS_END] audio.onended fired");
      try { window.__lastTtsEvent = { type: "TTS_END", timestamp: Date.now() }; } catch (e) {}
      speakingRef.current = false;
      const cb = onEndRef.current;
      onEndRef.current = null;
      if (cb) {
        console.log("[TTS_END] invoking onEnd callback");
        setTimeout(cb, 100);
      }
    };
    audio.onerror = (event) => {
      console.log("[TTS_ERROR] audio.onerror fired", event?.message || event);
      try { window.__lastTtsEvent = { type: "TTS_ERROR", error: event?.message || event, timestamp: Date.now() }; } catch (e) {}
      speakingRef.current = false;
      const cb = onEndRef.current;
      onEndRef.current = null;
      if (cb) {
        console.log("[TTS_ERROR] invoking onEnd callback after error");
        setTimeout(cb, 100);
      }
    };
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

  const unlock = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.src = SILENT_WAV;
        audio.play().then(() => {
          audio.pause();
          audio.src = "";
          audio.load();
        }).catch(() => {});
      } catch (e) { /* ignore */ }
    }
  }, []);

  const playUrl = useCallback((url) => {
    const audio = audioRef.current;
    if (!audio) return;
    console.log("[TTS_START] playUrl", url);
    try { window.__lastTtsEvent = { type: "TTS_START", url, timestamp: Date.now() }; } catch (e) {}
    speakingRef.current = true;
    audio.src = url;
    audio.play().then(() => {
      console.log("[TTS_START] audio.play() succeeded");
    }).catch((err) => {
      console.error("[TTS_ERROR] play error:", err.message || err);
      setLastError("audio.play: " + (err.message || "bloqueado pelo navegador"));
      try { window.__lastTtsEvent = { type: "TTS_ERROR", error: err.message || err, timestamp: Date.now() }; } catch (e) {}
      speakingRef.current = false;
      const cb = onEndRef.current;
      onEndRef.current = null;
      if (cb) {
        console.log("[TTS_ERROR] invoking onEnd callback after play error");
        setTimeout(cb, 100);
      }
    });
  }, []);

  const characterForId = useCallback((id) => {
    return VOICE_CHARACTERS.find(c => c.id === id) || VOICE_CHARACTERS[0];
  }, []);

  const resolveRate = useCallback((char) => {
    const pct = Math.round((speedRate - 1.0) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  }, [speedRate]);

  const generateUrl = useCallback(async (text, cId) => {
    const char = characterForId(cId || voiceId);
    setLastError(null);
    try {
      const r = await fetch(`${API_BASE}/api/tts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: char.voice, pitch: char.pitch, rate: resolveRate(char) }),
      });
      if (!r.ok) {
        const errBody = await r.text().catch(() => "");
        throw new Error(`TTS error ${r.status}: ${errBody.slice(0, 200)}`);
      }
      const data = await r.json();
      if (!data.audioUrl) throw new Error("Resposta sem audioUrl");
      return data.audioUrl;
    } catch (err) {
      console.error("[TTS] generateUrl error:", err.message);
      setLastError(err.message);
      return null;
    }
  }, [voiceId, characterForId, resolveRate]);

  const pregenItems = useCallback(async (items) => {
    if (!items || items.length === 0) return [];
    try {
      const r = await fetch(`${API_BASE}/api/tts/pregen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(item => {
            const char = characterForId(item.voiceId || voiceId);
            return {
              id: item.id,
              text: item.text,
              voice: char.voice,
              pitch: char.pitch,
              rate: resolveRate(char),
            };
          }),
        }),
      });
      if (!r.ok) throw new Error(`pregen error ${r.status}`);
      const data = await r.json();
      return data.items || [];
    } catch (err) {
      console.error("[TTS] pregenItems error:", err.message);
      setLastError("pregen: " + err.message);
      return [];
    }
  }, [voiceId, characterForId, resolveRate]);

  const testLocally = useCallback(async () => {
    setTesting(true);
    setTestError(null);
    const text = "Teste de voz. Áudio funcionando.";
    try {
      const url = await generateUrl(text);
      if (!url) throw new Error("Não foi possível gerar URL de áudio");
      await new Promise((resolve, reject) => {
        const a = audioRef.current;
        if (!a) { reject(new Error("audioRef null")); return; }
        a.onended = () => { resolve(); };
        a.onerror = () => { reject(new Error("audio.onerror disparado")); };
        a.src = url;
        const p = a.play();
        if (p !== undefined) p.catch((e) => reject(new Error("play(): " + e.message)));
      });
      setUnlocked(true);
      localStorage.setItem("brane_tts_unlocked", "true");
      setTesting(false);
      return "ok";
    } catch (err) {
      setTestError(err.message || String(err));
      setLastError(err.message || String(err));
      setTesting(false);
      return "err:" + (err.message || String(err));
    }
  }, [generateUrl]);

  const cancel = useCallback(() => {
    console.log("[TTS_CANCEL] cancel called");
    try { window.__lastTtsEvent = { type: "TTS_CANCEL", timestamp: Date.now() }; } catch (e) {}
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    speakingRef.current = false;
    onEndRef.current = null;
  }, []);

  const speak = useCallback(async (text, onEnd) => {
    const requestId = ++speakRequestIdRef.current;
    console.log("[TTS_START] speak requested", { text, requestId });
    try { window.__lastTtsEvent = { type: "TTS_REQUEST", text, requestId, timestamp: Date.now() }; } catch (e) {}
    if (!enabled || !text || !audioRef.current) {
      console.log("[TTS_ERROR] speak aborted - disabled or missing audio", { enabled, hasText: !!text, audioExists: !!audioRef.current });
      if (onEnd) setTimeout(onEnd, 100);
      return;
    }
    cancel();
    const url = await generateUrl(text);
    if (!url || speakRequestIdRef.current !== requestId) {
      console.log("[TTS_ERROR] speak cancelled before play", { url, currentRequestId: speakRequestIdRef.current, requestId });
      if (onEnd) setTimeout(onEnd, 100);
      return;
    }
    onEndRef.current = onEnd || null;
    playUrl(url);
  }, [cancel, enabled, generateUrl, playUrl]);

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

  const changeVoice = useCallback((id) => {
    setVoiceId(id);
    localStorage.setItem("brane_tts_voice", id);
  }, []);

  const setTtsEnabled = useCallback((val) => {
    setEnabled(val);
    localStorage.setItem("brane_tts_enabled", val);
    if (!val) cancel();
  }, [cancel]);

  const setSpeedRateValue = useCallback((rate) => {
    const clamped = Math.max(0.1, Math.min(10, rate));
    setSpeedRate(clamped);
    localStorage.setItem("brane_tts_speed_rate", String(clamped));
  }, []);

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
    unlocked,
    testing,
    testError,
    testLocally,
    generateUrl,
    pregenItems,
    speedRate,
    setSpeedRate: setSpeedRateValue,
  }), [enabled, voiceId, ready, speak, speakSequence, cancel, unlock, changeVoice, setTtsEnabled, lastError, unlocked, testing, testError, testLocally, generateUrl, pregenItems, speedRate, setSpeedRateValue]);
}
