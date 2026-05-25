import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { I, S, Bi, FMT } from "./utils";

const ASPECTS = [
  { id: "16:9", ratio: 16 / 9, label: "16:9" },
  { id: "9:16", ratio: 9 / 16, label: "9:16" },
  { id: "4:3", ratio: 4 / 3, label: "4:3" },
  { id: "1:1", ratio: 1, label: "1:1" },
];

function clipStyle(effects = []) {
  const f = [];
  for (const ef of effects) {
    const a = ef.asset || ef;
    const id = (a.id || a.type || "").toLowerCase();
    if (id === "blur" || id === "mblur") f.push(`blur(${a.intensity || 4}px)`);
    else if (id === "bw" || id === "black") f.push("grayscale(1)");
    else if (id === "sepia") f.push("sepia(1)");
    else if (id === "glow" || id === "bloom") f.push("brightness(1.3) saturate(1.2)");
    else if (id === "vintage") f.push("sepia(0.5) contrast(0.9) brightness(0.85)");
    else if (id === "noise" || id === "film") f.push("contrast(1.1) brightness(0.85) saturate(0.8)");
    else if (id === "dream") f.push("blur(2px) brightness(1.1) saturate(1.1)");
    else if (id === "glitch") f.push("hue-rotate(90deg) contrast(1.5) saturate(1.3)");
    else if (id === "vhs") f.push("hue-rotate(30deg) contrast(1.3) saturate(1.5) blur(0.5px)");
    else if (id === "sharp" || id === "sharpen") f.push("contrast(1.4) saturate(1.1)");
    else if (id === "neon") f.push("hue-rotate(180deg) saturate(2) brightness(1.2) contrast(1.3)");
    else if (id === "invert") f.push("invert(1)");
    else if (id === "mirror") f.push("scaleX(-1)");
    else if (id === "halftone") f.push("contrast(2) brightness(0.8) saturate(0.5)");
    else if (id === "sketch") f.push("contrast(2.5) grayscale(1) brightness(0.9)");
    else if (id === "chroma") f.push("contrast(1.1) saturate(1.3)");
    else if (id === "zoom" || id === "zoomt") f.push("scale(1.15)");
    else if (id === "lens") f.push("brightness(1.2) saturate(1.3) blur(0.3px)");
    else if (id === "cine" || id === "cinematic") f.push("contrast(1.15) saturate(0.85) brightness(0.9)");
    else if (id === "rgb" || id === "rgb split") f.push("hue-rotate(45deg) saturate(1.5) contrast(1.2)");
    else if (id === "shake") f.push("contrast(1.05)");
    else if (id === "pixel" || id === "pixelate") f.push("contrast(1.5) saturate(0.8)");
  }
  return f.length ? { filter: f.join(" ") } : {};
}

function findClipAtTime(tracks, time) {
  for (const track of tracks) {
    if (!track.visible) continue;
    for (const clip of track.clips) {
      if (time >= clip.start && time < clip.start + clip.duration) {
        return clip;
      }
    }
  }
  return null;
}

