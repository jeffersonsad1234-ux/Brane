import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const voiceLibrary = [
  { id: "v1", name: "Gabriel", language: "Portuguese", gender: "Male", preview: "pt" },
  { id: "v2", name: "Sofia", language: "Portuguese", gender: "Female", preview: "pt" },
  { id: "v3", name: "James", language: "English", gender: "Male", preview: "en" },
  { id: "v4", name: "Emma", language: "English", gender: "Female", preview: "en" },
  { id: "v5", name: "Carlos", language: "Spanish", gender: "Male", preview: "es" },
  { id: "v6", name: "Lucia", language: "Spanish", gender: "Female", preview: "es" },
  { id: "v7", name: "Pierre", language: "French", gender: "Male", preview: "fr" },
  { id: "v8", name: "Aria", language: "Japanese", gender: "Female", preview: "ja" },
];

const defaultItems = [
  { id: "gen1", text: "Welcome to the BRANPY ecosystem.", voice: "James", duration: 2.1, date: "2026-05-21" },
  { id: "gen2", text: "Explore the future of AI-powered creation.", voice: "Emma", duration: 2.8, date: "2026-05-20" },
  { id: "gen3", text: "Transform your ideas into reality.", voice: "Gabriel", duration: 2.4, date: "2026-05-19" },
];

const UID = () => Math.random().toString(36).slice(2, 9);

function WaveformBars({ active, color = "#22c55e" }) {
  return (
    <div className="flex items-end gap-[2px] h-6">
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div
          key={i}
          animate={active ? { height: [4 + Math.random() * 20, 4 + Math.random() * 24, 4 + Math.random() * 20] } : { height: 6 }}
          transition={{ duration: 0.4 + i * 0.06, repeat: active ? Infinity : 0, ease: "easeInOut" }}
          className="w-[3px] rounded-full"
          style={{ background: active ? color : "rgba(255,255,255,0.06)" }}
        />
      ))}
    </div>
  );
}

export default function VoiceStudio() {
  const [tab, setTab] = useState("library");
  const [previewId, setPreviewId] = useState(null);
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState("James");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [items, setItems] = useLocalStorage("branpy-voicestudio-items", defaultItems);

  const handlePreview = (id) => {
    setPreviewId(previewId === id ? null : id);
  };

  const handleGenerate = () => {
    if (!ttsText.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const entry = {
        id: UID(),
        text: ttsText.trim(),
        voice: ttsVoice,
        duration: +(ttsText.trim().split(" ").length * 0.25).toFixed(1),
        date: new Date().toISOString().slice(0, 10),
      };
      setItems((prev) => [entry, ...prev]);
      setTtsText("");
      setGenerating(false);
    }, 2000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06] gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Voice Studio</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          <button onClick={() => setTab("library")} className={`px-2.5 py-1 rounded-md text-[9px] transition-all ${tab === "library" ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}>Voice Library</button>
          <button onClick={() => setTab("tts")} className={`px-2.5 py-1 rounded-md text-[9px] transition-all ${tab === "tts" ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}>Text-to-Speech</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-y-auto p-3">
          {tab === "library" && (
            <div className="grid grid-cols-4 gap-2">
              {voiceLibrary.map((voice) => (
                <motion.div
                  key={voice.id}
                  whileHover={{ y: -2 }}
                  className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center text-emerald-400/60 text-xs font-bold">{voice.name[0]}</div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePreview(voice.id)}
                      className={`p-1.5 rounded-lg transition-all ${previewId === voice.id ? "bg-emerald-500/20 text-emerald-400" : "bg-white/[0.06] text-white/25 hover:text-white/50"}`}
                    >
                      {previewId === voice.id ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      )}
                    </motion.button>
                  </div>
                  <div className="text-[11px] text-white/70 font-medium">{voice.name}</div>
                  <div className="text-[8px] text-white/25 mt-0.5">{voice.language} · {voice.gender}</div>
                  {previewId === voice.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 pt-2 border-t border-white/[0.06]">
                      <WaveformBars active />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {tab === "tts" && (
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-[9px] text-white/20 uppercase tracking-wider">Text Input</label>
                <textarea
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Enter text to synthesize..."
                  rows={4}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[11px] text-white/60 outline-none resize-none placeholder:text-white/10 focus:border-white/[0.12] transition-colors"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[8px] text-white/20 uppercase tracking-wider">Voice</label>
                  <select value={ttsVoice} onChange={(e) => setTtsVoice(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-white/50 outline-none focus:border-white/[0.12]">
                    {voiceLibrary.map((v) => <option key={v.id} value={v.name}>{v.name} ({v.language})</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] text-white/20 uppercase tracking-wider">Speed: {speed}x</label>
                  <input type="range" min={0.5} max={2} step={0.1} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full h-[3px] accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] text-white/20 uppercase tracking-wider">Pitch: {pitch}x</label>
                  <input type="range" min={0.5} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(+e.target.value)} className="w-full h-[3px] accent-emerald-500 bg-white/[0.06] rounded-full appearance-none cursor-pointer" />
                </div>
                <div className="flex items-end">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    disabled={generating || !ttsText.trim()}
                    className="w-full py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400/80 text-[10px] font-semibold hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                  >
                    {generating ? (
                      <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-3.5 h-3.5 border-2 border-emerald-400/60 border-t-transparent rounded-full" /> Generating</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg> Generate</>
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <div className="text-[9px] text-white/20 uppercase tracking-wider mb-2">Generated Items</div>
                <div className="space-y-1">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs">🎙️</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-white/50 truncate">{item.text}</div>
                          <div className="flex items-center gap-2 text-[8px] text-white/15"><span>{item.voice}</span><span>·</span><span>{item.date}</span></div>
                        </div>
                        <span className="text-[8px] text-white/20 font-mono">{item.duration}s</span>
                        <button className="p-1 rounded hover:bg-white/[0.06] text-white/20 hover:text-emerald-400 transition-all"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></button>
                        <button className="p-1 rounded hover:bg-white/[0.06] text-white/15 hover:text-white/40 transition-all"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
