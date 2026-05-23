import React, { useRef, useState } from "react";
import { I, S, Bi, FMT } from "./utils";

export default function PreviewPanel({ playing, setPlaying, ct, setCt, proj, vol, setVol }) {
  const ref = useRef(null);
  const [pz, setPz] = useState(80);
  const [grid, setGrid] = useState(false);
  const [safe, setSafe] = useState(false);
  const [qual, setQual] = useState("Auto");
  const [aspect, setAspect] = useState("16:9");
  const [showQual, setShowQual] = useState(false);
  const toggleFs = () => { if (!document.fullscreenElement) ref.current?.requestFullscreen(); else document.exitFullscreen(); };

  const baseW = Math.min(520, window.innerWidth * 0.3);
  const ars = { "16:9": 16 / 9, "9:16": 9 / 16, "4:3": 4 / 3, "1:1": 1 };
  const ar = ars[aspect] || 16 / 9;
  const baseH = baseW / ar;

  const playheadPos = proj.duration > 0 ? (ct / proj.duration) * 100 : 0;

  return (
    <div ref={ref} className="flex-1 flex flex-col min-h-0 bg-[#080808]">
      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden">
        <div className="rounded-lg overflow-hidden shadow-2xl border border-white/8 bg-black relative" style={{ width: baseW, height: baseH, transform: `scale(${pz / 100})` }}>
          {playing || ct > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, hsl(${(ct * 25) % 360}, 30%, 10%), hsl(${(ct * 25 + 80) % 360}, 25%, 14%))` }} />
              {safe && <div className="absolute inset-[10%] border border-white/15 rounded-sm pointer-events-none" />}
              {grid && <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "16.66% 16.66%" }} />}
              <div className="relative z-10 text-center px-4">
                <div className="text-3xl mb-1 opacity-10">🎬</div>
                <div className="text-[8px] text-white/6 font-mono">{proj.width}×{proj.height}</div>
                <div className="text-[8px] text-white/6 font-mono mt-0.5">{FMT(ct)}</div>
                <div className="mt-2 w-32 h-[2px] bg-white/5 rounded-full mx-auto overflow-hidden"><div className="h-full bg-emerald-500/30 rounded-full" style={{ width: `${playheadPos}%` }} /></div>
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5 text-[7px] text-white/25">GPU · {proj.width}×{proj.height} · {proj.fps}fps</div>
              <div className="absolute top-2 right-2 bg-black/40 rounded px-1.5 py-0.5 text-[7px] text-white/25">● Live</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full border border-white/8 flex items-center justify-center mx-auto mb-2.5 cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all group" onClick={() => setPlaying(true)}>
                  <S d={I.play} sz={22} style={{ color: "rgba(255,255,255,0.25)", marginLeft: 2 }} />
                </div>
                <div className="text-[10px] text-white/10">Preview</div>
                <div className="text-[7px] text-white/6 mt-0.5">{proj.width}×{proj.height} · {proj.fps}fps · {aspect}</div>
              </div>
            </div>
          )}
        </div>

        {/* Overlay controls */}
        <div className="absolute right-3 bottom-3 flex items-center gap-1 bg-[#0c0c0c]/90 border border-white/6 rounded-md px-2 py-1 backdrop-blur-sm shadow-lg">
          <button onClick={() => setGrid(!grid)} className={`p-0.5 ${grid ? "text-emerald-400/60" : "text-white/18 hover:text-white/35"}`}><S d={I.snap} sz={11} /></button>
          <button onClick={() => setSafe(!safe)} className={`p-0.5 ${safe ? "text-emerald-400/60" : "text-white/18 hover:text-white/35"}`}><S d={I.lay} sz={11} /></button>
          <div className="w-px h-3 bg-white/6 mx-0.5" />

          {/* Aspect ratio selector */}
          <div className="relative">
            <button onClick={() => setAspect({ "16:9": "9:16", "9:16": "4:3", "4:3": "1:1", "1:1": "16:9" }[aspect])} className="p-0.5 text-white/18 hover:text-white/35 text-[8px]">{aspect}</button>
          </div>
          <div className="w-px h-3 bg-white/6 mx-0.5" />

          <button onClick={() => setPz((z) => Math.max(25, z - 15))} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.zoO} sz={11} /></button>
          <span className="text-[8px] text-white/25 w-6 text-center tabular-nums">{pz}%</span>
          <button onClick={() => setPz((z) => Math.min(200, z + 15))} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.zoI} sz={11} /></button>

          {/* Quality selector */}
          <div className="relative">
            <button onClick={() => setShowQual(!showQual)} className="p-0.5 text-white/18 hover:text-white/35 text-[8px]">{qual}</button>
            {showQual && <div className="absolute bottom-full right-0 mb-1 bg-[#1a1a1a] border border-white/10 rounded-lg p-1 shadow-xl z-50">
              {["Auto", "1080p", "720p", "540p"].map((q) => <button key={q} onClick={() => { setQual(q); setShowQual(false); }} className={`block w-full text-left text-[8px] px-2 py-1 rounded ${qual === q ? "text-emerald-400 bg-white/10" : "text-white/35 hover:bg-white/5"}`}>{q}</button>)}
            </div>}
          </div>

          <div className="w-px h-3 bg-white/6 mx-0.5" />
          <button onClick={toggleFs} className="p-0.5 text-white/18 hover:text-white/35"><S d={I.full} sz={11} /></button>
        </div>
      </div>

      {/* Playback bar */}
      <div className="h-10 flex-shrink-0 bg-[#0c0c0c] border-t border-white/6 flex items-center px-3 gap-1.5">
        <Bi d={I.skipB} tip="Start" sz={14} onClick={() => { setCt(0); setPlaying(false); }} />
        <button onClick={() => setPlaying(!playing)} className={`p-1 rounded hover:bg-white/10 transition-colors ${playing ? "text-emerald-400" : "text-white/55 hover:text-white/85"}`}>
          <S d={playing ? I.pause : I.play} sz={17} />
        </button>
        <Bi d={I.skipF} tip="End" sz={14} onClick={() => { setCt(proj.duration); setPlaying(false); }} />
        <span className="text-[10px] text-white/25 font-mono w-12 text-right tabular-nums">{FMT(ct)}</span>
        <div className="flex-1 relative h-3 flex items-center group cursor-pointer"
          onMouseDown={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setCt(Math.max(0, Math.min(proj.duration, ((e.clientX - rect.left) / rect.width) * proj.duration))); }}
        >
          <div className="absolute inset-x-0 h-[3px] bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500/60 rounded-full transition-all duration-75" style={{ width: `${playheadPos}%` }} />
          </div>
          <div className="absolute h-full w-[10px] -ml-[5px] left-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${playheadPos}%` }}>
            <div className="w-[10px] h-[10px] bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 mt-[0px]" />
          </div>
        </div>
        <span className="text-[10px] text-white/18 font-mono w-12 tabular-nums">{FMT(proj.duration)}</span>
        <div className="w-px h-5 bg-white/6 mx-1" />
        <Bi d={I.snap} tip="Previous Frame" sz={14} onClick={() => setCt((t) => Math.max(0, t - 1 / proj.fps))} />
        <Bi d={I.snap} tip="Next Frame" sz={14} onClick={() => setCt((t) => Math.min(proj.duration, t + 1 / proj.fps))} style={{ transform: "scaleX(-1)" }} />
        <div className="w-px h-5 bg-white/6 mx-1" />
        <div className="flex items-center gap-1">
          <S d={I.music} sz={13} style={{ color: "rgba(255,255,255,0.2)" }} />
          <input type="range" min={0} max={100} value={vol} onChange={(e) => setVol(+e.target.value)} className="w-14 h-[2px] accent-emerald-500 bg-white/5 rounded-full appearance-none cursor-pointer" />
        </div>
      </div>
    </div>
  );
}
