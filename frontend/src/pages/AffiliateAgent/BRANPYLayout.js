import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   APP REGISTRY — 80+ Apps across 10 Categories
   ═══════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  { id: "create", label: "Create", icon: "✨" },
  { id: "ai", label: "AI", icon: "🧠" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "marketing", label: "Marketing", icon: "📈" },
  { id: "developer", label: "Developer", icon: "💻" },
  { id: "media", label: "Media", icon: "🎬" },
  { id: "productivity", label: "Productivity", icon: "⚡" },
  { id: "automation", label: "Automation", icon: "🤖" },
  { id: "cloud", label: "Cloud", icon: "☁️" },
  { id: "future", label: "Future Labs", icon: "🔮" },
];

const CAT_COLORS = {
  create: "#a855f7", ai: "#6366f1", business: "#14b8a6", marketing: "#f97316",
  developer: "#3b82f6", media: "#ec4899", productivity: "#22c55e", automation: "#f59e0b",
  cloud: "#06b6d4", future: "#8b5cf6",
};

const APPS = [
  // ── CREATE ──
  { id: "image-studio", name: "Image Studio", icon: "🎨", cat: "create", route: "/affiliate-agent/image-studio", desc: "AI image generation & editing" },
  { id: "logo-studio", name: "Logo Studio", icon: "⭐", cat: "create", desc: "Professional logo design" },
  { id: "mockup-studio", name: "Mockup Studio", icon: "🖼️", cat: "create", desc: "Product & brand mockups" },
  { id: "brand-studio", name: "Brand Studio", icon: "🏷️", cat: "create", route: "/affiliate-agent/brand-studio", desc: "Complete brand identity" },
  { id: "canva-editor", name: "Canva Editor", icon: "🎯", cat: "create", desc: "Drag-drop graphic design" },
  { id: "photoshop-editor", name: "Photoshop Editor", icon: "🖌️", cat: "create", desc: "Advanced photo editing" },
  { id: "ai-art", name: "AI Art Generator", icon: "🌈", cat: "create", desc: "Generate art with AI" },
  { id: "studio-3d", name: "3D Studio", icon: "🧊", cat: "create", desc: "3D modeling & rendering" },

  // ── AI ──
  { id: "chat", name: "AI Chat", icon: "💬", cat: "ai", route: "/affiliate-agent/chat", desc: "Conversational AI assistant" },
  { id: "branpy-core", name: "BRANPY Core AI", icon: "🧠", cat: "ai", desc: "Core AI engine & orchestration" },
  { id: "multi-agent", name: "Multi-Agent System", icon: "🤖", cat: "ai", desc: "Orchestrate multiple AI agents" },
  { id: "ai-assistant", name: "AI Assistant", icon: "🎙️", cat: "ai", desc: "Personal AI productivity assistant" },
  { id: "ai-memory", name: "AI Memory", icon: "📀", cat: "ai", desc: "Persistent memory & context" },
  { id: "ai-researcher", name: "AI Researcher", icon: "🔬", cat: "ai", desc: "Deep research & analysis" },
  { id: "ai-browser", name: "AI Browser", icon: "🌐", cat: "ai", desc: "Autonomous web browsing" },
  { id: "ai-operator", name: "AI Operator", icon: "⚙️", cat: "ai", desc: "Execute actions across apps" },
  { id: "ai-workflow", name: "AI Workflow Engine", icon: "🔄", cat: "ai", desc: "Design & run AI workflows" },

  // ── BUSINESS ──
  { id: "leads-crm", name: "CRM", icon: "👥", cat: "business", route: "/affiliate-agent/leads-crm", desc: "Customer relationship management" },
  { id: "leads-center", name: "Leads Center", icon: "📋", cat: "business", desc: "Lead capture & scoring" },
  { id: "sales-funnels", name: "Sales Funnels", icon: "🔄", cat: "business", desc: "Build & optimize funnels" },
  { id: "marketplace", name: "Marketplace", icon: "🏪", cat: "business", desc: "Multi-vendor marketplace" },
  { id: "affiliate", name: "Affiliate AI", icon: "🛍️", cat: "business", route: "/affiliate-agent/affiliate", desc: "Affiliate marketing automation" },
  { id: "ecommerce", name: "E-commerce", icon: "🛒", cat: "business", route: "/affiliate-agent/ecommerce", desc: "Online store management" },
  { id: "finance-hub", name: "Finance Hub", icon: "💰", cat: "business", desc: "Financial management & insights" },
  { id: "subscriptions", name: "Subscription Manager", icon: "📅", cat: "business", desc: "Recurring billing & plans" },
  { id: "invoices", name: "Invoice Center", icon: "📄", cat: "business", desc: "Invoicing & payment tracking" },
  { id: "payments", name: "Payment Center", icon: "💳", cat: "business", desc: "Payment processing & gateway" },

  // ── MARKETING ──
  { id: "social-publisher", name: "Social Publisher", icon: "📢", cat: "marketing", route: "/affiliate-agent/social-publisher", desc: "Schedule & publish to social" },
  { id: "ads-manager", name: "Ads Manager", icon: "📊", cat: "marketing", desc: "Multi-platform ad campaigns" },
  { id: "viral-analyzer", name: "Viral Analyzer", icon: "🔥", cat: "marketing", desc: "Viral trend detection" },
  { id: "trend-research", name: "Trend Research", icon: "📈", cat: "marketing", desc: "Market & trend intelligence" },
  { id: "seo-studio", name: "SEO Studio", icon: "🔍", cat: "marketing", desc: "Search optimization toolkit" },
  { id: "copywriting", name: "Copywriting AI", icon: "✍️", cat: "marketing", desc: "AI-powered copy generation" },
  { id: "campaign-center", name: "Campaign Center", icon: "🎯", cat: "marketing", desc: "Multi-channel campaigns" },
  { id: "email-marketing", name: "Email Marketing", icon: "📧", cat: "marketing", desc: "Email automation & sequences" },
  { id: "social-automation", name: "Social Automation", icon: "🔄", cat: "marketing", desc: "Auto-post & engagement" },

  // ── DEVELOPER ──
  { id: "code-generator", name: "Dev Agent", icon: "💻", cat: "developer", route: "/affiliate-agent/code-generator", desc: "AI pair programmer" },
  { id: "code-studio", name: "Code Studio", icon: "⌨️", cat: "developer", desc: "Full IDE with AI" },
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

  // ── MEDIA ──
  { id: "video-studio", name: "Video Studio", icon: "🎬", cat: "media", route: "/affiliate-agent/video-studio", desc: "Professional video editor" },
  { id: "movie-studio", name: "Movie Studio", icon: "🎥", cat: "media", desc: "Cinematic movie creation" },
  { id: "animation-studio", name: "Animation Studio", icon: "🌀", cat: "media", desc: "2D/3D animation" },
  { id: "streaming-studio", name: "Streaming Studio", icon: "📡", cat: "media", desc: "Live streaming production" },
  { id: "podcast-studio", name: "Podcast Studio", icon: "🎙️", cat: "media", desc: "Record & edit podcasts" },
  { id: "voice-ai", name: "Voice Studio", icon: "🎤", cat: "media", route: "/affiliate-agent/voice-ai", desc: "AI voice generation & cloning" },
  { id: "music-sounds", name: "Music Studio", icon: "🎵", cat: "media", route: "/affiliate-agent/music-sounds", desc: "Music production & editing" },
  { id: "sound-fx", name: "Sound FX Studio", icon: "🔊", cat: "media", desc: "Sound effects library & tools" },
  { id: "ai-dub", name: "AI Dub Studio", icon: "🌍", cat: "media", desc: "AI dubbing & localization" },
  { id: "subtitles", name: "Subtitle Studio", icon: "📝", cat: "media", desc: "Auto subtitle generation" },
  { id: "thumbnail-studio", name: "Thumbnail Studio", icon: "🖼️", cat: "media", desc: "Video thumbnail creator" },
  { id: "banner-studio", name: "Banner Studio", icon: "📐", cat: "media", desc: "Ad & social banners" },

  // ── PRODUCTIVITY ──
  { id: "documents", name: "Documents AI", icon: "📄", cat: "productivity", route: "/affiliate-agent/documents", desc: "AI-powered document creation" },
  { id: "spreadsheet", name: "Spreadsheet AI", icon: "📊", cat: "productivity", desc: "Smart spreadsheet editor" },
  { id: "presentations", name: "Presentation Builder", icon: "📽️", cat: "productivity", desc: "AI presentation designer" },
  { id: "notes", name: "Notes", icon: "📓", cat: "productivity", desc: "Rich notes & knowledge base" },
  { id: "projects", name: "Projects", icon: "📁", cat: "productivity", route: "/affiliate-agent/projects", desc: "Project management hub" },
  { id: "tasks", name: "Tasks", icon: "✅", cat: "productivity", desc: "Task management & tracking" },
  { id: "workspace", name: "Workspace", icon: "🏠", cat: "productivity", desc: "Customizable workspace" },
  { id: "team-chat", name: "Team Chat", icon: "💬", cat: "productivity", desc: "Real-time team messaging" },
  { id: "calendar", name: "Calendar", icon: "📅", cat: "productivity", desc: "Smart calendar & scheduling" },
  { id: "meetings", name: "Meetings", icon: "🎥", cat: "productivity", desc: "Video conferencing" },
  { id: "whiteboard", name: "Whiteboard", icon: "✏️", cat: "productivity", desc: "Collaborative whiteboard" },

  // ── AUTOMATION ──
  { id: "automation-hub", name: "Automation Hub", icon: "🧩", cat: "automation", route: "/affiliate-agent/automation-hub", desc: "Automate workflows & tasks" },
  { id: "import-products", name: "Product Importer", icon: "📥", cat: "automation", route: "/affiliate-agent/importar", desc: "Import products via URL" },
  { id: "schedule-posts", name: "Schedule Posts", icon: "⏰", cat: "automation", desc: "Auto-schedule content" },
  { id: "data-pipeline", name: "Data Pipeline", icon: "🔀", cat: "automation", desc: "ETL & data integration" },
  { id: "webhooks", name: "Webhooks", icon: "🔗", cat: "automation", desc: "Webhook management" },
  { id: "analytics", name: "Analytics", icon: "📊", cat: "automation", route: "/affiliate-agent/analytics", desc: "Advanced analytics & BI" },
  { id: "reports", name: "Reports", icon: "📑", cat: "automation", desc: "Automated report generation" },
  { id: "monitoring", name: "Monitoring", icon: "📡", cat: "automation", desc: "System & app monitoring" },

  // ── CLOUD ──
  { id: "cloud-drive", name: "Cloud Drive", icon: "☁️", cat: "cloud", desc: "Secure cloud file storage" },
  { id: "assets-manager", name: "Assets Manager", icon: "📦", cat: "cloud", desc: "Digital asset management" },
  { id: "media-bank", name: "Media Library", icon: "🏦", cat: "cloud", route: "/affiliate-agent/media-bank", desc: "Media & video library" },
  { id: "templates-hub", name: "Templates Hub", icon: "📂", cat: "cloud", desc: "Template marketplace" },
  { id: "brand-kits", name: "Brand Kits", icon: "🎨", cat: "cloud", desc: "Centralized brand assets" },
  { id: "backup-center", name: "Backup Center", icon: "💾", cat: "cloud", desc: "Automated backup & restore" },

  // ── FUTURE LABS ──
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

/* ═══════════════════════════════════════════════════════════════
   PREVIEW COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function MiniTimeline() {
  return (
    <div className="space-y-1.5">
      {[{ w: 60, c: "#3b82f6" }, { w: 80, c: "#10b981" }, { w: 45, c: "#f59e0b" }].map((b, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="h-1 rounded" style={{ width: `${b.w}%`, background: b.c }} />
          <span className="text-[6px]" style={{ color: "rgba(255,255,255,0.15)" }}>{["00:00", "A", "T"][i]}</span>
        </div>
      ))}
    </div>
  );
}
function MiniChat() {
  return (
    <div className="space-y-1.5">
      {["r", "l", "r"].map((s, i) => (
        <div key={i} className={`flex gap-1 ${s === "l" ? "justify-end" : ""}`}>
          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px]" style={{ background: "rgba(16,185,129,0.2)" }}>{s === "r" ? "🤖" : "👤"}</div>
          <div className="flex-1"><div className="h-2 rounded" style={{ width: `${[60, 50, 80][i]}%`, background: s === "l" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.08)" }} /></div>
        </div>
      ))}
    </div>
  );
}
function MiniCode() {
  return (
    <div className="font-mono text-[7px] space-y-0.5 leading-tight">
      {[
        ["#60a5fa", "import"], " ", ["#34d399", "React"], " from ", ["#fbbf24", "'react'"],
        ["#a78bfa", "function"], " ", ["#fbbf24", "App"], "() {", "  ", ["#60a5fa", "return"], " (",
        '    <div>Hello</div>', "  );", "}",
      ].map((c, i) => <div key={i} style={typeof c === "object" ? { color: c[0] } : { color: "rgba(255,255,255,0.2)" }}>{typeof c === "object" ? c[1] : c}</div>)}
    </div>
  );
}
function MiniChart() {
  return (<div className="flex items-end gap-[2px] h-16 pt-2">{[35, 55, 42, 78, 60, 90, 72, 48, 85, 65, 45, 70].map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `rgba(16,185,129,${0.2 + h / 400})` }} />)}</div>);
}
function MiniGrid() { return <div className="grid grid-cols-3 gap-[3px]">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square rounded" style={{ background: `rgba(168,85,247,${0.1 + (i % 5) * 0.05})` }} />)}</div>; }
function MiniMusic() { return <div className="space-y-1">{["80%", "55%", "90%", "45%"].map((w, i) => <div key={i} className="h-1 rounded" style={{ width: w, background: "rgba(16,185,129,0.3)" }} />)}</div>; }
function MiniSocial() { return <div className="grid grid-cols-7 gap-[2px]">{Array.from({ length: 35 }).map((_, i) => <div key={i} className="aspect-square rounded" style={{ background: i % 3 === 0 ? "rgba(16,185,129,0.3)" : i % 4 === 0 ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.04)" }} />)}</div>; }
function MiniCubes() { return <div className="flex gap-1 flex-wrap">{[...Array(6)].map((_, i) => <div key={i} className="w-4 h-4 rounded" style={{ background: `rgba(99,102,241,${0.1 + i * 0.04})` }} />)}</div>; }
function MiniDots() { return <div className="flex gap-1 justify-center">{[...Array(5)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full" style={{ background: `rgba(59,130,246,${0.1 + i * 0.06})` }} />)}</div>; }

const PREVIEWS = {
  "video-studio": MiniTimeline, "movie-studio": MiniTimeline, "animation-studio": MiniTimeline,
  "streaming-studio": MiniTimeline, "podcast-studio": MiniMusic,
  "image-studio": MiniGrid, "logo-studio": MiniGrid, "mockup-studio": MiniGrid, "brand-studio": MiniGrid,
  "canva-editor": MiniGrid, "photoshop-editor": MiniGrid, "ai-art": MiniGrid, "studio-3d": MiniGrid,
  chat: MiniChat, "branpy-core": MiniChat, "multi-agent": MiniChat, "ai-assistant": MiniChat,
  "ai-memory": MiniDots, "ai-researcher": MiniChat, "ai-browser": MiniChat, "ai-operator": MiniChat,
  "ai-workflow": MiniCubes,
  "code-generator": MiniCode, "code-studio": MiniCode, "site-builder": MiniGrid, "app-builder": MiniGrid,
  "mobile-builder": MiniGrid, "game-builder": MiniGrid, "api-builder": MiniCubes, "database-studio": MiniCubes,
  analytics: MiniChart, "viral-analyzer": MiniChart, "trend-research": MiniChart,
  "social-publisher": MiniSocial, "ads-manager": MiniChart, "campaign-center": MiniChart,
  "leads-crm": MiniGrid, "leads-center": MiniGrid, "marketplace": MiniGrid, ecommerce: MiniGrid,
  "finance-hub": MiniChart, "cloud-drive": MiniDots,
  "ai-video-gen": MiniTimeline, "ai-movie-gen": MiniTimeline,
};

/* ═══════════════════════════════════════════════════════════════
   APP CARD
   ═══════════════════════════════════════════════════════════════ */
function AppCard({ app, onClick, index }) {
  const PreviewComp = PREVIEWS[app.id];
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: (index || 0) * 0.02, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex flex-col rounded-xl border text-left overflow-hidden cursor-pointer"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}
    >
      <div className="px-3 pt-3 pb-2 min-h-[68px] flex items-center justify-center">
        {PreviewComp ? <PreviewComp /> : <div className="text-lg opacity-20">{app.icon}</div>}
      </div>
      <div className="px-3 pb-3 pt-1.5 flex items-center gap-2 border-t" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs flex-shrink-0" style={{ background: `${CAT_COLORS[app.cat]}15` }}>{app.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium truncate leading-tight" style={{ color: "rgba(255,255,255,0.6)" }}>{app.name}</div>
          <div className="text-[7px] mt-[1px]" style={{ color: "rgba(255,255,255,0.15)" }}>{app.desc.slice(0, 28)}{app.desc.length > 28 ? "…" : ""}</div>
        </div>
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: `${CAT_COLORS[app.cat]}30` }} />
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FLOATING WINDOW
   ═══════════════════════════════════════════════════════════════ */
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
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
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
      const maxW = window.innerWidth - 40, maxH = window.innerHeight - 40;
      const ns = { w: Math.min(nw, maxW), h: Math.min(nh, maxH) }; const np = { x: nx, y: ny };
      sizeRef.current = ns; posRef.current = np; setSize(ns); setPos(np);
    };
    const onUp = () => { drag.current.resizing = false; onUpdate(win.id, { ...posRef.current, ...sizeRef.current }); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
  }, [win.id, onFocus, onUpdate]);

  const isMax = win.maximized;
  const dispX = isMax ? 0 : pos.x;
  const dispY = isMax ? 0 : pos.y;
  const dispW = isMax ? window.innerWidth : size.w;
  const dispH = isMax ? window.innerHeight - 48 : size.h;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseDown={() => onFocus(win.id)}
      onClick={() => onFocus(win.id)}
      style={{
        position: "fixed", left: dispX, top: dispY, width: dispW, height: dispH, zIndex: win.z,
        borderRadius: isMax ? 0 : 10, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        background: "#0e0e0e",
      }}
    >
      {/* Title bar */}
      <div onMouseDown={!isMax ? handleMouseDown : undefined} style={{ cursor: isMax ? "default" : "grab", height: 36, display: "flex", alignItems: "center", padding: "0 10px", gap: 8, background: "#131313", borderBottom: "1px solid rgba(255,255,255,0.06)", userSelect: "none", flexShrink: 0 }}>
        <div className="flex items-center gap-1" style={{ cursor: "default" }} onMouseDown={(e) => e.stopPropagation()}>
          <div className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-500 flex items-center justify-center cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); onClose(win.id); }} style={{ fontSize: 7, color: "transparent" }}>✕</div>
          <div className="w-3 h-3 rounded-full bg-amber-500/70 hover:bg-amber-500 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); onMinimize(win.id); }} />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70 hover:bg-emerald-500 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); onMaximize(win.id); }} />
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-center" style={{ cursor: "default" }}>
          <span className="text-xs">{win.icon}</span>
          <span className="text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{win.name}</span>
        </div>
        <div style={{ width: 44 }} />
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ height: `calc(100% - 36px)` }}>
        {children || (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="text-3xl mb-3">{win.icon}</div>
              <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{win.name}</div>
              <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>{win.desc}</div>
            </div>
          </div>
        )}
      </div>
      {/* Resize handles */}
      {!isMax && (
        <>
          {["n", "s"].map(d => <div key={d} onMouseDown={(e) => handleResizeStart(e, d)} style={{ position: "absolute", [d]: 0, left: 4, right: 4, height: 4, cursor: "ns-resize" }} />)}
          {["e", "w"].map(d => <div key={d} onMouseDown={(e) => handleResizeStart(e, d)} style={{ position: "absolute", [d]: 0, top: 4, bottom: 4, width: 4, cursor: "ew-resize" }} />)}
          {["nw", "ne", "sw", "se"].map(d => <div key={d} onMouseDown={(e) => handleResizeStart(e, d)} style={{ position: "absolute", [d === "nw" || d === "ne" ? "top" : "bottom"]: 0, [d === "nw" || d === "sw" ? "left" : "right"]: 0, width: 8, height: 8, cursor: d + "-resize", zIndex: 5 }} />)}
        </>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DOCK
   ═══════════════════════════════════════════════════════════════ */
function Dock({ windows, onFocus, onClose, onRestore }) {
  return (
    <div style={{
      position: "fixed", bottom: 8, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
      display: "flex", gap: 4, padding: "6px 10px", borderRadius: 14,
      background: "rgba(18,18,18,0.92)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      {windows.map((w) => (
        <motion.button
          key={w.id} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          onClick={() => { if (w.minimized) onRestore(w.id); else onFocus(w.id); }}
          onDoubleClick={() => onClose(w.id)}
          style={{
            width: 34, height: 34, borderRadius: 8, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            background: w.minimized ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
            transition: "background 0.15s", position: "relative",
          }}
          title={w.name}
        >
          {w.icon}
          {!w.minimized && <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 12, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.15)" }} />}
        </motion.button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOPBAR
   ═══════════════════════════════════════════════════════════════ */
function TopBar({ search, onSearchChange, onNewProject, windows, onClose, onFocus, onRestore }) {
  return (
    <div className="flex-shrink-0 flex items-center px-5 gap-4 h-12" style={{ background: "rgba(12,12,12,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}>
          <svg className="w-[15px] h-[15px] text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.5)" }}>BRANPY</span>
      </div>
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }}>
          <svg className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.15)" }} viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z" /></svg>
          <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search apps, commands, tools..." className="bg-transparent text-[11px] outline-none w-full" style={{ color: "rgba(255,255,255,0.45)" }} />
          <kbd className="text-[8px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.05)" }}>⌘K</kbd>
        </div>
      </div>
      <button onClick={onNewProject} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[10px] font-medium transition-all" style={{ background: "rgba(16,185,129,0.15)", color: "rgba(16,185,129,0.8)" }}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
        New
      </button>
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)" }} />
      <div className="flex items-center gap-2 text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.4)" }} />
        {windows.length > 0 ? `${windows.filter(w => !w.minimized).length} active` : "Ready"}
      </div>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "linear-gradient(135deg, #34d399, #2563eb)", color: "rgba(255,255,255,0.9)" }}>J</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HUB HOME VIEW
   ═══════════════════════════════════════════════════════════════ */
