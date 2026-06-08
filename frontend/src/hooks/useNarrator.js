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
  "geracao": "geração", "nacao": "nação", "sociedade": "sociedade",
  "variedade": "variedade", "humanidade": "humanidade", "qualidade": "qualidade",
  "quantidade": "quantidade", "atividade": "atividade", "capacidade": "capacidade",
  "oportunidade": "oportunidade", "finalidade": "finalidade", "influencia": "influência",
  "consequencia": "consequência", "experiencia": "experiência", "diferenca": "diferença",
  "presenca": "presença", "ausencia": "ausência", "importancia": "importância",
  "relevancia": "relevância", "distancia": "distância", "sustentavel": "sustentável",
  "notavel": "notável", "notavelmente": "notavelmente", "incrivel": "incrível",
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
  "diferente": "diferente", "semelhante": "semelhante", "proximo": "próximo",
  "indigena": "indígena", "musica": "música", "ingles": "inglês",
  "frances": "francês", "portugues": "português", "japones": "japonês",
  "caracteristica": "característica", "analise": "análise", "sintese": "síntese",
  "hipotese": "hipótese", "crise": "crise", "catastrofe": "catástrofe",
  "metodo": "método", "genero": "gênero", "numero": "número",
  "serie": "série", "especie": "espécie", "nivel": "nível",
  "simbolo": "símbolo", "ambito": "âmbito", "indole": "índole",
  "antartica": "Antártica", "antartida": "Antártida", "egipcio": "egípcio",
  "fotossintese": "fotossíntese", "varios": "vários", "varias": "várias",
  "dinossauro": "dinossauro", "nucleo": "núcleo", "atmosfera": "atmosfera",
  "ecossistema": "ecossistema", "biodiversidade": "biodiversidade",
};

const VOICE_PRESETS = [
  { name: "Maria Natural", match: /maria/i, rate: 0.92, pitch: 1.05 },
  { name: "Daniel Natural", match: /daniel/i, rate: 0.95, pitch: 0.98 },
];

function prepareNaturalSpeech(text) {
  if (!text) return text;
  let s = text;

  // Remove URLs
  s = s.replace(/https?:\/\/\S+/g, "");

  // Remove problematic symbols but keep basic punctuation
  s = s.replace(/[*_~`#^|\\{}[\]<>]/g, "");

  // Collapse multiple spaces
  s = s.replace(/\s+/g, " ");

  // Collapse repetitive punctuation (!!! → ., ??? → ?)
  s = s.replace(/!{2,}/g, ".");
  s = s.replace(/\?{2,}/g, "?");
  s = s.replace(/\.{3,}/g, ".");

  // Ensure space after punctuation if missing
  s = s.replace(/([.!?])([A-Za-z\u00C0-\u024F])/g, "$1 $2");

  // Insert natural pause comma before "mas", "porém", "contudo", "portanto", "então"
  s = s.replace(/\b(mas|porem|contudo|portanto|entao|assim)\b/gi, ", $1");

  // Apply accent map
  for (const [key, val] of Object.entries(ACCENT_MAP)) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    s = s.replace(regex, (match) =>
      match.length > 0 && match[0] === match[0].toUpperCase()
        ? val.charAt(0).toUpperCase() + val.slice(1)
        : val
    );
  }

  // "e" → "é" (verb) before article/pronoun
  s = s.replace(
    /\b[Ee]\s+(o|a|os|as|um|uma|no|na|do|da|num|numa|pelo|pela|seu|sua|seus|suas|este|esta|estes|estas|esse|essa|esses|essas|aquele|aquela|aqueles|aquelas|isso|isto|aquilo|muito|mais|menos|tambem|sempre|nunca|um dos|uma das)\b/gi,
    (match) => "é " + match.split(/\s+/).slice(1).join(" ")
  );
  s = s.replace(/\b(O que|Qual|Quem|Onde|Como|Quando|Por que)\s+e\b/gi, "$1 é");
  s = s.replace(/^E\s+/i, "É ");

  // "a" → "à" before feminine nouns
  s = s.replace(/\bA\s+(a|as)\b/gi, (match) => {
    const words = match.split(/\s+/);
    return "à " + words.slice(1).join(" ");
  });

  // Remove leading/trailing whitespace
  s = s.trim();

  // Ensure ends with period if it's a sentence
  if (s.length > 0 && /[a-zA-Z0-9\u00C0-\u024F"']$/.test(s)) {
    s += ".";
  }

  return s;
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
      if (picked) {
        setVoice(picked);
        applyPreset(picked);
      }
    }
  }, [pickVoice]);

  // Initial load + event listener + polling fallback
  useEffect(() => {
    const supported = "speechSynthesis" in window;
    setIsSupported(supported);
    if (!supported) return;

    const pollMax = 50;
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

  const applyPreset = useCallback((v) => {
    if (!v) return;
    for (const preset of VOICE_PRESETS) {
      if (preset.match.test(v.name)) {
        setRate(preset.rate);
        setPitch(preset.pitch);
        console.log(`[useNarrator] Aplicado preset "${preset.name}": rate=${preset.rate}, pitch=${preset.pitch}`);
        return;
      }
    }
  }, []);

  const refreshVoices = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const all = window.speechSynthesis.getVoices();
    setAllVoices(all);
    setAllVoiceCount(all.length);
    console.log(`[useNarrator] ${"=".repeat(40)}`);
    console.log(`[useNarrator] RECARREGAR - Total de vozes: ${all.length}`);
    all.forEach((v, i) => {
      console.log(`[useNarrator] RECARREGAR Voz #${i + 1}: nome="${v.name}" lang="${v.lang}" default=${v.default}`);
    });
    console.log(`[useNarrator] ${"=".repeat(40)}`);
    if (all.length === 0) {
      console.warn("[useNarrator] RECARREGAR - NENHUMA voz encontrada!");
    }
    const pt = all.filter((v) => v.lang.startsWith("pt"));
    setVoices(pt);
    console.log(`[useNarrator] RECARREGAR - Vozes em portugues: ${pt.length}`);
  }, []);

  const handleSetVoice = useCallback((v) => {
    setVoice(v);
    if (v) {
      localStorage.setItem(STORAGE_KEY, v.name);
      applyPreset(v);
    }
  }, [applyPreset]);

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
    const normalized = prepareNaturalSpeech(text);
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
    const text = "Ola. Esta e a voz da narradora do quiz. Vamos aprender juntos.";
    speak(text, () => {});
  }, [cancel, speak]);

  return {
    enabled, setEnabled,
    volume, setVolume,
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
    prepareNaturalSpeech,
  };
}
