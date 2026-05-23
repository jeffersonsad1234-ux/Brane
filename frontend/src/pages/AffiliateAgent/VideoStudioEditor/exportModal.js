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
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); setExporting(false); setDone(true); return 100; }
        return p + Math.random() * 8 + 2;
      });
    }, 300);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, backdropFilter: "blur(4px)",
      }}
    >
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12, width: 440, maxWidth: "calc(100vw - 32px)",
          overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <S d={I.exp} sz={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>Export</span>
          </div>
          <button onClick={onClose}
            style={{
              padding: 3, border: "none", cursor: "pointer", background: "none",
              color: "rgba(255,255,255,0.1)", display: "flex", fontSize: 10,
              fontFamily: "inherit",
            }}
            className="cs-hover-soft"
          >✕</button>
        </div>

        {/* Presets */}
        <div style={{ padding: "10px 14px 0" }}>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.12)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Presets</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
            {EXPORT_PRESETS.map((p) => (
              <button key={p.id} onClick={() => handlePreset(p)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "6px 4px", borderRadius: 6,
                  border: "1px solid", cursor: "pointer", fontFamily: "inherit",
                  background: preset.id === p.id ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
                  borderColor: preset.id === p.id ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                  transition: "background 0.1s, border-color 0.1s",
                }}
                className={preset.id !== p.id ? "cs-hover-soft" : ""}
              >
                <span style={{ fontSize: 16, marginBottom: 2 }}>{p.icon}</span>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)" }}>{p.name}</span>
                <span style={{ fontSize: 7, color: "rgba(255,255,255,0.1)" }}>{p.res}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div style={{ padding: "10px 14px" }}>
          <div style={{
            fontSize: 8, color: "rgba(255,255,255,0.12)", textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 6,
          }}>Settings</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", marginBottom: 2 }}>Resolution</div>
              <select value={res} onChange={(e) => setRes(e.target.value)}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 4, fontSize: 9, color: "rgba(255,255,255,0.3)", padding: "4px 6px",
                  outline: "none", fontFamily: "inherit", cursor: "pointer",
                }}
              >
                {["1920×1080", "1080×1920", "2560×1440", "3840×2160", "1080×1080"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", marginBottom: 2 }}>Frame Rate</div>
              <select value={fps} onChange={(e) => setFps(+e.target.value)}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 4, fontSize: 9, color: "rgba(255,255,255,0.3)", padding: "4px 6px",
                  outline: "none", fontFamily: "inherit", cursor: "pointer",
                }}
              >
                {[24, 25, 30, 48, 50, 60].map((f) => <option key={f}>{f} fps</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", marginBottom: 2 }}>Quality</div>
              <select value={quality} onChange={(e) => setQuality(e.target.value)}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 4, fontSize: 9, color: "rgba(255,255,255,0.3)", padding: "4px 6px",
                  outline: "none", fontFamily: "inherit", cursor: "pointer",
                }}
              >
                {["Low", "Medium", "High", "Maximum"].map((q) => <option key={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", marginBottom: 2 }}>Format</div>
              <select value={format} onChange={(e) => setFormat(e.target.value)}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 4, fontSize: 9, color: "rgba(255,255,255,0.3)", padding: "4px 6px",
                  outline: "none", fontFamily: "inherit", cursor: "pointer",
                }}
              >
                {["MP4", "MOV", "AVI", "WebM", "GIF"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "rgba(255,255,255,0.15)", marginBottom: 2 }}>
              <span>Bitrate ({bitrate} Mbps)</span>
            </div>
            <input type="range" min={2} max={50} value={bitrate} onChange={(e) => setBitrate(+e.target.value)}
              style={{ width: "100%", height: 3, accentColor: "#3b82f6", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Progress */}
        {(exporting || done) && (
          <div style={{ padding: "0 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "rgba(255,255,255,0.15)", marginBottom: 2 }}>
              <span>{done ? "Complete" : "Exporting..."}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 0.3s, background 0.3s",
                background: done ? "rgba(16,185,129,0.5)" : "rgba(59,130,246,0.5)",
                width: `${Math.min(100, progress)}%`,
              }} />
            </div>
            {done && <div style={{ textAlign: "center", padding: "6px 0", fontSize: 9, color: "rgba(16,185,129,0.5)" }}>✓ Export completed successfully</div>}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 4,
        }}>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.08)", fontFamily: "monospace" }}>
            {proj.name} · {proj.duration.toFixed(1)}s
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={onClose}
              style={{
                fontSize: 9, padding: "4px 10px", borderRadius: 6, border: "none",
                cursor: "pointer", background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.25)", fontFamily: "inherit",
              }}
              className="cs-hover-soft"
            >Cancel</button>
            <button onClick={handleExport} disabled={exporting}
              style={{
                fontSize: 9, padding: "4px 12px", borderRadius: 6, border: "none",
                cursor: exporting ? "wait" : "pointer", fontFamily: "inherit",
                background: done ? "rgba(16,185,129,0.5)" : exporting ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.6)",
                color: done || exporting ? "rgba(255,255,255,0.4)" : "white",
                transition: "background 0.1s",
              }}
              className={!exporting && !done ? "cs-hover-soft" : ""}
            >
              {exporting ? "Exporting..." : done ? "Done" : "Export"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cs-hover-soft:hover { background: rgba(255,255,255,0.06) !important; }
        .cs-hover-icon:hover { color: rgba(255,255,255,0.25) !important; }
        .cs-asset-card:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; }
        .cs-sticker-card:hover { background: rgba(255,255,255,0.06) !important; transform: scale(1.1); }
        .cs-hover-border:hover { border-color: rgba(59,130,246,0.2) !important; }
        .cs-hover-scale:hover { transform: scale(1.15); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
