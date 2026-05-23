import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const APPS = [
  { id: "chat", name: "AI Chat", icon: "🧠", color: "#22c55e", cat: "ai", route: "/affiliate-agent/chat" },
  { id: "video-studio", name: "Video Studio", icon: "🎬", color: "#3b82f6", cat: "studio", route: "/affiliate-agent/video-studio" },
  { id: "image-studio", name: "Image Studio", icon: "🎨", color: "#a855f7", cat: "studio", route: "/affiliate-agent/image-studio" },
  { id: "brand-studio", name: "Brand Studio", icon: "🏷️", color: "#f59e0b", cat: "studio", route: "/affiliate-agent/brand-studio" },
  { id: "site-builder", name: "Site Builder", icon: "🌐", color: "#06b6d4", cat: "studio", route: "/affiliate-agent/site-builder" },
  { id: "music-sounds", name: "Music Studio", icon: "🎵", color: "#22c55e", cat: "studio", route: "/affiliate-agent/music-sounds" },
  { id: "code-generator", name: "Dev Agent", icon: "💻", color: "#6366f1", cat: "ai", route: "/affiliate-agent/code-generator" },
  { id: "voice-ai", name: "Voice AI", icon: "🎤", color: "#8b5cf6", cat: "ai", route: "/affiliate-agent/voice-ai" },
  { id: "ai-avatars", name: "AI Avatars", icon: "🤖", color: "#a855f7", cat: "ai", route: "/affiliate-agent/ai-avatars" },
  { id: "transcription", name: "Transcription", icon: "📝", color: "#06b6d4", cat: "ai", route: "/affiliate-agent/transcription" },
  { id: "documents", name: "Documents AI", icon: "📄", color: "#f59e0b", cat: "ai", route: "/affiliate-agent/documents" },
  { id: "affiliate", name: "Affiliate AI", icon: "🛍️", color: "#14b8a6", cat: "business", route: "/affiliate-agent/affiliate" },
  { id: "social-publisher", name: "Social Publisher", icon: "📢", color: "#f97316", cat: "business", route: "/affiliate-agent/social-publisher" },
  { id: "automation-hub", name: "Automations", icon: "🧩", color: "#6366f1", cat: "business", route: "/affiliate-agent/automation-hub" },
  { id: "ecommerce", name: "E-commerce", icon: "🛒", color: "#eab308", cat: "business", route: "/affiliate-agent/ecommerce" },
  { id: "analytics", name: "Analytics", icon: "📊", color: "#10b981", cat: "business", route: "/affiliate-agent/analytics" },
  { id: "leads-crm", name: "CRM", icon: "🧑‍💼", color: "#3b82f6", cat: "business", route: "/affiliate-agent/leads-crm" },
  { id: "templates", name: "Templates", icon: "📂", color: "#14b8a6", cat: "tools", route: "/affiliate-agent/templates" },
  { id: "projects", name: "Projects", icon: "📁", color: "#6366f1", cat: "tools", route: "/affiliate-agent/projects" },
  { id: "integrations", name: "Integrations", icon: "🔗", color: "#22c55e", cat: "tools", route: "/affiliate-agent/integrations" },
  { id: "team", name: "Team", icon: "👥", color: "#f97316", cat: "tools", route: "/affiliate-agent/team" },
  { id: "media-bank", name: "Media Bank", icon: "🏦", color: "#8b5cf6", cat: "tools", route: "/affiliate-agent/media-bank" },
  { id: "plans", name: "Plans", icon: "💎", color: "#eab308", cat: "system", route: "/affiliate-agent/plans" },
  { id: "settings", name: "Settings", icon: "⚙️", color: "#6b7280", cat: "system", route: "/affiliate-agent/settings" },
  { id: "support", name: "Support", icon: "🎧", color: "#22c55e", cat: "system", route: "/affiliate-agent/support" },
];

const CATS = [
  { id: "ai", label: "Intelligence", icon: "🧠" },
  { id: "studio", label: "Studio", icon: "🎨" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "tools", label: "Tools", icon: "🔧" },
  { id: "system", label: "System", icon: "⚙️" },
];

const CAT_COLORS = { ai: "#6366f1", studio: "#3b82f6", business: "#10b981", tools: "#f59e0b", system: "#6b7280" };

