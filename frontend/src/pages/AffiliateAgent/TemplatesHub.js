import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const TABS = ["All", "Social Media", "Marketing", "Video", "Design", "Documents", "Website"];
const TAB_COLORS = {
  "Social Media": "text-blue-400 bg-blue-500/10",
  Marketing: "text-emerald-400 bg-emerald-500/10",
  Video: "text-purple-400 bg-purple-500/10",
  Design: "text-pink-400 bg-pink-500/10",
  Documents: "text-amber-400 bg-amber-500/10",
  Website: "text-cyan-400 bg-cyan-500/10",
};

const MOCK_TEMPLATES = [
  { id: 1, name: "Instagram Story Pack", icon: "📸", description: "Animated Instagram story templates with branding overlay.", category: "Social Media", usage: 1240 },
  { id: 2, name: "Email Newsletter", icon: "📧", description: "Responsive email template for product announcements.", category: "Marketing", usage: 890 },
  { id: 3, name: "YouTube Intro", icon: "🎬", description: "Dynamic video intro with motion graphics and transitions.", category: "Video", usage: 670 },
  { id: 4, name: "Brand Guidelines PDF", icon: "📄", description: "Professional brand guidelines document template.", category: "Design", usage: 520 },
  { id: 5, name: "Project Proposal", icon: "📋", description: "Structured proposal template for client pitches.", category: "Documents", usage: 1120 },
  { id: 6, name: "Landing Page", icon: "🌐", description: "High-converting landing page with hero, features, and CTA.", category: "Website", usage: 2340 },
  { id: 7, name: "LinkedIn Carousel", icon: "🔄", description: "Multi-slide LinkedIn carousel for thought leadership.", category: "Social Media", usage: 780 },
  { id: 8, name: "Facebook Ad Creative", icon: "📢", description: "Facebook ad set with copy, imagery, and sizing guides.", category: "Marketing", usage: 950 },
  { id: 9, name: "Video Call BG Pack", icon: "🎥", description: "Virtual background set for professional video calls.", category: "Video", usage: 430 },
  { id: 10, name: "Logo Presentation", icon: "🎨", description: "Logo reveal deck with mood boards and color palettes.", category: "Design", usage: 610 },
  { id: 11, name: "Invoice Template", icon: "🧾", description: "Clean invoice template with auto-calculating fields.", category: "Documents", usage: 1870 },
  { id: 12, name: "Portfolio Site", icon: "👤", description: "Personal portfolio template with project showcase.", category: "Website", usage: 1560 },
  { id: 13, name: "Twitter Thread Blueprint", icon: "🐦", description: "Viral thread structure with hook, body, and CTA framework.", category: "Social Media", usage: 340 },
  { id: 14, name: "Google Ads Copy Pack", icon: "📊", description: "Ad copy variations for search and display campaigns.", category: "Marketing", usage: 720 },
  { id: 15, name: "Exit Intent Popup", icon: "🚪", description: "Exit-intent modal with discount code and email capture.", category: "Website", usage: 890 },
  { id: 16, name: "Social Media Report", icon: "📈", description: "Monthly social analytics report with charts and insights.", category: "Documents", usage: 460 },
];

const SORT_OPTS = ["Popular", "Name", "Newest"];

export default function TemplatesHub() {
  const [templates] = useLocalStorage("brane_templates", MOCK_TEMPLATES);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Popular");
  const [selected, setSelected] = useState(null);

  const byCategory = useMemo(() => {
    const m = {}; TABS.forEach((t) => (m[t] = [])); templates.forEach((t) => { if (m[t.category]) m[t.category].push(t); }); return m;
  }, [templates]);

  const filtered = useMemo(() => {
    let list = templates;
    if (activeTab !== "All") list = list.filter((t) => t.category === activeTab);
    if (search.trim()) list = list.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
    if (sort === "Popular") list = [...list].sort((a, b) => b.usage - a.usage);
    else if (sort === "Name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [templates, activeTab, search, sort]);

  const totalTemplates = templates.length;
  const totalUsage = useMemo(() => templates.reduce((s, t) => s + t.usage, 0), [templates]);
  const detail = useMemo(() => templates.find((t) => t.id === selected), [templates, selected]);
  const fmtCount = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n;

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Templates</h1>
          <div className="text-[11px] text-white/30">{totalTemplates} templates</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Total Templates", v: totalTemplates, c: "text-cyan-400" },
            { l: "Categories", v: Object.keys(byCategory).filter((k) => k !== "All" && byCategory[k].length > 0).length, c: "text-emerald-400" },
            { l: "Total Uses", v: fmtCount(totalUsage), c: "text-purple-400" },
          ].map((card) => (
            <motion.div key={card.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cx}>
              <div className={lx}>{card.l}</div>
              <div className={`text-2xl font-semibold ${card.c}`}>{card.v}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-xs">🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..." className={ix + " pl-8"} />
          </div>
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 flex-wrap">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[11px] rounded-md font-medium transition ${activeTab === tab ? "bg-cyan-500/20 text-cyan-400" : "text-white/30 hover:text-white/60"}`}
              >{tab}</button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="bg-white/5 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-white/50 outline-none focus:border-cyan-500/40"
          >
            {SORT_OPTS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((tmpl) => (
              <motion.div key={tmpl.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(tmpl.id)}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition cursor-pointer group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{tmpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/80 truncate">{tmpl.name}</div>
                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full mt-1 ${TAB_COLORS[tmpl.category] || "text-white/30 bg-white/5"}`}>{tmpl.category}</span>
                  </div>
                </div>
                <div className="text-[11px] text-white/40 line-clamp-2 mb-3">{tmpl.description}</div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/30">Used {fmtCount(tmpl.usage)} times</span>
                  <span className="text-cyan-400/60 group-hover:text-cyan-400 transition">View →</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-xs text-white/20 gap-3">
            <span className="text-4xl text-white/10">📭</span>
            <span>No templates found</span>
            <button onClick={() => { setSearch(""); setActiveTab("All"); }} className="text-[10px] text-cyan-400/60 hover:text-cyan-400 transition">Clear filters</button>
          </div>
        )}
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
                <h2 className="text-sm font-semibold text-white/80">{detail.name}</h2>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/60 transition text-lg leading-none">✕</button>
              </div>
              <div className="flex flex-col items-center mb-5">
                <div className="w-24 h-24 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-5xl mb-3">
                  {detail.icon}
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${TAB_COLORS[detail.category] || "text-white/30 bg-white/5"}`}>{detail.category}</span>
              </div>
              <div className={lx}>Description</div>
              <div className="text-xs text-white/50 mb-4 leading-relaxed">{detail.description}</div>
              <div className="flex items-center justify-between py-2.5 border-b border-white/[0.03] mb-1">
                <span className={lx}>Usage</span>
                <span className="text-xs text-white/60">{fmtCount(detail.usage)} times</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-white/[0.03] mb-5">
                <span className={lx}>Template ID</span>
                <span className="text-[10px] font-mono text-white/30">#TMP-{String(detail.id).padStart(4, "0")}</span>
              </div>
              <button onClick={() => {}}
                className="w-full py-2.5 text-xs font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition flex items-center justify-center gap-1.5"
              >✦ Use Template</button>
              <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Preview</div>
                <div className="flex items-center justify-center h-24 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                  <span className="text-3xl opacity-30">{detail.icon}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
