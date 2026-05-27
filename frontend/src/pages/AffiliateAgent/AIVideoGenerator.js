import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import SetupWizard from "../../core/ai/components/SetupWizard";
import { useApiKey } from "../../core/ai/hooks/useApiKey";
import { generateVideo } from "../../core/ai/services/aiToolsService";

export default function AIVideoGenerator() {
  const { apiKey: hfToken, hasKey, setApiKey } = useApiKey("huggingface");
  const [showWizard, setShowWizard] = useState(!hasKey);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useLocalStorage("branpy-video-history", []);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setProgress("Preparando geração de vídeo...");
    setVideoData(null);
    setError(null);

    try {
      setProgress("Enviando para HuggingFace...");
      const data = await generateVideo(prompt.trim(), hfToken, { duration });
      setProgress("Vídeo gerado!");
      setVideoData(data);
      setHistory((prev) => [{ id: `vid_${Date.now()}`, prompt: prompt.trim(), video: data, date: new Date().toISOString().slice(0, 10) }, ...prev]);
      showToast("Vídeo gerado!");
    } catch (err) {
      setError(err.message || "Erro ao gerar vídeo.");
      showToast(`Erro: ${err.message}`);
    }
    setGenerating(false);
    setProgress("");
  };

  const handleDownload = () => {
    if (!videoData) return;
    const a = document.createElement("a");
    a.href = videoData; a.download = `branpy-video-${Date.now()}.mp4`; a.click();
  };

  return (
    <>
      <SetupWizard service="huggingface" open={showWizard}
        onComplete={(key) => { setApiKey(key); setShowWizard(false); }}
        onClose={() => { if (hasKey) setShowWizard(false); }}
      />
      <div className="h-full w-full flex bg-[#0a0a0a] text-white/50 select-none overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-10 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.25)" }}>
              AI Video Generator
            </span>
            {!hasKey && (
              <button onClick={() => setShowWizard(true)} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "none", cursor: "pointer" }}>
                Configurar HF Token
              </button>
            )}
            <div className="flex-1" />
            <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>{history.length} vídeos</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!videoData && !error && history.length === 0 && !generating && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center" style={{ color: "rgba(255,255,255,0.15)" }}>
                  <div className="text-4xl mb-3">🎬</div>
                  <p className="text-sm">Digite um prompt e gere seu primeiro vídeo</p>
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
                  <button onClick={() => setError(null)} className="text-[9px] px-2 py-1 rounded" style={{ background: "rgba(239,68,68,0.1)", color: "rgba(239,68,68,0.6)", border: "none", cursor: "pointer" }}>
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}

            {generating && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative mb-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 rounded-full" style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs">🎬</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{progress}</p>
                <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>Isso pode levar 30-90 segundos</p>
                <div className="w-48 h-1 mt-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div className="h-full rounded-full" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ width: "50%", background: "linear-gradient(90deg, transparent, #6366f1, transparent)" }} />
                </div>
              </div>
            )}

            {videoData && !generating && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <div className="relative rounded-xl overflow-hidden border mb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <video controls src={videoData} className="w-full max-h-96 object-contain" style={{ background: "#000" }} />
                </div>
                <button onClick={handleDownload} className="text-[10px] px-3 py-1.5 rounded-lg" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", cursor: "pointer" }}>
                  Download MP4
                </button>
              </motion.div>
            )}

            {history.length > 0 && (
              <div className="mt-6">
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>Vídeos anteriores</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {history.map((h) => (
                    <div key={h.id} onClick={() => setVideoData(h.video)}
                      className="p-2 rounded-lg cursor-pointer transition-all text-[10px]"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <p className="truncate">{h.prompt}</p>
                      <p className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>{h.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 p-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>Duração: {duration}s</span>
              <input type="range" min="2" max="5" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 h-1 rounded-full accent-[#6366f1]" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div className="flex gap-2">
              <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                disabled={generating}
                placeholder={hasKey ? "Descreva o vídeo que deseja gerar..." : "Configure o token HF primeiro..."}
                className="flex-1 bg-transparent text-sm outline-none px-3 py-2 rounded-xl"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
              />
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleGenerate} disabled={!prompt.trim() || generating || !hasKey}
                className="px-4 py-2 rounded-xl text-xs font-medium"
                style={{
                  background: prompt.trim() && !generating && hasKey ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)",
                  color: prompt.trim() && !generating && hasKey ? "white" : "rgba(255,255,255,0.2)",
                  border: "none", cursor: prompt.trim() && !generating && hasKey ? "pointer" : "not-allowed",
                }}
              >
                {generating ? "Gerando..." : "Gerar Vídeo"}
              </motion.button>
            </div>
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
