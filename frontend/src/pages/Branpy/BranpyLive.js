import { useState, useEffect, useCallback } from "react";
import { getLiveQuiz } from "./BranpyAPI";

const CATEGORY_COLORS = {
  Geografia: "#2ecc71",
  Historia: "#e74c3c",
  Ciencia: "#3498db",
  Tecnologia: "#9b59b6",
  Curiosidades: "#f39c12",
  Games: "#e67e22",
  Misterios: "#1abc9c",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuestionCard({ q, index, total, onAnswer, selected }) {
  const [shuffled, setShuffled] = useState([]);

  useEffect(() => {
    setShuffled(
      q.alternatives.map((text, i) => ({ text, originalIdx: i }))
    );
  }, [q]);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      borderRadius: 16, padding: 20, marginBottom: 16,
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{
          background: CATEGORY_COLORS[q.category] || "#8A2CFF",
          color: "#fff", fontSize: 10, fontWeight: 700,
          padding: "3px 10px", borderRadius: 10, textTransform: "uppercase",
        }}>{q.category}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          {index + 1} / {total}
        </span>
      </div>
      <p style={{ color: "#fff", fontSize: 15, fontWeight: 500, margin: "0 0 14px", lineHeight: 1.4 }}>
        {q.question}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {shuffled.map((alt, i) => {
          const isSelected = selected === alt.originalIdx;
          return (
            <button key={i} onClick={() => onAnswer(index, alt.originalIdx)}
              disabled={selected !== null}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 12, border: "1px solid",
                borderColor: isSelected ? "#8A2CFF" : "rgba(255,255,255,0.08)",
                background: isSelected ? "rgba(138,44,255,0.15)" : "rgba(255,255,255,0.03)",
                color: isSelected ? "#fff" : "rgba(255,255,255,0.7)",
                fontSize: 13, fontWeight: isSelected ? 600 : 400,
                cursor: selected !== null ? "default" : "pointer",
                textAlign: "left", width: "100%",
                transition: "all 0.15s",
              }}
            >
              <span style={{
                width: 24, height: 24, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                background: isSelected ? "#8A2CFF" : "rgba(255,255,255,0.08)",
                color: "#fff", flexShrink: 0,
              }}>{String.fromCharCode(65 + i)}</span>
              <span>{alt.text}</span>
            </button>
          );
        })}
      </div>
      {selected !== null && q.explanation && (
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "rgba(46,204,113,0.08)",
          borderLeft: "3px solid #2ecc71",
          borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,0.7)",
        }}>
          {q.explanation}
        </div>
      )}
    </div>
  );
}

export default function BranpyLive() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [totalAll, setTotalAll] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLiveQuiz(10);
      setQuestions(data.questions || []);
      setTotalAll(data.total || 0);
    } catch { setQuestions([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAnswer = (qIdx, altIdx) => {
    if (answers[qIdx] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: altIdx }));
  };

  const correctCount = questions.filter(
    (q, i) => answers[i] === undefined ? false : answers[i] === 0
  ).length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length && questions.length > 0;

  const handleFinish = () => setFinished(true);
  const handleRestart = () => {
    setAnswers({});
    setFinished(false);
    setQuestions([]);
    load();
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
        Carregando quiz...
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
        Nenhuma pergunta disponivel.
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correctCount / questions.length) * 100);
    let grade = "Tente novamente!";
    if (pct >= 90) grade = "Excelente!";
    else if (pct >= 70) grade = "Muito bom!";
    else if (pct >= 50) grade = "Bom!";

    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: "linear-gradient(135deg,#8A2CFF,#5B1BA6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "20px auto", fontSize: 32, fontWeight: 800, color: "#fff",
        }}>{pct}%</div>
        <h2 style={{ color: "#fff", margin: "0 0 6px", fontSize: 22 }}>{grade}</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 20px" }}>
          {correctCount} de {questions.length} respostas corretas
        </p>
        <button onClick={handleRestart} style={{
          background: "linear-gradient(135deg,#8A2CFF,#5B1BA6)", color: "#fff",
          border: "none", borderRadius: 12, padding: "12px 32px",
          fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>Jogar novamente</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 16px 80px" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16,
      }}>
        <div>
          <h2 style={{ color: "#fff", fontSize: 18, margin: 0 }}>Quiz ao Vivo</h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
            {totalAll} perguntas no banco
          </p>
        </div>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
          {correctCount}/{answeredCount} corretas
        </span>
      </div>
      {questions.map((q, i) => (
        <QuestionCard key={i} q={q} index={i} total={questions.length}
          onAnswer={handleAnswer} selected={answers[i] ?? null}
        />
      ))}
      {allAnswered && !finished && (
        <button onClick={handleFinish} style={{
          position: "sticky", bottom: 80,
          width: "100%", padding: "14px", borderRadius: 12,
          background: "linear-gradient(135deg,#2ecc71,#27ae60)",
          color: "#fff", border: "none", fontSize: 16, fontWeight: 700,
          cursor: "pointer", marginTop: 8,
        }}>
          Ver resultado
        </button>
      )}
    </div>
  );
}
