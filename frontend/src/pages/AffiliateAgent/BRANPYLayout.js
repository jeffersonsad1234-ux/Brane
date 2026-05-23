import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MENU_GROUPS = [
  {
    label: "Workspace",
    items: [
      { id: "chat", label: "AI Chat", icon: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" },
    ],
  },
  {
    label: "Criação",
    items: [
      { id: "video-studio", label: "Video Studio", icon: "M8 5v14l11-7z" },
      { id: "image-studio", label: "Image Studio", icon: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" },
      { id: "brand-studio", label: "Brand Studio", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" },
      { id: "site-builder", label: "Site & App Builder", icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2h2v2h-2V6zm0 4h2v2h-2v-2zm-4-4h2v2H8V6zm0 4h2v2H8v-2zm-4 4h16v2H4v-2zm0-4h2v2H4v-2z" },
    ],
  },
  {
    label: "Negócios",
    items: [
      { id: "affiliate", label: "Affiliate AI Agent", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
      { id: "social-publisher", label: "Social Publisher", icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
      { id: "automation-hub", label: "Automation Hub", icon: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" },
      { id: "ecommerce", label: "E-commerce", icon: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.17 14.75l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.86-7.01L19.42 4h-.01l-1.1 2-2.76 5H8.53l-.13-.27L6.16 6l-.95-2-.94-2H1v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25z" },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { id: "code-generator", label: "Gerador de Código", icon: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" },
      { id: "voice-ai", label: "Voz AI", icon: "M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.5 2h3v5.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V16zm5.5-4h1.7c0 3-2.54 5.1-5.3 5.1S6.3 15 6.3 12H8c0 2.2 1.8 4 4 4s4-1.8 4-4z" },
      { id: "ai-avatars", label: "AI Avatares", icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { id: "analytics", label: "Analytics", icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" },
      { id: "leads-crm", label: "Leads & CRM", icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
      { id: "agent-marketplace", label: "Agent Marketplace", icon: "M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79 2.73 2.71 7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58 3.51-3.47 9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z" },
    ],
  },
  {
    label: "Ferramentas",
    items: [
      { id: "templates", label: "Templates", icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" },
      { id: "transcription", label: "Transcrição AI", icon: "M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 3.3c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7S9.3 9.49 9.3 8s1.21-2.7 2.7-2.7zM18 16H6v-.9c0-2 4-3.1 6-3.1s6 1.1 6 3.1v.9z" },
      { id: "documents", label: "Documentos AI", icon: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-3 17H7v-2h4v2zm6-4H7v-2h10v2zm0-4H7V9h10v2z" },
      { id: "music-sounds", label: "Músicas & Sons", icon: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { id: "projects", label: "Projetos", icon: "M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" },
      { id: "integrations", label: "Integrações", icon: "M17 20H5c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h3.18c.42 0 .83.26.98.68L10 7h7c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2z" },
      { id: "team", label: "Equipe", icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "plans", label: "Planos", icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" },
      { id: "settings", label: "Configurações", icon: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" },
      { id: "support", label: "Suporte", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" },
    ],
  },
];

function SvgIcon({ path }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d={path} />
    </svg>
  );
}

function MenuGroup({ group, active, onNavigate, collapsed }) {
  return (
    <div className="mb-1">
      {!collapsed && (
        <div className="px-3 py-1.5 text-[10px] font-medium text-white/20 uppercase tracking-widest">
          {group.label}
        </div>
      )}
      {group.items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-all duration-150 ${
            active === item.id
              ? "bg-white/10 text-white font-medium shadow-sm"
              : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
          }`}
        >
          <span className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${
            active === item.id ? "text-emerald-400" : "text-white/40"
          }`}>
            <SvgIcon path={item.icon} />
          </span>
          {!collapsed && <span className="truncate">{item.label}</span>}
        </button>
      ))}
    </div>
  );
}

export default function BRANPYLayout({ children, activeModule, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (moduleId) => {
    const path = moduleId === "chat" ? "/affiliate-agent" : `/affiliate-agent/${moduleId}`;
    if (onNavigate) onNavigate(moduleId);
    else navigate(path);
  };

  const currentModule = activeModule || (location.pathname === "/affiliate-agent" ? "chat" : location.pathname.split("/").pop());

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <div
        className={`flex-shrink-0 bg-[#0f0f0f] border-r border-white/[0.06] flex flex-col transition-all duration-200 relative ${
          collapsed ? "w-14" : "w-58"
        }`}
      >
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-white/[0.06] flex-shrink-0">
          {!collapsed && (
            <>
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                B
              </div>
              <span className="text-sm font-semibold tracking-tight text-white/90">branpy</span>
            </>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-white/20 hover:text-white/60 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
          {MENU_GROUPS.map((group, i) => (
            <MenuGroup key={i} group={group} active={currentModule} onNavigate={handleNavigate} collapsed={collapsed} />
          ))}
        </div>
        <div className="px-3 py-2.5 border-t border-white/[0.06] flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                BRANPY v1.0
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
