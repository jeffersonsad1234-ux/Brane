import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const colorSwatches = [
  "#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3",
  "#54a0ff", "#5f27cd", "#01a3a4", "#f368e0",
  "#ff6348", "#7bed9f", "#70a1ff", "#2ed573",
];

const fonts = ["Inter", "Roboto", "Playfair Display", "Montserrat"];
const voices = ["Professional", "Casual", "Luxury", "Playful"];

const mockKits = [
  { id: "k1", brand: "BRANPY", tagline: "The Future of AI", primary: "#48dbfb", secondary: "#5f27cd", font: "Inter", voice: "Professional" },
  { id: "k2", brand: "Luxe Studio", tagline: "Premium Design Systems", primary: "#ff6b6b", secondary: "#feca57", font: "Playfair Display", voice: "Luxury" },
];

const UID = () => Math.random().toString(36).slice(2, 9);

export default function BrandStudio() {
  const [kits, setKits] = useLocalStorage("branpy-brandkits", mockKits);
  const [brand, setBrand] = useState("BRANPY");
  const [tagline, setTagline] = useState("The Future of AI");
  const [primary, setPrimary] = useState("#48dbfb");
  const [secondary, setSecondary] = useState("#5f27cd");
  const [font, setFont] = useState("Inter");
  const [voice, setVoice] = useState("Professional");

  const loadKit = (kit) => {
    setBrand(kit.brand);
    setTagline(kit.tagline);
    setPrimary(kit.primary);
    setSecondary(kit.secondary);
    setFont(kit.font);
    setVoice(kit.voice);
  };

  const saveKit = () => {
    const kit = { id: UID(), brand, tagline, primary, secondary, font, voice };
    setKits((prev) => [kit, ...prev]);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Brand Studio</span>
        <div className="flex-1" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={saveKit} className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400/80 text-[9px] font-semibold hover:bg-indigo-500/30 transition-all">
          Save Brand Kit
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} className="ml-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[9px] text-white/30 hover:text-white/50 transition-all">
          Export Kit
        </motion.button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-52 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto p-3">
          <div className="text-[9px] text-white/20 uppercase tracking-wider mb-2">Saved Kits</div>
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {kits.map((kit) => (
                <motion.div key={kit.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} onClick={() => loadKit(kit)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors">
                  <div className="w-6 h-6 rounded-lg flex-shrink-0 border border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${kit.primary}, ${kit.secondary})` }} />
                  <div className="min-w-0">
                    <div className="text-[10px] text-white/50 truncate">{kit.brand}</div>
                    <div className="text-[8px] text-white/15 truncate">{kit.font} · {kit.voice}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-md mx-auto p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] space-y-4">
              <div className="text-[9px] text-white/20 uppercase tracking-wider">Brand Preview</div>
              <div className="h-24 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center mb-3">
                <div className="flex flex-col items-center gap-1">
                  <svg className="w-6 h-6 text-white/20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                  <span className="text-[8px] text-white/10">Logo Area</span>
                </div>
              </div>
              <div className="text-lg font-bold" style={{ fontFamily: font, color: primary }}>{brand}</div>
              <div className="text-[11px] text-white/30" style={{ fontFamily: font }}>{tagline}</div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-lg border border-white/[0.1]" style={{ background: primary }} />
                <div className="w-6 h-6 rounded-lg border border-white/[0.1]" style={{ background: secondary }} />
              </div>
              <div className="text-[9px] text-white/20 font-mono">{font} · {voice}</div>
            </div>
          </div>

          <div className="w-72 flex-shrink-0 border-l border-white/[0.06] overflow-y-auto p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Brand Name</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2 text-[11px] text-white/60 outline-none focus:border-white/[0.12] transition-colors" placeholder="Brand name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Tagline</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2 text-[11px] text-white/60 outline-none focus:border-white/[0.12] transition-colors" placeholder="Tagline" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Primary Color</label>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg border border-white/[0.1] flex-shrink-0" style={{ background: primary }} />
                <div className="flex-1 grid grid-cols-6 gap-1">
                  {colorSwatches.map((c) => (
                    <motion.button key={c} whileTap={{ scale: 0.85 }} onClick={() => setPrimary(c)} className={`w-full aspect-square rounded border transition-all ${primary === c ? "border-white/40" : "border-white/[0.06] hover:border-white/20"}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Secondary Color</label>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg border border-white/[0.1] flex-shrink-0" style={{ background: secondary }} />
                <div className="flex-1 grid grid-cols-6 gap-1">
                  {colorSwatches.map((c) => (
                    <motion.button key={c} whileTap={{ scale: 0.85 }} onClick={() => setSecondary(c)} className={`w-full aspect-square rounded border transition-all ${secondary === c ? "border-white/40" : "border-white/[0.06] hover:border-white/20"}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Font Family</label>
              <select value={font} onChange={(e) => setFont(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-2 text-[10px] text-white/50 outline-none focus:border-white/[0.12] cursor-pointer">
                {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Brand Voice</label>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-2 text-[10px] text-white/50 outline-none focus:border-white/[0.12] cursor-pointer">
                {voices.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Logo</label>
              <div className="h-20 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.015] flex items-center justify-center text-[9px] text-white/10 hover:text-white/20 hover:border-white/[0.12] cursor-pointer transition-all">
                + Upload Logo
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