function HomeView({ apps, activeCat, onCatChange, search, onSearchChange, onAppOpen, onNewProject }) {
  const cols = useMemo(() => {
    const n = apps.length;
    if (n <= 8) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
    return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";
  }, [apps.length]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0a0a0a", color: "white" }}>
      <TopBar search={search} onSearchChange={onSearchChange} onNewProject={onNewProject} />
      <div className="flex-1 flex min-h-0">
        {/* Category sidebar */}
        <div className="w-[56px] flex-shrink-0 flex flex-col items-center py-3 gap-0.5" style={{ background: "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => onCatChange(activeCat === cat.id ? "all" : cat.id)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all relative text-sm"
              style={activeCat === cat.id ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" } : { color: "rgba(255,255,255,0.15)" }}
              title={cat.label}
            >
              <span className="text-sm">{cat.icon}</span>
              {activeCat === cat.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r" style={{ background: CAT_COLORS[cat.id] }} />}
            </button>
          ))}
        </div>
        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Category header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {activeCat === "all" ? "All Tools" : CATEGORIES.find((c) => c.id === activeCat)?.label || "Tools"}
              </h2>
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.08)" }}>{apps.length} of {APPS.length}</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => onCatChange(activeCat === cat.id ? "all" : cat.id)}
                  className="text-[9px] px-2 py-1 rounded-md transition-all whitespace-nowrap"
                  style={activeCat === cat.id ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" } : { color: "rgba(255,255,255,0.12)" }}
                >{cat.label}</button>
              ))}
            </div>
          </div>
          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {apps.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center"><div className="text-2xl mb-2 opacity-15">🔍</div><div className="text-xs" style={{ color: "rgba(255,255,255,0.12)" }}>No tools match "<span style={{ color: "rgba(255,255,255,0.3)" }}>{search}</span>"</div></div>
              </div>
            ) : (
              <div className={`grid ${cols} gap-2.5`}>
                {apps.map((app, i) => <AppCard key={app.id} app={app} index={i} onClick={() => onAppOpen(app.id)} />)}
              </div>
            )}
          </div>
          {/* Bottom bar */}
          <div className="flex-shrink-0 h-7 flex items-center px-5 gap-3 text-[8px]" style={{ borderTop: "1px solid rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.07)" }}>
            <span>BRANPY v3.0</span>
            <span style={{ color: "rgba(255,255,255,0.04)" }}>·</span>
            <span>{APPS.length} tools · {CATEGORIES.length} categories</span>
            <div className="flex-1" />
            <span>⌘K palette · Double-click dock to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LAUNCHER OVERLAY
   ═══════════════════════════════════════════════════════════════ */
