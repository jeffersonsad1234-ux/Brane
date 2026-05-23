import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/* ─── App Registry ─── */
const APPS = [
  { id: "chat", name: "AI Chat", icon: "🧠", color: "#22c55e", cat: "AI" },
  { id: "video-studio", name: "Video Studio", icon: "🎬", color: "#3b82f6", cat: "Creation" },
  { id: "image-studio", name: "Image Studio", icon: "🎨", color: "#a855f7", cat: "Creation" },
  { id: "brand-studio", name: "Brand Studio", icon: "🏷️", color: "#f59e0b", cat: "Creation" },
  { id: "site-builder", name: "Site Builder", icon: "🌐", color: "#06b6d4", cat: "Creation" },
  { id: "music-sounds", name: "Music Studio", icon: "🎵", color: "#22c55e", cat: "Creation" },
  { id: "affiliate", name: "Affiliate AI", icon: "🛍️", color: "#14b8a6", cat: "Business" },
  { id: "social-publisher", name: "Social Publisher", icon: "📢", color: "#f97316", cat: "Business" },
  { id: "automation-hub", name: "Automations", icon: "🧩", color: "#6366f1", cat: "Business" },
  { id: "ecommerce", name: "E-commerce", icon: "🛒", color: "#eab308", cat: "Business" },
  { id: "analytics", name: "Analytics", icon: "📊", color: "#10b981", cat: "Business" },
  { id: "leads-crm", name: "CRM", icon: "🧑‍💼", color: "#3b82f6", cat: "Business" },
  { id: "code-generator", name: "Dev Agent", icon: "💻", color: "#6366f1", cat: "AI" },
  { id: "voice-ai", name: "Voice AI", icon: "🎤", color: "#8b5cf6", cat: "AI" },
  { id: "ai-avatars", name: "AI Avatars", icon: "🤖", color: "#a855f7", cat: "AI" },
  { id: "transcription", name: "Transcription", icon: "📝", color: "#06b6d4", cat: "AI" },
  { id: "documents", name: "Documents AI", icon: "📄", color: "#f59e0b", cat: "AI" },
  { id: "templates", name: "Templates", icon: "📂", color: "#14b8a6", cat: "Tools" },
  { id: "projects", name: "Projects", icon: "📁", color: "#6366f1", cat: "Tools" },
  { id: "integrations", name: "Integrations", icon: "🔗", color: "#22c55e", cat: "Tools" },
  { id: "team", name: "Team", icon: "👥", color: "#f97316", cat: "Tools" },
  { id: "media-bank", name: "Media Bank", icon: "🏦", color: "#8b5cf6", cat: "Tools" },
  { id: "plans", name: "Plans", icon: "💎", color: "#eab308", cat: "System" },
  { id: "settings", name: "Settings", icon: "⚙️", color: "#6b7280", cat: "System" },
  { id: "support", name: "Support", icon: "🎧", color: "#22c55e", cat: "System" },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "◻️" }, { id: "AI", label: "AI", icon: "🧠" },
  { id: "Creation", label: "Creation", icon: "✨" }, { id: "Business", label: "Business", icon: "💼" },
  { id: "Tools", label: "Tools", icon: "🔧" }, { id: "System", label: "System", icon: "⚙️" },
];

const FMT_TIME = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

function Clock() {
  const [t, setT] = useState(FMT_TIME());
  useEffect(() => { const iv = setInterval(() => setT(FMT_TIME()), 30e3); return () => clearInterval(iv); }, []);
  return <span className="text-[10px] text-white/30 font-mono tabular-nums">{t}</span>;
}

