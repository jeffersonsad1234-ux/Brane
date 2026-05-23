import React, { useState, useMemo } from "react";
import { S, I, UID } from "./utils";

export default function BrandMemoryPanel({ memories, setMemories, onApplyMemory }) {
  const [showForm, setShowForm] = useState(false);
  const [memName, setMemName] = useState("");
  const [applying, setApplying] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!memName.trim()) return;
    setSaving(true);
    const newMem = {
      id: UID(),
      name: memName.trim(),
      date: new Date().toLocaleDateString(),
      style: { captionStyle: "classic", zoomPattern: "dynamic", transitionStyle: "smooth", colorGrade: "warm" },
      preview: "🎬",
    };
    setTimeout(() => {
      setMemories((prev) => [newMem, ...prev]);
      setMemName("");
      setShowForm(false);
      setSaving(false);
    }, 1500);
  };

  const handleApply = (mem) => {
    setApplying(mem.id);
    setTimeout(() => {
      onApplyMemory(mem);
      setApplying(null);
    }, 2000);
  };

  return (
    <div className="p-3 space-y-2">
      {/* Create Memory button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 hover:from-emerald-500/20 hover:to-blue-500/20 transition-all">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"><span className="text-xs">🧠</span></div>
          <div className="text-left">
            <div className="text-[10px] text-emerald-400/80 font-medium">Create Memory</div>
            <div className="text-[7px] text-white/20">Save current edit style</div>
          </div>
        </button>
      )}

      {/* Save form */}
      {showForm && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
          <div className="text-[9px] text-white/30 font-medium">Save Editing Memory</div>
          <input value={memName} onChange={(e) => setMemName(e.target.value)} placeholder="e.g. Product Review Style" className="w-full bg-white/5 border border-white/8 rounded px-2 py-1.5 text-[9px] text-white/50 outline-none focus:border-white/20 placeholder:text-white/12" autoFocus />
          <div className="flex gap-1.5">
            <button onClick={handleSave} disabled={saving || !memName.trim()} className={`flex-1 text-[9px] py-1.5 rounded transition-all ${saving ? "bg-emerald-500/30 text-emerald-400/50" : "bg-emerald-500/70 hover:bg-emerald-500 text-white"}`}>{saving ? "⏳ Saving..." : "Save Memory"}</button>
            <button onClick={() => setShowForm(false)} className="text-[9px] px-2 py-1.5 rounded bg-white/5 text-white/30 hover:bg-white/10">Cancel</button>
          </div>
        </div>
      )}

      {/* Memory list */}
      <div className="text-[9px] text-white/18 uppercase tracking-wider pt-1 pb-0.5">Saved Memories</div>
      {memories.length === 0 ? (
        <div className="text-center py-4">
          <div className="text-xl opacity-10 mb-1">🧠</div>
          <div className="text-[8px] text-white/12">No saved memories yet</div>
          <div className="text-[7px] text-white/8">Edit a video and save your style</div>
        </div>
      ) : (
        memories.map((mem) => (
          <div key={mem.id} className="rounded-lg bg-white/5 border border-white/10 p-2.5 hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-500/20 to-purple-500/20 flex items-center justify-center text-sm">{mem.preview || "🎬"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/55 font-medium truncate">{mem.name}</div>
                <div className="text-[7px] text-white/15">{mem.date}</div>
              </div>
              <button onClick={() => handleApply(mem)} disabled={applying === mem.id}
                className={`text-[8px] px-2 py-1 rounded transition-all ${applying === mem.id ? "bg-emerald-500/30 text-emerald-400/50 cursor-wait" : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"}`}
              >
                {applying === mem.id ? "⏳" : "Apply"}
              </button>
            </div>
            {/* Style tags */}
            <div className="flex gap-1 mt-1.5 ml-[42px] flex-wrap">
              {Object.entries(mem.style || {}).slice(0, 3).map(([key, val]) => (
                <span key={key} className="text-[6px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/20">{val}</span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
