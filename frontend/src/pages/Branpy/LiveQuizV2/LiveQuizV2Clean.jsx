import React, { useState, useEffect, useRef, useCallback } from "react";
import useLiveSync from "../../../hooks/useLiveSync";

const LABELS = ["A", "B", "C", "D"];

export default function LiveQuizV2Clean() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const [phase, setPhase] = useState("idle"); // idle | question | answer | finished
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const timerRef = useRef(null);
  const advanceTimeoutRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);
  const liveSync = useLiveSync("live");

  const fetchQuestions = useCallback(async (cat = "", cnt = 5) => {
    setLoading(true);
    const fileTag = "frontend/src/pages/Branpy/LiveQuizV2/LiveQuizV2Clean.jsx";
    const funcTag = "fetchQuestions";
    try {
      const url = `/api/branpy/live-v2?count=${cnt}${cat ? `&category=${encodeURIComponent(cat)}` : ""}`;
      console.log("[Clean] fetch URL:", url);
      const res = await fetch(url);
      console.log("[Clean] fetch status:", res.status);
      let data;
      try { data = await res.json(); } catch (e) { data = null; console.error("[Clean] invalid JSON response", e); }
      console.log("[Clean] fetch response JSON:", data);
      const qs = Array.isArray(data?.questions) ? data.questions : (Array.isArray(data) ? data : []);
      console.log(`[Clean] received questions count: ${qs.length}`);
      if (qs.length > 0) console.log("[Clean] first question:", qs[0]);
      setQuestions(qs.map((q) => ({ ...q, alternatives: (q.alternatives || []).slice(0, 4) })));
      setIndex(0);
      return qs;
    } catch (err) {
      const stack = (err && err.stack) || (new Error()).stack;
      const stackLine = stack.split('\n')[1] || stack;
      console.error(`[Clean][Error] ${fileTag} ${funcTag} -> ${stackLine}`);
      console.error(err);
      setQuestions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (advanceTimeoutRef.current) { clearTimeout(advanceTimeoutRef.current); advanceTimeoutRef.current = null; }
  };

  const speakSafe = (text) => {
    try {
      if (!synthRef.current) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      u.onstart = () => console.log("[TTS_START]", text.slice(0,40));
      u.onend = () => console.log("[TTS_END]");
      u.onerror = (e) => console.log("[TTS_ERROR]", e);
      // do not rely on onend to drive flow
      synthRef.current.speak(u);
    } catch (e) {
      console.log("[TTS_ERROR] speakSafe failed", e);
    }
  };

  const startQuestion = useCallback((i) => {
    clearTimers();
    const q = questions[i];
    if (!q) { setPhase("finished"); return; }
    setPhase("question");
    setCountdown(10);
    // Start timer independent of TTS
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearTimers();
          // show answer
          setPhase("answer");
          // force stop any speech
          try { synthRef.current && synthRef.current.cancel(); } catch (e) {}
          // after 5s, next
          advanceTimeoutRef.current = setTimeout(() => {
            setIndex((cur) => {
              const next = cur + 1;
              if (next >= questions.length) { setPhase("finished"); return cur; }
              startQuestion(next);
              return next;
            });
          }, 5000);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    // Speak but don't wait
    setTimeout(() => speakSafe(q.question || ""), 50);
  }, [questions]);

  useEffect(() => {
    // when index changes, start question
    if (questions.length === 0) return;
    if (index < questions.length) startQuestion(index);
    return () => clearTimers();
  }, [index, questions, startQuestion]);

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    // Listen for admin messages to auto-load quiz
    const handler = async (msg) => {
      try {
        console.log("[Clean] WS msg received:", msg);
        const category = msg.categoryId || msg.category || msg.categoryName || "";
        const count = msg.questionLimit || msg.count || 5;
        await fetchQuestions(category, count);
      } catch (err) {
        const fileTag = "frontend/src/pages/Branpy/LiveQuizV2/LiveQuizV2Clean.jsx";
        const funcTag = "WS handler";
        const stack = (err && err.stack) || (new Error()).stack;
        const stackLine = stack.split('\n')[1] || stack;
        console.error(`[Clean][Error] ${fileTag} ${funcTag} -> ${stackLine}`);
        console.error(err);
      }
    };

    try {
      liveSync.on("SET_QUIZ_LIBRARY_V2", handler);
    } catch (e) {
      console.error("[Clean] failed to register WS handler", e);
    }

    return () => {
      try { liveSync.off("SET_QUIZ_LIBRARY_V2"); } catch (e) { /* ignore */ }
    };
  }, [liveSync, fetchQuestions]);

  const handleLoadAndStart = async (cat = "ciencia", cnt = 5) => {
    setCategory(cat);
    const qs = await fetchQuestions(cat, cnt);
    if (qs && qs.length) {
      setIndex(0);
      // startQuestion will be triggered by effect
    }
  };

  const handleShowAnswerNow = () => {
    clearTimers();
    setPhase("answer");
    advanceTimeoutRef.current = setTimeout(() => {
      setIndex((cur) => {
        const next = cur + 1;
        if (next >= questions.length) { setPhase("finished"); return cur; }
        startQuestion(next);
        return next;
      });
    }, 5000);
  };

  const q = questions[index] || null;

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#050608", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 80, boxSizing: "border-box" }}>
      <div style={{ position: "fixed", top: 12, left: 12 }}>
        <button onClick={() => handleLoadAndStart("ciencia", 5)} style={{ padding: 8, borderRadius: 8 }}>Carregar Ciência x5</button>
      </div>
      <div style={{ width: 900, maxWidth: "95%", textAlign: "center" }}>
        {loading && <div>Carregando perguntas...</div>}
        {!q && !loading && <div style={{ padding: 40 }}>Nenhuma pergunta.</div>}
        {q && (
          <div>
            <div style={{ fontSize: 14, color: "#00E5FF", fontWeight: 700, marginBottom: 8 }}>{category || q.category || "Conhecimentos Gerais"}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{q.question}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {(q.alternatives || []).map((a, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, background: (phase === "answer" && i === q.correct) ? "#2ECC71" : "rgba(255,255,255,0.03)", color: "#fff", fontWeight: 600 }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{LABELS[i] || String.fromCharCode(65 + i)}</div>
                  <div style={{ marginTop: 6 }}>{a}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Tempo: {countdown}s</div>
            {phase === "answer" && (
              <div style={{ marginTop: 12, fontSize: 14, color: "#ddd" }}>
                <div>Resposta correta: {LABELS[q.correct] || q.correct}</div>
                {q.explanation && <div style={{ marginTop: 8, color: "#bbb" }}>{q.explanation}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
