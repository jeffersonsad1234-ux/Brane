import { useState, useEffect, useRef, useCallback } from "react";
import useTtsPlayer from "../../../hooks/useTtsPlayer";
import useNarrator from "../../../hooks/useNarrator";
import useBackgroundMusic from "../../../hooks/useBackgroundMusic";
import useLiveSync from "../../../hooks/useLiveSync";
import useQuizEngine from "./engine/useQuizEngine";
import QuizBackground, { VARIANTS } from "./components/QuizBackground";
import { getLiveQuizV2 } from "../BranpyAPI";
import { CATEGORIES } from "./data/quizSeedV2";

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

const LABELS = ["A", "B", "C", "D"];

const ALTERNATIVE_ARTICLE = /^(Um |Uma |Um\b|Uma\b)/i;
function normalizeQuestion(question) {
  if (!question || !Array.isArray(question.alternatives) || question.alternatives.length < 2) {
    return question;
  }

  const alternatives = question.alternatives.slice(0, 4);
  let correct = Number.isInteger(question.correct) ? question.correct : 0;
  if (correct < 0 || correct >= alternatives.length) {
    correct = 0;
  }

  return {
    ...question,
    alternatives,
    correct,
  };
}

function shuffleQuestion(question) {
  const normalized = normalizeQuestion(question);
  if (!normalized || !Array.isArray(normalized.alternatives) || normalized.alternatives.length < 2) {
    return normalized;
  }

  const originalCorrect = normalized.correct;
  const indices = normalized.alternatives.map((_, i) => i);
  const shuffledIndices = [...indices].sort(() => Math.random() - 0.5);
  const alternatives = shuffledIndices.map((i) => normalized.alternatives[i]);
  const correct = shuffledIndices.indexOf(originalCorrect);

  const shuffled = { ...normalized, alternatives, correct };
  if (ALTERNATIVE_ARTICLE.test(shuffled.alternatives[0].trim())) {
    for (let swap = 1; swap < shuffled.alternatives.length; swap++) {
      if (!ALTERNATIVE_ARTICLE.test(shuffled.alternatives[swap].trim())) {
        [shuffled.alternatives[0], shuffled.alternatives[swap]] = [
          shuffled.alternatives[swap], shuffled.alternatives[0],
        ];
        if (shuffled.correct === 0) {
          shuffled.correct = swap;
        } else if (shuffled.correct === swap) {
          shuffled.correct = 0;
        }
        break;
      }
    }
  }

  return shuffled;
}

function CountdownNumber({ number }) {
  return (
    <div style={{
      position: "fixed", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)", zIndex: 150,
      pointerEvents: "none",
    }}>
      <div style={{
        fontSize: 180, fontWeight: 900, color: COLORS.primary,
        textShadow: `0 0 60px ${COLORS.primary}, 0 0 120px ${COLORS.primary}40`,
        fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1,
        animation: "pulse 0.5s ease-in-out",
      }}>
        {number}
      </div>
    </div>
  );
}

