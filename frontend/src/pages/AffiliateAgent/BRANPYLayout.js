import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const CATEGORIES = [
  { id: "create", label: "Create" }, { id: "ai", label: "AI" }, { id: "business", label: "Business" },
  { id: "marketing", label: "Marketing" }, { id: "developer", label: "Developer" }, { id: "media", label: "Media" },
  { id: "productivity", label: "Productivity" }, { id: "automation", label: "Automation" }, { id: "cloud", label: "Cloud" },
  { id: "future", label: "Labs" },
];

const APPS = [
  { id: "image-studio", name: "Image Studio", icon: "🎨", cat: "create", route: "/affiliate-agent/image-studio", desc: "AI image generation & editing" },
  { id: "logo-studio", name: "Logo Studio", icon: "⭐", cat: "create", route: "/affiliate-agent/logo-studio", desc: "Professional logo design" },
  { id: "mockup-studio", name: "Mockup Studio", icon: "🖼️", cat: "create", route: "/affiliate-agent/mockup-studio", desc: "Product & brand mockups" },
  { id: "brand-studio", name: "Brand Studio", icon: "🏷️", cat: "create", route: "/affiliate-agent/brand-studio", desc: "Complete brand identity" },
  { id: "canva-editor", name: "Canva Editor", icon: "🎯", cat: "create", route: "/affiliate-agent/canva-editor", desc: "Drag-drop graphic design" },
  { id: "photoshop-editor", name: "Photoshop Editor", icon: "🖌️", cat: "create", route: "/affiliate-agent/photoshop-editor", desc: "Advanced photo editing" },
  { id: "ai-art", name: "AI Art Generator", icon: "🌈", cat: "create", route: "/affiliate-agent/ai-art", desc: "Generate art with AI" },
  { id: "studio-3d", name: "3D Studio", icon: "🧊", cat: "create", route: "/affiliate-agent/studio-3d", desc: "3D modeling & rendering" },
  { id: "chat", name: "AI Chat", icon: "💬", cat: "ai", route: "/affiliate-agent/chat", desc: "Conversational AI assistant" },
  { id: "branpy-core", name: "BRANPY Core AI", icon: "🧠", cat: "ai", desc: "Core AI engine & orchestration" },
  { id: "multi-agent", name: "Multi-Agent System", icon: "🤖", cat: "ai", desc: "Orchestrate multiple AI agents" },
  { id: "ai-assistant", name: "AI Assistant", icon: "🎙️", cat: "ai", desc: "Personal AI productivity assistant" },
  { id: "ai-memory", name: "AI Memory", icon: "📀", cat: "ai", desc: "Persistent memory & context" },
  { id: "ai-researcher", name: "AI Researcher", icon: "🔬", cat: "ai", desc: "Deep research & analysis" },
  { id: "ai-browser", name: "AI Browser", icon: "🌐", cat: "ai", desc: "Autonomous web browsing" },
  { id: "ai-operator", name: "AI Operator", icon: "⚙️", cat: "ai", desc: "Execute actions across apps" },
  { id: "ai-workflow", name: "AI Workflow Engine", icon: "🔄", cat: "ai", desc: "Design & run AI workflows" },
  { id: "leads-crm", name: "CRM", icon: "👥", cat: "business", route: "/affiliate-agent/leads-crm", desc: "Customer relationship management" },
  { id: "leads-center", name: "Leads Center", icon: "📋", cat: "business", route: "/affiliate-agent/leads-center", desc: "Lead capture & scoring" },
  { id: "sales-funnels", name: "Sales Funnels", icon: "🔄", cat: "business", desc: "Build & optimize funnels" },
  { id: "marketplace", name: "Marketplace", icon: "🏪", cat: "business", route: "/affiliate-agent/agent-marketplace", desc: "Multi-vendor marketplace" },
  { id: "affiliate", name: "Affiliate AI", icon: "🛍️", cat: "business", route: "/affiliate-agent/affiliate", desc: "Affiliate marketing automation" },
  { id: "ecommerce", name: "E-commerce", icon: "🛒", cat: "business", route: "/affiliate-agent/ecommerce", desc: "Online store management" },
  { id: "finance-hub", name: "Finance Hub", icon: "💰", cat: "business", route: "/affiliate-agent/finance-hub", desc: "Financial management & insights" },
  { id: "subscriptions", name: "Subscription Mgr", icon: "📅", cat: "business", desc: "Recurring billing & plans" },
  { id: "invoices", name: "Invoice Center", icon: "📄", cat: "business", route: "/affiliate-agent/invoices", desc: "Invoicing & payment tracking" },
  { id: "payments", name: "Payment Center", icon: "💳", cat: "business", desc: "Payment processing & gateway" },
  { id: "social-publisher", name: "Social Publisher", icon: "📢", cat: "marketing", route: "/affiliate-agent/social-publisher", desc: "Schedule & publish to social" },
  { id: "ads-manager", name: "Ads Manager", icon: "📊", cat: "marketing", desc: "Multi-platform ad campaigns" },
  { id: "viral-analyzer", name: "Viral Analyzer", icon: "🔥", cat: "marketing", desc: "Viral trend detection" },
  { id: "trend-research", name: "Trend Research", icon: "📈", cat: "marketing", desc: "Market & trend intelligence" },
  { id: "seo-studio", name: "SEO Studio", icon: "🔍", cat: "marketing", desc: "Search optimization toolkit" },
  { id: "copywriting", name: "Copywriting AI", icon: "✍️", cat: "marketing", desc: "AI-powered copy generation" },
  { id: "campaign-center", name: "Campaign Center", icon: "🎯", cat: "marketing", desc: "Multi-channel campaigns" },
  { id: "email-marketing", name: "Email Marketing", icon: "📧", cat: "marketing", desc: "Email automation & sequences" },
  { id: "social-automation", name: "Social Automation", icon: "🔄", cat: "marketing", desc: "Auto-post & engagement" },
  { id: "code-generator", name: "Dev Agent", icon: "💻", cat: "developer", route: "/affiliate-agent/code-generator", desc: "AI pair programmer" },
  { id: "code-studio", name: "Code Studio", icon: "⌨️", cat: "developer", route: "/affiliate-agent/code-studio", desc: "Full IDE with AI" },
  { id: "site-builder", name: "Site Builder", icon: "🌐", cat: "developer", route: "/affiliate-agent/site-builder", desc: "Drag-drop website builder" },
  { id: "app-builder", name: "App Builder", icon: "📱", cat: "developer", desc: "No-code app creation" },
  { id: "mobile-builder", name: "Mobile Builder", icon: "📲", cat: "developer", desc: "React Native app builder" },
  { id: "game-builder", name: "Game Builder", icon: "🎮", cat: "developer", desc: "2D/3D game development" },
  { id: "api-builder", name: "API Builder", icon: "🔌", cat: "developer", desc: "Design & deploy APIs" },
  { id: "database-studio", name: "Database Studio", icon: "🗄️", cat: "developer", desc: "Database management" },
  { id: "terminal-cloud", name: "Terminal Cloud", icon: "💲", cat: "developer", desc: "Cloud terminal & SSH" },
  { id: "hosting-manager", name: "Hosting Manager", icon: "🌍", cat: "developer", desc: "Managed hosting & domains" },
  { id: "deploy-center", name: "Deploy Center", icon: "🚀", cat: "developer", desc: "One-click deployments" },
  { id: "git-manager", name: "Git Manager", icon: "🔀", cat: "developer", desc: "Git version control" },
  { id: "video-studio", name: "Video Studio", icon: "🎬", cat: "media", route: "/affiliate-agent/video-studio", desc: "Professional video editor" },
  { id: "movie-studio", name: "Movie Studio", icon: "🎥", cat: "media", desc: "Cinematic movie creation" },
  { id: "animation-studio", name: "Animation Studio", icon: "🌀", cat: "media", desc: "2D/3D animation" },
  { id: "streaming-studio", name: "Streaming Studio", icon: "📡", cat: "media", route: "/affiliate-agent/streaming-studio", desc: "Live streaming production" },
  { id: "podcast-studio", name: "Podcast Studio", icon: "🎙️", cat: "media", route: "/affiliate-agent/podcast-studio", desc: "Record & edit podcasts" },
  { id: "voice-ai", name: "Voice Studio", icon: "🎤", cat: "media", route: "/affiliate-agent/voice-ai", desc: "AI voice generation & cloning" },
  { id: "music-sounds", name: "Music Studio", icon: "🎵", cat: "media", route: "/affiliate-agent/music-sounds", desc: "Music production & editing" },
  { id: "sound-fx", name: "Sound FX Studio", icon: "🔊", cat: "media", route: "/affiliate-agent/sound-fx", desc: "Sound effects library & tools" },
  { id: "ai-dub", name: "AI Dub Studio", icon: "🌍", cat: "media", route: "/affiliate-agent/ai-dub", desc: "AI dubbing & localization" },
  { id: "subtitles", name: "Subtitle Studio", icon: "📝", cat: "media", route: "/affiliate-agent/subtitles", desc: "Auto subtitle generation" },
  { id: "thumbnail-studio", name: "Thumbnail Studio", icon: "🖼️", cat: "media", route: "/affiliate-agent/thumbnail-studio", desc: "Video thumbnail creator" },
  { id: "banner-studio", name: "Banner Studio", icon: "📐", cat: "media", route: "/affiliate-agent/banner-studio", desc: "Ad & social banners" },
  { id: "documents", name: "Documents AI", icon: "📄", cat: "productivity", route: "/affiliate-agent/documents", desc: "AI-powered document creation" },
  { id: "spreadsheet", name: "Spreadsheet AI", icon: "📊", cat: "productivity", route: "/affiliate-agent/spreadsheet", desc: "Smart spreadsheet editor" },
  { id: "presentations", name: "Presentation Builder", icon: "📽️", cat: "productivity", route: "/affiliate-agent/presentations", desc: "AI presentation designer" },
  { id: "notes", name: "Notes", icon: "📓", cat: "productivity", route: "/affiliate-agent/notes", desc: "Rich notes & knowledge base" },
  { id: "projects", name: "Projects", icon: "📁", cat: "productivity", route: "/affiliate-agent/projects", desc: "Project management hub" },
  { id: "tasks", name: "Tasks", icon: "✅", cat: "productivity", route: "/affiliate-agent/tasks", desc: "Task management & tracking" },
  { id: "workspace", name: "Workspace", icon: "🏠", cat: "productivity", route: "/affiliate-agent/workspace", desc: "Customizable workspace" },
  { id: "team-chat", name: "Team Chat", icon: "💬", cat: "productivity", route: "/affiliate-agent/team-chat", desc: "Real-time team messaging" },
  { id: "calendar", name: "Calendar", icon: "📅", cat: "productivity", route: "/affiliate-agent/calendar", desc: "Smart calendar & scheduling" },
  { id: "meetings", name: "Meetings", icon: "🎥", cat: "productivity", route: "/affiliate-agent/meetings", desc: "Video conferencing" },
  { id: "whiteboard", name: "Whiteboard", icon: "✏️", cat: "productivity", route: "/affiliate-agent/whiteboard", desc: "Collaborative whiteboard" },
  { id: "automation-hub", name: "Automation Hub", icon: "🧩", cat: "automation", route: "/affiliate-agent/automation-hub", desc: "Automate workflows & tasks" },
  { id: "import-products", name: "Product Importer", icon: "📥", cat: "automation", route: "/affiliate-agent/importar", desc: "Import products via URL" },
  { id: "schedule-posts", name: "Schedule Posts", icon: "⏰", cat: "automation", route: "/affiliate-agent/schedule-posts", desc: "Auto-schedule content" },
  { id: "data-pipeline", name: "Data Pipeline", icon: "🔀", cat: "automation", desc: "ETL & data integration" },
  { id: "webhooks", name: "Webhooks", icon: "🔗", cat: "automation", route: "/affiliate-agent/webhooks", desc: "Webhook management" },
  { id: "analytics", name: "Analytics", icon: "📊", cat: "automation", route: "/affiliate-agent/analytics", desc: "Advanced analytics & BI" },
  { id: "reports", name: "Reports", icon: "📑", cat: "automation", route: "/affiliate-agent/reports", desc: "Automated report generation" },
  { id: "monitoring", name: "Monitoring", icon: "📡", cat: "automation", desc: "System & app monitoring" },
  { id: "cloud-drive", name: "Cloud Drive", icon: "☁️", cat: "cloud", route: "/affiliate-agent/cloud-drive", desc: "Secure cloud file storage" },
  { id: "assets-manager", name: "Assets Manager", icon: "📦", cat: "cloud", route: "/affiliate-agent/assets-manager", desc: "Digital asset management" },
  { id: "media-bank", name: "Media Library", icon: "🏦", cat: "cloud", route: "/affiliate-agent/media-bank", desc: "Media & video library" },
  { id: "templates-hub", name: "Templates Hub", icon: "📂", cat: "cloud", route: "/affiliate-agent/templates-hub", desc: "Template marketplace" },
  { id: "brand-kits", name: "Brand Kits", icon: "🎨", cat: "cloud", route: "/affiliate-agent/brand-kits", desc: "Centralized brand assets" },
  { id: "backup-center", name: "Backup Center", icon: "💾", cat: "cloud", desc: "Automated backup & restore" },
  { id: "ai-vtuber", name: "AI VTuber", icon: "🎭", cat: "future", desc: "Virtual YouTuber AI" },
  { id: "ai-influencer", name: "AI Influencer", icon: "🌟", cat: "future", desc: "AI social influencer" },
  { id: "ai-employees", name: "AI Employees", icon: "👥", cat: "future", desc: "Autonomous AI workers" },
  { id: "ai-video-gen", name: "AI Video Generator", icon: "🎞️", cat: "future", desc: "Text-to-video generation" },
  { id: "ai-movie-gen", name: "AI Movie Generator", icon: "🍿", cat: "future", desc: "Full movie creation" },
  { id: "ai-world", name: "AI World Builder", icon: "🌍", cat: "future", desc: "Virtual world creation" },
  { id: "ai-character", name: "AI Character Creator", icon: "🧑‍🎤", cat: "future", desc: "3D character design" },
  { id: "ai-stream-host", name: "AI Stream Host", icon: "📺", cat: "future", desc: "AI-powered live host" },
  { id: "ai-call-center", name: "AI Call Center", icon: "📞", cat: "future", desc: "AI phone agents" },
  { id: "ai-creator-engine", name: "AI Creator Engine", icon: "⚡", cat: "future", desc: "Unified AI creation" },
];

