import { useState, useEffect, useRef, useCallback } from "react";
import { getLiveQuiz } from "./BranpyAPI";

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

function CountdownOverlay({ number }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(5,6,8,0.85)",
        backdropFilter: "blur(4px)",
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
        backdropFilter: "blur(6px)",
        padding: 40,
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

export default function BranpyLive() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("loading");
  const [countdown, setCountdown] = useState(10);
  const [viewers, setViewers] = useState(1234);
  const [loadingText, setLoadingText] = useState("Carregando...");
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);
  const revealRef = useRef(null);
  const viewerRef = useRef(null);

  const loadQuestions = useCallback(async () => {
    try {
      const data = await getLiveQuiz(50);
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setPhase("question");
        setCountdown(10);
      } else {
        setLoadingText("Nenhuma pergunta disponivel.");
      }
    } catch {
      setLoadingText("Erro ao carregar quiz.");
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    viewerRef.current = setInterval(() => {
      setViewers(randomViewers());
    }, 8000);
    return () => clearInterval(viewerRef.current);
  }, []);

  useEffect(() => {
    if (phase !== "question") return;

    setCountdown(10);

    const startTime = Date.now();
    const duration = 10000;

    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        setPhase("reveal");
      }
    }, 100);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [phase, currentIndex, questions.length]);

  useEffect(() => {
    if (phase !== "reveal") return;

    revealRef.current = setTimeout(() => {
      const next = currentIndex + 1;
      if (next >= questions.length) {
        loadQuestions();
      } else {
        setCurrentIndex(next);
        setPhase("question");
      }
    }, 5000);

    return () => {
      if (revealRef.current) clearTimeout(revealRef.current);
    };
  }, [phase, currentIndex, questions.length, loadQuestions]);

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

  const mainBg = phase === "reveal"
    ? `radial-gradient(ellipse at center, rgba(46,204,113,0.08) 0%, ${COLORS.bg} 70%)`
    : `radial-gradient(ellipse at center, rgba(138,44,255,0.06) 0%, ${COLORS.bg} 70%)`;

  const progressPct = phase === "question"
    ? ((10 - countdown) / 10) * 100
    : phase === "reveal" ? 100 : 0;

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
        justifyContent: "center",
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
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .live-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #E74C3C;
          display: inline-block;
          margin-right: 6px;
          animation: pulse 1.5s infinite;
        }
        .question-text {
          animation: slideUp 0.5s ease-out;
        }
        .option-item {
          animation: slideUp 0.5s ease-out;
          animation-fill-mode: both;
        }
        .option-item:nth-child(1) { animation-delay: 0.1s; }
        .option-item:nth-child(2) { animation-delay: 0.2s; }
        .option-item:nth-child(3) { animation-delay: 0.3s; }
        .option-item:nth-child(4) { animation-delay: 0.4s; }
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

      {/* Category badge */}
      <div style={{
        position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", zIndex: 100,
        fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2,
        color: COLORS.primary, background: `${COLORS.primary}15`,
        padding: "4px 16px", borderRadius: 20, border: `1px solid ${COLORS.primary}30`,
      }}>
        {q.category || "Conhecimentos Gerais"}
      </div>

      {/* Question */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "40px 20px", maxWidth: 800,
        width: "100%", position: "relative", zIndex: 10,
      }}>
        <div style={{
          fontSize: 11, color: COLORS.muted, marginBottom: 20,
          letterSpacing: 2, textTransform: "uppercase",
        }}>
          Pergunta {currentIndex + 1}
        </div>

        <div className="question-text" style={{
          fontSize: "clamp(24px, 5vw, 42px)",
          fontWeight: 800, textAlign: "center", lineHeight: 1.3,
          marginBottom: 40, color: COLORS.text,
          textShadow: `0 2px 20px rgba(0,0,0,0.5)`,
          maxWidth: 700,
        }}>
          {q.question}
        </div>

        {/* Alternatives */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 12, width: "100%", maxWidth: 640,
        }}>
          {q.alternatives.map((alt, i) => {
            const isCorrect = phase === "reveal" && i === q.correct;
            const isWrong = phase === "reveal" && i !== q.correct;
            return (
              <div key={i} className="option-item"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: `2px solid ${
                    isCorrect ? COLORS.correct
                    : isWrong ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.1)"
                  }`,
                  background: isCorrect ? `${COLORS.correct}18`
                    : isWrong ? "rgba(255,255,255,0.03)"
                    : "rgba(255,255,255,0.04)",
                  transition: "all 0.4s ease",
                  animation: isCorrect ? "glow 1.5s infinite" : "none",
                }}
              >
                <span style={{
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 15,
                  background: isCorrect ? COLORS.correct
                    : "rgba(255,255,255,0.08)",
                  color: "#fff", flexShrink: 0,
                }}>
                  {ALTERNATIVE_LABELS[i]}
                </span>
                <span style={{
                  fontSize: "clamp(13px, 2vw, 18px)",
                  fontWeight: isCorrect ? 700 : 400,
                  color: isCorrect ? COLORS.correct
                    : isWrong ? COLORS.muted
                    : "rgba(255,255,255,0.85)",
                  lineHeight: 1.3,
                }}>
                  {alt}
                </span>
              </div>
            );
          })}
        </div>
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
            background: phase === "reveal"
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

      {/* Countdown overlay */}
      {phase === "question" && <CountdownOverlay number={countdown} />}

      {/* Answer reveal overlay */}
      {phase === "reveal" && (
        <AnswerReveal
          question={q}
          correct={q.correct}
          explanation={q.explanation}
        />
      )}
    </div>
  );
}
