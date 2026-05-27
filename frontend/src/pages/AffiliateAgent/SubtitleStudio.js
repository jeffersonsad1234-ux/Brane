import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { generateSubtitles } from "../../core/ai/services/aiToolsService";

export default function SubtitleStudio() {
  const [entries, setEntries] = useLocalStorage("branpy-subtitles", []);
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    if (!text.trim() || generating) return;
    setGenerating(true);
    setResult("");
    try {
      const srt = await generateSubtitles(text.trim(), "");
      setResult(srt);
      setEntries((prev) => [{ id: `sub_${Date.now()}`, text: text.slice(0, 50), srt, date: new Date().toISOString().slice(0, 10) }, ...prev]);
    } catch (err) {
      setResult(`Erro: ${err.message}`);
    }
    setGenerating(false);
  };

  const handleCopy = async () => {
    if (result) { try { await navigator.clipboard.writeText(result); } catch {} }
  };

  const handleExport = () => {
    if (result) {
      const blob = new Blob([result], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "legendas.srt"; a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full w-full flex bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="w-56 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto p-3 hidden md:block">
        <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.2)" }}>Legendas</p>
        {entries.map((e) => (
          <div key={e.id} onClick={() => setResult(e.srt)}
            className="p-2 rounded-lg mb-1 cursor-pointer text-[10px]"
            style={{ background: "transparent", border: "1px solid transparent", color: "rgba(255,255,255,0.25)" }}
          >
            <p className="truncate">{e.text}</p>
            <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.1)" }}>{e.date}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Legendas AI</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Cole o texto para gerar legendas no formato SRT..."
            className="w-full bg-transparent text-sm outline-none p-3 rounded-xl resize-none"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", minHeight: 120 }}
          />
          <button onClick={handleGenerate} disabled={!text.trim() || generating}
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{
              background: text.trim() && !generating ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)",
              color: text.trim() && !generating ? "white" : "rgba(255,255,255,0.2)",
              border: "none", cursor: text.trim() && !generating ? "pointer" : "not-allowed",
            }}
          >
            {generating ? "Gerando..." : "Gerar Legendas"}
          </button>

          {result && (
            <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>SRT</span>
                <div className="flex-1" />
                <button onClick={handleCopy} className="text-[9px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "none", cursor: "pointer" }}>Copiar</button>
                <button onClick={handleExport} className="text-[9px] px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "none", cursor: "pointer" }}>Download .srt</button>
              </div>
              <pre className="text-[10px] leading-relaxed whitespace-pre-wrap font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
