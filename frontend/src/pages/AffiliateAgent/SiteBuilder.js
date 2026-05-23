import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const DEFAULT_PAGES = [
  { id: 1, title: "Home", slug: "home", status: "Published", sections: ["Hero", "Features", "Footer"] },
  { id: 2, title: "About", slug: "about", status: "Draft", sections: ["Text", "Image"] },
  { id: 3, title: "Products", slug: "products", status: "Published", sections: ["Gallery", "Text"] },
  { id: 4, title: "Blog", slug: "blog", status: "Draft", sections: ["Hero"] },
  { id: 5, title: "Contact", slug: "contact", status: "Published", sections: ["Contact Form"] },
];

const BLOCK_LIBRARY = [
  { name: "Hero", icon: "★", desc: "Full-width banner with headline" },
  { name: "Text", icon: "¶", desc: "Rich text content block" },
  { name: "Image", icon: "🖼", desc: "Single image with caption" },
  { name: "Gallery", icon: "⊞", desc: "Image grid layout" },
  { name: "Contact Form", icon: "✉", desc: "Email capture form" },
  { name: "Footer", icon: "▼", desc: "Site footer with links" },
];

const SECTION_PREVIEWS = {
  Hero: "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 h-24 flex items-center justify-center text-white/20",
  Features: "bg-white/[0.02] h-16 flex items-center justify-center text-white/20 border border-white/[0.04]",
  Text: "bg-white/[0.01] h-12 flex items-center justify-center text-white/20",
  Image: "bg-white/[0.02] h-20 flex items-center justify-center text-white/20",
  Gallery: "bg-white/[0.01] h-16 flex items-center justify-center text-white/20 border border-white/[0.04]",
  "Contact Form": "bg-white/[0.02] h-14 flex items-center justify-center text-white/20",
  Footer: "bg-white/[0.01] h-10 flex items-center justify-center text-white/20 border-t border-white/[0.04]",
};

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