function AnswerReveal({ question, correct, explanation }) {
  const letter = LABELS[correct] || "?";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 150,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(5,6,8,0.92)", backdropFilter: "blur(6px)", padding: 40,
    }}>
      <div style={{
        fontSize: 14, fontWeight: 700, color: COLORS.correct,
        textTransform: "uppercase", letterSpacing: 3, marginBottom: 16,
      }}>
        Resposta Correta
      </div>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: `linear-gradient(135deg, ${COLORS.correct}, #1a9e56)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20, boxShadow: `0 0 40px ${COLORS.correct}60`,
      }}>
        <span style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>{letter}</span>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: COLORS.text,
        textAlign: "center", maxWidth: 600, marginBottom: 8,
      }}>
        {question.alternatives[correct]}
      </div>
      {explanation && explanation.trim().length > 10 && (
        <div style={{
          fontSize: 14, color: COLORS.muted,
          textAlign: "center", maxWidth: 500, lineHeight: 1.5,
        }}>
          {explanation}
        </div>
      )}
    </div>
  );
}

export default function LiveQuizV2() {
  const [bgVariant, setBgVariant] = useState(() => localStorage.getItem("brane_bg_v2") || "neon");
  const [activeQuizCategory, setActiveQuizCategory] = useState(null);
  const [viewers, setViewers] = useState(1234);
  const [loadingText, setLoadingText] = useState("Carregando...");
  const [announcing, setAnnouncing] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const narrator = useNarrator();
  const ttsPlayer = useTtsPlayer();
  const music = useBackgroundMusic();
  const liveSync = useLiveSync("live");

  const audioGenRef = useRef(0);
  const quizConfigRef = useRef({ category: null, count: null, shouldLoop: true });
  const viewerIntervalRef = useRef(null);

  const fetchQuizQuestions = useCallback(async (category, count) => {
    setIsLoadingQuestions(true);
    setLoadingText("Buscando perguntas...");
    try {
      const response = await getLiveQuizV2(count, category);
      const questions = Array.isArray(response?.questions) ? response.questions : [];
      if (questions.length === 0) {
        console.warn("[QuizV2] Nenhuma pergunta retornada");
        setLoadingText("Nenhuma pergunta disponível para esta categoria.");
        return [];
      }
      setLoadingText("Carregando perguntas...");
      return questions.map(shuffleQuestion).filter((q) => q && Array.isArray(q.alternatives) && q.alternatives.length >= 2);
    } catch (err) {
      console.error("[QuizV2] fetchQuizQuestions error:", err);
      setLoadingText("Falha ao carregar perguntas.");
      return [];
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  const onSpeak = useCallback((text, onDone) => {
    console.log("[QUIZ_WAITING_FOR_TTS] onSpeak", text ? `${text.slice(0, 40)}${text.length > 40 ? '...' : ''}` : "<empty>");
    const requestId = audioGenRef.current + 1;
    audioGenRef.current = requestId;
    const safeDone = () => {
      if (audioGenRef.current === requestId) {
        console.log("[QUIZ_TTS_FINISHED] safeDone fired", { requestId });
        if (onDone) onDone();
      } else {
        console.log("[QUIZ_TTS_FINISHED] safeDone ignored stale request", { requestId, current: audioGenRef.current });
      }
    };
    if (ttsPlayer.ttsEnabled) {
      console.log("[QUIZ_WAITING_FOR_TTS] using ttsPlayer");
      ttsPlayer.speak(text, safeDone);
    } else {
      console.log("[QUIZ_WAITING_FOR_TTS] using narrator");
      narrator.cancel();
      narrator.speak(text, safeDone);
    }
  }, [ttsPlayer, narrator]);

  const onCancel = useCallback(() => {
    console.log("[TTS] onCancel");
    audioGenRef.current++;
    narrator.cancel();
    ttsPlayer.cancel();
  }, [narrator, ttsPlayer]);

  const onFinishedRef = useRef(null);
  const onFinished = useCallback(async (shouldLoop) => {
    console.log("[QUIZ] onFinished", shouldLoop);
    if (shouldLoop) {
      const cfg = quizConfigRef.current;
      const qs = await fetchQuizQuestions(cfg.category, cfg.count || 50);
      if (qs.length) {
        engine.startQuiz(qs);
      }
    }
  }, [fetchQuizQuestions]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const engine = useQuizEngine({
    onSpeak,
    onCancel,
    onFinished: (...args) => onFinishedRef.current?.(...args),
    onPhaseChange: (phase, qIndex) => {
      liveSync.sendStatus({
        phase, currentIndex: qIndex, paused: engine.paused, bgVariant,
        currentTrack: music.currentTrack, isPlaying: music.isPlaying,
        narratorEnabled: narrator.enabled, announcing,
        voiceName: narrator.voice?.name || "", voiceMode: narrator.voiceMode || "padrao",
        volume: narrator.volume, speedMode: narrator.speedMode, pitch: narrator.pitch,
        musicVolume: music.volume, activeQuizCategory,
        ttsEnabled: ttsPlayer.ttsEnabled, ttsVoiceId: ttsPlayer.voiceId,
      });
    },
    onCountdownTick: (remaining) => {
      console.log("[PHASE] countdown", remaining);
    },
  });

  const handleActivateAudio = useCallback(async () => {
    try {
      narrator.activate();
      music.activate();
      ttsPlayer.unlock();
      const cfg = quizConfigRef.current;
      const qs = await fetchQuizQuestions(cfg.category, cfg.count || 50);
      if (qs.length) {
        engine.startQuiz(qs);
      } else {
        setLoadingText("Não foi possível iniciar o quiz.");
      }
    } catch (err) {
      console.error("[QuizV2] activate error:", err);
      setLoadingText("Erro ao iniciar.");
    }
  }, [narrator, music, ttsPlayer, engine, fetchQuizQuestions]);

  const handleRemoteSpeak = useCallback((text) => {
    if (!text.trim() || announcing) return;
    engine.pause();
    setAnnouncing(true);
    const done = () => { setAnnouncing(false); engine.resume(); };
    onSpeak(text.trim(), done);
  }, [engine, onSpeak, announcing]);

  // Viewer ticker
  useEffect(() => {
    viewerIntervalRef.current = setInterval(() => {
      const base = [500, 1000, 2000, 5000, 8000, 12000];
      const chosen = base[Math.floor(Math.random() * base.length)];
      setViewers(Math.max(100, chosen + Math.floor(Math.random() * 500) - 250));
    }, 8000);
    return () => clearInterval(viewerIntervalRef.current);
  }, []);

  // WebSocket command listener
  useEffect(() => {
    liveSync.on("adminConnected", () => {
      if (narrator.activationStatus === "activated" && narrator.allVoices.length > 0) {
        liveSync.sendVoices(narrator.allVoices.map((v) => ({ name: v.name, lang: v.lang })));
      }
      liveSync.sendStatus({
        phase: engine.phase, currentIndex: engine.currentIndex, paused: engine.paused, bgVariant,
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
        case "pause": engine.pause(); break;
        case "resume": engine.resume(); break;
        case "restart": engine.restart(); break;
        case "nextQuestion": engine.nextQuestion(); break;
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
          if (msg.rate != null) {
            narrator.setRate(parseFloat(msg.rate));
            ttsPlayer.setSpeedRate(parseFloat(msg.rate));
          }
          break;
        case "setPitch":
          if (msg.pitch != null) narrator.setPitch(parseFloat(msg.pitch));
          break;
        case "setBackground":
          if (msg.variant) { setBgVariant(msg.variant); localStorage.setItem("brane_bg_v2", msg.variant); }
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
  }, [liveSync, engine, narrator, music, handleRemoteSpeak, ttsPlayer, bgVariant, announcing, activeQuizCategory]);

  // Quiz Library handler
  useEffect(() => {
    liveSync.on("SET_QUIZ_LIBRARY_V2", async (msg) => {
      // Log incoming admin message
      try {
        console.log("[Live] Received WS message", msg?.type || "SET_QUIZ_LIBRARY_V2", msg);
        window.__lastLivePayload = msg;
      } catch (e) {}
      if (!msg.categoryId && !msg.categoryName) return;
      const queryCategory = msg.categoryId || "";
      const displayCategory = msg.categoryName || msg.categoryId || "Todas";
      const count = msg.questionLimit > 0 ? msg.questionLimit : null;
      quizConfigRef.current = { category: queryCategory, count, shouldLoop: !count };
      setActiveQuizCategory(displayCategory);
      engine.setConfig({ category: queryCategory, count, shouldLoop: !count });
      if (engine.goToPhase) {
        engine.goToPhase(engine.PHASES.LOADING);
      }
      // Indicate fetch is about to run
      try { console.log("[Live] fetchQuizQuestions -> category:", queryCategory, "count:", count || 50); } catch (e) {}
      const qs = await fetchQuizQuestions(queryCategory, count || 50);
      try { console.log("[Live] fetchQuizQuestions returned", Array.isArray(qs) ? qs.length : 0, "questions"); window.__lastLiveFetchedQuestions = qs || []; } catch (e) {}
      if (qs.length) {
        // ensure first question is shown immediately
        engine.startQuiz(qs);
        try { engine.goToPhase && engine.goToPhase(engine.PHASES.QUESTION_INTRO, 0); } catch (e) {}
      }
    });
    return () => { liveSync.off("SET_QUIZ_LIBRARY_V2"); };
  }, [liveSync, engine, fetchQuizQuestions]);

  // Send status
  useEffect(() => {
    liveSync.sendStatus({
      phase: engine.phase, currentIndex: engine.currentIndex, paused: engine.paused, bgVariant,
      currentTrack: music.currentTrack, isPlaying: music.isPlaying,
      narratorEnabled: narrator.enabled, announcing,
      voiceName: narrator.voice?.name || "", voiceMode: narrator.voiceMode || "padrao",
      volume: narrator.volume, speedMode: narrator.speedMode,
      rate: narrator.rate ?? 1.0, pitch: narrator.pitch,
      musicVolume: music.volume, activeQuizCategory,
      ttsEnabled: ttsPlayer.ttsEnabled, ttsVoiceId: ttsPlayer.voiceId,
    });
  }, [engine.phase, engine.currentIndex, engine.paused, bgVariant,
      music.currentTrack, music.isPlaying, music.volume,
      narrator.enabled, narrator.voice, narrator.volume, narrator.speedMode, narrator.pitch,
      narrator.voiceMode, announcing, liveSync, activeQuizCategory,
      ttsPlayer.ttsEnabled, ttsPlayer.voiceId]);

  useEffect(() => {
    if (narrator.activationStatus === "activated" && narrator.allVoices.length > 0) {
      liveSync.sendVoices(narrator.allVoices.map((v) => ({ name: v.name, lang: v.lang })));
    }
  }, [narrator.activationStatus, narrator.allVoices, liveSync]);

  useEffect(() => {
    if (ttsPlayer.lastError) liveSync.send({ type: "ttsError", message: ttsPlayer.lastError });
  }, [ttsPlayer.lastError, liveSync]);

  useEffect(() => {
    if (music.lastError) liveSync.send({ type: "musicError", message: music.lastError, track: music.currentTrack });
  }, [music.lastError, music.currentTrack, liveSync]);

  useEffect(() => {
    if (ttsPlayer.unlocked) liveSync.send({ type: "ttsUnlocked", unlocked: true });
  }, [ttsPlayer.unlocked, liveSync]);

  // RENDER
  const { PHASES } = engine;
  const phase = engine.phase;
  const q = engine.currentQuestion;
  const countdown = engine.countdown;
  const currentIndex = engine.currentIndex;
  const paused = engine.paused;

  if (phase === PHASES.IDLE) {
    if (narrator.activationStatus === "idle") {
      return (
        <div style={{
          width: "100vw", height: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: COLORS.bg,
          color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 40, boxSizing: "border-box",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>QUIZ V2</div>
          <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 40, textAlign: "center" }}>
            Toque no botão para ativar o áudio
          </div>
          <button onClick={handleActivateAudio} style={{
            padding: "20px 48px", borderRadius: 16, border: "none",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
            color: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer",
            boxShadow: `0 0 40px ${COLORS.primary}40`, WebkitTapHighlightColor: "transparent",
          }}>
            ATIVAR ÁUDIO E INICIAR ▶
          </button>
        </div>
      );
    }
    return (
      <div style={{
        width: "100vw", height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: COLORS.bg,
        color: COLORS.muted, fontFamily: "system-ui, -apple-system, sans-serif",
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
          <button onClick={() => ttsPlayer.testLocally()} style={{
            marginTop: 20, padding: "16px 36px", borderRadius: 14, border: "2px solid " + COLORS.accent,
            background: "transparent", color: COLORS.accent, fontSize: 17, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
          }}>
            TESTAR VOZ NO TABLET
          </button>
        )}
        {ttsPlayer.testing && (
          <div style={{ fontSize: 13, color: "#FFA500", marginTop: 12 }}>⏳ Gerando áudio...</div>
        )}
      </div>
    );
  }

  if (phase === PHASES.LOADING) {
    return (
      <div style={{
        width: "100vw", height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: COLORS.bg,
        color: COLORS.muted, fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 18, gap: 12, padding: 32, boxSizing: "border-box", textAlign: "center",
      }}>
        <div>{loadingText}</div>
        <div style={{ fontSize: 13, color: COLORS.correct }}>✓ Áudio ativado</div>
      </div>
    );
  }

  if (phase === PHASES.FINISHED) {
    return (
      <div style={{
        width: "100vw", height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: COLORS.bg,
        color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 40, boxSizing: "border-box",
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>QUIZ FINALIZADO</div>
        <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 40 }}>
          Aguardando próxima rodada...
        </div>
      </div>
    );
  }

  if (phase === PHASES.PAUSED) {
    return (
      <div style={{
        width: "100vw", height: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", background: COLORS.bg,
        color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif",
        padding: 40, boxSizing: "border-box",
      }}>
        <AnimatedBackground variant={bgVariant} />
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, zIndex: 10 }}>PAUSADO</div>
        <div style={{ fontSize: 14, color: COLORS.muted, zIndex: 10 }}>
          Aguardando comando do admin...
        </div>
      </div>
    );
  }

  if (!q) {
    return (
      <div style={{
        width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: COLORS.bg, color: COLORS.muted, fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 18,
      }}>
        Nenhuma pergunta.
      </div>
    );
  }

  const revealOrExplain = phase === PHASES.ANSWER || phase === PHASES.EXPLANATION;
  const showAlternatives = phase === PHASES.COUNTDOWN || revealOrExplain;
  const isQuestionTop = showAlternatives;
  const showCountdown = phase === PHASES.COUNTDOWN;
  const progressPct = phase === PHASES.QUESTION_INTRO ? 0
    : phase === PHASES.COUNTDOWN ? ((12 - countdown) / 12) * 100
    : 100;

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "transparent",
      color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif",
      overflow: "hidden", position: "relative", zIndex: 10,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: isQuestionTop ? "flex-start" : "center",
      transition: "background 0.6s ease",
      userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
    }}>
      <QuizBackground variant={bgVariant} />

      <style>{`
        @keyframes pulse { 0%{transform:scale(1.2);opacity:0.5} 100%{transform:scale(1);opacity:1} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px ${COLORS.primary}40} 50%{box-shadow:0 0 40px ${COLORS.primary}80} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        .live-dot { width:10px;height:10px;border-radius:50%;background:#E74C3C;display:inline-block;margin-right:6px;animation:pulse 1.5s infinite }
        .question-text { animation: slideUp 0.5s ease-out }
        .option-item { animation: slideUp 0.5s ease-out; animation-fill-mode: both }
        .option-item:nth-child(1){animation-delay:0.1s}
        .option-item:nth-child(2){animation-delay:0.2s}
        .option-item:nth-child(3){animation-delay:0.3s}
        .option-item:nth-child(4){animation-delay:0.4s}
        .question-move { transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) }
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
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1 }}>QUIZ V2</span>
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
            {viewers >= 1000 ? (viewers / 1000).toFixed(viewers >= 10000 ? 0 : 1) + "K" : String(viewers)}
          </span>
          <span style={{ fontSize: 11 }}>assistindo</span>
        </div>
      </div>

      {/* Category badge */}
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
        maxWidth: 900, width: "100%", position: "relative", zIndex: 10,
        marginTop: isQuestionTop ? 0 : "auto", marginBottom: isQuestionTop ? 0 : "auto",
      }}>
        <div style={{
          fontSize: showAlternatives ? 11 : 0, color: COLORS.muted,
          marginBottom: showAlternatives ? 10 : 0,
          letterSpacing: 2, textTransform: "uppercase", overflow: "hidden",
          height: showAlternatives ? "auto" : 0,
        }}>
          Pergunta {currentIndex + 1}
        </div>

        <div className="question-text" style={{
          fontSize: isQuestionTop ? "clamp(22px, 3vw, 32px)" : "clamp(28px, 5.5vw, 48px)",
          fontWeight: 800, textAlign: "center", lineHeight: 1.3,
          marginBottom: showAlternatives ? 16 : 0, color: COLORS.text,
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          maxWidth: isQuestionTop ? 600 : 800,
          transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          {q.question}
        </div>

        {showAlternatives && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 14, width: "100%", maxWidth: 700, animation: "slideUp 0.6s ease-out",
          }}>
            {q.alternatives.map((alt, i) => {
              const isCorrect = revealOrExplain && i === q.correct;
              const isWrong = revealOrExplain && i !== q.correct;
              return (
                <div key={i} className="option-item" style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 20px", borderRadius: 14,
                  border: `2px solid ${isCorrect ? COLORS.correct : isWrong ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.15)"}`,
                  background: isCorrect ? `${COLORS.correct}20` : isWrong ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                  transition: "all 0.4s ease",
                  animation: isCorrect ? "glow 1.5s infinite" : "none",
                }}>
                  <span style={{
                    width: 42, height: 42, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, fontSize: 18, lineHeight: 1,
                    background: isCorrect ? COLORS.correct : "#8A2CFF",
                    color: "#fff", flexShrink: 0,
                    boxShadow: isCorrect ? "none" : "0 2px 8px rgba(0,0,0,0.4)",
                  }}>
                    {LABELS[i]}
                  </span>
                  <span style={{
                    fontSize: "clamp(16px, 2.4vw, 22px)",
                    fontWeight: isCorrect ? 700 : 500,
                    color: isCorrect ? COLORS.correct : isWrong ? COLORS.muted : "#FFFFFF",
                    lineHeight: 1.3, textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                    overflow: "hidden", textOverflow: "ellipsis",
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
          width: "100%", height: 4, background: "rgba(255,255,255,0.08)",
          borderRadius: 2, overflow: "hidden",
        }}>
          <div style={{
            width: `${progressPct}%`, height: "100%",
            background: revealOrExplain
              ? `linear-gradient(90deg, ${COLORS.correct}, #1a9e56)`
              : `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
            borderRadius: 2, transition: "width 0.1s linear",
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

      {showCountdown && <CountdownNumber number={countdown} />}
      {revealOrExplain && <AnswerReveal question={q} correct={q.correct} explanation={q.explanation} />}
    </div>
  );
}