/* ─── Live previews ─── */
function MiniTimeline() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1">
        <div className="w-5 h-1 rounded" style={{ background: "rgba(59,130,246,0.4)" }} />
        <div className="w-8 h-1 rounded" style={{ background: "rgba(59,130,246,0.6)" }} />
        <div className="w-4 h-1 rounded" style={{ background: "rgba(59,130,246,0.3)" }} />
        <div className="flex-1" />
        <span className="text-[7px] text-white/15">0:00</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-6 h-1 rounded" style={{ background: "rgba(16,185,129,0.4)" }} />
        <div className="w-10 h-1 rounded" style={{ background: "rgba(16,185,129,0.6)" }} />
        <div className="flex-1" />
        <span className="text-[7px] text-white/15">A</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-1 rounded" style={{ background: "rgba(245,158,11,0.4)" }} />
        <div className="w-7 h-1 rounded" style={{ background: "rgba(245,158,11,0.5)" }} />
        <div className="flex-1" />
        <span className="text-[7px] text-white/15">T</span>
      </div>
    </div>
  );
}

function MiniChat() {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5"><div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px]" style={{ background: "rgba(16,185,129,0.2)" }}>🤖</div><div className="flex-1"><div className="h-2 w-16 rounded" style={{ background: "rgba(255,255,255,0.08)" }} /><div className="h-2 w-12 rounded mt-1" style={{ background: "rgba(255,255,255,0.06)" }} /></div></div>
      <div className="flex gap-1.5 justify-end"><div className="flex-1"><div className="h-2 w-14 rounded ml-auto" style={{ background: "rgba(16,185,129,0.15)" }} /><div className="h-2 w-10 rounded mt-1 ml-auto" style={{ background: "rgba(16,185,129,0.12)" }} /></div><div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px]" style={{ background: "rgba(16,185,129,0.2)" }}>👤</div></div>
      <div className="flex gap-1.5"><div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px]" style={{ background: "rgba(16,185,129,0.2)" }}>🤖</div><div className="flex-1"><div className="h-2 w-20 rounded" style={{ background: "rgba(255,255,255,0.08)" }} /><div className="h-2 w-14 rounded mt-1" style={{ background: "rgba(255,255,255,0.06)" }} /></div></div>
    </div>
  );
}

function MiniCode() {
  return (
    <div className="font-mono text-[7px] space-y-0.5">
      <div><span style={{ color: "rgba(96,165,250,0.5)" }}>import</span><span style={{ color: "rgba(255,255,255,0.2)" }}> </span><span style={{ color: "rgba(52,211,153,0.5)" }}>React</span><span style={{ color: "rgba(255,255,255,0.2)" }}> from </span><span style={{ color: "rgba(251,191,36,0.5)" }}>'react'</span></div>
      <div><span style={{ color: "rgba(167,139,250,0.5)" }}>function</span><span style={{ color: "rgba(255,255,255,0.2)" }}> </span><span style={{ color: "rgba(251,191,36,0.5)" }}>App</span><span style={{ color: "rgba(255,255,255,0.2)" }}>() {'{'}</span></div>
      <div className="pl-2"><span style={{ color: "rgba(96,165,250,0.5)" }}>return</span><span style={{ color: "rgba(255,255,255,0.2)" }}> (</span></div>
      <div className="pl-3"><span style={{ color: "rgba(255,255,255,0.12)" }}>&lt;div&gt;</span><span style={{ color: "rgba(255,255,255,0.2)" }}>Hello</span><span style={{ color: "rgba(255,255,255,0.12)" }}>&lt;/div&gt;</span></div>
      <div className="pl-2"><span style={{ color: "rgba(255,255,255,0.2)" }}>);</span></div>
      <div><span style={{ color: "rgba(255,255,255,0.2)" }}>{'}'}</span></div>
    </div>
  );
}

