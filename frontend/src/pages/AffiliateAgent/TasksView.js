import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const TABS = ["All", "Active", "Completed"];
const PRIORITIES = { low: "text-blue-400 bg-blue-500/10", medium: "text-amber-400 bg-amber-500/10", high: "text-red-400 bg-red-500/10" };

const MOCK_TASKS = [
  { id: 1, title: "Review affiliate dashboard", completed: false, priority: "high", dueDate: Date.now() + 86400000 },
  { id: 2, title: "Write product description for new item", completed: false, priority: "medium", dueDate: Date.now() + 172800000 },
  { id: 3, title: "Schedule social media posts", completed: true, priority: "low", dueDate: Date.now() - 3600000 },
  { id: 4, title: "Analyze campaign performance", completed: false, priority: "high", dueDate: Date.now() + 43200000 },
  { id: 5, title: "Update pricing spreadsheet", completed: true, priority: "medium", dueDate: Date.now() - 86400000 },
];

export default function TasksView() {
  const [tasks, setTasks] = useLocalStorage("branpy_tasks", MOCK_TASKS);
  const [activeTab, setActiveTab] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", priority: "medium", dueDate: "" });
  const nextId = useMemo(() => Math.max(0, ...tasks.map((t) => t.id)) + 1, [tasks]);

  const filtered = useMemo(() => {
    if (activeTab === "All") return tasks;
    return tasks.filter((t) => (activeTab === "Active" ? !t.completed : t.completed));
  }, [tasks, activeTab]);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);
  }, [tasks]);

  const toggleTask = useCallback((id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, [setTasks]);

  const deleteTask = useCallback((id, e) => {
    e?.stopPropagation();
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [setTasks]);

  const addTask = useCallback(() => {
    if (!form.title.trim()) return;
    const task = { id: nextId, title: form.title, completed: false, priority: form.priority, dueDate: form.dueDate ? new Date(form.dueDate).getTime() : null };
    setTasks((prev) => [...prev, task]);
    setForm({ title: "", priority: "medium", dueDate: "" });
    setShowModal(false);
  }, [form, nextId, setTasks]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-5 h-12 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-0.5">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                activeTab === tab ? "bg-white/10 text-white/80" : "text-white/40 hover:text-white/60"
              }`}
            >{tab}</button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-xs font-medium transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
          Add Task
        </button>
      </div>

      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-[11px] text-white/40 font-medium">{progress}%</span>
        </div>
        <div className="text-[10px] text-white/20 mt-1">{tasks.filter((t) => !t.completed).length} remaining of {tasks.length} tasks</div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 scrollbar-thin">
        <AnimatePresence>
          {filtered.map((task) => (
            <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-all border-b border-white/[0.03]"
            >
              <button onClick={() => toggleTask(task.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                  task.completed ? "bg-emerald-500/60 border-emerald-500/60" : "border-white/20 hover:border-white/40"
                }`}
              >
                {task.completed && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
              </button>
              <span className={`flex-1 text-xs transition-all ${task.completed ? "text-white/20 line-through" : "text-white/70"}`}>{task.title}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITIES[task.priority] || "text-white/30 bg-white/5"}`}>{task.priority}</span>
              {task.dueDate && (
                <span className={`text-[10px] ${task.dueDate < Date.now() && !task.completed ? "text-red-400" : "text-white/30"}`}>
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              <button onClick={(e) => deleteTask(task.id, e)} className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 text-xs flex-shrink-0">\u2715</button>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-xs text-white/20">No tasks found</div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()} className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 w-full max-w-sm mx-4"
            >
              <div className="text-xs font-medium text-white/50 mb-4">New Task</div>
              <div className="space-y-3">
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Task title" autoFocus />
                <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20">
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20" />
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={addTask} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Create</button>
                <button onClick={() => setShowModal(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
