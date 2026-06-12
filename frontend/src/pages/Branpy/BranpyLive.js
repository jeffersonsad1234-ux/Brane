import { useState, useEffect, useRef, useCallback } from "react";
import { getLiveQuiz } from "./BranpyAPI";
import useNarrator from "../../hooks/useNarrator";
import useTtsPlayer from "../../hooks/useTtsPlayer";
import useBackgroundMusic from "../../hooks/useBackgroundMusic";
import useLiveSync from "../../hooks/useLiveSync";
import AnimatedBackground from "./AnimatedBackground";

const COLORS = {
  bg: "#050608",
  primary: "#8A2CFF",
  secondary: "#5B1BA6",
  accent: "#00E5FF",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.5)",
  correct: "#2ECC71",
  wrong: "#E74C3C",
};

const ALTERNATIVE_LABELS = ["A", "B", "C", "D"];

const GENERIC_EXPLANATIONS = [
  "Esse é um tema relevante que merece atenção e estudo",
];

const ENCOURAGEMENTS = [
  "Muito bem!",
  "Excelente!",
  "Você está indo muito bem!",
  "Acertou!",
  "Vamos para a próxima!",
  "Boa resposta!",
];

function getRandomEncouragement() {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

function isGenericExplanation(text) {
  if (!text) return true;
  const trimmed = text.trim().toLowerCase();
  if (trimmed.length < 10) return true;
  return GENERIC_EXPLANATIONS.some((g) => g.toLowerCase() === trimmed);
}

export function shuffleQuestion(question, debug = false) {
  if (!question.alternatives || question.alternatives.length < 2) return question;
  const originalCorrect = question.correct;
  const indices = question.alternatives.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffled = {
    ...question,
    alternatives: indices.map((i) => question.alternatives[i]),
    correct: indices.indexOf(originalCorrect),
  };
  if (debug) {
    console.log(`[Shuffle] ${"=".repeat(50)}`);
    console.log(`[Shuffle] Pergunta: "${question.question}"`);
    console.log(`[Shuffle] Alternativas ORIGINAIS:`, question.alternatives);
    console.log(`[Shuffle] Correct ORIGINAL: ${originalCorrect} (${ALTERNATIVE_LABELS[originalCorrect] || "?"})`);
    console.log(`[Shuffle] Alternativas EMBARALHADAS:`, shuffled.alternatives);
    console.log(`[Shuffle] Correct FINAL: ${shuffled.correct} (${ALTERNATIVE_LABELS[shuffled.correct] || "?"})`);
    console.log(`[Shuffle] ${"=".repeat(50)}`);
  }
  return shuffled;
}

function randomViewers() {
  const base = [500, 1000, 2000, 5000, 8000, 12000];
  const chosen = base[Math.floor(Math.random() * base.length)];
  const variance = Math.floor(Math.random() * 500) - 250;
  return Math.max(100, chosen + variance);
}

function formatViewers(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
  return String(n);
}

function CountdownNumber({ number, visible }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 150,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 180, fontWeight: 900, color: COLORS.primary,
          textShadow: `0 0 60px ${COLORS.primary}, 0 0 120px ${COLORS.primary}40`,
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1,
          animation: "pulse 0.5s ease-in-out",
        }}
      >
        {number}
      </div>
    </div>
  );
}

function AnswerReveal({ question, correct, explanation }) {
  const correctLetter = ALTERNATIVE_LABELS[correct] || "?";
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 150,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(5,6,8,0.92)",
        backdropFilter: "blur(6px)", padding: 40,
      }}
    >
      <div
        style={{
          fontSize: 14, fontWeight: 700, color: COLORS.correct,
          textTransform: "uppercase", letterSpacing: 3, marginBottom: 16,
        }}
      >
        Resposta Correta
      </div>
      <div
        style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLORS.correct}, #1a9e56)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20, boxShadow: `0 0 40px ${COLORS.correct}60`,
        }}
      >
        <span style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>
          {correctLetter}
        </span>
      </div>
      <div
        style={{
          fontSize: 22, fontWeight: 700, color: COLORS.text,
          textAlign: "center", maxWidth: 600, marginBottom: 8,
        }}
      >
        {question.alternatives[correct]}
      </div>
      {explanation && (
        <div
          style={{
            fontSize: 14, color: COLORS.muted,
            textAlign: "center", maxWidth: 500, lineHeight: 1.5,
          }}
        >
          {explanation}
        </div>
      )}
    </div>
  );
}

