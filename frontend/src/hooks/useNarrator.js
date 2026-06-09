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
  { id: "lenta", label: "Lenta", rate: 0.78 },
  { id: "normal", label: "Normal", rate: 0.95 },
  { id: "rapida", label: "Rápida", rate: 1.08 },
];

const VOICE_PRESETS = [
  { name: "Maria Natural", match: /maria/i, speedMode: "rapida", rate: 1.08, pitch: 1.03 },
  { name: "Daniel Natural", match: /daniel/i, speedMode: "rapida", rate: 1.05, pitch: 0.98 },
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

export default function useNarrator() {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.2);
  const [voice, setVoice] = useState(null);
  const [voices, setVoices] = useState([]);
  const [allVoices, setAllVoices] = useState([]);
  const [allVoiceCount, setAllVoiceCount] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [speedMode, setSpeedModeState] = useState("rapida");
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
    try {
      if (!("speechSynthesis" in window)) return;
      const all = window.speechSynthesis.getVoices();
      setAllVoices(all);
      setAllVoiceCount(all.length);
      const pt = all.filter((v) => v.lang.startsWith("pt"));
      setVoices(pt);
      if (!voiceRef.current) {
        const picked = pickVoice(all);
        if (picked) {
          setVoice(picked);
          applyPreset(picked);
        }
      }
    } catch (err) {
      console.error("[Narrator] loadVoices error:", err);
    }
  }, [pickVoice]);

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

  const refreshVoices = useCallback(() => {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const all = window.speechSynthesis.getVoices();
      setAllVoices(all);
      setAllVoiceCount(all.length);
      const pt = all.filter((v) => v.lang.startsWith("pt"));
      setVoices(pt);
    } catch (err) {
      console.error("[Narrator] refreshVoices error:", err);
    }
  }, []);

  const handleSetVoice = useCallback((v) => {
    setVoice(v);
    if (v) {
      try { localStorage.setItem(STORAGE_KEY, v.name); } catch (err) { console.error("[Narrator] save voice error:", err); }
      applyPreset(v);
    }
  }, [applyPreset]);

  const cancel = useCallback(() => {
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
      u.rate = Math.min(1.5, rateRef.current);
      u.volume = volumeRef.current;
      if (voiceRef.current) u.voice = voiceRef.current;
      u.onerror = (e) => {
        console.error("[Narrator] utterance error:", e.error);
        if (e.error !== "canceled" && e.error !== "interrupted") setIsBlocked(true);
        if (onEnd) onEnd();
      };
      if (onEnd) u.onend = onEnd;
      window.speechSynthesis.speak(u);
    } catch (err) {
      console.error("[Narrator] speakSingle error:", err);
      if (onEnd) setTimeout(onEnd, 0);
    }
  }, []);

  const speak = useCallback((text, onEnd) => {
    try {
      if (!text) {
        if (onEnd) setTimeout(onEnd, 0);
        return;
      }
      if (!enabledRef.current || !("speechSynthesis" in window)) {
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
      const filtered = items.filter((item) => item.text);
      if (!enabledRef.current || filtered.length === 0) {
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
    voices,
    allVoices,
    allVoiceCount,
    isSupported,
    isBlocked, setIsBlocked,
    cancel,
    speak,
    speakSequence,
    testVoice,
    refreshVoices,
    VOICE_PRESETS,
    SPEED_OPTIONS,
    normalizePortugueseSpeech,
  };
}
