import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const defaultSubtitles = [
  { id: "s1", index: 1, start: "00:00:02,000", end: "00:00:05,000", text: "Welcome to BRANPY ecosystem." },
  { id: "s2", index: 2, start: "00:00:06,000", end: "00:00:09,500", text: "The most advanced platform for creators." },
  { id: "s3", index: 3, start: "00:00:10,000", end: "00:00:14,000", text: "Build, deploy, and scale your projects." },
  { id: "s4", index: 4, start: "00:00:15,000", end: "00:00:18,500", text: "With AI-powered tools at your fingertips." },
  { id: "s5", index: 5, start: "00:00:19,000", end: "00:00:22,000", text: "Get started today and transform your workflow." },
];

const UID = () => Math.random().toString(36).slice(2, 9);

export default function SubtitleStudio() {
  const [subtitles, setSubtitles] = useState(defaultSubtitles);
  const [previewId, setPreviewId] = useState(null);
  const [fontSize, setFontSize] = useState(28);
  const [textColor, setTextColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#000000");
  const [position, setPosition] = useState("Bottom");

  const previewSub = useMemo(() => subtitles.find((s) => s.id === previewId), [previewId, subtitles]);

  const handleAdd = () => {
    const idx = subtitles.length + 1;
    const newSub = { id: UID(), index: idx, start: "00:00:00,000", end: "00:00:03,000", text: "New subtitle" };
    setSubtitles((prev) => [...prev, newSub]);
    setPreviewId(newSub.id);
  };

  const handleDelete = (id) => {
    setSubtitles((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, i) => ({ ...s, index: i + 1 }));
    });
    if (previewId === id) setPreviewId(null);
  };

  const updateSub = (id, field, value) => {
    setSubtitles((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleImport = () => {
    setSubtitles(defaultSubtitles.map((s) => ({ ...s, id: UID() })));
    setPreviewId(null);
  };

  const positionStyle = position === "Top" ? "top-8" : position === "Middle" ? "top-1/2 -translate-y-1/2" : "bottom-8";

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Subtitle Studio</span>
        <div className="flex-1" />
        <button onClick={handleImport} className="text-[9px] px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.08] text-white/30 hover:text-white/50 transition-all">Import SRT</button>
        <button className="text-[9px] px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400/70 hover:text-emerald-400 transition-all">Export SRT</button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[8px] text-white/15 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="py-2 px-2 w-10">#</th>
                    <th className="py-2 px-2">Start Time</th>
                    <th className="py-2 px-2">End Time</th>
                    <th className="py-2 px-3">Text</th>
                    <th className="py-2 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {subtitles.map((sub) => (
                      <motion.tr
                        key={sub.id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        onClick={() => setPreviewId(sub.id)}
                        className={`border-b border-white/[0.03] transition-all cursor-pointer ${
                          previewId === sub.id ? "bg-white/[0.06]" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <td className="py-1.5 px-2 text-[10px] text-white/20 font-mono">{sub.index}</td>
                        <td className="py-1.5 px-2">
                          <input value={sub.start} onChange={(e) => updateSub(sub.id, "start", e.target.value)} onClick={(e) => e.stopPropagation()} className="w-28 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-1 text-[9px] text-white/40 font-mono outline-none focus:border-white/[0.12]" />
                        </td>
                        <td className="py-1.5 px-2">
                          <input value={sub.end} onChange={(e) => updateSub(sub.id, "end", e.target.value)} onClick={(e) => e.stopPropagation()} className="w-28 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-1 text-[9px] text-white/40 font-mono outline-none focus:border-white/[0.12]" />
                        </td>
                        <td className="py-1.5 px-3">
                          <input value={sub.text} onChange={(e) => updateSub(sub.id, "text", e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-1 text-[9px] text-white/50 outline-none focus:border-white/[0.12]" />
                        </td>
                        <td className="py-1.5 px-2">
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }} className="text-white/10 hover:text-red-400/60 transition-colors">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleAdd} className="w-full mt-2 py-2 rounded-lg border border-dashed border-white/[0.08] text-[9px] text-white/15 hover:text-white/30 hover:border-white/[0.15] transition-all">
              + Add Subtitle
            </motion.button>
          </div>

          <div className="h-32 flex-shrink-0 border-t border-white/[0.06] bg-[#080808] flex items-center justify-center relative overflow-hidden mx-3 mb-3 rounded-xl">
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)" }} />
            {previewSub ? (
              <motion.div key={previewSub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`absolute left-4 right-4 text-center ${positionStyle}`} style={{ fontSize: `${fontSize}px`, color: textColor, textShadow: `0 2px 8px ${bgColor}80` }}>
                <span className="px-4 py-1 rounded" style={{ background: `${bgColor}60` }}>{previewSub.text}</span>
              </motion.div>
            ) : (
              <span className="text-[9px] text-white/10">Click a subtitle row to preview</span>
            )}
          </div>
        </div>

        <div className="w-52 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-3 space-y-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 block mb-3">Style</span>
          <div className="space-y-1.5">
            <label className="text-[8px] text-white/20 uppercase tracking-wider">Font Size</label>
            <div className="flex items-center gap-2">
              <input type="range" min={12} max={72} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="flex-1 h-[3px] accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer" />
              <span className="text-[9px] text-white/30 font-mono w-7 text-right">{fontSize}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] text-white/20 uppercase tracking-wider">Text Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/[0.06]" />
              <span className="text-[9px] text-white/30 font-mono">{textColor}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] text-white/20 uppercase tracking-wider">Background</label>
            <div className="flex items-center gap-2">
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer bg-transparent border border-white/[0.06]" />
              <span className="text-[9px] text-white/30 font-mono">{bgColor}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] text-white/20 uppercase tracking-wider">Position</label>
            <div className="flex gap-1">
              {["Top", "Middle", "Bottom"].map((p) => (
                <button key={p} onClick={() => setPosition(p)} className={`flex-1 py-1.5 rounded-md text-[8px] transition-all ${position === p ? "bg-white/[0.1] text-white/50" : "bg-white/[0.03] text-white/20 hover:text-white/35"}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
