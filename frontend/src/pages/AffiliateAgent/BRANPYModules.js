import React, { useState, useRef, useEffect } from "react";

function TopBar({ title, children }) {
  return (
    <div className="flex items-center justify-between px-5 h-11 border-b border-white/[0.06] flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-sm">
      <h1 className="text-sm font-medium text-white/80">{title}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Btn({ children, onClick, primary, active, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
        primary
          ? "bg-emerald-500/80 hover:bg-emerald-500 text-white"
          : active
          ? "bg-white/10 text-white/80"
          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function ScrollArea({ children, className = "" }) {
  return <div className={`flex-1 overflow-y-auto scrollbar-thin ${className}`}>{children}</div>;
}

export function VideoStudio() {
  const [tab, setTab] = useState("edit");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(100);
  const tracks = [
    { id: "v1", name: "Vídeo 1", type: "video", duration: 8, color: "bg-blue-500/30" },
    { id: "v2", name: "Vídeo 2", type: "video", duration: 5, color: "bg-purple-500/30" },
    { id: "a1", name: "Áudio 1", type: "audio", duration: 12, color: "bg-emerald-500/30" },
    { id: "t1", name: "Legendas", type: "text", duration: 6, color: "bg-amber-500/30" },
  ];

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setCurrentTime((t) => {
        if (t >= 12) { setPlaying(false); return 0; }
        return t + 0.1;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [playing]);

  const totalDuration = 12;
  const pixelsPerSecond = zoom * 0.6;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Video Studio">
        <Btn onClick={() => setTab("edit")} active={tab === "edit"}>Editar</Btn>
        <Btn onClick={() => setTab("export")} active={tab === "export"}>Exportar</Btn>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Btn primary>Novo Projeto</Btn>
      </TopBar>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex min-h-0">
          <div className="w-56 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
            <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Mídia</div>
            {["Intro.mp4", "Produto.mov", "Logo.png", "Trilha.mp3", "Overlay.mp4"].map((f) => (
              <div key={f} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5 cursor-grab text-xs text-white/50 mb-0.5">
                <span className="text-white/30">{f.endsWith(".mp4") || f.endsWith(".mov") ? "🎬" : f.endsWith(".mp3") ? "🎵" : "🖼️"}</span>
                {f}
              </div>
            ))}
            <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mt-5 mb-3">Efeitos</div>
            {["Transição", "Filtro", "Ajuste", "Sobrepor"].map((e) => (
              <div key={e} className="px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer text-xs text-white/50 mb-0.5">{e}</div>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
            <div className="flex-1 flex items-center justify-center bg-[#080808] relative m-3 rounded-lg border border-white/[0.04]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    {playing ? (
                      <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                      <svg className="w-6 h-6 text-white/60 ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </div>
                  <div className="text-xs text-white/30">{currentTime.toFixed(1)}s / {totalDuration}s</div>
                  <div className="flex gap-2 mt-3 justify-center">
                    <button onClick={() => setPlaying(!playing)} className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white/70 hover:bg-white/20">
                      {playing ? "⏸ Pausar" : "▶ Reproduzir"}
                    </button>
                    <button className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/40 hover:bg-white/10">⏹ Parar</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-48 flex-shrink-0 border-t border-white/[0.06] bg-[#0c0c0c]">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                  <button onClick={() => setPlaying(!playing)} className="hover:text-white/60">▶</button>
                  <button className="hover:text-white/60">⏮</button>
                  <button className="hover:text-white/60">⏭</button>
                </div>
                <div className="flex-1 mx-3 h-1 bg-white/10 rounded-full relative cursor-pointer">
                  <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${(currentTime / totalDuration) * 100}%` }} />
                </div>
                <span className="text-[10px] text-white/30 w-16 text-right">{currentTime.toFixed(1)}s</span>
                <button onClick={() => setZoom(Math.min(200, zoom + 20))} className="text-[10px] text-white/30 hover:text-white/60">+</button>
                <span className="text-[10px] text-white/30 w-8 text-center">{zoom}%</span>
                <button onClick={() => setZoom(Math.max(20, zoom - 20))} className="text-[10px] text-white/30 hover:text-white/60">−</button>
              </div>
              <div className="overflow-x-auto">
                <div style={{ width: totalDuration * pixelsPerSecond + 100, minWidth: "100%" }}>
                  <div className="flex text-[10px] text-white/20 h-4">
                    {Array.from({ length: totalDuration + 1 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 border-l border-white/[0.04] pl-0.5" style={{ width: pixelsPerSecond }}>
                        {i}s
                      </div>
                    ))}
                  </div>
                  {tracks.map((track) => (
                    <div key={track.id} className="h-7 border-b border-white/[0.03] flex items-center relative">
                      <div className="w-20 flex-shrink-0 text-[10px] text-white/30 pl-2">{track.name}</div>
                      <div className="relative flex-1 h-full">
                        <div
                          className={`absolute top-1 h-5 rounded ${track.color} border border-white/10 cursor-pointer hover:opacity-80`}
                          style={{ left: 20, width: track.duration * pixelsPerSecond }}
                        >
                          <div className="text-[8px] text-white/60 px-2 leading-5 truncate">{track.duration}s</div>
                        </div>
                        {currentTime > 0 && (
                          <div className="absolute top-0 bottom-0 w-px bg-red-400/60 z-10" style={{ left: 20 + currentTime * pixelsPerSecond }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="w-56 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
            <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Propriedades</div>
            <div className="space-y-2.5">
              {[
                { label: "Posição X", value: "0" },
                { label: "Posição Y", value: "0" },
                { label: "Escala", value: "100%" },
                { label: "Rotação", value: "0°" },
                { label: "Opacidade", value: "100%" },
              ].map((p) => (
                <div key={p.label} className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">{p.label}</span>
                  <input className="w-16 bg-white/5 border border-white/10 rounded text-[10px] text-white/60 px-1.5 py-0.5 text-right outline-none focus:border-white/20" defaultValue={p.value} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageStudio() {
  const [tool, setTool] = useState("select");
  const tools = [
    { id: "select", label: "Selecionar", icon: "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" },
    { id: "text", label: "Texto", icon: "M5 4v3h5.5v12h3V7H19V4z" },
    { id: "image", label: "Imagem", icon: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" },
    { id: "bg", label: "Remover Fundo", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
    { id: "crop", label: "Cortar", icon: "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" },
    { id: "layers", label: "Camadas", icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Image Studio">
        <Btn primary>Nova Criação</Btn>
        <Btn>Exportar</Btn>
      </TopBar>
      <div className="flex-1 flex min-h-0">
        <div className="w-14 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] flex flex-col items-center py-3 gap-1">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                tool === t.id ? "bg-white/10 text-emerald-400" : "text-white/30 hover:text-white/60 hover:bg-white/5"
              }`}
              title={t.label}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d={t.icon} /></svg>
            </button>
          ))}
          <div className="mt-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-xs text-white/50">+</div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-[#080808] m-0">
          <div className="w-[600px] h-[400px] bg-white/[0.02] rounded-lg border border-white/[0.06] border-dashed flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-white/20 mb-3" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              <p className="text-xs text-white/20">Arraste imagens ou clique para adicionar</p>
              <button className="mt-3 px-4 py-1.5 text-xs rounded-lg bg-white/10 text-white/60 hover:bg-white/15">Upload</button>
            </div>
          </div>
        </div>
        <div className="w-56 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Camadas</div>
          {["Fundo", "Texto 1", "Imagem 1", "Logo"].map((l, i) => (
            <div key={l} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs mb-0.5 ${i === 2 ? "bg-white/10 text-white/70" : "text-white/40 hover:bg-white/5"}`}>
              <span className="text-white/20">{i + 1}</span>
              {l}
            </div>
          ))}
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mt-5 mb-3">Cores</div>
          <div className="flex gap-1.5 flex-wrap">
            {["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#ffffff","#000000","#6b7280"].map((c) => (
              <div key={c} className="w-6 h-6 rounded-md cursor-pointer border border-white/10" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteBuilder() {
  const [mode, setMode] = useState("desktop");
  const [page, setPage] = useState("home");
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Site & App Builder">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
          {[
            { id: "desktop", icon: "M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" },
            { id: "tablet", icon: "M18.5 0h-13A2.5 2.5 0 003 2.5v19A2.5 2.5 0 005.5 24h13a2.5 2.5 0 002.5-2.5v-19A2.5 2.5 0 0018.5 0zm-7 21.5a1 1 0 110-2 1 1 0 010 2zm7.5-3h-15V3h15v15.5z" },
            { id: "mobile", icon: "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" },
          ].map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`p-1.5 rounded-md transition-all ${mode === m.id ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50"}`}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d={m.icon} /></svg>
            </button>
          ))}
        </div>
        <Btn primary>Publicar</Btn>
      </TopBar>
      <div className="flex-1 flex min-h-0">
        <div className="w-52 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Páginas</div>
          {[
            { id: "home", label: "Home" },
            { id: "about", label: "Sobre" },
            { id: "products", label: "Produtos" },
            { id: "contact", label: "Contato" },
          ].map((p) => (
            <button key={p.id} onClick={() => setPage(p.id)} className={`w-full text-left px-2 py-1.5 rounded-md text-xs mb-0.5 ${page === p.id ? "bg-white/10 text-white/70" : "text-white/40 hover:bg-white/5"}`}>
              {p.label}
            </button>
          ))}
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mt-5 mb-3">Componentes</div>
          {["Header", "Hero", "Grid", "Cards", "Footer"].map((c) => (
            <div key={c} className="px-2 py-1.5 rounded-md text-xs text-white/40 hover:bg-white/5 cursor-grab mb-0.5">{c}</div>
          ))}
        </div>
        <div className="flex-1 flex items-start justify-center bg-[#080808] overflow-auto p-6">
          <div className={`bg-white/[0.02] rounded-lg border border-white/[0.06] ${mode === "desktop" ? "w-full" : mode === "tablet" ? "w-[600px]" : "w-[320px]"}`}>
            <div className="h-10 bg-white/5 flex items-center px-4 rounded-t-lg border-b border-white/[0.06]">
              <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/50" /><div className="w-2 h-2 rounded-full bg-amber-500/50" /><div className="w-2 h-2 rounded-full bg-emerald-500/50" /></div>
              <div className="mx-auto text-[10px] text-white/20">brane.app</div>
            </div>
            <div className="p-6 space-y-4">
              <div className="h-8 w-1/3 bg-white/5 rounded" />
              <div className="h-32 bg-white/5 rounded-lg" />
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded" />)}
              </div>
              <div className="h-12 bg-white/5 rounded" />
            </div>
          </div>
        </div>
        <div className="w-52 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Propriedades</div>
          <div className="space-y-2.5 text-[10px]">
            {["Largura", "Altura", "Padding", "Margem", "Cor Fundo", "Border Radius"].map((p) => (
              <div key={p} className="flex items-center justify-between">
                <span className="text-white/30">{p}</span>
                <input className="w-14 bg-white/5 border border-white/10 rounded text-white/50 px-1.5 py-0.5 text-right outline-none focus:border-white/20" defaultValue="auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrandStudio() {
  const templates = [
    { name: "Post Instagram", size: "1080x1080", icon: "📱" },
    { name: "Story", size: "1080x1920", icon: "📖" },
    { name: "Banner Web", size: "1200x600", icon: "🖥️" },
    { name: "Thumbnail", size: "1280x720", icon: "🎬" },
    { name: "Logo", size: "500x500", icon: "💠" },
    { name: "Card", size: "800x400", icon: "🃏" },
  ];
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Brand Studio">
        <Btn primary>Criar Design</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {templates.map((t) => (
              <button key={t.name} className="group rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 text-left hover:bg-white/[0.04] hover:border-white/10 transition-all">
                <div className="text-2xl mb-3">{t.icon}</div>
                <div className="text-sm font-medium text-white/70 group-hover:text-white/90">{t.name}</div>
                <div className="text-[10px] text-white/30 mt-1">{t.size}</div>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function SocialPublisher() {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const [weekOffset, setWeekOffset] = useState(0);
  const getWeekDates = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() + weekOffset * 7 - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };
  const weekDates = getWeekDates();
  const posts = [
    { day: 0, time: "09:00", platform: "TikTok", content: "Review produto #1", status: "agendado" },
    { day: 1, time: "14:00", platform: "Instagram", content: "Unboxing", status: "rascunho" },
    { day: 3, time: "10:30", platform: "YouTube", content: "Tutorial completo", status: "agendado" },
    { day: 5, time: "18:00", platform: "TikTok", content: "Dica rápida", status: "publicado" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Social Publisher">
        <Btn primary>Novo Post</Btn>
        <Btn onClick={() => setWeekOffset(weekOffset - 1)}>←</Btn>
        <Btn onClick={() => setWeekOffset(0)}>Hoje</Btn>
        <Btn onClick={() => setWeekOffset(weekOffset + 1)}>→</Btn>
      </TopBar>
      <ScrollArea className="p-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, i) => (
              <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] min-h-[200px]">
                <div className="text-center py-2 border-b border-white/[0.06]">
                  <div className="text-[10px] text-white/30">{days[i]}</div>
                  <div className="text-sm font-medium text-white/60">{date.getDate()}</div>
                </div>
                <div className="p-1.5 space-y-1">
                  {posts.filter(p => p.day === i).map((p, j) => (
                    <div key={j} className={`px-2 py-1.5 rounded-md text-[10px] ${
                      p.status === "publicado" ? "bg-emerald-500/10 border border-emerald-500/20" :
                      p.status === "agendado" ? "bg-blue-500/10 border border-blue-500/20" :
                      "bg-white/5 border border-white/10"
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">{p.time}</span>
                        <span className="text-white/30">{p.platform}</span>
                      </div>
                      <div className="text-white/60 mt-0.5 truncate">{p.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
            <div className="text-xs font-medium text-white/50 mb-3">Contas Conectadas</div>
            <div className="flex gap-4">
              {[{ name: "TikTok", icon: "🎵", connected: true }, { name: "Instagram", icon: "📸", connected: true }, { name: "YouTube", icon: "▶️", connected: false }, { name: "Facebook", icon: "👍", connected: false }, { name: "Kwai", icon: "📹", connected: false }].map((p) => (
                <div key={p.name} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${p.connected ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-white/5 border border-white/10 text-white/30"}`}>
                  <span>{p.icon}</span>
                  {p.name}
                  {p.connected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function AutomationHub() {
  const [nodes, setNodes] = useState([
    { id: 1, type: "trigger", label: "Produto Importado", x: 60, y: 120, color: "bg-blue-500/20 border-blue-500/30" },
    { id: 2, type: "action", label: "Gerar Copy IA", x: 260, y: 120, color: "bg-purple-500/20 border-purple-500/30" },
    { id: 3, type: "action", label: "Gerar Vídeo", x: 460, y: 120, color: "bg-emerald-500/20 border-emerald-500/30" },
    { id: 4, type: "action", label: "Publicar TikTok", x: 660, y: 120, color: "bg-amber-500/20 border-amber-500/30" },
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Automation Hub">
        <Btn primary>Novo Fluxo</Btn>
        <Btn>Executar</Btn>
        <Btn>Histórico</Btn>
      </TopBar>
      <div className="flex-1 flex min-h-0">
        <div className="w-48 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Gatilhos</div>
          {["Produto importado", "Novo lead", "Agendamento", "Webhook"].map((t) => (
            <div key={t} className="px-2 py-1.5 rounded-md text-xs text-white/40 hover:bg-white/5 cursor-grab mb-0.5">{t}</div>
          ))}
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mt-5 mb-3">Ações</div>
          {["Gerar copy", "Gerar vídeo", "Publicar rede", "Enviar email", "Webhook", "Salvar dado"].map((a) => (
            <div key={a} className="px-2 py-1.5 rounded-md text-xs text-white/40 hover:bg-white/5 cursor-grab mb-0.5">{a}</div>
          ))}
        </div>
        <div className="flex-1 relative bg-[#080808] overflow-auto">
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {nodes.map((node) => (
            <div key={node.id} className={`absolute px-3 py-2 rounded-xl border ${node.color} bg-[#0c0c0c]/90 backdrop-blur-sm cursor-move`} style={{ left: node.x, top: node.y }}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${node.color.split(" ")[0]}`} />
                <span className="text-xs text-white/60">{node.label}</span>
              </div>
            </div>
          ))}
          {nodes.slice(0, -1).map((node, i) => (
            <svg key={`conn-${i}`} className="absolute" style={{ left: node.x + 120, top: node.y + 18 }} width="80" height="2">
              <line x1="0" y1="1" x2="80" y2="1" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4,3" />
              <polygon points="78,1 70,-3 70,5" fill="rgba(255,255,255,0.15)" />
            </svg>
          ))}
          <div className="absolute bottom-4 left-4 text-[10px] text-white/20">Canvas livre — arraste os blocos para criar seu fluxo</div>
        </div>
      </div>
    </div>
  );
}

export function AgentMarketplace() {
  const agents = [
    { name: "Agente Afiliado", desc: "Importa produtos, gera anúncios e publica automaticamente", icon: "📊", color: "emerald", active: true },
    { name: "Agente Social", desc: "Cria e agenda conteúdo para todas as redes sociais", icon: "📱", color: "blue", active: false },
    { name: "Agente Vendas", desc: "Automatiza prospecção, follow-up e fechamento", icon: "💰", color: "purple", active: false },
    { name: "Agente Vídeo", desc: "Produz vídeos com IA, edição e legendas automáticas", icon: "🎬", color: "amber", active: false },
    { name: "Agente Conteúdo", desc: "Gera artigos, posts, newsletters e copywriting", icon: "✍️", color: "rose", active: false },
    { name: "Agente Suporte", desc: "Chatbot inteligente para atendimento ao cliente", icon: "🤖", color: "cyan", active: false },
  ];
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Agent Marketplace">
        <Btn primary>Criar Agente</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
          {agents.map((a) => (
            <div key={a.name} className={`rounded-xl bg-white/[0.02] border ${a.active ? "border-emerald-500/20" : "border-white/[0.06]"} p-5 hover:bg-white/[0.04] transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{a.icon}</span>
                {a.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Ativo</span>}
              </div>
              <div className="text-sm font-medium text-white/70">{a.name}</div>
              <div className="text-xs text-white/40 mt-1 leading-relaxed">{a.desc}</div>
              <button className={`mt-4 w-full text-xs py-1.5 rounded-lg transition-all ${a.active ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
                {a.active ? "Gerenciar" : "Ativar"}
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function LeadsCRM() {
  const stages = [
    { name: "Novo Lead", color: "bg-blue-500/20 border-blue-500/30", leads: [{ name: "João Silva", value: "R$ 2.500" }, { name: "Maria Santos", value: "R$ 1.800" }, { name: "Carlos Lima", value: "R$ 5.000" }] },
    { name: "Contatado", color: "bg-amber-500/20 border-amber-500/30", leads: [{ name: "Ana Costa", value: "R$ 3.200" }, { name: "Pedro Alves", value: "R$ 1.500" }] },
    { name: "Proposta", color: "bg-purple-500/20 border-purple-500/30", leads: [{ name: "Lucia Pereira", value: "R$ 8.000" }] },
    { name: "Fechado", color: "bg-emerald-500/20 border-emerald-500/30", leads: [{ name: "Roberto Oliveira", value: "R$ 12.000" }] },
  ];
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Leads & CRM">
        <Btn primary>Novo Lead</Btn>
      </TopBar>
      <ScrollArea className="p-5">
        <div className="flex gap-4 h-full" style={{ minHeight: 400 }}>
          {stages.map((s) => (
            <div key={s.name} className="flex-1 min-w-[200px] rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-white/50">{s.name}</span>
                <span className="text-[10px] text-white/30">{s.leads.length}</span>
              </div>
              <div className="space-y-2">
                {s.leads.map((l) => (
                  <div key={l.name} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer">
                    <div className="text-xs text-white/70">{l.name}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{l.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function Ecommerce() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="E-commerce">
        <Btn primary>Novo Produto</Btn>
        <Btn>Pedidos</Btn>
        <Btn>Clientes</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Produtos", value: "24", change: "+3 esta semana" },
              { label: "Pedidos", value: "18", change: "+12% vs mês passado" },
              { label: "Faturamento", value: "R$ 12.450", change: "+8%" },
              { label: "Clientes", value: "89", change: "+15 novos" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                <div className="text-[10px] text-white/30">{s.label}</div>
                <div className="text-lg font-semibold text-white/80 mt-1">{s.value}</div>
                <div className="text-[10px] text-emerald-400 mt-1">{s.change}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-5 gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
              <span className="col-span-2">Produto</span><span>Preço</span><span>Vendas</span><span>Status</span>
            </div>
            {[
              { name: "Fone Bluetooth", price: "R$ 89,90", sales: 12, status: "Ativo" },
              { name: "Carregador USB-C", price: "R$ 39,90", sales: 8, status: "Ativo" },
              { name: "Capa Silicone", price: "R$ 29,90", sales: 5, status: "Pausado" },
            ].map((p) => (
              <div key={p.name} className="grid grid-cols-5 gap-3 px-4 py-3 border-b border-white/[0.03] text-xs text-white/50 hover:bg-white/[0.02]">
                <span className="col-span-2 text-white/70">{p.name}</span><span>{p.price}</span><span>{p.sales}</span><span>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function AnalyticsAdvanced() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Analytics">
        <Btn active>7 dias</Btn>
        <Btn>30 dias</Btn>
        <Btn>90 dias</Btn>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Btn primary>Exportar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Receita Total", value: "R$ 24.580", change: "+18.5%", up: true },
              { label: "Visualizações", value: "45.230", change: "+12.3%", up: true },
              { label: "CTR Médio", value: "4.8%", change: "-0.6%", up: false },
              { label: "Conversões", value: "342", change: "+22.1%", up: true },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                <div className="text-[10px] text-white/30">{s.label}</div>
                <div className="text-lg font-semibold text-white/80 mt-1">{s.value}</div>
                <div className={`text-[10px] mt-1 ${s.up ? "text-emerald-400" : "text-red-400"}`}>{s.change}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 mb-4">
            <div className="text-xs font-medium text-white/50 mb-4">Receita (últimos 7 dias)</div>
            <div className="flex items-end gap-2 h-32">
              {[40, 55, 45, 70, 60, 80, 65].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-emerald-500/30 hover:bg-emerald-500/50 transition-all" style={{ height: `${h}%` }} />
                  <span className="text-[8px] text-white/20">D{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-xs font-medium text-white/50 mb-3">Por Plataforma</div>
              {[
                { name: "TikTok", value: 45, color: "bg-blue-500/30" },
                { name: "Instagram", value: 30, color: "bg-purple-500/30" },
                { name: "YouTube", value: 15, color: "bg-red-500/30" },
                { name: "Kwai", value: 10, color: "bg-amber-500/30" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-white/40 w-14">{p.name}</span>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.value}%` }} />
                  </div>
                  <span className="text-[10px] text-white/30 w-8 text-right">{p.value}%</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-xs font-medium text-white/50 mb-3">Top Produtos</div>
              {[
                { name: "Fone Bluetooth", value: "R$ 4.230", rank: 1 },
                { name: "Carregador USB", value: "R$ 3.120", rank: 2 },
                { name: "Capa Silicone", value: "R$ 2.890", rank: 3 },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/20">#{p.rank}</span>
                    <span className="text-xs text-white/50">{p.name}</span>
                  </div>
                  <span className="text-xs text-white/60">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function TemplateLibrary() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Biblioteca de Templates">
        <Btn primary>Criar Template</Btn>
        <Btn>Importar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-4">
          {[
            { name: "Review Produto", type: "Vídeo", dur: "30s" },
            { name: "Unboxing", type: "Vídeo", dur: "45s" },
            { name: "Dica Rápida", type: "Vídeo", dur: "15s" },
            { name: "Post Carrossel", type: "Imagem", dur: "—" },
            { name: "Banner Promo", type: "Imagem", dur: "—" },
            { name: "Story Oferta", type: "Imagem", dur: "—" },
            { name: "Landing Page", type: "Site", dur: "—" },
            { name: "Card Produto", type: "Design", dur: "—" },
          ].map((t, i) => (
            <div key={i} className="group rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden hover:bg-white/[0.04] transition-all cursor-pointer">
              <div className="aspect-[16/10] bg-white/[0.03] flex items-center justify-center">
                <span className="text-2xl text-white/10 group-hover:text-white/20">📄</span>
              </div>
              <div className="p-3">
                <div className="text-xs text-white/70">{t.name}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{t.type} • {t.dur}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function VoiceAI() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Voz AI & Dublagem">
        <Btn primary>Gerar Voz</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
            <div className="text-xs font-medium text-white/50 mb-3">Texto para Voz</div>
            <textarea className="w-full h-24 bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs text-white/60 outline-none focus:border-white/20 resize-none" placeholder="Digite o texto que deseja converter em voz..." />
            <div className="flex items-center gap-2 mt-3">
              {["Narrativa", "Animada", "Suave", "Formal"].map((v) => (
                <button key={v} className="px-3 py-1 rounded-lg text-[10px] bg-white/5 text-white/40 hover:bg-white/10">{v}</button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
            <div className="text-xs font-medium text-white/50 mb-3">Biblioteca de Vozes</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "Maria", lang: "PT-BR", gender: "Feminino" },
                { name: "João", lang: "PT-BR", gender: "Masculino" },
                { name: "Sophie", lang: "EN-US", gender: "Feminino" },
                { name: "James", lang: "EN-US", gender: "Masculino" },
              ].map((v) => (
                <div key={v.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <div>
                    <div className="text-xs text-white/60">{v.name}</div>
                    <div className="text-[10px] text-white/30">{v.lang} • {v.gender}</div>
                  </div>
                  <button className="text-[10px] text-white/30 hover:text-white/60">▶</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function TranscriptionAI() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Transcrição AI">
        <Btn primary>Upload Arquivo</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] border-dashed p-8 text-center">
            <svg className="w-8 h-8 mx-auto text-white/20 mb-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
            </svg>
            <p className="text-xs text-white/30">Arraste arquivos de áudio ou vídeo aqui</p>
            <p className="text-[10px] text-white/20 mt-1">MP3, WAV, MP4, MOV • Máx 100MB</p>
          </div>
          <div className="mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
            <div className="text-[10px] text-white/20 uppercase tracking-wider mb-2">Transcrições Recentes</div>
            {[
              { name: "entrevista.mp3", dur: "12:30", date: "Hoje" },
              { name: "podcast.mp4", dur: "45:00", date: "Ontem" },
            ].map((t) => (
              <div key={t.name} className="flex items-center justify-between py-2 border-b border-white/[0.03] text-xs">
                <span className="text-white/60">{t.name}</span>
                <span className="text-white/30">{t.dur} • {t.date}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function CodeGenerator() {
  const [file, setFile] = useState("App.js");
  const files = ["App.js", "api.py", "styles.css", "index.html", "database.sql"];
  const code = `import React, { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Hello BRANPY</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Gerador de Código">
        <Btn primary>Executar</Btn>
        <Btn>Deploy</Btn>
        <Btn>Git Push</Btn>
      </TopBar>
      <div className="flex-1 flex min-h-0">
        <div className="w-44 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Arquivos</div>
          {files.map((f) => (
            <button key={f} onClick={() => setFile(f)} className={`w-full text-left px-2 py-1.5 rounded-md text-xs mb-0.5 ${file === f ? "bg-white/10 text-white/70" : "text-white/40 hover:bg-white/5"}`}>
              {f}
            </button>
          ))}
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mt-5 mb-2">AI Assistente</div>
          <textarea className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-2 text-[10px] text-white/50 outline-none focus:border-white/20 resize-none h-20" placeholder="Peça para gerar código..." />
          <button className="mt-2 w-full text-[10px] py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Gerar</button>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#0c0c0c] border-b border-white/[0.06] text-[10px] text-white/30">
            <span className="text-white/50">{file}</span>
            <span className="ml-auto">JavaScript</span>
          </div>
          <div className="flex-1 bg-[#080808] p-3 overflow-auto">
            <pre className="text-xs text-white/40 font-mono leading-relaxed">{code}</pre>
          </div>
          <div className="h-28 bg-[#0c0c0c] border-t border-white/[0.06] p-3">
            <div className="flex items-center gap-2 text-[10px] text-white/20 mb-1">
              <span className="text-emerald-400">$</span> terminal
            </div>
            <div className="text-[10px] text-white/20 font-mono">npm start</div>
            <div className="text-[10px] text-white/20 font-mono mt-1">&gt; server running on port 3000</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentsAI() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Documentos AI">
        <Btn primary>Novo Documento</Btn>
        <Btn>Upload</Btn>
      </TopBar>
      <div className="flex-1 flex min-h-0">
        <div className="w-48 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Documentos</div>
          {["Plano de Marketing", "Roteiro Vídeo", "Briefing", "Contrato", "Pauta Reunião"].map((d) => (
            <div key={d} className="px-2 py-1.5 rounded-md text-xs text-white/40 hover:bg-white/5 cursor-pointer mb-0.5">{d}</div>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-6 py-3 border-b border-white/[0.06]">
            <input className="w-full bg-transparent text-sm text-white/70 outline-none" defaultValue="Sem título" />
          </div>
          <div className="flex-1 p-6">
            <div className="max-w-2xl mx-auto space-y-3 text-sm text-white/40 leading-relaxed">
              <p>Documento em branco. Comece a escrever ou use a IA para gerar conteúdo...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MediaBank() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Banco de Mídia">
        <Btn primary>Upload</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] cursor-pointer transition-all flex items-center justify-center">
              <span className="text-xl text-white/10">{["🎬","🖼️","🎵","📄"][i % 4]}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function MusicHub() {
  const tracks = [
    { name: "Summer Vibes", dur: "2:45", bpm: "120", mood: "Energético" },
    { name: "Lo-Fi Study", dur: "3:30", bpm: "85", mood: "Relaxante" },
    { name: "Upbeat Corporate", dur: "2:15", bpm: "130", mood: "Profissional" },
    { name: "Cinematic Drone", dur: "4:00", bpm: "60", mood: "Épico" },
    { name: "Acoustic Folk", dur: "3:10", bpm: "100", mood: "Natural" },
    { name: "Electronic Groove", dur: "2:55", bpm: "128", mood: "Moderno" },
  ];
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Músicas & Sons">
        <Btn primary>Upload</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
              <span>Faixa</span><span>Duração</span><span>BPM</span><span>Estilo</span>
            </div>
            {tracks.map((t) => (
              <div key={t.name} className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/[0.03] text-xs text-white/50 hover:bg-white/[0.02] group items-center">
                <div className="flex items-center gap-2"><button className="text-white/20 group-hover:text-emerald-400">▶</button><span className="text-white/70">{t.name}</span></div>
                <span>{t.dur}</span><span>{t.bpm}</span><span>{t.mood}</span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function AIAvatars() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="AI Avatares">
        <Btn primary>Criar Avatar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {[
            { name: "Avatar Realista", style: "Foto realista", preview: "🧑‍💼" },
            { name: "Avatar Animado", style: "Estilo cartoon", preview: "😊" },
            { name: "Avatar 3D", style: "Modelo 3D", preview: "🧑‍🎤" },
            { name: "Apresentador", style: "Notícias/Talk show", preview: "🎙️" },
            { name: "Influencer", style: "Estilo gamer", preview: "🎮" },
            { name: "Profissional", style: "Corporativo", preview: "👔" },
          ].map((a) => (
            <div key={a.name} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 text-center hover:bg-white/[0.04] transition-all">
              <div className="text-4xl mb-3">{a.preview}</div>
              <div className="text-sm text-white/70">{a.name}</div>
              <div className="text-[10px] text-white/30 mt-1">{a.style}</div>
              <button className="mt-3 text-[10px] px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Personalizar</button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function Projects() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Projetos">
        <Btn primary>Novo Projeto</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
          {[
            { name: "Campanha TikTok", tasks: 12, done: 8, color: "bg-blue-500/20 border-blue-500/30" },
            { name: "Review Produtos", tasks: 8, done: 3, color: "bg-purple-500/20 border-purple-500/30" },
            { name: "Site Afiliados", tasks: 24, done: 15, color: "bg-emerald-500/20 border-emerald-500/30" },
          ].map((p) => (
            <div key={p.name} className={`rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 ${p.color} hover:bg-white/[0.04] transition-all`}>
              <div className="text-sm font-medium text-white/70">{p.name}</div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${(p.done / p.tasks) * 100}%` }} />
                </div>
                <span className="text-[10px] text-white/30">{p.done}/{p.tasks}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function IntegrationsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Integrações">
        <Btn primary>+ Adicionar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {[
            { name: "OpenAI", icon: "🤖", status: "Conectado", color: "text-emerald-400" },
            { name: "TikTok", icon: "🎵", status: "Conectado", color: "text-emerald-400" },
            { name: "Instagram", icon: "📸", status: "Conectar", color: "text-white/30" },
            { name: "Shopee", icon: "🛒", status: "Conectado", color: "text-emerald-400" },
            { name: "Amazon", icon: "📦", status: "Conectar", color: "text-white/30" },
            { name: "Railway", icon: "🚂", status: "Conectar", color: "text-white/30" },
            { name: "YouTube", icon: "▶️", status: "Conectar", color: "text-white/30" },
            { name: "Mercado Livre", icon: "📋", status: "Conectar", color: "text-white/30" },
            { name: "Vercel", icon: "▲", status: "Conectar", color: "text-white/30" },
          ].map((i) => (
            <div key={i.name} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{i.icon}</span>
                <span className="text-sm text-white/70">{i.name}</span>
              </div>
              <span className={`text-[10px] ${i.color}`}>{i.status}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function PlansPage() {
  const [billing, setBilling] = useState("monthly");
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Planos & Assinatura">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
          <button onClick={() => setBilling("monthly")} className={`px-3 py-1 text-[10px] rounded-md transition-all ${billing === "monthly" ? "bg-white/10 text-white/70" : "text-white/30"}`}>Mensal</button>
          <button onClick={() => setBilling("yearly")} className={`px-3 py-1 text-[10px] rounded-md transition-all ${billing === "yearly" ? "bg-white/10 text-white/70" : "text-white/30"}`}>Anual</button>
        </div>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          {[
            { name: "Free", price: "R$ 0", desc: "Teste a plataforma", features: ["50 créditos/mês", "Chat IA básico", "Importar produtos", "1 projeto"], popular: false },
            { name: "Pro", price: billing === "monthly" ? "R$ 49" : "R$ 39", desc: "Para profissionais", features: ["500 créditos/mês", "Chat IA completo", "Video Studio", "Automações", "10 projetos", "Suporte prioritário"], popular: true },
            { name: "Enterprise", price: billing === "monthly" ? "R$ 199" : "R$ 159", desc: "Para equipes", features: ["Créditos ilimitados", "Tudo do Pro", "Equipe até 10", "API dedicada", "Projetos ilimitados", "Onboarding personalizado"], popular: false },
          ].map((plan) => (
            <div key={plan.name} className={`rounded-xl bg-white/[0.02] border p-5 relative ${plan.popular ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-white/[0.06]"}`}>
              {plan.popular && <div className="absolute -top-2.5 left-5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Mais popular</div>}
              <div className="text-sm font-medium text-white/60">{plan.name}</div>
              <div className="text-2xl font-semibold text-white mt-2">{plan.price}<span className="text-xs text-white/20 font-normal">/mês</span></div>
              <div className="text-[10px] text-white/30 mt-1">{plan.desc}</div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-white/40 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500/50" />{f}
                  </li>
                ))}
              </ul>
              <button className={`mt-5 w-full text-xs py-2 rounded-lg transition-all ${plan.popular ? "bg-emerald-500/80 text-white hover:bg-emerald-500" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
                {plan.name === "Free" ? "Começar Grátis" : "Assinar"}
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function TeamPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Equipe">
        <Btn primary>Convidar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
          <div className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
            <span className="col-span-2">Membro</span><span>Função</span><span>Status</span>
          </div>
          {[
            { name: "Você", email: "admin@brane.app", role: "Owner", status: "Online" },
            { name: "Ana Silva", email: "ana@brane.app", role: "Editor", status: "Ausente" },
            { name: "Carlos Mendes", email: "carlos@brane.app", role: "Viewer", status: "Offline" },
          ].map((m) => (
            <div key={m.name} className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-white/[0.03] text-xs text-white/50 hover:bg-white/[0.02] items-center">
              <div className="col-span-2 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">{m.name[0]}</div>
                <div><div className="text-white/70">{m.name}</div><div className="text-[10px] text-white/30">{m.email}</div></div>
              </div>
              <span className="text-white/40">{m.role}</span>
              <span className={`text-[10px] ${m.status === "Online" ? "text-emerald-400" : m.status === "Ausente" ? "text-amber-400" : "text-white/30"}`}>{m.status}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Configurações" />
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {[
            { section: "Perfil", fields: [{ label: "Nome", value: "Admin" }, { label: "Email", value: "admin@brane.app" }] },
            { section: "Notificações", fields: [{ label: "Email", value: "Ativado" }, { label: "Push", value: "Desativado" }] },
            { section: "API Keys", fields: [{ label: "OpenAI Key", value: "••••••••" }, { label: "TikTok Key", value: "••••••••" }] },
            { section: "Segurança", fields: [{ label: "2FA", value: "Desativado" }, { label: "Sessões", value: "1 ativa" }] },
          ].map((s) => (
            <div key={s.section} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">{s.section}</div>
              {s.fields.map((f) => (
                <div key={f.label} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <span className="text-xs text-white/50">{f.label}</span>
                  <span className="text-xs text-white/30">{f.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SupportPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Suporte">
        <Btn primary>Novo Ticket</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 mb-6">
          {[
            { icon: "📖", title: "Base de Conhecimento", desc: "Guias, tutoriais e documentação" },
            { icon: "🎥", title: "Video Tutoriais", desc: "Aprenda visualmente" },
            { icon: "💬", title: "Chat Ao Vivo", desc: "Segunda a Sexta, 9h-18h" },
            { icon: "📧", title: "Email", desc: "Resposta em até 24h" },
          ].map((c) => (
            <div key={c.title} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-all cursor-pointer">
              <div className="text-lg mb-2">{c.icon}</div>
              <div className="text-sm text-white/70">{c.title}</div>
              <div className="text-[10px] text-white/30 mt-1">{c.desc}</div>
            </div>
          ))}
        </div>
        <div className="max-w-3xl mx-auto rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Tickets Recentes</div>
          {[
            { subject: "Problema ao importar produto", status: "Aberto", date: "Hoje" },
            { subject: "Dúvida sobre plano Pro", status: "Respondido", date: "Ontem" },
            { subject: "Sugestão de nova feature", status: "Fechado", date: "3 dias" },
          ].map((t) => (
            <div key={t.subject} className="flex items-center justify-between py-2 border-b border-white/[0.03] text-xs">
              <span className="text-white/60">{t.subject}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${t.status === "Aberto" ? "text-amber-400" : t.status === "Respondido" ? "text-emerald-400" : "text-white/30"}`}>{t.status}</span>
                <span className="text-white/20">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

