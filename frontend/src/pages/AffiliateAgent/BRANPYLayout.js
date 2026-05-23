import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/* ─── App Registry ─── */
const APPS = [
  { id: "chat", name: "AI Chat", icon: "🧠", color: "#22c55e", cat: "AI", route: "/affiliate-agent" },
  { id: "video-studio", name: "Video Studio", icon: "🎬", color: "#3b82f6", cat: "Creation", route: "/affiliate-agent/video-studio" },
  { id: "image-studio", name: "Image Studio", icon: "🎨", color: "#a855f7", cat: "Creation", route: "/affiliate-agent/image-studio" },
  { id: "brand-studio", name: "Brand Studio", icon: "🏷️", color: "#f59e0b", cat: "Creation", route: "/affiliate-agent/brand-studio" },
  { id: "site-builder", name: "Site Builder", icon: "🌐", color: "#06b6d4", cat: "Creation", route: "/affiliate-agent/site-builder" },
  { id: "music-sounds", name: "Music Studio", icon: "🎵", color: "#22c55e", cat: "Creation", route: "/affiliate-agent/music-sounds" },
  { id: "affiliate", name: "Affiliate AI", icon: "🛍️", color: "#14b8a6", cat: "Business", route: "/affiliate-agent/affiliate" },
  { id: "social-publisher", name: "Social Publisher", icon: "📢", color: "#f97316", cat: "Business", route: "/affiliate-agent/social-publisher" },
  { id: "automation-hub", name: "Automations", icon: "🧩", color: "#6366f1", cat: "Business", route: "/affiliate-agent/automation-hub" },
  { id: "ecommerce", name: "E-commerce", icon: "🛒", color: "#eab308", cat: "Business", route: "/affiliate-agent/ecommerce" },
  { id: "analytics", name: "Analytics", icon: "📊", color: "#10b981", cat: "Business", route: "/affiliate-agent/analytics" },
  { id: "leads-crm", name: "CRM", icon: "🧑‍💼", color: "#3b82f6", cat: "Business", route: "/affiliate-agent/leads-crm" },
  { id: "code-generator", name: "Dev Agent", icon: "💻", color: "#6366f1", cat: "AI", route: "/affiliate-agent/code-generator" },
  { id: "voice-ai", name: "Voice AI", icon: "🎤", color: "#8b5cf6", cat: "AI", route: "/affiliate-agent/voice-ai" },
  { id: "ai-avatars", name: "AI Avatars", icon: "🤖", color: "#a855f7", cat: "AI", route: "/affiliate-agent/ai-avatars" },
  { id: "transcription", name: "Transcription", icon: "📝", color: "#06b6d4", cat: "AI", route: "/affiliate-agent/transcription" },
  { id: "documents", name: "Documents AI", icon: "📄", color: "#f59e0b", cat: "AI", route: "/affiliate-agent/documents" },
  { id: "templates", name: "Templates", icon: "📂", color: "#14b8a6", cat: "Tools", route: "/affiliate-agent/templates" },
  { id: "projects", name: "Projects", icon: "📁", color: "#6366f1", cat: "Tools", route: "/affiliate-agent/projects" },
  { id: "integrations", name: "Integrations", icon: "🔗", color: "#22c55e", cat: "Tools", route: "/affiliate-agent/integrations" },
  { id: "team", name: "Team", icon: "👥", color: "#f97316", cat: "Tools", route: "/affiliate-agent/team" },
  { id: "media-bank", name: "Media Bank", icon: "🏦", color: "#8b5cf6", cat: "Tools", route: "/affiliate-agent/media-bank" },
  { id: "plans", name: "Plans", icon: "💎", color: "#eab308", cat: "System", route: "/affiliate-agent/plans" },
  { id: "settings", name: "Settings", icon: "⚙️", color: "#6b7280", cat: "System", route: "/affiliate-agent/settings" },
  { id: "support", name: "Support", icon: "🎧", color: "#22c55e", cat: "System", route: "/affiliate-agent/support" },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "◻️" }, { id: "AI", label: "AI", icon: "🧠" },
  { id: "Creation", label: "Creation", icon: "✨" }, { id: "Business", label: "Business", icon: "💼" },
  { id: "Tools", label: "Tools", icon: "🔧" }, { id: "System", label: "System", icon: "⚙️" },
];

