import React, { useState, useEffect } from "react";
import { listProviderIds, getProvider } from "../providers/ProviderFactory";

const PROVIDER_LABELS = {
  opencode: { name: "OpenCode", icon: "🔌", desc: "Provider local OpenCode", doc: "http://localhost:11434" },
  openrouter: { name: "OpenRouter", icon: "🔄", desc: "Roteador multi-modelo", doc: "https://openrouter.ai/keys" },
  deepseek: { name: "DeepSeek", icon: "🧊", desc: "Modelo DeepSeek", doc: "https://platform.deepseek.com/api_keys" },
  qwen: { name: "Qwen", icon: "🐉", desc: "Alibaba Cloud Qwen", doc: "https://dashscope.aliyuncs.com" },
  llama: { name: "Llama (Local)", icon: "🦙", desc: "Llama.cpp local", doc: "http://localhost:8080" },
  local: { name: "Local (Ollama)", icon: "💻", desc: "Ollama local", doc: "http://localhost:11434" },
};

const STORAGE_KEYS = {
  opencode: { key: "opencode_key", url: "opencode_url" },
  openrouter: { key: "openrouter_key", url: null },
  deepseek: { key: "deepseek_key", url: null },
  qwen: { key: "qwen_key", url: null },
  llama: { key: null, url: "llama_url" },
  local: { key: null, url: "ollama_url" },
};

export default function ProviderConfigPanel({ onClose }) {
  const [configs, setConfigs] = useState({});
  const [saving, setSaving] = useState({});
  const [testing, setTesting] = useState({});

  useEffect(() => {
    const initial = {};
    for (const id of listProviderIds()) {
      const label = PROVIDER_LABELS[id];
      const keys = STORAGE_KEYS[id];
      initial[id] = {
        apiKey: localStorage.getItem(keys.key) || "",
        baseUrl: localStorage.getItem(keys.url) || "",
        label,
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
    const keys = STORAGE_KEYS[id];
    if (keys.key) localStorage.setItem(keys.key, cfg.apiKey);
    if (keys.url) localStorage.setItem(keys.url, cfg.baseUrl);
    setSaving((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setSaving((prev) => ({ ...prev, [id]: false })), 1000);
  };

  const handleTest = async (id) => {
    setTesting((prev) => ({ ...prev, [id]: true }));
    try {
      const provider = getProvider(id);
      provider.apiKey = configs[id].apiKey;
      provider.baseUrl = configs[id].baseUrl || provider.baseUrl;
      const healthy = await provider.healthCheck();
      alert(healthy ? `✓ ${PROVIDER_LABELS[id].name} conectado!` : `✗ ${PROVIDER_LABELS[id].name} não respondeu.`);
    } catch (err) {
      alert(`✗ Erro: ${err.message}`);
    }
    setTesting((prev) => ({ ...prev, [id]: false }));
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      background: "#0a0a0a", color: "white",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        height: 40, flexShrink: 0, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0c0c0c",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>AI Providers</span>
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

      <div style={{ flex: 1, overflow: "hidden auto", padding: 12 }} className="cs-scrollbar">
        {Object.entries(configs).map(([id, cfg]) => (
          <div key={id} style={{
            marginBottom: 10, padding: 10, borderRadius: 8,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{cfg.label.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{cfg.label.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{cfg.label.desc}</div>
              </div>
              <button onClick={() => handleTest(id)} disabled={testing[id]}
                style={{
                  padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer", background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "inherit",
                }}
                className="cs-hover-soft"
              >{testing[id] ? "..." : "Test"}</button>
            </div>

            {cfg.label.doc && (
              <div style={{ fontSize: 10, color: "rgba(59,130,246,0.5)", marginBottom: 6 }}>
                Endpoint: {cfg.label.doc}
              </div>
            )}

            {STORAGE_KEYS[id].key && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>API Key</div>
                <input value={cfg.apiKey} onChange={(e) => handleChange(id, "apiKey", e.target.value)}
                  type="password" placeholder="sk-..."
                  style={{
                    width: "100%", padding: "4px 8px", borderRadius: 4,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "monospace",
                    outline: "none",
                  }}
                />
              </div>
            )}

            {STORAGE_KEYS[id].url && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>URL</div>
                <input value={cfg.baseUrl} onChange={(e) => handleChange(id, "baseUrl", e.target.value)}
                  placeholder="http://localhost:11434"
                  style={{
                    width: "100%", padding: "4px 8px", borderRadius: 4,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "monospace",
                    outline: "none",
                  }}
                />
              </div>
            )}

            <button onClick={() => handleSave(id)}
              style={{
                padding: "4px 12px", borderRadius: 4, border: "none", cursor: "pointer",
                background: saving[id] ? "rgba(16,185,129,0.3)" : "rgba(59,130,246,0.15)",
                color: saving[id] ? "rgba(16,185,129,0.7)" : "rgba(59,130,246,0.6)",
                fontSize: 11, fontFamily: "inherit", fontWeight: 500,
              }}
              className="cs-hover-soft"
            >{saving[id] ? "✓ Saved" : "Save"}</button>
          </div>
        ))}
      </div>

      <style>{`
        .cs-scrollbar::-webkit-scrollbar { width: 4px; }
        .cs-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
        .cs-hover-soft:hover { background: rgba(255,255,255,0.06) !important; }
      `}</style>
    </div>
  );
}
