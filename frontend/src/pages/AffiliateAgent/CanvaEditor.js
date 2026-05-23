import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocalStorage, useArray } from "../../hooks/useLocalStorage";

/* ─── Util ─── */
const UID = () => Math.random().toString(36).slice(2, 9);
const CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ─── Icons ─── */
const S = ({ d, sz = 14, style }) => <svg style={{ width: sz, height: sz, flexShrink: 0, ...style }} viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;
const I = {
  select: "M3 17h2v-2H3v2zm0-4h2v-2H3v2zm0-4h2V7H3v2zm4 12h2V7H7v14z",
  text: "M5 4v3h5.5v12h3V7H19V4z",
  rect: "M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5V5h14v14z",
  circle: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2z",
  line: "M19 13H5v-2h14v2z",
  image: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
  redo: "M11.5 8c-4.65 0-8.58 3.03-9.97 7.22l2.37.78c1.05-3.19 4.06-5.5 7.6-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6C16.55 9.01 14.15 8 11.5 8z",
  zoI: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z",
  zoO: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM7 9h5v1H7V9z",
  export: "M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
};

/* ─── Color presets ─── */
const COLOR_PRESETS = [
  "#ffffff", "#cccccc", "#999999", "#666666", "#333333", "#000000",
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6", "#3b82f6",
  "#6366f1", "#a855f7", "#ec4899", "#e11d48",
];

/* ─── Default element factory ─── */
const makeEl = (type, x, y) => ({
  id: UID(), type, x, y,
  width: type === "text" ? 180 : type === "line" ? 200 : 120,
  height: type === "text" ? 40 : type === "line" ? 4 : 120,
  color: type === "text" ? "#ffffff" : type === "circle" ? "#3b82f6" : "#22c55e",
  text: type === "text" ? "Double-click to edit" : "",
  rotation: 0,
});

const defaultElements = [
  makeEl("text", 200, 200),
  makeEl("rectangle", 500, 180),
  makeEl("circle", 150, 400),
  makeEl("line", 500, 450),
];

/* ════════════════════════════════════════
   BN (Btn) — inline button
   ════════════════════════════════════════ */
