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

  const pickVoice = useCallback((all) => {
    // Only Portuguese voices
    const pt = all.filter((v) => v.lang.startsWith("pt"));
    // Try saved voice first
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const match = pt.find((v) => v.name === saved);
      if (match) return match;
    }
    // Fallback: feminine pt-BR
    return (
      pt.find((v) => v.lang.startsWith("pt-BR") && /female|maria|luciana|helena|isabella/i.test(v.name)) ||
      pt.find((v) => v.lang.startsWith("pt-BR")) ||
      pt.find((v) => v.lang.startsWith("pt")) ||
      null
    );
  }, []);

  useEffect(() => {
    const supported = "speechSynthesis" in window;
    setIsSupported(supported);
    if (!supported) return;

    let loadTimer = null;

    const loadVoices = () => {
      if (loadTimer) clearTimeout(loadTimer);
      loadTimer = setTimeout(() => {
        const all = window.speechSynthesis.getVoices();
        if (all.length === 0) return;
        const pt = all.filter((v) => v.lang.startsWith("pt"));
        setVoices(pt);
        // Only auto-pick if no voice is selected yet
        if (!voiceRef.current) {
          const picked = pickVoice(all);
          if (picked) setVoice(picked);
        }
      }, 100);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; if (loadTimer) clearTimeout(loadTimer); };
  }, [pickVoice]);

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
  }, []);

  const speak = useCallback((text, onEnd) => {
    if (!text) return;
    if (!enabledRef.current || !("speechSynthesis" in window)) return;
    const normalized = normalizeSpeechText(text);
    const u = new SpeechSynthesisUtterance(normalized);
    u.lang = "pt-BR";
    u.pitch = pitchRef.current;
    u.rate = Math.min(1.5, rateRef.current);
    u.volume = volumeRef.current;
    if (voiceRef.current) {
      u.voice = voiceRef.current;
    } else {
      // Ensure a pt voice is used even if voice is null
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
    speak("Ola. Esta e a voz da narradora do quiz. Vamos aprender juntos.");
  }, [cancel, speak]);

  return {
    enabled, setEnabled,
    volume, setVolume,
    rate, setRate,
    pitch, setPitch,
    voice, setVoice: handleSetVoice,
    voices,
    isSupported,
    isBlocked, setIsBlocked,
    cancel,
    speak,
    speakSequence,
    testVoice,
    normalizeSpeechText,
  };
}
