import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SVG = ({ d, sz = 14 }) => <svg style={{ width: sz, height: sz, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;
const I = {
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  upload: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
};

const MOCKUP_TYPES = [
  { id: "tshirt", label: "T-Shirt", emoji: "👕", colors: ["#ffffff", "#1a1a1a", "#ef4444", "#3b82f6"] },
  { id: "mug", label: "Mug", emoji: "☕", colors: ["#ffffff", "#1a1a1a", "#f59e0b", "#22c55e"] },
  { id: "phonecase", label: "Phone Case", emoji: "📱", colors: ["#1a1a1a", "#ffffff", "#6366f1", "#ec4899"] },
  { id: "laptop", label: "Laptop", emoji: "💻", colors: ["#1a1a1a", "#c0c0c0", "#3b82f6", "#a855f7"] },
  { id: "billboard", label: "Billboard", emoji: "🪧", colors: ["#ffffff", "#1a1a1a", "#ef4444", "#14b8a6"] },
  { id: "businesscard", label: "Business Card", emoji: "💳", colors: ["#ffffff", "#1a1a1a", "#f97316", "#6366f1"] },
];

function MockPreview({ type, bgColor, design }) {
  const base = "flex items-center justify-center rounded-xl border relative overflow-hidden";
  const isDark = bgColor === "#1a1a1a";
  switch (type) {
    case "tshirt":
      return <div className={`${base} w-64 h-72`} style={{ background: bgColor, borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-4 rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          {design ? <div className="w-20 h-20 rounded-lg" style={{ background: design }} /> : <span className="text-[10px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>Design</span>}
        </div>
        <span className="absolute bottom-3 text-[18px] opacity-20">👕</span>
      </div>;
    case "mug":
      return <div className={`${base} w-32 h-40 rounded-[18px]`} style={{ background: bgColor, borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-3 rounded-lg border-2 border-dashed flex items-center justify-center" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          {design ? <div className="w-12 h-12 rounded" style={{ background: design }} /> : <span className="text-[8px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>Art</span>}
        </div>
      </div>;
    case "phonecase":
      return <div className={`${base} w-28 h-52 rounded-2xl`} style={{ background: bgColor, borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="absolute top-2 w-12 h-1.5 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />
        <div className="absolute inset-6 rounded-lg border-2 border-dashed flex items-center justify-center mt-3" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          {design ? <div className="w-10 h-16 rounded" style={{ background: design }} /> : <span className="text-[7px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>Art</span>}
        </div>
      </div>;
    case "laptop":
      return <div className={`${base} w-64 h-44 rounded-lg`} style={{ background: bgColor, borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-3 rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          {design ? <div className="w-24 h-16 rounded" style={{ background: design }} /> : <span className="text-[9px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>Screen</span>}
        </div>
      </div>;
    case "billboard":
      return <div className={`${base} w-72 h-36 rounded-sm`} style={{ background: bgColor, borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-3 rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          {design ? <div className="w-40 h-16 rounded" style={{ background: design }} /> : <span className="text-[9px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>Billboard</span>}
        </div>
      </div>;
    case "businesscard":
      return <div className={`${base} w-48 h-28 rounded-sm`} style={{ background: bgColor, borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-3 rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          {design ? <div className="w-20 h-12 rounded" style={{ background: design }} /> : <span className="text-[8px]" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" }}>Card</span>}
        </div>
      </div>;
    default:
      return null;
  }
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

export default function MockupStudio() {
  const [selectedType, setSelectedType] = useState(MOCKUP_TYPES[0]);
  const [designColor, setDesignColor] = useState("#6366f1");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [uploaded, setUploaded] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [mockups, setMockups] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const m = { id: Date.now(), type: selectedType.id, design: designColor, bg: bgColor, uploaded };
      setMockups((prev) => [m, ...prev]);
      showToast("Mockup generated!");
    }, 1800);
  }, [selectedType, designColor, bgColor, uploaded, showToast]);

  const handleUpload = useCallback(() => {
    setUploaded(designColor);
    showToast("Design uploaded (simulated)");
  }, [designColor, showToast]);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">
      <div className="h-10 flex-shrink-0 flex items-center px-3 gap-2 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <span className="text-[10px] font-bold">M</span>
        </div>
        <span className="text-[11px] font-bold tracking-tight text-white/40">Mockup Studio</span>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {MOCKUP_TYPES.map((t) => (
              <motion.button key={t.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedType(t); setBgColor(t.colors[0]); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
                style={{
                  borderColor: selectedType.id === t.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
                  background: selectedType.id === t.id ? "rgba(255,255,255,0.04)" : "transparent",
                }}
              >
                <span className="text-xl">{t.emoji}</span>
                <span className="text-[10px] text-white/50">{t.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="flex items-center justify-center p-6 rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0e0e0e" }}>
            <MockPreview type={selectedType.id} bgColor={bgColor} design={uploaded} />
          </div>

          <button onClick={handleUpload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.6)" }}
          >
            <SVG d={I.upload} sz={13} />
            Upload Design
          </button>

          {mockups.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-2">Generated Mockups</span>
              <div className="grid grid-cols-3 gap-2">
                {mockups.map((m) => (
                  <div key={m.id} className="rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="h-16 flex items-center justify-center" style={{ background: m.bg }}>
                      <div className="w-8 h-8 rounded" style={{ background: m.design }} />
                    </div>
                    <div className="px-2 py-1.5 text-[9px] text-white/30 capitalize">{m.type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-[240px] flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Mockup Type</label>
            <div className="text-xs text-white/60 capitalize px-2 py-1.5 rounded-lg bg-white/5 border border-white/[0.06]">{selectedType.label}</div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Canvas Color</label>
            <div className="flex gap-2 flex-wrap">
              {selectedType.colors.map((c) => (
                <button key={c} onClick={() => setBgColor(c)}
                  className="w-7 h-7 rounded-lg border transition-all"
                  style={{
                    background: c,
                    borderColor: bgColor === c ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.06)",
                    transform: bgColor === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-1.5">Design Color</label>
            <input type="color" value={designColor} onChange={(e) => setDesignColor(e.target.value)}
              className="w-full h-8 rounded-lg border-0 cursor-pointer bg-transparent"
            />
          </div>

          <div className="pt-2">
            <button onClick={handleGenerate} disabled={generating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-medium transition-all"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                background: generating ? "rgba(255,255,255,0.05)" : "rgba(34,197,94,0.15)",
                color: generating ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
              }}
            >
              {generating ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
              ) : "Generate Mockup"}
            </button>
          </div>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
