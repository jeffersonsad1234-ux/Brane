import React, { useState, useEffect } from "react";
import { listProviderIds, getProvider } from "../providers/ProviderFactory";
import { providerManager } from "../providers/ProviderManager";

const PROVIDER_INFO = {
  opencode: { name: "OpenCode", icon: "🔌", desc: "Provider local OpenCode", doc: "http://localhost:11434", hasKey: false, hasUrl: true, keyLabel: "OpenCode Key" },
  openrouter: { name: "OpenRouter", icon: "🔄", desc: "Roteador multi-modelo", doc: "https://openrouter.ai/keys", hasKey: true, hasUrl: true, keyLabel: "OpenRouter API Key" },
  groq: { name: "Groq", icon: "⚡", desc: "Inferência ultrarrápida (Llama, Mixtral, Gemma)", doc: "https://console.groq.com/keys", hasKey: true, hasUrl: false, keyLabel: "Groq API Key" },
  gemini: { name: "Gemini", icon: "🔮", desc: "Google Gemini 2.0 Flash / Pro", doc: "https://aistudio.google.com/apikey", hasKey: true, hasUrl: false, keyLabel: "Gemini API Key" },
  openai: { name: "OpenAI", icon: "⚪", desc: "GPT-4o, GPT-4o-mini e GPT-3.5", doc: "https://platform.openai.com/api-keys", hasKey: true, hasUrl: false, keyLabel: "OpenAI API Key" },
  deepseek: { name: "DeepSeek", icon: "🧊", desc: "Modelo DeepSeek-V2 / Coder", doc: "https://platform.deepseek.com/api_keys", hasKey: true, hasUrl: false, keyLabel: "DeepSeek API Key" },
  qwen: { name: "Qwen", icon: "🐉", desc: "Alibaba Cloud Qwen Max / Turbo", doc: "https://dashscope.aliyuncs.com", hasKey: true, hasUrl: false, keyLabel: "Qwen API Key" },
  llama: { name: "Llama (Local)", icon: "🦙", desc: "Servidor llama.cpp local", doc: "http://localhost:8080", hasKey: false, hasUrl: true, keyLabel: "", urlLabel: "Llama Server URL" },
  local: { name: "Ollama (Local)", icon: "💻", desc: "Ollama local", doc: "http://localhost:11434", hasKey: false, hasUrl: true, keyLabel: "", urlLabel: "Ollama URL" },
  "branpy-demo": { name: "BRANPY Local AI", icon: "🧠", desc: "Modo demonstração local (offline)", doc: "", hasKey: false, hasUrl: false, keyLabel: "" },
};

