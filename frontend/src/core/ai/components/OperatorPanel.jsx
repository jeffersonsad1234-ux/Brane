import React, { useState, useEffect, useCallback } from "react";
import { operatorEngine } from "../operator/OperatorEngine";

const ACTIONS = [
  { id: "navigate", label: "Navegar", icon: "🌐", params: [{ key: "url", label: "URL", type: "text" }] },
  { id: "search", label: "Pesquisar", icon: "🔍", params: [{ key: "query", label: "Query", type: "text" }] },
  { id: "fetch", label: "Buscar página", icon: "📄", params: [{ key: "url", label: "URL", type: "text" }] },
  { id: "extract", label: "Extrair conteúdo", icon: "📋", params: [{ key: "selector", label: "Seletor (article/links/images)", type: "text" }, { key: "url", label: "URL (opcional)", type: "text" }] },
  { id: "wait", label: "Aguardar", icon: "⏱️", params: [{ key: "ms", label: "Milissegundos", type: "number" }] },
  { id: "click", label: "Clicar", icon: "👆", params: [{ key: "selector", label: "Seletor CSS", type: "text" }, { key: "url", label: "URL (opcional)", type: "text" }] },
  { id: "type", label: "Digitar", icon: "⌨️", params: [{ key: "selector", label: "Seletor CSS", type: "text" }, { key: "text", label: "Texto", type: "text" }] },
];