export default function PreviewPanel({ playing, setPlaying, ct, setCt, proj, vol, setVol }) {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const audioRefs = useRef({});
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [pz, setPz] = useState(80);
  const [grid, setGrid] = useState(false);
  const [safe, setSafe] = useState(false);
  const [qual, setQual] = useState("Auto");
  const [aspect, setAspect] = useState("16:9");
  const [showQual, setShowQual] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState(null);

  const ar = ASPECTS.find((a) => a.id === aspect)?.ratio || 16 / 9;
  const previewW = Math.min(480, window.innerWidth * 0.28);
  const previewH = previewW / ar;
  const playheadPos = proj.duration > 0 ? (ct / proj.duration) * 100 : 0;

  const currentClip = useMemo(() => findClipAtTime(proj.tracks, ct), [proj.tracks, ct]);

  const toggleFs = () => {
    try {
      if (!document.fullscreenElement) ref.current?.requestFullscreen({ navigationUI: "hide" });
      else document.exitFullscreen();
    } catch {}
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !currentClip) return;
    const off = ct - currentClip.start;
    if (Math.abs(v.currentTime - off) > 0.15) {
      v.currentTime = Math.max(0, Math.min(off, currentClip.duration));
    }
  }, [ct, currentClip]);

  useEffect(() => {
    Object.values(audioRefs.current).forEach((a) => { try { if (a) a.volume = vol / 100; } catch {} });
  }, [vol]);

  useEffect(() => {
    setError(null);
    if (!playing) {
      Object.values(audioRefs.current).forEach((a) => { try { a?.pause(); } catch {} });
      Object.values(audioRefs.current).forEach((a) => { try { if (a) a.currentTime = 0; } catch {} });
      if (videoRef.current) { try { videoRef.current.pause(); } catch {} }
      return;
    }
    const clip = currentClip;
    if (clip?.url) {
      const isVid = clip.type === "video" || clip.file?.type?.startsWith("video");
      const isAud = clip.type === "audio" || clip.file?.type?.startsWith("audio");
      const off = ct - clip.start;
      if (isVid && videoRef.current) {
        videoRef.current.volume = vol / 100;
        videoRef.current.currentTime = Math.max(0, Math.min(off, clip.duration));
        videoRef.current.play().catch(() => setError("Video playback failed"));
      }
      if (isAud) {
        const aEl = audioRefs.current[clip.id];
        if (aEl) {
          aEl.volume = vol / 100;
          aEl.currentTime = Math.max(0, Math.min(off, clip.duration));
          aEl.play().catch(() => setError("Audio playback failed"));
        }
      }
    }
    let raf = true;
    lastTimeRef.current = performance.now();
    const tick = (now) => {
      if (!raf) return;
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      setCt((t) => {
        const n = t + dt;
        if (n >= proj.duration) { setPlaying(false); return 0; }
        return n;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { raf = false; cancelAnimationFrame(rafRef.current); };
  }, [playing, currentClip, ct, setCt, setPlaying, proj.duration, vol]);

  const hasMedia = currentClip?.url;

  return (
    <div ref={ref} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, background: "#080808" }}>
      {/* Hidden audio elements for all clips */}
      {proj.tracks.flatMap((t) => t.clips.filter((c) => (c.url || c.src) && (c.type === "audio" || c.file?.type?.startsWith("audio")))).map((c) => (
        <audio key={c.id} ref={(el) => { if (el) audioRefs.current[c.id] = el; }}
          src={c.src || c.url} preload="auto" loop={false}
          style={{ display: "none" }}
        />
      ))}
      {/* Hidden video element for video clips */}
      {currentClip?.url && (currentClip.type === "video" || currentClip.file?.type?.startsWith("video")) && (
        <video ref={videoRef} src={currentClip.url} preload="auto"
          style={{ display: "none" }}
          onError={() => setError("Video failed to load")}
        />
      )}

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
          {error && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.8)",
            }}>
              <span style={{ fontSize: 13, color: "rgba(239,68,68,0.7)", padding: 8, textAlign: "center" }}>{error}</span>
              <button onClick={() => setError(null)} style={{
                position: "absolute", top: 4, right: 4, background: "none", border: "none",
                color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11, fontFamily: "inherit",
              }}>✕</button>
            </div>
          )}
          {currentClip?.url ? (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              {currentClip.type === "image" || currentClip.file?.type?.startsWith("image") ? (
                <img src={currentClip.url} alt={currentClip.name}
                  style={{
                    width: "100%", height: "100%", objectFit: "contain",
                    ...clipStyle(currentClip.effects),
                  }}
                  onError={() => setError("Image failed to load")}
                />
              ) : currentClip.type === "video" || currentClip.file?.type?.startsWith("video") ? (
                <video
                  style={{
                    width: "100%", height: "100%", objectFit: "contain",
                    ...clipStyle(currentClip.effects),
                  }}
                  onError={() => setError("Video failed to load")}
                >
                  <source src={currentClip.url} />
                </video>
              ) : (
                <div style={{
                  width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: 8,
                  background: `linear-gradient(135deg, hsl(${(ct * 25) % 360}, 20%, 8%), hsl(${(ct * 25 + 60) % 360}, 15%, 12%))`,
                }}>
                  <div style={{ fontSize: 24, opacity: 0.15 }}>🎵</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>{currentClip.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>{FMT(ct)}</div>
                </div>
              )}
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
              <div style={{
                position: "absolute", top: 6, left: 6, display: "flex", alignItems: "center", gap: 3,
                background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "2px 8px", fontSize: 11,
                color: "rgba(255,255,255,0.45)", fontFamily: "monospace",
              }}>
                {currentClip.name} · {proj.width}×{proj.height}
              </div>
              {(currentClip.effects?.length > 0) && (
                <div style={{
                  position: "absolute", top: 6, right: 6, display: "flex", gap: 3,
                }}>
                  {currentClip.effects.map((ef, i) => {
                    const a = ef.asset || ef;
                    return <span key={i} style={{
                      fontSize: 10, padding: "1px 5px", borderRadius: 3,
                      background: "rgba(59,130,246,0.15)", color: "rgba(59,130,246,0.6)",
                    }}>{a.name || a.id || a.type || "fx"}</span>;
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {playing || ct > 0 ? (
                <div style={{
                  width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(135deg, hsl(${(ct * 25) % 360}, 25%, 8%), hsl(${(ct * 25 + 80) % 360}, 20%, 12%))`,
                  flexDirection: "column",
                }}>
                  <div style={{ fontSize: 28, opacity: 0.08, marginBottom: 4 }}>🎬</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{proj.width}×{proj.height}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", marginTop: 2 }}>{FMT(ct)}</div>
                  <div style={{ marginTop: 8, width: 80, height: 2, background: "rgba(255,255,255,0.04)", borderRadius: "50%", overflow: "hidden", margin: "8px auto 0" }}>
                    <div style={{ height: "100%", background: "rgba(59,130,246,0.25)", borderRadius: "50%", width: `${playheadPos}%` }} />
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 8px", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                    onClick={() => { if (proj.duration > 0) setPlaying(true); }}
                    className="cs-preview-play"
                  >
                    <S d={I.play} sz={18} style={{ color: "rgba(255,255,255,0.2)", marginLeft: 2 }} />
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Preview</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{proj.width}×{proj.height} · {proj.fps}fps</div>
                </div>
              )}
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
        <button onClick={() => { if (proj.duration > 0) setPlaying(!playing); }}
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
