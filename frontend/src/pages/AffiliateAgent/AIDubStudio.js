import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const languages = [
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
];

const voices = {
  Male: ["Gabriel (PT)", "James (EN)", "Carlos (ES)"],
  Female: ["Sofia (PT)", "Emma (EN)", "Lucia (ES)"],
  Neutral: ["Nova (AI)", "Echo (AI)", "Aria (AI)"],
};

const mockHistory = [
  { id: "dub1", text: "Bem-vindo ao ecossistema BRANPY, a plataforma mais inovadora do mercado.", language: "Portuguese", voice: "Gabriel (PT)", date: "2026-05-20", duration: 4.2 },
  { id: "dub2", text: "Welcome to the BRANPY ecosystem, the most innovative platform on the market.", language: "English", voice: "Emma (EN)", date: "2026-05-19", duration: 3.8 },
  { id: "dub3", text: "Bienvenido al ecosistema BRANPY, la plataforma más innovadora del mercado.", language: "Spanish", voice: "Carlos (ES)", date: "2026-05-18", duration: 4.5 },
];

const UID = () => Math.random().toString(36).slice(2, 9);

function WaveformBars({ active }) {
  return (
    <div className="flex items-end gap-[2px] h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          animate={active ? { height: [4 + Math.random() * 24, 4 + Math.random() * 28, 4 + Math.random() * 24] } : { height: 8 }}
          transition={{ duration: 0.5 + i * 0.05, repeat: active ? Infinity : 0, ease: "easeInOut" }}
          className="w-[3px] rounded-full"
          style={{ background: active ? "#22c55e" : "rgba(255,255,255,0.08)" }}
        />
      ))}
    </div>
  );
}

export default function AIDubStudio() {
  const [sourceText, setSourceText] = useState("");
  const [language, setLanguage] = useState("pt");
  const [gender, setGender] = useState("Male");
  const [voice, setVoice] = useState(voices.Male[0]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useLocalStorage("branpy-aidub-history", mockHistory);

  const langLabel = useMemo(() => languages.find((l) => l.code === language)?.name || "Portuguese", [language]);

  const handleGenerate = () => {
    if (!sourceText.trim()) return;
    setGenerating(true);
    setResult(null);
    setTimeout(() => {
      const entry = {
        id: UID(),
        text: sourceText.trim(),
        language: langLabel,
        voice,
        date: new Date().toISOString().slice(0, 10),
        duration: (sourceText.trim().split(" ").length * 0.3).toFixed(1),
      };
      setResult(entry);
      setHistory((prev) => [entry, ...prev]);
      setGenerating(false);
    }, 2500);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">AI Dub Studio</span>
        <div className="flex-1" />
        <span className="text-[8px] text-white/10 font-mono">{history.length} dubs</span>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] text-white/20 uppercase tracking-wider">Source Text</label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to dub..."
              rows={4}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-[11px] text-white/60 outline-none resize-none placeholder:text-white/10 focus:border-white/[0.12] transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-2 text-[10px] text-white/50 outline-none focus:border-white/[0.12] cursor-pointer">
                {languages.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Gender</label>
              <div className="flex gap-1">
                {["Male", "Female", "Neutral"].map((g) => (
                  <button key={g} onClick={() => { setGender(g); setVoice(voices[g][0]); }} className={`flex-1 py-2 rounded-lg text-[9px] transition-all ${gender === g ? "bg-white/[0.1] text-white/60" : "bg-white/[0.03] text-white/20 hover:text-white/40"}`}>{g}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] text-white/20 uppercase tracking-wider">Voice</label>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-2 text-[10px] text-white/50 outline-none focus:border-white/[0.12] cursor-pointer">
                {voices[gender].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={generating || !sourceText.trim()}
            className="w-full py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400/80 text-[11px] font-semibold hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-emerald-400/60 border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
                Generate Dub
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/20 uppercase tracking-wider">Generated Result</span>
                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPlaying(!playing)} className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/30 hover:text-emerald-400 transition-all">
                      {playing ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                    </motion.button>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[9px] text-white/30 hover:text-white/50 transition-all">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
                      Download
                    </button>
                  </div>
                </div>
                <WaveformBars active={playing} />
                <div className="flex items-center gap-4 text-[9px] text-white/20">
                  <span>Duration: {result.duration}s</span>
                  <span>Voice: {result.voice}</span>
                  <span>Language: {result.language}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-2">
            <div className="text-[9px] text-white/20 uppercase tracking-wider mb-2">History</div>
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {history.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs">🎤</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white/50 truncate">{item.text}</div>
                      <div className="flex items-center gap-2 text-[8px] text-white/15"><span>{item.language}</span><span>·</span><span>{item.date}</span></div>
                    </div>
                    <span className="text-[8px] text-white/20 font-mono">{item.duration}s</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
