import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const UID = () => Math.random().toString(36).slice(2, 9);

const SVG = ({ d, sz = 14 }) => <svg style={{ width: sz, height: sz, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;

const I = {
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  bolt: "M7 2v11h3v9l7-12h-4l4-8z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
};

const STYLES = ["Realistic", "Anime", "Oil Painting", "Sketch", "3D Render", "Watercolor"];
const ASPECT_RATIOS = [
  { label: "1:1", w: 1, h: 1 },
  { label: "16:9", w: 16, h: 9 },
  { label: "9:16", w: 9, h: 16 },
  { label: "4:3", w: 4, h: 3 },
];

const GRADIENT_PALETTES = [
  ["#6366f1", "#8b5cf6"], ["#22c55e", "#14b8a6"], ["#f59e0b", "#ef4444"],
  ["#ec4899", "#a855f7"], ["#3b82f6", "#6366f1"], ["#14b8a6", "#06b6d4"],
  ["#f97316", "#e11d48"], ["#a855f7", "#ec4899"],
];

const MOCK_ARTWORKS = [
  { id: UID(), prompt: "Sunset over mountains", style: "Realistic", aspect: "16:9", palette: GRADIENT_PALETTES[0] },
  { id: UID(), prompt: "Cyberpunk city", style: "Anime", aspect: "1:1", palette: GRADIENT_PALETTES[3] },
  { id: UID(), prompt: "Abstract fluid art", style: "Watercolor", aspect: "4:3", palette: GRADIENT_PALETTES[5] },
  { id: UID(), prompt: "Dragon in forest", style: "Oil Painting", aspect: "16:9", palette: GRADIENT_PALETTES[2] },
];

function LoadingPulse() {
  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="w-full h-full animate-pulse" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0), rgba(99,102,241,0.1), rgba(34,197,94,0), rgba(34,197,94,0.1))", backgroundSize: "400% 400%", animation: "pulse 1.5s ease-in-out infinite" }} />
    </div>
  );
}

function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl border shadow-2xl flex items-center gap-2.5"
          style={{ background: "#141414", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <SVG d={I.check} sz={14} style={{ color: "rgba(34,197,94,0.8)" }} />
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AIArtGenerator() {
  const [gallery, setGallery] = useLocalStorage("branpy_aiart_gallery", MOCK_ARTWORKS);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Realistic");
  const [aspect, setAspect] = useState("1:1");
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const art = {
        id: UID(),
        prompt: prompt.trim(),
        style,
        aspect,
        palette: GRADIENT_PALETTES[Math.floor(Math.random() * GRADIENT_PALETTES.length)],
        createdAt: new Date().toISOString(),
      };
      setGallery((prev) => [art, ...prev]);
      setPrompt("");
      showToast("Artwork generated!");
    }, 2000);
  }, [prompt, style, aspect, setGallery, showToast]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">
      <div className="h-10 flex-shrink-0 flex items-center px-3 gap-2 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <span className="text-[8px] font-bold">AI</span>
        </div>
        <span className="text-[11px] font-bold tracking-tight text-white/40">AI Art Generator</span>
        <div className="flex-1" />
        <span className="text-[9px] text-white/10">{gallery.length} artworks</span>
      </div>

      <div className="flex-shrink-0 p-4 border-b border-white/[0.06] bg-[#0c0c0c] space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
              placeholder="Describe your artwork..."
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/70 outline-none focus:border-white/15 resize-none placeholder:text-white/15"
            />
          </div>
          <button onClick={handleGenerate} disabled={generating || !prompt.trim()}
            className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-medium transition-all self-end"
            style={{
              background: generating ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.15)",
              color: generating || !prompt.trim() ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {generating ? (
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
            ) : (
              <>
                <SVG d={I.bolt} sz={13} />
                Generate
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/20">Style:</span>
            <select value={style} onChange={(e) => setStyle(e.target.value)}
              className="bg-white/5 border border-white/[0.06] rounded-lg px-2 py-1 text-[10px] text-white/50 outline-none focus:border-white/15 appearance-none cursor-pointer"
            >
              {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-white/20">Ratio:</span>
            {ASPECT_RATIOS.map((r) => (
              <button key={r.label} onClick={() => setAspect(r.label)}
                className="px-2 py-1 rounded-lg text-[9px] font-medium border transition-all"
                style={{
                  borderColor: aspect === r.label ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
                  background: aspect === r.label ? "rgba(255,255,255,0.06)" : "transparent",
                  color: aspect === r.label ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                }}
              >{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      {generating && (
        <div className="flex-shrink-0 p-4">
          <div className="w-48">
            <LoadingPulse />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {gallery.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl mb-2 opacity-10">🎨</div>
              <div className="text-[10px] text-white/10">No artworks yet. Generate something!</div>
            </div>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-4 gap-3">
            {gallery.map((art) => (
              <motion.div key={art.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border overflow-hidden group cursor-pointer"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="aspect-square flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, ${art.palette[0]}, ${art.palette[1]})` }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-[9px] text-white/70 px-2 text-center transition-opacity">{art.style}</span>
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[9px] text-white/50 truncate">{art.prompt}</div>
                  <div className="text-[8px] text-white/15 mt-0.5">{art.style} · {art.aspect}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
