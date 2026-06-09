import { useState, useEffect, useCallback } from "react";
import useLiveSync from "../../hooks/useLiveSync";

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

const BG_OPTIONS = ["neon", "espaco", "cidade", "estudio", "particulas"];

const SPEED_OPTIONS = [
  { id: "lenta", label: "Lenta" },
  { id: "normal", label: "Normal" },
  { id: "rapida", label: "Rápida" },
];

const btnStyle = {
  display: "block", width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8, color: "#fff", fontSize: 13, cursor: "pointer",
  textAlign: "left", fontWeight: 500, minHeight: 44,
  WebkitTapHighlightColor: "transparent",
};

export default function BranpyLiveAdmin() {
  const liveSync = useLiveSync("admin");
  const [liveConnected, setLiveConnected] = useState(false);
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState({});
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    liveSync.on("liveConnected", (msg) => setLiveConnected(msg.connected));
    liveSync.on("voices", (msg) => setVoices(msg.voices || []));
    liveSync.on("status", (msg) => setStatus(msg));
    liveSync.on("audioState", (msg) => setStatus((s) => ({ ...s, audioActive: msg.active })));
    return () => { liveSync.off("liveConnected"); liveSync.off("voices"); liveSync.off("status"); liveSync.off("audioState"); };
  }, [liveSync]);

  const cmd = useCallback((command, extra = {}) => {
    liveSync.sendCommand(command, extra);
  }, [liveSync]);

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      fontFamily: "system-ui,-apple-system,sans-serif", padding: 16,
      maxWidth: 500, margin: "0 auto",
      userSelect: "none", WebkitUserSelect: "none",
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
        🎮 Admin Remoto
      </div>
      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 12 }}>
        Controle o quiz ao vivo pelo PC.
      </div>

      {/* Tablet status */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center", marginBottom: 12,
        padding: "10px 12px", borderRadius: 10,
        background: liveConnected ? "rgba(46,204,113,0.1)" : "rgba(231,76,60,0.1)",
        border: `1px solid ${liveConnected ? "rgba(46,204,113,0.3)" : "rgba(231,76,60,0.3)"}`,
      }}>
        <span style={{ fontSize: 16 }}>{liveConnected ? "🟢" : "🔴"}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>
            Tablet: {liveConnected ? "Online" : "Offline"}
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>
            {liveConnected
              ? `Vozes detectadas: ${voices.length}`
              : "Aguardando conexão do tablet..."}
          </div>
        </div>
      </div>

      {!liveConnected && (
        <div style={{
          padding: "20px", textAlign: "center", fontSize: 13, color: COLORS.muted,
          border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12, marginBottom: 12,
        }}>
          Abra /branpy/live no tablet para começar.
        </div>
      )}

      {/* Audio status from tablet */}
      {status.audioActive != null && (
        <div style={{ fontSize: 11, color: COLORS.correct, marginBottom: 8, textAlign: "center" }}>
          ✓ Áudio ativo no tablet
        </div>
      )}

      {/* Voice selector */}
      {voices.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 2 }}>Voz do tablet</div>
          <div style={{ display: "flex", gap: 4 }}>
            <select value={status.voiceName || ""} onChange={(e) => cmd("setVoice", { voiceName: e.target.value })}
              style={{ ...btnStyle, flex: 1, appearance: "auto", fontSize: 12, minHeight: 44 }}
            >
              <option value="" disabled>Selecione</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} {v.lang || ""}
                </option>
              ))}
            </select>
            <button onClick={() => cmd("refreshVoices")} style={{ ...btnStyle, flex: "none", width: 44, textAlign: "center", fontSize: 16 }}>
              🔄
            </button>
          </div>
        </div>
      )}

      {/* Quiz controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
        <button onClick={() => cmd("pause")} style={{ ...btnStyle, textAlign: "center", color: "#FFA500" }}>⏸ Pausar</button>
        <button onClick={() => cmd("resume")} style={{ ...btnStyle, textAlign: "center", color: COLORS.correct }}>▶ Continuar</button>
        <button onClick={() => cmd("restart")} style={{ ...btnStyle, textAlign: "center", color: COLORS.wrong }}>🔄 Reiniciar</button>
        <button onClick={() => cmd("nextQuestion")} style={{ ...btnStyle, textAlign: "center", color: COLORS.accent }}>⏭ Próxima</button>
      </div>

      {/* Background */}
      <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 2 }}>Fundo</div>
      <select value={status.bgVariant || "neon"} onChange={(e) => cmd("setBackground", { variant: e.target.value })}
        style={{ ...btnStyle, appearance: "auto", fontSize: 12, minHeight: 44, marginBottom: 8 }}
      >
        {BG_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
        ))}
      </select>

      {/* Music */}
      <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 2 }}>Música</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 4 }}>
        <button onClick={() => cmd("playMusic")} style={{ ...btnStyle, textAlign: "center" }}>
          {status.isPlaying ? "⏸ Parar" : "▶ Tocar"}
        </button>
        <button onClick={() => cmd("nextMusic")} style={{ ...btnStyle, textAlign: "center" }}>⏭ Próxima</button>
        <button onClick={() => cmd("randomMusic")} style={{ ...btnStyle, textAlign: "center" }}>🔀 Aleatória</button>
      </div>
      <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8 }}>
        {status.currentTrack || "Nenhuma faixa"}
      </div>

      {/* Voice settings */}
      <details style={{ marginBottom: 8 }}>
        <summary style={{ fontSize: 11, color: COLORS.primary, fontWeight: 600, cursor: "pointer", padding: "4px 0" }}>
          ⚙️ Ajustes de voz
        </summary>
        <div style={{ padding: "8px 0" }}>
          <div style={{ fontSize: 10, color: COLORS.muted }}>Volume da narradora</div>
          <input type="range" min="0" max="1" step="0.1" value={status.volume ?? 1}
            onChange={(e) => cmd("setVolume", { volume: e.target.value })}
            style={{ width: "100%", accentColor: COLORS.primary, marginBottom: 6 }} />

          <div style={{ fontSize: 10, color: COLORS.muted }}>Velocidade</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            {SPEED_OPTIONS.map((opt) => (
              <button key={opt.id} onClick={() => cmd("setSpeedMode", { mode: opt.id })}
                style={{
                  ...btnStyle, textAlign: "center", fontSize: 11,
                  border: `1px solid ${status.speedMode === opt.id ? COLORS.primary : "rgba(255,255,255,0.1)"}`,
                  background: status.speedMode === opt.id ? `${COLORS.primary}30` : "rgba(255,255,255,0.06)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 10, color: COLORS.muted }}>Tom</div>
          <input type="range" min="0.5" max="2" step="0.1" value={status.pitch ?? 1.2}
            onChange={(e) => cmd("setPitch", { pitch: e.target.value })}
            style={{ width: "100%", accentColor: COLORS.primary, marginBottom: 6 }} />

          <div style={{ fontSize: 10, color: COLORS.muted }}>Volume da música</div>
          <input type="range" min="0" max="1" step="0.05" value={status.musicVolume ?? 0.3}
            onChange={(e) => cmd("setMusicVolume", { volume: e.target.value })}
            style={{ width: "100%", accentColor: COLORS.primary }} />
        </div>
      </details>

      {/* Mensagem ao vivo */}
      <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 2 }}>Mensagem ao vivo</div>
      <div style={{ display: "flex", gap: 4 }}>
        <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
          placeholder="Obrigado Tatiana pela rosa."
          style={{
            ...btnStyle, flex: 1, fontSize: 12,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
        <button onClick={() => { if (messageText.trim()) { cmd("speakMessage", { text: messageText.trim() }); setMessageText(""); } }}
          style={{ ...btnStyle, flex: "none", width: 80, textAlign: "center", color: COLORS.accent, fontSize: 11 }}>
          Falar
        </button>
      </div>

      {/* Phase info */}
      {status.phase && (
        <div style={{
          marginTop: 12, padding: "8px 10px", borderRadius: 8,
          background: "rgba(138,44,255,0.1)", border: "1px solid rgba(138,44,255,0.2)",
          fontSize: 11, color: COLORS.muted, textAlign: "center",
        }}>
          Fase: <strong style={{ color: COLORS.primary }}>{status.phase}</strong>
          {status.currentIndex != null && (
            <> | Pergunta: <strong style={{ color: COLORS.primary }}>#{status.currentIndex + 1}</strong></>
          )}
          {status.paused && <span style={{ color: "#FFA500", marginLeft: 8 }}>⏸ PAUSADO</span>}
        </div>
      )}

      {/* Connection debug */}
      <div style={{ marginTop: 16, fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
        WebSocket: {liveSync.connected ? "conectado" : "desconectado"}
      </div>
    </div>
  );
}
