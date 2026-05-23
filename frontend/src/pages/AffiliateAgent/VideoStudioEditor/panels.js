import React, { useState, useMemo } from "react";
import {
  I, S, MEDIA_LIB, TEXT_STYLES, STICKER_SET, TRANS_LIST, EFX_CATS,
  LUTS, MOTION_PRESETS, AI_TOOLS, BRAND_ASSETS, TEMPLATES, Rng
} from "./utils";

export function SideTab({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full h-[38px] flex items-center justify-center relative ${active ? "text-emerald-400" : "text-white/18 hover:text-white/40"} transition-colors`} title={label}>
      <S d={icon} sz={15} />
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r bg-emerald-500" />}
    </button>
  );
}

const Ph = ({ label, ch, onClose }) => (
  <div className="h-9 flex-shrink-0 flex items-center px-3 border-b border-white/6 gap-2">
    <span className="text-[10px] font-semibold text-white/18 uppercase tracking-[0.15em]">{label}</span>
    <div className="flex-1" />
    {ch}
  </div>
);

const CATS = [{ id: "all", label: "All" }, { id: "video", label: "Videos" }, { id: "image", label: "Images" }, { id: "audio", label: "Audio" }];

export function MediaPanel({ imm, onImp, fRef, onMDrag }) {
  const [srch, setSrch] = useState("");
  const [cat, setCat] = useState("all");
  const all = useMemo(() => [...MEDIA_LIB, ...(imm || [])], [imm]);
  const filtered = useMemo(() => {
    let items = all;
    if (cat === "video") items = items.filter((m) => m.type === "video");
    else if (cat === "image") items = items.filter((m) => m.type === "image");
    else if (cat === "audio") items = items.filter((m) => m.type === "audio");
    if (srch.trim()) items = items.filter((m) => m.name.toLowerCase().includes(srch.toLowerCase()));
    return items;
  }, [all, cat, srch]);

  return (
    <>
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center gap-1.5 bg-white/5 rounded-md px-2 py-1.5">
          <S d={I.srch} sz={11} />
          <input value={srch} onChange={(e) => setSrch(e.target.value)} placeholder="Search media..." className="bg-transparent text-[10px] text-white/50 outline-none w-full placeholder:text-white/12" />
          {srch && <button onClick={() => setSrch("")} className="text-white/12 hover:text-white/35"><S d={I.close} sz={10} /></button>}
        </div>
      </div>
      <div className="flex px-3 gap-1 mb-2 overflow-x-auto scrollbar-none">
        {CATS.map((c) => <button key={c.id} onClick={() => setCat(c.id)} className={`flex-shrink-0 text-[8px] px-2 py-1 rounded-md ${cat === c.id ? "bg-white/10 text-white/55" : "text-white/18 hover:text-white/35 hover:bg-white/4"}`}>{c.label}</button>)}
      </div>
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) onImp(e.dataTransfer.files); }} className="mx-3 mb-2 border border-dashed border-white/8 rounded-md p-2 text-center hover:border-emerald-500/20 cursor-pointer transition-colors" onClick={() => fRef.current?.click()}>
        <div className="text-[8px] text-white/18">Drop files or click to import</div>
      </div>
      <div className={filtered.length === 0 ? "px-4 py-8 text-center" : "grid grid-cols-2 gap-1.5 px-3 pb-4"}>
        {filtered.length === 0 ? <><div className="text-xl opacity-15 mb-1">📂</div><div className="text-[9px] text-white/12">No files found</div></>
          : filtered.map((item) => (
            <div key={item.id} draggable onDragStart={(e) => onMDrag(e, { ...item, type: item.type || "video" })}
              className="group flex flex-col rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 hover:border-white/8 cursor-grab active:cursor-grabbing transition-all overflow-hidden"
            >
              <div className="w-full aspect-video flex items-center justify-center bg-black/40 text-xl group-hover:scale-105 transition-transform">{item.thumb}</div>
              <div className="px-1.5 py-1">
                <div className="text-[9px] text-white/45 truncate group-hover:text-white/65">{item.name}</div>
                <div className="text-[7px] text-white/14">{item.dur ? `${item.dur}s` : item.type}</div>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}

const audioItems = [...MEDIA_LIB.filter((m) => m.type === "audio"), ...[
  { id: "au3", name: "SFX.mp3", dur: 3, thumb: "🔔" }, { id: "au4", name: "Transição.wav", dur: 1.5, thumb: "🔊" },
  { id: "au5", name: "Ambiente.mp3", dur: 60, thumb: "🌿" }, { id: "au6", name: "Bass.mp3", dur: 4, thumb: "🎸" },
  { id: "au7", name: "Clap.wav", dur: 0.3, thumb: "👏" }, { id: "au8", name: "Riser.mp3", dur: 3, thumb: "📈" },
  { id: "au9", name: "Jingle.mp3", dur: 6, thumb: "🎶" }, { id: "au10", name: "Stinger.wav", dur: 1, thumb: "⚡" },
]];
export function AudioPanel() {
  return (
    <div className="grid grid-cols-2 gap-1.5 p-3">
      {audioItems.map((item) => (
        <div key={item.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...item, type: "audio" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
          className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-grab active:cursor-grabbing"
        >
          <div className="w-full aspect-video rounded flex items-center justify-center bg-black/40 text-xl mb-1">{item.thumb}</div>
          <div className="text-[9px] text-white/45 truncate">{item.name}</div>
          <div className="text-[7px] text-white/15">{item.dur}s</div>
        </div>
      ))}
    </div>
  );
}

export function TextPanel() {
  return (
    <div className="space-y-px px-2 pb-3 mt-1">
      {TEXT_STYLES.map((t) => (
        <div key={t.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...t, type: "text" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-white/4 cursor-grab active:cursor-grabbing"
        >
          <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-xs font-bold text-white/35">{t.name[0]}</div>
          <div><div className="text-[10px] text-white/45">{t.name}</div><div className="text-[7px] text-white/15">{t.font} · {t.sz}px{t.w ? ` · ${t.w}` : ""}</div></div>
        </div>
      ))}
    </div>
  );
}

export function StickerPanel() {
  return <div className="grid grid-cols-4 gap-1.5 p-3">{STICKER_SET.map((s) => <div key={s.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...s, type: "sticker" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
    className="aspect-square rounded-lg bg-white/2 border border-white/4 flex items-center justify-center text-xl hover:bg-white/6 hover:scale-110 transition-all cursor-grab active:cursor-grabbing">{s.e}</div>)}</div>;
}

export function TransitionsPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{TRANS_LIST.map((tr) => <div key={tr.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...tr, type: "overlay" })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
    className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer">
    <div className="w-full aspect-video rounded flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.01] text-sm mb-1"><S d={I.trans} sz={16} style={{ color: "rgba(255,255,255,0.2)" }} /></div>
    <div className="text-[9px] text-white/45">{tr.name}</div><div className="text-[7px] text-white/15">{tr.d}s</div>
  </div>)}</div>;
}

export function EffectsPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{EFX_CATS.map((ef) => <div key={ef.id} draggable onDragStart={(e) => { try { e.dataTransfer.setData("application/json", JSON.stringify({ ...ef, type: "overlay", dur: 3 })); e.dataTransfer.effectAllowed = "copy"; } catch {} }}
    className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-grab active:cursor-grabbing">
    <div className="w-full aspect-video rounded flex items-center justify-center bg-black/40 text-lg mb-1">{ef.i}</div>
    <div className="text-[9px] text-white/45">{ef.name}</div>
  </div>)}</div>;
}

export function LUTsPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{LUTS.map((l) => <div key={l.id} className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer">
    <div className="w-full aspect-video rounded flex items-center justify-center bg-gradient-to-br from-white/10 via-transparent to-black/40 text-[9px] text-white/20 font-mono">LUT</div>
    <div className="text-[9px] text-white/45 mt-1">{l.name}</div>
  </div>)}</div>;
}

export function ColorPanel() {
  const [v, setV] = useState({ temp: 0, tint: 0, sat: 0, exp: 0, cont: 0, hl: 0, sh: 0, vib: 0, hue: 0 });
  return <div className="px-3 pb-3 space-y-2 mt-1">
    {[{ k: "temp", label: "Temp" }, { k: "tint", label: "Tint" }, { k: "sat", label: "Saturation" }, { k: "vib", label: "Vibrance" }, { k: "exp", label: "Exposure" }, { k: "cont", label: "Contrast" }, { k: "hl", label: "Highlights" }, { k: "sh", label: "Shadows" }, { k: "hue", label: "Hue Shift" }].map((s) => (
      <div key={s.k}><div className="flex justify-between text-[9px] text-white/25 mb-0.5"><span>{s.label}</span><span className="text-white/15">{v[s.k] > 0 ? "+" : ""}{v[s.k]}</span></div><Rng min={-100} max={100} val={v[s.k]} onChange={(e) => setV((x) => ({ ...x, [s.k]: +e.target.value }))} /></div>
    ))}
    <button className="w-full text-[9px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">Reset All</button>
  </div>;
}

export function MotionPanel() {
  return <div className="grid grid-cols-2 gap-1 p-3">{MOTION_PRESETS.map((mp) => <div key={mp.id} className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer">
    <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs">🎬</div>
    <span className="text-[10px] text-white/45">{mp.name}</span>
  </div>)}</div>;
}

export function AIPanel() {
  const [proc, setProc] = useState(null);
  return <div className="p-2 space-y-1">
    {AI_TOOLS.map((ai) => (
      <button key={ai.id} onClick={() => { setProc(ai.id); setTimeout(() => setProc(null), 2000); }} disabled={proc === ai.id}
        className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-white/4 transition-colors"
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400/70 text-[9px]">{proc === ai.id ? <span className="animate-spin">⏳</span> : ai.icon}</div>
        <div><div className="text-[9px] text-white/45">{ai.name}</div><div className="text-[7px] text-white/15">{proc === ai.id ? "Processing..." : ai.desc}</div></div>
      </button>
    ))}
  </div>;
}

export function AssetsPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{BRAND_ASSETS.map((a) => <div key={a.id} className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer">
    <div className="w-full aspect-video rounded flex items-center justify-center bg-black/40 text-xl mb-1">{a.thumb}</div>
    <div className="text-[9px] text-white/45 truncate">{a.name}</div>
  </div>)}</div>;
}

export function TemplatesPanel() {
  return <div className="grid grid-cols-2 gap-1.5 p-3">{TEMPLATES.map((t) => <div key={t.id} className="flex flex-col items-center p-2 rounded-md border border-white/4 bg-white/[0.015] hover:bg-white/4 cursor-pointer">
    <div className="w-full aspect-video rounded flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-blue-500/10 text-lg mb-1">{t.thumb}</div>
    <div className="text-[9px] text-white/45">{t.name}</div><div className="text-[7px] text-white/15">{t.dur}s</div>
  </div>)}</div>;
}

export function CaptionsPanel() {
  const [gen, setGen] = useState(false);
  return <div className="p-3 space-y-2">
    {[{ id: "c1", name: "Auto Detect", lang: "Auto", icon: "🌐" }, { id: "c2", name: "Portuguese", lang: "PT-BR", icon: "🇧🇷" }, { id: "c3", name: "English", lang: "EN", icon: "🇺🇸" }, { id: "c4", name: "Spanish", lang: "ES", icon: "🇪🇸" }].map((c) => (
      <button key={c.id} className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-white/4"><div className="text-lg">{c.icon}</div><div><div className="text-[9px] text-white/45">{c.name}</div><div className="text-[7px] text-white/15">{c.lang}</div></div></button>
    ))}
    <div className="pt-2 border-t border-white/6">
      <button onClick={() => { setGen(true); setTimeout(() => setGen(false), 2500); }} className="w-full text-[9px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">
        {gen ? "⏳ Generating..." : "Generate Captions"}
      </button>
    </div>
    {gen && <div className="space-y-1 mt-1">
      {["Hello and welcome!", "In this video we'll show you", "How to create amazing content", "With BRANPY Video Studio"].map((c, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1 text-[8px] text-white/35 animate-pulse">
          <span className="text-white/15">{FMT(i * 2)}</span>
          <span>{c}</span>
        </div>
      ))}
    </div>}
  </div>;
}

function FMT(s) { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`; }

export function BrandPanel() {
  return <div className="p-3 space-y-2">
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-white/4">
      <div className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">B</div>
      <div><div className="text-[10px] text-white/50">BRANPY Brand</div><div className="text-[7px] text-white/15">Active kit · 6 assets</div></div>
    </div>
    <div className="grid grid-cols-3 gap-1.5">{["#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899", "#ef4444"].map((c, i) => <div key={i} className="h-8 rounded-md cursor-pointer hover:scale-110 transition-transform border border-white/10" style={{ background: c }} />)}</div>
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/5 text-[9px] text-white/25">
      <span className="text-xs">🔤</span><span>Inter · Sans · Open Sans</span>
    </div>
    <button className="w-full text-[9px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">Edit Brand Kit</button>
  </div>;
}
