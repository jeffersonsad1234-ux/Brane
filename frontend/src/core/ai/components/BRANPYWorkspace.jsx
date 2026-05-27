import React, { useState, useCallback } from "react";
import AIChatPanel from "./AIChatPanel";
import BrowserPanel from "./BrowserPanel";
import OperatorPanel from "./OperatorPanel";
const DOCK_ITEMS = [
  { id: "chat", label: "Chat", icon: "💬", color: "#3b82f6" },
  { id: "browser", label: "Browser", icon: "🌐", color: "#22c55e" },
  { id: "operator", label: "Operator", icon: "⚙️", color: "#f97316" },
];

export default function BRANPYWorkspace({ onClose, fullScreen = true }) {
  const [activePanel, setActivePanel] = useState("chat");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [cmdSearch, setCmdSearch] = useState("");
  const [splitMode, setSplitMode] = useState(false);
  const [splitPanel, setSplitPanel] = useState(null);

  const handleCommand = useCallback((cmd) => {
    setShowCommandPalette(false);
    setCmdSearch("");
    if (cmd.action === "panel") setActivePanel(cmd.value);
    else if (cmd.action === "split") { setSplitMode(true); setSplitPanel(cmd.value); }
    else if (cmd.action === "clear") setSplitMode(false);
  }, []);

  const COMMANDS = [
    { id: "cmd-chat", label: "Abrir Chat", icon: "💬", action: "panel", value: "chat" },
    { id: "cmd-browser", label: "Abrir Browser", icon: "🌐", action: "panel", value: "browser" },
    { id: "cmd-operator", label: "Abrir Operator", icon: "⚙️", action: "panel", value: "operator" },
    { id: "cmd-split", label: "Split View (Chat + Browser)", icon: "🔲", action: "split", value: "browser" },
    { id: "cmd-unsplit", label: "Fechar Split View", icon: "❌", action: "clear" },
  ];

  const filteredCommands = COMMANDS.filter(
    (c) => !cmdSearch || c.label.toLowerCase().includes(cmdSearch.toLowerCase()) || c.id.includes(cmdSearch.toLowerCase())
  );

  const renderPanel = (panelId) => {
    switch (panelId) {
      case "chat": return <AIChatPanel key="chat" fullScreen={false} />;
      case "browser": return <BrowserPanel key="browser" />;
      case "operator": return <OperatorPanel key="operator" />;

      default: return <AIChatPanel key="chat" fullScreen={false} />;
    }
  };

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "#080808", color: "white", overflow: "hidden", position: "relative",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      ...(fullScreen ? { position: "fixed", inset: 0, zIndex: 100 } : {}),
    }}>
      {/* Top bar */}
      <div style={{
        height: 36, flexShrink: 0, display: "flex", alignItems: "center",
        padding: "0 10px", background: "rgba(10,10,10,0.9)", borderBottom: "1px solid rgba(255,255,255,0.04)",
        zIndex: 10, gap: 6,
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 5,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "white",
        }}>B</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>BRANPY OS</span>

        {/* Dock */}
        <div style={{ display: "flex", gap: 2, marginLeft: 12 }}>
          {DOCK_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActivePanel(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 3, padding: "4px 8px",
                borderRadius: 5, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                background: activePanel === item.id ? `${item.color}18` : "transparent",
                color: activePanel === item.id ? item.color : "rgba(255,255,255,0.35)",
                transition: "all 0.12s",
              }}
              className="cs-hover-soft"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Command palette trigger */}
        <button onClick={() => setShowCommandPalette(true)}
          style={{
            padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
            background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 4,
          }}
          className="cs-hover-soft"
        >⌘ Comandos</button>

        {/* Split toggle */}
        <button onClick={() => setSplitMode(!splitMode)}
          style={{
            padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
            background: splitMode ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
            color: splitMode ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "inherit",
          }}
          className="cs-hover-soft"
          title={splitMode ? "Fechar split" : "Abrir split view"}
        >⊞</button>

        {onClose && (
          <button onClick={onClose}
            style={{ padding: 3, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "inherit" }}
            className="cs-hover-soft"
          >✕</button>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {splitMode ? (
          <>
            <div style={{ flex: 1, borderRight: "1px solid rgba(255,255,255,0.04)", overflow: "hidden" }}>
              {renderPanel(activePanel)}
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {renderPanel(splitPanel || "browser")}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflow: "hidden" }}>
            {renderPanel(activePanel)}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        height: 22, flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
        padding: "0 10px", borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(10,10,10,0.9)", fontSize: 9, color: "rgba(255,255,255,0.15)",
        fontFamily: "monospace",
      }}>
        <span>BRANPY v1.0</span>
        <span>•</span>
        <span>Panel: {DOCK_ITEMS.find((d) => d.id === activePanel)?.label || activePanel}</span>
        {splitMode && <><span>•</span><span>Split: {DOCK_ITEMS.find((d) => d.id === splitPanel)?.label || splitPanel}</span></>}
        <span>•</span>
        <span style={{ flex: 1, textAlign: "right" }}>{new Date().toLocaleTimeString("pt-BR")}</span>
      </div>

      {/* Command palette overlay */}
      {showCommandPalette && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 200,
          display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 60,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        }} onClick={() => setShowCommandPalette(false)}>
          <div style={{
            width: 400, maxHeight: 300, background: "#181818",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }} onClick={(e) => e.stopPropagation()}>
            <input value={cmdSearch} onChange={(e) => setCmdSearch(e.target.value)}
              placeholder="Digite um comando..."
              autoFocus
              style={{
                width: "100%", padding: "10px 12px", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "transparent", color: "rgba(255,255,255,0.8)", fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowCommandPalette(false);
                if (e.key === "Enter" && filteredCommands.length > 0) handleCommand(filteredCommands[0]);
              }}
            />
            <div style={{ maxHeight: 250, overflow: "hidden auto" }}>
              {filteredCommands.map((cmd) => (
                <button key={cmd.id} onClick={() => handleCommand(cmd)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
                    border: "none", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.55)",
                    fontSize: 12, fontFamily: "inherit", textAlign: "left",
                  }}
                  className="cs-hover-item"
                >
                  <span>{cmd.icon}</span>
                  <span>{cmd.label}</span>
                </button>
              ))}
              {filteredCommands.length === 0 && (
                <div style={{ padding: "12px", color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center" }}>
                  Nenhum comando encontrado
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cs-hover-soft:hover { background: rgba(255,255,255,0.06) !important; }
        .cs-hover-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>
    </div>
  );
}