const CAT_ICONS = {
  create: "🎨", ai: "🧠", business: "💼", marketing: "📈", developer: "💻",
  media: "🎬", productivity: "⚡", automation: "🤖", cloud: "☁️", future: "🔮",
};

/* ─── Dense App Card ─── */
function AppCard({ app, onClick, isFavorite, onToggleFavorite }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-all hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] cursor-pointer"
    >
      <div className="w-7 h-7 rounded flex items-center justify-center text-xs flex-shrink-0 bg-white/[0.04]">{app.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-white/60 leading-tight truncate">{app.name}</div>
        <div className="text-[8px] text-white/20 truncate">{app.desc || ""}</div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(app.id); }}
        className={`flex-shrink-0 w-4 h-4 flex items-center justify-center text-[8px] rounded transition-opacity ${isFavorite ? "text-amber-400/60" : "opacity-0 group-hover:opacity-100 text-white/15 hover:text-white/35"}`}
      >{isFavorite ? "★" : "☆"}</button>
    </button>
  );
}

/* ─── TopBar ─── */
function TopBar({ search, onSearchChange, onNewProject, recentCount, activeCount }) {
  const inputRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex-shrink-0 flex items-center px-4 gap-3 h-11 border-b border-white/[0.06]" style={{ background: "rgba(10,10,10,0.95)" }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-emerald-600"><svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
        <span className="text-[11px] font-bold tracking-tight text-white/45">BRANPY</span>
      </div>
      <div className="flex-1 max-w-sm">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]">
          <svg className="w-3 h-3 text-white/15" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"/></svg>
          <input ref={inputRef} value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search tools…" className="bg-transparent text-[10px] outline-none w-full text-white/40 placeholder:text-white/12" />
          <kbd className="text-[7px] font-mono px-1 py-0.5 rounded border border-white/[0.06] text-white/10">⌘K</kbd>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[9px] text-white/15">
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />{activeCount > 0 ? `${activeCount} active` : "Ready"}</div>
      </div>
      <div className="w-px h-4 bg-white/[0.06]" />
      <button onClick={onNewProject} className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] bg-white/[0.04] text-white/35 hover:bg-white/[0.08] hover:text-white/55 transition-all">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        New
      </button>
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold bg-gradient-to-br from-emerald-500/60 to-blue-600/60 text-white/80">J</div>
    </div>
  );
}