const PHASE_DEF = {
  question_intro: { next: "countdown",  fallback: 15000 },
  countdown:      { next: "answer",     minTime: 10000, fallback: 12000 },
  answer:         { next: "explanation", fallback: 10000 },
  explanation:    { next: null,          fallback: 15000 },
};

export default function BranpyLive() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("loading");
  const [countdown, setCountdown] = useState(10);
  const [viewers, setViewers] = useState(1234);
  const [loadingText, setLoadingText] = useState("Carregando...");
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const [bgVariant, setBgVariant] = useState(() => localStorage.getItem("brane_bg") || "neon");

  const countdownRef = useRef(null);
  const viewerRef = useRef(null);
  const syncRef = useRef({ minDone: false, narDone: false, advancing: false, timerId: null, fallbackId: null });
  const [announcing, setAnnouncing] = useState(false);
  const [activeQuizCategory, setActiveQuizCategory] = useState(null);
  const narrator = useNarrator();

  const ttsPlayer = useTtsPlayer();

  const music = useBackgroundMusic();

  const liveSync = useLiveSync("live");
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const handleActivateAudio = async () => {
    try {
      narrator.activate();
      music.activate();
      ttsPlayer.unlock();
      const cfg = quizConfigRef.current;
      console.log("[LIVE] Ativando audio, quizConfig:", cfg);
      await loadQuestions(cfg.category, cfg.count);
    } catch (err) {
      console.error("[BranpyLive] activate error:", err);
      setLoadingText("Erro ao iniciar.");
    }
  };

  const clearAllTimers = useCallback(() => {
    const s = syncRef.current;
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (s.timerId) { clearTimeout(s.timerId); s.timerId = null; }
    if (s.fallbackId) { clearTimeout(s.fallbackId); s.fallbackId = null; }
  }, []);

  const quizConfigRef = useRef({ category: null, count: null, shouldLoop: true });

  const loadQuestions = useCallback(async (category, count) => {
    try {
      const limit = count || 50;
      console.log(`[LIVE] loadQuestions: limit=${limit}, category=${category || "(todas)"}`);
      const data = await getLiveQuiz(limit, category);
      console.log(`[LIVE] API retornou ${data.questions?.length || 0} questoes, category_total=${data.category_total || "?"}`);
      if (data.questions && data.questions.length > 0) {
        const shuffled = data.questions.map((q) => shuffleQuestion(q, true));
        setQuestions(shuffled);
        setCurrentIndex(0);
        setPhase("question_intro");
        // Pre-generate TTS audio for all questions (async, non-blocking)
        const pregenItems = [];
        shuffled.forEach((q, idx) => {
          pregenItems.push({ id: `q${idx}_intro`, text: q.question });
          pregenItems.push({ id: `q${idx}_ans`, text: q.alternatives[q.correct] });
          if (q.explanation && !isGenericExplanation(q.explanation)) {
            pregenItems.push({ id: `q${idx}_expl`, text: q.explanation });
          }
        });
        ttsPlayer.pregenItems(pregenItems).then(results => {
          const failed = results.filter(r => r.error);
          if (failed.length === results.length) {
            console.warn("[TTS] All pregen failed");
          } else if (failed.length > 0) {
            console.warn(`[TTS] ${failed.length}/${results.length} pregen failed`);
          } else {
            console.log(`[TTS] Pre-generated ${results.length} audio files`);
          }
        });
      } else {
        const catName = category || "todas";
        setLoadingText(`Erro ao carregar categoria: ${catName} (0 perguntas)`);
      }
    } catch (err) {
      console.error("[LIVE] loadQuestions error:", err);
      const catName = category || "todas";
      setLoadingText(`Erro ao carregar categoria: ${catName}`);
    }
  }, [ttsPlayer]);

  useEffect(() => {
    viewerRef.current = setInterval(() => setViewers(randomViewers()), 8000);
    return () => clearInterval(viewerRef.current);
  }, []);

  // Cancel narration on unmount only (not on phase change)
  useEffect(() => {
    return () => narrator.cancel();
  }, []);

  const advancePhase = useCallback(() => {
    if (pausedRef.current) return;
    const def = PHASE_DEF[phase];
    if (!def || !def.next) {
      const nextIdx = currentIndex + 1;
      if (nextIdx >= questions.length) {
        const cfg = quizConfigRef.current;
        if (cfg.shouldLoop) {
          loadQuestions(cfg.category, cfg.count);
        } else {
          setPhase("loading");
          setLoadingText("Quiz concluído!");
        }
      } else { setCurrentIndex(nextIdx); setPhase("question_intro"); }
    } else {
      setPhase(def.next);
    }
  }, [phase, currentIndex, questions.length, loadQuestions]);

  // ── Synchronized phase driver (timer + narration + fallback) ──
  useEffect(() => {
    if (paused || phase === "loading") return;
    const q = questions[currentIndex];
    if (!q) return;
    const def = PHASE_DEF[phase];
    if (!def) return;

    console.log(`${phase.toUpperCase()} START`);

    const sync = syncRef.current;
    sync.minDone = false;
    sync.narDone = false;
    sync.advancing = false;

    let narItems = [];
    if (phase === "question_intro") {
      narItems = [{ text: q.question }];
    } else if (phase === "answer") {
      narItems = [{ text: q.alternatives[q.correct] }];
    } else if (phase === "explanation") {
      if (q.explanation && !isGenericExplanation(q.explanation)) {
        narItems = [{ text: q.explanation }];
      } else {
        narItems = [{ text: getRandomEncouragement() }];
      }
    }
    // countdown: no narration — only visual alternatives + timer

    const isTts = ttsPlayer.ttsEnabled;

    const tryAdvance = () => {
      if (sync.advancing) return;
      if (phase === "countdown") {
        if (!sync.minDone) return;
      } else {
        if (!sync.narDone) return;
      }
      if (!isTts && window.speechSynthesis && window.speechSynthesis.speaking) return;
      sync.advancing = true;
      console.log(`${phase.toUpperCase()} COMPLETE`);
      advancePhase();
    };

    // Fallback safety net
    sync.fallbackId = setTimeout(() => {
      if (!sync.advancing) {
        if (phase === "countdown") {
          sync.minDone = true;
        } else {
          sync.narDone = true;
        }
        if (isTts || !(window.speechSynthesis && window.speechSynthesis.speaking)) {
          console.log(`${phase.toUpperCase()} FALLBACK`);
          tryAdvance();
        }
      }
    }, def.fallback);

    // Countdown timer (only used for countdown phase)
    if (def.minTime != null) {
      sync.timerId = setTimeout(() => {
        sync.minDone = true;
        tryAdvance();
      }, def.minTime);
    }

    // Narration (countdown has none)
    if (narItems.length > 0) {
      const onNarEnd = () => { sync.narDone = true; tryAdvance(); };
      if (isTts) {
        ttsPlayer.speakSequence(narItems, onNarEnd);
      } else {
        narrator.speakSequence(narItems, onNarEnd);
      }
    } else if (phase !== "countdown") {
      sync.narDone = true;
      tryAdvance();
    }

    return () => {
      if (sync.timerId) { clearTimeout(sync.timerId); sync.timerId = null; }
      if (sync.fallbackId) { clearTimeout(sync.fallbackId); sync.fallbackId = null; }
    };
  }, [phase, currentIndex, paused, advancePhase]);

  // ── Countdown visual ticker (only during countdown phase) ─────
  useEffect(() => {
    if (paused) {
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
      return;
    }
    if (phase === "countdown") {
      setCountdown(10);
      const start = Date.now();
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 10 - Math.floor(elapsed / 1000));
        setCountdown(remaining);
        if (remaining <= 0) { clearInterval(countdownRef.current); countdownRef.current = null; }
      }, 200);
    }
    return () => { if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; } };
  }, [phase, paused]);

  const cancelAll = useCallback(() => {
    narrator.cancel();
    ttsPlayer.cancel();
  }, [narrator, ttsPlayer]);

  const handleTogglePause = () => {
    setPaused((p) => { if (!p) cancelAll(); return !p; });
  };

  const handleRestart = () => {
    clearAllTimers(); cancelAll(); setPaused(false); setPhase("loading");
    const cfg = quizConfigRef.current;
    loadQuestions(cfg.category, cfg.count);
  };

  const handleRemotePause = useCallback(() => {
    cancelAll(); setPaused(true); clearAllTimers();
  }, [cancelAll, clearAllTimers]);

  const handleRemoteContinue = useCallback(() => { setPaused(false); }, []);

  const handleRemoteNext = useCallback(() => {
    cancelAll(); clearAllTimers(); setPaused(false);
    const def = PHASE_DEF[phase];
    if (def && def.next) { setPhase(def.next); } else { handleRestart(); }
  }, [cancelAll, clearAllTimers, phase, handleRestart]);

  const handleRemoteSpeak = useCallback((text) => {
    if (!text.trim() || announcing) return;
    cancelAll();
    clearAllTimers();
    setPaused(true);
    setAnnouncing(true);
    const done = () => { setAnnouncing(false); setPaused(false); };
    if (ttsPlayer.ttsEnabled) {
      ttsPlayer.speak(text.trim(), done);
    } else {
      narrator.speak(text.trim(), done);
    }
  }, [cancelAll, clearAllTimers, announcing, ttsPlayer, narrator]);

  // ── WebSocket command listener ──
  useEffect(() => {
    liveSync.on("adminConnected", () => {
      // Admin (re)connected — resend current state
      if (narrator.activationStatus === "activated") {
        if (narrator.allVoices.length > 0) {
          liveSync.sendVoices(narrator.allVoices.map((v) => ({ name: v.name, lang: v.lang })));
        }
      }
      liveSync.sendStatus({
        phase, currentIndex, paused: pausedRef.current, bgVariant,
        currentTrack: music.currentTrack, isPlaying: music.isPlaying,
        narratorEnabled: narrator.enabled, announcing,
        voiceName: narrator.voice?.name || "", voiceMode: narrator.voiceMode || "padrao",
        volume: narrator.volume, speedMode: narrator.speedMode, pitch: narrator.pitch,
        musicVolume: music.volume, activeQuizCategory,
        ttsEnabled: ttsPlayer.ttsEnabled, ttsVoiceId: ttsPlayer.voiceId,
      });
    });
    liveSync.on("command", (msg) => {
      switch (msg.command) {
        case "pause": handleRemotePause(); break;
        case "resume": handleRemoteContinue(); break;
        case "restart": handleRestart(); break;
        case "nextQuestion": handleRemoteNext(); break;
        case "setVoice":
          if (msg.voiceName) {
            const v = narrator.voices.find((x) => x.name === msg.voiceName);
            if (v) narrator.setVoice(v);
          }
          break;
        case "setVolume":
          if (msg.volume != null) narrator.setVolume(parseFloat(msg.volume));
          break;
        case "setMusicVolume":
          if (msg.volume != null) music.setVolume(parseFloat(msg.volume));
          break;
        case "setRate":
          if (msg.rate != null) narrator.setRate(parseFloat(msg.rate));
          break;
        case "setPitch":
          if (msg.pitch != null) narrator.setPitch(parseFloat(msg.pitch));
          break;
        case "setBackground":
          if (msg.variant) { setBgVariant(msg.variant); localStorage.setItem("brane_bg", msg.variant); }
          break;
        case "setMusic":
          if (msg.track != null) music.selectTrack(msg.track || "");
          break;
        case "playMusic":
          if (msg.track) music.selectTrack(msg.track);
          else if (music.currentTrack) music.play(music.currentTrack);
          else music.randomTrack();
          break;
        case "pauseMusic": music.stop(); break;
        case "nextMusic": music.nextTrack(); break;
        case "randomMusic": music.randomTrack(); break;
        case "speakMessage":
          if (msg.text) handleRemoteSpeak(msg.text);
          break;
        case "setSpeedMode":
          if (msg.mode) narrator.setSpeedMode(msg.mode);
          break;
        case "setVoiceMode":
          if (msg.mode) narrator.setVoiceMode(msg.mode);
          break;
        case "setTtsVoice":
          if (msg.voiceId) { ttsPlayer.changeVoice(msg.voiceId); ttsPlayer.setTtsEnabled(true); }
          break;
        case "enableTts":
          ttsPlayer.setTtsEnabled(true);
          break;
        case "disableTts":
          ttsPlayer.setTtsEnabled(false);
          break;
        default: break;
      }
    });
    return () => { liveSync.off("command"); liveSync.off("adminConnected"); };
  }, [liveSync, handleRemotePause, handleRemoteContinue, handleRestart,
      handleRemoteNext, narrator, music, handleRemoteSpeak, ttsPlayer,
      phase, currentIndex, bgVariant, announcing, activeQuizCategory]);

  // ── Quiz Library: SET_QUIZ_LIBRARY handler ──
  useEffect(() => {
    liveSync.on("SET_QUIZ_LIBRARY", (msg) => {
      console.log("[LIVE] Recebido SET_QUIZ_LIBRARY", msg);
      if (!msg.categoryId && !msg.categoryName) return;
      const queryCategory = msg.categoryId || msg.categoryName;
      const displayCategory = msg.categoryName || msg.categoryId;
      const count = msg.questionLimit > 0 ? msg.questionLimit : null;
      quizConfigRef.current = {
        category: queryCategory,
        count,
        shouldLoop: !count,
      };
      setActiveQuizCategory(displayCategory);
      clearAllTimers();
      narrator.cancel();
      setPaused(false);
      setPhase("loading");
      loadQuestions(queryCategory, count);
    });
    return () => { liveSync.off("SET_QUIZ_LIBRARY"); };
  }, [liveSync, clearAllTimers, narrator, loadQuestions]);

  // ── Send voices to admin ──
  useEffect(() => {
    if (narrator.activationStatus === "activated" && narrator.allVoices.length > 0) {
      liveSync.sendVoices(narrator.allVoices.map((v) => ({ name: v.name, lang: v.lang })));
    }
  }, [narrator.activationStatus, narrator.allVoices, liveSync]);

  // ── Send status to admin ──
  useEffect(() => {
    liveSync.sendStatus({
      phase,
      currentIndex,
      paused: pausedRef.current,
      bgVariant,
      currentTrack: music.currentTrack,
      isPlaying: music.isPlaying,
      narratorEnabled: narrator.enabled,
      announcing,
      voiceName: narrator.voice?.name || "",
      voiceMode: narrator.voiceMode || "padrao",
      volume: narrator.volume,
      speedMode: narrator.speedMode,
      pitch: narrator.pitch,
      musicVolume: music.volume,
      activeQuizCategory,
      ttsEnabled: ttsPlayer.ttsEnabled,
      ttsVoiceId: ttsPlayer.voiceId,
    });
  }, [phase, currentIndex, paused, bgVariant,
      music.currentTrack, music.isPlaying, music.volume,
      narrator.enabled, narrator.voice, narrator.volume, narrator.speedMode, narrator.pitch,
      narrator.voiceMode, announcing, liveSync, activeQuizCategory, ttsPlayer.ttsEnabled, ttsPlayer.voiceId]);

  // ── Forward TTS/music errors to admin ──
  useEffect(() => {
    if (ttsPlayer.lastError) {
      liveSync.send({ type: "ttsError", message: ttsPlayer.lastError });
    }
  }, [ttsPlayer.lastError, liveSync]);

  useEffect(() => {
    if (music.lastError) {
      liveSync.send({ type: "musicError", message: music.lastError, track: music.currentTrack });
    }
  }, [music.lastError, music.currentTrack, liveSync]);

  // ── Send ttsUnlocked status to admin ──
  useEffect(() => {
    if (ttsPlayer.unlocked) {
      liveSync.send({ type: "ttsUnlocked", unlocked: true });
    }
  }, [ttsPlayer.unlocked, liveSync]);

  if (phase === "loading") {
    // Audio activation overlay (shown before user taps the button)
    if (narrator.activationStatus === "idle") {
      return (
        <div style={{
          width: "100vw", height: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: COLORS.bg, color: COLORS.text,
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 40, boxSizing: "border-box",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            QUIZ BRANE
          </div>
          <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 40, textAlign: "center" }}>
            Toque no botão para ativar o áudio
          </div>
          <button onClick={handleActivateAudio}
            style={{
              padding: "20px 48px", borderRadius: 16, border: "none",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
              color: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 0 40px ${COLORS.primary}40`,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            ATIVAR ÁUDIO E INICIAR ▶
          </button>
        </div>
      );
    }

    // Loading screen after audio activated (while questions load)
    const testResultColor = ttsPlayer.testError ? COLORS.wrong : COLORS.correct;
    return (
      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: COLORS.bg, color: COLORS.muted,
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 18, gap: 12, padding: 32, boxSizing: "border-box", textAlign: "center",
      }}>
        <div>{loadingText}</div>
        <div style={{ fontSize: 13, color: COLORS.correct }}>✓ Áudio ativado</div>
        <div style={{ fontSize: 13, color: narrator.allVoiceCount > 0 ? COLORS.correct : "#FFA500" }}>
          {narrator.allVoiceCount > 0
            ? `✓ Voz detectada (${narrator.allVoiceCount} vozes)`
            : "✗ Voz não disponível (usando padrão)"}
        </div>
        {ttsPlayer.testError && (
          <div style={{ fontSize: 11, color: COLORS.wrong, maxWidth: "80%", lineHeight: 1.4, marginTop: 8 }}>
            ✗ Erro TTS: {ttsPlayer.testError}
          </div>
        )}
        {ttsPlayer.unlocked && (
          <div style={{ fontSize: 14, color: COLORS.correct, fontWeight: 700, marginTop: 12 }}>
            ✓ TTS liberado!
          </div>
        )}
        {!ttsPlayer.unlocked && !ttsPlayer.testing && (
          <button onClick={() => ttsPlayer.testLocally()}
            style={{
              marginTop: 20, padding: "16px 36px", borderRadius: 14, border: "2px solid " + COLORS.accent,
              background: "transparent", color: COLORS.accent, fontSize: 17, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            TESTAR VOZ NO TABLET
          </button>
        )}
        {ttsPlayer.testing && (
          <div style={{ fontSize: 13, color: "#FFA500", marginTop: 12 }}>⏳ Gerando áudio...</div>
        )}
      </div>
    );
  }

  const q = questions[currentIndex];
  if (!q) {
    return (
      <div
        style={{
          width: "100vw", height: "100vh",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: COLORS.bg, color: COLORS.muted,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 18,
        }}
      >
        Nenhuma pergunta.
      </div>
    );
  }

  const revealOrExplain = phase === "answer" || phase === "explanation";

  // Log current question with correct answer position
  console.log(`[Quiz Display] Pergunta #${currentIndex + 1}: "${q.question}"`);
  console.log(`[Quiz Display] Alternativas:`, q.alternatives);
  console.log(`[Quiz Display] Correct index: ${q.correct} (letra ${ALTERNATIVE_LABELS[q.correct] || "?"})`);
  const showAlternatives = phase === "countdown" || revealOrExplain;
  const isQuestionTop = showAlternatives;
  const showCountdown = phase === "countdown";

  const progressPct = phase === "question_intro" ? 0
    : phase === "countdown" ? ((10 - countdown) / 10) * 100
    : 100;

  return (
    <div
      style={{
        width: "100vw", height: "100vh",
        background: "transparent",
        color: COLORS.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        position: "relative", zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isQuestionTop ? "flex-start" : "center",
        transition: "background 0.6s ease",
        userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
      }}
    >
      <AnimatedBackground variant={bgVariant} />
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px ${COLORS.primary}40; }
          50% { box-shadow: 0 0 40px ${COLORS.primary}80; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .live-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: #E74C3C; display: inline-block; margin-right: 6px;
          animation: pulse 1.5s infinite;
        }
        .question-text { animation: slideUp 0.5s ease-out; }
        .option-item { animation: slideUp 0.5s ease-out; animation-fill-mode: both; }
        .option-item:nth-child(1) { animation-delay: 0.1s; }
        .option-item:nth-child(2) { animation-delay: 0.2s; }
        .option-item:nth-child(3) { animation-delay: 0.3s; }
        .option-item:nth-child(4) { animation-delay: 0.4s; }
        .question-move { transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>

      {/* Top bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        background: "linear-gradient(180deg, rgba(5,6,8,0.8) 0%, transparent 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>
            QUIZ AO VIVO
          </span>
          {activeQuizCategory && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: COLORS.accent,
              background: `${COLORS.accent}15`, padding: "3px 10px",
              borderRadius: 12, marginLeft: 4,
            }}>
              {activeQuizCategory}
            </span>
          )}
          {paused && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#E74C3C",
              background: "rgba(231,76,60,0.15)", padding: "2px 8px",
              borderRadius: 10, textTransform: "uppercase", letterSpacing: 1,
            }}>
              PAUSADO
            </span>
          )}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.06)", borderRadius: 20,
          padding: "6px 14px", fontSize: 13, color: COLORS.muted,
        }}>
          <span>👁</span>
          <span style={{ fontWeight: 700, color: COLORS.text, minWidth: 40, textAlign: "right" }}>
            {formatViewers(viewers)}
          </span>
          <span style={{ fontSize: 11 }}>assistindo</span>
        </div>
      </div>

      {/* Category badge - only when alternatives are shown */}
      {showAlternatives && (
        <div style={{
          position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 100,
          fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2,
          color: COLORS.primary, background: `${COLORS.primary}15`,
          padding: "4px 16px", borderRadius: 20, border: `1px solid ${COLORS.primary}30`,
        }}>
          {q.category || "Conhecimentos Gerais"}
        </div>
      )}

      {/* Question + Alternatives */}
      <div className="question-move" style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: isQuestionTop ? "80px 20px 20px" : "40px 20px",
        maxWidth: 900, width: "100%",
        position: "relative", zIndex: 10,
        marginTop: isQuestionTop ? 0 : "auto",
        marginBottom: isQuestionTop ? 0 : "auto",
      }}>
        <div style={{
          fontSize: showAlternatives ? 11 : 0, color: COLORS.muted, marginBottom: showAlternatives ? 10 : 0,
          letterSpacing: 2, textTransform: "uppercase", overflow: "hidden", height: showAlternatives ? "auto" : 0,
        }}>
          Pergunta {currentIndex + 1}
        </div>

        <div className="question-text" style={{
          fontSize: isQuestionTop
            ? "clamp(22px, 3vw, 32px)"
            : "clamp(28px, 5.5vw, 48px)",
          fontWeight: 800, textAlign: "center", lineHeight: 1.3,
          marginBottom: showAlternatives ? 16 : 0,
          color: COLORS.text,
          textShadow: `0 2px 20px rgba(0,0,0,0.5)`,
          maxWidth: isQuestionTop ? 600 : 800,
          transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          {q.question}
        </div>

        {/* Alternatives - hidden during show_question phase */}
        {showAlternatives && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 14, width: "100%", maxWidth: 700,
            animation: "slideUp 0.6s ease-out",
          }}>
            {q.alternatives.map((alt, i) => {
              const isCorrect = revealOrExplain && i === q.correct;
              const isWrong = revealOrExplain && i !== q.correct;
              return (
                <div key={i} className="option-item"
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 20px", borderRadius: 14,
                    border: `2px solid ${
                      isCorrect ? COLORS.correct
                      : isWrong ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.15)"
                    }`,
                    background: isCorrect ? `${COLORS.correct}20`
                      : isWrong ? "rgba(255,255,255,0.03)"
                      : "rgba(255,255,255,0.06)",
                    transition: "all 0.4s ease",
                    animation: isCorrect ? "glow 1.5s infinite" : "none",
                  }}
                >
                  <span style={{
                    width: 42, height: 42, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 18,
                    background: isCorrect ? COLORS.correct : "rgba(138,44,255,0.3)",
                    color: "#fff", flexShrink: 0,
                    border: isCorrect ? "none" : "2px solid rgba(138,44,255,0.3)",
                  }}>
                    {ALTERNATIVE_LABELS[i]}
                  </span>
                  <span style={{
                    fontSize: "clamp(16px, 2.4vw, 22px)",
                    fontWeight: isCorrect ? 700 : 500,
                    color: isCorrect ? COLORS.correct : isWrong ? COLORS.muted : "#FFFFFF",
                    lineHeight: 1.3,
                    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                  }}>
                    {alt}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
        width: "60%", maxWidth: 400, zIndex: 100,
      }}>
        <div style={{
          width: "100%", height: 4,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            width: `${progressPct}%`, height: "100%",
            background: revealOrExplain
              ? `linear-gradient(90deg, ${COLORS.correct}, #1a9e56)`
              : `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
            borderRadius: 2,
            transition: "width 0.1s linear",
          }} />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "14px 24px", paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
        background: "linear-gradient(0deg, rgba(5,6,8,0.8) 0%, transparent 100%)",
      }}>
        <span style={{ fontSize: 14, color: COLORS.primary, fontWeight: 600 }}>
          💬 COMENTE A, B, C OU D
        </span>
      </div>

      {/* Countdown number */}
      {showCountdown && <CountdownNumber number={countdown} visible={true} />}

      {/* Answer reveal overlay (also during explanation) */}
      {revealOrExplain && (
        <AnswerReveal
          question={q}
          correct={q.correct}
          explanation={q.explanation}
        />
      )}
    </div>
  );
}
