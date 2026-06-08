import { useState, useEffect, useCallback, useRef } from "react";

export default function useNarrator() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.2);
  const [voice, setVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);
  const rateRef = useRef(rate);
  const pitchRef = useRef(pitch);
  const voiceRef = useRef(voice);
  const timeoutRef = useRef(null);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { rateRef.current = rate; }, [rate]);
  useEffect(() => { pitchRef.current = pitch; }, [pitch]);
  useEffect(() => { voiceRef.current = voice; }, [voice]);

  useEffect(() => {
    const supported = "speechSynthesis" in window;
    setIsSupported(supported);
    if (!supported) return;

    const loadVoices = () => {
      const all = window.speechSynthesis.getVoices();
      setVoices(all);
      const ptBR = all.filter((v) => v.lang.startsWith("pt"));
      const preferred =
        ptBR.find((v) => /female|maria|luciana|helena|isabella/i.test(v.name)) ||
        ptBR.find((v) => v.lang === "pt-BR" || v.lang === "pt_BR") ||
        ptBR[0];
      if (!voiceRef.current && preferred) setVoice(preferred);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback((text, onEnd) => {
    if (!text) return;
    if (!enabledRef.current || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.pitch = pitchRef.current;
    u.rate = Math.min(1.5, rateRef.current);
    u.volume = volumeRef.current;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onerror = (e) => {
      if (e.error !== "canceled") setIsBlocked(true);
    };
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  }, []);

  const speakSequence = useCallback((items, onEnd) => {
    const filtered = items.filter((item) => item.text);
    if (!enabledRef.current || filtered.length === 0) {
      if (onEnd) onEnd();
      return;
    }
    let i = 0;
    const next = () => {
      if (!enabledRef.current || i >= filtered.length) return;
      const { text, delayAfter = 0 } = filtered[i];
      i++;
      speak(text, () => {
        if (i < filtered.length) {
          timeoutRef.current = setTimeout(next, delayAfter);
        } else if (onEnd) {
          onEnd();
        }
      });
    };
    next();
  }, [speak]);

  const testVoice = useCallback(() => {
    cancel();
    speak("Ola. Esta e a voz da narradora do quiz. Vamos aprender juntos.");
  }, [cancel, speak]);

  return {
    enabled, setEnabled,
    volume, setVolume,
    rate, setRate,
    pitch, setPitch,
    voice, setVoice,
    voices,
    isSupported,
    isBlocked, setIsBlocked,
    cancel,
    speak,
    speakSequence,
    testVoice,
  };
}
