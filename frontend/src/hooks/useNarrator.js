import { useState, useEffect, useCallback, useRef } from "react";

const ACCENT_MAP = {
  "informacao": "informação", "educacao": "educação", "atencao": "atenção",
  "inteligencia": "inteligência", "programacao": "programação", "conteudo": "conteúdo",
  "negocio": "negócio", "historia": "história", "tecnologia": "tecnologia",
  "economia": "economia", "ciencia": "ciência", "filosofia": "filosofia",
  "biologia": "biologia", "geografia": "geografia", "astronomia": "astronomia",
  "tecnica": "técnica", "publica": "pública", "epoca": "época",
  "transicao": "transição", "evolucao": "evolução", "revolucao": "revolução",
  "producao": "produção", "comunicacao": "comunicação", "exploracao": "exploração",
  "civilizacao": "civilização", "organizacao": "organização", "transformacao": "transformação",
  "geracao": "geração", "nacao": "nação", "gravacao": "gravação",
  "sociedade": "sociedade", "variedade": "variedade", "humanidade": "humanidade",
  "qualidade": "qualidade", "quantidade": "quantidade", "atividade": "atividade",
  "capacidade": "capacidade", "oportunidade": "oportunidade", "finalidade": "finalidade",
  "influencia": "influência", "consequencia": "consequência", "experiencia": "experiência",
  "diferenca": "diferença", "presenca": "presença", "ausencia": "ausência",
  "importancia": "importância", "relevancia": "relevância", "distancia": "distância",
  "sustentavel": "sustentável", "notavel": "notável", "incrivel": "incrível",
  "possivel": "possível", "impossivel": "impossível", "visivel": "visível",
  "viavel": "viável", "automatico": "automático", "pratico": "prático",
  "unico": "único", "cientifico": "científico", "economico": "econômico",
  "tecnologico": "tecnológico", "historico": "histórico", "geografico": "geográfico",
  "democratico": "democrático", "politico": "político", "publico": "público",
  "critico": "crítico", "periodo": "período", "seculo": "século",
  "inicio": "início", "medio": "médio", "proprio": "próprio",
  "dinamico": "dinâmico", "tambem": "também", "alem": "além",
  "voce": "você", "fisica": "física", "quimica": "química",
  "matematica": "matemática", "robotica": "robótica", "mecanica": "mecânica",
  "eletronica": "eletrônica", "logica": "lógica", "formula": "fórmula",
  "particula": "partícula", "molecula": "molécula", "celula": "célula",
  "indigena": "indígena", "musica": "música", "ingles": "inglês",
  "frances": "francês", "portugues": "português", "japones": "japonês",
  "holandes": "holandês",
  "caracteristica": "característica", "analise": "análise", "sintese": "síntese",
  "hipotese": "hipótese", "crise": "crise", "catastrofe": "catástrofe",
  "metodo": "método", "genero": "gênero", "numero": "número",
  "serie": "série", "especie": "espécie", "nivel": "nível",
  "simbolo": "símbolo", "ambito": "âmbito", "indole": "índole",
  "antartica": "Antártica", "antartida": "Antártida", "egipcio": "egípcio",
  "fotossintese": "fotossíntese", "varios": "vários", "varias": "várias",
  "dinossauro": "dinossauro", "nucleo": "núcleo", "atmosfera": "atmosfera",
  "ecossistema": "ecossistema", "biodiversidade": "biodiversidade",
  "imperio": "império", "politica": "política", "media": "média",
  "Idade Media": "Idade Média",
  "Canada": "Canadá", "Japao": "Japão", "Grecia": "Grécia",
  "Italia": "Itália", "Mexico": "México",
  "Africa": "África", "Asia": "Ásia", "America": "América",
  "Europa": "Europa", "Oceania": "Oceania",
  "Australia": "Austrália", "Escocia": "Escócia", "Franca": "França",
  "India": "Índia", "Russia": "Rússia", "Suecia": "Suécia",
  "Suica": "Suíça", "Turquia": "Turquia", "Ucrania": "Ucrânia",
  "Brasilia": "Brasília",
  "Amazonia": "Amazônia", "Sertao": "Sertão",
  "Siberia": "Sibéria", "Groenlandia": "Groenlândia",
  "Mediterraneo": "Mediterrâneo",
  "Atlantico": "Atlântico", "Pacifico": "Pacífico",
  "Artico": "Ártico", "Indico": "Índico",
  "Mausoleu": "Mausoléu", "Tumulo": "Túmulo",
  "Piramide": "Pirâmide", "Palacio": "Palácio",
  "tres": "três",
  "fenomeno": "fenômeno", "fenomenos": "fenômenos",
  "indice": "índice", "codigo": "código",
  "gramatica": "gramática", "ortografia": "ortografia",
  "semantica": "semântica", "fonetica": "fonética",
  "dicionario": "dicionário", "vocabulario": "vocabulário",
  "enciclopedia": "enciclopédia", "biblioteca": "biblioteca",
  "heroi": "herói", "herois": "heróis",
  "papeis": "papéis", "aneis": "anéis",
  "acido": "ácido", "basico": "básico",
  "solido": "sólido", "liquido": "líquido", "gasoso": "gasoso",
  "variavel": "variável", "variaveis": "variáveis",
  "aleatorio": "aleatório", "aleatoria": "aleatória",
  "contemporaneo": "contemporâneo", "contemporanea": "contemporânea",
  "temporario": "temporário", "temporaria": "temporária",
  "intermediario": "intermediário", "intermediaria": "intermediária",
  "secundario": "secundário", "secundaria": "secundária",
  "provisorio": "provisório", "provisoria": "provisória",
  "avancado": "avançado", "avancada": "avançada",
  "espaco": "espaço", "poco": "poço",
  "atomo": "átomo", "eletron": "elétron", "proton": "próton",
  "neutron": "nêutron", "foton": "fóton",
  "genetica": "genética",
  "botanica": "botânica", "zoologia": "zoologia",
  "bioquimica": "bioquímica", "biofisica": "biofísica",
  "sociologia": "sociologia", "psicologia": "psicologia",
  "antropologia": "antropologia", "arqueologia": "arqueologia",
  "Republica": "República",
  "capitao": "capitão",
  "missoes": "missões", "expressoes": "expressões",
};

