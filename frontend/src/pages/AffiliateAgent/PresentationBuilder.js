import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const LAYOUTS = ["Title Slide", "Bullet Points", "Two Columns", "Image Full", "Quote"];

const MOCK_SLIDES = [
  { id: 1, title: "BRANPY AI Platform", bg: "#1a1a2e", layout: "Title Slide", bullets: ["Revolutionizing AI Workflows", "Enterprise-Grade Automation", "Scalable & Secure Infrastructure"], content: "Presented by the BRANPY Team" },
  { id: 2, title: "Market Overview", bg: "#16213e", layout: "Bullet Points", bullets: ["$12B Industry by 2026", "78% YoY Growth Rate", "40% Cost Reduction Avg"], content: "Key market trends and projections for the quarter." },
  { id: 3, title: "Product Roadmap", bg: "#0f3460", layout: "Two Columns", bullets: ["Q3: AI Agent Launch", "Q4: Multi-Model Support", "2027: Full Autonomy"], content: "Our strategic vision for the next 18 months." },
  { id: 4, title: "Revenue Projections", bg: "#1a1a2e", layout: "Image Full", bullets: ["$2.4M ARR Current", "$8.1M Projected 2027", "92% Gross Margin"], content: "Financial outlook based on current traction." },
  { id: 5, title: "Thank You", bg: "#0a0a0a", layout: "Quote", bullets: ["\"The future of AI is here.\"", "Join us on this journey", "Let's build together"], content: "Contact: hello@branpy.ai" },
];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

export default function PresentationBuilder() {
  const [slides, setSlides] = useLocalStorage("brane_presentation", MOCK_SLIDES);
  const [selectedId, setSelectedId] = useState(1);
  const [editingTitle, setEditingTitle] = useState("");

  const selectedSlide = slides.find((s) => s.id === selectedId) || slides[0];

  const updateSlide = useCallback((id, patch) => {
    setSlides((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s));
  }, [setSlides]);

  const addSlide = useCallback(() => {
    const id = Date.now();
    setSlides((prev) => [...prev, { id, title: "New Slide", bg: "#1a1a2e", layout: "Bullet Points", bullets: ["New point"], content: "Add content here" }]);
    setSelectedId(id);
    setEditingTitle("");
  }, [setSlides]);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Presentation Builder</h1>
          <button onClick={addSlide}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ Add Slide</button>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          <div className={cx + " w-48 shrink-0 overflow-y-auto"}>
            <div className={lx + " mb-2"}>Slides</div>
            <div className="space-y-2">
              {slides.map((slide, idx) => (
                <motion.div key={slide.id} layout
                  onClick={() => { setSelectedId(slide.id); setEditingTitle(""); }}
                  className={`rounded-lg p-3 cursor-pointer border transition group ${selectedId === slide.id ? "border-cyan-500/40 bg-cyan-500/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/20 font-mono">{idx + 1}</span>
                    <div className="w-full h-8 rounded bg-white/[0.04] flex items-center justify-center" style={{ backgroundColor: slide.bg }}>
                      <span className="text-[8px] text-white/30 truncate px-1">{slide.title}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {slides.length === 0 && <div className="text-[11px] text-white/20 text-center py-8">No slides yet</div>}
          </div>

          <div className={cx + " flex-1 flex items-center justify-center min-h-0"}>
            <motion.div key={selectedSlide.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl aspect-video rounded-2xl p-8 flex flex-col justify-center shadow-2xl border border-white/[0.08]"
              style={{ backgroundColor: selectedSlide.bg }}
            >
              <div className="text-[10px] text-white/20 uppercase tracking-widest mb-2">{selectedSlide.layout}</div>
              <h2 className="text-2xl font-semibold text-white/90 mb-4">{selectedSlide.title}</h2>
              <div className="space-y-2">
                {selectedSlide.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400/60 text-xs mt-0.5">●</span>
                    <span className="text-white/60 text-sm">{b}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-white/30 italic">{selectedSlide.content}</div>
            </motion.div>
          </div>

          <div className={cx + " w-64 shrink-0 overflow-y-auto"}>
            <div className={lx + " mb-3"}>Slide Properties</div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-white/30 mb-1">Title</div>
                <input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => { if (editingTitle.trim()) updateSlide(selectedSlide.id, { title: editingTitle }); }}
                  placeholder={selectedSlide.title}
                  className={ix}
                />
              </div>
              <div>
                <div className="text-[10px] text-white/30 mb-1">Background Color</div>
                <div className="flex gap-2">
                  <input type="color" value={selectedSlide.bg}
                    onChange={(e) => updateSlide(selectedSlide.id, { bg: e.target.value })}
                    className="w-10 h-10 rounded-lg bg-transparent border border-white/[0.06] cursor-pointer"
                  />
                  <input value={selectedSlide.bg}
                    onChange={(e) => updateSlide(selectedSlide.id, { bg: e.target.value })}
                    className={ix}
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/30 mb-1">Layout</div>
                <select value={selectedSlide.layout}
                  onChange={(e) => updateSlide(selectedSlide.id, { layout: e.target.value })}
                  className={ix}
                >
                  {LAYOUTS.map((l) => (<option key={l} value={l}>{l}</option>))}
                </select>
              </div>
              <div>
                <div className="text-[10px] text-white/30 mb-1">Content</div>
                <textarea value={selectedSlide.content}
                  onChange={(e) => updateSlide(selectedSlide.id, { content: e.target.value })}
                  rows={2} className={ix + " resize-none"}
                />
              </div>
              <div>
                <div className="text-[10px] text-white/30 mb-1">Bullets</div>
                <div className="space-y-1">
                  {selectedSlide.bullets.map((b, i) => (
                    <input key={i} value={b}
                      onChange={(e) => {
                        const next = [...selectedSlide.bullets];
                        next[i] = e.target.value;
                        updateSlide(selectedSlide.id, { bullets: next });
                      }}
                      className={ix + " text-xs"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
