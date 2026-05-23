import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const tools = [
  { id: "select", icon: "⊹", label: "Select" },
  { id: "draw", icon: "✎", label: "Draw" },
  { id: "text", icon: "T", label: "Text" },
  { id: "rect", icon: "▭", label: "Rectangle" },
  { id: "circle", icon: "○", label: "Circle" },
  { id: "sticky", icon: "▢", label: "Sticky Note" },
  { id: "eraser", icon: "✕", label: "Eraser" },
];

const colorOptions = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];

const UID = () => Math.random().toString(36).slice(2, 9);

export default function WhiteboardView() {
  const [activeTool, setActiveTool] = useState("select");
  const [color, setColor] = useState("#22c55e");
  const [elements, setElements] = useState([]);
  const [selectedEl, setSelectedEl] = useState(null);
  const canvasRef = useRef(null);

  const handleCanvasClick = useCallback((e) => {
    if (activeTool === "select" || activeTool === "eraser") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasRef.current.scrollLeft;
    const y = e.clientY - rect.top + canvasRef.current.scrollTop;

    if (activeTool === "draw") {
      setElements((prev) => [...prev, { id: UID(), type: "draw", x, y, color, points: [{ x, y }] }]);
      return;
    }

    const newEl = { id: UID(), type: activeTool, x, y, color, content: activeTool === "text" ? "Text" : activeTool === "sticky" ? "Note" : "" };
    setElements((prev) => [...prev, newEl]);
  }, [activeTool, color]);

  const handleCanvasDrag = useCallback((e) => {
    if (activeTool !== "draw" || !e.buttons) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasRef.current.scrollLeft;
    const y = e.clientY - rect.top + canvasRef.current.scrollTop;
    const last = elements[elements.length - 1];
    if (last && last.type === "draw") {
      setElements((prev) => {
        const copy = [...prev];
        const lastEl = copy[copy.length - 1];
        if (lastEl.type === "draw") lastEl.points = [...lastEl.points, { x, y }];
        return copy;
      });
    }
  }, [activeTool, elements]);

  const handleElClick = useCallback((e, el) => {
    e.stopPropagation();
    if (activeTool === "eraser") {
      setElements((prev) => prev.filter((item) => item.id !== el.id));
      setSelectedEl(null);
      return;
    }
    if (activeTool === "select") {
      setSelectedEl(el);
    }
  }, [activeTool]);

  const renderElement = (el) => {
    const base = `absolute cursor-pointer transition-all hover:ring-1 hover:ring-white/20 rounded`;
    const fill = el.color || color;
    if (el.type === "draw" && el.points) {
      const pts = el.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x - (el.x || 0)} ${p.y - (el.y || 0)}`).join(" ");
      return (
        <svg key={el.id} className="absolute overflow-visible pointer-events-none" style={{ left: el.x || 0, top: el.y || 0 }} width="200" height="200">
          <path d={pts} stroke={fill} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (el.type === "text") {
      return (
        <div key={el.id} className={base} style={{ left: el.x, top: el.y }} onClick={(e) => handleElClick(e, el)}>
          <span className="text-sm font-medium px-2 py-1 rounded" style={{ color: fill }}>{el.content || "Text"}</span>
        </div>
      );
    }
    if (el.type === "rect") {
      return (
        <div key={el.id} className={base} style={{ left: el.x, top: el.y, width: 80, height: 60, background: `${fill}20`, border: `2px solid ${fill}` }} onClick={(e) => handleElClick(e, el)} />
      );
    }
    if (el.type === "circle") {
      return (
        <div key={el.id} className={`${base} rounded-full`} style={{ left: el.x, top: el.y, width: 70, height: 70, background: `${fill}20`, border: `2px solid ${fill}` }} onClick={(e) => handleElClick(e, el)} />
      );
    }
    if (el.type === "sticky") {
      return (
        <div key={el.id} className={base} style={{ left: el.x, top: el.y, width: 100, height: 80, background: `${fill}18`, border: `1px solid ${fill}40`, backdropFilter: "blur(4px)" }} onClick={(e) => handleElClick(e, el)}>
          <div className="p-2 text-[9px] text-white/40 break-words" style={{ color: fill }}>{el.content || "Note"}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full flex bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="w-14 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] flex flex-col items-center py-2 gap-1">
        {tools.map((t) => (
          <motion.button
            key={t.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTool(t.id)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs transition-all ${
              activeTool === t.id ? "bg-white/[0.1] text-white/70" : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"
            }`}
            title={t.label}
          >
            {t.icon}
          </motion.button>
        ))}
        <div className="w-8 h-px bg-white/[0.06] my-1" />
        <div className="flex flex-col gap-1.5">
          {colorOptions.map((c) => (
            <button key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded-full transition-all ${color === c ? "ring-2 ring-white/40 ring-offset-1 ring-offset-[#0c0c0c]" : "hover:scale-110"}`} style={{ background: c }} />
          ))}
        </div>
      </div>

      <div
        ref={canvasRef}
        className="flex-1 overflow-auto relative cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasDrag}
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "30px 30px",
          backgroundColor: "#080808",
        }}
      >
        <div className="relative" style={{ width: 2000, height: 2000 }}>
          {elements.map(renderElement)}
          {selectedEl && (
            <div className="absolute bottom-4 left-4 bg-[#0c0c0c] border border-white/[0.06] rounded-lg px-3 py-1.5 text-[9px] text-white/30 shadow-lg">
              {selectedEl.type} at ({Math.round(selectedEl.x)}, {Math.round(selectedEl.y)})
            </div>
          )}
        </div>
      </div>

      <div className="w-48 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] flex flex-col">
        <div className="h-9 flex items-center px-3 border-b border-white/[0.06] justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Elements</span>
          <span className="text-[8px] text-white/10 font-mono">{elements.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {elements.map((el) => (
            <div
              key={el.id}
              onClick={() => { setSelectedEl(el); }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[9px] cursor-pointer transition-all ${
                selectedEl?.id === el.id ? "bg-white/[0.08] text-white/60" : "hover:bg-white/[0.03] text-white/30"
              }`}
            >
              <span className="w-4 text-center text-xs">{el.type === "draw" ? "✎" : el.type === "text" ? "T" : el.type === "rect" ? "▭" : el.type === "circle" ? "○" : el.type === "sticky" ? "▢" : "?"}</span>
              <span className="flex-1 truncate">{el.type} · {el.content || ""}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setElements((prev) => prev.filter((item) => item.id !== el.id)); setSelectedEl(null); }}
                className="text-white/15 hover:text-red-400/60 transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
              </button>
            </div>
          ))}
          {elements.length === 0 && <div className="text-[9px] text-white/12 text-center py-8">No elements</div>}
        </div>
        <div className="flex-shrink-0 p-2 border-t border-white/[0.06]">
          <button
            onClick={() => { setElements([]); setSelectedEl(null); }}
            className="w-full py-1.5 rounded-lg text-[9px] bg-white/[0.04] hover:bg-red-500/10 text-white/25 hover:text-red-400/60 transition-all"
          >
            Clear Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
