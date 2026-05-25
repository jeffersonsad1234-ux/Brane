import React, { useState, useRef, useCallback } from "react";
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
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [exportMode, setExportMode] = useState("json");

  if (!open) return null;

  const handlePreset = (p) => {
    setPreset(p); setRes(p.res); setFps(p.fps); setBitrate(p.bitrate);
    setDone(false); setProgress(0); setError(null);
  };

  const handleSaveProject = useCallback(() => {
    setSaving(true);
    setError(null);
    try {
      const data = JSON.stringify(proj, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${proj.name || "project"}.branpy`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Also save to localStorage
      try { localStorage.setItem("branpy_project", JSON.stringify(proj)); } catch {}
      setDone(true);
      setProgress(100);
      setTimeout(() => setSaving(false), 500);
    } catch (e) {
      setError("Failed to save: " + e.message);
      setSaving(false);
    }
  }, [proj]);

  const handleExportWebM = useCallback(() => {
    setExporting(true);
    setProgress(0);
    setError(null);
    try {
      // Try to use MediaRecorder on the preview element
      const canvas = document.createElement("canvas");
      const [w, h] = res.split("×").map(Number);
      canvas.width = w || 1920;
      canvas.height = h || 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) { throw new Error("Canvas not supported"); }

      const stream = canvas.captureStream(fps || 30);
      let chunks = [];
      const mimeType = format === "WebM" ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';
      let recorder = null;
      try {
        recorder = new MediaRecorder(stream, { mimeType });
      } catch {
        try { recorder = new MediaRecorder(stream, { mimeType: 'video/webm' }); } catch {
          throw new Error("MediaRecorder not available in this browser. Try using Chrome/Edge.");
        }
      }

      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onerror = () => { setError("Recording failed. Try a different format."); setExporting(false); };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${proj.name || "video"}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExporting(false);
        setDone(true);
        setProgress(100);
      };

      // Draw frames
      let frame = 0;
      const totalFrames = Math.ceil(proj.duration * (fps || 30));
      const drawFrame = () => {
        if (frame >= totalFrames || !exporting) {
          recorder.stop();
          return;
        }
        const t = frame / (fps || 30);
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(59,130,246,0.06)";
        ctx.font = "24px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillText(`${proj.name} · ${t.toFixed(1)}s`, 40, 60);
        ctx.font = "14px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillText(`${proj.width}×${proj.height} · ${fps || 30}fps`, 40, 90);
        setProgress(Math.round((frame / totalFrames) * 100));
        frame++;
        setTimeout(drawFrame, 1000 / (fps || 30));
      };
      recorder.start(100);
      setTimeout(drawFrame, 100);
    } catch (e) {
      setError(e.message || "Export failed. Browser may not support MediaRecorder.");
      setExporting(false);
    }
  }, [proj, res, fps, format, exporting]);

  const handleExportJSON = useCallback(() => {
    handleSaveProject();
  }, [handleSaveProject]);

  const handleExport = () => {
    if (exportMode === "json") {
      handleExportJSON();
    } else {
      handleExportWebM();
    }
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
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <S d={I.exp} sz={14} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.72)" }}>Export</span>
          </div>
          <button onClick={onClose}
            style={{
              padding: 3, border: "none", cursor: "pointer", background: "none",
              color: "rgba(255,255,255,0.38)", display: "flex", fontSize: 13,
              fontFamily: "inherit",
            }}
            className="cs-hover-soft"
          >✕</button>
        </div>

        <div style={{ padding: "10px 14px 0" }}>
          <div style={{
            fontSize: 13, color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
            letterSpacing: "0.1em", marginBottom: 6, fontWeight: 500,
          }}>Presets</div>
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
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{p.name}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{p.res}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "10px 14px" }}>
          <div style={{
            fontSize: 13, color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
            letterSpacing: "0.1em", marginBottom: 6, fontWeight: 500,
          }}>Export Mode</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
            {[
              { id: "json", label: "JSON Project", desc: "Save as .branpy file" },
              { id: "webm", label: "WebM Video", desc: "Browser-based render" },
            ].map((m) => (
              <button key={m.id} onClick={() => { setExportMode(m.id); setError(null); setDone(false); setProgress(0); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "6px 4px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                  background: exportMode === m.id ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
                  border: exportMode === m.id ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{m.label}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{m.desc}</span>
              </button>
            ))}
          </div>

          {exportMode === "webm" && (
            <>
              <div style={{
                fontSize: 13, color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
                letterSpacing: "0.1em", marginBottom: 6, fontWeight: 500,
              }}>Settings</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Resolution</div>
                  <select value={res} onChange={(e) => setRes(e.target.value)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 4, fontSize: 13, color: "rgba(255,255,255,0.6)", padding: "4px 6px",
                      outline: "none", fontFamily: "inherit", cursor: "pointer",
                    }}
                  >
                    {["1920×1080", "1080×1920", "2560×1440", "3840×2160", "1080×1080"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Frame Rate</div>
                  <select value={fps} onChange={(e) => setFps(+e.target.value)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 4, fontSize: 13, color: "rgba(255,255,255,0.6)", padding: "4px 6px",
                      outline: "none", fontFamily: "inherit", cursor: "pointer",
                    }}
                  >
                    {[24, 25, 30, 48, 50, 60].map((f) => <option key={f}>{f} fps</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
                <div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Quality</div>
                  <select value={quality} onChange={(e) => setQuality(e.target.value)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 4, fontSize: 13, color: "rgba(255,255,255,0.6)", padding: "4px 6px",
                      outline: "none", fontFamily: "inherit", cursor: "pointer",
                    }}
                  >
                    {["Low", "Medium", "High", "Maximum"].map((q) => <option key={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Format</div>
                  <select value={format} onChange={(e) => setFormat(e.target.value)}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 4, fontSize: 13, color: "rgba(255,255,255,0.6)", padding: "4px 6px",
                      outline: "none", fontFamily: "inherit", cursor: "pointer",
                    }}
                  >
                    {["WebM"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 2,
                }}>
                  <span>Bitrate ({bitrate} Mbps)</span>
                </div>
                <input type="range" min={2} max={50} value={bitrate} onChange={(e) => setBitrate(+e.target.value)}
                  style={{ width: "100%", height: 3, accentColor: "#3b82f6", cursor: "pointer" }}
                />
              </div>
              <div style={{ marginTop: 6, padding: "4px 8px", background: "rgba(245,158,11,0.06)", borderRadius: 4, border: "1px solid rgba(245,158,11,0.1)" }}>
                <span style={{ fontSize: 11, color: "rgba(245,158,11,0.6)" }}>
                  ⓘ WebM export is experimental. For production-quality video, use JSON export with an external renderer (FFmpeg/Adobe). This will render a canvas-based preview.
                </span>
              </div>
            </>
          )}
        </div>

        {(exporting || saving || done || error) && (
          <div style={{ padding: "0 14px" }}>
            {error && (
              <div style={{
                padding: "6px 8px", marginBottom: 4, borderRadius: 4,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)",
                fontSize: 12, color: "rgba(239,68,68,0.7)",
              }}>⚠ {error}</div>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 2,
            }}>
              <span>{done ? "Complete" : exporting ? "Exporting..." : saving ? "Saving..." : " "}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 0.3s, background 0.3s",
                background: done ? "rgba(16,185,129,0.5)" : error ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.5)",
                width: `${Math.min(100, progress)}%`,
              }} />
            </div>
            {done && <div style={{
              textAlign: "center", padding: "6px 0",
              fontSize: 13, color: "rgba(16,185,129,0.7)",
            }}>✓ {exportMode === "json" ? "Project saved successfully" : "Export completed"}</div>}
          </div>
        )}

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 4,
        }}>
          <div style={{
            fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "monospace",
          }}>
            {proj.name} · {proj.duration.toFixed(1)}s
          </div>
          <div style={{ display: "flex", gap: 4 }}>
              <button onClick={onClose}
                style={{
                  fontSize: 13, padding: "4px 10px", borderRadius: 6, border: "none",
                  cursor: "pointer", background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.55)", fontFamily: "inherit",
                }}
                className="cs-hover-soft"
              >Close</button>
              <button onClick={handleExport} disabled={exporting || saving}
                style={{
                  fontSize: 13, padding: "4px 12px", borderRadius: 6, border: "none",
                  cursor: (exporting || saving) ? "wait" : "pointer", fontFamily: "inherit",
                  background: done ? "rgba(16,185,129,0.5)" : (exporting || saving) ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.6)",
                  color: done || exporting || saving ? "rgba(255,255,255,0.4)" : "white",
                  transition: "background 0.1s",
                }}
              className={!(exporting || saving) && !done ? "cs-hover-soft" : ""}
            >
              {saving ? "Saving..." : exporting ? "Rendering..." : done ? "Done" : exportMode === "json" ? "Save JSON" : "Export WebM"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cs-hover-soft:hover { background: rgba(255,255,255,0.06) !important; }
        .cs-hover-icon:hover { color: rgba(255,255,255,0.35) !important; }
        .cs-asset-card:hover { background: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.08) !important; }
        .cs-sticker-card:hover { background: rgba(255,255,255,0.06) !important; transform: scale(1.1); }
        .cs-hover-border:hover { border-color: rgba(59,130,246,0.2) !important; }
        .cs-hover-scale:hover { transform: scale(1.15); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
