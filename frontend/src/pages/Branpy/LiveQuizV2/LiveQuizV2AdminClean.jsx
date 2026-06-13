import React, { useState, useEffect } from "react";
import useLiveSync from "../../../hooks/useLiveSync";
import { CATEGORIES } from "./data/quizSeedV2";

export default function LiveQuizV2AdminClean() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [questionLimit, setQuestionLimit] = useState(5);
  const liveSync = useLiveSync("admin");

  useEffect(() => {
    // noop
  }, []);

  const sendQuiz = () => {
    const msg = {
      type: "SET_QUIZ_LIBRARY_V2",
      categoryId: selectedCategory || null,
      categoryName: selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.name : "Todas",
      questionLimit: questionLimit > 0 ? questionLimit : null,
    };
    console.log("[AdminClean] sending", msg);
    try { window.__lastAdminCleanPayload = msg; } catch (e) {}
    liveSync.send(msg);
  };

  const sendCommand = (command, payload = {}) => {
    console.log("[AdminClean] command", command, payload);
    liveSync.sendCommand(command, payload);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", padding: 20 }}>
      <h1 style={{ marginTop: 0 }}>QUIZ V2 ADMIN CLEAN</h1>
      <div style={{ maxWidth: 520 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Categoria</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 12 }}>
          <option value="">Todas as categorias</option>
          {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>

        <label style={{ display: "block", marginBottom: 8 }}>Quantidade</label>
        <input type="number" value={questionLimit} onChange={(e) => setQuestionLimit(parseInt(e.target.value, 10) || 0)} style={{ width: 160, padding: 8, marginBottom: 12 }} />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={sendQuiz} style={{ padding: 10, borderRadius: 8 }}>Enviar Quiz</button>
          <button onClick={() => sendCommand("resume")} style={{ padding: 10, borderRadius: 8 }}>Iniciar</button>
          <button onClick={() => sendCommand("pause")} style={{ padding: 10, borderRadius: 8 }}>Pausar</button>
          <button onClick={() => sendCommand("nextQuestion")} style={{ padding: 10, borderRadius: 8 }}>Próxima</button>
        </div>
      </div>
    </div>
  );
}
