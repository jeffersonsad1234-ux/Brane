import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const defaultSounds = [
  { id: "sfx1", name: "Click Pop", category: "UI", duration: 0.3, tags: ["click", "interface", "pop"], icon: "▁" },
  { id: "sfx2", name: "Notification Chime", category: "Notification", duration: 1.2, tags: ["chime", "alert", "bell"], icon: "▂" },
  { id: "sfx3", name: "Success Fanfare", category: "Notification", duration: 2.5, tags: ["success", "fanfare", "celebration"], icon: "▃" },
  { id: "sfx4", name: "Forest Ambience", category: "Ambient", duration: 30, tags: ["nature", "forest", "calm"], icon: "▄" },
  { id: "sfx5", name: "Rain Drops", category: "Ambient", duration: 45, tags: ["rain", "water", "weather"], icon: "▅" },
  { id: "sfx6", name: "Alert Siren", category: "Alert", duration: 1.8, tags: ["siren", "warning", "urgent"], icon: "▆" },
  { id: "sfx7", name: "Button Hover", category: "UI", duration: 0.15, tags: ["hover", "button", "soft"], icon: "▇" },
  { id: "sfx8", name: "Error Buzz", category: "Alert", duration: 0.8, tags: ["error", "buzz", "fail"], icon: "█" },
];

const categories = ["All", "UI", "Notification", "Ambient", "Alert"];

function WaveformIcon({ active }) {
  return (
    <div className="flex items-end gap-[2px] h-6">
      {[4, 8, 5, 10, 6, 12, 7, 14, 6, 11, 5, 9].map((h, i) => (
        <motion.div
          key={i}
          animate={active ? { height: [h * 2, h * 6, h * 2], opacity: [0.4, 1, 0.4] } : { height: h * 2, opacity: 0.3 }}
          transition={{ duration: 0.6 + i * 0.08, repeat: active ? Infinity : 0, ease: "easeInOut" }}
          className="w-[3px] rounded-full bg-emerald-400"
        />
      ))}
    </div>
  );
}

export default function SoundFXStudio() {
  const [sounds, setSounds] = useLocalStorage("branpy-soundfx", defaultSounds);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  const filtered = useMemo(() => {
    return sounds.filter((s) => {
      const matchCat = catFilter === "All" || s.category === catFilter;
      const matchSearch = !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()) || s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [sounds, search, catFilter]);

  const handlePlay = (id) => {
    if (playingId === id) { setPlayingId(null); return; }
    setPlayingId(id);
    setTimeout(() => setPlayingId(null), 2000);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Sound FX Studio</span>
        <div className="flex-1" />
        <span className="text-[8px] text-white/10 font-mono">{sounds.length} sounds</span>
      </div>

      <div className="flex-shrink-0 px-4 py-2 border-b border-white/[0.06] space-y-2">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5">
          <svg className="w-3.5 h-3.5 text-white/20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sounds..." className="flex-1 bg-transparent text-[11px] text-white/50 outline-none placeholder:text-white/10" />
          {search && <button onClick={() => setSearch("")} className="text-white/15 hover:text-white/40"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg></button>}
        </div>
        <div className="flex gap-1.5">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCatFilter(cat)} className={`px-2.5 py-1 rounded-md text-[9px] transition-all ${catFilter === cat ? "bg-white/[0.1] text-white/60" : "text-white/20 hover:text-white/40 hover:bg-white/[0.03]"}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-4 gap-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((sfx) => (
                <motion.div
                  key={sfx.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => { setSelected(sfx); handlePlay(sfx.id); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selected?.id === sfx.id
                      ? "border-white/[0.12] bg-white/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/25 uppercase tracking-wider">{sfx.category}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handlePlay(sfx.id); }}
                      className="text-white/20 hover:text-emerald-400 transition-colors"
                    >
                      {playingId === sfx.id ? <WaveformIcon active /> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                    </motion.button>
                  </div>
                  <div className="text-[11px] text-white/70 font-medium mb-1">{sfx.name}</div>
                  <div className="flex items-center gap-2 text-[8px] text-white/20">
                    <span>{sfx.duration}s</span>
                    <span className="font-mono text-emerald-400/40">{sfx.icon}</span>
                  </div>
                  {selected?.id === sfx.id && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                      <button className="flex-1 text-[8px] py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.12] text-white/40 hover:text-white/60 transition-all">Download</button>
                      <button className="flex-1 text-[8px] py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400/70 hover:text-emerald-400 transition-all">Add to Project</button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-full text-[11px] text-white/15">No sounds match your search</div>
          )}
        </div>

        {selected && (
          <div className="w-56 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.1em]">Details</span>
              <button onClick={() => setSelected(null)} className="text-white/15 hover:text-white/40"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg></button>
            </div>
            <div className="space-y-2">
              <div className="text-[13px] text-white/70 font-medium">{selected.name}</div>
              <div className="flex items-center gap-2 text-[9px]"><span className="text-white/20">Category:</span><span className="text-white/45">{selected.category}</span></div>
              <div className="flex items-center gap-2 text-[9px]"><span className="text-white/20">Duration:</span><span className="text-white/45">{selected.duration}s</span></div>
              <div className="text-[9px] text-white/20 mb-1">Tags:</div>
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((tag) => (
                  <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/25">{tag}</span>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-white/[0.06]">
                <WaveformIcon active />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