const Bn = ({ onClick, children, active, cls = "" }) => (
  <button onClick={onClick} className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${active ? "bg-white/10 text-white/70" : "text-white/20 hover:text-white/50 hover:bg-white/5"} ${cls}`}>
    {children}
  </button>
);

/* ════════════════════════════════════════
   Tooltip wrapper
   ════════════════════════════════════════ */
const Tp = ({ text, ch }) => (
  <div className="group relative inline-flex">
    {ch}
    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#1a1a1a] border border-white/10 text-[9px] text-white/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
      {text}
    </div>
  </div>
);

/* ════════════════════════════════════════
   TOAST
   ════════════════════════════════════════ */
function Toast({ message, visible }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl border flex items-center gap-2.5 shadow-2xl"
      style={{ background: "#141414", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <S d={I.check} sz={14} style={{ color: "rgba(34,197,94,0.8)" }} />
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{message}</span>
    </motion.div>
  );
}

/* ════════════════════════════════════════
   PROPERTIES PANEL
   ════════════════════════════════════════ */
function PropertiesPanel({ el, onUpdate, onDelete }) {
  if (!el) return null;
  const set = (patch) => onUpdate(el.id, patch);

  return (
    <div className="border-t border-white/[0.06] p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Properties</span>
        <button onClick={() => onDelete(el.id)} className="p-1 rounded hover:bg-red-500/10 text-white/15 hover:text-red-400/70 transition-colors">
          <S d={I.trash} sz={13} />
        </button>
      </div>

      {el.type !== "line" && (
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "X", key: "x", step: 1 },
            { label: "Y", key: "y", step: 1 },
            { label: "W", key: "width", step: 1 },
            { label: "H", key: "height", step: 1 },
          ].map(({ label, key, step }) => (
            <div key={key}>
              <label className="text-[8px] text-white/15 block mb-0.5">{label}</label>
              <input type="number" value={Math.round(el[key])} step={step}
                onChange={(e) => set({ [key]: +e.target.value })}
                className="w-full bg-white/5 border border-white/[0.06] rounded px-1.5 py-1 text-[10px] text-white/50 outline-none focus:border-white/15"
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="text-[8px] text-white/15 block mb-1">Color</label>
        <div className="flex items-center gap-2">
          <input type="color" value={el.color || "#ffffff"}
            onChange={(e) => set({ color: e.target.value })}
            className="w-7 h-7 rounded border-0 cursor-pointer p-0 bg-transparent"
          />
          <div className="flex gap-1 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => set({ color: c })}
                className="w-4 h-4 rounded-full border border-white/10 hover:scale-125 transition-transform"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="text-[8px] text-white/15 block mb-0.5">Rotation</label>
        <input type="range" min={-180} max={180} value={el.rotation || 0}
          onChange={(e) => set({ rotation: +e.target.value })}
          className="w-full h-[3px] accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   CANVA EDITOR — MAIN
   ════════════════════════════════════════ */
export default function CanvaEditor() {
  const [tool, setTool] = useState("select");
  const [zoom, setZoom] = useState(1);
  const [showLayers, setShowLayers] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [dragEl, setDragEl] = useState(null);
  const [dragOff, setDragOff] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const toastTimer = useRef(null);

  const [elements, setElements] = useLocalStorage("canva_elements", defaultElements);
  const [history, setHistory] = useLocalStorage("canva_history", []);
  const [historyIdx, setHistoryIdx] = useLocalStorage("canva_history_idx", -1);

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const pushHistory = useCallback((els) => {
    const copy = JSON.parse(JSON.stringify(els));
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIdx + 1);
      return [...trimmed, copy].slice(-30);
    });
    setHistoryIdx((prev) => Math.min(prev + 1, 29));
  }, [historyIdx, setHistory, setHistoryIdx]);

  const updateElements = useCallback((fn) => {
    setElements((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      return next;
    });
  }, [setElements]);

  const handleUpdate = useCallback((id, patch) => {
    updateElements((prev) => prev.map((el) => el.id === id ? { ...el, ...patch } : el));
  }, [updateElements]);

  const handleDelete = useCallback((id) => {
    updateElements((prev) => {
      pushHistory(prev);
      if (selectedId === id) setSelectedId(null);
      return prev.filter((el) => el.id !== id);
    });
  }, [updateElements, pushHistory, selectedId]);

  const undo = useCallback(() => {
    if (historyIdx < 0) return;
    const snapshot = history[historyIdx];
    if (!snapshot) return;
    setElements(snapshot);
    setHistoryIdx((prev) => prev - 1);
  }, [history, historyIdx, setElements, setHistoryIdx]);

  const redo = useCallback(() => {
    if (historyIdx + 1 >= history.length) return;
    const snapshot = history[historyIdx + 1];
    if (!snapshot) return;
    setElements(snapshot);
    setHistoryIdx((prev) => prev + 1);
  }, [history, historyIdx, setElements, setHistoryIdx]);

  const addElement = useCallback((type) => {
    setElements((prev) => {
      pushHistory(prev);
      const baseX = 150 + Math.random() * 300;
      const baseY = 150 + Math.random() * 300;
      return [...prev, makeEl(type, baseX, baseY)];
    });
  }, [setElements, pushHistory]);

  const handleExport = useCallback(() => {
    showToast("Canvas exported successfully — BRANPY format");
  }, [showToast]);

  const handleCanvasMouseDown = useCallback((e) => {
    if (tool !== "select") return;
    const target = e.target.closest("[data-el-id]");
    if (!target) {
      setSelectedId(null);
      return;
    }
    const id = target.dataset.elId;
    setSelectedId(id);
    const rect = target.getBoundingClientRect();
    setDragOff({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const el = elements.find((el) => el.id === id);
    if (!el) return;
    setDragEl(el);

    const onMove = (ev) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cr = canvas.getBoundingClientRect();
      const scaleX = 2000 / cr.width;
      const scaleY = 2000 / cr.height;
      const nx = (ev.clientX - cr.left) * scaleX - dragOff.x;
      const ny = (ev.clientY - cr.top) * scaleY - dragOff.y;
      handleUpdate(id, { x: CLAMP(nx, 0, 1900), y: CLAMP(ny, 0, 1900) });
    };
    const onUp = () => {
      setDragEl(null);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [tool, elements, dragOff, handleUpdate, setSelectedId, setDragEl]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && document.activeElement?.tagName !== "INPUT") {
          handleDelete(selectedId);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedId, handleDelete, undo, redo]);

  const selectedEl = elements.find((el) => el.id === selectedId);

  const renderEl = (el) => {
    const isSelected = el.id === selectedId;
    const selProps = isSelected ? {
      outline: "2px solid rgba(34,197,94,0.6)",
      outlineOffset: 1,
    } : {};

    const common = {
      "data-el-id": el.id,
      style: {
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        cursor: tool === "select" ? (dragEl?.id === el.id ? "grabbing" : "grab") : "default",
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        ...selProps,
      },
    };

    if (el.type === "text") {
      return (
        <div key={el.id} {...common}
          className="flex items-center px-2 text-sm font-medium select-none"
          style={{ color: el.color, ...common.style }}
        >
          {el.text || "Text"}
          {isSelected && <div className="absolute -top-2 -left-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute -top-2 -right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
        </div>
      );
    }

    if (el.type === "rectangle") {
      return (
        <div key={el.id} {...common}
          className="rounded-md select-none"
          style={{ background: el.color, ...common.style }}
        >
          {isSelected && <div className="absolute -top-2 -left-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute -top-2 -right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
        </div>
      );
    }

    if (el.type === "circle") {
      return (
        <div key={el.id} {...common}
          className="select-none"
          style={{ background: el.color, borderRadius: "50%", ...common.style }}
        >
          {isSelected && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
        </div>
      );
    }

    if (el.type === "line") {
      return (
        <div key={el.id} {...common}
          className="select-none"
          style={{ background: el.color, borderRadius: 2, ...common.style }}
        >
          {isSelected && <div className="absolute -top-2 left-0 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
          {isSelected && <div className="absolute -bottom-2 right-0 w-2 h-2 bg-emerald-500 rounded-full shadow-lg" />}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">
      {/* ─── Top Actions Bar ─── */}
      <div className="h-10 flex-shrink-0 flex items-center px-3 gap-1 border-b border-white/[0.06] bg-[#0c0c0c]">
        <div className="flex items-center gap-0.5 mr-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mr-1.5">
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <span className="text-[11px] font-bold tracking-tight text-white/40">Canva Editor</span>
        </div>
        <div className="w-px h-4 bg-white/[0.06]" />
        <Tp text="Undo" ch={<Bn onClick={undo}><S d={I.undo} sz={13} /></Bn>} />
        <Tp text="Redo" ch={<Bn onClick={redo}><S d={I.redo} sz={13} /></Bn>} />
        <div className="w-px h-4 bg-white/[0.06] mx-1" />
        <Tp text="Zoom Out" ch={<Bn onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.15).toFixed(2)))}><S d={I.zoO} sz={13} /></Bn>} />
        <span className="text-[10px] text-white/25 w-9 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <Tp text="Zoom In" ch={<Bn onClick={() => setZoom((z) => Math.min(4, +(z + 0.15).toFixed(2)))}><S d={I.zoI} sz={13} /></Bn>} />
        <div className="flex-1" />
        <Tp text="Toggle Layers" ch={<Bn onClick={() => setShowLayers((s) => !s)} active={showLayers}><S d={I.layers} sz={13} /></Bn>} />
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/60 hover:bg-emerald-500 text-white text-[10px] font-medium transition-all shadow-sm shadow-emerald-500/10 ml-1"
        >
          <S d={I.export} sz={12} />
          Export
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* ─── Left Toolbar ─── */}
        <div className="w-12 flex-shrink-0 flex flex-col items-center py-2 gap-0.5 border-r border-white/[0.06] bg-[#0c0c0c]">
          {[
            { id: "select", icon: I.select, label: "Select" },
            { id: "text", icon: I.text, label: "Text" },
            { id: "rectangle", icon: I.rect, label: "Rectangle" },
            { id: "circle", icon: I.circle, label: "Circle" },
            { id: "line", icon: I.line, label: "Line" },
            { id: "image", icon: I.image, label: "Image" },
          ].map((t) => (
            <Tp key={t.id} text={t.label}>
              <button onClick={() => {
                setTool(t.id);
                if (t.id !== "select" && t.id !== "image") addElement(t.id);
              }}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${tool === t.id ? "bg-white/10 text-white/70" : "text-white/15 hover:text-white/45 hover:bg-white/5"}`}
              >
                <S d={t.icon} sz={16} />
              </button>
            </Tp>
          ))}
          <div className="w-5 h-px bg-white/[0.06] my-1" />
          <Tp text="Add Image">
            <label className="w-9 h-9 rounded-lg flex items-center justify-center text-white/15 hover:text-white/45 hover:bg-white/5 cursor-pointer transition-all">
              <S d={I.image} sz={16} />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) showToast(`Image "${file.name}" added to canvas`);
                e.target.value = "";
              }} />
            </label>
          </Tp>
        </div>

        {/* ─── Canvas Area ─── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            className="flex-1 overflow-auto bg-[#060606] relative"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
              backgroundPosition: "0 0",
            }}
          >
            <div
              className="absolute origin-top-left"
              style={{
                width: 2000,
                height: 2000,
                transform: `scale(${zoom})`,
                transformOrigin: "0 0",
              }}
            >
              {/* Canvas shadow */}
              <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] z-10" />

              {/* Canvas border */}
              <div className="absolute inset-0 border border-white/[0.04] z-0" />

              {/* Elements */}
              {elements.map(renderEl)}

              {/* Empty state */}
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-2xl mb-2 opacity-10">🎨</div>
                    <div className="text-[10px] text-white/10">Select a tool from the left to start creating</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Right Layers Panel ─── */}
        {showLayers && (
          <div className="w-[220px] flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] flex flex-col min-h-0">
            <div className="h-9 flex-shrink-0 flex items-center px-3 border-b border-white/[0.06]">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Layers</span>
              <span className="ml-auto text-[9px] text-white/10">{elements.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {[...elements].reverse().map((el) => (
                <motion.button
                  key={el.id}
                  layout
                  onClick={() => setSelectedId(el.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all border-b border-white/[0.02] ${selectedId === el.id ? "bg-white/8" : "hover:bg-white/4"}`}
                  style={{ borderColor: selectedId === el.id ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.02)" }}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] flex-shrink-0"
                    style={{
                      background: el.type === "text" ? "rgba(245,158,11,0.15)" : `${el.color}22`,
                      color: el.type === "text" ? "#f59e0b" : el.color,
                    }}
                  >
                    {el.type === "text" ? "T" : el.type === "rectangle" ? "▣" : el.type === "circle" ? "●" : el.type === "line" ? "━" : "◻"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-white/45 truncate capitalize">{el.type}</div>
                    <div className="text-[7px] text-white/15">{Math.round(el.x)}, {Math.round(el.y)}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(el.id); }}
                    className="p-0.5 rounded text-white/10 hover:text-red-400/60 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <S d={I.close} sz={10} />
                  </button>
                </motion.button>
              ))}
            </div>
            {/* Properties panel at bottom */}
            <PropertiesPanel el={selectedEl} onUpdate={handleUpdate} onDelete={handleDelete} />
          </div>
        )}
      </div>

      {/* ─── Toast ─── */}
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
