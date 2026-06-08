import { useState, useEffect, useCallback, useRef } from "react";

const ACCENT_MAP = {
  "informacao": "informação",
  "educacao": "educação",
  "atencao": "atenção",
  "inteligencia": "inteligência",
  "programacao": "programação",
  "conteudo": "conteúdo",
  "negocio": "negócio",
  "historia": "história",
  "tecnologia": "tecnologia",
  "economia": "economia",
  "ciencia": "ciência",
  "filosofia": "filosofia",
  "biologia": "biologia",
  "geografia": "geografia",
  "astronomia": "astronomia",
  "tecnica": "técnica",
  "publica": "pública",
  "epoca": "época",
  "transicao": "transição",
  "evolucao": "evolução",
  "revolucao": "revolução",
  "producao": "produção",
  "comunicacao": "comunicação",
  "exploracao": "exploração",
  "civilizacao": "civilização",
  "organizacao": "organização",
  "transformacao": "transformação",
  "geracao": "geração",
  "nacao": "nação",
  "sociedade": "sociedade",
  "variedade": "variedade",
  "humanidade": "humanidade",
  "qualidade": "qualidade",
  "quantidade": "quantidade",
  "atividade": "atividade",
  "capacidade": "capacidade",
  "oportunidade": "oportunidade",
  "finalidade": "finalidade",
  "influencia": "influência",
  "consequencia": "consequência",
  "experiencia": "experiência",
  "diferenca": "diferença",
  "presenca": "presença",
  "ausencia": "ausência",
  "importancia": "importância",
  "relevancia": "relevância",
  "distancia": "distância",
  "sustentavel": "sustentável",
  "notavel": "notável",
  "notavelmente": "notavelmente",
  "incrivel": "incrível",
  "possivel": "possível",
  "impossivel": "impossível",
  "visivel": "visível",
  "viavel": "viável",
  "automatico": "automático",
  "pratico": "prático",
  "unico": "único",
  "cientifico": "científico",
  "economico": "econômico",
  "tecnologico": "tecnológico",
  "historico": "histórico",
  "geografico": "geográfico",
  "democratico": "democrático",
  "politico": "político",
  "publico": "público",
  "critico": "crítico",
  "periodo": "período",
  "seculo": "século",
  "inicio": "início",
  "medio": "médio",
  "proprio": "próprio",
  "dinamico": "dinâmico",
  "tambem": "também",
  "alem": "além",
  "voce": "você",
  "fisica": "física",
  "quimica": "química",
  "matematica": "matemática",
  "robotica": "robótica",
  "mecanica": "mecânica",
  "eletronica": "eletrônica",
  "logica": "lógica",
  "formula": "fórmula",
  "particula": "partícula",
  "molecula": "molécula",
  "celula": "célula",
  "diferente": "diferente",
  "semelhante": "semelhante",
  "proximo": "próximo",
  "indigena": "indígena",
  "musica": "música",
  "arte": "arte",
  "ingles": "inglês",
  "frances": "francês",
  "portugues": "português",
  "japones": "japonês",
  "caracteristica": "característica",
  "analise": "análise",
  "sintese": "síntese",
  "hipotese": "hipótese",
  "crise": "crise",
  "base": "base",
  "fase": "fase",
  "catastrofe": "catástrofe",
  "metodo": "método",
  "genero": "gênero",
  "numero": "número",
  "serie": "série",
  "especie": "espécie",
  "nivel": "nível",
  "simbolo": "símbolo",
  "ambito": "âmbito",
  "indole": "índole",
  "antartica": "Antártica",
  "antartida": "Antártida",
  "egipcio": "egípcio",
  "fotossintese": "fotossíntese",
  "varios": "vários",
  "varias": "várias",
  "dinossauro": "dinossauro",
  "nucleo": "núcleo",
  "atmosfera": "atmosfera",
  "ecossistema": "ecossistema",
  "biodiversidade": "biodiversidade",
};

