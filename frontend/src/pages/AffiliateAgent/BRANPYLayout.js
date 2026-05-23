import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MENU_ITEMS = [
  { id: "chat", label: "AI Chat", icon: "💬" },
  { id: "affiliate", label: "Affiliate AI Agent", icon: "📊" },
  { type: "divider" },
  { id: "video-studio", label: "Video Studio", icon: "🎬" },
  { id: "image-studio", label: "Image Studio", icon: "🎨" },
  { id: "site-builder", label: "Site & App Builder", icon: "🌐" },
  { id: "brand-studio", label: "Brand Studio", icon: "✨" },
  { id: "social-publisher", label: "Social Publisher", icon: "📱" },
  { id: "automation-hub", label: "Automation Hub", icon: "⚡" },
  { type: "divider" },
  { id: "agent-marketplace", label: "Agent Marketplace", icon: "🤖" },
  { id: "leads-crm", label: "Leads & CRM", icon: "👥" },
  { id: "ecommerce", label: "E-commerce / Loja", icon: "🛒" },
  { id: "analytics", label: "Analytics Avançado", icon: "📈" },
  { type: "divider" },
  { id: "templates", label: "Biblioteca de Templates", icon: "📋" },
  { id: "voice-ai", label: "Voz AI & Dublagem", icon: "🎙️" },
  { id: "transcription", label: "Transcrição AI", icon: "📝" },
  { id: "code-generator", label: "Gerador de Código", icon: "💻" },
  { id: "documents", label: "Documentos AI", icon: "📄" },
  { id: "media-bank", label: "Banco de Mídia", icon: "🗂️" },
  { id: "music-sounds", label: "Músicas & Sons", icon: "🎵" },
  { id: "ai-avatars", label: "AI Avatares", icon: "🧑‍🎤" },
  { type: "divider" },
  { id: "projects", label: "Projetos", icon: "📁" },
  { id: "integrations", label: "Integrações", icon: "🔌" },
  { id: "plans", label: "Planos & Assinatura", icon: "💎" },
  { id: "team", label: "Equipe / Colaboradores", icon: "👤" },
  { id: "settings", label: "Configurações", icon: "⚙️" },
  { id: "support", label: "Suporte", icon: "❓" },
];

function MenuItem({ item, active, onClick }) {
  if (item.type === "divider") {
    return <div className="h-px bg-white/5 my-2 mx-3" />;
  }
  return (
    <button
      onClick={() => onClick(item.id)}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-all duration-150 ${
        active
          ? "bg-white/10 text-white font-medium"
          : "text-white/60 hover:text-white/90 hover:bg-white/[0.04]"
      }`}
    >
      <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </button>
  );
}

export default function BRANPYLayout({ children, activeModule, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (moduleId) => {
    const path = moduleId === "chat" ? "/affiliate-agent" : `/affiliate-agent/${moduleId}`;
    if (onNavigate) {
      onNavigate(moduleId);
    } else {
      navigate(path);
    }
  };

  const currentModule = activeModule || (location.pathname === "/affiliate-agent" ? "chat" : location.pathname.split("/").pop());

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white overflow-hidden">
      <div
        className={`flex-shrink-0 bg-[#111111] border-r border-white/[0.06] flex flex-col transition-all duration-200 ${
          collapsed ? "w-14" : "w-60"
        }`}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/[0.06] flex-shrink-0">
          {!collapsed && (
            <>
              <span className="text-lg font-semibold tracking-tight text-white">BRANPY</span>
              <span className="text-[10px] font-medium text-white/30 px-1.5 py-0.5 rounded bg-white/5">beta</span>
            </>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-white/30 hover:text-white/70 transition-colors text-xs"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10">
          {MENU_ITEMS.map((item, i) =>
            item.type === "divider" ? (
              collapsed ? null : <MenuItem key={`div-${i}`} item={item} active={false} onClick={() => {}} />
            ) : (
              <MenuItem
                key={item.id}
                item={item}
                active={currentModule === item.id}
                onClick={handleNavigate}
              />
            )
          )}
        </div>
        <div className="px-3 py-3 border-t border-white/[0.06] flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 text-xs text-white/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              BRANPY v1.0
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