function MiniChart() {
  return (
    <div className="flex items-end gap-1 h-16 pt-2">
      {[35, 55, 42, 78, 60, 90, 72, 48, 85, 65, 45, 70].map((h, i) => (
        <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, rgba(16,185,129,${0.3 + h / 300}), rgba(16,185,129,${0.1 + h / 500}))` }} />
      ))}
    </div>
  );
}

function MiniCrm() {
  return (
    <div className="flex gap-1">
      <div className="flex-1 rounded p-1" style={{ background: "rgba(255,255,255,0.05)" }}><div className="h-1.5 w-6 rounded" style={{ background: "rgba(245,158,11,0.3)" }} /><div className="h-1 w-8 rounded mt-1" style={{ background: "rgba(255,255,255,0.08)" }} /><div className="h-1 w-6 rounded mt-0.5" style={{ background: "rgba(255,255,255,0.06)" }} /></div>
      <div className="flex-1 rounded p-1" style={{ background: "rgba(255,255,255,0.05)" }}><div className="h-1.5 w-6 rounded" style={{ background: "rgba(59,130,246,0.3)" }} /><div className="h-1 w-8 rounded mt-1" style={{ background: "rgba(255,255,255,0.08)" }} /><div className="h-1 w-6 rounded mt-0.5" style={{ background: "rgba(255,255,255,0.06)" }} /></div>
      <div className="flex-1 rounded p-1" style={{ background: "rgba(255,255,255,0.05)" }}><div className="h-1.5 w-6 rounded" style={{ background: "rgba(16,185,129,0.3)" }} /><div className="h-1 w-8 rounded mt-1" style={{ background: "rgba(255,255,255,0.08)" }} /></div>
    </div>
  );
}

function MiniSocial() {
  return (
    <div className="grid grid-cols-7 gap-0.5">
      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
        <div key={i} className="text-[6px] text-white/15 text-center">{d}</div>
      ))}
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="aspect-square rounded" style={{
          background: i % 3 === 0 ? "rgba(16,185,129,0.3)" : i % 4 === 0 ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.05)"
        }} />
      ))}
    </div>
  );
}

function MiniImage() {
  return (
    <div className="relative w-full h-full min-h-[60px] flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(236,72,153,0.1))" }}>
      <div className="absolute inset-2 rounded border" style={{ borderColor: "rgba(255,255,255,0.05)" }} />
      <div className="absolute inset-4 rounded flex items-center justify-center text-lg opacity-40" style={{ background: "rgba(255,255,255,0.05)" }}>🎨</div>
    </div>
  );
}

function MiniMusic() {
  const bars = [
    { w: "80%", c: "rgba(16,185,129,0.3)" },
    { w: "60%", c: "rgba(16,185,129,0.3)" },
    { w: "90%", c: "rgba(59,130,246,0.3)" },
    { w: "50%", c: "rgba(16,185,129,0.3)" },
  ];
  return (
    <div className="space-y-1">
      {bars.map((b, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="h-1 rounded" style={{ width: b.w, background: b.c }} />
          <span className="text-[6px] text-white/10 w-4">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

const PREVIEWS = {
  "video-studio": MiniTimeline,
  "image-studio": MiniImage,
  "music-sounds": MiniMusic,
  chat: MiniChat,
  "code-generator": MiniCode,
  analytics: MiniChart,
  "leads-crm": MiniCrm,
  "social-publisher": MiniSocial,
};

function AppCard({ app, onClick }) {
  const PreviewComp = PREVIEWS[app.id];
  const previewKey = app.id;
  return (
    <button key={previewKey} onClick={onClick} className="group flex flex-col rounded-xl border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 transition-all text-left overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="px-3 pt-3 pb-2 min-h-[72px] flex items-center justify-center">
        {PreviewComp ? <PreviewComp /> : (
          <div className="flex items-center justify-center text-2xl opacity-30">{app.icon}</div>
        )}
      </div>
      <div className="px-3 pb-3 pt-1 flex items-center gap-2 border-t border-white/[0.04]">
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0" style={{ background: `${app.color}15` }}>
          <span>{app.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-white/60 font-medium truncate group-hover:text-white/80 transition-colors">{app.name}</div>
          <div className="text-[8px] text-white/20 capitalize">{app.cat}</div>
        </div>
        <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all" style={{ color: "transparent", background: "transparent" }}>
          <svg className="w-3 h-3" style={{ color: "rgba(255,255,255,0)", fill: "currentColor" }} viewBox="0 0 24 24"><path d="M9 5v14l11-7z" /></svg>
        </div>
      </div>
    </button>
  );
}

/* ════════════════════════
   TOP BAR (HOME)
   ════════════════════════ */
function TopBar({ search, onSearchChange, onNewProject, onToggleLauncher }) {
  return (
    <div className="h-12 flex-shrink-0 flex items-center px-4 gap-3" style={{ background: "#0c0c0c", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}>
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.6)" }}>BRANPY</span>
      </div>
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 border transition-colors" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.06)" }}>
          <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z" /></svg>
          <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search apps, projects, commands..." className="bg-transparent text-[11px] outline-none w-full" style={{ color: "rgba(255,255,255,0.5)" }} />
          <kbd className="text-[8px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)" }}>⌘K</kbd>
        </div>
      </div>
      <button onClick={onNewProject} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[10px] transition-all shadow-sm" style={{ background: "rgba(16,185,129,0.7)" }}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
        New Project
      </button>
      <button className="relative p-1.5 rounded-lg transition-all" style={{ color: "rgba(255,255,255,0.25)" }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
      </button>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white cursor-pointer shadow-sm" style={{ background: "linear-gradient(135deg, #34d399, #2563eb)" }}>J</div>
    </div>
  );
}

/* ─── Category sidebar ─── */
function Sidebar({ activeCat, onCatChange }) {
  return (
    <div className="w-[52px] flex-shrink-0 flex flex-col items-center py-3 gap-0.5" style={{ background: "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      {CATS.map((cat) => (
        <button key={cat.id} onClick={() => onCatChange(activeCat === cat.id ? "all" : cat.id)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all relative text-sm"
          style={activeCat === cat.id ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" } : { color: "rgba(255,255,255,0.2)" }}
          title={cat.label}
        >
          <span>{cat.icon}</span>
          {activeCat === cat.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r" style={{ background: CAT_COLORS[cat.id] }} />}
        </button>
      ))}
      <div className="flex-1" />
      <button onClick={() => onCatChange("system")} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all" style={activeCat === "system" ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" } : { color: "rgba(255,255,255,0.15)" }} title="System">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z" /></svg>
      </button>
    </div>
  );
}

/* ════════════════════════
   HOME VIEW
   ════════════════════════ */
function HomeView({ apps, activeCat, onCatChange, search, onSearchChange, onAppOpen, onNewProject, onToggleLauncher }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0a0a0a", color: "white" }}>
      <TopBar search={search} onSearchChange={onSearchChange} onNewProject={onNewProject} onToggleLauncher={onToggleLauncher} />
      <div className="flex-1 flex min-h-0">
        <Sidebar activeCat={activeCat} onCatChange={onCatChange} />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.4)" }}>
                {activeCat === "all" ? "All Apps" : CATS.find((c) => c.id === activeCat)?.label || "Apps"}
              </h2>
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.1)" }}>{apps.length} tools</span>
            </div>
            <div className="flex items-center gap-1">
              {CATS.map((cat) => (
                <button key={cat.id} onClick={() => onCatChange(activeCat === cat.id ? "all" : cat.id)}
                  className="text-[9px] px-2 py-1 rounded-md transition-all"
                  style={activeCat === cat.id ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" } : { color: "rgba(255,255,255,0.15)" }}
                >{cat.label}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {apps.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl mb-2 opacity-20">🔍</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>No apps match "{search}"</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} onClick={() => onAppOpen(app.id)} />
                ))}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 h-8 flex items-center px-5 gap-3 text-[8px]" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.08)" }}>
            <span>BRANPY OS v2.0</span>
            <span style={{ color: "rgba(255,255,255,0.05)" }}>·</span>
            <span>{APPS.length} modules</span>
            <span style={{ color: "rgba(255,255,255,0.05)" }}>·</span>
            <span>{apps.length} visible</span>
            <div className="flex-1" />
            <span>Press ⌘K to search</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════
   APP MODE (full screen)
   ════════════════════════ */
function AppMode({ app, children, onBack }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0a0a0a", color: "white" }}>
      <div className="h-10 flex-shrink-0 flex items-center px-4 gap-3 z-10" style={{ background: "#0c0c0c", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.25)" }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
          Home
        </button>
        <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="text-sm">{app.icon}</span>
        <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{app.name}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[8px]" style={{ color: "rgba(255,255,255,0.1)" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.4)" }} />
          BRANPY OS
        </div>
      </div>
      {children}
    </div>
  );
}

/* ════════════════════════
   LAUNCHER OVERLAY
   ════════════════════════ */
function Launcher({ search, onSearchChange, cat, onCatChange, apps, onAppOpen, onClose }) {
  const inputRef = useRef(null);
  useEffect(() => { if (inputRef.current) setTimeout(() => inputRef.current?.focus(), 50); }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-[580px] max-h-[65vh] border rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()} style={{ background: "#0e0e0e", borderColor: "rgba(255,255,255,0.1)" }}>
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 border transition-colors" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
            <svg className="w-4 h-4" style={{ color: "rgba(255,255,255,0.2)" }} viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z" /></svg>
            <input ref={inputRef} value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search apps..." className="bg-transparent text-xs outline-none w-full" style={{ color: "rgba(255,255,255,0.6)" }} />
            <kbd className="text-[8px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.05)" }}>ESC</kbd>
          </div>
        </div>
        <div className="flex px-4 gap-1 pb-2 overflow-x-auto scrollbar-none">
          {[{ id: "all", label: "All", icon: "◻️" }, ...CATS].map((c) => (
            <button key={c.id} onClick={() => onCatChange(c.id)} className="flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all"
              style={cat === c.id ? { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" } : { color: "rgba(255,255,255,0.2)" }}
            ><span>{c.icon}</span> {c.label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="grid grid-cols-4 gap-2">
            {apps.map((app) => (
              <button key={app.id} onClick={() => onAppOpen(app.id)} className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all active:scale-95">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform" style={{ background: `${app.color}10` }}>
                  <span>{app.icon}</span>
                </div>
                <span className="text-[9px] text-center leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>{app.name}</span>
                <span className="text-[6px] capitalize" style={{ color: "rgba(255,255,255,0.08)" }}>{app.cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════
   MAIN EXPORT
   ════════════════════════ */
export default function BRANPYLayout({ children, activeModule, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [showLauncher, setShowLauncher] = useState(false);
  const [launcherSearch, setLauncherSearch] = useState("");
  const [launcherCat, setLauncherCat] = useState("all");

  /* Determine current app from module or path */
  const curMod = useMemo(() => {
    if (activeModule) return activeModule;
    const path = location.pathname;
    if (path === "/affiliate-agent" || path === "/affiliate-agent/") return null; // home
    const seg = path.split("/").pop();
    return seg || null;
  }, [activeModule, location.pathname]);

  const currentApp = useMemo(() => {
    if (!curMod) return null;
    return APPS.find((a) => a.id === curMod) || null;
  }, [curMod]);

  const isHome = !currentApp;

  /* Navigation */
  const handleOpen = useCallback((appId) => {
    const app = APPS.find((a) => a.id === appId);
    if (!app) return;
    setShowLauncher(false);
    setSearch("");
    setActiveCat("all");
    if (onNavigate) onNavigate(appId);
    else navigate(app.route);
  }, [navigate, onNavigate]);

  const handleBack = useCallback(() => {
    navigate("/affiliate-agent");
    setSearch("");
    setActiveCat("all");
  }, [navigate]);

  /* Keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setShowLauncher(false); setLauncherSearch(""); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowLauncher((p) => !p); setLauncherSearch(""); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Filtered apps for home */
  const visibleApps = useMemo(() => {
    let apps = APPS;
    if (activeCat !== "all") apps = apps.filter((a) => a.cat === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      apps = apps.filter((a) => a.name.toLowerCase().includes(q) || a.id.includes(q) || a.cat.includes(q));
    }
    return apps;
  }, [activeCat, search]);

  /* Filtered apps for launcher */
  const filteredLauncher = useMemo(() => {
    let apps = APPS;
    if (launcherCat !== "all") apps = apps.filter((a) => a.cat === launcherCat);
    if (launcherSearch.trim()) {
      const q = launcherSearch.toLowerCase();
      apps = apps.filter((a) => a.name.toLowerCase().includes(q) || a.id.includes(q));
    }
    return apps;
  }, [launcherCat, launcherSearch]);

  /* ── APP MODE: full-screen app ── */
  if (!isHome && currentApp) {
    return (
      <>
        <AppMode app={currentApp} onBack={handleBack}>
          {children}
        </AppMode>
        {showLauncher && (
          <Launcher
            search={launcherSearch} onSearchChange={setLauncherSearch}
            cat={launcherCat} onCatChange={setLauncherCat}
            apps={filteredLauncher} onAppOpen={handleOpen}
            onClose={() => { setShowLauncher(false); setLauncherSearch(""); }}
          />
        )}
      </>
    );
  }

  /* ── HOME VIEW ── */
  return (
    <>
      <HomeView
        apps={visibleApps}
        activeCat={activeCat}
        onCatChange={setActiveCat}
        search={search}
        onSearchChange={(v) => { setSearch(v); setActiveCat("all"); }}
        onAppOpen={handleOpen}
        onNewProject={() => handleOpen("projects")}
        onToggleLauncher={() => setShowLauncher((p) => !p)}
      />
      {showLauncher && (
        <Launcher
          search={launcherSearch} onSearchChange={setLauncherSearch}
          cat={launcherCat} onCatChange={setLauncherCat}
          apps={filteredLauncher} onAppOpen={handleOpen}
          onClose={() => { setShowLauncher(false); setLauncherSearch(""); }}
        />
      )}
    </>
  );
}