function normalizeSpeechText(text) {
  if (!text) return text;
  let s = text;

  // 1. Apply word accent map (case-preserving)
  for (const [key, val] of Object.entries(ACCENT_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    s = s.replace(regex, (match) => {
      if (match.length > 0 && match[0] === match[0].toUpperCase()) {
        return val.charAt(0).toUpperCase() + val.slice(1);
      }
      return val;
    });
  }

  // 2. Correct "e" (verb "is") when followed by article, pronoun or demonstrative
  s = s.replace(
    /\b[Ee]\s+(o|a|os|as|um|uma|no|na|do|da|num|numa|pelo|pela|seu|sua|seus|suas|este|esta|estes|estas|esse|essa|esses|essas|aquele|aquela|aqueles|aquelas|isso|isto|aquilo|muito|mais|menos|tambem|sempre|nunca|um dos|uma das)\b/gi,
    (match) => "é " + match.split(/\s+/).slice(1).join(" ")
  );

  // 3. Correct "e" after question words
  s = s.replace(/\b(O que|Qual|Quem|Onde|Como|Quando|Por que)\s+e\b/gi, "$1 é");

  // 4. Correct "E" at start of sentence
  s = s.replace(/^E\s+/i, "É ");

  // 5. Correct "a" → "à" before feminine nouns (known patterns)
  s = s.replace(/\bA\s+(a|as)\b/gi, (match) => {
    const words = match.split(/\s+/);
    return "à " + words.slice(1).join(" ");
  });

  // 6. Add period at end if missing (ends with letter, number or quote)
  if (s.length > 0 && /[a-zA-Z0-9\u00C0-\u024F"']$/.test(s)) {
    s += ".";
  }

  return s;
}

const STORAGE_KEY = "brane_narrator_voice";

const ENGINES = [
  { id: "webspeech", label: "Windows Speech (SAPI)" },
  { id: "edge-tts",  label: "Edge TTS (Microsoft Neural)" },
];

const EDGE_VOICES_PT = [
  { name: "pt-BR-FranciscaNeural", display: "Francisca",  lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "pt-BR-AntonioNeural",   display: "Antonio",    lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "pt-BR-ThalitaNeural",   display: "Thalita",    lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "pt-BR-FabioNeural",     display: "Fabio",      lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
  { name: "pt-BR-MariaNeural",     display: "Maria",      lang: "pt-BR", gender: "Female", engine: "edge-tts" },
  { name: "pt-BR-DanielNeural",    display: "Daniel",     lang: "pt-BR", gender: "Male",   engine: "edge-tts" },
];

function base64ToBlob(b64, mimeType) {
  const byteChars = atob(b64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    bytes[i] = byteChars.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export default function useNarrator() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.2);
  const [engine, setEngine] = useState("webspeech");
  const [voice, setVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const [edgeVoices] = useState(EDGE_VOICES_PT);
  const [edgeTtsAvailable, setEdgeTtsAvailable] = useState(false);
  const audioRef = useRef(null);
  const [allVoices, setAllVoices] = useState([]);
  const [allVoiceCount, setAllVoiceCount] = useState(0);
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

  const pickVoice = useCallback((all) => {
    const pt = all.filter((v) => v.lang.startsWith("pt"));
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const match = pt.find((v) => v.name === saved);
      if (match) return match;
    }
    return (
      pt.find((v) => v.lang.startsWith("pt-BR") && /female|maria|luciana|helena|isabella/i.test(v.name)) ||
      pt.find((v) => v.lang.startsWith("pt-BR")) ||
      pt.find((v) => v.lang.startsWith("pt")) ||
      null
    );
  }, []);

  const loadVoices = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const all = window.speechSynthesis.getVoices();
    setAllVoices(all);
    setAllVoiceCount(all.length);
    console.log(`[useNarrator] ${"=".repeat(40)}`);
    console.log(`[useNarrator] Total de vozes encontradas: ${all.length}`);
    all.forEach((v, i) => {
      console.log(`[useNarrator] Voz #${i + 1}: nome="${v.name}" lang="${v.lang}" default=${v.default}`);
    });
    console.log(`[useNarrator] ${"=".repeat(40)}`);
    if (all.length === 0) {
      console.warn("[useNarrator] NENHUMA voz encontrada! speechSynthesis pode estar bloqueado.");
    }
    const pt = all.filter((v) => v.lang.startsWith("pt"));
    setVoices(pt);
    console.log(`[useNarrator] Vozes em portugues: ${pt.length}`);
    if (!voiceRef.current) {
      const picked = pickVoice(all);
      if (picked) setVoice(picked);
    }
  }, [pickVoice]);

  // Initial load + event listener + polling fallback for Electron
  useEffect(() => {
    const supported = "speechSynthesis" in window;
    setIsSupported(supported);
    if (!supported) return;

    const pollMax = 50;    // ~5 seconds at 100ms
    let pollCount = 0;
    let pollTimer = null;

    const tryLoad = () => {
      const all = window.speechSynthesis.getVoices();
      if (all.length > 0 || pollCount >= pollMax) {
        loadVoices();
        return;
      }
      pollCount++;
      pollTimer = setTimeout(tryLoad, 100);
    };

    // Immediate attempt
    tryLoad();

    // Event-driven (works in Chrome, sometimes in Electron)
    window.speechSynthesis.onvoiceschanged = () => {
      pollCount = pollMax; // stop polling once event fires
      loadVoices();
    };

    // Detect Edge TTS availability
    const av = !!(window.electron?.tts?.edge?.speak && window.electron?.tts?.edge?.voices);
    setEdgeTtsAvailable(av);
    console.log(`[useNarrator] Edge TTS disponivel: ${av}, ${EDGE_VOICES_PT.length} vozes pt-BR`);

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [loadVoices]);

  // Restore saved engine on mount
  useEffect(() => {
    const saved = localStorage.getItem("brane_tts_engine");
    if (saved) setEngine(saved);
  }, []);

  // Save engine and auto-select voice when engine changes
  useEffect(() => {
    localStorage.setItem("brane_tts_engine", engine);
    if (engine === "edge-tts" && edgeVoices.length > 0) {
      setVoice(edgeVoices[0]);
      localStorage.setItem(STORAGE_KEY, edgeVoices[0].name);
    } else if (engine === "webspeech" && voices.length > 0) {
      const picked = pickVoice(window.speechSynthesis.getVoices());
      if (picked) {
        setVoice(picked);
        localStorage.setItem(STORAGE_KEY, picked.name);
      }
    }
  }, [engine, edgeVoices.length, voices, pickVoice]);

  const refreshVoices = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const all = window.speechSynthesis.getVoices();
    setAllVoices(all);
    setAllVoiceCount(all.length);
    console.log(`[useNarrator] ${"=".repeat(40)}`);
    console.log(`[useNarrator] REFRESH - Total de vozes: ${all.length}`);
    all.forEach((v, i) => {
      console.log(`[useNarrator] REFRESH Voz #${i + 1}: nome="${v.name}" lang="${v.lang}" default=${v.default}`);
    });
    console.log(`[useNarrator] ${"=".repeat(40)}`);
    if (all.length === 0) {
      console.warn("[useNarrator] REFRESH - NENHUMA voz encontrada!");
    }
    const pt = all.filter((v) => v.lang.startsWith("pt"));
    setVoices(pt);
    console.log(`[useNarrator] REFRESH - Vozes em portugues: ${pt.length}`);
  }, []);

  const handleSetVoice = useCallback((v) => {
    setVoice(v);
    if (v) localStorage.setItem(STORAGE_KEY, v.name);
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const speak = useCallback((text, onEnd) => {
    if (!text) return;
    if (!enabledRef.current) return;
    const normalized = normalizeSpeechText(text);

    if (engine === "edge-tts" && voiceRef.current?.engine === "edge-tts") {
      // Edge TTS path (requires Electron)
      const v = voiceRef.current;
      if (!window.electron?.tts?.edge?.speak) {
        console.warn("[useNarrator] Edge TTS nao disponivel (fora do Electron)");
        if (onEnd) onEnd();
        return;
      }
      window.electron.tts.edge
        .speak(normalized, v.name, Math.round((rateRef.current - 1) * 100), Math.round((pitchRef.current - 1) * 100))
        .then((result) => {
          if (!result.ok) {
            console.error("[useNarrator] Edge TTS erro:", result.error);
            if (onEnd) onEnd();
            return;
          }
          const blob = base64ToBlob(result.data, "audio/mpeg");
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => {
            audioRef.current = null;
            URL.revokeObjectURL(url);
            if (onEnd) onEnd();
          };
          audio.onerror = () => {
            audioRef.current = null;
            URL.revokeObjectURL(url);
            console.error("[useNarrator] Edge TTS reproducao erro");
            if (onEnd) onEnd();
          };
          audio.play().catch((e) => {
            audioRef.current = null;
            URL.revokeObjectURL(url);
            console.error("[useNarrator] Edge TTS play erro:", e);
            if (onEnd) onEnd();
          });
        })
        .catch((e) => {
          console.error("[useNarrator] Edge TTS speak erro:", e);
          if (onEnd) onEnd();
        });
      return;
    }

    // Web Speech API path
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(normalized);
    u.lang = "pt-BR";
    u.pitch = pitchRef.current;
    u.rate = Math.min(1.5, rateRef.current);
    u.volume = volumeRef.current;
    if (voiceRef.current) {
      u.voice = voiceRef.current;
    } else {
      const pt = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("pt"));
      if (pt.length > 0) u.voice = pt[0];
    }
    u.onerror = (e) => {
      if (e.error !== "canceled") setIsBlocked(true);
    };
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  }, [engine]);

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

  const testEdgeConnection = useCallback(async () => {
    if (!window.electron?.tts?.edge?.test) return "Edge TTS indisponivel (fora do Electron)";
    try {
      const result = await window.electron.tts.edge.test();
      return result.ok ? `Conectado (${result.size} bytes)` : "Falha: " + result.error;
    } catch (e) {
      return "Erro: " + e.message;
    }
  }, []);

  const testVoice = useCallback(() => {
    cancel();
    const text = "Ola. Esta e a voz da narradora do quiz. Vamos aprender juntos.";
    speak(text, () => {});
  }, [cancel, speak]);

  return {
    enabled, setEnabled,
    volume, setVolume,
    rate, setRate,
    pitch, setPitch,
    engine, setEngine,
    voice, setVoice: handleSetVoice,
    voices,
    edgeVoices,
    edgeTtsAvailable,
    allVoices,
    allVoiceCount,
    isSupported,
    isBlocked, setIsBlocked,
    cancel,
    speak,
    speakSequence,
    testVoice,
    testEdgeConnection,
    refreshVoices,
    ENGINES,
    normalizeSpeechText,
  };
}