export default function BRANPYLayout({ children, activeModule, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherSearch, setLauncherSearch] = useState("");
  const [launcherCat, setLauncherCat] = useState("all");
  const [showDesktop, setShowDesktop] = useState(false);
  const inputRef = useRef(null);

  const curMod = activeModule || (location.pathname === "/affiliate-agent" ? "chat" : location.pathname.split("/").pop() || "chat");

  /* Filter apps */
  const filteredApps = APPS.filter((a) => {
    if (launcherCat !== "all" && a.cat !== launcherCat) return false;
    if (launcherSearch.trim()) return a.name.toLowerCase().includes(launcherSearch.toLowerCase()) || a.id.includes(launcherSearch.toLowerCase());
    return true;
  });

  const handleNavigate = (moduleId) => {
    const path = moduleId === "chat" ? "/affiliate-agent" : `/affiliate-agent/${moduleId}`;
    if (onNavigate) onNavigate(moduleId);
    else navigate(path);
    setLauncherOpen(false);
    setShowDesktop(false);
  };

  /* Keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setLauncherOpen(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setLauncherOpen((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (launcherOpen && inputRef.current) inputRef.current.focus();
  }, [launcherOpen]);

  const currentApp = APPS.find((a) => a.id === curMod);

  return (
    <div className="h-screen flex flex-col bg-[#070707] text-white overflow-hidden select-none">
      {/* Desktop Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.025),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.025),transparent_50%),linear-gradient(180deg,#070707,#090909)]" />
        <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {showDesktop || !currentApp ? (
          /* Desktop view */
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 p-8 overflow-y-auto scrollbar-thin">
              <div className="max-w-4xl mx-auto mt-12">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/12">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-white/75 tracking-tight">BRANPY</h1>
                      <p className="text-[10px] text-white/15">Universal AI Workspace</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/12 max-w-md mx-auto">Open an app or press <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/25 text-[9px] font-mono border border-white/10 mx-0.5">⌘K</kbd></p>
                </div>
                <div className="grid grid-cols-6 gap-2.5 max-w-2xl mx-auto">
                  {APPS.filter((a) => !["plans", "settings", "support"].includes(a.id)).map((app) => (
                    <button key={app.id} onClick={() => handleNavigate(app.id)} className="group flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/[0.04] transition-all active:scale-[0.97]">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md" style={{ background: `${app.color}12` }}>
                        <span>{app.icon}</span>
                      </div>
                      <span className="text-[8px] text-white/28 group-hover:text-white/50 text-center leading-tight">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center pb-6 text-[8px] text-white/8">BRANPY OS · v2.0 · Universal AI Workspace</div>
          </div>
        ) : (
          /* App window — renders children inside professional frame */
          <div className="absolute inset-0 flex flex-col">
            {/* Window title bar */}
            <div className="h-9 flex-shrink-0 bg-[#0e0e0e] border-b border-white/[0.06] flex items-center px-3 gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-[10px] h-[10px] rounded-full bg-red-500/40 hover:bg-red-500 cursor-pointer transition-colors" onClick={() => { navigate("/affiliate-agent"); setShowDesktop(true); }} />
                <div className="w-[10px] h-[10px] rounded-full bg-amber-500/40 hover:bg-amber-500 cursor-pointer transition-colors" />
                <div className="w-[10px] h-[10px] rounded-full bg-emerald-500/40 hover:bg-emerald-500 cursor-pointer transition-colors" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-1.5 text-[10px]">
                {currentApp && <><span className="text-sm">{currentApp.icon}</span><span className="text-white/40 font-medium">{currentApp.name}</span></>}
                {!currentApp && <span className="text-white/20">BRANPY</span>}
              </div>
              <button onClick={() => { navigate("/affiliate-agent"); setShowDesktop(true); }} className="p-0.5 rounded hover:bg-white/10 text-white/15 hover:text-white/35">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6l-12 12" /></svg>
              </button>
            </div>
            {/* App content */}
            <div className="flex-1 min-h-0">
              {children}
            </div>
          </div>
        )}
      </div>

      {/* Dock */}
      <div className="h-12 flex-shrink-0 bg-[#0c0c0c]/90 backdrop-blur-xl border-t border-white/[0.06] flex items-center px-3 gap-1 z-50 relative">
        <button onClick={() => { setLauncherOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 text-[11px] transition-all mr-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" /></svg>
          Apps
        </button>

        <div className="w-px h-6 bg-white/[0.06] mr-0.5" />

        {/* App shortcuts in dock */}
        {["chat", "video-studio", "image-studio", "code-generator", "analytics", "settings"].map((appId) => {
          const app = APPS.find((a) => a.id === appId);
          if (!app) return null;
          const isActive = curMod === appId;
          return (
            <button key={appId} onClick={() => handleNavigate(appId)} className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all relative ${isActive ? "bg-white/12 text-white/70" : "text-white/25 hover:bg-white/5 hover:text-white/50"}`} title={app.name}>
              <span className="text-base">{app.icon}</span>
              {isActive && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: app.color }} />}
            </button>
          );
        })}

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-[8px] text-white/12">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
          <span>BRANPY OS</span>
          <span className="text-white/6">·</span>
          <span>v2.0</span>
        </div>

        <div className="w-px h-5 bg-white/[0.06] mx-2" />

        <Clock />
      </div>

      {/* Launcher overlay */}
      {launcherOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={() => setLauncherOpen(false)}>
          <div className="w-[680px] max-h-[75vh] bg-[#0e0e0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 focus-within:border-white/20 transition-colors">
                <svg className="w-4 h-4 text-white/20 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z" /></svg>
                <input ref={inputRef} value={launcherSearch} onChange={(e) => setLauncherSearch(e.target.value)} placeholder="Search apps..." className="bg-transparent text-xs text-white/60 outline-none w-full placeholder:text-white/15" autoFocus />
                <kbd className="text-[8px] text-white/12 bg-white/5 px-1.5 py-0.5 rounded font-mono border border-white/5">ESC</kbd>
              </div>
            </div>

            <div className="flex px-4 gap-1 pb-2 overflow-x-auto scrollbar-none">
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setLauncherCat(c.id)} className={`flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all ${launcherCat === c.id ? "bg-white/10 text-white/65" : "text-white/20 hover:bg-white/5 hover:text-white/45"}`}>
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {filteredApps.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/12">No apps found</div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {filteredApps.map((app) => (
                    <button key={app.id} onClick={() => handleNavigate(app.id)} className="group flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/[0.04] transition-all active:scale-95">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-110" style={{ background: `${app.color}10` }}>
                        <span>{app.icon}</span>
                      </div>
                      <span className="text-[9px] text-white/30 group-hover:text-white/55 text-center leading-tight">{app.name}</span>
                      <span className="text-[6px] text-white/10">{app.cat}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
