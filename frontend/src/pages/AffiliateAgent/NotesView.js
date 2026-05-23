import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const FOLDERS = ["All Notes", "Personal", "Work", "Ideas"];

const MOCK_NOTES = [
  { id: 1, title: "Welcome to Notes", body: "This is your first note. Edit it or create a new one.", folder: "Personal", date: Date.now() - 3600000 },
  { id: 2, title: "Meeting Agenda", body: "Discuss Q4 goals, review budget, assign tasks.", folder: "Work", date: Date.now() - 86400000 },
  { id: 3, title: "App Ideas", body: "Build a task manager with AI suggestions.", folder: "Ideas", date: Date.now() - 172800000 },
  { id: 4, title: "Shopping List", body: "Milk, eggs, bread, coffee, butter.", folder: "Personal", date: Date.now() - 259200000 },
];

export default function NotesView() {
  const [notes, setNotes] = useLocalStorage("branpy_notes", MOCK_NOTES);
  const [activeFolder, setActiveFolder] = useState("All Notes");
  const [selectedId, setSelectedId] = useState(null);
  const nextId = useMemo(() => Math.max(0, ...notes.map((n) => n.id)) + 1, [notes]);

  const filtered = useMemo(() => {
    if (activeFolder === "All Notes") return notes;
    return notes.filter((n) => n.folder === activeFolder);
  }, [notes, activeFolder]);

  const selected = useMemo(() => notes.find((n) => n.id === selectedId), [notes, selectedId]);

  const updateNote = useCallback((id, patch) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, [setNotes]);

  const deleteNote = useCallback((id, e) => {
    e?.stopPropagation();
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [setNotes, selectedId]);

  const createNote = useCallback(() => {
    const id = nextId;
    const note = { id, title: "Untitled", body: "", folder: activeFolder === "All Notes" ? "Personal" : activeFolder, date: Date.now() };
    setNotes((prev) => [note, ...prev]);
    setSelectedId(id);
  }, [nextId, activeFolder, setNotes]);

  return (
    <div className="flex-1 flex min-h-0 bg-[#0a0a0a]">
      <div className="w-48 flex-shrink-0 border-r border-white/[0.06] p-3 flex flex-col gap-1">
        <button onClick={createNote} className="w-full flex items-center justify-center gap-1.5 mb-3 px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-xs font-medium transition-all">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
          New Note
        </button>
        {FOLDERS.map((f) => (
          <button key={f} onClick={() => setActiveFolder(f)}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${
              activeFolder === f ? "bg-white/10 text-white/80" : "text-white/40 hover:bg-white/5 hover:text-white/60"
            }`}
          >
            {f === "All Notes" ? "\u{1F4DA} " : f === "Personal" ? "\u{1F464} " : f === "Work" ? "\u{1F4BC} " : "\u{1F4A1} "}{f}
          </button>
        ))}
        <div className="mt-auto text-[10px] text-white/15 text-center pt-4">{notes.length} notes</div>
      </div>

      <div className="w-64 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto scrollbar-thin">
        {filtered.map((note) => (
          <motion.div key={note.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setSelectedId(note.id)}
            className={`group px-4 py-3 cursor-pointer border-b border-white/[0.03] transition-all ${
              selectedId === note.id ? "bg-white/[0.04] border-l-2 border-l-emerald-500/60" : "hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="text-xs font-medium text-white/70 truncate flex-1">{note.title}</div>
              <button onClick={(e) => deleteNote(note.id, e)} className="opacity-0 group-hover:opacity-100 text-red-400/50 hover:text-red-400 text-xs ml-2 flex-shrink-0">\u2715</button>
            </div>
            <div className="text-[11px] text-white/30 mt-1 truncate">{note.body || "Empty note"}</div>
            <div className="text-[10px] text-white/20 mt-1">{new Date(note.date).toLocaleDateString()}</div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-xs text-white/20">No notes here</div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {selected ? (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto scrollbar-thin">
            <input value={selected.title} onChange={(e) => updateNote(selected.id, { title: e.target.value })}
              className="bg-transparent text-lg font-medium text-white/80 outline-none border-none mb-4 placeholder:text-white/20" placeholder="Note title" />
            <textarea value={selected.body} onChange={(e) => updateNote(selected.id, { body: e.target.value })}
              className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-sm text-white/60 outline-none resize-none placeholder:text-white/20 focus:border-white/10 transition-all"
              placeholder="Start writing..." />
            <div className="flex items-center gap-3 mt-3 text-[10px] text-white/20">
              <span>Last edited: {new Date(selected.date).toLocaleString()}</span>
              <span className="px-2 py-0.5 rounded bg-white/5 text-white/30">{selected.folder}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-3 opacity-20">📝</div>
              <div className="text-xs text-white/30">Select a note or create a new one</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