export default function ProviderConfigPanel({ onClose }) {
  const [configs, setConfigs] = useState({});
  const [statusMsg, setStatusMsg] = useState({});

  useEffect(() => {
    const initial = {};
    for (const id of listProviderIds()) {
      const info = PROVIDER_INFO[id];
      if (!info) continue;
      const p = getProvider(id);
      initial[id] = {
        apiKey: p?.apiKey || localStorage.getItem(`branpy_${id}_key`) || "",
        baseUrl: p?.baseUrl || localStorage.getItem(`branpy_${id}_url`) || "",
        info,
      };
    }
    setConfigs(initial);
  }, []);

  const handleChange = (id, field, value) => {
    setConfigs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = (id) => {
    const cfg = configs[id];
    if (!cfg) return;
    providerManager.configureProvider(id, { apiKey: cfg.apiKey, baseUrl: cfg.baseUrl });
    if (cfg.apiKey) localStorage.setItem(`branpy_${id}_key`, cfg.apiKey);
    if (cfg.baseUrl) localStorage.setItem(`branpy_${id}_url`, cfg.baseUrl);
    setStatusMsg((prev) => ({ ...prev, [id]: { type: "success", text: "✓ Salvo" } }));
    setTimeout(() => setStatusMsg((prev) => ({ ...prev, [id]: null })), 2000);
  };

  const handleTest = async (id) => {
    setStatusMsg((prev) => ({ ...prev, [id]: { type: "testing", text: "Testando..." } }));
    const ok = await providerManager.checkHealth(id);
    setStatusMsg((prev) => ({
      ...prev,
      [id]: ok ? { type: "success", text: "✓ Conectado" } : { type: "error", text: "✗ Falha na conexão" },
    }));
    setTimeout(() => setStatusMsg((prev) => ({ ...prev, [id]: null })), 3000);
  };

  const handleClear = (id) => {
    const info = PROVIDER_INFO[id];
    if (!info) return;
    if (info.hasKey) {
      setConfigs((prev) => ({ ...prev, [id]: { ...prev[id], apiKey: "" } }));
      localStorage.removeItem(`branpy_${id}_key`);
    }
    if (info.hasUrl) {
      setConfigs((prev) => ({ ...prev, [id]: { ...prev[id], baseUrl: "" } }));
      localStorage.removeItem(`branpy_${id}_url`);
    }
    providerManager.configureProvider(id, { apiKey: "", baseUrl: "" });
    setStatusMsg((prev) => ({ ...prev, [id]: { type: "success", text: "✓ Limpo" } }));
    setTimeout(() => setStatusMsg((prev) => ({ ...prev, [id]: null })), 2000);
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      background: "#0a0a0a", color: "white",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        height: 44, flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0c0c0c",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "white",
          }}>K</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>AI Providers</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
            {Object.values(configs).filter((c) => c.apiKey).length} keys ativas
          </span>
          {onClose && (
            <button onClick={onClose}
              style={{
                padding: 3, border: "none", cursor: "pointer", background: "none",
                color: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "inherit",
              }}
              className="cs-hover-soft"
            >✕</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "hidden auto", padding: 12 }} className="cs-scrollbar">
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12, padding: "6px 10px", borderRadius: 6, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.1)" }}>
          Suas chaves de API ficam salvas apenas no navegador. Nenhum dado é enviado para servidores BRANPY.
        </div>

        {Object.entries(configs).map(([id, cfg]) => {
          if (!cfg) return null;
          const info = cfg.info;
          const st = statusMsg[id];
          return (
          <div key={id} style={{
            marginBottom: 8, padding: "10px 12px", borderRadius: 8,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            transition: "border-color 0.2s", opacity: id === "branpy-demo" ? 0.6 : 1,
          }} className="cs-hover-border">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{info.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{info.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{info.desc}</div>
              </div>
              {id !== "branpy-demo" && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => handleTest(id)}
                    style={{
                      padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer", background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "inherit",
                    }}
                    className="cs-hover-soft"
                  >{st?.type === "testing" ? "..." : "Test"}</button>
                  <button onClick={() => handleSave(id)}
                    style={{
                      padding: "3px 8px", borderRadius: 4, border: "none", cursor: "pointer",
                      background: st?.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.12)",
                      color: st?.type === "success" ? "rgba(16,185,129,0.6)" : "rgba(59,130,246,0.5)",
                      fontSize: 10, fontFamily: "inherit", fontWeight: 500,
                    }}
                    className="cs-hover-soft"
                  >{st?.type === "success" ? "✓" : "Save"}</button>
                  {(info.hasKey || info.hasUrl) && (
                    <button onClick={() => handleClear(id)}
                      style={{
                        padding: "3px 6px", borderRadius: 4, border: "none", cursor: "pointer",
                        background: "none", color: "rgba(239,68,68,0.4)", fontSize: 10, fontFamily: "inherit",
                      }}
                      className="cs-hover-soft"
                      title="Limpar credenciais"
                    >✕</button>
                  )}
                </div>
              )}
            </div>

            {st && st.type !== "testing" && (
              <div style={{ fontSize: 10, marginBottom: 6, color: st.type === "success" ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)" }}>
                {st.text}
              </div>
            )}

            {info.hasKey && id !== "branpy-demo" && (
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{info.keyLabel}</div>
                <input value={cfg.apiKey} onChange={(e) => handleChange(id, "apiKey", e.target.value)}
                  type="password" placeholder="sk-..."
                  style={{
                    width: "100%", padding: "5px 8px", borderRadius: 4, boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "monospace",
                    outline: "none",
                  }}
                />
              </div>
            )}

            {info.hasUrl && id !== "branpy-demo" && (
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{info.urlLabel || "URL"}</div>
                <input value={cfg.baseUrl} onChange={(e) => handleChange(id, "baseUrl", e.target.value)}
                  placeholder={info.doc}
                  style={{
                    width: "100%", padding: "5px 8px", borderRadius: 4, boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "monospace",
                    outline: "none",
                  }}
                />
              </div>
            )}

            {id === "branpy-demo" && (
              <div style={{ fontSize: 11, color: "rgba(251,191,36,0.5)", fontStyle: "italic" }}>
                Modo demonstração local — funciona offline, sem API key.
              </div>
            )}
          </div>
          );
        })}
      </div>

      <style>{`
        .cs-scrollbar::-webkit-scrollbar { width: 4px; }
        .cs-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        .cs-hover-soft:hover { background: rgba(255,255,255,0.06) !important; }
        .cs-hover-border:hover { border-color: rgba(255,255,255,0.12) !important; }
      `}</style>
    </div>
  );
}