const UID = () => Math.random().toString(36).slice(2, 9);
const FMT_T = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const CLAMP = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const LS_KEY = "branpy_windows";

/* ─── Clock ─── */
function Clock() {
  const [t, setT] = useState(FMT_T());
  useEffect(() => { const iv = setInterval(() => setT(FMT_T()), 30e3); return () => clearInterval(iv); }, []);
  return <span className="text-[10px] text-white/30 font-mono tabular-nums">{t}</span>;
}

/* ─── Default window size by app ─── */
const DEF_SIZE = (id) => {
  if (id === "chat") return { w: 640, h: 500 };
  if (id === "video-studio") return { w: 1100, h: 620 };
  if (id === "image-studio") return { w: 900, h: 580 };
  if (id === "code-generator") return { w: 960, h: 600 };
  if (id === "analytics") return { w: 900, h: 540 };
  if (id === "settings") return { w: 720, h: 520 };
  return { w: 800, h: 520 };
};

/* ─── Tile helper ─── */
const TILE_POSITIONS = {
  left: (dw, dh) => ({ x: 0, y: 0, w: Math.floor(dw / 2), h: dh }),
  right: (dw, dh) => ({ x: Math.ceil(dw / 2), y: 0, w: Math.floor(dw / 2), h: dh }),
  center: (dw, dh, id) => {
    const def = DEF_SIZE(id);
    return { x: Math.max(0, Math.floor((dw - def.w) / 2)), y: Math.max(0, Math.floor((dh - def.h) / 2)), w: def.w, h: def.h };
  },
};

/* ════════════════════════════════════════
   MAIN OS SHELL
   ════════════════════════════════════════ */
