import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const UID = () => Math.random().toString(36).slice(2, 9);

const SVG = ({ d, sz = 14 }) => <svg style={{ width: sz, height: sz, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;
const I = {
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
};

const TEMPLATES = [
  { id: "social", label: "Social Media", w: 1080, h: 1080, desc: "Square post" },
  { id: "youtube", label: "YouTube Thumbnail", w: 1280, h: 720, desc: "16:9 thumb" },
  { id: "web", label: "Web Banner", w: 728, h: 90, desc: "Leaderboard" },
  { id: "email", label: "Email Header", w: 600, h: 200, desc: "Email banner" },
  { id: "story", label: "Story", w: 1080, h: 1920, desc: "Vertical story" },
  { id: "twitter", label: "Twitter Header", w: 1500, h: 500, desc: "Profile banner" },
  { id: "linkedin", label: "LinkedIn Banner", w: 1584, h: 396, desc: "LinkedIn cover" },
  { id: "fbad", label: "Facebook Ad", w: 1200, h: 628, desc: "Ad creative" },
];

const BG_PRESETS = ["#0a0a0a", "#1a1a1a", "#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#ec4899", "#3b82f6"];

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

export default function BannerStudio() {
  const [activeTab, setActiveTab] = useState(TEMPLATES[0]);
  const [width, setWidth] = useState(activeTab.w);
  const [height, setHeight] = useState(activeTab.h);
  const [bgColor, setBgColor] = useState("#0a0a0a");
  const [textContent, setTextContent] = useState("Your Banner Text Here");
  const [fontSize, setFontSize] = useState(32);
  const [textLayers, setTextLayers] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const selectTemplate = useCallback((t) => {
    setActiveTab(t);
    setWidth(t.w);
    setHeight(t.h);
  }, []);

  const addTextLayer = useCallback(() => {
    setTextLayers((prev) => [...prev, { id: UID(), text: `Layer ${prev.length + 1}`, fontSize: 20, color: "#ffffff" }]);
    showToast("Text layer added");
  }, [showToast]);

  const handleExport = useCallback(() => {
    showToast("Banner exported successfully!");
  }, [showToast]);

  const scale = Math.min(1, 520 / width, 260 / height);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">
      <div className="h-10 flex-shrink-0 flex items-center px-3 gap-2 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center">
          <span className="text-[10px] font-bold">B</span>
        </div>
        <span className="text-[11px] font-bold tracking-tight text-white/40">Banner Studio</span>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 flex border-b border-white/[0.06] bg-[#0c0c0c] overflow-x-auto">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => selectTemplate(t)}
                className="flex-shrink-0 px-4 py-2.5 text-[10px] font-medium transition-all border-b-2 relative whitespace-nowrap"
                style={{
                  color: activeTab.id === t.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                  borderColor: activeTab.id === t.id ? "rgba(255,255,255,0.3)" : "transparent",
                }}
              >
                {t.label}
                <span className="block text-[8px] text-white/15">{t.desc}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center justify-center p-4 bg-[#060606] overflow-auto">
            <motion.div layout className="relative rounded-lg border overflow-hidden shadow-2xl flex items-center justify-center"
              style={{
                width: width * scale, height: height * scale, background: bgColor,
                borderColor: "rgba(255,255,255,0.06)",
                transformOrigin: "center center",
              }}
            >
              <span className="text-center font-medium leading-tight px-4"
                style={{ fontSize: fontSize * scale, color: "rgba(255,255,255,0.85)", fontFamily: "sans-serif" }}
              >
                {textContent}
              </span>
              {textLayers.map((l) => (
                <div key={l.id} className="absolute px-3 py-1 rounded"
                  style={{
                    fontSize: l.fontSize * scale * 0.6, color: l.color,
                    background: "rgba(0,0,0,0.3)",
                    bottom: 16 + textLayers.indexOf(l) * 30, left: 16,
                  }}
                >
                  {l.text}
                </div>
              ))}
            </motion.div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-t border-white/[0.06] bg-[#0c0c0c]">
            <span className="text-[9px] text-white/15">{width} × {height}</span>
            <div className="flex gap-1.5">
              {BG_PRESETS.slice(0, 6).map((c) => (
                <button key={c} onClick={() => setBgColor(c)}
                  className="w-4 h-4 rounded border transition-all"
                  style={{ background: c, borderColor: bgColor === c ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.06)", transform: bgColor === c ? "scale(1.3)" : "scale(1)" }}
                />
              ))}
            </div>
            <div className="flex-1" />
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
              style={{ background: "rgba(34,197,94,0.15)", color: "rgba(255,255,255,0.7)" }}
            >
              Export
            </button>
          </div>
        </div>

        <div className="w-[240px] flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Width</label>
            <input type="number" value={width} onChange={(e) => setWidth(+e.target.value)}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Height</label>
            <input type="number" value={height} onChange={(e) => setHeight(+e.target.value)}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Background</label>
            <div className="flex gap-1.5 flex-wrap">
              {BG_PRESETS.map((c) => (
                <button key={c} onClick={() => setBgColor(c)}
                  className="w-6 h-6 rounded-lg border transition-all"
                  style={{ background: c, borderColor: bgColor === c ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.06)", transform: bgColor === c ? "scale(1.2)" : "scale(1)" }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Text Content</label>
            <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15 resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Font Size: {fontSize}px</label>
            <input type="range" min={8} max={120} value={fontSize} onChange={(e) => setFontSize(+e.target.value)}
              className="w-full h-[3px] accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer"
            />
          </div>
          <button onClick={addTextLayer}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-medium transition-all"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.6)" }}
          >
            <SVG d={I.add} sz={12} />
            Add Text Layer
          </button>
          {textLayers.length > 0 && (
            <div className="space-y-1">
              {textLayers.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px]" style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)" }}>
                  <span>{l.text}</span>
                  <span style={{ color: l.color }}>●</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
