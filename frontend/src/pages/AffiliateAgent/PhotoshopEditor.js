import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const S = ({ d, sz = 14, style }) => (
  <svg style={{ width: sz, height: sz, flexShrink: 0, ...style }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
);

const I = {
  move: "M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0119 12c0 3.87-3.13 7-7 7A6.995 6.995 0 017.58 6.58L6.17 5.17A8.932 8.932 0 0012 21c4.97 0 9-4.03 9-9a8.932 8.932 0 00-3.17-6.83zM10.5 3h-1v1.5h1V3zm4 0h-1v1.5h1V3z",
  crop: "M17 1H7v4h10V1zm2 6H5v12c0 1.1.9 2 2 2h12V7zm-2 12H7V9h10v10z",
  brush: "M16.56 3.44a3.5 3.5 0 00-4.95 0L3.5 11.55V21h9.45l8.11-8.11a3.5 3.5 0 000-4.95l-2.5-2.5zM12.45 19H5.5v-6.95l6.93-6.93 3.53 3.53L12.45 19z",
  eraser: "M16.24 3.56l-4.95 4.95 7.07 7.07 4.95-4.95-7.07-7.07zM3.56 16.24l4.95-4.95 7.07 7.07-4.95 4.95-7.07-7.07z",
  text: "M5 4v3h5.5v12h3V7H19V4z",
  eyedropper: "M19.35 11.72l-7.07 7.07-4.24-4.24 7.07-7.07 4.24 4.24zM3.5 20.5l4.24-4.24 4.24 4.24-4.24 4.24-4.24-4.24z",
  zoom: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
  redo: "M11.5 8c-4.65 0-8.58 3.03-9.97 7.22l2.37.78c1.05-3.19 4.06-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6C16.55 9.01 14.15 8 11.5 8z",
  zoI: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z",
  zoO: "M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
  export: "M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  hist: "M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
};

const COLOR_SWATCHES = [
  "#ffffff", "#cccccc", "#999999", "#666666", "#333333", "#000000",
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#a855f7", "#ec4899", "#e11d48",
];

const TOOLS = [
  { id: "move", icon: I.move, label: "Move" },
  { id: "crop", icon: I.crop, label: "Crop" },
  { id: "brush", icon: I.brush, label: "Brush" },
  { id: "eraser", icon: I.eraser, label: "Eraser" },
  { id: "text", icon: I.text, label: "Text" },
  { id: "eyedropper", icon: I.eyedropper, label: "Eyedropper" },
  { id: "zoom", icon: I.zoom, label: "Zoom" },
];

const LAYERS = [
  { id: "bg", name: "Background", visible: true, thumb: "gradient" },
  { id: "l1", name: "Layer 1", visible: true, thumb: "shapes" },
  { id: "text", name: "Text Layer", visible: true, thumb: "text" },
];

const HISTORY = [
  "Brush stroke", "Crop", "Added text", "Color fill", "Eraser stroke",
  "Moved layer", "Brush stroke", "Adjustment layer",
];

const ZOOM_LEVELS = [0.5, 1, 2];

const Tp = ({ text, ch }) => (
  <div className="group relative inline-flex">
    {ch}
    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#1a1a1a] border border-white/10 text-[9px] text-white/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
      {text}
    </div>
  </div>
);

const Bn = ({ onClick, children, active, cls = "" }) => (
  <button onClick={onClick} className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${active ? "bg-white/10 text-white/70" : "text-white/20 hover:text-white/50 hover:bg-white/5"} ${cls}`}>
    {children}
  </button>
);

function LayerRow({ layer, selected, onSelect, onToggleVis }) {
  return (
    <motion.button
      layout
      onClick={() => onSelect(layer.id)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all border-b border-white/[0.02] ${selected ? "bg-white/8" : "hover:bg-white/4"}`}
      style={{ borderColor: selected ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.02)" }}
    >
      <div className="w-7 h-7 rounded flex items-center justify-center text-[8px] flex-shrink-0 overflow-hidden border border-white/[0.04]"
        style={{ background: layer.thumb === "gradient" ? "linear-gradient(135deg, #06b6d4, #3b82f6)" : layer.thumb === "shapes" ? "#1a1a2e" : "#0f0f1a" }}
      >
        {layer.thumb === "text" ? "T" : layer.thumb === "shapes" ? (
          <div className="w-4 h-4 rounded-full bg-white/20" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-white/45 truncate">{layer.name}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleVis(layer.id); }}
        className={`p-0.5 rounded transition-all ${layer.visible ? "text-[#06b6d4]/60" : "text-white/10 hover:text-white/25"}`}
      >
        <S d={I.eye} sz={12} />
      </button>
    </motion.button>
  );
}

function HistoryRow({ item, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.03 }}
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/4 cursor-pointer border-b border-white/[0.01]"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-white/10 flex-shrink-0" />
      <span className="text-[9px] text-white/25 truncate">{item}</span>
    </motion.div>
  );
}