const PHONETIC_MAP = {
  "finalizacao": "finalização",
  "finalizações": "finalizações",
  "console": "cônsol",
  "controle": "controle",
  "software": "softuér",
  "hardware": "rárduér",
  "online": "onlaine",
  "site": "sáite",
  "app": "ápi",
  "email": "iméil",
};

const ABBREVIATION_MAP = {
  "IA": "inteligência artificial",
  "DNS": "dê ene ésse",
  "PDF": "pê dê efe",
  "RPG": "érre pê gê",
  "PC": "pê cê",
  "OBS": "ó bê ésse",
  "TikTok": "tique toque",
  "YouTube": "iutúbi",
};

const SPEED_OPTIONS = [
  { id: "normal", label: "Normal", rate: 0.95 },
  { id: "rapida", label: "Rápida", rate: 1.3 },
  { id: "muito_rapida", label: "Muito Rápida", rate: 2.0 },
  { id: "turbo", label: "Turbo", rate: 3.5 },
  { id: "extrema", label: "Extrema", rate: 5.0 },
];

const VOICE_PRESETS = [
  { name: "Maria Natural", match: /maria/i, speedMode: "rapida", rate: 1.3, pitch: 1.03 },
  { name: "Daniel Natural", match: /daniel/i, speedMode: "rapida", rate: 1.3, pitch: 0.98 },
];

const MAX_CHARS = 280;

