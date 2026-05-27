import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import SetupWizard from "../../core/ai/components/SetupWizard";
import { useApiKey } from "../../core/ai/hooks/useApiKey";
import { transcribeAudio } from "../../core/ai/services/aiToolsService";

const UID = () => Math.random().toString(36).slice(2, 9);

export default function TranscriptionAI() {
  const { apiKey: hfToken, hasKey, setApiKey } = useApiKey("huggingface");
  const [showWizard, setShowWizard] = useState(!hasKey);
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useLocalStorage("branpy-transcription-history", []);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("Processing");
    setProgress(10);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        setProgress(40);
        const audioBase64 = ev.target?.result;
        try {
          const resp = await transcribeAudio(audioBase64, hfToken);
          setProgress(100);
          const entry = {
            id: UID(),
            text: resp.data || "",
            language: resp.language || "pt",
            date: new Date().toISOString().slice(0, 10),
            duration: file.name,
          };
          setResult(entry);
          setHistory((prev) => [entry, ...prev]);
          setStatus("Complete");
        } catch (err) {
          setStatus("Error");
          setResult({ id: UID(), text: `Erro: ${err.message}`, language: "", date: new Date().toISOString().slice(0, 10), duration: "" });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setStatus("Error");
    }
  };

  const handleCopy = async () => {
    if (result) { try { await navigator.clipboard.writeText(result.text); } catch {} }
  };

  const handleExport = () => {
    if (result) {
      const blob = new Blob([result.text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "transcript.txt"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const displayText = selectedHistory ? selectedHistory.text : result?.text || "";

  return (
    <>
      <SetupWizard service="huggingface" open={showWizard}
        onComplete={(key) => { setApiKey(key); setShowWizard(false); }}
        onClose={() => { if (hasKey) setShowWizard(false); }}
      />
      <div className="h-full w-full flex bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Transcription AI</span>
            {!hasKey && (
              <button onClick={() => setShowWizard(true)} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "none", cursor: "pointer" }}>
                Configurar HF Token
              </button>
            )}
            <div className="flex-1" />
            <span className="flex items-center gap-1.5 text-[8px]">
              <span className={`w-1.5 h-1.5 rounded-full ${status === "Idle" ? "bg-white/20" : status === "Processing" ? "bg-amber-400 animate-pulse" : status === "Error" ? "bg-red-400" : "bg-emerald-500"}`} />
              {status}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <input ref={fileRef} type="file" accept="audio/*,video/*" onChange={handleFile} className="hidden" />

            <div onClick={() => fileRef.current?.click()}
              className="p-8 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
            >
              <div className="text-3xl mb-2">🎤</div>
              <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Clique para enviar áudio ou vídeo</p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>MP3, WAV, MP4, WebM</p>
            </div>

            {progress > 0 && progress < 100 && (
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
              </div>
            )}

            {displayText && (
              <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 mb-2">
                  {result?.language && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>{result.language}</span>}
                  <div className="flex-1" />
                  <button onClick={handleCopy} className="text-[9px] px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "none", cursor: "pointer" }}>Copiar</button>
                  <button onClick={handleExport} className="text-[9px] px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "none", cursor: "pointer" }}>Exportar</button>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.7)" }}>{displayText}</p>
              </div>
            )}
          </div>
        </div>

        {history.length > 0 && (
          <div className="w-56 flex-shrink-0 border-l border-white/[0.06] overflow-y-auto p-3 hidden md:block">
            <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>Histórico</p>
            {history.map((h) => (
              <div key={h.id} onClick={() => setSelectedHistory(h)}
                className="p-2 rounded-lg mb-1 cursor-pointer transition-all text-[10px]"
                style={{
                  background: selectedHistory?.id === h.id ? "rgba(99,102,241,0.08)" : "transparent",
                  border: `1px solid ${selectedHistory?.id === h.id ? "rgba(99,102,241,0.15)" : "transparent"}`,
                  color: selectedHistory?.id === h.id ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                }}
              >
                <p className="truncate">{h.text?.slice(0, 40)}...</p>
                <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>{h.date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
