import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const UID = () => Math.random().toString(36).slice(2, 9);

const SVG = ({ d, sz = 14 }) => <svg style={{ width: sz, height: sz, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;

const I = {
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  export: "M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z",
};

const THUMBNAIL_TEMPLATES = [
  { id: 1, name: "Split", layout: "split", colors: ["#6366f1", "#22c55e"] },
  { id: 2, name: " Spotlight", layout: "spotlight", colors: ["#ef4444", "#f59e0b"] },
  { id: 3, name: "Minimal", layout: "minimal", colors: ["#1a1a1a", "#3b82f6"] },
  { id: 4, name: "Bold", layout: "bold", colors: ["#ec4899", "#a855f7"] },
  { id: 5, name: "Gradient", layout: "gradient", colors: ["#14b8a6", "#06b6d4"] },
  { id: 6, name: "Dark", layout: "dark", colors: ["#0a0a0a", "#f97316"] },
];

const COLOR_SWATCHES = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#ec4899", "#14b8a6", "#3b82f6", "#a855f7"];
const EMOJIS = ["🔥", "💎", "🚀", "⭐", "💯", "🎯", "⚡", "🏆"];

function ThumbnailPreview({ template, title, subtitle, bgColor, emoji, elements }) {
  const isDark = bgColor === "#0a0a0a" || bgColor === "#1a1a1a";
  const textColor = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)";

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-2xl flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${bgColor}, ${template.colors[1]})`, borderColor: "rgba(255,255,255,0.06)" }}
    >
      {template.layout === "split" && (
        <div className="absolute inset-0 flex">
          <div className="flex-1 flex items-center justify-center p-4"><span className="text-4xl">{emoji}</span></div>
          <div className="flex-1 flex flex-col items-start justify-center p-4">
            <span className="text-lg font-bold leading-tight" style={{ color: textColor }}>{title}</span>
            {subtitle && <span className="text-xs mt-1" style={{ color: `${textColor}99` }}>{subtitle}</span>}
          </div>
        </div>
      )}
      {template.layout === "spotlight" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-5xl">{emoji}</span>
          <span className="text-2xl font-bold" style={{ color: textColor }}>{title}</span>
          {subtitle && <span className="text-sm" style={{ color: `${textColor}99` }}>{subtitle}</span>}
        </div>
      )}
      {template.layout === "minimal" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-4 right-4 text-3xl">{emoji}</div>
          <span className="text-2xl font-bold text-center px-8" style={{ color: textColor }}>{title}</span>
        </div>
      )}
      {template.layout === "bold" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-black uppercase tracking-tight" style={{ color: `${textColor}15` }}>{title}</span>
          <span className="absolute text-4xl">{emoji}</span>
        </div>
      )}
      {template.layout === "gradient" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: textColor }}>{title}</span>
          {subtitle && <span className="text-sm mt-1" style={{ color: `${textColor}99` }}>{subtitle}</span>}
          <span className="absolute bottom-4 right-4 text-3xl">{emoji}</span>
        </div>
      )}
      {template.layout === "dark" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-3 left-3 text-2xl">{emoji}</div>
          <span className="text-3xl font-bold text-center px-12" style={{ color: textColor }}>{title}</span>
        </div>
      )}
      {elements.map((el) => (
        <div key={el.id} className="absolute w-6 h-6 rounded-full opacity-40"
          style={{ background: el.color, top: el.y, left: el.x }}
        />
      ))}
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

export default function ThumbnailStudio() {
  const [thumbnails, setThumbnails] = useLocalStorage("branpy_thumbnails", []);
  const [selectedTemplate, setSelectedTemplate] = useState(THUMBNAIL_TEMPLATES[0]);
  const [title, setTitle] = useState("Amazing Video");
  const [subtitle, setSubtitle] = useState("Watch now!");
  const [bgColor, setBgColor] = useState("#6366f1");
  const [emoji, setEmoji] = useState("🔥");
  const [elements, setElements] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const addElement = useCallback(() => {
    setElements((prev) => [...prev, { id: UID(), color: COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)], x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 }]);
    showToast("Element added");
  }, [showToast]);

  const handleExport = useCallback(() => {
    const snap = { id: Date.now(), template: selectedTemplate.id, title, subtitle, bgColor, emoji, elements, createdAt: new Date().toISOString() };
    setThumbnails((prev) => [snap, ...prev].slice(0, 50));
    showToast("Thumbnail saved!");
  }, [selectedTemplate, title, subtitle, bgColor, emoji, elements, setThumbnails, showToast]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">
      <div className="h-10 flex-shrink-0 flex items-center px-3 gap-2 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
          <span className="text-[10px] font-bold">T</span>
        </div>
        <span className="text-[11px] font-bold tracking-tight text-white/40">Thumbnail Studio</span>
        <div className="flex-1" />
        <span className="text-[9px] text-white/10">{thumbnails.length} saved</span>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[200px] flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-2">Templates</span>
          <div className="grid grid-cols-2 gap-2">
            {THUMBNAIL_TEMPLATES.map((t) => (
              <motion.button key={t.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedTemplate(t)}
                className="aspect-video rounded-lg border overflow-hidden relative transition-all"
                style={{
                  background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`,
                  borderColor: selectedTemplate.id === t.id ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)",
                  boxShadow: selectedTemplate.id === t.id ? "0 0 12px rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-semibold text-white/70">{t.name}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
          <ThumbnailPreview template={selectedTemplate} title={title} subtitle={subtitle} bgColor={bgColor} emoji={emoji} elements={elements} />

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {thumbnails.slice(0, 6).map((t) => (
              <div key={t.id} className="w-20 aspect-video rounded-lg border overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${t.bgColor}, #000)`, borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center justify-center h-full text-[6px] text-white/30 px-1 text-center">{t.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[240px] flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Subtitle</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/70 outline-none focus:border-white/15"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Background</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_SWATCHES.map((c) => (
                <button key={c} onClick={() => setBgColor(c)}
                  className="w-6 h-6 rounded-lg border transition-all"
                  style={{ background: c, borderColor: bgColor === c ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.06)", transform: bgColor === c ? "scale(1.2)" : "scale(1)" }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Emoji Overlay</label>
            <div className="flex gap-1.5 flex-wrap">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm transition-all"
                  style={{ borderColor: emoji === e ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.06)", background: emoji === e ? "rgba(255,255,255,0.08)" : "transparent" }}
                >{e}</button>
              ))}
            </div>
          </div>
          <button onClick={addElement}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[10px] font-medium transition-all"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.6)" }}
          >
            <SVG d={I.add} sz={12} />
            Add Element
          </button>
          <button onClick={handleExport}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-medium transition-all"
            style={{ background: "rgba(34,197,94,0.15)", color: "rgba(255,255,255,0.7)" }}
          >
            <SVG d={I.export} sz={12} />
            Export
          </button>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