export default function SiteBuilder() {
  const [pages, setPages] = useLocalStorage("brane_site_pages", DEFAULT_PAGES);
  const [currentId, setCurrentId] = useState(1);
  const [addingPage, setAddingPage] = useState(false);
  const [newPage, setNewPage] = useState({ title: "", slug: "" });

  const current = pages.find((p) => p.id === currentId) || pages[0];

  const addPage = useCallback(() => {
    if (!newPage.title.trim()) return;
    const page = { id: Date.now(), title: newPage.title, slug: newPage.slug || newPage.title.toLowerCase().replace(/\s+/g, "-"), status: "Draft", sections: [] };
    setPages((prev) => [...prev, page]);
    setCurrentId(page.id);
    setNewPage({ title: "", slug: "" });
    setAddingPage(false);
  }, [newPage, setPages]);

  const updateCurrent = useCallback((patch) => {
    setPages((prev) => prev.map((p) => (p.id === currentId ? { ...p, ...patch } : p)));
  }, [currentId, setPages]);

  const addSection = useCallback((blockName) => {
    updateCurrent({ sections: [...(current?.sections || []), blockName] });
  }, [current, updateCurrent]);

  const removeSection = useCallback((index) => {
    const updated = (current?.sections || []).filter((_, i) => i !== index);
    updateCurrent({ sections: updated });
  }, [current, updateCurrent]);

  const deletePage = useCallback(() => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((p) => p.id !== currentId));
    const remaining = pages.filter((p) => p.id !== currentId);
    setCurrentId(remaining[0]?.id || 1);
  }, [currentId, pages, setPages]);

  const moveSection = useCallback((index, dir) => {
    const s = [...(current?.sections || [])];
    const target = index + dir;
    if (target < 0 || target >= s.length) return;
    [s[index], s[target]] = [s[target], s[index]];
    updateCurrent({ sections: s });
  }, [current, updateCurrent]);

  const statusColor = (s) => (s === "Published" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400");

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="flex gap-4 h-full max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="w-48 shrink-0 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/30 uppercase tracking-wider">Pages ({pages.length})</span>
            <button onClick={() => setAddingPage(true)} className="text-[18px] text-white/20 hover:text-cyan-400 transition leading-none">+</button>
          </div>
          <div className="space-y-1 max-h-[70vh] overflow-y-auto">
            {pages.map((page) => (
              <button key={page.id} onClick={() => setCurrentId(page.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${currentId === page.id ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"}`}
              >
                <div className="font-medium truncate">{page.title}</div>
                <div className={`text-[9px] mt-0.5 inline-block px-1.5 py-0.5 rounded-full ${statusColor(page.status)}`}>{page.status}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setAddingPage(true)}
            className="w-full mt-1 py-2 text-[10px] rounded-lg border border-dashed border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20 transition"
          >+ Add Page</button>
        </motion.div>

        <motion.div key={currentId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-0">
          <div className={cx + " min-h-[420px]"}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
              <span className="text-xs text-white/20 uppercase tracking-wider">{current?.title} — Preview ({current?.sections?.length || 0} sections)</span>
              <div className="flex gap-1">
                <span className="text-[18px] text-white/30">{current?.title === "Home" ? "🏠" : current?.title === "About" ? "ℹ️" : current?.title === "Contact" ? "✉️" : "📄"}</span>
              </div>
            </div>
            <div className="space-y-2">
              {current?.sections?.map((sec, i) => (
                <div key={i} className="group relative bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden">
                  <div className={`${SECTION_PREVIEWS[sec] || "bg-white/[0.02] h-12"} text-[10px]`}>
                    {sec}
                  </div>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.02] border-t border-white/[0.04]">
                    <span className="text-[9px] text-white/20 uppercase tracking-wider">{sec} — Section {i + 1}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => moveSection(i, -1)} disabled={i === 0}
                        className="text-white/20 hover:text-white/60 transition text-[10px] disabled:opacity-20 px-1"
                      >▲</button>
                      <button onClick={() => moveSection(i, 1)} disabled={i === (current?.sections?.length || 1) - 1}
                        className="text-white/20 hover:text-white/60 transition text-[10px] disabled:opacity-20 px-1"
                      >▼</button>
                      <button onClick={() => removeSection(i)}
                        className="text-red-400/40 hover:text-red-400 transition text-[10px] px-1"
                      >✕</button>
                    </div>
                  </div>
                </div>
              ))}
              {(!current?.sections || current.sections.length === 0) && (
                <div className="text-center py-14 text-white/20 text-xs border-2 border-dashed border-white/[0.06] rounded-lg">
                  No sections yet — click a block below to add one
                </div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[11px] text-white/30 uppercase tracking-wider mb-2">Block Library</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {BLOCK_LIBRARY.map((b) => (
                <button key={b.name} onClick={() => addSection(b.name)}
                  className="px-2 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition flex flex-col items-center gap-1 group"
                >
                  <span className="text-lg group-hover:scale-110 transition">{b.icon}</span>
                  <span className="text-[10px]">{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="w-56 shrink-0 space-y-4">
          <div className={cx}>
            <div className="text-[11px] text-white/30 uppercase tracking-wider mb-3">Page Properties</div>
            <div className="space-y-3">
              <div>
                <div className={lx}>Title</div>
                <input value={current?.title || ""} onChange={(e) => updateCurrent({ title: e.target.value })} className={ix} />
              </div>
              <div>
                <div className={lx}>Slug</div>
                <input value={current?.slug || ""} onChange={(e) => updateCurrent({ slug: e.target.value })} className={ix} />
              </div>
              <div>
                <div className={lx}>Status</div>
                <button onClick={() => updateCurrent({ status: current?.status === "Published" ? "Draft" : "Published" })}
                  className={`w-full py-2 rounded-lg text-[10px] font-medium border transition ${current?.status === "Published" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-amber-500/15 text-amber-400 border-amber-500/20"}`}
                >{current?.status}</button>
              </div>
              <div>
                <div className={lx}>Sections</div>
                <div className="text-xs text-white/50">{current?.sections?.length || 0} blocks</div>
              </div>
              <div>
                <div className={lx}>ID</div>
                <div className="text-xs text-white/30 font-mono">#{current?.id}</div>
              </div>
            </div>
          </div>
          <button onClick={() => addSection("Hero")}
            className="w-full py-2 text-[10px] rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/30 transition"
          >+ Add Section</button>
          {pages.length > 1 && (
            <button onClick={deletePage}
              className="w-full py-2 text-[10px] rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition"
            >Delete Page</button>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {addingPage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setAddingPage(false)}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white/90 mb-4">Add Page</h3>
              <div className="space-y-3">
                <input placeholder="Page title" value={newPage.title} onChange={(e) => setNewPage((p) => ({ ...p, title: e.target.value }))} className={ix} />
                <input placeholder="Slug (optional)" value={newPage.slug} onChange={(e) => setNewPage((p) => ({ ...p, slug: e.target.value }))} className={ix} />
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setAddingPage(false)} className="flex-1 py-2 text-xs rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 transition">Cancel</button>
                <button onClick={addPage} className="flex-1 py-2 text-xs font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition">Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
