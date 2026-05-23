import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const mockTranscripts = [
  { id: "tr1", text: "Welcome to the BRANPY ecosystem, where innovation meets intelligence. This platform was designed to empower creators worldwide.", language: "English", date: "2026-05-21", duration: "00:12" },
  { id: "tr2", text: "Bem-vindo ao ecossistema BRANPY, onde a inovação encontra a inteligência. Esta plataforma foi projetada para capacitar criadores em todo o mundo.", language: "Portuguese", date: "2026-05-20", duration: "00:14" },
  { id: "tr3", text: "Bienvenido al ecosistema BRANPY, donde la innovación se encuentra con la inteligencia. Esta plataforma fue diseñada para empoderar a creadores de todo el mundo.", language: "Spanish", date: "2026-05-19", duration: "00:15" },
];

const UID = () => Math.random().toString(36).slice(2, 9);

export default function TranscriptionAI() {
  const [status, setStatus] = useState("Idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [detectedLang, setDetectedLang] = useState("");
  const [history, setHistory] = useLocalStorage("branpy-transcription-history", mockTranscripts);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const fileRef = useRef(null);

  const handleUpload = () => {
    setStatus("Processing");
    setProgress(0);
    setResult(null);
    setDetectedLang("");

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          const langs = ["English", "Portuguese", "Spanish", "French", "German", "Japanese"];
          const lang = langs[Math.floor(Math.random() * langs.length)];
          setDetectedLang(lang);
          const transcript = `This is a mock transcription result. The audio file was processed through the BRANPY AI transcription engine. We have detected the language as ${lang}. The system uses state-of-the-art deep learning models to provide accurate transcriptions with timestamp alignment, speaker diarization, and confidence scoring. This is a simulation for demonstration purposes.`;
          const entry = { id: UID(), text: transcript, language: lang, date: new Date().toISOString().slice(0, 10), duration: `00:${String(Math.floor(Math.random() * 30 + 10)).padStart(2, "0")}` };
          setResult(entry);
          setHistory((prev) => [entry, ...prev]);
          setStatus("Complete");
          return 100;
        }
        return prev + Math.floor(Math.random() * 15 + 5);
      });
    }, 300);
  };

  const handleCopy = async () => {
    if (result) {
      try { await navigator.clipboard.writeText(result.text); } catch {}
    }
  };

  const handleExport = () => {
    if (result) {
      const blob = new Blob([result.text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "transcript.txt"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const displayText = selectedHistory ? selectedHistory.text : result?.text || "";

  return (
    <div className="h-full w-full flex bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Transcription AI</span>
          <div className="flex-1" />
          <span className="flex items-center gap-1.5 text-[8px]">
            <span className={`w-1.5 h-1.5 rounded-full ${status === "Idle" ? "bg-white/20" : status === "Processing" ? "bg-amber-400 animate-pulse" : "bg-emerald-500"}`} />
            {status}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div
            onClick={status === "Idle" ? handleUpload : undefined}
            className={`p-8 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer ${
              status === "Idle"
                ? "border-white/[0.1] hover:border-emerald-500/30 hover:bg-white/[0.02]"
                : "border-white/[0.05] pointer-events-none opacity-60"
            }`}
          >
            <div className="text-3xl mb-2 opacity-20">🎧</div>
            <div className="text-[11px] text-white/30 mb-1">Drop audio file or click to upload</div>
            <div className="text-[8px] text-white/15">Supports MP3, WAV, M4A, FLAC</div>
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
          </div>

          <AnimatePresence>
            {status === "Processing" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                <div className="flex items-center justify-between text-[9px]"><span className="text-white/20">Processing audio...</span><span className="text-white/30 font-mono">{Math.min(progress, 100)}%</span></div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center gap-2 text-[8px] text-white/15">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-3 h-3 border-2 border-emerald-400/40 border-t-transparent rounded-full" />
                  Running speech recognition model...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(result || selectedHistory) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider">Transcription</span>
                    {detectedLang && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/25">Detected: {detectedLang}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[9px] text-white/30 hover:text-white/50 transition-all">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z" /></svg>
                      Copy
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[9px] text-white/30 hover:text-white/50 transition-all">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
                      Export
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-white/50 leading-relaxed">
                  {displayText}
                </div>
                {result && (
                  <div className="flex items-center gap-3 text-[8px] text-white/15">
                    <span>Duration: {result.duration}</span>
                    <span>Language: {result.language}</span>
                    <span>Date: {result.date}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-52 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] flex flex-col">
        <div className="h-9 flex-shrink-0 flex items-center px-3 border-b border-white/[0.06]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">History</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => { setSelectedHistory(selectedHistory?.id === item.id ? null : item); setResult(null); setDetectedLang(item.language); }}
              className={`p-2 rounded-lg cursor-pointer transition-all ${
                selectedHistory?.id === item.id ? "bg-white/[0.08]" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="text-[8px] text-white/15 mb-1 flex items-center gap-1.5">
                <span className="text-[9px]">📄</span>
                <span>{item.language}</span>
                <span className="ml-auto">{item.date}</span>
              </div>
              <div className="text-[9px] text-white/35 leading-relaxed line-clamp-2">{item.text}</div>
            </div>
          ))}
          {history.length === 0 && <div className="text-[9px] text-white/12 text-center py-8">No history</div>}
        </div>
      </div>
    </div>
  );
}
