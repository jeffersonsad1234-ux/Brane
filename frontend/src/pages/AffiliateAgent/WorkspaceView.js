import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const COLORS = ["#0ea5e9", "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const MOCK_WORKSPACES = [
  { id: 1, name: "Personal", icon: "🏠", description: "Personal projects and learning", color: "#0ea5e9", projects: ["Reading List", "Portfolio", "Blog Posts"], memberCount: 1, lastActive: "2026-05-22" },
  { id: 2, name: "Work", icon: "💼", description: "Client work and collaborations", color: "#6366f1", projects: ["Website Redesign", "Brand Guidelines", "Q3 Campaign"], memberCount: 4, lastActive: "2026-05-21" },
  { id: 3, name: "Client Projects", icon: "🤝", description: "External client deliverables", color: "#10b981", projects: ["Acme Dashboard", "Nexus API", "BrightPath Social"], memberCount: 3, lastActive: "2026-05-20" },
  { id: 4, name: "Learning", icon: "📚", description: "Courses and tutorials", color: "#f59e0b", projects: ["React Masterclass", "UI/UX Course", "Backend Roadmap"], memberCount: 1, lastActive: "2026-05-19" },
  { id: 5, name: "Creative", icon: "🎨", description: "Design and multimedia", color: "#ec4899", projects: ["Logo Concepts", "Motion Reel", "Font Library"], memberCount: 2, lastActive: "2026-05-18" },
];

export default function WorkspaceView() {
  const [workspaces, setWorkspaces] = useLocalStorage("brane_workspaces", MOCK_WORKSPACES);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#0ea5e9", icon: "📁" });

  const nextId = useMemo(() => Math.max(0, ...workspaces.map((w) => w.id)) + 1, [workspaces]);
  const detail = useMemo(() => workspaces.find((w) => w.id === selected), [workspaces, selected]);

  const stats = useMemo(() => ({
    active: workspaces.length,
    totalProjects: workspaces.reduce((s, w) => s + (w.projects?.length || 0), 0),
    totalMembers: workspaces.reduce((s, w) => s + (w.memberCount || 0), 0),
  }), [workspaces]);

  const handleAdd = useCallback(() => {
    if (!form.name.trim()) return;
    setWorkspaces((p) => [...p, { id: nextId, ...form, projects: [], memberCount: 1, lastActive: new Date().toISOString().slice(0, 10) }]);
    setForm({ name: "", description: "", color: "#0ea5e9", icon: "📁" });
    setShowModal(false);
  }, [form, nextId, setWorkspaces]);

  const handleAddProject = useCallback(() => {
    if (!detail) return;
    const name = prompt("Project name:");
    if (name?.trim()) {
      setWorkspaces((p) => p.map((w) => w.id === detail.id ? { ...w, projects: [...(w.projects || []), name.trim()] } : w));
    }
  }, [detail, setWorkspaces]);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Workspaces</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
          >+ New Workspace</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Active Workspaces", v: stats.active, c: "text-cyan-400" },
            { l: "Total Projects", v: stats.totalProjects, c: "text-emerald-400" },
            { l: "Members", v: stats.totalMembers, c: "text-purple-400" },
          ].map((card) => (
            <motion.div key={card.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cx}>
              <div className={lx}>{card.l}</div>
              <div className={`text-2xl font-semibold ${card.c}`}>{card.v}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {workspaces.map((ws) => (
              <motion.div key={ws.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(ws.id)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: ws.color + "20" }}>
                    {ws.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/80">{ws.name}</div>
                    <div className="text-[10px] text-white/30">{ws.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-white/40">
                  <span>📁 {ws.projects?.length || 0} projects</span>
                  <span>👥 {ws.memberCount} members</span>
                  <span className="ml-auto text-[10px] text-white/20">{new Date(ws.lastActive).toLocaleDateString()}</span>
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
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: detail.color + "20" }}>{detail.icon}</div>
                  <h2 className="text-sm font-semibold text-white/80">{detail.name}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className={lx}>Description</div>
              <div className="text-xs text-white/50 mb-4">{detail.description}</div>
              <div className="flex items-center justify-between mb-3">
                <div className={lx}>Projects ({detail.projects?.length || 0})</div>
                <button onClick={handleAddProject} className="text-[10px] text-cyan-400 hover:text-cyan-300 transition">+ Add</button>
              </div>
              <div className="space-y-1.5 mb-4">
                {detail.projects?.length > 0 ? detail.projects.map((proj, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <span className="text-xs text-white/70">{proj}</span>
                  </div>
                )) : (
                  <div className="text-[11px] text-white/20 italic">No projects yet</div>
                )}
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                  <span className="text-white/40">Members</span>
                  <span className="text-white/60">{detail.memberCount}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                  <span className="text-white/40">Last Active</span>
                  <span className="text-white/60">{new Date(detail.lastActive).toLocaleDateString()}</span>
                </div>
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
              <h3 className="text-base font-semibold text-white/90 mb-4">New Workspace</h3>
              <div className="space-y-3">
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Workspace name" className={ix} autoFocus />
                <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description (optional)" className={ix} />
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Color</div>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setForm((p) => ({ ...p, color: c }))}
                        className={`w-7 h-7 rounded-lg border-2 transition ${form.color === c ? "border-white/60 scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
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
