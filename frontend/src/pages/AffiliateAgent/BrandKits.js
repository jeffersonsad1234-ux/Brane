import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const MOCK_KITS = [
  { id: 1, name: "Nexus Digital", colors: ["#0ea5e9", "#6366f1", "#f59e0b", "#1e293b"], font: "Inter", logo: "🔷", guidelines: "Use the blue palette for digital products. Gold accents for premium features." },
  { id: 2, name: "BrightPath Media", colors: ["#ec4899", "#8b5cf6", "#06b6d4", "#fafafa"], font: "Poppins", logo: "✨", guidelines: "Bright pink and purple dominate. Cyan for secondary CTAs. Keep backgrounds light." },
  { id: 3, name: "Apex Group", colors: ["#dc2626", "#111827", "#fbbf24", "#6b7280"], font: "Roboto", logo: "▲", guidelines: "Bold red for headers. Black and gold for luxury feel. Minimalist approach." },
];

const FONTS = ["Inter", "Poppins", "Roboto", "Montserrat", "Open Sans", "Lato", "Playfair Display", "Space Grotesk"];

export default function BrandKits() {
  const [kits, setKits] = useLocalStorage("brane_brandkits", MOCK_KITS);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", colors: ["#0ea5e9", "#6366f1", "#f59e0b", "#1e293b"], font: "Inter", logo: "🎨", guidelines: "" });

  const nextId = useMemo(() => Math.max(0, ...kits.map((k) => k.id)) + 1, [kits]);
  const detail = useMemo(() => kits.find((k) => k.id === selected), [kits, selected]);

  const handleColor = useCallback((idx, val) => setForm((p) => {
    const c = [...p.colors]; c[idx] = val; return { ...p, colors: c };
  }), []);

  const handleAdd = useCallback(() => {
    if (!form.name.trim()) return;
    setKits((p) => [...p, { id: nextId, ...form }]);
    setForm({ name: "", colors: ["#0ea5e9", "#6366f1", "#f59e0b", "#1e293b"], font: "Inter", logo: "🎨", guidelines: "" });
    setShowModal(false);
  }, [form, nextId, setKits]);

  const handleSave = useCallback(() => {
    if (!detail) return;
    setKits((p) => p.map((k) => (k.id === detail.id ? detail : k)));
    setSelected(null);
  }, [detail, setKits]);

  const patchDetail = useCallback((patch) => {
    setKits((p) => p.map((k) => (k.id === selected ? { ...k, ...patch } : k)));
  }, [selected, setKits]);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Brand Kits</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ New Brand Kit</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {kits.map((kit) => (
              <motion.div key={kit.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(kit.id)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{kit.logo}</span>
                  <div>
                    <div className="text-sm font-medium text-white/80">{kit.name}</div>
                    <div className="text-[10px] text-white/30">{kit.font}</div>
                  </div>
                </div>
                <div className="flex gap-1.5 mb-3">
                  {kit.colors.map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-lg border border-white/10" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
                <div className="text-[11px] text-white/40 line-clamp-2">{kit.guidelines}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {detail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40" onClick={() => setSelected(null)}
            />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#0f0f0f] border-l border-white/[0.06] z-40 overflow-y-auto p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white/80">Edit Brand Kit</h2>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className={lx}>Brand Name</div>
                  <input value={detail.name} onChange={(e) => patchDetail({ name: e.target.value })} className={ix} />
                </div>
                <div>
                  <div className={lx}>Colors</div>
                  <div className="grid grid-cols-2 gap-2">
                    {detail.colors.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="color" value={c} onChange={(e) => {
                          const nc = [...detail.colors]; nc[i] = e.target.value;
                          patchDetail({ colors: nc });
                        }} className="w-8 h-8 rounded border-none cursor-pointer bg-transparent" />
                        <span className="text-[10px] text-white/40 font-mono">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className={lx}>Font</div>
                  <select value={detail.font} onChange={(e) => patchDetail({ font: e.target.value })} className={ix}>
                    {FONTS.map((f) => (<option key={f} value={f}>{f}</option>))}
                  </select>
                </div>
                <div>
                  <div className={lx}>Logo Preview</div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{detail.logo}</span>
                    <input value={detail.logo} onChange={(e) => patchDetail({ logo: e.target.value })} maxLength={2} className={ix + " w-16 text-center text-lg"} />
                  </div>
                </div>
                <div>
                  <div className={lx}>Brand Guidelines</div>
                  <textarea value={detail.guidelines} onChange={(e) => patchDetail({ guidelines: e.target.value })}
                    rows={4} className={ix + " resize-none"} />
                </div>
                <button onClick={handleSave}
                  className="w-full py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                >Save Changes</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white/90 mb-4">New Brand Kit</h3>
              <div className="space-y-3">
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Brand Name" className={ix} autoFocus />
                <div className="grid grid-cols-4 gap-2">
                  {form.colors.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <input type="color" value={c} onChange={(e) => handleColor(i, e.target.value)}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent" />
                      <span className="text-[9px] text-white/30 font-mono">{c}</span>
                    </div>
                  ))}
                </div>
                <select value={form.font} onChange={(e) => setForm((p) => ({ ...p, font: e.target.value }))} className={ix}>
                  {FONTS.map((f) => (<option key={f} value={f}>{f}</option>))}
                </select>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition"
                >Cancel</button>
                <button onClick={handleAdd}
                  className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                >Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
