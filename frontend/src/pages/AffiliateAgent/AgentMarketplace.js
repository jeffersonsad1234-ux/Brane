import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const CATEGORIES = ["All", "AI", "Marketing", "Productivity", "Design", "Development"];

const MOCK_AGENTS = [
  { id:"agent-1", name:"BRANPY Writer Pro", icon:"\u{1F4DD}", category:"AI", description:"Advanced AI writing assistant for content creation, copywriting, and editing with multi-language support.", rating:4.8, price:"$29/mo", features:["GPT-4 powered", "50+ templates", "Multi-language", "SEO optimization"] },
  { id:"agent-2", name:"Canvas AI", icon:"\u{1F3A8}", category:"Design", description:"AI-powered design agent that generates social media graphics, banners, and brand assets in seconds.", rating:4.6, price:"$19/mo", features:["AI image generation", "Brand kits", "Batch export", "Template library"] },
  { id:"agent-3", name:"MarketPulse", icon:"\u{1F4CA}", category:"Marketing", description:"Real-time market analytics and competitor tracking agent for data-driven campaign decisions.", rating:4.7, price:"$49/mo", features:["Competitor tracking", "Trend analysis", "Custom reports", "API access"] },
  { id:"agent-4", name:"InboxIQ", icon:"\u{2709}\uFE0F", category:"Productivity", description:"Smart email management agent that prioritizes, summarizes, and automates your inbox workflow.", rating:4.5, price:"$12/mo", features:["Smart filtering", "Auto-reply drafts", "Priority sorting", "Calendar sync"] },
  { id:"agent-5", name:"CodeForge", icon:"\u{1F4BB}", category:"Development", description:"AI pair programmer that reviews code, generates tests, and suggests optimizations in real time.", rating:4.9, price:"$39/mo", features:["Real-time review", "Test generation", "Refactoring", "CI integration"] },
  { id:"agent-6", name:"Social Sync", icon:"\u{1F4F1}", category:"Marketing", description:"Social media scheduling and analytics agent that optimizes post timing across all platforms.", rating:4.4, price:"$15/mo", features:["Cross-platform", "Optimal timing", "Analytics", "Content calendar"] },
  { id:"agent-7", name:"DataPulse", icon:"\u{1F4CA}", category:"AI", description:"Automated data pipeline agent that cleans, transforms, and visualizes your business data.", rating:4.3, price:"$35/mo", features:["Auto-cleaning", "Visualization", "Scheduled runs", "Export formats"] },
  { id:"agent-8", name:"TaskForge", icon:"\u{1F3ED}", category:"Productivity", description:"Project management agent that creates workflows, assigns tasks, and tracks team progress.", rating:4.6, price:"$22/mo", features:["Workflow builder", "Task automation", "Team dashboard", "Slack integration"] },
  { id:"agent-9", name:"BrandKit AI", icon:"\u{1F3A8}", category:"Design", description:"Brand identity agent that generates logos, color palettes, typography, and brand guidelines.", rating:4.7, price:"$25/mo", features:["Logo generation", "Color palettes", "Typography pairs", "Brand guide PDF"] },
  { id:"agent-10", name:"DeployBot", icon:"\u{1F680}", category:"Development", description:"CI/CD automation agent that manages deployments, rollbacks, and environment configurations.", rating:4.5, price:"$45/mo", features:["Zero-downtime deploy", "Auto rollback", "Multi-env", "Health checks"] },
  { id:"agent-11", name:"ContentAI", icon:"\u{1F3A5}", category:"Marketing", description:"Video and blog content repurposing agent that transforms long-form content into multi-format assets.", rating:4.2, price:"$18/mo", features:["Auto repurpose", "Multi-format", "SEO metadata", "Scheduled posts"] },
  { id:"agent-12", name:"QueryMind", icon:"\u{1F9E0}", category:"AI", description:"Natural language query agent that connects to your databases and returns insights in plain English.", rating:4.8, price:"$59/mo", features:["NL to SQL", "Multi-database", "Visual results", "Saved queries"] },
];

const CARD_CLASS = "rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden";

export default function AgentMarketplace() {
  const [installed, setInstalled] = useLocalStorage("brane_installed_agents", []);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    return MOCK_AGENTS.filter((a) => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || a.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const isInstalled = useCallback((id) => installed.includes(id), [installed]);

  const handleInstall = useCallback((id) => {
    setInstalled((prev) => prev.includes(id) ? prev : [...prev, id]);
  }, [setInstalled]);

  const handleUninstall = useCallback((id) => {
    setInstalled((prev) => prev.filter((i) => i !== id));
  }, [setInstalled]);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">Agent Marketplace</h1>
          <span className="text-xs text-white/20">{filtered.length} agents</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-white/20 focus:bg-white/[0.08] transition"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                  category === cat ? "bg-white/10 text-white border border-white/10" : "text-white/40 hover:text-white/70 border border-transparent"
                }`}
              >{cat}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((agent, i) => (
            <motion.div key={agent.id} layout initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              onClick={() => setSelected(agent)}
              className={`${CARD_CLASS} p-4 cursor-pointer hover:bg-white/[0.04] hover:border-white/10 transition-all relative group`}
            >
              {isInstalled(agent.id) && (
                <div className="absolute top-2.5 right-2.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Installed
                </div>
              )}
              <div className="text-2xl mb-2">{agent.icon}</div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-sm font-medium text-white/80 truncate">{agent.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/[0.06]">{agent.category}</span>
              </div>
              <p className="text-xs text-white/40 line-clamp-2 mt-1 mb-2">{agent.description}</p>
              <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-amber-400/80">\u2605</span>
                  <span className="text-white/60">{agent.rating}</span>
                </div>
                <span className="text-xs font-medium text-white/70">{agent.price}</span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex items-center justify-center h-32 text-xs text-white/20">
              No agents match your search
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div layout initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
              transition={{ duration:0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/[0.06] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6 pb-4 border-b border-white/[0.06]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selected.icon}</span>
                    <div>
                      <h2 className="text-lg font-semibold text-white/90">{selected.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/[0.06]">{selected.category}</span>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-amber-400/80">\u2605</span>
                          <span className="text-white/60">{selected.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white/60 text-xs p-1">\u2715</button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-sm text-white/50 leading-relaxed">{selected.description}</p>
                <div>
                  <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Features</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {selected.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-1.5 text-xs text-white/60">
                        <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-sm text-white/50">Pricing</span>
                  <span className="text-lg font-semibold text-white/90">{selected.price}</span>
                </div>
                {isInstalled(selected.id) ? (
                  <button onClick={() => handleUninstall(selected.id)}
                    className="w-full py-2.5 text-xs font-medium rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition"
                  >Uninstall</button>
                ) : (
                  <button onClick={() => handleInstall(selected.id)}
                    className="w-full py-2.5 text-xs font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 transition"
                  >Install Agent</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