/* ─── Status Bar ─── */
function StatusBar({ toolCount, catCount }) {
  return (
    <div className="flex-shrink-0 h-6 flex items-center px-4 gap-3 text-[8px] border-t border-white/[0.03] text-white/10 bg-[#080808]">
      <span>BRANPY v3.0</span>
      <span className="text-white/[0.04]">·</span>
      <span>{toolCount} tools · {catCount} categories</span>
      <div className="flex-1" />
      <span>⌘K Palette</span>
    </div>
  );
}

/* ─── Category Section ─── */
function CategorySection({ cat, apps, onAppOpen, favorites, onToggleFavorite, collapsed, onToggle }) {
  if (!apps || apps.length === 0) return null;
  return (
    <div className="mb-4">
      <button onClick={onToggle} className="flex items-center gap-1.5 px-0.5 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-white/20 hover:text-white/35 transition-colors w-full text-left cursor-pointer">
        <span className="text-[10px]">{CAT_ICONS[cat]}</span>
        <span>{cat}</span>
        <span className="text-white/8 font-normal ml-auto">{apps.length}</span>
        <motion.span animate={{ rotate: collapsed ? 0 : 90 }} className="text-[7px] text-white/10">▸</motion.span>
      </button>
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-px pt-0.5">
              {apps.map((app) => (
                <AppCard key={app.id} app={app} onClick={() => onAppOpen(app.id)} isFavorite={favorites.includes(app.id)} onToggleFavorite={onToggleFavorite} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── HomeView ─── */
function HomeView({ apps, search, onSearchChange, onAppOpen, onNewProject, favorites, onToggleFavorite, recents, allApps, activeCat, onCatChange }) {
  const grouped = useMemo(() => {
    const g = {};
    CATEGORIES.forEach((c) => { g[c.id] = []; });
    apps.forEach((a) => { if (!g[a.cat]) g[a.cat] = []; g[a.cat].push(a); });
    return g;
  }, [apps]);

  const [collapsed, setCollapsed] = useLocalStorage("branpy_cat_collapsed", {});
  const toggleCat = (id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <TopBar search={search} onSearchChange={onSearchChange} onNewProject={onNewProject} recentCount={(recents || []).length} activeCount={0} />
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar — Compact category nav */}
        <div className="w-12 flex-shrink-0 flex flex-col items-center py-2 gap-0.5 border-r border-white/[0.05] bg-[#090909]">
          <button onClick={() => onCatChange("all")}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] transition-all ${activeCat === "all" ? "bg-white/10 text-white/60" : "text-white/15 hover:text-white/35"}`}
            title="All"
          >◻</button>
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => onCatChange(activeCat === cat.id ? "all" : cat.id)}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] transition-all relative ${activeCat === cat.id ? "bg-white/10 text-white/60" : "text-white/15 hover:text-white/35"}`}
              title={cat.label}
            ><span>{CAT_ICONS[cat.id]}</span>
              {activeCat === cat.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-r bg-emerald-500/60" />}
            </button>
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Quick bar — category chips + recents */}
          <div className="flex-shrink-0 flex items-center px-4 py-2 gap-2 border-b border-white/[0.03] overflow-x-auto scrollbar-none">
            <div className="flex gap-1 text-[8px]">
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => onCatChange(activeCat === cat.id ? "all" : cat.id)}
                  className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${activeCat === cat.id ? "bg-white/10 text-white/50" : "text-white/15 hover:text-white/30 hover:bg-white/[0.03]"}`}
                >{cat.label}</button>
              ))}
            </div>
            {(recents || []).length > 0 && (
              <>
                <div className="w-px h-3 bg-white/[0.06]" />
                <div className="flex gap-1 text-[8px] overflow-x-auto scrollbar-none">
                  {recents.slice(0, 5).map((id) => {
                    const app = allApps.find((a) => a.id === id);
                    if (!app) return null;
                    return (
                      <button key={app.id} onClick={() => onAppOpen(app.id)}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-white/25 hover:text-white/45 hover:bg-white/[0.03] whitespace-nowrap"
                      >{app.icon} {app.name}</button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Content grid */}
          <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
            {search.trim() ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-px">
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} onClick={() => onAppOpen(app.id)} isFavorite={favorites.includes(app.id)} onToggleFavorite={onToggleFavorite} />
                ))}
                {apps.length === 0 && (
                  <div className="col-span-full flex items-center justify-center py-16">
                    <div className="text-center"><div className="text-lg mb-2 opacity-20">🔍</div><div className="text-[11px] text-white/15">No results for "<span className="text-white/30">{search}</span>"</div></div>
                  </div>
                )}
              </div>
            ) : (
              Object.entries(grouped).map(([catId, catApps]) => (
                <CategorySection key={catId} cat={catId} apps={catApps} onAppOpen={onAppOpen}
                  favorites={favorites} onToggleFavorite={onToggleFavorite}
                  collapsed={collapsed[catId]} onToggle={() => toggleCat(catId)} />
              ))
            )}
          </div>
          <StatusBar toolCount={APPS.length} catCount={CATEGORIES.length} />
        </div>

        {/* Right sidebar — Activity / Favorites */}
        {(favorites || []).length > 0 && !search && (
          <div className="w-48 flex-shrink-0 border-l border-white/[0.05] bg-[#090909] flex flex-col">
            <div className="h-9 flex items-center px-3 border-b border-white/[0.04]">
              <span className="text-[8px] uppercase tracking-[0.12em] text-white/15">Favorites</span>
            </div>
            <div className="flex-1 overflow-y-auto py-1 px-1 scrollbar-thin">
              {favorites.map((id) => {
                const app = allApps.find((a) => a.id === id);
                if (!app) return null;
                return (
                  <button key={app.id} onClick={() => onAppOpen(app.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] text-white/35 hover:text-white/55 hover:bg-white/[0.03] transition-all text-left cursor-pointer"
                  ><span>{app.icon}</span><span className="truncate">{app.name}</span></button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Launcher ─── */
function Launcher({ search, onSearchChange, cat, onCatChange, apps, onAppOpen, onClose }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-black/60" onClick={onClose}
    >
      <motion.div initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.15 }} className="w-[520px] max-h-[60vh] border border-white/[0.08] rounded-xl bg-[#0e0e0e] shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-white/15" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"/></svg>
            <input ref={inputRef} value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search tools…" className="bg-transparent text-[11px] outline-none w-full text-white/50 placeholder:text-white/12" />
            <kbd className="text-[7px] font-mono px-1 py-0.5 rounded border border-white/[0.05] text-white/10">ESC</kbd>
          </div>
        </div>
        <div className="flex px-4 gap-1 pb-2 overflow-x-auto scrollbar-none">
          {[{ id: "all", label: "All" }, ...CATEGORIES].map((c) => (
            <button key={c.id} onClick={() => onCatChange(c.id)}
              className={`text-[8px] px-2 py-1 rounded transition-all ${cat === c.id ? "bg-white/10 text-white/50" : "text-white/15 hover:text-white/30"}`}
            >{c.label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin">
          <div className="grid grid-cols-3 gap-1">
            {apps.map((app) => (
              <button key={app.id} onClick={() => onAppOpen(app.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-all text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded flex items-center justify-center text-xs bg-white/[0.04]">{app.icon}</div>
                <span className="text-[9px] text-white/35 truncate">{app.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── AppShell (fullscreen mode) ─── */
export function AppShell({ app, children, onBack }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
      className="h-screen flex flex-col overflow-hidden bg-[#0a0a0a] text-white"
    >
      <div className="h-9 flex-shrink-0 flex items-center px-4 gap-2 border-b border-white/[0.06] bg-[#0c0c0c]">
        <button onClick={onBack} className="flex items-center gap-1 text-[9px] text-white/20 hover:text-white/40 transition-colors cursor-pointer bg-none border-none">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          Home
        </button>
        <div className="w-px h-3 bg-white/[0.06]" />
        <span className="text-[10px]">{app.icon}</span>
        <span className="text-[10px] font-medium text-white/40">{app.name}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-[7px] text-white/10">
          <div className="w-1 h-1 rounded-full bg-emerald-500/30" />BRANPY
        </div>
      </div>
      {children}
    </motion.div>
  );
}

/* ─── Floating Window (simplified, apps without routes) ─── */
function FloatingWindow({ win, onClose, onMinimize, onMaximize, onFocus, onUpdate, children, index }) {
  const ref = useRef(null);
  const drag = useRef({});
  const posRef = useRef({ x: win.x, y: win.y });
  const sizeRef = useRef({ w: win.w, h: win.h });
  const [size, setSize] = useState({ w: win.w, h: win.h });
  const [pos, setPos] = useState({ x: win.x, y: win.y });
  const prevWin = useRef(win);

  useEffect(() => { if (prevWin.current.x !== win.x || prevWin.current.y !== win.y || prevWin.current.w !== win.w || prevWin.current.h !== win.h) { const p = { x: win.x, y: win.y }; const s = { w: win.w, h: win.h }; setPos(p); setSize(s); posRef.current = p; sizeRef.current = s; } prevWin.current = win; }, [win.x, win.y, win.w, win.h]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault(); onFocus(win.id);
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    const offX = e.clientX - r.left, offY = e.clientY - r.top;
    drag.current = { dragging: true, offX, offY };
    const onMove = (ev) => { if (drag.current.dragging) { const nx = ev.clientX - drag.current.offX, ny = ev.clientY - drag.current.offY; posRef.current = { x: nx, y: ny }; setPos({ x: nx, y: ny }); } };
    const onUp = () => { if (drag.current.dragging) { onUpdate(win.id, posRef.current); } drag.current.dragging = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [win.id, onFocus, onUpdate]);

  const handleResizeStart = useCallback((e, dir) => {
    e.preventDefault(); e.stopPropagation(); onFocus(win.id);
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    drag.current = { resizing: true, startX: e.clientX, startY: e.clientY, startW: r.width, startH: r.height, startL: r.left, startT: r.top, dir };
    const onMove = (ev) => {
      if (!drag.current.resizing) return; const d = drag.current; const dx = ev.clientX - d.startX, dy = ev.clientY - d.startY;
      let nw = d.startW, nh = d.startH, nx = d.startL, ny = d.startT;
      if (d.dir.includes("e")) { nw = Math.max(320, d.startW + dx); } if (d.dir.includes("w")) { nw = Math.max(320, d.startW - dx); nx = d.startL + dx; }
      if (d.dir.includes("s")) { nh = Math.max(200, d.startH + dy); } if (d.dir.includes("n")) { nh = Math.max(200, d.startH - dy); ny = d.startT + dy; }
      const ns = { w: Math.min(nw, window.innerWidth - 40), h: Math.min(nh, window.innerHeight - 40) }; const np = { x: nx, y: ny };
      sizeRef.current = ns; posRef.current = np; setSize(ns); setPos(np);
    };
    const onUp = () => { drag.current.resizing = false; onUpdate(win.id, { ...posRef.current, ...sizeRef.current }); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [win.id, onFocus, onUpdate]);

  const isMax = win.maximized;
  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
      onMouseDown={() => onFocus(win.id)}
      style={{ position: "fixed", left: isMax ? 0 : pos.x, top: isMax ? 0 : pos.y, width: isMax ? window.innerWidth : size.w, height: isMax ? window.innerHeight : size.h, zIndex: win.z,
        borderRadius: isMax ? 0 : 8, overflow: "hidden", boxShadow: "0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)", background: "#0e0e0e" }}
    >
      <div onMouseDown={!isMax ? handleMouseDown : undefined} style={{ cursor: isMax ? "default" : "grab", height: 32, display: "flex", alignItems: "center", padding: "0 8px", gap: 6, background: "#131313", borderBottom: "1px solid rgba(255,255,255,0.06)", userSelect: "none", flexShrink: 0 }}>
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60 hover:bg-red-500 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); onClose(win.id); }} />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60 hover:bg-amber-500 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); onMinimize(win.id); }} />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 hover:bg-emerald-500 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); onMaximize(win.id); }} />
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-center">
          <span className="text-[10px]">{win.icon}</span>
          <span className="text-[10px] font-medium text-white/35 truncate">{win.name}</span>
        </div>
        <div style={{ width: 36 }} />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ height: "calc(100% - 32px)" }}>
        {children || (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <div className="text-2xl mb-2">{win.icon}</div>
              <div className="text-[11px] text-white/45">{win.name}</div>
              <div className="text-[9px] text-white/20 mt-1">{win.desc}</div>
            </div>
          </div>
        )}
      </div>
      {!isMax && (
        <>{["n","s"].map(d => <div key={d} onMouseDown={(e) => handleResizeStart(e, d)} style={{ position:"absolute", [d]:0, left:4, right:4, height:4, cursor:"ns-resize" }} />)}
          {["e","w"].map(d => <div key={d} onMouseDown={(e) => handleResizeStart(e, d)} style={{ position:"absolute", [d]:0, top:4, bottom:4, width:4, cursor:"ew-resize" }} />)}
          {["nw","ne","sw","se"].map(d => <div key={d} onMouseDown={(e) => handleResizeStart(e, d)} style={{ position:"absolute", [d==="nw"||d==="ne"?"top":"bottom"]:0, [d==="nw"||d==="sw"?"left":"right"]:0, width:6, height:6, cursor:d+"-resize", zIndex:5 }} />)}
        </>
      )}
    </motion.div>
  );
}

/* ─── Dock ─── */
function Dock({ windows, onFocus, onClose, onRestore }) {
  if (!windows || windows.length === 0) return null;
  return (
    <div style={{ position: "fixed", bottom: 6, left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", gap: 3, padding: "4px 8px", borderRadius: 10,
      background: "rgba(12,12,12,0.9)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {windows.map((w) => (
        <button key={w.id} onClick={() => { if (w.minimized) onRestore(w.id); else onFocus(w.id); }}
          onDoubleClick={() => onClose(w.id)}
          style={{ width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
            background: w.minimized ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)", transition: "background 0.1s", position: "relative" }}
          title={w.name}
        >
          {w.icon}
          {!w.minimized && <div style={{ position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)", width: 10, height: 1.5, borderRadius: 1, background: "rgba(255,255,255,0.12)" }} />}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export default function BRANPYLayout({ children, activeModule, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [showLauncher, setShowLauncher] = useState(false);
  const [launcherSearch, setLauncherSearch] = useState("");
  const [launcherCat, setLauncherCat] = useState("all");
  const [windows, setWindows] = useState([]);
  const winRef = useRef(windows);
  winRef.current = windows;
  const nextZRef = useRef(1);
  const showLauncherRef = useRef(showLauncher);
  showLauncherRef.current = showLauncher;
  const [favorites, setFavorites] = useLocalStorage("branpy_favorites", []);
  const [recents, setRecents] = useLocalStorage("branpy_recents", []);

  const toggleFavorite = useCallback((appId) => {
    setFavorites((prev) => prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]);
  }, [setFavorites]);

  const trackOpen = useCallback((appId) => {
    setRecents((prev) => {
      const filtered = prev.filter((id) => id !== appId);
      return [appId, ...filtered].slice(0, 8);
    });
  }, [setRecents]);

  const closeWindow = useCallback((id) => { setWindows((prev) => prev.filter((w) => w.id !== id)); }, []);
  const minimizeWindow = useCallback((id) => { setWindows((prev) => prev.map((w) => w.id === id ? { ...w, minimized: true } : w)); }, []);
  const closeWindowRef = useRef(closeWindow);
  closeWindowRef.current = closeWindow;
  const minimizeWindowRef = useRef(minimizeWindow);
  minimizeWindowRef.current = minimizeWindow;

  const curMod = useMemo(() => {
    if (activeModule) return activeModule;
    const path = location.pathname;
    if (path === "/affiliate-agent" || path === "/affiliate-agent/") return null;
    return path.split("/").pop() || null;
  }, [activeModule, location.pathname]);

  const currentApp = useMemo(() => curMod ? APPS.find((a) => a.id === curMod) || null : null, [curMod]);
  const isHome = !currentApp && windows.length === 0;

  const bringToFront = useCallback((id) => {
    setWindows((prev) => {
      const w = prev.find((x) => x.id === id);
      if (!w || w.z === nextZRef.current) return prev;
      nextZRef.current += 1;
      return prev.map((x) => (x.id === id ? { ...x, z: nextZRef.current } : x));
    });
  }, []);

  const openWindow = useCallback((appId) => {
    const app = APPS.find((a) => a.id === appId);
    if (!app) return;
    setShowLauncher(false);
    setSearch("");
    setActiveCat("all");
    if (app.route) {
      if (onNavigate) onNavigate(appId);
      else navigate(app.route);
      return;
    }
    const cur = winRef.current;
    const existing = cur.find((w) => w.appKey === appId && !w.closed);
    if (existing) { bringToFront(existing.id); if (existing.minimized) setWindows((prev) => prev.map((w) => w.id === existing.id ? { ...w, minimized: false } : w)); return; }
    const offset = (cur.length % 8) * 24;
    const z = nextZRef.current;
    nextZRef.current += 1;
    const newWin = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      appKey: appId, name: app.name, icon: app.icon, desc: app.desc, cat: app.cat,
      x: 60 + offset, y: 50 + offset, w: 640, h: 420,
      minimized: false, maximized: false, closed: false, z,
    };
    setWindows((prev) => [...prev, newWin]);
    setShowLauncher(false);
  }, [navigate, onNavigate, bringToFront]);

  const toggleMaximize = useCallback((id) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, maximized: !w.maximized } : w));
  }, []);

  const updateWindow = useCallback((id, patch) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, ...patch } : w));
  }, []);

  const handleBack = useCallback(() => {
    navigate("/affiliate-agent");
    setSearch("");
    setActiveCat("all");
  }, [navigate]);

  const handleHomeAppOpen = useCallback((appId) => { openWindow(appId); }, [openWindow]);

  /* ── Keyboard ── */
  useEffect(() => {
    const onKey = (e) => {
      const winList = winRef.current;
      const isOpen = showLauncherRef.current;
      if (e.key === "Escape" && winList.length > 0 && !isOpen) {
        const top = [...winList].sort((a, b) => b.z - a.z)[0];
        if (top) closeWindowRef.current(top.id); return;
      }
      if (e.key === "Escape") { setShowLauncher(false); setLauncherSearch(""); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowLauncher((p) => !p); setLauncherSearch(""); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "w") { e.preventDefault(); const top = [...winRef.current].sort((a, b) => b.z - a.z)[0]; if (top) closeWindowRef.current(top.id); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "m") { e.preventDefault(); const top = [...winRef.current].sort((a, b) => b.z - a.z)[0]; if (top) minimizeWindowRef.current(top.id); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleApps = useMemo(() => {
    let a = APPS;
    if (activeCat !== "all") a = a.filter((x) => x.cat === activeCat);
    if (search.trim()) { const q = search.toLowerCase(); a = a.filter((x) => x.name.toLowerCase().includes(q) || x.id.includes(q) || x.cat.includes(q) || (x.desc || "").toLowerCase().includes(q)); }
    return a;
  }, [activeCat, search]);

  const filteredLauncher = useMemo(() => {
    let a = APPS;
    if (launcherCat !== "all") a = a.filter((x) => x.cat === launcherCat);
    if (launcherSearch.trim()) { const q = launcherSearch.toLowerCase(); a = a.filter((x) => x.name.toLowerCase().includes(q) || x.id.includes(q) || x.cat.includes(q)); }
    return a;
  }, [launcherCat, launcherSearch]);

  if (!isHome && currentApp) {
    return (
      <>
        <AppShell app={currentApp} onBack={handleBack}>{children}</AppShell>
        <AnimatePresence>
          {showLauncher && (
            <Launcher search={launcherSearch} onSearchChange={setLauncherSearch} cat={launcherCat} onCatChange={setLauncherCat}
              apps={filteredLauncher} onAppOpen={(id) => { trackOpen(id); handleHomeAppOpen(id); }} onClose={() => { setShowLauncher(false); setLauncherSearch(""); }} />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <HomeView apps={visibleApps} activeCat={activeCat} onCatChange={setActiveCat}
        search={search} onSearchChange={(v) => { setSearch(v); setActiveCat("all"); }}
        onAppOpen={(id) => { trackOpen(id); handleHomeAppOpen(id); }} onNewProject={() => openWindow("projects")}
        favorites={favorites} onToggleFavorite={toggleFavorite} recents={recents} allApps={APPS} />

      <AnimatePresence>
        {windows.filter((w) => !w.minimized).map((win, i) => (
          <FloatingWindow key={win.id} win={win} index={i}
            onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={toggleMaximize}
            onFocus={bringToFront} onUpdate={updateWindow}
          >{win.appKey === "chat" ? children : null}</FloatingWindow>
        ))}
      </AnimatePresence>

      {windows.length > 0 && (
        <Dock windows={windows.sort((a, b) => b.z - a.z)} onFocus={bringToFront} onClose={closeWindow}
          onRestore={(id) => setWindows((prev) => prev.map((w) => w.id === id ? { ...w, minimized: false } : w))} />
      )}

      <AnimatePresence>
        {showLauncher && (
          <Launcher search={launcherSearch} onSearchChange={setLauncherSearch} cat={launcherCat} onCatChange={setLauncherCat}
            apps={filteredLauncher} onAppOpen={handleHomeAppOpen} onClose={() => { setShowLauncher(false); setLauncherSearch(""); }} />
        )}
      </AnimatePresence>
    </>
  );
}
