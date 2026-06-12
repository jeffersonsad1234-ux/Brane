import { useState, useCallback, useRef, useEffect, useMemo } from "react";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:8000`).trim();

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
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const onEndRef = useRef(null);
  const speakingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    setReady(true);
    audio.onended = () => {
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
      speakingRef.current = false;
      queueRef.current = [];
      const cb = onEndRef.current;
      onEndRef.current = null;
      if (cb) setTimeout(cb, 100);
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
    speakingRef.current = true;
    audio.src = url;
    audio.play().catch((err) => {
      console.error("[TTS] play error:", err.message || err);
      setLastError("audio.play: " + (err.message || "bloqueado pelo navegador"));
      speakingRef.current = false;
      queueRef.current = [];
      const cb = onEndRef.current;
      onEndRef.current = null;
      if (cb) setTimeout(cb, 100);
    });
  }, []);

  const characterForId = useCallback((id) => {
    return VOICE_CHARACTERS.find(c => c.id === id) || VOICE_CHARACTERS[0];
  }, []);

  const generateUrl = useCallback(async (text, cId) => {
    const char = characterForId(cId || voiceId);
    setLastError(null);
    try {
      const r = await fetch(`${API_BASE}/api/tts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: char.voice, pitch: char.pitch, rate: char.rate }),
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
  }, [voiceId, characterForId]);

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
              rate: char.rate,
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
  }, [voiceId, characterForId]);

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

  const speak = useCallback(async (text, onEnd) => {
    if (!enabled || !text || !audioRef.current) {
      if (onEnd) setTimeout(onEnd, 100);
      return;
    }
    const url = await generateUrl(text);
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
  }, [enabled, generateUrl, playUrl]);

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
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    queueRef.current = [];
    speakingRef.current = false;
    onEndRef.current = null;
  }, []);

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
    unlocked,
    testing,
    testError,
    testLocally,
    generateUrl,
    pregenItems,
  }), [enabled, voiceId, ready, speak, speakSequence, cancel, unlock, changeVoice, setTtsEnabled, lastError, unlocked, testing, testError, testLocally, generateUrl, pregenItems]);
}
