import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { I, S, Bi, FMT, SIDEBAR_MAP, INITIAL, UID } from "./utils";
import Timeline from "./timeline";
import PreviewPanel from "./preview";
import Inspector from "./inspector";
import ExportModal from "./exportModal";
import BrandMemoryPanel from "./brandMemory";
import {
  SideTab, MediaPanel, AudioPanel, TextPanel, StickerPanel,
  TransitionsPanel, EffectsPanel, LUTsPanel, ColorPanel,
  MotionPanel, AIPanel, AssetsPanel, TemplatesPanel,
  CaptionsPanel, BrandPanel
} from "./panels";

function TopBar({ proj, setProj, onImp, onExp, ct, dur, onMem }) {
  const [ed, setEd] = useState(false);
  const [nv, setNv] = useState(proj.name);
  const [sv, setSv] = useState(true);
  const ref = useRef(null);
  useEffect(() => { ed && ref.current?.focus(); }, [ed]);
  useEffect(() => { if (!sv) { const t = setTimeout(() => setSv(true), 600); return () => clearTimeout(t); } }, [sv]);
  const sub = () => { if (nv.trim()) setProj((p) => ({ ...p, name: nv.trim() })); setEd(false); };

  return (
    <div className="h-11 flex-shrink-0 bg-[#0c0c0c] border-b border-white/[0.06] flex items-center px-3 gap-1.5 z-40 select-none shadow-sm shadow-black/20">
      <div className="flex items-center gap-2 mr-1.5">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm shadow-emerald-500/10"><S d={I.logo} sz={11} /></div>
        <span className="text-xs font-bold text-white/70 tracking-tight">BRANPY</span>
      </div>
      <div className="w-px h-5 bg-white/6" />
      {ed ? (
        <input ref={ref} value={nv} onChange={(e) => setNv(e.target.value)} onBlur={sub} onKeyDown={(e) => e.key === "Enter" && sub()}
          className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[11px] text-white/60 outline-none w-32" autoFocus />
      ) : (
        <button onClick={() => setEd(true)} className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/4 text-[11px] text-white/40 hover:text-white/60">
          <S d={I.lay} sz={12} /><span className="max-w-[100px] truncate">{proj.name}</span><S d={I.chD} sz={11} />
        </button>
      )}
      <div className={`flex items-center gap-1 text-[8px] ${sv ? "text-emerald-500/40" : "text-amber-400/50"}`}>
        <div className={`w-1 h-1 rounded-full ${sv ? "bg-emerald-500/40" : "bg-amber-400/50 animate-pulse"}`} />{sv ? "Saved" : "Saving..."}
      </div>
      <div className="w-px h-5 bg-white/6 mx-0.5" />
      <Bi d={I.save} tip="Save" sz={13} />
      <Bi d={I.undo} tip="Undo (Ctrl+Z)" sz={13} />
      <Bi d={I.redo} tip="Redo (Ctrl+Shift+Z)" sz={13} />
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 bg-white/4 rounded px-2 py-0.5">
        <span className="text-[9px] text-white/20 font-mono tabular-nums">{FMT(ct)}</span>
        <span className="text-[9px] text-white/10">/</span>
        <span className="text-[9px] text-white/20 font-mono tabular-nums">{FMT(dur)}</span>
      </div>
      <div className="flex items-center gap-1 bg-white/4 rounded px-2 py-0.5 text-[9px] text-white/20">
        <span>16:9</span><S d={I.chD} sz={10} />
      </div>
      <button onClick={onMem} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-400/70 hover:text-purple-400 text-[10px] transition-all">
        <S d={I.memory} sz={12} /> Memory
      </button>
      <button onClick={onImp} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/6 hover:bg-white/10 text-white/35 hover:text-white/65 text-[10px] transition-all">
        <S d={I.imp} sz={12} />Import
      </button>
      <button onClick={onExp} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/70 hover:bg-emerald-500 text-white text-[10px] transition-all shadow-sm shadow-emerald-500/10">
        <S d={I.exp} sz={12} />Export
      </button>
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-[9px] font-bold text-white ml-0.5 cursor-pointer shadow-sm">J</div>
    </div>
  );
}

function LeftPanel({ tab, imm, onImp, fRef, onMDrag }) {
  return (
    <div className="w-[260px] flex-shrink-0 border-r border-white/6 bg-[#0d0d0d] flex flex-col min-h-0">
      <div className="h-9 flex-shrink-0 flex items-center px-3 border-b border-white/6 gap-2">
        <span className="text-[10px] font-semibold text-white/18 uppercase tracking-[0.15em]">
          {tab === "media" ? "Media" : tab === "audio" ? "Audio" : tab === "text" ? "Text" : tab === "sticker" ? "Stickers" : tab === "transitions" ? "Transitions" : tab === "effects" ? "Effects" : tab === "luts" ? "LUTs" : tab === "color" ? "Color" : tab === "motion" ? "Motion" : tab === "ai" ? "AI Tools" : tab === "assets" ? "Assets" : tab === "templates" ? "Templates" : tab === "captions" ? "Captions" : tab === "brand" ? "Brand Kit" : tab === "memory" ? "Brand Memory" : "Tools"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tab === "media" && <MediaPanel imm={imm} onImp={onImp} fRef={fRef} onMDrag={onMDrag} />}
        {tab === "audio" && <AudioPanel />}
        {tab === "text" && <TextPanel />}
        {tab === "sticker" && <StickerPanel />}
        {tab === "transitions" && <TransitionsPanel />}
        {tab === "effects" && <EffectsPanel />}
        {tab === "luts" && <LUTsPanel />}
        {tab === "color" && <ColorPanel />}
        {tab === "motion" && <MotionPanel />}
        {tab === "ai" && <AIPanel />}
        {tab === "assets" && <AssetsPanel />}
        {tab === "templates" && <TemplatesPanel />}
        {tab === "captions" && <CaptionsPanel />}
        {tab === "brand" && <BrandPanel />}
      </div>
    </div>
  );
}

