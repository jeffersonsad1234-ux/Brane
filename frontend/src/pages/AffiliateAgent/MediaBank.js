import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const tabs = ["All", "Images", "Videos", "Audio", "Documents"];

const typeIcons = {
  Images: "🖼️",
  Videos: "🎬",
  Audio: "🎵",
  Documents: "📄",
};

const UID = () => Math.random().toString(36).slice(2, 9);

const mockItems = [
  { id: UID(), type: "Images", name: "hero-banner.jpg", size: "2.4 MB", date: "2026-05-20" },
  { id: UID(), type: "Images", name: "logo-dark.png", size: "856 KB", date: "2026-05-19" },
  { id: UID(), type: "Images", name: "screenshot-ui.png", size: "1.8 MB", date: "2026-05-18" },
  { id: UID(), type: "Videos", name: "product-demo.mp4", size: "24 MB", date: "2026-05-17" },
  { id: UID(), type: "Videos", name: "tutorial-01.mp4", size: "45 MB", date: "2026-05-16" },
  { id: UID(), type: "Audio", name: "voiceover-final.mp3", size: "3.2 MB", date: "2026-05-15" },
  { id: UID(), type: "Audio", name: "bg-music-loop.wav", size: "5.7 MB", date: "2026-05-14" },
  { id: UID(), type: "Documents", name: "brand-guide.pdf", size: "1.2 MB", date: "2026-05-13" },
  { id: UID(), type: "Documents", name: "style-guide.pdf", size: "980 KB", date: "2026-05-12" },
  { id: UID(), type: "Images", name: "thumbnail-01.jpg", size: "340 KB", date: "2026-05-11" },
  { id: UID(), type: "Audio", name: "sfx-pack.zip", size: "8.1 MB", date: "2026-05-10" },
  { id: UID(), type: "Videos", name: "social-clip.mp4", size: "12 MB", date: "2026-05-09" },
];

const totalStorage = 500;
const usedStorage = 105.6;

export default function MediaBank() {
  const [items, setItems] = useLocalStorage("branpy-mediabank", mockItems);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [gridView, setGridView] = useState(true);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchTab = activeTab === "All" || item.type === activeTab;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [items, activeTab, search]);

  const addMedia = () => {
    const types = ["Images", "Videos", "Audio", "Documents"];
    const type = types[Math.floor(Math.random() * types.length)];
    const fileName = `new-${type.toLowerCase()}-${UID().slice(0, 4)}.${type === "Images" ? "png" : type === "Videos" ? "mp4" : type === "Audio" ? "mp3" : "pdf"}`;
    const sizes = ["1.2 MB", "3.4 MB", "860 KB", "2.1 MB", "450 KB"];
    const newItem = {
      id: UID(),
      type,
      name: fileName,
      size: sizes[Math.floor(Math.random() * sizes.length)],
      date: new Date().toISOString().slice(0, 10),
    };
    setItems((prev) => [newItem, ...prev]);
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const usedPercent = Math.min(100, (usedStorage / totalStorage) * 100);

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] text-white/50 select-none overflow-hidden">
      <div className="h-9 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20">Media Bank</span>
        <div className="flex-1" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={addMedia} className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[9px] text-white/30 hover:text-white/50 transition-all">
          + Upload
        </motion.button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06]">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-2.5 py-1 rounded-lg text-[9px] transition-all ${activeTab === tab ? "bg-white/[0.08] text-white/60" : "text-white/20 hover:text-white/40"}`}>
                {tab}
              </button>
            ))}
            <div className="flex-1" />
            <div className="relative">
              <svg className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-white/10" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search media..." className="w-40 bg-white/[0.03] border border-white/[0.06] rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-white/50 outline-none placeholder:text-white/10 focus:border-white/[0.12] transition-colors" />
            </div>
            <button onClick={() => setGridView(!gridView)} className="ml-1 p-1.5 rounded-lg hover:bg-white/[0.04] text-white/20 hover:text-white/40 transition-all">
              {gridView ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 14h4v-4H3v4zm0 7h4v-4H3v4zM3 7h4V3H3v4zm5 7h13v-4H8v4zm0 7h13v-4H8v4zM8 3v4h13V3H8z" /></svg>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[10px] text-white/10">No media found</div>
            ) : (
              <div className={gridView ? "grid grid-cols-4 gap-2" : "space-y-1"}>
                <AnimatePresence initial={false}>
                  {filtered.map((item) => (
                    <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={() => setSelected(item)} className={`p-3 rounded-xl border transition-all cursor-pointer ${selected?.id === item.id ? "bg-white/[0.06] border-white/[0.12]" : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]"}`}>
                      <div className="text-2xl mb-2">{typeIcons[item.type]}</div>
                      <div className="text-[10px] text-white/50 truncate">{item.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[8px] text-white/15">{item.size}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-medium ${item.type === "Images" ? "bg-blue-500/15 text-blue-400/60" : item.type === "Videos" ? "bg-purple-500/15 text-purple-400/60" : item.type === "Audio" ? "bg-emerald-500/15 text-emerald-400/60" : "bg-amber-500/15 text-amber-400/60"}`}>
                          {item.type}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="h-10 flex-shrink-0 border-t border-white/[0.06] flex items-center px-4 gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500/40 to-emerald-500/40 transition-all" style={{ width: `${usedPercent}%` }} />
            </div>
            <span className="text-[8px] text-white/15 font-mono">{usedStorage} MB / {totalStorage} MB</span>
          </div>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l border-white/[0.06] overflow-hidden flex-shrink-0">
              <div className="w-[240px] p-4 space-y-4">
                <div className="text-4xl text-center py-4">{typeIcons[selected.type]}</div>
                <div className="space-y-2">
                  <div className="text-[11px] text-white/60 break-all">{selected.name}</div>
                  <div className="space-y-1 text-[9px] text-white/20">
                    <div className="flex justify-between"><span>Type</span><span className="text-white/30">{selected.type}</span></div>
                    <div className="flex justify-between"><span>Size</span><span className="text-white/30">{selected.size}</span></div>
                    <div className="flex justify-between"><span>Date</span><span className="text-white/30">{selected.date}</span></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <motion.button whileTap={{ scale: 0.97 }} className="w-full py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[9px] text-white/30 hover:text-white/50 transition-all">
                    Download
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => deleteItem(selected.id)} className="w-full py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400/60 text-[9px] hover:bg-red-500/25 transition-all">
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