export default function OperatorPanel({ onClose }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [params, setParams] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [sequence, setSequence] = useState([]);

  useEffect(() => {
    setLogs(operatorEngine.actionLog.slice(-20).reverse());
    setSessions(operatorEngine.sessions);
  }, []);

  const refreshLogs = useCallback(() => {
    setLogs(operatorEngine.actionLog.slice(-20).reverse());
    setSessions([...operatorEngine.sessions]);
  }, []);

  const handleExecute = useCallback(async () => {
    if (!selectedAction) return;
    setLoading(true);
    setResult(null);
    const res = await operatorEngine.execute(selectedAction, params);
    setResult(res);
    setLoading(false);
    refreshLogs();
  }, [selectedAction, params, refreshLogs]);

  const handleAddToSequence = () => {
    if (!selectedAction) return;
    setSequence((prev) => [...prev, { action: selectedAction, params: { ...params } }]);
  };

  const handleRunSequence = async () => {
    if (sequence.length === 0) return;
    setLoading(true);
    const res = await operatorEngine.executeSequence(sequence);
    setResult(res);
    setLoading(false);
    refreshLogs();
    setSequence([]);
  };

  const handleParamChange = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const actionDef = ACTIONS.find((a) => a.id === selectedAction);

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      background: "#0a0a0a", color: "white", fontSize: 12,
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0c0c0c",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white" }}>O</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>AI Operator</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setShowLog(!showLog)}
            style={{
              padding: "2px 6px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
              background: showLog ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "inherit",
            }}
            className="cs-hover-soft"
          >Logs</button>
          {onClose && (
            <button onClick={onClose}
              style={{ padding: 2, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "inherit" }}
              className="cs-hover-soft"
            >✕</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 160, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.04)", padding: 6, overflow: "hidden auto" }} className="cs-scrollbar">
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4, padding: "0 4px" }}>Ações</div>
          {ACTIONS.map((action) => (
            <button key={action.id} onClick={() => setSelectedAction(action.id)}
              style={{
                display: "flex", alignItems: "center", gap: 4, width: "100%", padding: "5px 8px",
                borderRadius: 4, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "inherit", textAlign: "left",
                background: selectedAction === action.id ? "rgba(249,115,22,0.12)" : "transparent",
                color: selectedAction === action.id ? "rgba(249,115,22,0.7)" : "rgba(255,255,255,0.5)",
                marginBottom: 1,
              }}
              className="cs-hover-item"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}

          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "8px 4px 4px" }}>Sequências</div>
          {sequence.map((s, i) => (
            <div key={i} style={{ padding: "3px 8px", fontSize: 10, color: "rgba(255,255,255,0.4)", borderRadius: 3, background: "rgba(255,255,255,0.02)", marginBottom: 1 }}>
              {i + 1}. {ACTIONS.find((a) => a.id === s.action)?.label || s.action}
            </div>
          ))}
          {sequence.length > 0 && (
            <button onClick={handleRunSequence} disabled={loading}
              style={{
                width: "100%", padding: "4px 8px", marginTop: 4, borderRadius: 4, border: "none", cursor: "pointer",
                background: "rgba(16,185,129,0.15)", color: "rgba(16,185,129,0.6)", fontSize: 10, fontFamily: "inherit",
              }}
              className="cs-hover-soft"
            >▶ Executar sequência</button>
          )}
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {showLog ? (
            <div style={{ flex: 1, overflow: "hidden auto", padding: 8 }} className="cs-scrollbar">
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>Log de ações ({logs.length})</div>
              {logs.map((log, i) => (
                <div key={i} style={{
                  padding: "4px 6px", marginBottom: 2, borderRadius: 3, fontSize: 10, fontFamily: "monospace",
                  background: log.status === "success" ? "rgba(16,185,129,0.04)" : log.status === "error" ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)",
                  color: log.status === "success" ? "rgba(16,185,129,0.5)" : log.status === "error" ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.4)",
                }}>
                  {log.action} {log.status} — {log.elapsed ? `${log.elapsed}ms` : ""}
                  {log.error ? ` — ${log.error}` : ""}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, overflow: "hidden auto", padding: "8px 10px" }} className="cs-scrollbar">
              {selectedAction && actionDef && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                    {actionDef.icon} {actionDef.label}
                  </div>
                  {actionDef.params.map((p) => (
                    <div key={p.key} style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{p.label}</div>
                      <input value={params[p.key] || ""} onChange={(e) => handleParamChange(p.key, e.target.value)}
                        placeholder={p.type === "number" ? "1000" : "Valor..."}
                        type={p.type === "number" ? "number" : "text"}
                        style={{
                          width: "100%", padding: "5px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    <button onClick={handleExecute} disabled={loading}
                      style={{
                        padding: "5px 14px", borderRadius: 5, border: "none", cursor: "pointer",
                        background: "rgba(249,115,22,0.15)", color: "rgba(249,115,22,0.6)", fontSize: 11, fontFamily: "inherit", fontWeight: 500,
                      }}
                      className="cs-hover-soft"
                    >{loading ? "Executando..." : "▶ Executar"}</button>
                    <button onClick={handleAddToSequence}
                      style={{
                        padding: "5px 10px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
                        background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "inherit",
                      }}
                      className="cs-hover-soft"
                    >+ Adicionar à sequência</button>
                  </div>
                </div>
              )}

              {result && (
                <div style={{
                  marginTop: 8, padding: "8px 10px", borderRadius: 6,
                  background: result.success ? "rgba(16,185,129,0.03)" : "rgba(239,68,68,0.03)",
                  border: `1px solid ${result.success ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}`,
                }}>
                  <div style={{ fontSize: 10, color: result.success ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)", marginBottom: 4, fontFamily: "monospace" }}>
                    {result.success ? "✓ Sucesso" : "✗ Erro"} — {result.elapsed}ms
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", whiteSpace: "pre-wrap", maxHeight: 200, overflow: "hidden auto" }}>
                    {JSON.stringify(result.result || result, null, 2)}
                  </div>
                </div>
              )}

              {!selectedAction && !result && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                  <span style={{ fontSize: 28 }}>⚙️</span>
                  <span>Selecione uma ação para executar</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .cs-scrollbar::-webkit-scrollbar { width: 4px; }
        .cs-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        .cs-hover-soft:hover { background: rgba(255,255,255,0.06) !important; }
        .cs-hover-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>
    </div>
  );
}
