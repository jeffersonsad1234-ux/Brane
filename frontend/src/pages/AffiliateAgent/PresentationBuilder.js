import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { analyzeDocument } from "../../core/ai/services/aiToolsService";

export default function PresentationBuilder() {
  const [presentations, setPresentations] = useLocalStorage("branpy-presentations", []);
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!topic.trim() || generating) return;
    setGenerating(true);
    setResult(null);
    try {
      const text = await analyzeDocument(
        `Crie uma apresentação em português brasileiro sobre "${topic.trim()}" com ${slides} slides. Para cada slide, forneça: título e 3-5 bullet points. Formate como:\n\n## Slide 1: [título]\n- [ponto 1]\n- [ponto 2]\n...`,
        ""
      );
      const slidesList = text.split(/## Slide \d+/).filter(Boolean).map((s, i) => {
        const lines = s.trim().split("\n").filter(Boolean);
        const title = lines[0]?.replace(/^:\s*/, "").trim() || `Slide ${i + 1}`;
        const bullets = lines.slice(1).map((l) => l.replace(/^[-\*]\s*/, "").trim()).filter(Boolean);
        return { title, bullets };
      });
      const pres = { id: `pres_${Date.now()}`, topic: topic.trim(), slides: slidesList.length > 0 ? slidesList : [{ title: topic.trim(), bullets: ["Conteúdo gerado"] }], date: new Date().toISOString().slice(0, 10) };
      setResult(pres);
      setPresentations((prev) => [pres, ...prev]);
    } catch (err) {
      setResult({ id: "err", topic: topic.trim(), slides: [{ title: "Erro", bullets: [err.message] }], date: "" });
    }
    setGenerating(false);
  };

  const handleExport = () => {
    if (!result?.slides) return;
    const lines = [];
    result.slides.forEach((s, i) => {
      lines.push(`Slide ${i + 1}: ${s.title}`);
      s.bullets.forEach((b) => lines.push(`  - ${b}`));
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${result.topic.slice(0, 30)}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Presentation Builder</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex gap-3">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Tema da apresentação..."
            className="flex-1 bg-transparent text-sm outline-none px-3 py-2 rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }} />
          <select value={slides} onChange={(e) => setSlides(Number(e.target.value))}
            className="bg-transparent text-xs outline-none px-2 py-1 rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            {[3, 5, 7, 10, 15].map((n) => <option key={n} value={n}>{n} slides</option>)}
          </select>
          <button onClick={handleGenerate} disabled={!topic.trim() || generating}
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{
              background: topic.trim() && !generating ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)",
              color: topic.trim() && !generating ? "white" : "rgba(255,255,255,0.2)",
              border: "none", cursor: topic.trim() && !generating ? "pointer" : "not-allowed",
            }}>
            {generating ? "Criando..." : "Criar"}
          </button>
        </div>

        {generating && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.1)" }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-3 h-3 rounded-full" style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
            <span className="text-[10px]" style={{ color: "#6366f1" }}>Gerando apresentação...</span>
          </div>
        )}

        {result?.slides && result.slides.map((slide, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>Slide {i + 1}: {slide.title}</p>
            <ul className="space-y-1">
              {slide.bullets.map((b, j) => (
                <li key={j} className="text-[11px] flex gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                  <span style={{ color: "#6366f1" }}>•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}

        {result?.slides && result.slides.length > 0 && (
          <button onClick={handleExport} className="text-[10px] px-3 py-1.5 rounded-lg" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "none", cursor: "pointer" }}>
            Exportar como texto
          </button>
        )}
      </div>
    </div>
  );
}
