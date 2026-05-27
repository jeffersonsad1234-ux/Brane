import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
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
  const [docs, setDocs] = useLocalStorage("branpy-documents", []);
  const [selected, setSelected] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const fileRef = useRef(null);

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
      const analysis = await analyzeDocument(typeof content === "string" ? content : `[PDF] ${file.name}`, "");
      setResult(analysis);
      setAnalyzing(false);
    } catch (err) {
      setResult(`Erro ao processar: ${err.message}`);
      setAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selected || analyzing) return;
    setAnalyzing(true);
    setResult("");
    try {
      const analysis = await analyzeDocument(selected.content, "");
      setResult(analysis);
    } catch (err) {
      setResult(`Erro: ${err.message}`);
    }
    setAnalyzing(false);
  };

  return (
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
          <div key={d.id} onClick={() => { setSelected(d); setResult(""); }}
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
        <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Document AI</span>
          <div className="flex-1" />
          {selected && !analyzing && (
            <button onClick={handleAnalyze} className="text-[9px] px-2.5 py-1 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", cursor: "pointer" }}>
              Analisar com IA
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!selected && (
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
  );
}
