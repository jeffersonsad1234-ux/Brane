import React, { useState } from "react";
import { S, I, EXPORT_PRESETS } from "./utils";

export default function ExportModal({ open, onClose, proj }) {
  const [preset, setPreset] = useState(EXPORT_PRESETS[0]);
  const [res, setRes] = useState(preset.res);
  const [fps, setFps] = useState(preset.fps);
  const [bitrate, setBitrate] = useState(preset.bitrate);
  const [quality, setQuality] = useState("High");
  const [format, setFormat] = useState("MP4");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handlePreset = (p) => {
    setPreset(p); setRes(p.res); setFps(p.fps); setBitrate(p.bitrate);
    setDone(false); setProgress(0);
  };

  const handleExport = () => {
    setExporting(true); setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 100) { clearInterval(interval); setExporting(false); setDone(true); return 100; } return p + Math.random() * 8 + 2; });
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]" onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
      <div onClick={(e) => e.stopPropagation()} className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl max-w-lg w-full mx-4 overflow-hidden shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
          <div className="flex items-center gap-2">
            <S d={I.exp} sz={16} style={{ color: "rgba(255,255,255,0.4)" }} />
            <span className="text-xs font-medium text-white/60">Export</span>
          </div>
          <button onClick={onClose} className="text-white/15 hover:text-white/40"><S d={I.close} sz={14} /></button>
        </div>

        {/* Presets */}
        <div className="px-4 pt-4">
          <div className="text-[9px] text-white/18 uppercase tracking-wider mb-2">Presets</div>
          <div className="grid grid-cols-3 gap-1.5">
            {EXPORT_PRESETS.map((p) => (
              <button key={p.id} onClick={() => handlePreset(p)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border transition-all ${preset.id === p.id ? "bg-emerald-500/15 border-emerald-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
              >
                <span className="text-sm mb-0.5">{p.icon}</span>
                <span className="text-[8px] text-white/45">{p.name}</span>
                <span className="text-[6px] text-white/20">{p.res}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="px-4 pt-4 space-y-3">
          <div className="text-[9px] text-white/18 uppercase tracking-wider mb-1">Settings</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[8px] text-white/25 mb-0.5">Resolution</div>
              <select value={res} onChange={(e) => setRes(e.target.value)} className="w-full bg-white/5 border border-white/8 rounded text-[9px] text-white/40 px-2 py-1.5 outline-none focus:border-white/15">
                {["1920×1080", "1080×1920", "2560×1440", "3840×2160", "1080×1080"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[8px] text-white/25 mb-0.5">Frame Rate</div>
              <select value={fps} onChange={(e) => setFps(+e.target.value)} className="w-full bg-white/5 border border-white/8 rounded text-[9px] text-white/40 px-2 py-1.5 outline-none focus:border-white/15">
                {[24, 25, 30, 48, 50, 60].map((f) => <option key={f}>{f} fps</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[8px] text-white/25 mb-0.5">Quality</div>
              <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full bg-white/5 border border-white/8 rounded text-[9px] text-white/40 px-2 py-1.5 outline-none focus:border-white/15">
                {["Low", "Medium", "High", "Maximum"].map((q) => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <div className="text-[8px] text-white/25 mb-0.5">Format</div>
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full bg-white/5 border border-white/8 rounded text-[9px] text-white/40 px-2 py-1.5 outline-none focus:border-white/15">
                {["MP4", "MOV", "AVI", "WebM", "GIF"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[8px] text-white/25 mb-0.5">
              <span>Bitrate ({bitrate} Mbps)</span>
            </div>
            <input type="range" min={2} max={50} value={bitrate} onChange={(e) => setBitrate(+e.target.value)} className="w-full h-[3px] accent-emerald-500 bg-white/5 rounded-full appearance-none cursor-pointer" />
          </div>
        </div>

        {/* Progress */}
        {(exporting || done) && (
          <div className="px-4 pt-3">
            <div className="flex justify-between text-[8px] text-white/25 mb-1">
              <span>{done ? "Complete" : "Exporting..."}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${done ? "bg-emerald-500" : "bg-emerald-500/70"}`} style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            {done && <div className="text-center py-2 text-[9px] text-emerald-400/70">✅ Export completed successfully</div>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/6 mt-4">
          <div className="text-[8px] text-white/15">Project: {proj.name} · {proj.duration.toFixed(1)}s</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-[10px] px-3 py-1.5 rounded-lg bg-white/5 text-white/35 hover:bg-white/10">Cancel</button>
            <button onClick={handleExport} disabled={exporting}
              className={`text-[10px] px-4 py-1.5 rounded-lg transition-all ${exporting ? "bg-white/10 text-white/20 cursor-wait" : done ? "bg-emerald-500/80 text-white" : "bg-emerald-500/80 hover:bg-emerald-500 text-white"}`}
            >
              {exporting ? "Exporting..." : done ? "Done" : "Export"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