export default function PhotoshopEditor() {
  const [tool, setTool] = useState("move");
  const [zoom, setZoom] = useState(1);
  const [selectedLayer, setSelectedLayer] = useState("bg");
  const [layers, setLayers] = useState(LAYERS);
  const [brushSize, setBrushSize] = useState(12);
  const [fgColor, setFgColor] = useState("#06b6d4");
  const [rightTab, setRightTab] = useState("layers");

  const toggleVis = (id) => {
    setLayers((prev) => prev.map((l) => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">
      {/* Top Bar */}
      <div className="h-10 flex-shrink-0 flex items-center px-3 gap-1 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-sm shadow-cyan-500/10">
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <span className="text-[11px] font-bold tracking-tight text-white/40">Photoshop Editor</span>
        </div>

        <div className="w-px h-4 bg-white/[0.06]" />

        <Tp text="Undo" ch={<Bn onClick={() => {}}><S d={I.undo} sz={13} /></Bn>} />
        <Tp text="Redo" ch={<Bn onClick={() => {}}><S d={I.redo} sz={13} /></Bn>} />

        <div className="w-px h-4 bg-white/[0.06] mx-1" />

        <Tp text="Zoom Out" ch={<Bn onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}><S d={I.zoO} sz={13} /></Bn>} />
        <span className="text-[10px] text-white/25 w-9 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <Tp text="Zoom In" ch={<Bn onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}><S d={I.zoI} sz={13} /></Bn>} />

        <div className="flex items-center gap-1 ml-1">
          {ZOOM_LEVELS.map((z) => (
            <button key={z} onClick={() => setZoom(z)}
              className={`text-[9px] px-2 py-0.5 rounded transition-all ${zoom === z ? "bg-white/10 text-white/55" : "text-white/15 hover:text-white/35 hover:bg-white/5"}`}
            >
              {z === 0.5 ? "Fit" : `${z * 100}%`}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button onClick={() => {}}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/60 hover:bg-cyan-500 text-white text-[10px] font-medium transition-all shadow-sm shadow-cyan-500/10"
        >
          <S d={I.export} sz={12} />
          Export
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left Toolbar */}
        <div className="w-12 flex-shrink-0 flex flex-col items-center py-2 gap-0.5 border-r border-white/[0.06] bg-[#0c0c0c]">
          {TOOLS.map((t) => (
            <Tp key={t.id} text={t.label}>
              <button onClick={() => setTool(t.id)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${tool === t.id ? "bg-cyan-500/15 text-cyan-400 shadow-sm shadow-cyan-500/5" : "text-white/15 hover:text-white/45 hover:bg-white/5"}`}
              >
                <S d={t.icon} sz={16} />
              </button>
            </Tp>
          ))}

          <div className="w-5 h-px bg-white/[0.06] my-1" />

          {/* Brush size slider (only when Brush selected) */}
          {tool === "brush" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col items-center gap-1 px-1"
            >
              <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center"
                style={{ width: `${10 + brushSize * 0.6}px`, height: `${10 + brushSize * 0.6}px` }}
              >
                <div className="rounded-full bg-cyan-400/40" style={{ width: `${brushSize * 0.5}px`, height: `${brushSize * 0.5}px` }} />
              </div>
              <input type="range" min={2} max={60} value={brushSize}
                onChange={(e) => setBrushSize(+e.target.value)}
                className="w-8 h-[60px] accent-cyan-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer [writing-mode:vertical-lr]"
              />
            </motion.div>
          )}

          <div className="w-5 h-px bg-white/[0.06] my-1" />

          {/* Color swatches */}
          <div className="flex flex-col gap-1 px-1.5">
            <div className="w-7 h-7 rounded-md border-2 border-white/30 cursor-pointer overflow-hidden"
              style={{ background: fgColor }}
              onClick={() => {}}
            />
            <div className="grid grid-cols-2 gap-0.5">
              {COLOR_SWATCHES.map((c) => (
                <button key={c} onClick={() => setFgColor(c)}
                  className={`w-3 h-3 rounded-sm border ${fgColor === c ? "border-cyan-400 ring-1 ring-cyan-400/40" : "border-white/10"} hover:scale-125 transition-transform`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto bg-[#060606] relative"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
              backgroundPosition: "0 0",
            }}
          >
            <div
              className="absolute origin-top-left"
              style={{
                width: 1200, height: 900,
                transform: `scale(${zoom})`,
                transformOrigin: "0 0",
                left: "50%", top: "50%",
                marginLeft: -600, marginTop: -450,
              }}
            >
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)] z-10" />
              <div className="absolute inset-0 border border-white/[0.04] z-0" />

              {/* Mock canvas content */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d1a] via-[#111128] to-[#0a0a18]">
                {/* Gradient orb */}
                <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-20 blur-3xl"
                  style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
                />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
                  style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }}
                />

                {/* Shapes */}
                {layers.find((l) => l.id === "l1")?.visible && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
                    <div className="absolute top-[15%] left-[20%] w-32 h-32 rounded-lg opacity-30"
                      style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)", transform: "rotate(15deg)" }}
                    />
                    <div className="absolute top-[40%] right-[25%] w-24 h-24 rounded-full opacity-25 bg-purple-500/30" />
                    <div className="absolute bottom-[20%] left-[35%] w-20 h-20 rotate-45 opacity-20 border border-white/20" />
                    <div className="absolute top-[55%] left-[15%] w-16 h-16 rounded-full border border-cyan-400/20" />
                    <div className="absolute bottom-[30%] right-[15%] w-28 h-2 rounded-full opacity-30 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                  </motion.div>
                )}

                {/* Text Layer */}
                {layers.find((l) => l.id === "text")?.visible && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-3xl font-light tracking-[0.3em] text-white/10 select-none">
                      BRANPY
                    </span>
                  </motion.div>
                )}

                {/* Selection overlay */}
                <div className="absolute top-[30%] left-[25%] right-[25%] bottom-[30%] border border-dashed border-cyan-500/20 rounded-sm pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panels */}
        <div className="w-[220px] flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] flex flex-col min-h-0">
          {/* Panel tabs */}
          <div className="flex border-b border-white/[0.06]">
            <button onClick={() => setRightTab("layers")}
              className={`flex-1 text-[9px] py-2 relative ${rightTab === "layers" ? "text-cyan-400" : "text-white/18 hover:text-white/35"}`}
            >
              Layers
              {rightTab === "layers" && <div className="absolute bottom-0 left-[20%] right-[20%] h-[2px] rounded-t bg-cyan-500" />}
            </button>
            <button onClick={() => setRightTab("history")}
              className={`flex-1 text-[9px] py-2 relative ${rightTab === "history" ? "text-cyan-400" : "text-white/18 hover:text-white/35"}`}
            >
              History
              {rightTab === "history" && <div className="absolute bottom-0 left-[20%] right-[20%] h-[2px] rounded-t bg-cyan-500" />}
            </button>
          </div>

          {/* Layers panel */}
          {rightTab === "layers" && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <AnimatePresence>
                  {[...layers].reverse().map((layer) => (
                    <LayerRow
                      key={layer.id}
                      layer={layer}
                      selected={selectedLayer === layer.id}
                      onSelect={setSelectedLayer}
                      onToggleVis={toggleVis}
                    />
                  ))}
                </AnimatePresence>
              </div>
              {/* Layer actions */}
              <div className="flex-shrink-0 flex items-center gap-1 px-3 py-2 border-t border-white/[0.06]">
                <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-white/5 text-white/15 hover:text-white/40 transition-all">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                </button>
                <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-white/5 text-white/15 hover:text-white/40 transition-all">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* History panel */}
          {rightTab === "history" && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto scrollbar-thin pt-1">
                <AnimatePresence>
                  {HISTORY.map((item, i) => (
                    <HistoryRow key={i} item={item} i={i} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
