import React, { useRef, useState } from "react";
import { I, S, Bi, FMT } from "./utils";

const ASPECTS = [
  { id: "16:9", ratio: 16 / 9, label: "16:9" },
  { id: "9:16", ratio: 9 / 16, label: "9:16" },
  { id: "4:3", ratio: 4 / 3, label: "4:3" },
  { id: "1:1", ratio: 1, label: "1:1" },
];

export default function PreviewPanel({ playing, setPlaying, ct, setCt, proj, vol, setVol }) {
  const ref = useRef(null);
  const [pz, setPz] = useState(80);
  const [grid, setGrid] = useState(false);
  const [safe, setSafe] = useState(false);
  const [qual, setQual] = useState("Auto");
  const [aspect, setAspect] = useState("16:9");
  const [showQual, setShowQual] = useState(false);
  const [speed, setSpeed] = useState(1);

  const ar = ASPECTS.find((a) => a.id === aspect)?.ratio || 16 / 9;
  const previewW = Math.min(480, window.innerWidth * 0.28);
  const previewH = previewW / ar;
  const playheadPos = proj.duration > 0 ? (ct / proj.duration) * 100 : 0;

  const toggleFs = () => {
    if (!document.fullscreenElement) ref.current?.requestFullscreen({ navigationUI: "hide" });
    else document.exitFullscreen();
  };

  return (
    <div ref={ref} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, background: "#080808" }}>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 8, position: "relative", overflow: "hidden",
        background: "radial-gradient(ellipse at center, #111 0%, #080808 100%)",
      }}>
        <div style={{
          borderRadius: 6, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "#000", position: "relative",
          width: previewW, height: previewH,
          transform: `scale(${pz / 100})`,
          boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
        }}>
          {playing || ct > 0 ? (
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(135deg, hsl(${(ct * 25) % 360}, 25%, 8%), hsl(${(ct * 25 + 80) % 360}, 20%, 12%))`,
              }} />
              {safe && (
                <div style={{
                  position: "absolute", inset: "10%",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2, pointerEvents: "none",
                }} />
              )}
              {grid && (
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                  backgroundSize: "16.66% 16.66%",
                }} />
              )}
              <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
                <div style={{ fontSize: 28, opacity: 0.08, marginBottom: 6 }}>🎬</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{proj.width}×{proj.height}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", marginTop: 2 }}>{FMT(ct)}</div>
                <div style={{
                  marginTop: 8, width: 80, height: 2,
                  background: "rgba(255,255,255,0.04)", borderRadius: "50%", overflow: "hidden", marginLeft: "auto", marginRight: "auto",
                }}>
                  <div style={{ height: "100%", background: "rgba(59,130,246,0.25)", borderRadius: "50%", width: `${playheadPos}%` }} />
                </div>
              </div>
              <div style={{
                position: "absolute", top: 6, left: 6, display: "flex", alignItems: "center", gap: 3,
                background: "rgba(0,0,0,0.5)", borderRadius: 4, padding: "2px 8px", fontSize: 12,
                color: "rgba(255,255,255,0.55)", fontFamily: "monospace",
              }}>
                GPU · {proj.width}×{proj.height} · {proj.fps}fps
              </div>
            </div>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 8px", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                  onClick={() => setPlaying(true)}
                  className="cs-preview-play"
                >
                  <S d={I.play} sz={18} style={{ color: "rgba(255,255,255,0.2)", marginLeft: 2 }} />
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Preview</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{proj.width}×{proj.height} · {proj.fps}fps</div>
              </div>
            </div>
          )}
        </div>

        <div style={{
          position: "absolute", right: 8, bottom: 8,
          display: "flex", alignItems: "center", gap: 2,
          background: "rgba(12,12,12,0.85)", border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: 6, padding: "3px 6px", backdropFilter: "blur(8px)",
        }}>
          <button onClick={() => setGrid(!grid)}
            style={{
              padding: 2, border: "none", cursor: "pointer", background: "none",
              color: grid ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.2)", display: "flex",
            }}
            className="cs-hover-soft"
          ><S d={I.grid} sz={10} /></button>
          <button onClick={() => setSafe(!safe)}
            style={{
              padding: 2, border: "none", cursor: "pointer", background: "none",
              color: safe ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.2)", display: "flex",
            }}
            className="cs-hover-soft"
          ><S d={I.lay} sz={10} /></button>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.05)", margin: "0 2px" }} />
          <select value={aspect} onChange={(e) => setAspect(e.target.value)}
            style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.35)",
              fontSize: 11, cursor: "pointer", outline: "none", padding: "1px 2px",
              fontFamily: "inherit",
            }}
          >
            {ASPECTS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.05)", margin: "0 2px" }} />
          <button onClick={() => setPz((z) => Math.max(25, z - 15))}
            style={{ padding: 2, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.2)", display: "flex" }}
            className="cs-hover-soft"
          ><S d={I.zoO} sz={9} /></button>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", width: 26, textAlign: "center", fontFamily: "monospace" }}>{pz}%</span>
          <button onClick={() => setPz((z) => Math.min(200, z + 15))}
            style={{ padding: 2, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.2)", display: "flex" }}
            className="cs-hover-soft"
          ><S d={I.zoI} sz={9} /></button>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.05)", margin: "0 2px" }} />
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowQual(!showQual)}
              style={{ padding: "1px 4px", border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.42)", fontSize: 12, fontFamily: "inherit" }}
              className="cs-hover-soft"
            >{qual}</button>
            {showQual && (
              <div style={{
                position: "absolute", bottom: "100%", right: 0, marginBottom: 4,
                background: "#151515", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6, padding: 2, zIndex: 50,
              }}>
                {["Auto", "1080p", "720p", "540p"].map((q) => (
                  <button key={q} onClick={() => { setQual(q); setShowQual(false); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left", padding: "3px 10px",
                      fontSize: 11, border: "none", cursor: "pointer", fontFamily: "inherit",
                      background: qual === q ? "rgba(255,255,255,0.08)" : "transparent",
                      color: qual === q ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                      borderRadius: 3,
                    }}
                    className={qual !== q ? "cs-hover-soft" : ""}
                  >{q}</button>
                ))}
              </div>
            )}
          </div>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.05)", margin: "0 2px" }} />
          <button onClick={toggleFs}
            style={{ padding: 2, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.2)", display: "flex" }}
            className="cs-hover-soft"
          ><S d={I.full} sz={10} /></button>
        </div>
      </div>

      <div style={{
        height: 36, flexShrink: 0, background: "#0c0c0c",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", padding: "0 8px", gap: 4,
      }}>
        <Bi d={I.skipB} tip="Start" sz={12} onClick={() => { setCt(0); setPlaying(false); }} />
        <button onClick={() => setPlaying(!playing)}
          style={{
            padding: 4, borderRadius: 4, border: "none", cursor: "pointer",
            background: "none",
            color: playing ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.5)",
            display: "flex", transition: "color 0.1s",
          }}
          className="cs-hover-soft"
        >
          <S d={playing ? I.pause : I.play} sz={15} />
        </button>
        <Bi d={I.skipF} tip="End" sz={12} onClick={() => { setCt(proj.duration); setPlaying(false); }} />
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", fontFamily: "monospace", width: 52, textAlign: "right" }}>{FMT(ct)}</span>
        <div
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setCt(Math.max(0, Math.min(proj.duration, ((e.clientX - rect.left) / rect.width) * proj.duration)));
          }}
          style={{
            flex: 1, position: "relative", height: 12, cursor: "pointer",
            display: "flex", alignItems: "center",
          }}
        >
          <div style={{
            position: "absolute", left: 0, right: 0, height: 3,
            background: "rgba(255,255,255,0.04)", borderRadius: "50%", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", background: "rgba(59,130,246,0.5)", borderRadius: "50%",
              transition: "width 0.08s linear", width: `${playheadPos}%`,
            }} />
          </div>
          <div style={{
            position: "absolute", height: 10, width: 10, borderRadius: "50%",
            background: "#3b82f6", left: `calc(${playheadPos}% - 5px)`,
            opacity: 0, transition: "opacity 0.1s",
          }} className="cs-scrub-thumb" />
        </div>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", width: 52 }}>{FMT(proj.duration)}</span>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.05)", margin: "0 4px" }} />
        <button onClick={() => setCt((t) => Math.max(0, t - 1 / proj.fps))}
          style={{ padding: 3, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.2)", display: "flex" }}
          className="cs-hover-soft"
        ><S d={I.skipB} sz={9} /></button>
        <button onClick={() => setCt((t) => Math.min(proj.duration, t + 1 / proj.fps))}
          style={{ padding: 3, border: "none", cursor: "pointer", background: "none", color: "rgba(255,255,255,0.2)", display: "flex" }}
          className="cs-hover-soft"
        ><S d={I.skipF} sz={9} /></button>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.05)", margin: "0 4px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <S d={I.music} sz={11} style={{ color: "rgba(255,255,255,0.35)" }} />
          <input type="range" min={0} max={100} value={vol} onChange={(e) => setVol(+e.target.value)}
            style={{
              width: 48, height: 2, accentColor: "#3b82f6", cursor: "pointer",
              background: "rgba(255,255,255,0.04)", borderRadius: "50%", appearance: "none",
            }}
          />
        </div>
      </div>

      <style>{`
        .cs-preview-play:hover { border-color: rgba(255,255,255,0.15) !important; background: rgba(255,255,255,0.02) !important; }
        .cs-preview-play:hover svg { color: rgba(255,255,255,0.4) !important; }
        .cs-scrub-thumb { opacity: 0 !important; }
        [class*="flex"]:hover > .cs-scrub-thumb { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