function normalizePortugueseSpeech(text) {
  if (!text) return text;
  let s = text;

  s = s.replace(/https?:\/\/\S+/g, "");
  s = s.replace(/[*_~`#^|\\{}[\]<>]/g, "");
  s = s.replace(/\s+/g, " ");
  s = s.replace(/!{2,}/g, ".");
  s = s.replace(/\?{2,}/g, "?");
  s = s.replace(/\.{3,}/g, ".");
  s = s.replace(/([.!?])([A-Za-z\u00C0-\u024F])/g, "$1 $2");
  s = s.replace(/\b(mas|porem|contudo|portanto|entao|assim)\b/gi, ", $1");

  // Phonetic map for commonly mispronounced words
  for (const [key, val] of Object.entries(PHONETIC_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    s = s.replace(regex, val);
  }

  for (const [key, val] of Object.entries(ABBREVIATION_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, "g");
    s = s.replace(regex, val);
  }

  for (const [key, val] of Object.entries(ACCENT_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    s = s.replace(regex, (match) =>
      match[0] === match[0].toUpperCase()
        ? val.charAt(0).toUpperCase() + val.slice(1)
        : val
    );
  }

  s = s.replace(
    /\b[Ee]\s+(o|a|os|as|um|uma|no|na|do|da|num|numa|pelo|pela|seu|sua|seus|suas|este|esta|estes|estas|esse|essa|esses|essas|aquele|aquela|aqueles|aquelas|isso|isto|aquilo|muito|mais|menos|tambem|sempre|nunca|um dos|uma das)\b/gi,
    (match) => "é " + match.split(/\s+/).slice(1).join(" ")
  );
  s = s.replace(/\b(O que|Qual|Quem|Onde|Como|Quando|Por que)\s+e\b/gi, "$1 é");
  s = s.replace(/^E\s+/i, "É ");
  s = s.replace(/\b[Aa]\s+(a|as)\b/gi, (match) => "à " + match.split(/\s+/).slice(1).join(" "));

  s = s.trim();
  if (s.length > 0 && /[a-zA-Z0-9\u00C0-\u024F"']$/.test(s)) {
    s += ".";
  }
  console.log("[normalizeSpeech] ORIGINAL:", text);
  console.log("[normalizeSpeech] NORMALIZADO:", s);
  return s;
}

function splitLongText(text) {
  if (text.length <= MAX_CHARS) return [text];
  const parts = [];
  const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHARS && current) {
      parts.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts.length > 0 ? parts : [text];
}

const STORAGE_KEY = "brane_narrator_voice";

const VOICE_MODES = [
  { id: "padrao", label: "Padr\u00e3o", desc: "Voz preferida automatica" },
  { id: "mulher", label: "Mulher", desc: "Voz feminina" },
  { id: "homem", label: "Homem", desc: "Voz masculina" },
  { id: "aleatorio", label: "Aleat\u00f3rio", desc: "Voz aleatoria a cada fala" },
  { id: "alternado", label: "Alternado", desc: "Alterna entre vozes disponiveis" },
];

export default function useNarrator() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.2);
  const [voice, setVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const [allVoices, setAllVoices] = useState([]);
  const [allVoiceCount, setAllVoiceCount] = useState(0);
  const [voiceMode, setVoiceModeState] = useState("padrao");
  const [isSupported, setIsSupported] = useState(false);
  const [speedMode, setSpeedModeState] = useState("rapida");
  const [isBlocked, setIsBlocked] = useState(false);
  const [activationStatus, setActivationStatus] = useState("idle");

  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);
  const rateRef = useRef(rate);
  const pitchRef = useRef(pitch);
  const voiceRef = useRef(voice);
  const voiceModeRef = useRef(voiceMode);
  const timeoutRef = useRef(null);
  const altIndexRef = useRef(0);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { rateRef.current = rate; }, [rate]);
  useEffect(() => { pitchRef.current = pitch; }, [pitch]);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  const pickVoiceByMode = useCallback((all, mode, currentVoice) => {
    if (!all || all.length === 0) return null;
    const pt = all.filter((v) => v.lang && v.lang.startsWith("pt"));
    const anyVoice = all;
    switch (mode) {
      case "homem": {
        const men = (pt.length > 0 ? pt : anyVoice).filter((v) => /male|daniel|paulo|rodrigo|marcos|felipe|ricardo|eduardo|homem/i.test(v.name));
        if (men.length > 0) return men[Math.floor(Math.random() * men.length)];
        const fallbackMen = (pt.length > 0 ? pt : anyVoice).filter((v) => !/female|maria|luciana|helena|isabella|woman/i.test(v.name));
        if (fallbackMen.length > 0) return fallbackMen[Math.floor(Math.random() * fallbackMen.length)];
        return pt.length > 0 ? pt[0] : anyVoice[0];
      }
      case "mulher": {
        const women = (pt.length > 0 ? pt : anyVoice).filter((v) => /female|maria|luciana|helena|isabella|julia|ana|woman|menina/i.test(v.name));
        if (women.length > 0) return women[Math.floor(Math.random() * women.length)];
        const fallbackWomen = (pt.length > 0 ? pt : anyVoice).filter((v) => !/male|daniel|paulo|rodrigo|homem/i.test(v.name));
        if (fallbackWomen.length > 0) return fallbackWomen[Math.floor(Math.random() * fallbackWomen.length)];
        return pt.length > 0 ? pt[0] : anyVoice[0];
      }
      case "aleatorio": {
        return all[Math.floor(Math.random() * all.length)];
      }
      case "alternado": {
        const available = all.length > 0 ? all : (pt.length > 0 ? pt : anyVoice);
        if (available.length === 0) return null;
        altIndexRef.current = (altIndexRef.current + 1) % available.length;
        return available[altIndexRef.current];
      }
      default: {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const match = (pt.length > 0 ? pt : anyVoice).find((v) => v.name === saved);
          if (match) return match;
        }
        return pickDefaultVoice(all);
      }
    }
  }, []);

  const pickDefaultVoice = useCallback((all) => {
    const pt = all.filter((v) => v.lang && v.lang.startsWith("pt"));
    return (
      pt.find((v) => v.lang.startsWith("pt-BR") && /female|maria|luciana|helena|isabella/i.test(v.name)) ||
      pt.find((v) => v.lang.startsWith("pt-BR")) ||
      pt.find((v) => v.lang.startsWith("pt")) ||
      null
    );
  }, []);

  const loadVoices = useCallback(() => {
    try {
      if (!("speechSynthesis" in window)) return;
      const all = window.speechSynthesis.getVoices();
      setAllVoices(all);
      setAllVoiceCount(all.length);
      const pt = all.filter((v) => v.lang && v.lang.startsWith("pt"));
      setVoices(pt);
      if (!voiceRef.current) {
        const picked = pickVoiceByMode(all, voiceModeRef.current || "padrao", null);
        if (picked) {
          setVoice(picked);
          applyPreset(picked);
        }
      }
    } catch (err) {
      console.error("[Narrator] loadVoices error:", err);
    }
  }, [pickVoiceByMode]);

  useEffect(() => {
    const supported = "speechSynthesis" in window;
    setIsSupported(supported);
    if (!supported) return;

    let pollCount = 0;
    let pollTimer = null;
    const pollMax = 50;

    const tryLoad = () => {
      try {
        const all = window.speechSynthesis.getVoices();
        if (all.length > 0 || pollCount >= pollMax) {
          loadVoices();
          return;
        }
      } catch (err) {
        console.error("[Narrator] poll error:", err);
      }
      pollCount++;
      pollTimer = setTimeout(tryLoad, 100);
    };

    tryLoad();

    window.speechSynthesis.onvoiceschanged = () => {
      pollCount = pollMax;
      loadVoices();
    };

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [loadVoices]);

  const setSpeedMode = useCallback((id) => {
    try {
      const opt = SPEED_OPTIONS.find((o) => o.id === id);
      if (opt) {
        setSpeedModeState(id);
        setRate(opt.rate);
      }
    } catch (err) {
      console.error("[Narrator] setSpeedMode error:", err);
    }
  }, []);

  const applyPreset = useCallback((v) => {
    if (!v) return;
    try {
      for (const preset of VOICE_PRESETS) {
        if (preset.match.test(v.name)) {
          setSpeedModeState(preset.speedMode);
          setRate(preset.rate);
          setPitch(preset.pitch);
          console.log("[Narrator] Preset aplicado:", preset.name, "rate:", preset.rate, "pitch:", preset.pitch);
          return;
        }
      }
    } catch (err) {
      console.error("[Narrator] applyPreset error:", err);
    }
  }, []);

  const setVoiceMode = useCallback((mode) => {
    setVoiceModeState(mode);
    try { localStorage.setItem("brane_voice_mode", mode); } catch (e) {}
    if (allVoices.length > 0) {
      const picked = pickVoiceByMode(allVoices, mode, voiceRef.current);
      if (picked) handleSetVoice(picked);
    }
  }, [allVoices, pickVoiceByMode]);

  const refreshVoices = useCallback(() => {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const all = window.speechSynthesis.getVoices();
      setAllVoices(all);
      setAllVoiceCount(all.length);
      const pt = all.filter((v) => v.lang && v.lang.startsWith("pt"));
      setVoices(pt);
    } catch (err) {
      console.error("[Narrator] refreshVoices error:", err);
    }
  }, []);

  const handleSetVoice = useCallback((v) => {
    setVoice(v);
    if (v) {
      try { localStorage.setItem(STORAGE_KEY, v.name); } catch (err) { console.error("[Narrator] save voice error:", err); }
      // Do NOT applyPreset here — user explicitly chose this voice, respect their settings
    }
  }, []);

  const activate = useCallback(() => {
    if (activationStatus !== "idle") return;
    setActivationStatus("activating");
    try {
      if (!("speechSynthesis" in window)) {
        setActivationStatus("error");
        return;
      }
      window.speechSynthesis.cancel();
      const all = window.speechSynthesis.getVoices();
      setAllVoices(all);
      setAllVoiceCount(all.length);
      const pt = all.filter((v) => v.lang && v.lang.startsWith("pt"));
      setVoices(pt);
      const savedMode = localStorage.getItem("brane_voice_mode") || "padrao";
      setVoiceModeState(savedMode);
      voiceModeRef.current = savedMode;
      if (!voiceRef.current) {
        const picked = pickVoiceByMode(all, savedMode, null);
        if (picked) { setVoice(picked); applyPreset(picked); }
      }
      const u = new SpeechSynthesisUtterance("áudio");
      u.volume = 1; u.rate = 1; u.lang = "pt-BR";
      if (voiceRef.current) u.voice = voiceRef.current;
      window.speechSynthesis.speak(u);
      setTimeout(() => { try { window.speechSynthesis.cancel(); } catch (e) {} }, 50);
      setIsBlocked(false);
      setActivationStatus("activated");
    } catch (err) {
      console.error("[Narrator] activate error:", err);
      setActivationStatus("error");
    }
  }, [activationStatus, pickVoiceByMode, applyPreset]);

  const cancel = useCallback(() => {
    console.log("[TTS_CANCEL] narrator cancel called");
    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (err) {
      console.error("[Narrator] cancel error:", err);
    }
  }, []);

  const speakSingle = useCallback((text, onEnd) => {
    try {
      if (!("speechSynthesis" in window)) {
        if (onEnd) setTimeout(onEnd, 0);
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      u.pitch = pitchRef.current;
      u.rate = rateRef.current;
      u.volume = volumeRef.current;
      const mode = voiceModeRef.current;
      if (mode === "aleatorio" || mode === "alternado") {
        const all = window.speechSynthesis.getVoices();
        if (all.length > 0) {
          const picked = pickVoiceByMode(all, mode, voiceRef.current);
          if (picked) {
            u.voice = picked;
            if (mode === "aleatorio") {
              setVoice(picked);
              voiceRef.current = picked;
            }
          } else if (voiceRef.current) {
            u.voice = voiceRef.current;
          }
        } else if (voiceRef.current) {
          u.voice = voiceRef.current;
        }
      } else if (voiceRef.current) {
        u.voice = voiceRef.current;
      }
      u.onerror = (e) => {
        console.log("[TTS_ERROR] narrator utterance error", e.error, e);
        try { window.__lastTtsEvent = { type: "TTS_ERROR", source: "narrator", error: e.error, timestamp: Date.now() }; } catch (err) {}
        if (e.error !== "canceled" && e.error !== "interrupted") setIsBlocked(true);
        if (onEnd) {
          console.log("[TTS_ERROR] narrator invoking onEnd callback after utterance error");
          onEnd();
        }
      };
      if (onEnd) {
        u.onend = () => {
          console.log("[TTS_END] narrator utterance ended");
          try { window.__lastTtsEvent = { type: "TTS_END", source: "narrator", timestamp: Date.now() }; } catch (err) {}
          onEnd();
        };
      }
      window.speechSynthesis.speak(u);
    } catch (err) {
      console.error("[Narrator] speakSingle error:", err);
      if (onEnd) setTimeout(onEnd, 0);
    }
  }, [pickVoiceByMode]);

  const speak = useCallback((text, onEnd) => {
    try {
      console.log("[TTS_START] narrator speak", { text });
      try { window.__lastTtsEvent = { type: "TTS_START", source: "narrator", text, timestamp: Date.now() }; } catch (err) {}
      if (!text) {
        console.log("[TTS_ERROR] narrator speak aborted - empty text");
        if (onEnd) setTimeout(onEnd, 0);
        return;
      }
      if (!enabledRef.current || !("speechSynthesis" in window)) {
        console.log("[TTS_ERROR] narrator speak aborted - disabled or unsupported", { enabled: enabledRef.current });
        if (onEnd) setTimeout(onEnd, 0);
        return;
      }
      const normalized = normalizePortugueseSpeech(text);
      const parts = splitLongText(normalized);

      if (parts.length === 1) {
        speakSingle(parts[0], onEnd);
      } else {
        let i = 0;
        const next = () => {
          if (!enabledRef.current || i >= parts.length) {
            if (onEnd) onEnd();
            return;
          }
          speakSingle(parts[i], i < parts.length - 1 ? next : onEnd);
          i++;
        };
        next();
      }
    } catch (err) {
      console.error("[Narrator] speak error:", err);
      if (onEnd) setTimeout(onEnd, 0);
    }
  }, [speakSingle]);

  const speakSequence = useCallback((items, onEnd) => {
    try {
      console.log("[TTS_START] narrator speakSequence", { items });
      try { window.__lastTtsEvent = { type: "TTS_START", source: "narratorSequence", items, timestamp: Date.now() }; } catch (err) {}
      const filtered = items.filter((item) => item.text);
      if (!enabledRef.current || filtered.length === 0) {
        console.log("[TTS_ERROR] narrator speakSequence aborted", { enabled: enabledRef.current, count: filtered.length });
        if (onEnd) setTimeout(onEnd, 0);
        return;
      }
      let i = 0;
      const next = () => {
        if (!enabledRef.current || i >= filtered.length) {
          if (onEnd) onEnd();
          return;
        }
        const { text, delayAfter = 300 } = filtered[i];
        i++;
        speak(text, () => {
          if (i < filtered.length) {
            timeoutRef.current = setTimeout(next, delayAfter);
          } else if (onEnd) {
            console.log("[TTS_END] narrator speakSequence completed");
            onEnd();
          }
        });
      };
      next();
    } catch (err) {
      console.error("[Narrator] speakSequence error:", err);
      if (onEnd) setTimeout(onEnd, 0);
    }
  }, [speak]);

  const testVoice = useCallback(() => {
    cancel();
    speak("Olá. Esta é a voz da narradora do quiz. Vamos aprender juntos.", () => {});
  }, [cancel, speak]);

  return {
    enabled, setEnabled,
    volume, setVolume,
    speedMode, setSpeedMode,
    rate, setRate,
    pitch, setPitch,
    voice, setVoice: handleSetVoice,
    voiceMode, setVoiceMode,
    voices,
    allVoices,
    allVoiceCount,
    isSupported,
    isBlocked, setIsBlocked,
    activationStatus, activate,
    cancel,
    speak,
    speakSequence,
    testVoice,
    refreshVoices,
    VOICE_PRESETS,
    SPEED_OPTIONS,
    VOICE_MODES,
    normalizePortugueseSpeech,
  };
}
