import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import SetupWizard from "../../core/ai/components/SetupWizard";
import { useApiKey } from "../../core/ai/hooks/useApiKey";
import { analyzeDocument } from "../../core/ai/services/aiToolsService";

const UID = () => Math.random().toString(36).slice(2, 9);

async function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export default function DocumentsAI() {
  const { apiKey: groqToken, hasKey, setApiKey } = useApiKey("groq");
  const [showWizard, setShowWizard] = useState(!hasKey);
  const [docs, setDocs] = useLocalStorage("branpy-documents", []);
  const [selected, setSelected] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "" });
  const fileRef = useRef(null);

  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await readFileContent(file);
      const doc = { id: UID(), name: file.name, size: file.size, type: file.type, content: typeof content === "string" ? content : "(PDF - análise via IA)", date: new Date().toISOString().slice(0, 10) };
      setDocs((prev) => [doc, ...prev]);
      setSelected(doc);
      setAnalyzing(true);
      setResult("");
      setError("");
      const analysis = await analyzeDocument(typeof content === "string" ? content : `[PDF] ${file.name}`, groqToken);
      setResult(analysis);
      if (analysis) showToast("Análise concluída!");
    } catch (err) {
      setError(err.message || "Erro ao processar documento.");
    }
    setAnalyzing(false);
  };

  const handleAnalyze = async () => {
    if (!selected || analyzing) return;
    setAnalyzing(true);
    setResult("");
    setError("");
    try {
      const analysis = await analyzeDocument(selected.content, groqToken);
      setResult(analysis);
      if (analysis) showToast("Análise concluída!");
    } catch (err) {
      setError(err.message || "Erro ao analisar documento.");
    }
    setAnalyzing(false);
  };

  return (
    <>
      <SetupWizard service="groq" open={showWizard}
        onComplete={(key) => { setApiKey(key); setShowWizard(false); }}
        onClose={() => { if (hasKey) setShowWizard(false); }}
      />
      <div className="h-full w-full flex bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
        <div className="w-56 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto p-3 hidden md:block">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>Documentos</p>
            <button onClick={() => fileRef.current?.click()} className="text-[9px] px-2 py-1 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", cursor: "pointer" }}>
              + Novo
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".txt,.md,.pdf,.doc,.docx,.csv,.json" onChange={handleFile} className="hidden" />
          {docs.map((d) => (
            <div key={d.id} onClick={() => { setSelected(d); setResult(""); setError(""); }}
              className="p-2 rounded-lg mb-1 cursor-pointer transition-all text-[10px]"
              style={{
                background: selected?.id === d.id ? "rgba(99,102,241,0.08)" : "transparent",
                border: `1px solid ${selected?.id === d.id ? "rgba(99,102,241,0.15)" : "transparent"}`,
                color: selected?.id === d.id ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
              }}
            >
              <p className="truncate">{d.name}</p>
              <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>{d.date}</p>
            </div>
          ))}
          {docs.length === 0 && (
            <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.15)" }}>Nenhum documento</p>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Document AI</span>
            {!hasKey && (
              <button onClick={() => setShowWizard(true)} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "none", cursor: "pointer" }}>
                Configurar Groq Key
              </button>
            )}
            <div className="flex-1" />
            {selected && !analyzing && (
              <button onClick={handleAnalyze} className="text-[9px] px-2.5 py-1 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", cursor: "pointer" }}>
                Analisar com IA
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selected && !error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center" style={{ color: "rgba(255,255,255,0.15)" }}>
                  <div className="text-4xl mb-3">📄</div>
                  <p className="text-sm">Selecione ou importe um documento</p>
                  <button onClick={() => fileRef.current?.click()} className="mt-3 text-[10px] px-3 py-1.5 rounded-lg" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", cursor: "pointer" }}>
                    Importar documento
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-sm">⚠</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium" style={{ color: "rgba(239,68,68,0.8)" }}>Erro</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(239,68,68,0.6)" }}>{error}</p>
                  </div>
                  <button onClick={() => { setError(""); handleAnalyze(); }} className="text-[9px] px-2 py-1 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "rgba(239,68,68,0.6)", border: "none", cursor: "pointer" }}>
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}

            {selected && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>{selected.name}</p>
                  <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{(selected.size / 1024).toFixed(1)} KB — {selected.date}</p>
                </div>

                {analyzing && (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-3 h-3 rounded-full" style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
                    <span className="text-[10px]" style={{ color: "#6366f1" }}>Analisando documento...</span>
                  </div>
                )}

                {result && (
                  <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>Análise</p>
                    <div className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.7)" }}>{result}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast.visible && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl border shadow-2xl"
            style={{ background: "#141414", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
