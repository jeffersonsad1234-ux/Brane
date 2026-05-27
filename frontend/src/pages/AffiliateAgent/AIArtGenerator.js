import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import SetupWizard from "../../core/ai/components/SetupWizard";
import { useApiKey } from "../../core/ai/hooks/useApiKey";
import { generateImage } from "../../core/ai/services/aiToolsService";

const UID = () => Math.random().toString(36).slice(2, 9);

const STYLES = ["Realistic", "Anime", "Oil Painting", "Sketch", "3D Render", "Watercolor", "Pixel Art", "Cinematic"];
const ASPECTS = [
  { label: "1:1", w: 1024, h: 1024 },
  { label: "16:9", w: 1024, h: 576 },
  { label: "9:16", w: 576, h: 1024 },
  { label: "4:3", w: 1024, h: 768 },
  { label: "3:4", w: 768, h: 1024 },
];

const STYLE_PROMPTS = {
  Realistic: "photorealistic, highly detailed, 8K, natural lighting",
  Anime: "anime style, cel shading, vibrant colors, Japanese animation",
  "Oil Painting": "oil painting texture, impasto strokes, rich colors, canvas texture",
  Sketch: "pencil sketch, black and white, rough lines, hand-drawn",
  "3D Render": "3D render, octane render, cinematic lighting, detailed textures",
  Watercolor: "watercolor painting, soft colors, paper texture, flowing pigments",
  "Pixel Art": "pixel art, 8-bit style, retro game, blocky pixels",
  Cinematic: "cinematic shot, film grain, dramatic lighting, movie scene",
};

export default function AIArtGenerator() {
  const { apiKey: hfToken, hasKey, setApiKey } = useApiKey("huggingface");
  const [showWizard, setShowWizard] = useState(!hasKey);
  const [gallery, setGallery] = useLocalStorage("branpy_aiart_gallery", []);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Realistic");
  const [aspect, setAspect] = useState("1:1");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setProgress("Enviando para IA...");

    const selectedAspect = ASPECTS.find((a) => a.label === aspect) || ASPECTS[0];
    const styleBoost = STYLE_PROMPTS[style] || "";
    const fullPrompt = `${prompt.trim()}, ${styleBoost}`;

    try {
      setProgress("Gerando imagem...");
      const imageData = await generateImage(fullPrompt, hfToken, {
        width: selectedAspect.w,
        height: selectedAspect.h,
      });

      const art = {
        id: UID(),
        prompt: prompt.trim(),
        style,
        aspect,
        imageData,
        createdAt: new Date().toISOString(),
      };

      setGallery((prev) => [art, ...prev]);
      showToast("Imagem gerada!");
    } catch (err) {
      showToast(err.message || "Erro ao gerar imagem.");
    }
    setGenerating(false);
    setProgress("");
  }, [prompt, style, aspect, generating, hfToken, setGallery, showToast]);

  return (
    <>
      <SetupWizard
        service="huggingface"
        open={showWizard}
        onComplete={(key) => { setApiKey(key); setShowWizard(false); }}
        onClose={() => { if (hasKey) setShowWizard(false); }}
      />
      <div className="h-full w-full flex bg-[#0a0a0a] select-none overflow-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-10 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.25)" }}>
              AI Art Generator
            </span>
            {!hasKey && (
              <button onClick={() => setShowWizard(true)} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "none", cursor: "pointer" }}>
                Configurar HF Token
              </button>
            )}
            <div className="flex-1" />
            <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>{gallery.length} imagens</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {gallery.length === 0 && !generating && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center" style={{ color: "rgba(255,255,255,0.15)" }}>
                  <div className="text-4xl mb-3">🎨</div>
                  <p className="text-sm">Digite um prompt e gere sua primeira imagem</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {generating && (
                <div className="aspect-square rounded-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.05)" }}>
                    <div className="text-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-8 h-8 rounded-full mx-auto mb-2" style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{progress}</span>
                    </div>
                  </div>
                </div>
              )}
              {gallery.map((art) => (
                <motion.div key={art.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="group relative aspect-square rounded-xl overflow-hidden border cursor-pointer" style={{ borderColor: "rgba(255,255,255,0.06)" }}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = art.imageData; a.download = `branpy-${art.id}.png`; a.click();
                  }}
                >
                  {art.imageData ? (
                    <img src={art.imageData} alt={art.prompt} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                      <span className="text-white/60 text-[10px] text-center px-2">{art.prompt}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-[9px] text-white/80 truncate w-full">{art.prompt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 p-4 border-t border-white/[0.06]">
            <div className="flex gap-2 mb-2 flex-wrap">
              {STYLES.map((s) => (
                <button key={s} onClick={() => setStyle(s)}
                  className="text-[10px] px-2.5 py-1 rounded-full transition-all"
                  style={{
                    border: `1px solid ${style === s ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.06)"}`,
                    background: style === s ? "rgba(99,102,241,0.12)" : "transparent",
                    color: style === s ? "#6366f1" : "rgba(255,255,255,0.35)",
                  }}
                >{s}</button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap mb-2">
              {ASPECTS.map((a) => (
                <button key={a.label} onClick={() => setAspect(a.label)}
                  className="text-[9px] px-2 py-0.5 rounded transition-all"
                  style={{
                    border: `1px solid ${aspect === a.label ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)"}`,
                    background: aspect === a.label ? "rgba(99,102,241,0.08)" : "transparent",
                    color: aspect === a.label ? "#6366f1" : "rgba(255,255,255,0.25)",
                  }}
                >{a.label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder={hasKey ? "Descreva a imagem que deseja gerar..." : "Configure o token HF primeiro..."}
                disabled={generating}
                className="flex-1 bg-transparent text-sm outline-none px-3 py-2 rounded-xl"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.7)",
                }}
              />
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleGenerate} disabled={!prompt.trim() || generating || !hasKey}
                className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: prompt.trim() && !generating && hasKey ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)",
                  color: prompt.trim() && !generating && hasKey ? "white" : "rgba(255,255,255,0.2)",
                  border: "none", cursor: prompt.trim() && !generating && hasKey ? "pointer" : "not-allowed",
                }}
              >
                {generating ? "Gerando..." : "Gerar"}
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
