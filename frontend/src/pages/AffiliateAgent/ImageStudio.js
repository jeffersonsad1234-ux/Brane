import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tools = [
  { id: "select", icon: "⊹", label: "Select" },
  { id: "text", icon: "T", label: "Text" },
  { id: "upload", icon: "↑", label: "Image Upload" },
  { id: "bgremove", icon: "◉", label: "Bg Remove" },
  { id: "crop", icon: "⊞", label: "Crop" },
  { id: "adjust", icon: "◐", label: "Adjustments" },
];

const swatches = [
  "#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3",
  "#54a0ff", "#5f27cd", "#01a3a4", "#f368e0",
  "#ff6348", "#7bed9f", "#70a1ff", "#2ed573",
];

const UID = () => Math.random().toString(36).slice(2, 9);

export default function ImageStudio() {
  const [activeTool, setActiveTool] = useState("select");
  const [layers, setLayers] = useState([
    { id: "bg", name: "Background", visible: true },
    { id: "shape1", name: "Shape Layer 1", visible: true },
    { id: "text1", name: "Text Overlay", visible: true },
    { id: "img1", name: "Imported Image", visible: false },
  ]);
  const [selectedColor, setSelectedColor] = useState("#48dbfb");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const toggleLayer = useCallback((id) => {
    setLayers((prev) => prev.map((l) => l.id === id ? { ...l, visible: !l.visible } : l));
  }, []);

  const addImageLayer = () => {
    const newLayer = { id: UID(), name: `Image ${layers.length}`, visible: true };
    setLayers((prev) => [...prev, newLayer]);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Image Studio</span>
        <div className="flex-1" />
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => {}} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/20 hover:text-white/40 transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" /></svg>
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => {}} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/20 hover:text-white/40 transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8V4l8 8-8 8v-4.2c-5 0-8 2-10 6 1-5 3-9 10-9.8z" /></svg>
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[9px] text-white/30 hover:text-white/50 transition-all">
          Export
        </motion.button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-14 flex-shrink-0 border-r border-white/[0.06] flex flex-col items-center py-2 gap-1 overflow-y-auto">
          {tools.map((t) => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTool(t.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs transition-all ${activeTool === t.id ? "bg-white/[0.1] text-white/60" : "text-white/20 hover:text-white/40 hover:bg-white/[0.03]"}`}
              title={t.label}
            >
              {t.icon}
            </motion.button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center p-4 bg-white/[0.015]">
          <motion.div layout className="relative w-[600px] h-[400px] rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] border border-white/[0.06] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
            <div className="flex flex-col items-center gap-2 text-white/10">
              <svg className="w-12 h-12 opacity-30" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
              <span className="text-[10px]">Canvas Preview</span>
            </div>
          </motion.div>
        </div>

        <div className="w-56 flex-shrink-0 border-l border-white/[0.06] flex flex-col overflow-y-auto">
          <div className="p-3 border-b border-white/[0.06]">
            <div className="text-[9px] text-white/20 uppercase tracking-wider mb-2">Layers</div>
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {layers.map((layer) => (
                  <motion.div key={layer.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <button onClick={() => toggleLayer(layer.id)} className={`w-4 h-4 rounded border flex items-center justify-center text-[8px] transition-all ${layer.visible ? "bg-white/[0.08] border-white/[0.1] text-white/30" : "bg-transparent border-white/[0.06] text-transparent"}`}>
                      {layer.visible && "✓"}
                    </button>
                    <span className="text-[10px] text-white/40 truncate flex-1">{layer.name}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={addImageLayer} className="w-full mt-2 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] text-[9px] text-white/20 hover:text-white/40 transition-all">
              + Upload Image
            </motion.button>
          </div>

          <div className="p-3">
            <div className="text-[9px] text-white/20 uppercase tracking-wider mb-2">Colors</div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg border border-white/[0.1]" style={{ background: selectedColor }} />
              <span className="text-[9px] text-white/30 font-mono">{selectedColor}</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {swatches.map((c) => (
                <motion.button
                  key={c}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setSelectedColor(c)}
                  className={`w-full aspect-square rounded-lg border transition-all ${selectedColor === c ? "border-white/40 scale-110" : "border-white/[0.06] hover:border-white/20"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
