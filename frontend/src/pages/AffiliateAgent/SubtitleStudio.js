import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import SetupWizard from "../../core/ai/components/SetupWizard";
import { useApiKey } from "../../core/ai/hooks/useApiKey";
import { generateSubtitles } from "../../core/ai/services/aiToolsService";

export default function SubtitleStudio() {
  const { apiKey: groqToken, hasKey, setApiKey } = useApiKey("groq");
  const [showWizard, setShowWizard] = useState(!hasKey);
  const [entries, setEntries] = useLocalStorage("branpy-subtitles", []);
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  const handleGenerate = async () => {
    if (!text.trim() || generating) return;
    setGenerating(true);
    setResult("");
    setError("");
    try {
      const srt = await generateSubtitles(text.trim(), groqToken);
      if (!srt || srt.startsWith("Nenhum resultado")) throw new Error("Não foi possível gerar legendas. Tente novamente.");
      setResult(srt);
      setEntries((prev) => [{ id: `sub_${Date.now()}`, text: text.slice(0, 50), srt, date: new Date().toISOString().slice(0, 10) }, ...prev]);
      showToast("Legendas geradas!");
    } catch (err) {
      setError(err.message || "Erro ao gerar legendas.");
    }
    setGenerating(false);
  };

  const handleCopy = async () => {
    if (result) { try { await navigator.clipboard.writeText(result); showToast("Copiado!"); } catch {} }
  };

  const handleExport = () => {
    if (result) {
      const blob = new Blob([result], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "legendas.srt"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <SetupWizard service="groq" open={showWizard}
        onComplete={(key) => { setApiKey(key); setShowWizard(false); }}
        onClose={() => { if (hasKey) setShowWizard(false); }}
      />
      <div className="h-full w-full flex bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
        <div className="w-56 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto p-3 hidden md:block">
          <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>Legendas</p>
          {entries.map((e) => (
            <div key={e.id} onClick={() => setResult(e.srt)}
              className="p-2 rounded-lg mb-1 cursor-pointer text-[10px]"
              style={{ background: "transparent", border: "1px solid transparent", color: "rgba(255,255,255,0.25)" }}
            >
              <p className="truncate">{e.text}</p>
              <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.1)" }}>{e.date}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Legendas AI</span>
            {!hasKey && (
              <button onClick={() => setShowWizard(true)} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "none", cursor: "pointer" }}>
                Configurar Groq Key
              </button>
            )}
            <div className="flex-1" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Cole o texto para gerar legendas no formato SRT..."
              className="w-full bg-transparent text-sm outline-none p-3 rounded-xl resize-none"
              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", minHeight: 120 }}
            />

            {error && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-sm">⚠</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium" style={{ color: "rgba(239,68,68,0.8)" }}>Erro</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(239,68,68,0.6)" }}>{error}</p>
                  </div>
                  <button onClick={() => { setError(""); handleGenerate(); }} className="text-[9px] px-2 py-1 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "rgba(239,68,68,0.6)", border: "none", cursor: "pointer" }}>
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}

            <button onClick={handleGenerate} disabled={!text.trim() || generating || !hasKey}
              className="px-4 py-2 rounded-xl text-xs font-medium"
              style={{
                background: text.trim() && !generating && hasKey ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)",
                color: text.trim() && !generating && hasKey ? "white" : "rgba(255,255,255,0.2)",
                border: "none", cursor: text.trim() && !generating && hasKey ? "pointer" : "not-allowed",
              }}
            >
              {generating ? "Gerando..." : "Gerar Legendas"}
            </button>

            {generating && (
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-3 h-3 rounded-full" style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
                <span className="text-[10px]" style={{ color: "#6366f1" }}>Gerando legendas...</span>
              </div>
            )}

            {result && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>SRT</span>
                  <div className="flex-1" />
                  <button onClick={handleCopy} className="text-[9px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "none", cursor: "pointer" }}>Copiar</button>
                  <button onClick={handleExport} className="text-[9px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "none", cursor: "pointer" }}>Download .srt</button>
                </div>
                <pre className="text-[10px] leading-relaxed whitespace-pre-wrap font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{result}</pre>
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
