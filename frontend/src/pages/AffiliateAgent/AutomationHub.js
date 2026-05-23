import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const MOCK_WORKFLOWS = [
  { id: 1, name: "Social Auto-Poster", icon: "📢", description: "Automatically publish content across all connected social platforms on a schedule.", triggers: ["Schedule trigger (daily at 9AM)", "Manual trigger"], actions: ["Post to Instagram", "Post to TikTok", "Post to Twitter"], status: "Active", lastRun: "2026-05-20T08:00:00" },
  { id: 2, name: "Lead Follower", icon: "🎯", description: "Capture new leads and send automated follow-up sequences via email and SMS.", triggers: ["New lead created", "Lead status changes"], actions: ["Send welcome email", "Add to CRM sequence", "Notify sales team"], status: "Active", lastRun: "2026-05-19T14:30:00" },
  { id: 3, name: "Content Repurposer", icon: "🔄", description: "Reformat long-form content into social posts, shorts, and graphics.", triggers: ["New blog published", "Video uploaded"], actions: ["Generate social snippets", "Create thumbnail", "Schedule posts"], status: "Inactive", lastRun: "2026-05-15T11:00:00" },
  { id: 4, name: "Email Sequences", icon: "✉️", description: "Nurture subscribers with behavior-based email campaigns and drip sequences.", triggers: ["User subscribes", "User abandons cart"], actions: ["Send sequence email", "Tag subscriber", "Update analytics"], status: "Active", lastRun: "2026-05-20T06:00:00" },
  { id: 5, name: "Analytics Report", icon: "📊", description: "Generate and distribute weekly performance reports to stakeholders.", triggers: ["Weekly schedule (Monday 8AM)", "Monthly schedule (1st of month)"], actions: ["Compile metrics", "Generate PDF report", "Email to stakeholders"], status: "Inactive", lastRun: "2026-05-18T08:00:00" },
];

const TRIGGER_OPTIONS = ["Schedule trigger", "New lead created", "Lead status changes", "New blog published", "Video uploaded", "User subscribes", "User abandons cart", "Manual trigger"];
const ACTION_OPTIONS = ["Post to social media", "Send email", "Notify team", "Update CRM", "Generate report", "Tag subscriber", "Create thumbnail"];

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

export default function AutomationHub() {
  const [workflows, setWorkflows] = useLocalStorage("brane_workflows", MOCK_WORKFLOWS);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", trigger: TRIGGER_OPTIONS[0], action: ACTION_OPTIONS[0] });

  const toggleStatus = (id) => {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, status: w.status === "Active" ? "Inactive" : "Active" } : w)));
  };

  const addWorkflow = () => {
    if (!newForm.name.trim()) return;
    setWorkflows((prev) => [...prev, {
      id: Date.now(), name: newForm.name, icon: "⚡", description: "Custom workflow.", triggers: [newForm.trigger], actions: [newForm.action], status: "Inactive", lastRun: null,
    }]);
    setNewForm({ name: "", trigger: TRIGGER_OPTIONS[0], action: ACTION_OPTIONS[0] });
    setShowNew(false);
  };

  const runNow = (id) => {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, lastRun: new Date().toISOString() } : w)));
    setSelected((s) => s?.id === id ? { ...s, lastRun: new Date().toISOString() } : s);
  };

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Automation Hub</h1>
          <button onClick={() => setShowNew(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ New Workflow</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(w)}
              className={cx + " cursor-pointer hover:bg-white/[0.04] transition group"}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{w.icon}</span>
                <button onClick={(e) => { e.stopPropagation(); toggleStatus(w.id); }}
                  className={`relative w-9 h-5 rounded-full transition ${w.status === "Active" ? "bg-cyan-500/40" : "bg-white/[0.08]"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition ${w.status === "Active" ? "left-4" : "left-0.5"}`} />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-white/80 mb-1">{w.name}</h3>
              <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{w.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${w.status === "Active" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/30"}`}>{w.status}</span>
                {w.lastRun && <span className="text-[10px] text-white/20">Last run: {new Date(w.lastRun).toLocaleDateString()}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40" onClick={() => setSelected(null)}
            />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#0f0f0f] border-l border-white/[0.06] z-40 overflow-y-auto p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white/80">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="space-y-5">
                <div>
                  <div className={lx}>Triggers</div>
                  <div className="space-y-1.5">
                    {selected.triggers.map((t, i) => (
                      <div key={i} className="text-xs text-white/60 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="text-cyan-400/60">⚡</span>{t}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className={lx}>Actions</div>
                  <div className="space-y-1.5">
                    {selected.actions.map((a, i) => (
                      <div key={i} className="text-xs text-white/60 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="text-emerald-400/60">▶</span>{a}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className={lx}>Last Run</div>
                  <div className="text-xs text-white/50">{selected.lastRun ? new Date(selected.lastRun).toLocaleString() : "Never"}</div>
                </div>
                <button onClick={() => runNow(selected.id)}
                  className="w-full py-2 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
                >▶ Run Now</button>
                <button onClick={() => { toggleStatus(selected.id); setSelected((s) => s ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s); }}
                  className={`w-full py-2 text-[11px] rounded-lg border transition ${selected.status === "Active" ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"}`}
                >{selected.status === "Active" ? "Deactivate" : "Activate"}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowNew(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white/90 mb-4">New Workflow</h3>
              <div className="space-y-3">
                <input placeholder="Workflow name *" value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} className={ix} />
                <div>
                  <div className={lx}>Trigger</div>
                  <select value={newForm.trigger} onChange={(e) => setNewForm((f) => ({ ...f, trigger: e.target.value }))} className={ix}>
                    {TRIGGER_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                <div>
                  <div className={lx}>Action</div>
                  <select value={newForm.action} onChange={(e) => setNewForm((f) => ({ ...f, action: e.target.value }))} className={ix}>
                    {ACTION_OPTIONS.map((a) => (<option key={a} value={a}>{a}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowNew(false)} className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition">Cancel</button>
                <button onClick={addWorkflow} className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
