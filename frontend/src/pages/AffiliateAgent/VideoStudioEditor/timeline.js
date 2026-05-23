import React, { useState, useRef, useEffect, useCallback } from "react";
import { I, S, Tp, Bi, Wv, ThS, PPS_BASE, TRACK_H, LABEL_W, clipColor, badge, Rng } from "./utils";

export default function Timeline({ proj, setProj, ct, setCt, zoom, setZoom, playing, setPlaying, sel, setSel }) {
  const rulerRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [trim, setTrim] = useState(null);
  const [showSpeed, setShowSpeed] = useState(false);
  const pps = PPS_BASE * (zoom / 100);
  const totalW = Math.max(proj.duration * pps + 400, 3000);

  const findSnap = useCallback((ns, cId, tId) => {
    const track = proj.tracks.find((t) => t.id === tId);
    if (!track) return ns;
    const others = track.clips.filter((c) => c.id !== cId);
    let snap = ns, md = 5 / pps;
    for (const c of others) {
      for (const t of [c.start, c.start + c.duration]) {
        const d = Math.abs(ns - t);
        if (d < md) { snap = t; md = d; }
      }
    }
    return Math.max(0, snap);
  }, [proj, pps]);

  const handleClipMD = useCallback((e, clip, tId) => {
    if (e.button !== 0) return; e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isL = (e.clientX - rect.left) < 7, isR = (rect.right - e.clientX) < 7;
    if (isL || isR) setTrim({ clip, tId, side: isL ? "left" : "right", sx: e.clientX, os: clip.start, od: clip.duration });
    else setDrag({ clip, tId, sx: e.clientX, os: clip.start });
    setSel({ ...clip, trackId: tId });
  }, [setSel]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => { const snapped = findSnap(drag.os + (e.clientX - drag.sx) / pps, drag.clip.id, drag.tId); setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === drag.tId ? { ...t, clips: t.clips.map((c) => c.id === drag.clip.id ? { ...c, start: snapped } : c) } : t) })); };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag, pps, findSnap, setProj]);

  useEffect(() => {
    if (!trim) return;
    const onMove = (e) => { const dt = (e.clientX - trim.sx) / pps; if (trim.side === "left") { const ns = Math.max(0, Math.min(trim.os + dt, trim.os + trim.od - 0.5)); setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === trim.tId ? { ...t, clips: t.clips.map((c) => c.id === trim.clip.id ? { ...c, start: ns, duration: Math.max(0.5, trim.od - (ns - trim.os)) } : c) } : t) })); } else { setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === trim.tId ? { ...t, clips: t.clips.map((c) => c.id === trim.clip.id ? { ...c, duration: Math.max(0.5, trim.od + dt) } : c) } : t) })); } };
    const onUp = () => setTrim(null);
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [trim, pps, setProj]);

  const handleRulerMD = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = rulerRef.current?.getBoundingClientRect(); if (!rect) return;
    const update = (cx) => setCt(Math.max(0, Math.min(proj.duration, (cx - rect.left) / pps)));
    update(e.clientX);
    const onMove = (ev) => update(ev.clientX); const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  }, [pps, proj.duration, setCt]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === " " || e.key === "Space") { e.preventDefault(); setPlaying((p) => !p); }
      if ((e.key === "Delete" || e.key === "Backspace") && sel?.trackId) { setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== sel.id) } : t) })); setSel(null); }
      if (e.key === "ArrowLeft" && e.shiftKey) { e.preventDefault(); setCt((t) => Math.max(0, t - 0.5)); }
      if (e.key === "ArrowRight" && e.shiftKey) { e.preventDefault(); setCt((t) => Math.min(proj.duration, t + 0.5)); }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); }
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, setProj, setCt, setPlaying, proj.duration]);

  const handleDrop = useCallback((e, tId) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data) return;
    try {
      const item = JSON.parse(data);
      const tlRect = rulerRef.current?.getBoundingClientRect();
      const st = Math.max(0, (e.clientX - (tlRect?.left || 0)) / pps);
      const dur = item.dur || 4;
      const nc = { id: UID(), name: item.name, start: st, duration: dur, type: item.type || "video", t: item.t || item.thumb || item.e || "🎬" };
      setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === tId ? { ...t, clips: [...t.clips, nc].sort((a, b) => a.start - b.start) } : t) }));
      setSel({ ...nc, trackId: tId });
    } catch {}
  }, [pps, setProj, setSel]);

  const UID = () => Math.random().toString(36).slice(2, 9);

  const handleSplit = useCallback(() => {
    if (!sel?.trackId) return;
    setProj((prev) => {
      const track = prev.tracks.find((t) => t.id === sel.trackId); if (!track) return prev;
      const clip = track.clips.find((c) => c.id === sel.id); if (!clip || ct <= clip.start || ct >= clip.start + clip.duration) return prev;
      const lD = ct - clip.start, rD = clip.duration - lD; if (lD < 0.3 || rD < 0.3) return prev;
      const rc = { ...clip, id: UID(), start: ct, duration: rD };
      return { ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: [...t.clips.filter((c) => c.id !== sel.id), { ...clip, duration: lD }, rc].sort((a, b) => a.start - b.start) } : t) };
    });
  }, [sel, ct, setProj]);

  const handleDel = useCallback(() => { if (!sel?.trackId) return; setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: t.clips.filter((c) => c.id !== sel.id) } : t) })); setSel(null); }, [sel, setProj, setSel]);

  const handleDup = useCallback(() => { if (!sel?.trackId) return; setProj((prev) => { const track = prev.tracks.find((t) => t.id === sel.trackId); if (!track) return prev; const clip = track.clips.find((c) => c.id === sel.id); if (!clip) return prev; const d = { ...clip, id: UID(), start: clip.start + clip.duration + 0.5 }; return { ...prev, tracks: prev.tracks.map((t) => t.id === sel.trackId ? { ...t, clips: [...t.clips, d].sort((a, b) => a.start - b.start) } : t) }; }); }, [sel, setProj]);

  const toggleVis = useCallback((tid) => setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === tid ? { ...t, visible: !t.visible } : t) })), [setProj]);
  const toggleLock = useCallback((tid) => setProj((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === tid ? { ...t, locked: !t.locked } : t) })), [setProj]);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

  return (
    <div className="h-[260px] flex-shrink-0 border-t border-white/6 bg-[#0b0b0b] flex flex-col">
      {/* Toolbar */}
      <div className="h-8 flex-shrink-0 bg-[#0e0e0e] border-b border-white/6 flex items-center px-2 gap-0.5 overflow-x-auto scrollbar-none">
        <Tp text="Selection (V)" ch={<button className={`p-1 rounded ${sel ? "bg-white/10 text-white/55" : "text-white/20 hover:bg-white/5"}`}><S d={I.sel} sz={12} /></button>} />
        <div className="w-px h-3.5 bg-white/6 mx-0.5" />
        <Tp text="Split (S)" ch={<button onClick={handleSplit} className={`px-1.5 py-0.5 text-[9px] rounded ${sel ? "hover:bg-white/10 text-white/35 hover:text-white/65" : "text-white/12"}`}>Split</button>} />
        <Tp text="Delete (Del)" ch={<button onClick={handleDel} className={`px-1.5 py-0.5 text-[9px] rounded ${sel ? "hover:bg-white/10 text-white/35 hover:text-red-400" : "text-white/12"}`}>Del</button>} />
        <Tp text="Duplicate (D)" ch={<button onClick={handleDup} className={`px-1.5 py-0.5 text-[9px] rounded ${sel ? "hover:bg-white/10 text-white/35 hover:text-white/65" : "text-white/12"}`}>Dup</button>} />
        <div className="w-px h-3.5 bg-white/6 mx-0.5" />
        <Tp text="Cut" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Cut</button>} />
        <Tp text="Copy" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Copy</button>} />
        <Tp text="Paste" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Paste</button>} />
        <Tp text="Ripple Delete" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Ripple</button>} />
        <div className="w-px h-3.5 bg-white/6 mx-0.5" />
        <div className="relative">
          <Tp text="Speed" ch={<button onClick={() => setShowSpeed(!showSpeed)} className={`px-1.5 py-0.5 text-[9px] rounded ${showSpeed ? "bg-white/10 text-white/55" : "text-white/20 hover:bg-white/5"}`}>Speed</button>} />
          {showSpeed && <div className="absolute bottom-full left-0 mb-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-2 shadow-xl z-50 flex gap-1">
            {speeds.map((s) => <button key={s} onClick={() => setShowSpeed(false)} className={`text-[9px] px-2 py-1 rounded ${s === 1 ? "bg-emerald-500/20 text-emerald-400" : "text-white/35 hover:bg-white/10"}`}>{s}x</button>)}
          </div>}
        </div>
        <Tp text="Chroma Key" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Chroma</button>} />
        <Tp text="Crop" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Crop</button>} />
        <Tp text="Captions" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">CC</button>} />
        <Tp text="Extract Audio" ch={<button className="px-1.5 py-0.5 text-[9px] rounded text-white/20 hover:bg-white/5">Audio</button>} />
        <div className="flex-1" />
        <Tp text="Add Marker (M)" ch={<button className="p-1 rounded text-white/20 hover:bg-white/5"><S d={I.mrk} sz={12} /></button>} />
        <Tp text="Snap" ch={<button className={`p-1 rounded text-white/35`}><S d={I.snap} sz={12} /></button>} />
        <div className="flex items-center gap-1 bg-white/4 rounded px-1.5 py-0.5 ml-1">
          <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.zoO} sz={10} /></button>
          <span className="text-[8px] text-white/22 w-6 text-center tabular-nums">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(400, z + 25))} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.zoI} sz={10} /></button>
        </div>
      </div>

      {/* Timeline body */}
      <div className="flex-1 flex min-h-0">
        {/* Track labels */}
        <div className="w-[148px] flex-shrink-0 border-r border-white/6 bg-[#0e0e0e] overflow-y-auto overflow-x-hidden">
          {proj.tracks.map((t) => {
            const b = badge(t.type);
            return (
              <div key={t.id} className="h-[48px] border-b border-white/[0.025] flex items-center px-2 gap-1" style={{ opacity: t.visible ? 1 : 0.25 }}>
                <button onClick={() => toggleLock(t.id)} className={`p-0.5 rounded flex-shrink-0 ${t.locked ? "text-amber-400/40" : "text-white/10 hover:text-white/25"}`}><S d={I.lockI} sz={10} /></button>
                <button onClick={() => toggleVis(t.id)} className="p-0.5 rounded text-white/12 hover:text-white/30 flex-shrink-0"><S d={t.visible ? I.eye : I.close} sz={10} /></button>
                <div className="flex items-center gap-1.5 min-w-0 ml-0.5">
                  <div className="w-[16px] h-[16px] rounded-sm flex items-center justify-center text-[7px] font-bold text-white/70 flex-shrink-0" style={{ background: b.bg }}>{b.l}</div>
                  <span className="text-[8px] text-white/30 truncate">{t.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tracks + Ruler */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Ruler */}
          <div ref={rulerRef} className="h-[22px] flex-shrink-0 border-b border-white/6 bg-[#0e0e0e] relative cursor-pointer select-none" onMouseDown={handleRulerMD}>
            <div className="h-full relative" style={{ width: totalW }}>
              {Array.from({ length: Math.ceil(proj.duration) + 1 }).map((_, i) => (
                <div key={i} className="absolute top-0 flex flex-col items-start" style={{ left: i * pps }}>
                  <span className="text-[7px] text-white/12 leading-[22px] ml-1.5 select-none tabular-nums">{i}s</span>
                </div>
              ))}
              {Array.from({ length: Math.ceil(proj.duration) * 5 }).map((_, i) => (
                <div key={`t-${i}`} className="absolute top-0 w-px h-[10px] bg-white/4" style={{ left: ((i + 1) / 5) * pps }} />
              ))}
              {(proj.markers || []).map((mk) => (
                <div key={mk.id} className="absolute top-0 bottom-0" style={{ left: mk.time * pps }}>
                  <div className="w-[9px] h-[9px] rounded-full mt-[6px] ml-[-4px] shadow-lg" style={{ background: mk.color }} />
                  <div className="absolute top-0 h-full w-px opacity-20" style={{ background: mk.color, left: 4.5 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Tracks area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <div className="relative" style={{ width: totalW, minWidth: "100%" }}>
              {proj.tracks.map((t) => (
                <div key={t.id} className="h-[48px] border-b border-white/[0.02] relative transition-all"
                  style={{ opacity: t.visible ? 1 : 0.2, display: t.visible ? undefined : "none" }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                  onDrop={(e) => handleDrop(e, t.id)}
                  onClick={() => setSel(null)}
                >
                  {Array.from({ length: Math.ceil(proj.duration) + 1 }).map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-white/[0.015]" style={{ left: i * pps }} />
                  ))}
                  {Array.from({ length: Math.ceil(proj.duration) * 5 }).map((_, i) => (
                    <div key={`g-${i}`} className="absolute top-0 bottom-0 w-px bg-white/[0.005]" style={{ left: ((i + 1) / 5) * pps }} />
                  ))}

                  {t.clips.map((clip) => {
                    const col = clipColor(clip.type);
                    const iSel = sel?.id === clip.id && sel?.trackId === t.id;
                    const lp = clip.start * pps;
                    const wp = Math.max(12, clip.duration * pps - 1);

                    return (
                      <div key={clip.id} className={`absolute top-[2px] h-[44px] rounded-[3px] border cursor-pointer overflow-hidden transition-shadow ${iSel ? "z-10 shadow-lg shadow-emerald-500/5" : "hover:shadow-sm"}`}
                        style={{ left: lp, width: wp, borderColor: iSel ? "rgba(34,197,94,0.6)" : col.bd, background: col.bg }}
                        onMouseDown={(e) => handleClipMD(e, clip, t.id)}
                      >
                        {clip.type === "video" && wp > 30 && <div className="absolute inset-0 rounded-[2px] overflow-hidden"><ThS dur={clip.duration} /></div>}
                        {clip.type === "audio" && wp > 20 && <div className="absolute inset-0 flex items-center justify-center px-1"><Wv w={Math.max(16, wp - 8)} h={26} c={col.bar} /></div>}
                        {clip.type === "text" && <div className="absolute inset-0 flex items-center px-2 gap-1"><span className="text-[9px] font-bold text-amber-400/50">{clip.t || "T"}</span>{wp > 55 && <span className="text-[7px] text-white/30 truncate">{clip.name}</span>}</div>}
                        {clip.type === "sticker" && <div className="absolute inset-0 flex items-center justify-center"><span className="text-base">{clip.t || "✨"}</span></div>}
                        {clip.type === "overlay" && <div className="absolute inset-0 flex items-center px-2 gap-1"><span className="text-sm">{clip.t || "🌫️"}</span>{wp > 50 && <span className="text-[7px] text-white/30 truncate">{clip.name}</span>}</div>}

                        {clip.type === "video" && wp > 55 && (
                          <div className="absolute bottom-0.5 left-1 right-1 flex items-center justify-between pointer-events-none">
                            <span className="text-[7px] text-white/75 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate max-w-[60%]">{clip.name}</span>
                            <span className="text-[6px] text-white/50 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tabular-nums">{clip.duration.toFixed(1)}s</span>
                          </div>
                        )}

                        {iSel && <>
                          <div className="absolute left-0 top-0 bottom-0 w-[5px] cursor-col-resize bg-white/20 hover:bg-white/30 rounded-l-[2px]" />
                          <div className="absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize bg-white/20 hover:bg-white/30 rounded-r-[2px]" />
                          <div className="absolute inset-0 rounded-[2px] ring-1 ring-emerald-500/40 pointer-events-none shadow-sm shadow-emerald-500/10" />
                        </>}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Playhead */}
              <div className="absolute top-0 bottom-0 w-px bg-red-500/50 z-20 pointer-events-none shadow-[0_0_6px_rgba(248,113,113,0.15)]" style={{ left: ct * pps }} />
              <div className="absolute -top-[4px] w-[10px] h-[10px] bg-red-500 rounded-sm rotate-45 z-20 pointer-events-none shadow-md" style={{ left: ct * pps - 5 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
