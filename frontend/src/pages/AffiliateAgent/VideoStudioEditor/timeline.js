import React, { useState, useRef, useEffect, useCallback } from "react";
import { I, S, Tp, Bi, Wv, ThS, PPS_BASE, TRACK_H, LABEL_W, clipColor, badge, FMT } from "./utils";

const UID = () => Math.random().toString(36).slice(2, 9);

export default function Timeline({ proj, setProj, ct, setCt, zoom, setZoom, playing, setPlaying, sel, setSel }) {
  const rulerRef = useRef(null);
  const tracksRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [trim, setTrim] = useState(null);
  const [showSpeed, setShowSpeed] = useState(false);
  const pps = PPS_BASE * (zoom / 100);
  const totalW = Math.max(proj.duration * pps + 400, 2000);

  const findSnap = useCallback((ns, cId, tId) => {
    const track = proj.tracks.find((t) => t.id === tId);
    if (!track) return ns;
    let snap = ns;
    let md = 5 / pps;
    for (const c of track.clips) {
      if (c.id === cId) continue;
      for (const t of [c.start, c.start + c.duration]) {
        const d = Math.abs(ns - t);
        if (d < md) { snap = t; md = d; }
      }
    }
    return Math.max(0, snap);
  }, [proj, pps]);

  const handleClipMD = useCallback((e, clip, tId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isL = (e.clientX - rect.left) < 6;
    const isR = (rect.right - e.clientX) < 6;
    if (isL || isR) {
      setTrim({ clip, tId, side: isL ? "left" : "right", sx: e.clientX, os: clip.start, od: clip.duration });
    } else {
      setDrag({ clip, tId, sx: e.clientX, os: clip.start });
    }
    setSel({ ...clip, trackId: tId });
  }, [setSel]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      const snapped = findSnap(drag.os + (e.clientX - drag.sx) / pps, drag.clip.id, drag.tId);
      setProj((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === drag.tId
            ? { ...t, clips: t.clips.map((c) => c.id === drag.clip.id ? { ...c, start: Math.max(0, snapped) } : c) }
            : t
        ),
      }));
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag, pps, findSnap, setProj]);

  useEffect(() => {
    if (!trim) return;
    const onMove = (e) => {
      const dt = (e.clientX - trim.sx) / pps;
      if (trim.side === "left") {
        const ns = Math.max(0, Math.min(trim.os + dt, trim.os + trim.od - 0.3));
        setProj((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.id === trim.tId
              ? { ...t, clips: t.clips.map((c) => c.id === trim.clip.id ? {
                ...c, start: ns, duration: Math.max(0.3, trim.od - (ns - trim.os))
              } : c) }
              : t
          ),
        }));
      } else {
        setProj((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) =>
            t.id === trim.tId
              ? { ...t, clips: t.clips.map((c) => c.id === trim.clip.id ? {
                ...c, duration: Math.max(0.3, trim.od + dt)
              } : c) }
              : t
          ),
        }));
      }
    };
    const onUp = () => setTrim(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [trim, pps, setProj]);

  const handleRulerMD = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = rulerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const update = (cx) => setCt(Math.max(0, Math.min(proj.duration, (cx - rect.left) / pps)));
    update(e.clientX);
    const onMove = (ev) => update(ev.clientX);
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pps, proj.duration, setCt]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === " " || e.key === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if ((e.key === "Delete" || e.key === "Backspace") && sel?.trackId) {
        setProj((prev) => ({
          ...prev,
          tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== sel.id) } : t),
        }));
        setSel(null);
      }
      if (e.key === "ArrowLeft" && e.shiftKey) { e.preventDefault(); setCt((t) => Math.max(0, t - 0.5)); }
      if (e.key === "ArrowRight" && e.shiftKey) { e.preventDefault(); setCt((t) => Math.min(proj.duration, t + 0.5)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, setProj, setCt, setPlaying, proj.duration]);

  const handleDrop = useCallback((e, tId) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      const item = JSON.parse(data);
      const tlRect = rulerRef.current?.getBoundingClientRect();
      const st = Math.max(0, (e.clientX - (tlRect?.left || 0)) / pps);
      const dur = item.dur || 4;
      const nc = {
        id: UID(), name: item.name, start: st, duration: dur,
        type: item.type || "video", t: item.t || item.thumb || item.e || "🎬",
        url: item.url || null,
        file: item.file || null,
        effects: item.effects || [],
      };
      setProj((prev) => ({
        ...prev,
        duration: Math.max(prev.duration, st + dur),
        tracks: prev.tracks.map((t) => t.id === tId ? {
          ...t, clips: [...t.clips, nc].sort((a, b) => a.start - b.start),
        } : t),
      }));
      setSel({ ...nc, trackId: tId });
    } catch {}
  }, [pps, setProj, setSel]);

  const handleSplit = useCallback(() => {
    if (!sel?.trackId) return;
    setProj((prev) => {
      const track = prev.tracks.find((t) => t.id === sel.trackId);
      if (!track) return prev;
      const clip = track.clips.find((c) => c.id === sel.id);
      if (!clip || ct <= clip.start || ct >= clip.start + clip.duration) return prev;
      const lD = ct - clip.start;
      const rD = clip.duration - lD;
      if (lD < 0.3 || rD < 0.3) return prev;
      const rc = { ...clip, id: UID(), start: ct, duration: rD };
      return {
        ...prev,
        tracks: prev.tracks.map((t) =>
          t.id === sel.trackId
            ? { ...t, clips: [...t.clips.filter((c) => c.id !== sel.id), { ...clip, duration: lD }, rc].sort((a, b) => a.start - b.start) }
            : t
        ),
      };
    });
  }, [sel, ct, setProj]);

  const handleDel = useCallback(() => {
    if (!sel?.trackId) return;
    setProj((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== sel.id) } : t),
    }));
    setSel(null);
  }, [sel, setProj, setSel]);

  const handleDup = useCallback(() => {
    if (!sel?.trackId) return;
    setProj((prev) => {
      const track = prev.tracks.find((t) => t.id === sel.trackId);
      if (!track) return prev;
      const clip = track.clips.find((c) => c.id === sel.id);
      if (!clip) return prev;
      const dc = { ...clip, id: UID(), start: clip.start + clip.duration + 0.5 };
      return {
        ...prev,
        duration: Math.max(prev.duration, dc.start + dc.duration),
        tracks: prev.tracks.map((t) =>
          t.id === sel.trackId ? { ...t, clips: [...t.clips, dc].sort((a, b) => a.start - b.start) } : t
        ),
      };
    });
  }, [sel, setProj]);

  const toggleVis = useCallback((tid) => setProj((prev) => ({
    ...prev, tracks: prev.tracks.map((t) => t.id === tid ? { ...t, visible: !t.visible } : t),
  })), [setProj]);

  const toggleLock = useCallback((tid) => setProj((prev) => ({
    ...prev, tracks: prev.tracks.map((t) => t.id === tid ? { ...t, locked: !t.locked } : t),
  })), [setProj]);

  return (
    <div style={{
      height: 220, flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)",
      background: "#0b0b0b", display: "flex", flexDirection: "column",
    }}>
      {/* Toolbar */}
      <div style={{
        height: 28, flexShrink: 0, background: "#0e0e0e",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", padding: "0 6px", gap: 2, overflowX: "auto",
      }}>
        <Tp text="Selection (V)" ch={
          <button style={{
            padding: 3, borderRadius: 3, border: "none", cursor: "pointer",
            background: sel ? "rgba(59,130,246,0.12)" : "transparent",
            color: sel ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.38)",
            display: "flex", fontFamily: "inherit",
          }} className="cs-tl-btn"><S d={I.sel} sz={11} /></button>
        } />
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.06)", margin: "0 2px" }} />
        <Tp text="Split (S)" ch={
          <button onClick={handleSplit}
            style={{
              padding: "2px 7px", fontSize: 13, borderRadius: 3, border: "none",
              cursor: sel ? "pointer" : "default", fontFamily: "inherit", fontWeight: 500,
              color: sel ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)",
              background: sel ? "rgba(255,255,255,0.04)" : "transparent",
            }}
            className={sel ? "cs-tl-btn" : ""}
          >Split</button>
        } />
        <Tp text="Duplicate (D)" ch={
          <button onClick={handleDup}
            style={{
              padding: "2px 7px", fontSize: 13, borderRadius: 3, border: "none",
              cursor: sel ? "pointer" : "default", fontFamily: "inherit", fontWeight: 500,
              color: sel ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)",
              background: sel ? "rgba(255,255,255,0.04)" : "transparent",
            }}
            className={sel ? "cs-tl-btn" : ""}
          >Dup</button>
        } />
        <Tp text="Delete (Del)" ch={
          <button onClick={handleDel}
            style={{
              padding: "2px 7px", fontSize: 13, borderRadius: 3, border: "none",
              cursor: sel ? "pointer" : "default", fontFamily: "inherit", fontWeight: 500,
              color: sel ? "rgba(239,68,68,0.65)" : "rgba(255,255,255,0.3)",
              background: sel ? "rgba(239,68,68,0.06)" : "transparent",
            }}
            className={sel ? "cs-tl-btn-del" : ""}
          >Del</button>
        } />
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.06)", margin: "0 2px" }} />
        <Tp text="Ripple Edit" ch={<button style={{ padding: "2px 7px", fontSize: 13, borderRadius: 3, border: "none", cursor: "pointer", color: "rgba(255,255,255,0.38)", background: "transparent", fontFamily: "inherit", fontWeight: 500 }} className="cs-tl-btn">Ripple</button>} />
        <Tp text="Snap" ch={<button style={{ padding: 3, borderRadius: 3, border: "none", cursor: "pointer", color: "rgba(59,130,246,0.6)", background: "rgba(59,130,246,0.08)", display: "flex" }}><S d={I.snap} sz={11} /></button>} />
        <div style={{ flex: 1 }} />
        <Tp text="Add Marker (M)" ch={<button style={{ padding: 3, borderRadius: 3, border: "none", cursor: "pointer", color: "rgba(255,255,255,0.38)", background: "transparent", display: "flex" }} className="cs-tl-btn"><S d={I.mrk} sz={11} /></button>} />
        <div style={{
          display: "flex", alignItems: "center", gap: 3,
          background: "rgba(255,255,255,0.03)", borderRadius: 4,
          padding: "2px 6px", border: "1px solid rgba(255,255,255,0.04)",
        }}>
          <button onClick={() => setZoom((z) => Math.max(25, z - 25))}
            style={{ padding: 2, border: "none", cursor: "pointer", color: "rgba(255,255,255,0.28)", background: "none", display: "flex" }}
            className="cs-tl-btn"
          ><S d={I.zoO} sz={10} /></button>
          <span style={{
            fontSize: 12, color: "rgba(255,255,255,0.45)", width: 26,
            textAlign: "center", fontFamily: "monospace", fontWeight: 500,
          }}>{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(400, z + 25))}
            style={{ padding: 2, border: "none", cursor: "pointer", color: "rgba(255,255,255,0.28)", background: "none", display: "flex" }}
            className="cs-tl-btn"
          ><S d={I.zoI} sz={10} /></button>
        </div>
      </div>

      {/* Timeline body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Track labels */}
        <div style={{
          width: LABEL_W, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.05)",
          background: "#0e0e0e", overflow: "hidden auto",
        }} className="cs-scrollbar">
          {proj.tracks.map((t) => {
            const b = badge(t.type);
            return (
              <div key={t.id} style={{
                height: TRACK_H, borderBottom: "1px solid rgba(255,255,255,0.02)",
                display: "flex", alignItems: "center", padding: "0 6px", gap: 4,
                opacity: t.visible ? 1 : 0.3,
              }}>
                <button onClick={() => toggleLock(t.id)}
                  style={{
                    padding: 2, borderRadius: 3, border: "none", cursor: "pointer",
                    color: t.locked ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.18)",
                    background: "none", display: "flex", flexShrink: 0,
                    transition: "color 0.12s",
                  }}
                  className="cs-tl-btn"
                >
                  <S d={I.lockI} sz={9} />
                </button>
                <button onClick={() => toggleVis(t.id)}
                  style={{
                    padding: 2, borderRadius: 3, border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.2)", background: "none", display: "flex", flexShrink: 0,
                    transition: "color 0.12s",
                  }}
                  className="cs-tl-btn"
                >
                  <S d={t.visible ? I.eye : I.close} sz={9} />
                </button>
                <div style={{
                  width: 18, height: 18, borderRadius: 3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)",
                  background: b.bg, flexShrink: 0, letterSpacing: 0,
                }}>
                  {b.l}
                </div>
                <span style={{
                  fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  marginLeft: 2,
                }}>{t.name}</span>
              </div>
            );
          })}
        </div>

        {/* Tracks + Ruler */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {/* Ruler */}
          <div ref={rulerRef}
            onMouseDown={handleRulerMD}
            style={{
              height: 22, flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "#0e0e0e", position: "relative", cursor: "pointer", overflow: "hidden",
            }}
          >
            <div style={{ height: "100%", position: "relative", width: totalW }}>
              {Array.from({ length: Math.ceil(proj.duration) + 1 }).map((_, i) => (
                <div key={i} style={{
                  position: "absolute", top: 0, left: i * pps, height: "100%",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                    <span style={{
                    position: "absolute", fontSize: 11, color: "rgba(255,255,255,0.35)",
                    top: 2, left: 4, fontFamily: "monospace", userSelect: "none",
                    fontWeight: 500,
                  }}>{i}s</span>
                  {i < proj.duration && (
                    <div style={{
                      position: "absolute", top: 12, left: 4,
                      display: "flex", gap: i * pps > 40 ? undefined : 0,
                    }}>
                      {Array.from({ length: 4 }).map((_, ti) => (
                        <div key={ti} style={{
                          width: 1, height: 5, background: "rgba(255,255,255,0.04)",
                          marginLeft: pps / 5,
                          position: "absolute", left: (ti + 1) * (pps / 5),
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(proj.markers || []).map((mk) => (
                <div key={mk.id} style={{ position: "absolute", top: 0, left: mk.time * pps, height: "100%", pointerEvents: "none" }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", marginTop: 5,
                    marginLeft: -4, background: mk.color,
                    boxShadow: `0 0 6px ${mk.color}40`,
                  }} />
                  <div style={{
                    position: "absolute", top: 0, height: "100%", width: 1,
                    background: mk.color, opacity: 0.2, left: 4,
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          <div ref={tracksRef} style={{ flex: 1, overflow: "auto" }} className="cs-scrollbar">
            <div style={{ position: "relative", width: totalW, minWidth: "100%" }}>
              {proj.tracks.map((t) => (
                <div key={t.id}
                  style={{
                    height: TRACK_H, borderBottom: "1px solid rgba(255,255,255,0.015)",
                    position: "relative", opacity: t.visible ? 1 : 0.15,
                    display: t.visible ? undefined : "none",
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                  onDrop={(e) => handleDrop(e, t.id)}
                  onClick={() => setSel(null)}
                >
                  {t.clips.map((clip) => {
                    const col = clipColor(clip.type);
                    const iSel = sel?.id === clip.id && sel?.trackId === t.id;
                    const lp = clip.start * pps;
                    const wp = Math.max(8, clip.duration * pps - 1);

                    return (
                      <div key={clip.id}
                        onMouseDown={(e) => handleClipMD(e, clip, t.id)}
                        style={{
                          position: "absolute", top: 1, height: TRACK_H - 2,
                          left: lp, width: wp, borderRadius: 3,
                          border: `1px solid ${iSel ? "rgba(59,130,246,0.5)" : col.bd}`,
                          background: col.bg, cursor: "pointer",
                          overflow: "hidden", zIndex: iSel ? 5 : 1,
                          transition: "box-shadow 0.1s, border-color 0.1s",
                          boxShadow: iSel
                            ? "0 0 10px rgba(59,130,246,0.12), inset 0 0 0 1px rgba(59,130,246,0.08)"
                            : "none",
                        }}
                        className="cs-tl-clip"
                      >
                        {(clip.type === "video" || clip.type === "image") && wp > 25 && (
                          <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 2 }}>
                            <ThS dur={clip.duration} />
                          </div>
                        )}
                        {clip.type === "audio" && wp > 15 && (
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: "0 3px",
                          }}>
                            <Wv w={Math.max(12, wp - 6)} h={TRACK_H - 10} c={col.bar} />
                          </div>
                        )}
                        {clip.type === "text" && (
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", padding: "0 5px", gap: 4,
                          }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,158,11,0.7)" }}>{clip.t || "T"}</span>
                            {wp > 40 && (
                              <span style={{
                                fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>{clip.name}</span>
                            )}
                          </div>
                        )}
                        {clip.type === "sticker" && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 14 }}>{clip.t || "✨"}</span>
                          </div>
                        )}
                        {clip.type === "overlay" && (
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", padding: "0 5px", gap: 4,
                          }}>
                            <span style={{ fontSize: 12 }}>{clip.t || "🌫️"}</span>
                            {wp > 35 && (
                              <span style={{
                              fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{clip.name}</span>
                            )}
                          </div>
                        )}
                        {(clip.type === "video" || clip.type === "image") && wp > 45 && (
                          <div style={{
                            position: "absolute", bottom: 2, left: 5, right: 5,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            pointerEvents: "none",
                          }}>
                            <span style={{
                              fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600,
                              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              maxWidth: "65%",
                            }}>{clip.name}</span>
                            <span style={{
                              fontSize: 11, color: "rgba(255,255,255,0.55)",
                              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                              fontFamily: "monospace",
                            }}>{clip.duration.toFixed(1)}s</span>
                          </div>
                        )}
                        {clip.effects?.length > 0 && wp > 50 && (
                          <div style={{
                            position: "absolute", top: 2, right: 2,
                            display: "flex", gap: 2, pointerEvents: "none",
                          }}>
                            {clip.effects.slice(0, 3).map((ef, i) => (
                              <span key={i} style={{
                                fontSize: 8, padding: "0 4px", borderRadius: 2,
                                background: "rgba(59,130,246,0.2)",
                                color: "rgba(59,130,246,0.5)",
                                lineHeight: "14px",
                              }}>{(ef.name || ef.type || "fx").slice(0, 6)}</span>
                            ))}
                          </div>
                        )}
                        {iSel && (
                          <>
                            <div style={{
                              position: "absolute", left: 0, top: 1, bottom: 1, width: 4,
                              cursor: "col-resize", background: "rgba(255,255,255,0.12)",
                              borderRight: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "2px 0 0 2px",
                            }} />
                            <div style={{
                              position: "absolute", right: 0, top: 1, bottom: 1, width: 4,
                              cursor: "col-resize", background: "rgba(255,255,255,0.12)",
                              borderLeft: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "0 2px 2px 0",
                            }} />
                            <div style={{
                              position: "absolute", inset: 0, borderRadius: 2,
                              boxShadow: "inset 0 0 0 1px rgba(59,130,246,0.35)",
                              pointerEvents: "none",
                            }} />
                          </>
                        )}
                      </div>
                    );
                  })}
                  {/* Playhead line across tracks */}
                </div>
              ))}

              {/* Playhead */}
              <div style={{
                position: "absolute", top: 0, bottom: 0, width: 1,
                background: "rgba(239,68,68,0.6)", zIndex: 20,
                pointerEvents: "none", left: ct * pps,
                boxShadow: "0 0 6px rgba(239,68,68,0.15)",
              }} />
              <div style={{
                position: "absolute", top: -20, width: 9, height: 9,
                background: "#ef4444", borderRadius: "50% 50% 50% 0",
                transform: "rotate(-45deg)", zIndex: 21, pointerEvents: "none",
                left: ct * pps - 4.5,
                boxShadow: "0 0 6px rgba(239,68,68,0.3)",
              }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cs-tl-btn:hover { background: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.5) !important; }
        .cs-tl-btn-del:hover { background: rgba(239,68,68,0.12) !important; color: rgba(239,68,68,0.6) !important; }
        .cs-tl-clip:hover { box-shadow: 0 0 6px rgba(59,130,246,0.15) !important; }
      `}</style>
    </div>
  );
}
