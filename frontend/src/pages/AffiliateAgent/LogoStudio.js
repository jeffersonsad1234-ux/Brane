import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const UID = () => Math.random().toString(36).slice(2, 9);

const SVG = ({ d, sz = 14 }) => <svg style={{ width: sz, height: sz, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;

const I = {
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  rocket: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  diamond: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  bolt: "M7 2v11h3v9l7-12h-4l4-8z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
};

const LOGO_TEMPLATES = [
  { id: 1, name: "Nova", bg: "linear-gradient(135deg, #6366f1, #8b5cf6)", style: "Modern", icon: "🚀" },
  { id: 2, name: "Aura", bg: "linear-gradient(135deg, #f59e0b, #ef4444)", style: "Serif", icon: "✨" },
  { id: 3, name: "Vertex", bg: "linear-gradient(135deg, #22c55e, #14b8a6)", style: "Bold", icon: "◆" },
  { id: 4, name: "Lumina", bg: "linear-gradient(135deg, #3b82f6, #6366f1)", style: "Script", icon: "★" },
  { id: 5, name: "Pulse", bg: "linear-gradient(135deg, #ec4899, #a855f7)", style: "Modern", icon: "⚡" },
  { id: 6, name: "Drift", bg: "linear-gradient(135deg, #14b8a6, #06b6d4)", style: "Serif", icon: "🌊" },
  { id: 7, name: "Forge", bg: "linear-gradient(135deg, #f97316, #e11d48)", style: "Bold", icon: "🔥" },
  { id: 8, name: "Prism", bg: "linear-gradient(135deg, #a855f7, #ec4899)", style: "Script", icon: "💎" },
];

const FONT_STYLES = ["Modern", "Serif", "Script", "Bold"];
const COLOR_SWATCHES = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#3b82f6", "#a855f7"];
const ICONS = ["🚀", "⭐", "💎", "❤️", "🌍", "⚡"];

const fontMap = { Modern: "font-sans", Serif: "font-serif", Script: "italic font-serif", Bold: "font-bold tracking-tight" };

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

export default function LogoStudio() {
  const [selected, setSelected] = useState(LOGO_TEMPLATES[0]);
  const [brandName, setBrandName] = useState("Brand");
  const [fontStyle, setFontStyle] = useState("Modern");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("🚀");
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const handleExport = useCallback(() => {
    showToast("Logo exported successfully — BRANPY format");
  }, [showToast]);

  const handleGenerateAI = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      showToast("AI logo generated!");
    }, 1800);
  }, [showToast]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">
      <div className="h-10 flex-shrink-0 flex items-center px-3 gap-2 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-[10px] font-bold">L</span>
        </div>
        <span className="text-[11px] font-bold tracking-tight text-white/40">Logo Studio</span>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {LOGO_TEMPLATES.map((t) => (
              <motion.button key={t.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(t)}
                className="relative rounded-xl border overflow-hidden aspect-square flex flex-col items-center justify-center gap-1 transition-all"
                style={{
                  background: t.bg,
                  borderColor: selected.id === t.id ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)",
                  boxShadow: selected.id === t.id ? "0 0 20px rgba(255,255,255,0.08)" : "none",
                }}
              >
                <span className="text-2xl">{t.icon}</span>
                <span className="text-xs font-semibold text-white/80">{t.name}</span>
                <span className="text-[9px] text-white/40">{t.style}</span>
                {selected.id === t.id && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                    <SVG d={I.check} sz={10} style={{ color: "#fff" }} />
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0e0e0e" }}>
            <div className="flex items-center justify-center p-8" style={{ background: `${color}15` }}>
              <motion.div key={selected.id + brandName + fontStyle + icon + color}
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-48 h-48 rounded-2xl flex flex-col items-center justify-center gap-2 border shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)`, borderColor: "rgba(255,255,255,0.1)" }}
              >
                <span className="text-4xl">{icon}</span>
                <span className={`text-xl text-white font-semibold ${fontMap[fontStyle]}`}>{brandName}</span>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="w-[260px] flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Brand Name</label>
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/70 outline-none focus:border-white/15 placeholder:text-white/15"
              placeholder="Enter brand name"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Font Style</label>
            <select value={fontStyle} onChange={(e) => setFontStyle(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/70 outline-none focus:border-white/15 appearance-none cursor-pointer"
            >
              {FONT_STYLES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_SWATCHES.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg border transition-all"
                  style={{
                    background: c,
                    borderColor: color === c ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.06)",
                    transform: color === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map((ic) => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center text-base transition-all"
                  style={{
                    borderColor: icon === ic ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)",
                    background: icon === ic ? "rgba(255,255,255,0.08)" : "transparent",
                  }}
                >{ic}</button>
              ))}
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button onClick={handleGenerateAI} disabled={generating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: generating ? "rgba(255,255,255,0.05)" : "rgba(99,102,241,0.15)", color: generating ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)" }}
            >
              {generating ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
              ) : "Generate AI"}
            </button>

            <button onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "rgba(34,197,94,0.15)", color: "rgba(255,255,255,0.7)" }}
            >
              <SVG d={I.close} sz={12} style={{ transform: "rotate(90deg)" }} />
              Export
            </button>
          </div>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
