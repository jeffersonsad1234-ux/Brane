import { useState, useEffect, useRef, useCallback } from "react";
import { getLiveQuiz } from "./BranpyAPI";
import useNarrator from "../../hooks/useNarrator";

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

function OperatorControls({ paused, onTogglePause, onRestart }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      style={{
        position: "fixed", top: 56, right: 16, zIndex: 999,
        display: "flex", gap: 6, opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      <button
        onClick={onTogglePause}
        title={paused ? "▶ Iniciar" : "⏸ Pausar"}
        style={{
          width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {paused ? "▶" : "⏸"}
      </button>
      <button
        onClick={onRestart}
        title="🔄 Reiniciar"
        style={{
          width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        🔄
      </button>
    </div>
  );
}

const PHASE_DEF = {
  question_intro: { next: "countdown",  minTime: 0,     fallback: 8000  },
  countdown:      { next: "answer",     minTime: 10000, fallback: 12000 },
  answer:         { next: "explanation", minTime: 0,     fallback: 5000  },
  explanation:    { next: null,          minTime: 4000,  fallback: 8000  },
};

export default function BranpyLive() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("loading");
  const [countdown, setCountdown] = useState(10);
  const [viewers, setViewers] = useState(1234);
  const [loadingText, setLoadingText] = useState("Carregando...");
  const [paused, setPaused] = useState(false);

  const [adminVisible, setAdminVisible] = useState(false);

  const countdownRef = useRef(null);
  const viewerRef = useRef(null);
  const syncRef = useRef({ minDone: false, narDone: false, advancing: false, timerId: null, fallbackId: null });

  const narrator = useNarrator();

  const clearAllTimers = useCallback(() => {
    const s = syncRef.current;
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (s.timerId) { clearTimeout(s.timerId); s.timerId = null; }
    if (s.fallbackId) { clearTimeout(s.fallbackId); s.fallbackId = null; }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      const data = await getLiveQuiz(50);
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setPhase("question_intro");
      } else {
        setLoadingText("Nenhuma pergunta disponivel.");
      }
    } catch {
      setLoadingText("Erro ao carregar quiz.");
    }
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  useEffect(() => {
    viewerRef.current = setInterval(() => setViewers(randomViewers()), 8000);
    return () => clearInterval(viewerRef.current);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Q") { e.preventDefault(); setAdminVisible((v) => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const advancePhase = useCallback(() => {
    const def = PHASE_DEF[phase];
    if (!def || !def.next) {
      const nextIdx = currentIndex + 1;
      if (nextIdx >= questions.length) { loadQuestions(); }
      else { setCurrentIndex(nextIdx); setPhase("question_intro"); }
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
      if (q.explanation) narItems = [{ text: q.explanation }];
    }

    const tryAdvance = () => {
      if (sync.advancing) return;
      if (phase === "countdown") {
        if (!sync.minDone) return;
      } else {
        if (!sync.minDone || !sync.narDone) return;
      }
      sync.advancing = true;
      console.log(`${phase.toUpperCase()} COMPLETE`);
      advancePhase();
    };

    // Fallback — ensures the quiz never stalls if onend or timer misfire
    sync.fallbackId = setTimeout(() => {
      if (!sync.advancing) {
        sync.minDone = true;
        sync.narDone = true;
        console.log(`${phase.toUpperCase()} FALLBACK`);
        tryAdvance();
      }
    }, def.fallback);

    // Minimum phase timer (for countdown this IS the full countdown duration)
    sync.timerId = setTimeout(() => {
      sync.minDone = true;
      tryAdvance();
    }, def.minTime);

    // Narration (countdown has none — narDone is irrelevant for it)
    if (narItems.length > 0) {
      narrator.speakSequence(narItems, () => {
        if (!sync.narDone) { sync.narDone = true; tryAdvance(); }
      });
    } else if (phase !== "countdown") {
      sync.narDone = true;
      tryAdvance();
    }

    return () => {
      if (sync.timerId) { clearTimeout(sync.timerId); sync.timerId = null; }
      if (sync.fallbackId) { clearTimeout(sync.fallbackId); sync.fallbackId = null; }
      narrator.cancel();
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

  const handleTogglePause = () => {
    setPaused((p) => { if (!p) narrator.cancel(); return !p; });
  };

  const handleRestart = () => {
    clearAllTimers(); narrator.cancel(); setPaused(false); setPhase("loading"); loadQuestions();
  };

  const handleAdminPause = () => {
    narrator.cancel(); setPaused(true); clearAllTimers();
  };

  const handleAdminContinue = () => { setPaused(false); };

  const handleAdminNext = () => {
    narrator.cancel(); clearAllTimers(); setPaused(false);
    const def = PHASE_DEF[phase];
    if (def && def.next) { setPhase(def.next); } else { handleRestart(); }
  };

  const AdminPanel = ({ paused }) => {
    if (!adminVisible) return null;
    return (
      <div style={{
        position: "fixed", top: 56, right: 16, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 4,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(138,44,255,0.3)",
        borderRadius: 12, padding: 8, minWidth: 180, maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ fontSize: 10, color: COLORS.primary, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, textAlign: "center" }}>
          Admin Quiz
        </div>
        {paused ? (
          <button onClick={handleAdminContinue} style={adminBtnStyle}>▶ Continuar</button>
        ) : (
          <button onClick={handleAdminPause} style={adminBtnStyle}>⏸ Pausar</button>
        )}
        <button onClick={handleRestart} style={adminBtnStyle}>🔄 Reiniciar Quiz</button>
        <button onClick={handleAdminNext} style={adminBtnStyle}>⏭ Próxima Pergunta</button>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />

        <div style={{ fontSize: 10, color: COLORS.primary, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2, textAlign: "center" }}>
          Narradora
        </div>

        {!narrator.isSupported ? (
          <div style={{ fontSize: 11, color: COLORS.wrong, textAlign: "center", padding: 4 }}>
            Navegador nao suporta audio
          </div>
        ) : (
          <>
            <button onClick={() => {
              if (narrator.enabled) { narrator.cancel(); narrator.setEnabled(false); }
              else { narrator.setEnabled(true); narrator.testVoice(); }
            }} style={{
              ...adminBtnStyle,
              color: narrator.enabled ? COLORS.correct : COLORS.wrong,
            }}>
              {narrator.enabled ? "🔊 Ativada" : "🔇 Desativada"}
            </button>

            <button onClick={narrator.testVoice} style={adminBtnStyle}>
              🎤 Testar Voz
            </button>

            {narrator.isBlocked && (
              <button onClick={() => {
                narrator.setIsBlocked(false);
                narrator.testVoice();
              }} style={{ ...adminBtnStyle, color: "#FFA500", border: "1px solid rgba(255,165,0,0.3)" }}>
                🔊 ATIVAR AUDIO
              </button>
            )}

            {narrator.voices.length > 0 && (
              <select value={narrator.voice?.name || ""} onChange={(e) => {
                const v = narrator.voices.find((x) => x.name === e.target.value);
                narrator.setVoice(v || null);
              }}
                style={{ ...adminBtnStyle, cursor: "pointer", appearance: "auto", padding: "4px 6px", fontSize: 11 }}
              >
                {narrator.voices.filter((v) => v.lang.startsWith("pt")).map((v) => (
                  <option key={v.name} value={v.name}>{v.name.replace(/Microsoft|Online|Natural|\(Portuguese\)/g, "").trim() || v.name}</option>
                ))}
              </select>
            )}

            <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>Volume</div>
            <input type="range" min="0" max="1" step="0.1" value={narrator.volume}
              onChange={(e) => narrator.setVolume(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: COLORS.primary }} />

            <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>Velocidade</div>
            <input type="range" min="0.5" max="1.5" step="0.1" value={narrator.rate}
              onChange={(e) => narrator.setRate(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: COLORS.primary }} />
          </>
        )}
      </div>
    );
  };

  const adminBtnStyle = {
    display: "block", width: "100%", padding: "6px 10px",
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8, color: "#fff", fontSize: 12, cursor: "pointer",
    textAlign: "left", fontWeight: 500,
  };

  if (phase === "loading") {
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
        {loadingText}
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
  const showAlternatives = phase === "countdown" || revealOrExplain;
  const isQuestionTop = showAlternatives;
  const showCountdown = phase === "countdown";

  const mainBg = revealOrExplain
    ? `radial-gradient(ellipse at center, rgba(46,204,113,0.08) 0%, ${COLORS.bg} 70%)`
    : `radial-gradient(ellipse at center, rgba(138,44,255,0.06) 0%, ${COLORS.bg} 70%)`;

  const progressPct = phase === "question_intro" ? 0
    : phase === "countdown" ? ((10 - countdown) / 10) * 100
    : 100;

  return (
    <div
      style={{
        width: "100vw", height: "100vh",
        background: mainBg,
        color: COLORS.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isQuestionTop ? "flex-start" : "center",
        transition: "background 0.6s ease",
      }}
    >
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

      {/* Operator controls */}
      <OperatorControls
        paused={paused}
        onTogglePause={handleTogglePause}
        onRestart={handleRestart}
      />
      {/* Admin panel (Ctrl+Shift+Q) */}
      <AdminPanel paused={paused} />

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