export default function VideoStudioEditor() {
  const [proj, setProj] = useState(INITIAL);
  const [ct, setCt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [vol, setVol] = useState(80);
  const [sel, setSel] = useState(null);
  const [sTab, setSTab] = useState("media");
  const [imm, setImm] = useState([]);
  const [showExport, setShowExport] = useState(false);
  const [memories, setMemories] = useLocalStorage("branpy_memories", []);
  const [showMemories, setShowMemories] = useState(false);
  const fRef = useRef(null);
  const piRef = useRef(null);

  useEffect(() => {
    if (playing) {
      piRef.current = setInterval(() => {
        setCt((t) => t >= proj.duration ? (setPlaying(false), 0) : t + 1 / proj.fps);
      }, 1000 / proj.fps);
    }
    return () => clearInterval(piRef.current);
  }, [playing, proj.duration, proj.fps]);

  const handleImp = useCallback((files) => {
    const items = Array.from(files).map((f, i) => ({
      id: UID() + i, name: f.name,
      type: f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "audio" : "image",
      file: f, url: URL.createObjectURL(f), dur: 5 + (i % 3) * 2,
      thumb: f.type.startsWith("video") ? "🎬" : f.type.startsWith("audio") ? "🎵" : "🖼️",
    }));
    setImm((prev) => [...prev, ...items]);
  }, []);

  const handleMDrag = useCallback((e, item) => {
    try { e.dataTransfer.setData("application/json", JSON.stringify(item)); e.dataTransfer.effectAllowed = "copy"; } catch {}
  }, []);

  const handleApplyMemory = useCallback((mem) => {
    const memClip = { id: UID(), name: `🧠 ${mem.name}`, start: ct, duration: 3, type: "overlay", t: "🧠" };
    setProj((prev) => ({
      ...prev, duration: Math.max(prev.duration, ct + 3),
      tracks: prev.tracks.map((t) => t.id === "o1" ? { ...t, clips: [...t.clips, memClip].sort((a, b) => a.start - b.start) } : t),
    }));
  }, [ct]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] text-white overflow-hidden select-none">
      <TopBar
        proj={proj} setProj={setProj}
        onImp={() => fRef.current?.click()}
        onExp={() => setShowExport(true)}
        onMem={() => { setShowMemories(!showMemories); if (sTab !== "memory") setSTab("memory"); }}
        ct={ct} dur={proj.duration}
      />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar tools */}
        <div className="w-10 flex-shrink-0 bg-[#090909] border-r border-white/6 flex flex-col py-2 items-center">
          {Object.entries(SIDEBAR_MAP).map(([id, icon]) => (
            <SideTab key={id} icon={icon} label={id} active={sTab === id} onClick={() => { setSTab(id); if (id === "memory") setShowMemories(true); }} />
          ))}
        </div>

        {/* Left panel */}
        {sTab === "memory" && showMemories ? (
          <div className="w-[260px] flex-shrink-0 border-r border-white/6 bg-[#0d0d0d] flex flex-col min-h-0">
            <div className="h-9 flex-shrink-0 flex items-center px-3 border-b border-white/6">
              <span className="text-[10px] font-semibold text-white/18 uppercase tracking-[0.15em]">Brand Memory</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <BrandMemoryPanel memories={memories} setMemories={setMemories} onApplyMemory={handleApplyMemory} />
            </div>
          </div>
        ) : (
          <LeftPanel tab={sTab} imm={imm} onImp={handleImp} fRef={fRef} onMDrag={handleMDrag} />
        )}

        <PreviewPanel playing={playing} setPlaying={setPlaying} ct={ct} setCt={setCt} proj={proj} vol={vol} setVol={setVol} />
        <Inspector clip={sel} />
      </div>

      <Timeline proj={proj} setProj={setProj} ct={ct} setCt={setCt} zoom={zoom} setZoom={setZoom} playing={playing} setPlaying={setPlaying} sel={sel} setSel={setSel} />

      <input ref={fRef} type="file" multiple accept="video/*,audio/*,image/*" className="hidden" onChange={(e) => { if (e.target.files.length) { handleImp(e.target.files); e.target.value = ""; } }} />

      <ExportModal open={showExport} onClose={() => setShowExport(false)} proj={proj} />
    </div>
  );
}
