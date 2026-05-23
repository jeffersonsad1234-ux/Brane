import React, { useState } from "react";
import { I, S, Rng, FMT, EFX_CATS, AI_TOOLS, LUTS } from "./utils";

function Ph({ label }) {
  return <div className="h-9 flex-shrink-0 flex items-center px-3 border-b border-white/6"><span className="text-[10px] font-semibold text-white/18 uppercase tracking-[0.15em]">{label}</span></div>;
}

export default function Inspector({ clip }) {
  const [tab, setTab] = useState("transform");
  if (!clip) return (
    <div className="w-[260px] flex-shrink-0 border-l border-white/6 bg-[#0d0d0d] flex flex-col min-h-0">
      <Ph label="Inspector" />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-1.5"><S d={I.lay} sz={15} style={{ color: "rgba(255,255,255,0.12)" }} /></div>
          <div className="text-[9px] text-white/12">Select a clip to edit</div>
          <div className="text-[7px] text-white/6 mt-1">Click any clip on the timeline</div>
        </div>
      </div>
    </div>
  );

  const TABS = [
    { id: "transform", label: "Transform" }, { id: "color", label: "Color" },
    { id: "audio", label: "Audio" }, { id: "effects", label: "Effects" },
    { id: "motion", label: "Motion" }, { id: "keyframes", label: "Keyframes" },
  ];

  const [keyframes, setKeyframes] = useState([]);
  const [kfTarget, setKfTarget] = useState("position");

  return (
    <div className="w-[260px] flex-shrink-0 border-l border-white/6 bg-[#0d0d0d] flex flex-col min-h-0">
      <Ph label="Inspector" />
      <div className="flex-shrink-0 flex border-b border-white/6 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 text-[9px] py-2 whitespace-nowrap relative transition-colors ${tab === t.id ? "text-white/65" : "text-white/18 hover:text-white/35"}`}>
            {t.label}
            {tab === t.id && <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] rounded-t bg-emerald-500" />}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-4">
        <div className="p-3 space-y-2.5">
          {/* Clip header */}
          <div className="flex items-center gap-2 pb-2 border-b border-white/6">
            <div className="w-9 h-9 rounded-md bg-white/5 flex items-center justify-center text-base flex-shrink-0">{clip.t || "🎬"}</div>
            <div className="min-w-0">
              <div className="text-[10px] text-white/55 font-medium truncate">{clip.name}</div>
              <div className="text-[7px] text-white/15">{FMT(clip.start)} — {FMT(clip.start + clip.duration)}</div>
            </div>
          </div>

          {tab === "transform" && <>
            <div className="grid grid-cols-2 gap-1.5">
              {[{ l: "Pos X", k: "px", v: 0 }, { l: "Pos Y", k: "py", v: 0 }].map((s) => (
                <div key={s.k}><div className="flex justify-between text-[8px] text-white/22 mb-0.5"><span>{s.l}</span><span className="text-white/12">{s.v}</span></div><Rng min={-2000} max={2000} val={s.v} /></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[{ l: "Scale", k: "scale", v: 100, min: 1, max: 500 }, { l: "Rotation", k: "rot", v: 0, min: -180, max: 180 }, { l: "Opacity", k: "op", v: 100, min: 0, max: 100 }, { l: "Blur", k: "blur", v: 0, min: 0, max: 50 }].map((s) => (
                <div key={s.k}><div className="flex justify-between text-[8px] text-white/22 mb-0.5"><span>{s.l}</span><span className="text-white/12">{s.v}</span></div><Rng min={s.min} max={s.max} val={s.v} /></div>
              ))}
            </div>
            <div className="pt-1">
              <div className="flex justify-between text-[9px] text-white/25 mb-0.5"><span>Blend Mode</span></div>
              <select className="w-full bg-white/5 border border-white/8 rounded text-[9px] text-white/40 px-1.5 py-1 outline-none focus:border-white/15">
                {[{ v: "normal", l: "Normal" }, { v: "multiply", l: "Multiply" }, { v: "screen", l: "Screen" }, { v: "overlay", l: "Overlay" }, { v: "add", l: "Add" }, { v: "subtract", l: "Subtract" }].map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-1 pt-1">
              <button className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">Chroma Key</button>
              <button className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">Stabilize</button>
            </div>
            {/* Chroma Key section */}
            <div className="pt-2 border-t border-white/6">
              <div className="text-[9px] text-white/18 mb-2 font-medium">Chroma Key</div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-4 h-4 rounded-full bg-green-500 border border-white/20 flex-shrink-0" />
                <span className="text-[8px] text-white/25">Green</span>
              </div>
              {[{ l: "Tolerance", k: "tol", v: 50 }, { l: "Feather", k: "fth", v: 10 }, { l: "Spill Reduction", k: "spl", v: 30 }].map((s) => (
                <div key={s.k} className="mb-1"><div className="flex justify-between text-[7px] text-white/20 mb-0.5"><span>{s.l}</span><span className="text-white/12">{s.v}</span></div><Rng min={0} max={100} val={s.v} /></div>
              ))}
            </div>
          </>}

          {tab === "color" && <>
            {[{ l: "Exposure", k: "exp", v: 0 }, { l: "Contrast", k: "cont", v: 0 }, { l: "Highlights", k: "hl", v: 0 }, { l: "Shadows", k: "sh", v: 0 }, { l: "Whites", k: "wh", v: 0 }, { l: "Blacks", k: "bk", v: 0 }, { l: "Saturation", k: "sat", v: 0 }, { l: "Hue", k: "hue", v: 0 }, { l: "Temperature", k: "temp", v: 0 }, { l: "Tint", k: "tint", v: 0 }, { l: "Sharpness", k: "sharp", v: 0 }, { l: "Vignette", k: "vig", v: 0 }].map((s) => (
              <div key={s.k} className="mb-0.5"><div className="flex justify-between text-[7px] text-white/22 mb-0.5"><span>{s.l}</span><span className="text-white/12">{s.v > 0 ? "+" : ""}{s.v}</span></div><Rng min={-100} max={100} val={s.v} /></div>
            ))}
            <div className="pt-2">
              <div className="text-[9px] text-white/18 mb-1.5">LUTs</div>
              <div className="grid grid-cols-3 gap-1">{LUTS.slice(0, 6).map((l) => <button key={l.id} className="text-[7px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">{l.name}</button>)}</div>
            </div>
            <button className="w-full text-[9px] py-1.5 rounded mt-2 bg-gradient-to-r from-emerald-500/15 to-purple-500/15 text-emerald-400/70 hover:from-emerald-500/25 hover:to-purple-500/25 border border-emerald-500/10">Auto Color Grade</button>
          </>}

          {tab === "audio" && <>
            {[{ l: "Volume", k: "vol", v: 100, min: 0, max: 200 }, { l: "Fade In", k: "fIn", v: 0, min: 0, max: 5 }, { l: "Fade Out", k: "fOut", v: 0, min: 0, max: 5 }, { l: "Pan", k: "pan", v: 0, min: -100, max: 100 }].map((s) => (
              <div key={s.k} className="mb-0.5"><div className="flex justify-between text-[7px] text-white/22 mb-0.5"><span>{s.l}</span><span className="text-white/12">{s.v}</span></div><Rng min={s.min} max={s.max} val={s.v} /></div>
            ))}
            <div className="pt-2 border-t border-white/6">
              <div className="text-[9px] text-white/18 mb-1.5">Equalizer</div>
              {[60, 200, 500, 2000, 8000, 16000].map((hz) => (
                <div key={hz} className="flex items-center gap-2 text-[7px] text-white/15 mb-0.5">
                  <span className="w-8 flex-shrink-0">{hz < 1000 ? `${hz}Hz` : `${hz / 1000}k`}</span>
                  <Rng min={-12} max={12} val={0} cls="flex-1" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 pt-2">
              <button className="text-[8px] py-1.5 rounded bg-red-500/8 text-red-400/60 hover:bg-red-500/15 border border-red-500/10">Denoise</button>
              <button className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">Voice Enhancer</button>
              <button className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">Normalize</button>
              <button className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">Detach Audio</button>
            </div>
          </>}

          {tab === "effects" && <>
            <div className="text-[9px] text-white/18 mb-1.5">Apply Effect</div>
            <div className="grid grid-cols-2 gap-1">{EFX_CATS.map((ef) => <button key={ef.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white/5 text-white/30 hover:bg-white/10 text-[8px] border border-white/5"><span>{ef.i}</span>{ef.name}</button>)}</div>
            <div className="pt-2 border-t border-white/6">
              <div className="text-[9px] text-white/18 mb-1">Speed Ramp</div>
              <Rng min={0.1} max={8} step={0.1} val={1} />
              <div className="grid grid-cols-4 gap-1 mt-1.5">
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4].map((s) => <button key={s} className={`text-[8px] py-1 rounded border border-white/5 ${s === 1 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-white/25 hover:bg-white/10"}`}>{s}x</button>)}
              </div>
            </div>
          </>}

          {tab === "motion" && <>
            <div className="text-[9px] text-white/18 mb-1">Easing</div>
            <div className="grid grid-cols-2 gap-1">{["Linear", "Ease In", "Ease Out", "Ease In Out", "Bounce", "Elastic"].map((e) => <button key={e} className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">{e}</button>)}</div>
            <div className="pt-2 border-t border-white/6">
              <div className="text-[9px] text-white/18 mb-1">Animation Presets</div>
              <div className="grid grid-cols-3 gap-1">{["Fade", "Slide Up", "Slide Down", "Slide L", "Slide R", "Scale", "Rotate", "Zoom", "Bounce"].map((a) => <button key={a} className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">{a}</button>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-1 pt-2">
              <button className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">Reverse</button>
              <button className="text-[8px] py-1.5 rounded bg-white/5 text-white/25 hover:bg-white/10 border border-white/5">Freeze Frame</button>
            </div>
          </>}

          {tab === "keyframes" && <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-white/18">Keyframes</span>
              <button onClick={() => setKeyframes([...keyframes, { id: Date.now(), target: kfTarget, time: 0, value: 0 }])} className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">+ Add</button>
            </div>
            <div className="flex gap-1 mb-1.5">
              {["position", "scale", "rotation", "opacity"].map((t) => <button key={t} onClick={() => setKfTarget(t)} className={`text-[7px] px-1.5 py-0.5 rounded ${kfTarget === t ? "bg-white/10 text-white/55" : "text-white/20 hover:bg-white/5"}`}>{t}</button>)}
            </div>
            <div className="space-y-1">
              {keyframes.length === 0 && <div className="text-[8px] text-white/12 text-center py-3">No keyframes. Click "+ Add" to start.</div>}
              {keyframes.map((kf) => (
                <div key={kf.id} className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1 text-[8px]">
                  <span className="text-white/35 w-12">{kf.target}</span>
                  <span className="text-white/20 w-8">{FMT(kf.time)}</span>
                  <input type="range" min={-100} max={100} value={kf.value} onChange={(e) => setKeyframes(keyframes.map((k) => k.id === kf.id ? { ...k, value: +e.target.value } : k))} className="flex-1 h-[2px] accent-emerald-500 bg-white/10 rounded-full appearance-none cursor-pointer" />
                  <button onClick={() => setKeyframes(keyframes.filter((k) => k.id !== kf.id))} className="text-red-400/40 hover:text-red-400">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-1 mt-2">
              <select className="flex-1 bg-white/5 border border-white/8 rounded text-[8px] text-white/30 px-1 py-0.5 outline-none">
                {["Linear", "Ease In", "Ease Out", "Ease In Out", "Bounce"].map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