function Launcher({ search, onSearchChange, cat, onCatChange, apps, onAppOpen, onClose }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div initial={{ opacity: 0, scale: 0.96, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-[580px] max-h-[65vh] border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#0e0e0e", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
            <svg className="w-4 h-4" style={{ color: "rgba(255,255,255,0.15)" }} viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z" /></svg>
            <input ref={inputRef} value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search all tools..." className="bg-transparent text-xs outline-none w-full" style={{ color: "rgba(255,255,255,0.5)" }} />
            <kbd className="text-[8px] font-mono px-1.5 py-0.5 rounded border" style={{ color: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.05)" }}>ESC</kbd>
          </div>
        </div>
        <div className="flex px-4 gap-1 pb-2 overflow-x-auto scrollbar-none">
          {[{ id: "all", label: "All", icon: "◻️" }, ...CATEGORIES].map((c) => (
            <button key={c.id} onClick={() => onCatChange(c.id)}
              className="flex items-center gap-1 text-[9px] px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-all"
              style={cat === c.id ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" } : { color: "rgba(255,255,255,0.15)" }}
            ><span>{c.icon}</span> {c.label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="grid grid-cols-4 gap-2">
            {apps.map((app) => (
              <motion.button key={app.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => onAppOpen(app.id)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all cursor-pointer"
                style={{ background: "transparent" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: `${CAT_COLORS[app.cat]}12` }}>{app.icon}</div>
                <span className="text-[9px] text-center leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>{app.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FULLSCREEN APP MODE
   ═══════════════════════════════════════════════════════════════ */
export function AppShell({ app, children, onBack }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
      className="h-screen flex flex-col overflow-hidden" style={{ background: "#0a0a0a", color: "white" }}
    >
      <div className="h-10 flex-shrink-0 flex items-center px-4 gap-3" style={{ background: "rgba(12,12,12,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <motion.button whileHover={{ x: -2 }} onClick={onBack} className="flex items-center gap-1.5 text-[10px] transition-colors cursor-pointer" style={{ color: "rgba(255,255,255,0.2)", background: "none", border: "none" }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
          Home
        </motion.button>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.06)" }} />
        <span className="text-sm">{app.icon}</span>
        <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{app.name}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[8px]" style={{ color: "rgba(255,255,255,0.08)" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.3)" }} />
          BRANPY
        </div>
      </div>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */
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

  /* ── Window Manager ── */
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

    // If route exists, navigate (full-screen mode)
    if (app.route) {
      if (onNavigate) onNavigate(appId);
      else navigate(app.route);
      return;
    }

    // Otherwise open as floating window
    const cur = winRef.current;
    const existing = cur.find((w) => w.appKey === appId && !w.closed);
    if (existing) { bringToFront(existing.id); if (existing.minimized) setWindows((prev) => prev.map((w) => w.id === existing.id ? { ...w, minimized: false } : w)); return; }

    const offset = (cur.length % 8) * 28;
    const z = nextZRef.current;
    nextZRef.current += 1;
    const newWin = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      appKey: appId, name: app.name, icon: app.icon, desc: app.desc, cat: app.cat,
      x: 60 + offset, y: 50 + offset, w: 660, h: 440,
      minimized: false, maximized: false, closed: false, z,
    };
    setWindows((prev) => [...prev, newWin]);
    setShowLauncher(false);
  }, [navigate, onNavigate, bringToFront]);

  const closeWindow = useCallback((id) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, minimized: true } : w));
  }, []);

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

  const handleHomeAppOpen = useCallback((appId) => {
    openWindow(appId);
  }, [openWindow]);

  /* ── Keyboard (uses refs to avoid re-attaching on every window change) ── */
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

  /* ── Filtered apps ── */
  const visibleApps = useMemo(() => {
    let a = APPS;
    if (activeCat !== "all") a = a.filter((x) => x.cat === activeCat);
    if (search.trim()) { const q = search.toLowerCase(); a = a.filter((x) => x.name.toLowerCase().includes(q) || x.id.includes(q) || x.cat.includes(q) || x.desc.toLowerCase().includes(q)); }
    return a;
  }, [activeCat, search]);

  const filteredLauncher = useMemo(() => {
    let a = APPS;
    if (launcherCat !== "all") a = a.filter((x) => x.cat === launcherCat);
    if (launcherSearch.trim()) { const q = launcherSearch.toLowerCase(); a = a.filter((x) => x.name.toLowerCase().includes(q) || x.id.includes(q) || x.cat.includes(q)); }
    return a;
  }, [launcherCat, launcherSearch]);

  const activeWindows = windows.filter((w) => !w.minimized).sort((a, b) => a.z - b.z);

  /* ── FULLSCREEN APP MODE ── */
  if (!isHome && currentApp) {
    return (
      <>
        <AppShell app={currentApp} onBack={handleBack}>{children}</AppShell>
        <AnimatePresence>
          {showLauncher && (
            <Launcher search={launcherSearch} onSearchChange={setLauncherSearch} cat={launcherCat} onCatChange={setLauncherCat}
              apps={filteredLauncher} onAppOpen={handleHomeAppOpen} onClose={() => { setShowLauncher(false); setLauncherSearch(""); }} />
          )}
        </AnimatePresence>
      </>
    );
  }

  /* ── HOME VIEW WITH FLOATING WINDOWS ── */
  return (
    <>
      {/* Always show home grid behind windows */}
      <HomeView apps={visibleApps} activeCat={activeCat} onCatChange={setActiveCat}
        search={search} onSearchChange={(v) => { setSearch(v); setActiveCat("all"); }}
        onAppOpen={handleHomeAppOpen} onNewProject={() => openWindow("projects")} />

      {/* Floating windows */}
      <AnimatePresence>
        {windows.filter((w) => !w.minimized).map((win, i) => (
          <FloatingWindow key={win.id} win={win} index={i}
            onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={toggleMaximize}
            onFocus={bringToFront} onUpdate={updateWindow}
          >
            {win.appKey === "chat" ? children : null}
          </FloatingWindow>
        ))}
      </AnimatePresence>

      {/* Dock */}
      {windows.length > 0 && (
        <Dock windows={windows.sort((a, b) => b.z - a.z)} onFocus={bringToFront} onClose={closeWindow}
          onRestore={(id) => setWindows((prev) => prev.map((w) => w.id === id ? { ...w, minimized: false } : w))} />
      )}

      {/* Launcher */}
      <AnimatePresence>
        {showLauncher && (
          <Launcher search={launcherSearch} onSearchChange={setLauncherSearch} cat={launcherCat} onCatChange={setLauncherCat}
            apps={filteredLauncher} onAppOpen={handleHomeAppOpen} onClose={() => { setShowLauncher(false); setLauncherSearch(""); }} />
        )}
      </AnimatePresence>
    </>
  );
}