export default function BRANPYLayout({ children, activeModule, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const desktopRef = useRef(null);

  const [windows, setWindows] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [nextZ, setNextZ] = useState(() => windows.reduce((m, w) => Math.max(m, w.zIndex || 0), 0) + 1);
  const [activeWin, setActiveWin] = useState(null);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherSearch, setLauncherSearch] = useState("");
  const [launcherCat, setLauncherCat] = useState("all");
  const [showDesktop, setShowDesktop] = useState(false);
  const launcherInputRef = useRef(null);

  const curMod = activeModule || (location.pathname === "/affiliate-agent" ? "chat" : location.pathname.split("/").pop() || "chat");

  /* Persist windows */
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(windows.map((w) => ({ ...w, _persisted: true })))); } catch {}
  }, [windows]);

  /* ── Bring to front ── */
  const bringToFront = useCallback((id) => {
    setActiveWin(id);
    setWindows((prev) => {
      const w = prev.find((x) => x.id === id);
      if (!w) return prev;
      if (w.zIndex === nextZ) return prev;
      setNextZ((z) => z + 1);
      return prev.map((x) => x.id === id ? { ...x, zIndex: nextZ } : x);
    });
  }, [nextZ]);

  /* ── Open app ── */
  const openApp = useCallback((appId, tile) => {
    const app = APPS.find((a) => a.id === appId);
    if (!app) return;
    setLauncherOpen(false);

    const existing = windows.find((w) => w.appId === appId && !w.closed);
    if (existing) {
      if (existing.minimized) {
        setWindows((prev) => prev.map((w) => w.id === existing.id ? { ...w, minimized: false } : w));
      }
      bringToFront(existing.id);
      if (app.route) navigate(app.route);
      return;
    }

    const dw = window.innerWidth;
    const dh = window.innerHeight - 48;
    let pos;
    if (tile) {
      pos = TILE_POSITIONS[tile](dw, dh);
    } else {
      const base = DEF_SIZE(appId);
      const offset = (windows.length % 8) * 28;
      pos = {
        x: CLAMP(40 + offset, 0, dw - base.w - 20),
        y: CLAMP(30 + offset, 0, dh - base.h - 20),
        w: base.w,
        h: base.h,
      };
    }

    const win = {
      id: UID(), appId: app.id, title: app.name, icon: app.icon, color: app.color,
      minimized: false, maximized: false,
      position: { x: pos.x, y: pos.y },
      size: { w: pos.w, h: pos.h },
      prevState: null, zIndex: nextZ,
    };
    setNextZ((z) => z + 1);
    setWindows((prev) => [...prev, win]);
    setActiveWin(win.id);

    if (app.route) navigate(app.route);
  }, [windows, nextZ, bringToFront, navigate]);

  /* ── Close ── */
  const closeWindow = useCallback((id) => {
    setWindows((prev) => {
      const filtered = prev.filter((x) => x.id !== id);
      if (activeWin === id && filtered.length > 0) {
        const next = filtered.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
        setActiveWin(next.id);
      } else if (filtered.length === 0) {
        setActiveWin(null);
        setShowDesktop(true);
      }
      return filtered;
    });
  }, [activeWin]);

  /* ── Minimize ── */
  const toggleMinimize = useCallback((id) => {
    setWindows((prev) => {
      const updated = prev.map((x) => x.id === id ? { ...x, minimized: !x.minimized } : x);
      if (activeWin === id) {
        const visible = updated.filter((w) => !w.minimized);
        if (visible.length > 0) {
          const next = visible.reduce((a, b) => a.zIndex > b.zIndex ? a : b);
          setActiveWin(next.id);
        } else {
          setActiveWin(null);
        }
      }
      return updated;
    });
  }, [activeWin]);

  /* ── Maximize / Restore ── */
  const toggleMaximize = useCallback((id) => {
    setWindows((prev) => prev.map((x) => {
      if (x.id !== id) return x;
      if (x.maximized) {
        const prevS = x.prevState || { x: 80, y: 60, w: 800, h: 520 };
        return { ...x, maximized: false, prevState: null, position: { x: prevS.x, y: prevS.y }, size: { w: prevS.w, h: prevS.h } };
      }
      return {
        ...x, maximized: true,
        prevState: { x: x.position.x, y: x.position.y, w: x.size.w, h: x.size.h },
        position: { x: 0, y: 0 }, size: { w: window.innerWidth, h: window.innerHeight - 48 },
      };
    }));
  }, []);

  /* ── Tile ── */
  const tileWindow = useCallback((id, side) => {
    const dw = window.innerWidth;
    const dh = window.innerHeight - 48;
    const pos = TILE_POSITIONS[side](dw, dh);
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, maximized: false, position: { x: pos.x, y: pos.y }, size: { w: pos.w, h: pos.h } } : w));
  }, []);

  /* ── Drag ── */
  const [drag, setDrag] = useState(null);
  const handleTitleMD = useCallback((e, winId) => {
    if (e.target.closest(".win-btn")) return;
    const win = windows.find((w) => w.id === winId);
    if (!win || win.maximized) return;
    e.preventDefault();
    bringToFront(winId);
    setDrag({ id: winId, sx: e.clientX, sy: e.clientY, ox: win.position.x, oy: win.position.y });
  }, [windows, bringToFront]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      setWindows((prev) => prev.map((x) => x.id === drag.id ? {
        ...x, position: { x: Math.max(0, drag.ox + e.clientX - drag.sx), y: Math.max(0, drag.oy + e.clientY - drag.sy) },
      } : x));
    };
    const onUp = () => setDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [drag]);

  /* ── Resize ── */
  const [resize, setResize] = useState(null);
  const handleResizeMD = useCallback((e, winId, edge) => {
    e.preventDefault(); e.stopPropagation();
    const win = windows.find((w) => w.id === winId);
    if (!win || win.maximized) return;
    bringToFront(winId);
    setResize({ id: winId, edge, sx: e.clientX, sy: e.clientY, ow: win.size.w, oh: win.size.h, ox: win.position.x, oy: win.position.y });
  }, [windows, bringToFront]);

  useEffect(() => {
    if (!resize) return;
    const onMove = (e) => {
      const dx = e.clientX - resize.sx, dy = e.clientY - resize.sy;
      setWindows((prev) => prev.map((x) => {
        if (x.id !== resize.id) return x;
        let { w, h, px, py } = { w: x.size.w, h: x.size.h, px: x.position.x, py: x.position.y };
        const e = resize.edge;
        if (e.includes("e")) w = Math.max(280, resize.ow + dx);
        if (e.includes("w")) { const nw = Math.max(280, resize.ow - dx); px = resize.ox + (resize.ow - nw); w = nw; }
        if (e.includes("s")) h = Math.max(160, resize.oh + dy);
        if (e.includes("n")) { const nh = Math.max(160, resize.oh - dy); py = resize.oy + (resize.oh - nh); h = nh; }
        return { ...x, size: { w, h }, position: { x: px, y: py } };
      }));
    };
    const onUp = () => setResize(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [resize]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setLauncherOpen(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setLauncherOpen((p) => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowLeft" && activeWin) { e.preventDefault(); tileWindow(activeWin, "left"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowRight" && activeWin) { e.preventDefault(); tileWindow(activeWin, "right"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "m" && activeWin) { e.preventDefault(); toggleMinimize(activeWin); }
      if ((e.metaKey || e.ctrlKey) && e.key === "w" && activeWin) { e.preventDefault(); closeWindow(activeWin); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeWin, tileWindow, toggleMinimize, closeWindow]);

  /* ── Launch app for route on mount ── */
  useEffect(() => {
    if (curMod && !showDesktop && !windows.find((w) => w.appId === curMod && !w.minimized)) {
      const app = APPS.find((a) => a.id === curMod);
      if (app) {
        const dw = window.innerWidth, dh = window.innerHeight - 48;
        const base = DEF_SIZE(curMod);
        const win = {
          id: UID(), appId: app.id, title: app.name, icon: app.icon, color: app.color,
          minimized: false, maximized: false,
          position: { x: CLAMP(60, 0, dw - base.w), y: CLAMP(40, 0, dh - base.h) },
          size: { w: base.w, h: base.h },
          prevState: null, zIndex: nextZ,
        };
        setNextZ((z) => z + 1);
        setWindows((prev) => [...prev, win]);
        setActiveWin(win.id);
      }
    }
  }, []);

  /* ── Focus launcher input ── */
  useEffect(() => { if (launcherOpen && launcherInputRef.current) setTimeout(() => launcherInputRef.current?.focus(), 50); }, [launcherOpen]);

  /* ── Filter apps for launcher ── */
  const filteredApps = APPS.filter((a) => {
    if (launcherCat !== "all" && a.cat !== launcherCat) return false;
    if (launcherSearch.trim()) return a.name.toLowerCase().includes(launcherSearch.toLowerCase()) || a.id.includes(launcherSearch.toLowerCase());
    return true;
  });

  /* ── Active app for current route ── */
  const currentApp = APPS.find((a) => a.id === curMod);
  const activeWindowData = windows.find((w) => w.id === activeWin);
  const visibleWindows = windows.filter((w) => !w.minimized);

  return (
    <div className="h-screen flex flex-col bg-[#070707] text-white overflow-hidden select-none">
      {/* Desktop */}
      <div ref={desktopRef} className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.025),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.025),transparent_50%),linear-gradient(135deg,#060606,#0a0a0a)]" />
        <div className="absolute inset-0 opacity-[0.01]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        {/* Desktop content when no windows visible */}
        {(visibleWindows.length === 0 || showDesktop) && (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 p-8 overflow-y-auto scrollbar-thin">
              <div className="max-w-4xl mx-auto mt-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-white/70 tracking-tight">BRANPY</h1>
                      <p className="text-[10px] text-white/12">Universal AI Workspace</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/10 max-w-md mx-auto">Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-white/20 text-[9px] font-mono border border-white/10 mx-0.5">⌘K</kbd> to launch apps</p>
                </div>
                <div className="grid grid-cols-6 gap-2 max-w-2xl mx-auto">
                  {APPS.filter((a) => !["plans", "settings", "support"].includes(a.id)).map((app) => (
                    <button key={app.id} onClick={() => openApp(app.id)} className="group flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/[0.04] transition-all active:scale-[0.97]">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-sm transition-all group-hover:scale-110 group-hover:shadow-md" style={{ background: `${app.color}10` }}>
                        <span>{app.icon}</span>
                      </div>
                      <span className="text-[8px] text-white/25 group-hover:text-white/45 text-center leading-tight">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center pb-5 text-[8px] text-white/6">BRANPY OS · v2.0</div>
          </div>
        )}

        {/* Floating windows */}
        {windows.map((win) => {
          if (win.minimized) return null;
          const isActive = activeWin === win.id;
          return (
            <div key={win.id}
              className={`absolute rounded-lg overflow-hidden border flex flex-col transition-[box-shadow] duration-150 ${isActive ? "shadow-2xl" : "shadow-lg"}`}
              style={{
                left: win.position.x, top: win.position.y,
                width: win.size.w, height: win.size.h,
                zIndex: win.zIndex,
                borderColor: isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                background: "#0c0c0c",
              }}
              onMouseDown={() => { if (!isActive) bringToFront(win.id); }}
            >
              {/* Title bar */}
              <div className="h-9 flex-shrink-0 bg-[#111] border-b border-white/[0.06] flex items-center px-3 gap-2 cursor-default"
                onMouseDown={(e) => handleTitleMD(e, win.id)}
                onDoubleClick={() => toggleMaximize(win.id)}
              >
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <div className="w-[10px] h-[10px] rounded-full bg-red-500/40 hover:bg-red-500 win-btn cursor-pointer transition-all" onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }} title="Close" />
                  <div className="w-[10px] h-[10px] rounded-full bg-amber-500/40 hover:bg-amber-500 win-btn cursor-pointer transition-all" onClick={(e) => { e.stopPropagation(); toggleMinimize(win.id); }} title="Minimize" />
                  <div className="w-[10px] h-[10px] rounded-full bg-emerald-500/40 hover:bg-emerald-500 win-btn cursor-pointer transition-all" onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }} title={win.maximized ? "Restore" : "Maximize"} />
                </div>

                {/* Title */}
                <div className="flex-1 flex items-center justify-center gap-1.5 text-[10px] min-w-0">
                  <span className="text-sm">{win.icon}</span>
                  <span className="text-white/40 font-medium truncate">{win.title}</span>
                </div>

                {/* Window controls */}
                <div className="flex items-center gap-1">
                  <button onClick={() => tileWindow(win.id, "left")} className="p-0.5 rounded hover:bg-white/10 text-white/15 hover:text-white/35 win-btn" title="Tile Left">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
                  </button>
                  <button onClick={() => tileWindow(win.id, "right")} className="p-0.5 rounded hover:bg-white/10 text-white/15 hover:text-white/35 win-btn" title="Tile Right">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="13" y1="3" x2="13" y2="21" /></svg>
                  </button>
                  <div className="w-px h-3 bg-white/6 mx-0.5" />
                  <button onClick={() => toggleMaximize(win.id)} className="p-0.5 rounded hover:bg-white/10 text-white/15 hover:text-white/35 win-btn" title={win.maximized ? "Restore" : "Maximize"}>
                    {win.maximized ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="5" y="5" width="14" height="14" rx="2" /><rect x="7" y="7" width="7" height="6" /></svg>
                    ) : (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                    )}
                  </button>
                  <button onClick={() => closeWindow(win.id)} className="p-0.5 rounded hover:bg-red-500/20 text-white/15 hover:text-red-400 win-btn" title="Close">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M6 6l12 12M18 6l-12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 bg-[#0a0a0a]">
                {win.appId === curMod ? children : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/15">
                    <span className="text-3xl opacity-60">{win.icon}</span>
                    <span className="text-[11px] text-white/25">{win.title}</span>
                    <span className="text-[8px] text-white/10">Click to switch · {win.appId}</span>
                    <button onClick={() => { if (APPS.find((a) => a.id === win.appId)?.route) navigate(APPS.find((a) => a.id === win.appId).route); }} className="mt-2 text-[9px] px-3 py-1 rounded bg-white/10 text-white/40 hover:bg-white/15">
                      Switch Here
                    </button>
                  </div>
                )}
              </div>

              {/* Resize handles */}
              {!win.maximized && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-0 top-2 bottom-2 w-[3px] cursor-col-resize pointer-events-auto hover:bg-emerald-500/15 rounded" onMouseDown={(e) => handleResizeMD(e, win.id, "w")} />
                  <div className="absolute right-0 top-2 bottom-2 w-[3px] cursor-col-resize pointer-events-auto hover:bg-emerald-500/15 rounded" onMouseDown={(e) => handleResizeMD(e, win.id, "e")} />
                  <div className="absolute top-0 left-2 right-2 h-[3px] cursor-row-resize pointer-events-auto hover:bg-emerald-500/15 rounded" onMouseDown={(e) => handleResizeMD(e, win.id, "n")} />
                  <div className="absolute bottom-0 left-2 right-2 h-[3px] cursor-row-resize pointer-events-auto hover:bg-emerald-500/15 rounded" onMouseDown={(e) => handleResizeMD(e, win.id, "s")} />
                  <div className="absolute top-0 left-0 w-[8px] h-[8px] cursor-nw-resize pointer-events-auto" onMouseDown={(e) => handleResizeMD(e, win.id, "nw")} />
                  <div className="absolute top-0 right-0 w-[8px] h-[8px] cursor-ne-resize pointer-events-auto" onMouseDown={(e) => handleResizeMD(e, win.id, "ne")} />
                  <div className="absolute bottom-0 left-0 w-[8px] h-[8px] cursor-sw-resize pointer-events-auto" onMouseDown={(e) => handleResizeMD(e, win.id, "sw")} />
                  <div className="absolute bottom-0 right-0 w-[8px] h-[8px] cursor-se-resize pointer-events-auto" onMouseDown={(e) => handleResizeMD(e, win.id, "se")} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dock */}
      <div className="h-12 flex-shrink-0 bg-[#0c0c0c]/90 backdrop-blur-xl border-t border-white/[0.06] flex items-center px-3 gap-1 z-50 relative">
        {/* Launcher */}
        <button onClick={() => setLauncherOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 text-[11px] transition-all mr-1" title="Launchpad (⌘K)">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" /></svg>
          Apps
        </button>

        <div className="w-px h-6 bg-white/[0.06] mr-1" />

        {/* Open windows in dock */}
        {windows.map((win) => {
          const app = APPS.find((a) => a.id === win.appId);
          if (!app) return null;
          const isActive = activeWin === win.id;
          return (
            <button key={`dock-${win.id}`} onClick={() => {
              if (win.minimized) {
                setWindows((prev) => prev.map((w) => w.id === win.id ? { ...w, minimized: false } : w));
              }
              bringToFront(win.id);
              if (app.route) navigate(app.route);
            }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all relative ${isActive ? "bg-white/10 text-white/65" : win.minimized ? "text-white/15 opacity-50 hover:opacity-80 hover:bg-white/5" : "text-white/30 hover:bg-white/5 hover:text-white/55"}`} title={`${win.title}${win.minimized ? " (minimized)" : ""}`}>
              <span className="text-base">{win.icon}</span>
              <span className="text-[10px] truncate max-w-[70px]">{win.title}</span>
              {isActive && <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: app.color }} />}
            </button>
          );
        })}

        {/* Desktop button */}
        {windows.length > 0 && (
          <button onClick={() => { setShowDesktop(!showDesktop); }} className={`ml-0.5 p-1.5 rounded hover:bg-white/5 transition-all ${showDesktop ? "text-white/50 bg-white/10" : "text-white/15 hover:text-white/35"}`} title="Show Desktop">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
          </button>
        )}

        <div className="flex-1" />

        {/* Status */}
        <div className="flex items-center gap-2 text-[8px] text-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
          <span>BRANPY OS</span>
          <span className="text-white/5">·</span>
          <span>v2.0</span>
          <span className="text-white/5">·</span>
          <span>{windows.filter((w) => !w.minimized).length} win</span>
        </div>

        <div className="w-px h-5 bg-white/[0.06] mx-2" />

        <Clock />
      </div>

      {/* Launcher overlay */}
      {launcherOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-150" onClick={() => setLauncherOpen(false)}>
          <div className="w-[680px] max-h-[75vh] bg-[#0e0e0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10 focus-within:border-white/20 transition-colors">
                <svg className="w-4 h-4 text-white/20 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z" /></svg>
                <input ref={launcherInputRef} value={launcherSearch} onChange={(e) => setLauncherSearch(e.target.value)} placeholder="Search apps..." className="bg-transparent text-xs text-white/60 outline-none w-full placeholder:text-white/15" />
                <kbd className="text-[8px] text-white/10 bg-white/5 px-1.5 py-0.5 rounded font-mono border border-white/5">ESC</kbd>
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
                <div className="py-12 text-center text-xs text-white/10">No apps found</div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {filteredApps.map((app) => (
                    <button key={app.id} onClick={() => openApp(app.id)} className="group flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-white/[0.04] transition-all active:scale-95">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-110" style={{ background: `${app.color}10` }}>
                        <span>{app.icon}</span>
                      </div>
                      <span className="text-[9px] text-white/30 group-hover:text-white/55 text-center leading-tight">{app.name}</span>
                      <span className="text-[6px] text-white/8">{app.cat}</span>
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
