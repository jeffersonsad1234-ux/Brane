import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getServiceInfo } from "../hooks/useApiKey";

export default function SetupWizard({ service, onComplete, onClose, open }) {
  const info = getServiceInfo(service);
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState("");

  const handleTest = async () => {
    if (!key.trim()) return;
    setTesting(true);
    setTestResult(null);
    setError("");
    try {
      const resp = await fetch(`${process.env.REACT_APP_AGENT_API || "http://localhost:3200"}/api/huggingface`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemma-2-2b-it",
          inputs: "test",
          token: key.trim(),
          parameters: { max_new_tokens: 5 },
        }),
      });
      if (resp.ok) {
        setTestResult("success");
      } else {
        const data = await resp.json().catch(() => ({}));
        setTestResult("error");
        setError(data.error || `HTTP ${resp.status}`);
      }
    } catch (err) {
      setTestResult("error");
      setError(err.message);
    }
    setTesting(false);
  };

  const handleSave = () => {
    if (key.trim()) onComplete(key.trim());
  };

  const handleClose = () => {
    if (onClose) onClose();
    else handleSave();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420, maxWidth: "90vw",
              background: "#0d0d0d", borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
              overflow: "hidden",
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            <div style={{ padding: "28px 32px 0" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                border: "1px solid rgba(99,102,241,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, marginBottom: 16,
              }}>
                {info.icon}
              </div>

              <h2 style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>
                Configurar {info.name}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.5, margin: "0 0 20px" }}>
                {info.description}
              </p>
            </div>

            <div style={{ padding: "0 32px" }}>
              <label style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                API Key
              </label>
              <input
                value={key}
                onChange={(e) => { setKey(e.target.value); setTestResult(null); setError(""); }}
                placeholder={info.placeholder}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: `1px solid ${testResult === "error" ? "rgba(239,68,68,0.3)" : testResult === "success" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)"}`,
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 13, fontFamily: "monospace",
                  outline: "none", boxSizing: "border-box",
                }}
                autoFocus
              />

              {testResult === "success" && (
                <p style={{ color: "rgba(34,197,94,0.7)", fontSize: 11, marginTop: 6 }}>
                  ✓ Conexão bem-sucedida
                </p>
              )}
              {testResult === "error" && (
                <p style={{ color: "rgba(239,68,68,0.7)", fontSize: 11, marginTop: 6 }}>
                  ✗ {error || "Falha na conexão"}
                </p>
              )}
            </div>

            <div style={{ padding: "20px 32px 28px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {info.url && (
                <a
                  href={info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "8px 14px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.4)", fontSize: 11,
                    textDecoration: "none", cursor: "pointer",
                  }}
                >
                  Obter chave →
                </a>
              )}
              <button
                onClick={handleTest}
                disabled={!key.trim() || testing}
                style={{
                  padding: "8px 14px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: testing ? "rgba(99,102,241,0.1)" : "transparent",
                  color: "rgba(255,255,255,0.5)", fontSize: 11,
                  cursor: key.trim() ? "pointer" : "not-allowed", opacity: key.trim() ? 1 : 0.4,
                }}
              >
                {testing ? "Testando..." : "Testar"}
              </button>
              <button
                onClick={handleSave}
                disabled={!key.trim() || testResult === "error"}
                style={{
                  padding: "8px 20px", borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white", fontSize: 11, fontWeight: 600,
                  cursor: key.trim() && testResult !== "error" ? "pointer" : "not-allowed",
                  opacity: key.trim() && testResult !== "error" ? 1 : 0.4,
                }}
              >
                {testResult === "success" ? "Salvar e Continuar" : "Salvar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
