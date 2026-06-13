import { useState, useEffect, useCallback, useRef } from "react";
import useLiveSync from "../../../hooks/useLiveSync";
import { CATEGORIES } from "./data/quizSeedV2";
import { VARIANTS } from "./components/QuizBackground";

export default function LiveQuizV2Admin() {
  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [questionLimit, setQuestionLimit] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [speakText, setSpeakText] = useState("");
  const liveSync = useLiveSync("admin");

  useEffect(() => {
    liveSync.on("liveConnected", (msg) => {
      setConnected(msg.connected);
    });
    liveSync.on("status", (msg) => {
      setStatus(msg);
    });
    return () => {
      liveSync.off("liveConnected");
      liveSync.off("status");
    };
  }, [liveSync]);

  const sendCommand = useCallback((command, payload = {}) => {
    liveSync.sendCommand(command, payload);
  }, [liveSync]);

  const sendQuizLibrary = useCallback(() => {
    const msg = {
      type: "SET_QUIZ_LIBRARY_V2",
      categoryId: selectedCategory || null,
      categoryName: selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.name : "Todas",
      questionLimit: questionLimit > 0 ? questionLimit : null,
    };
    // Temporary debug logs for Admin -> Live flow
    try {
      console.log("[Admin] Enviando SET_QUIZ_LIBRARY_V2", {
        categorySent: msg.categoryName,
        categoryId: msg.categoryId,
        questionLimit: msg.questionLimit,
        payload: msg,
      });
      // expose for quick inspection in browser console
      window.__lastAdminPayload = msg;
    } catch (e) {}
    liveSync.send(msg);
  }, [liveSync, selectedCategory, questionLimit]);

  const handleSpeak = useCallback(() => {
    if (!speakText.trim()) return;
    sendCommand("speakMessage", { text: speakText.trim() });
    setSpeaking(true);
    setTimeout(() => setSpeaking(false), 3000);
    setSpeakText("");
  }, [speakText, sendCommand]);

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f", color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif", padding: 20,
    }}>
      <style>{`
        .admin-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
        .admin-btn { padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .admin-btn:active { transform: scale(0.95); }
        .admin-btn-primary { background: linear-gradient(135deg, #8A2CFF, #5B1BA6); color: #fff; }
        .admin-btn-success { background: #2ECC71; color: #fff; }
        .admin-btn-danger { background: #E74C3C; color: #fff; }
        .admin-btn-warning { background: #F39C12; color: #fff; }
        .admin-btn-info { background: #00E5FF; color: #000; }
        .admin-input { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; box-sizing: border-box; }
        .admin-select { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 6px; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>QUIZ V2 ADMIN</h1>
          <span className="status-dot" style={{ background: connected ? "#2ECC71" : "#E74C3C" }} />
          <span style={{ fontSize: 12, color: connected ? "#2ECC71" : "#E74C3C" }}>
            {connected ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      {/* Status Panel */}
      {status && (
        <div className="admin-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#00E5FF" }}>Status do Quiz</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
            <div><span style={{ color: "#888" }}>Fase:</span> <strong>{status.phase}</strong></div>
            <div><span style={{ color: "#888" }}>Pergunta:</span> <strong>{status.currentIndex + 1}</strong></div>
            <div><span style={{ color: "#888" }}>Pausado:</span> <strong>{status.paused ? "Sim" : "Não"}</strong></div>
            <div><span style={{ color: "#888" }}>Categoria:</span> <strong>{status.activeQuizCategory || "Todas"}</strong></div>
            <div><span style={{ color: "#888" }}>TTS:</span> <strong>{status.ttsEnabled ? "Ativo" : "Inativo"}</strong></div>
            <div><span style={{ color: "#888" }}>Voz:</span> <strong>{status.ttsVoiceId || "Padrão"}</strong></div>
          </div>
        </div>
      )}

      {/* Quiz Control */}
      <div className="admin-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#8A2CFF" }}>Controle do Quiz</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button className="admin-btn admin-btn-warning" onClick={() => sendCommand("pause")}>⏸ Pausar</button>
          <button className="admin-btn admin-btn-success" onClick={() => sendCommand("resume")}>▶ Continuar</button>
          <button className="admin-btn admin-btn-info" onClick={() => sendCommand("nextQuestion")}>⏭ Próxima</button>
          <button className="admin-btn admin-btn-danger" onClick={() => sendCommand("restart")}>🔄 Reiniciar</button>
        </div>
      </div>

      {/* Category Selection */}
      <div className="admin-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#00E5FF" }}>Selecionar Categoria</h3>
        <select
          className="admin-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ marginBottom: 12 }}
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          <input
            type="number"
            min="1"
            className="admin-input"
            placeholder="Quantidade de perguntas (0 = todas)"
            value={questionLimit}
            onChange={(e) => setQuestionLimit(parseInt(e.target.value, 10) || 0)}
            style={{ width: 240 }}
          />
          <span style={{ fontSize: 12, color: "#aaa" }}>
            Informe o número de perguntas a enviar. Use 5 para enviar 5 perguntas ou deixe em branco/0 para carregar até 50 perguntas.
          </span>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={sendQuizLibrary}>
          🚀 Enviar Quiz
        </button>
      </div>

      {/* Background Selection */}
      <div className="admin-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#F39C12" }}>Fundo</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
          {VARIANTS.map((variant) => (
            <button
              key={variant}
              className="admin-btn"
              style={{
                background: status?.bgVariant === variant ? "#8A2CFF" : "rgba(255,255,255,0.05)",
                border: `1px solid ${status?.bgVariant === variant ? "#8A2CFF" : "rgba(255,255,255,0.1)"}`,
                color: "#fff",
              }}
              onClick={() => sendCommand("setBackground", { variant })}
            >
              {variant.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Music Control */}
      <div className="admin-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#2ECC71" }}>Música</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="admin-btn admin-btn-success" onClick={() => sendCommand("playMusic")}>▶ Tocar</button>
          <button className="admin-btn admin-btn-danger" onClick={() => sendCommand("pauseMusic")}>⏸ Pausar</button>
          <button className="admin-btn admin-btn-info" onClick={() => sendCommand("nextMusic")}>⏭ Próxima</button>
          <button className="admin-btn admin-btn-warning" onClick={() => sendCommand("randomMusic")}>🎲 Aleatória</button>
        </div>
      </div>

      {/* Voice/TTS Control */}
      <div className="admin-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#9B59B6" }}>Voz / TTS</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button className="admin-btn admin-btn-success" onClick={() => sendCommand("enableTts")}>🔊 TTS Ativo</button>
          <button className="admin-btn admin-btn-danger" onClick={() => sendCommand("disableTts")}>🔇 TTS Inativo</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6 }}>
          {["mulher_jovem", "homem_jovem", "homem_adulto", "senhora", "senhor_idoso", "animada_quiz", "seria_historia", "infantil_charadas"].map((voiceId) => (
            <button
              key={voiceId}
              className="admin-btn"
              style={{
                background: status?.ttsVoiceId === voiceId ? "#8A2CFF" : "rgba(255,255,255,0.05)",
                border: `1px solid ${status?.ttsVoiceId === voiceId ? "#8A2CFF" : "rgba(255,255,255,0.1)"}`,
                color: "#fff", fontSize: 11, padding: "6px 8px",
              }}
              onClick={() => sendCommand("setTtsVoice", { voiceId })}
            >
              {voiceId.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Speak Message */}
      <div className="admin-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#FFD700" }}>Falar Mensagem</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="admin-input"
            placeholder="Digite uma mensagem..."
            value={speakText}
            onChange={(e) => setSpeakText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSpeak()}
            style={{ flex: 1 }}
          />
          <button className="admin-btn admin-btn-warning" onClick={handleSpeak} disabled={speaking}>
            {speaking ? "Falando..." : "🗣 Falar"}
          </button>
        </div>
      </div>

      {/* Speed Control */}
      <div className="admin-card">
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#00BCD4" }}>Velocidade</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { mode: "normal", label: "Normal" },
            { mode: "rapida", label: "Rápida" },
            { mode: "muito_rapida", label: "Muito Rápida" },
            { mode: "turbo", label: "Turbo" },
            { mode: "extrema", label: "Extrema" },
          ].map(({ mode, label }) => (
            <button
              key={mode}
              className="admin-btn"
              style={{
                background: status?.speedMode === mode ? "#00BCD4" : "rgba(255,255,255,0.05)",
                border: `1px solid ${status?.speedMode === mode ? "#00BCD4" : "rgba(255,255,255,0.1)"}`,
                color: "#fff",
              }}
              onClick={() => sendCommand("setSpeedMode", { mode })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
