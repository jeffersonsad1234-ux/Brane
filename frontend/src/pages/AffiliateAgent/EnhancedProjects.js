import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const PRIORITIES = {
  low: "text-blue-400 bg-blue-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  high: "text-red-400 bg-red-500/10",
};
const STATUSES = ["To Do", "In Progress", "Done"];
const STATUS_COLORS = {
  "To Do": "bg-blue-500/20 border-blue-500/30",
  "In Progress": "bg-amber-500/20 border-amber-500/30",
  Done: "bg-emerald-500/20 border-emerald-500/30",
};
const EMOJIS = ["🚀", "🎨", "📊", "🛒", "⚡", "🎯", "💎", "🌐", "📱", "🧠"];

function pickEmoji(name) {
  const i = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return EMOJIS[i % EMOJIS.length];
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const MEMBERS = ["AL", "JC", "MK", "TR", "SN"];

const MOCK_PROJECTS = [
  {
    id: 1,
    name: "Brand Redesign",
    description: "Complete visual identity overhaul for Q3 launch",
    dueDate: Date.now() + 14 * 86400000,
    priority: "high",
    members: ["AL", "JC", "MK"],
    tasks: [
      { id: 101, title: "Design new logo", status: "Done", assignee: "AL", priority: "high" },
      { id: 102, title: "Color palette exploration", status: "Done", assignee: "JC", priority: "medium" },
      { id: 103, title: "Typography selection", status: "In Progress", assignee: "AL", priority: "medium" },
      { id: 104, title: "Brand guidelines doc", status: "In Progress", assignee: "MK", priority: "high" },
      { id: 105, title: "Social media kit", status: "To Do", assignee: "JC", priority: "low" },
      { id: 106, title: "Stationery mockups", status: "To Do", assignee: "TR", priority: "low" },
    ],
  },
  {
    id: 2,
    name: "Campaign Dashboard",
    description: "Real-time analytics dashboard for ad campaigns",
    dueDate: Date.now() + 7 * 86400000,
    priority: "high",
    members: ["MK", "TR"],
    tasks: [
      { id: 201, title: "API integration setup", status: "Done", assignee: "MK", priority: "high" },
      { id: 202, title: "Chart components", status: "In Progress", assignee: "TR", priority: "medium" },
      { id: 203, title: "Filter bar UI", status: "In Progress", assignee: "MK", priority: "medium" },
      { id: 204, title: "Export CSV feature", status: "To Do", assignee: "TR", priority: "low" },
    ],
  },
  {
    id: 3,
    name: "Mobile App MVP",
    description: "Cross-platform mobile app for affiliate management",
    dueDate: Date.now() + 30 * 86400000,
    priority: "medium",
    members: ["AL", "SN", "MK"],
    tasks: [
      { id: 301, title: "User authentication", status: "Done", assignee: "AL", priority: "high" },
      { id: 302, title: "Dashboard screen", status: "In Progress", assignee: "SN", priority: "medium" },
      { id: 303, title: "Product catalog", status: "To Do", assignee: "MK", priority: "medium" },
      { id: 304, title: "Push notifications", status: "To Do", assignee: "AL", priority: "low" },
    ],
  },
  {
    id: 4,
    name: "Content Strategy",
    description: "Q4 content calendar and SEO optimization plan",
    dueDate: Date.now() + 5 * 86400000,
    priority: "low",
    members: ["JC", "TR"],
    tasks: [
      { id: 401, title: "Keyword research", status: "Done", assignee: "JC", priority: "high" },
      { id: 402, title: "Content calendar draft", status: "In Progress", assignee: "TR", priority: "medium" },
      { id: 403, title: "SEO audit report", status: "To Do", assignee: "JC", priority: "medium" },
    ],
  },
];

function projectProgress(tasks) {
  if (tasks.length === 0) return 0;
  return Math.round((tasks.filter((t) => t.status === "Done").length / tasks.length) * 100);
}

function ProjectCard({ project, onClick, index }) {
  const progress = useMemo(() => projectProgress(project.tasks), [project.tasks]);
  const done = project.tasks.filter((t) => t.status === "Done").length;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: (index || 0) * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col rounded-xl border border-white/[0.06] text-left cursor-pointer overflow-hidden"
      style={{ background: "rgba(255,255,255,0.015)" }}
    >
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(255,255,255,0.04)" }}>
              {project.icon || pickEmoji(project.name)}
            </div>
            <div>
              <div className="text-xs font-medium text-white/70">{project.name}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{project.description.slice(0, 40)}{project.description.length > 40 ? "…" : ""}</div>
            </div>
          </div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${PRIORITIES[project.priority] || "text-white/30 bg-white/5"}`}>{project.priority}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: progress === 100 ? "rgba(16,185,129,0.7)" : progress > 50 ? "rgba(59,130,246,0.6)" : "rgba(250,204,21,0.5)" }}
              />
            </div>
            <span className="text-[10px] text-white/30 font-medium w-8 text-right">{progress}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/20">{done}/{project.tasks.length} tasks</span>
            {project.dueDate && (
              <span className={`text-[10px] ${project.dueDate < Date.now() ? "text-red-400" : "text-white/20"}`}>
                {new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 py-2.5 flex items-center gap-1.5 border-t border-white/[0.03]">
        {project.members.map((m, i) => (
          <div
            key={m}
            className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold"
            style={{ background: `rgba(${80 + i * 40}, ${140 + i * 20}, 255, 0.15)`, color: "rgba(255,255,255,0.4)" }}
          >
            {m}
          </div>
        ))}
        <div className="flex-1" />
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: project.priority === "high" ? "rgba(239,68,68,0.3)" : project.priority === "medium" ? "rgba(251,191,36,0.3)" : "rgba(96,165,250,0.3)" }} />
      </div>
    </motion.button>
  );
}

function KanbanBoard({ tasks, onToggleStatus, onAddTask }) {
  const addFormInit = { title: "", assignee: "", priority: "medium" };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(addFormInit);

  const handleAdd = useCallback(() => {
    if (!form.title.trim()) return;
    onAddTask({ title: form.title, assignee: form.assignee || "AL", priority: form.priority });
    setForm(addFormInit);
    setShowForm(false);
  }, [form, onAddTask]);

  const tasksByStatus = useMemo(
    () => ({
      "To Do": tasks.filter((t) => t.status === "To Do"),
      "In Progress": tasks.filter((t) => t.status === "In Progress"),
      Done: tasks.filter((t) => t.status === "Done"),
    }),
    [tasks]
  );

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Done").length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/[0.03]">
        <span className="text-[11px] text-white/30 font-medium">{done}/{total} completed</span>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-[10px] font-medium transition-all"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
          Add Task
        </button>
      </div>
      <div className="flex-1 flex gap-3 p-5 overflow-x-auto min-h-0">
        {STATUSES.map((status) => {
          const colTasks = tasksByStatus[status];
          return (
            <div key={status} className="flex-1 min-w-[200px] flex flex-col">
              <div className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg border mb-3 ${STATUS_COLORS[status]} text-white/50`}>
                {status} <span className="text-white/20 ml-1">{colTasks.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                <AnimatePresence>
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.04] hover:border-white/[0.08] transition-all"
                      style={{ background: "rgba(255,255,255,0.015)" }}
                    >
                      <button
                        onClick={() => onToggleStatus(task.id)}
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                          task.status === "Done"
                            ? "bg-emerald-500/60 border-emerald-500/60"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      >
                        {task.status === "Done" && (
                          <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        )}
                      </button>
                      <span className={`flex-1 text-[11px] min-w-0 truncate ${task.status === "Done" ? "text-white/20 line-through" : "text-white/60"}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
                        >
                          {task.assignee}
                        </div>
                        <span className={`text-[8px] px-1 py-0.5 rounded ${PRIORITIES[task.priority] || "text-white/20 bg-white/5"}`}>
                          {task.priority}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-[10px] text-white/10">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 w-full max-w-sm mx-4"
            >
              <div className="text-xs font-medium text-white/50 mb-4">New Task</div>
              <div className="space-y-3">
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20"
                  placeholder="Task title"
                  autoFocus
                />
                <select
                  value={form.assignee}
                  onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20"
                >
                  {MEMBERS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={handleAdd} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Create</button>
                <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EnhancedProjects() {
  const [projects, setProjects] = useLocalStorage("branpy_projects", MOCK_PROJECTS);
  const [view, setView] = useState("grid");
  const [selectedId, setSelectedId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", description: "", dueDate: "", priority: "medium" });

  const nextProjectId = useMemo(() => Math.max(0, ...projects.map((p) => p.id)) + 1, [projects]);
  const nextTaskId = useMemo(
    () => Math.max(0, ...projects.flatMap((p) => p.tasks.map((t) => t.id))) + 1,
    [projects]
  );

  const selected = useMemo(() => projects.find((p) => p.id === selectedId) || null, [projects, selectedId]);

  const toggleTaskStatus = useCallback(
    (taskId) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === taskId
                    ? { ...t, status: t.status === "Done" ? "In Progress" : STATUSES[(STATUSES.indexOf(t.status) + 1) % 3] }
                    : t
                ),
              }
            : p
        )
      );
    },
    [selectedId, setProjects]
  );

  const addTaskToProject = useCallback(
    (task) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedId
            ? { ...p, tasks: [...p.tasks, { id: nextTaskId, ...task, status: "To Do" }] }
            : p
        )
      );
    },
    [selectedId, nextTaskId, setProjects]
  );

  const createProject = useCallback(() => {
    if (!newForm.name.trim()) return;
    const project = {
      id: nextProjectId,
      name: newForm.name,
      description: newForm.description,
      dueDate: newForm.dueDate ? new Date(newForm.dueDate).getTime() : Date.now() + 30 * 86400000,
      priority: newForm.priority,
      members: [MEMBERS[Math.floor(Math.random() * MEMBERS.length)]],
      tasks: [],
    };
    setProjects((prev) => [...prev, project]);
    setNewForm({ name: "", description: "", dueDate: "", priority: "medium" });
    setShowNewModal(false);
  }, [newForm, nextProjectId, setProjects]);

  if (selected) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
        <div className="flex items-center gap-3 px-5 h-12 border-b border-white/[0.06] flex-shrink-0">
          <motion.button
            whileHover={{ x: -2 }}
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 text-[10px] transition-colors"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
            Back
          </motion.button>
          <div className="w-px h-4 bg-white/[0.06]" />
          <span className="text-sm">{pickEmoji(selected.name)}</span>
          <span className="text-[11px] font-medium text-white/45">{selected.name}</span>
          <span className="text-[10px] text-white/20 ml-auto">{selected.description}</span>
          <span className="text-[10px] text-white/20">
            {selected.dueDate ? new Date(selected.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
          </span>
        </div>
        <KanbanBoard tasks={selected.tasks} onToggleStatus={toggleTaskStatus} onAddTask={addTaskToProject} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-5 h-12 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-white/40">{projects.length} projects</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
            {["grid", "list"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 text-[10px] rounded-md transition-all ${
                  view === v ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50"
                }`}
              >
                {v === "grid" ? "▦ Grid" : "☰ List"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-[10px] font-medium transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
            New Project
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        {view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} onClick={() => setSelectedId(project.id)} />
            ))}
          </div>
        ) : (
          <div className="border border-white/[0.06] rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.01)" }}>
            <div className="grid grid-cols-[1fr_80px_100px_80px_110px_80px] gap-2 px-4 py-2.5 border-b border-white/[0.04] text-[9px] font-medium text-white/20 uppercase tracking-wider">
              <span>Name</span><span>Status</span><span>Progress</span><span>Tasks</span><span>Due Date</span><span>Priority</span>
            </div>
            <AnimatePresence>
              {projects.map((project, i) => {
                const progress = projectProgress(project.tasks);
                const done = project.tasks.filter((t) => t.status === "Done").length;
                const overall = project.tasks.every((t) => t.status === "Done")
                  ? "Done"
                  : project.tasks.some((t) => t.status === "In Progress")
                  ? "In Progress"
                  : "To Do";
                return (
                  <motion.button
                    key={project.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    onClick={() => setSelectedId(project.id)}
                    className="w-full grid grid-cols-[1fr_80px_100px_80px_110px_80px] gap-2 px-4 py-3 items-center hover:bg-white/[0.015] transition-all border-b border-white/[0.02] last:border-0 text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm">{project.icon || pickEmoji(project.name)}</span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-white/60 truncate">{project.name}</div>
                        <div className="text-[9px] text-white/20 truncate">{project.description}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-center ${STATUS_COLORS[overall] || ""} text-white/40`}>{overall}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, background: progress === 100 ? "rgba(16,185,129,0.6)" : "rgba(59,130,246,0.5)" }}
                        />
                      </div>
                      <span className="text-[9px] text-white/20 w-7 text-right">{progress}%</span>
                    </div>
                    <span className="text-[10px] text-white/30">{done}/{project.tasks.length}</span>
                    <span className={`text-[10px] ${project.dueDate < Date.now() ? "text-red-400" : "text-white/30"}`}>
                      {new Date(project.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-center ${PRIORITIES[project.priority] || "text-white/20 bg-white/5"}`}>
                      {project.priority}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {projects.length === 0 && (
              <div className="flex items-center justify-center h-32 text-xs text-white/20">No projects yet</div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowNewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 w-full max-w-sm mx-4"
            >
              <div className="text-xs font-medium text-white/50 mb-4">New Project</div>
              <div className="space-y-3">
                <input
                  value={newForm.name}
                  onChange={(e) => setNewForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20"
                  placeholder="Project name"
                  autoFocus
                />
                <input
                  value={newForm.description}
                  onChange={(e) => setNewForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20"
                  placeholder="Description"
                />
                <input
                  type="date"
                  value={newForm.dueDate}
                  onChange={(e) => setNewForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20"
                />
                <select
                  value={newForm.priority}
                  onChange={(e) => setNewForm((p) => ({ ...p, priority: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={createProject} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Create</button>
                <button onClick={() => setShowNewModal(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
