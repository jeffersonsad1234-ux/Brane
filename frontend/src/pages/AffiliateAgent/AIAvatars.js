import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const STYLES = ["Realistic", "Anime", "Cartoon", "3D"];
const GENDERS = ["Male", "Female", "Non-binary", "Any"];
const AGE_GROUPS = ["Child", "Teen", "Young Adult", "Adult", "Senior"];

const MOCK_AVATARS = [
  { id: "a1", name: "Aria Chen", style: "Realistic", gender: "Female", ageGroup: "Adult", status: "Ready", color: "#06b6d4" },
  { id: "a2", name: "Kai Tanaka", style: "Anime", gender: "Male", ageGroup: "Teen", status: "Ready", color: "#8b5cf6" },
  { id: "a3", name: "Pixel Bot", style: "Cartoon", gender: "Any", ageGroup: "Child", status: "Generating", color: "#f59e0b" },
  { id: "a4", name: "Zara Nova", style: "3D", gender: "Female", ageGroup: "Young Adult", status: "Ready", color: "#ec4899" },
  { id: "a5", name: "Orion Grey", style: "Realistic", gender: "Male", ageGroup: "Adult", status: "Ready", color: "#3b82f6" },
  { id: "a6", name: "Luna Star", style: "Anime", gender: "Female", ageGroup: "Young Adult", status: "Generating", color: "#10b981" },
];

function AvatarPreview({ name, color, size = "w-14 h-14", textSize = "text-lg" }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className={`${size} rounded-full flex items-center justify-center font-semibold ${textSize} text-white shadow-lg`}
      style={{ background: `radial-gradient(circle at 30% 30%, ${color}88, ${color})` }}
    >{initial}</div>
  );
}

export default function AIAvatars() {
  const [avatars, setAvatars] = useLocalStorage("brane_ai_avatars", MOCK_AVATARS);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ name: "", style: "Realistic", gender: "Female", ageGroup: "Adult" });

  const detail = useMemo(() => avatars.find((a) => a.id === selected), [avatars, selected]);

  const handleCreate = useCallback(() => {
    if (!form.name.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const colors = ["#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6", "#10b981"];
      const newAvatar = {
        id: `av-${Date.now()}`,
        name: form.name.trim(),
        style: form.style,
        gender: form.gender,
        ageGroup: form.ageGroup,
        status: "Ready",
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      setAvatars((prev) => [newAvatar, ...prev]);
      setForm({ name: "", style: "Realistic", gender: "Female", ageGroup: "Adult" });
      setGenerating(false);
      setShowModal(false);
    }, 2000);
  }, [form, setAvatars]);

  const patchDetail = useCallback((patch) => {
    setAvatars((prev) => prev.map((a) => (a.id === selected ? { ...a, ...patch } : a)));
  }, [selected, setAvatars]);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">AI Avatars</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ Create Avatar</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {avatars.map((av, i) => (
              <motion.div key={av.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(av.id)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <AvatarPreview name={av.name} color={av.color} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/80 truncate">{av.name}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{av.style} &middot; {av.gender}</div>
                    <div className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      av.status === "Ready" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    }`}>{av.status}</div>
                  </div>
                </div>
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-white/80">Avatar Details</h2>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="flex flex-col items-center mb-6">
                <AvatarPreview name={detail.name} color={detail.color} size="w-24 h-24" textSize="text-3xl" />
                <div className="text-base font-medium text-white/90 mt-3">{detail.name}</div>
                <div className="text-[11px] text-white/40">{detail.style}</div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className={lx}>Name</div>
                  <input value={detail.name} onChange={(e) => patchDetail({ name: e.target.value })} className={ix} />
                </div>
                <div>
                  <div className={lx}>Style</div>
                  <select value={detail.style} onChange={(e) => patchDetail({ style: e.target.value })} className={ix}>
                    {STYLES.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div>
                  <div className={lx}>Gender</div>
                  <select value={detail.gender} onChange={(e) => patchDetail({ gender: e.target.value })} className={ix}>
                    {GENDERS.map((g) => (<option key={g} value={g}>{g}</option>))}
                  </select>
                </div>
                <div>
                  <div className={lx}>Age Group</div>
                  <select value={detail.ageGroup} onChange={(e) => patchDetail({ ageGroup: e.target.value })} className={ix}>
                    {AGE_GROUPS.map((a) => (<option key={a} value={a}>{a}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                >Download</button>
                <button className="flex-1 py-2 text-xs font-medium rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/20 transition"
                >Use in Project</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => { if (!generating) setShowModal(false); }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white/90 mb-4">Create Avatar</h3>
              {generating ? (
                <div className="flex flex-col items-center py-8">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full mb-4"
                  />
                  <div className="text-sm text-white/50">Generating avatar...</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Avatar Name" className={ix} autoFocus />
                  <select value={form.style} onChange={(e) => setForm((p) => ({ ...p, style: e.target.value }))} className={ix}>
                    {STYLES.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                  <select value={form.gender} onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))} className={ix}>
                    {GENDERS.map((g) => (<option key={g} value={g}>{g}</option>))}
                  </select>
                  <select value={form.ageGroup} onChange={(e) => setForm((p) => ({ ...p, ageGroup: e.target.value }))} className={ix}>
                    {AGE_GROUPS.map((a) => (<option key={a} value={a}>{a}</option>))}
                  </select>
                </div>
              )}
              {!generating && (
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition"
                  >Cancel</button>
                  <button onClick={handleCreate}
                    className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                  >Generate</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
