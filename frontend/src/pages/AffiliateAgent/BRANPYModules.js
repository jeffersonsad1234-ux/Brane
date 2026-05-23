import React, { useState, useRef, useEffect } from "react";
import { useLocalStorage, useArray } from "../../hooks/useLocalStorage";

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

import VideoStudioEditor from "./VideoStudioEditor";

export function VideoStudio() {
  return <VideoStudioEditor />;
}

export function ImageStudio() {
  const [tool, setTool] = useState("select");
  const [layers, setLayers] = useLocalStorage("branpy_image_layers", [
    { id: 1, name: "Fundo", visible: true },
    { id: 2, name: "Texto 1", visible: true },
    { id: 3, name: "Imagem 1", visible: true },
    { id: 4, name: "Logo", visible: true },
  ]);
  const [currentColor, setCurrentColor] = useLocalStorage("branpy_image_color", "#3b82f6");
  const [selectedLayer, setSelectedLayer] = useState(2);
  const nextId = useRef(5);
  const tools = [
    { id: "select", label: "Selecionar", icon: "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" },
    { id: "text", label: "Texto", icon: "M5 4v3h5.5v12h3V7H19V4z" },
    { id: "image", label: "Imagem", icon: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" },
    { id: "bg", label: "Remover Fundo", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
    { id: "crop", label: "Cortar", icon: "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" },
    { id: "layers", label: "Camadas", icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" },
  ];

  const handleUpload = () => {
    const id = nextId.current++;
    setLayers((prev) => [...prev, { id, name: `Imagem ${id - 4}`, visible: true }]);
    setSelectedLayer(layers.length);
  };

  const removeLayer = (i) => {
    setLayers((prev) => prev.filter((_, idx) => idx !== i));
    if (selectedLayer > i || selectedLayer === layers.length - 1) setSelectedLayer(Math.max(0, selectedLayer - 1));
  };

  const moveLayer = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= layers.length) return;
    setLayers((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSelectedLayer(j);
  };

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
        <div className="flex-1 flex items-center justify-center bg-[#080808] m-0 relative">
          <div className="absolute top-3 left-3 text-[10px] text-white/15 bg-black/40 px-2 py-1 rounded">
            Ferramenta: <span className="text-emerald-400">{tools.find((t) => t.id === tool)?.label}</span>
          </div>
          <div className="w-[600px] h-[400px] bg-white/[0.02] rounded-lg border border-white/[0.06] border-dashed flex items-center justify-center">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto text-white/20 mb-3" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              <p className="text-xs text-white/20">Arraste imagens ou clique para adicionar</p>
              <button onClick={handleUpload} className="mt-3 px-4 py-1.5 text-xs rounded-lg bg-white/10 text-white/60 hover:bg-white/15">Upload</button>
            </div>
          </div>
        </div>
        <div className="w-56 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider">Camadas</span>
            <button onClick={handleUpload} className="text-[10px] text-white/30 hover:text-white/60 w-4 h-4 flex items-center justify-center rounded hover:bg-white/10">+</button>
          </div>
          {layers.map((l, i) => (
            <div key={l.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs mb-0.5 group ${i === selectedLayer ? "bg-white/10 text-white/70" : "text-white/40 hover:bg-white/5"}`}>
              <span className="text-white/20 w-3">{i + 1}</span>
              <span className="flex-1 cursor-pointer" onClick={() => setSelectedLayer(i)}>{l.name}</span>
              <button onClick={() => moveLayer(i, -1)} className="opacity-0 group-hover:opacity-100 text-[10px] text-white/30 hover:text-white/60">↑</button>
              <button onClick={() => moveLayer(i, 1)} className="opacity-0 group-hover:opacity-100 text-[10px] text-white/30 hover:text-white/60">↓</button>
              <button onClick={() => removeLayer(i)} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400/50 hover:text-red-400">×</button>
            </div>
          ))}
          {layers.length === 0 && <div className="text-[10px] text-white/20 text-center py-4">Nenhuma camada</div>}
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mt-5 mb-3">Cores</div>
          <div className="flex gap-1.5 flex-wrap">
            {["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#ffffff","#000000","#6b7280"].map((c) => (
              <div
                key={c}
                onClick={() => setCurrentColor(c)}
                className={`w-6 h-6 rounded-md cursor-pointer border transition-all ${currentColor === c ? "border-white/60 scale-110" : "border-white/10"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-white/30">Atual:</span>
            <span className="text-[10px] text-white/50">{currentColor}</span>
            <div className="w-4 h-4 rounded border border-white/10" style={{ backgroundColor: currentColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteBuilder() {
  const [mode, setMode] = useState("desktop");
  const [siteData, setSiteData] = useLocalStorage("branpy_sitebuilder", {
    pages: [
      { id: "home", label: "Home", sections: ["Header", "Hero", "Grid", "Footer"] },
      { id: "about", label: "Sobre", sections: ["Header", "Footer"] },
      { id: "products", label: "Produtos", sections: ["Header", "Grid", "Cards", "Footer"] },
      { id: "contact", label: "Contato", sections: ["Header", "Footer"] },
    ],
    properties: {},
  });
  const [page, setPage] = useState("home");
  const [props, setProps] = useLocalStorage("branpy_sitebuilder_props", {
    Largura: "auto", Altura: "auto", Padding: "16px", Margem: "0", "Cor Fundo": "#transparent", "Border Radius": "8px",
  });
  const [newPageName, setNewPageName] = useState("");
  const [addingPage, setAddingPage] = useState(false);
  const availableComponents = ["Header", "Hero", "Grid", "Cards", "Footer"];

  const currentPage = siteData.pages.find((p) => p.id === page) || siteData.pages[0];

  const addPage = () => {
    if (!newPageName.trim()) return;
    const id = newPageName.toLowerCase().replace(/\s+/g, "_");
    setSiteData((prev) => ({ ...prev, pages: [...prev.pages, { id, label: newPageName, sections: [] }] }));
    setPage(id);
    setNewPageName("");
    setAddingPage(false);
  };

  const deletePage = (id) => {
    if (siteData.pages.length <= 1) return;
    setSiteData((prev) => ({ ...prev, pages: prev.pages.filter((p) => p.id !== id) }));
    if (page === id) setPage(siteData.pages.find((p) => p.id !== id)?.id || siteData.pages[0].id);
  };

  const addSection = (comp) => {
    if (currentPage.sections.includes(comp)) return;
    setSiteData((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => p.id === page ? { ...p, sections: [...p.sections, comp] } : p),
    }));
  };

  const removeSection = (comp) => {
    setSiteData((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => p.id === page ? { ...p, sections: p.sections.filter((s) => s !== comp) } : p),
    }));
  };

  const updateProp = (key, value) => {
    setProps((prev) => ({ ...prev, [key]: value }));
  };

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
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider">Páginas</span>
            <button onClick={() => setAddingPage(true)} className="text-[10px] text-white/30 hover:text-white/60 w-4 h-4 flex items-center justify-center rounded hover:bg-white/10">+</button>
          </div>
          {siteData.pages.map((p) => (
            <div key={p.id} className="flex items-center group">
              <button onClick={() => setPage(p.id)} className={`flex-1 text-left px-2 py-1.5 rounded-md text-xs mb-0.5 ${page === p.id ? "bg-white/10 text-white/70" : "text-white/40 hover:bg-white/5"}`}>
                {p.label}
              </button>
              {siteData.pages.length > 1 && (
                <button onClick={() => deletePage(p.id)} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400/50 hover:text-red-400 px-1 py-1">×</button>
              )}
            </div>
          ))}
          {addingPage && (
            <div className="mb-2">
              <input autoFocus value={newPageName} onChange={(e) => setNewPageName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPage()} onBlur={() => { if (!newPageName) setAddingPage(false); }} className="w-full bg-white/[0.03] border border-white/10 rounded px-2 py-1 text-[10px] text-white/60 outline-none focus:border-white/20" placeholder="Nome da página" />
            </div>
          )}
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mt-5 mb-3">Componentes</div>
          {availableComponents.map((c) => (
            <div key={c} onClick={() => addSection(c)} className="px-2 py-1.5 rounded-md text-xs text-white/40 hover:bg-white/5 cursor-pointer mb-0.5">{c}</div>
          ))}
        </div>
        <div className="flex-1 flex items-start justify-center bg-[#080808] overflow-auto p-6">
          {currentPage ? (
            <div className={`bg-white/[0.02] rounded-lg border border-white/[0.06] ${mode === "desktop" ? "w-full" : mode === "tablet" ? "w-[600px]" : "w-[320px]"}`}>
              <div className="h-10 bg-white/5 flex items-center px-4 rounded-t-lg border-b border-white/[0.06]">
                <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/50" /><div className="w-2 h-2 rounded-full bg-amber-500/50" /><div className="w-2 h-2 rounded-full bg-emerald-500/50" /></div>
                <div className="mx-auto text-[10px] text-white/20">{currentPage.label} — brane.app</div>
              </div>
              <div className="p-6 space-y-4 min-h-[200px]">
                {currentPage.sections.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-white/20">Adicione componentes a esta página</div>
                ) : (
                  currentPage.sections.map((s) => (
                    <div key={s} className="group relative bg-white/[0.03] rounded-lg border border-white/[0.06] p-4 hover:border-white/10 transition-all">
                      <div className="text-xs text-white/40">{s}</div>
                      <button onClick={() => removeSection(s)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] text-red-400/50 hover:text-red-400">×</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xs text-white/20">Nenhuma página. Crie uma página para começar.</p>
            </div>
          )}
        </div>
        <div className="w-52 flex-shrink-0 border-l border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Propriedades</div>
          <div className="space-y-2.5 text-[10px]">
            {["Largura", "Altura", "Padding", "Margem", "Cor Fundo", "Border Radius"].map((p) => (
              <div key={p} className="flex items-center justify-between">
                <span className="text-white/30">{p}</span>
                <input className="w-14 bg-white/5 border border-white/10 rounded text-white/50 px-1.5 py-0.5 text-right outline-none focus:border-white/20" value={props[p]} onChange={(e) => updateProp(p, e.target.value)} />
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
  const [selected, setSelected] = useLocalStorage("brandstudio_selected", null);
  const [recentTemplates, setRecentTemplates] = useLocalStorage("brandstudio_recent", []);
  const [loading, setLoading] = useState(null);

  const handleSelect = (idx) => {
    setLoading(idx);
    setSelected(idx);
    const t = templates[idx];
    setRecentTemplates((prev) => {
      const filtered = prev.filter((n) => n !== t.name);
      return [t.name, ...filtered].slice(0, 5);
    });
    setTimeout(() => setLoading(null), 1200);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Brand Studio">
        <Btn primary>Criar Design</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {templates.map((t, i) => (
              <button
                key={t.name}
                onClick={() => handleSelect(i)}
                disabled={loading !== null}
                className={`group rounded-xl bg-white/[0.02] border p-5 text-left transition-all ${
                  selected === i
                    ? "border-emerald-500/40 ring-1 ring-emerald-500/20 bg-emerald-500/[0.03]"
                    : "border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10"
                }`}
              >
                <div className="text-2xl mb-3">{t.icon}</div>
                <div className="text-sm font-medium text-white/70 group-hover:text-white/90">{t.name}</div>
                <div className="text-[10px] text-white/30 mt-1">{t.size}</div>
                {loading === i && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Carregando...
                  </div>
                )}
                {selected === i && loading !== i && (
                  <div className="mt-2 text-[10px] text-emerald-400">Selecionado</div>
                )}
              </button>
            ))}
          </div>
          {recentTemplates.length > 0 && (
            <div className="mt-6 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-2">Usados Recentemente</div>
              <div className="flex flex-wrap gap-2">
                {recentTemplates.map((name, i) => (
                  <span key={i} className="px-2 py-1 text-[10px] rounded bg-white/5 text-white/40">{name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SocialPublisher() {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const [weekOffset, setWeekOffset] = useState(0);
  const [posts, setPosts] = useLocalStorage("branpy_social_posts", [
    { id: 1, day: 0, time: "09:00", platform: "TikTok", content: "Review produto #1", status: "agendado" },
    { id: 2, day: 1, time: "14:00", platform: "Instagram", content: "Unboxing", status: "rascunho" },
    { id: 3, day: 3, time: "10:30", platform: "YouTube", content: "Tutorial completo", status: "agendado" },
    { id: 4, day: 5, time: "18:00", platform: "TikTok", content: "Dica rápida", status: "publicado" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [hoveredPost, setHoveredPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState({ day: 0, time: "12:00", platform: "TikTok", content: "", status: "rascunho" });
  const nextPostId = useRef(5);

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

  const metrics = {
    agendado: posts.filter((p) => p.status === "agendado").length,
    publicado: posts.filter((p) => p.status === "publicado").length,
    rascunho: posts.filter((p) => p.status === "rascunho").length,
  };

  const openNewPost = (day) => {
    setForm({ day: day ?? 0, time: "12:00", platform: "TikTok", content: "", status: "rascunho" });
    setEditingPost(null);
    setShowForm(true);
  };

  const openEditPost = (post) => {
    setForm({ day: post.day, time: post.time, platform: post.platform, content: post.content, status: post.status });
    setEditingPost(post.id);
    setShowForm(true);
  };

  const handleSavePost = () => {
    if (!form.content.trim()) return;
    if (editingPost) {
      setPosts((prev) => prev.map((p) => p.id === editingPost ? { ...p, ...form } : p));
    } else {
      setPosts((prev) => [...prev, { id: nextPostId.current++, ...form }]);
    }
    setShowForm(false);
    setEditingPost(null);
  };

  const handleDeletePost = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Social Publisher">
        <Btn primary onClick={() => openNewPost()}>Novo Post</Btn>
        <Btn onClick={() => setWeekOffset(weekOffset - 1)}>←</Btn>
        <Btn onClick={() => setWeekOffset(0)}>Hoje</Btn>
        <Btn onClick={() => setWeekOffset(weekOffset + 1)}>→</Btn>
      </TopBar>
      <ScrollArea className="p-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Agendados", value: metrics.agendado, color: "text-blue-400" },
              { label: "Publicados", value: metrics.publicado, color: "text-emerald-400" },
              { label: "Rascunhos", value: metrics.rascunho, color: "text-amber-400" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 flex items-center justify-between">
                <span className="text-[10px] text-white/30">{m.label}</span>
                <span className={`text-sm font-semibold ${m.color}`}>{m.value}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, i) => (
              <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] min-h-[200px]">
                <div className="text-center py-2 border-b border-white/[0.06]">
                  <div className="text-[10px] text-white/30">{days[i]}</div>
                  <div className="text-sm font-medium text-white/60">{date.getDate()}</div>
                </div>
                <div className="p-1.5 space-y-1">
                  {posts.filter(p => p.day === i).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => openEditPost(p)}
                      onMouseEnter={() => setHoveredPost(p.id)}
                      onMouseLeave={() => setHoveredPost(null)}
                      className={`group relative px-2 py-1.5 rounded-md text-[10px] cursor-pointer ${
                        p.status === "publicado" ? "bg-emerald-500/10 border border-emerald-500/20" :
                        p.status === "agendado" ? "bg-blue-500/10 border border-blue-500/20" :
                        "bg-white/5 border border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">{p.time}</span>
                        <span className="text-white/30">{p.platform}</span>
                      </div>
                      <div className="text-white/60 mt-0.5 truncate">{p.content}</div>
                      {hoveredPost === p.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePost(p.id); }}
                          className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500/30 text-red-400 text-[8px] hover:bg-red-500/50"
                        >×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => openNewPost(i)} className="w-full py-1 text-[10px] text-white/20 hover:text-white/40 border border-dashed border-white/10 rounded">+</button>
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
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-xs font-medium text-white/50 mb-4">{editingPost ? "Editar Post" : "Novo Post"}</div>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-white/30">Plataforma</span>
                <select value={form.platform} onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20 mt-1">
                  {["TikTok", "Instagram", "YouTube", "Facebook", "Kwai"].map((pl) => (
                    <option key={pl} value={pl}>{pl}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-[10px] text-white/30">Conteúdo</span>
                <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20 mt-1 resize-none h-20" placeholder="Texto do post..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-white/30">Dia</span>
                  <select value={form.day} onChange={(e) => setForm((p) => ({ ...p, day: Number(e.target.value) }))} className="w-full bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20 mt-1">
                    {days.map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-white/30">Horário</span>
                  <input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20 mt-1" />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-white/30">Status</span>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20 mt-1">
                  <option value="rascunho">Rascunho</option>
                  <option value="agendado">Agendado</option>
                  <option value="publicado">Publicado</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSavePost} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">{editingPost ? "Salvar" : "Criar Post"}</button>
              <button onClick={() => { setShowForm(false); setEditingPost(null); }} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AutomationHub() {
  const [nodes, setNodes] = useLocalStorage("branpy_automation_nodes", [
    { id: 1, type: "trigger", label: "Produto Importado", x: 60, y: 120, color: "bg-blue-500/20 border-blue-500/30" },
    { id: 2, type: "action", label: "Gerar Copy IA", x: 260, y: 120, color: "bg-purple-500/20 border-purple-500/30" },
    { id: 3, type: "action", label: "Gerar Vídeo", x: 460, y: 120, color: "bg-emerald-500/20 border-emerald-500/30" },
    { id: 4, type: "action", label: "Publicar TikTok", x: 660, y: 120, color: "bg-amber-500/20 border-amber-500/30" },
  ]);
  const [dragging, setDragging] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const canvasRef = useRef(null);
  const nextNodeId = useRef(5);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (node, e) => {
    setDragging(node.id);
    const rect = e.target.closest("[data-node-id]").getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setNodes((prev) => prev.map((n) =>
      n.id === dragging
        ? { ...n, x: Math.max(0, e.clientX - rect.left - dragOffset.current.x), y: Math.max(0, e.clientY - rect.top - dragOffset.current.y) }
        : n
    ));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const addNode = (label, type) => {
    const colors = {
      trigger: "bg-blue-500/20 border-blue-500/30",
      action: "bg-purple-500/20 border-purple-500/30",
    };
    setNodes((prev) => [...prev, {
      id: nextNodeId.current++,
      type,
      label,
      x: 60 + (prev.length % 3) * 200,
      y: 200 + Math.floor(prev.length / 3) * 100,
      color: colors[type],
    }]);
  };

  const deleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  };

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
            <div key={t} onClick={() => addNode(t, "trigger")} className="px-2 py-1.5 rounded-md text-xs text-white/40 hover:bg-white/5 cursor-pointer mb-0.5">{t}</div>
          ))}
          <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mt-5 mb-3">Ações</div>
          {["Gerar copy", "Gerar vídeo", "Publicar rede", "Enviar email", "Webhook", "Salvar dado"].map((a) => (
            <div key={a} onClick={() => addNode(a, "action")} className="px-2 py-1.5 rounded-md text-xs text-white/40 hover:bg-white/5 cursor-pointer mb-0.5">{a}</div>
          ))}
        </div>
        <div
          ref={canvasRef}
          className="flex-1 relative bg-[#080808] overflow-auto select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15, pointerEvents: "none" }}>
            <defs>
              <pattern id="grid2" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
          {nodes.map((node) => (
            <div
              key={node.id}
              data-node-id={node.id}
              onMouseDown={(e) => handleMouseDown(node, e)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`absolute px-3 py-2 rounded-xl border ${node.color} bg-[#0c0c0c]/90 backdrop-blur-sm cursor-move transition-shadow ${dragging === node.id ? "shadow-lg shadow-white/5 z-10" : ""}`}
              style={{ left: node.x, top: node.y }}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${node.color.split(" ")[0]}`} />
                <span className="text-xs text-white/60">{node.label}</span>
                {hoveredNode === node.id && (
                  <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="text-[10px] text-red-400/50 hover:text-red-400 ml-1">×</button>
                )}
              </div>
            </div>
          ))}
          {nodes.slice(0, -1).map((node, i) => (
            <svg key={`conn-${i}`} className="absolute" style={{ left: node.x + 120, top: node.y + 18, pointerEvents: "none" }} width="80" height="2">
              <line x1="0" y1="1" x2="80" y2="1" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="4,3" />
              <polygon points="78,1 70,-3 70,5" fill="rgba(255,255,255,0.15)" />
            </svg>
          ))}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xs text-white/20 mb-2">Nenhum nó no canvas</p>
                <p className="text-[10px] text-white/15">Clique em um gatilho ou ação para adicionar</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 text-[10px] text-white/20">Canvas livre — arraste os blocos para criar seu fluxo</div>
        </div>
      </div>
    </div>
  );
}

export function AgentMarketplace() {
  const agentDefaults = [
    { name: "Agente Afiliado", desc: "Importa produtos, gera anúncios e publica automaticamente", icon: "📊", color: "emerald" },
    { name: "Agente Social", desc: "Cria e agenda conteúdo para todas as redes sociais", icon: "📱", color: "blue" },
    { name: "Agente Vendas", desc: "Automatiza prospecção, follow-up e fechamento", icon: "💰", color: "purple" },
    { name: "Agente Vídeo", desc: "Produz vídeos com IA, edição e legendas automáticas", icon: "🎬", color: "amber" },
    { name: "Agente Conteúdo", desc: "Gera artigos, posts, newsletters e copywriting", icon: "✍️", color: "rose" },
    { name: "Agente Suporte", desc: "Chatbot inteligente para atendimento ao cliente", icon: "🤖", color: "cyan" },
  ];
  const [activeAgents, setActiveAgents] = useLocalStorage("branpy_agents_active", ["Agente Afiliado"]);

  const toggleAgent = (name) => {
    setActiveAgents((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Agent Marketplace">
        <Btn primary>Criar Agente</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
          {agentDefaults.map((a) => {
            const active = activeAgents.includes(a.name);
            return (
              <div key={a.name} className={`rounded-xl bg-white/[0.02] border p-5 hover:bg-white/[0.04] transition-all ${active ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-white/[0.06]"}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl">{a.icon}</span>
                  {active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Ativo</span>}
                </div>
                <div className="text-sm font-medium text-white/70">{a.name}</div>
                <div className="text-xs text-white/40 mt-1 leading-relaxed">{a.desc}</div>
                <button
                  onClick={() => toggleAgent(a.name)}
                  className={`mt-4 w-full text-xs py-1.5 rounded-lg transition-all ${active ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-white/5 text-white/40 hover:bg-white/10"}`}
                >
                  {active ? "Gerenciar" : "Ativar"}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function LeadsCRM() {
  const [stages, setStages] = useLocalStorage("branpy_crm_stages", [
    { name: "Novo Lead", color: "bg-blue-500/20 border-blue-500/30", leads: [{ name: "João Silva", value: "R$ 2.500" }, { name: "Maria Santos", value: "R$ 1.800" }, { name: "Carlos Lima", value: "R$ 5.000" }] },
    { name: "Contatado", color: "bg-amber-500/20 border-amber-500/30", leads: [{ name: "Ana Costa", value: "R$ 3.200" }, { name: "Pedro Alves", value: "R$ 1.500" }] },
    { name: "Proposta", color: "bg-purple-500/20 border-purple-500/30", leads: [{ name: "Lucia Pereira", value: "R$ 8.000" }] },
    { name: "Fechado", color: "bg-emerald-500/20 border-emerald-500/30", leads: [{ name: "Roberto Oliveira", value: "R$ 12.000" }] },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadValue, setNewLeadValue] = useState("");

  const handleAddLead = () => {
    if (!newLeadName.trim()) return;
    const formattedValue = newLeadValue ? `R$ ${newLeadValue}` : "R$ 0";
    setStages((prev) => prev.map((s, i) =>
      i === 0 ? { ...s, leads: [...s.leads, { name: newLeadName, value: formattedValue }] } : s
    ));
    setNewLeadName("");
    setNewLeadValue("");
    setShowForm(false);
  };

  const advanceLead = (stageIdx, leadIdx) => {
    if (stageIdx >= stages.length - 1) return;
    const lead = stages[stageIdx].leads[leadIdx];
    setStages((prev) => prev.map((s, i) => {
      if (i === stageIdx) return { ...s, leads: s.leads.filter((_, j) => j !== leadIdx) };
      if (i === stageIdx + 1) return { ...s, leads: [...s.leads, lead] };
      return s;
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Leads & CRM">
        <Btn primary onClick={() => setShowForm(true)}>Novo Lead</Btn>
      </TopBar>
      <ScrollArea className="p-5">
        <div className="flex gap-4 h-full" style={{ minHeight: 400 }}>
          {stages.map((s, si) => (
            <div key={s.name} className="flex-1 min-w-[200px] rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-white/50">{s.name}</span>
                <span className="text-[10px] text-white/30">{s.leads.length}</span>
              </div>
              <div className="space-y-2">
                {s.leads.map((l, li) => (
                  <div
                    key={l.name + li}
                    onClick={() => advanceLead(si, li)}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer hover:border-emerald-500/20 transition-all"
                  >
                    <div className="text-xs text-white/70">{l.name}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{l.value}</div>
                    {si < stages.length - 1 && (
                      <div className="text-[8px] text-white/20 mt-1 opacity-0 hover:opacity-100">Clique para avançar</div>
                    )}
                  </div>
                ))}
                {s.leads.length === 0 && (
                  <div className="text-[10px] text-white/20 text-center py-4">Nenhum lead</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="text-xs font-medium text-white/50 mb-4">Novo Lead</div>
            <div className="space-y-3">
              <input value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Nome do lead" />
              <input value={newLeadValue} onChange={(e) => setNewLeadValue(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Valor (ex: 2500)" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAddLead} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Adicionar</button>
              <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Ecommerce() {
  const [products, setProducts] = useLocalStorage("branpy_ecommerce_products", [
    { name: "Fone Bluetooth", price: "R$ 89,90", sales: 12, status: "Ativo" },
    { name: "Carregador USB-C", price: "R$ 39,90", sales: 8, status: "Ativo" },
    { name: "Capa Silicone", price: "R$ 29,90", sales: 5, status: "Pausado" },
  ]);
  const [tab, setTab] = useState("produtos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", sales: "0", status: "Ativo" });

  const stats = {
    produtos: products.length,
    pedidos: products.reduce((acc, p) => acc + p.sales, 0),
    faturamento: products.reduce((acc, p) => {
      const num = parseFloat(p.price.replace("R$ ", "").replace(",", "."));
      return acc + num * p.sales;
    }, 0),
    clientes: Math.max(products.length * 3, 5),
  };

  const handleAddProduct = () => {
    if (!form.name.trim() || !form.price.trim()) return;
    const price = form.price.startsWith("R$") ? form.price : `R$ ${form.price}`;
    setProducts((prev) => [...prev, { name: form.name, price, sales: Number(form.sales) || 0, status: form.status }]);
    setForm({ name: "", price: "", sales: "0", status: "Ativo" });
    setShowForm(false);
  };

  const pedidosMock = [
    { id: "#001", product: "Fone Bluetooth", qty: 2, total: "R$ 179,80", status: "Entregue" },
    { id: "#002", product: "Carregador USB-C", qty: 1, total: "R$ 39,90", status: "Enviado" },
    { id: "#003", product: "Capa Silicone", qty: 3, total: "R$ 89,70", status: "Processando" },
  ];

  const clientesMock = [
    { name: "Ana Oliveira", email: "ana@email.com", orders: 3, total: "R$ 459,50" },
    { name: "Bruno Costa", email: "bruno@email.com", orders: 1, total: "R$ 89,90" },
    { name: "Carla Souza", email: "carla@email.com", orders: 5, total: "R$ 1.230,00" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="E-commerce">
        <Btn primary onClick={() => setShowForm(true)}>Novo Produto</Btn>
        <Btn active={tab === "pedidos"} onClick={() => setTab("pedidos")}>Pedidos</Btn>
        <Btn active={tab === "clientes"} onClick={() => setTab("clientes")}>Clientes</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Produtos", value: String(stats.produtos), change: "Total cadastrados" },
              { label: "Pedidos", value: String(stats.pedidos), change: "Total realizados" },
              { label: "Faturamento", value: `R$ ${stats.faturamento.toFixed(2).replace(".", ",")}`, change: "Receita total" },
              { label: "Clientes", value: String(stats.clientes), change: "Base de clientes" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                <div className="text-[10px] text-white/30">{s.label}</div>
                <div className="text-lg font-semibold text-white/80 mt-1">{s.value}</div>
                <div className="text-[10px] text-emerald-400 mt-1">{s.change}</div>
              </div>
            ))}
          </div>
          {tab === "produtos" && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              <div className="grid grid-cols-5 gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
                <span className="col-span-2">Produto</span><span>Preço</span><span>Vendas</span><span>Status</span>
              </div>
              {products.length === 0 ? (
                <div className="text-center py-8 text-[10px] text-white/20">Nenhum produto. Clique em Novo Produto para adicionar.</div>
              ) : (
                products.map((p) => (
                  <div key={p.name} className="grid grid-cols-5 gap-3 px-4 py-3 border-b border-white/[0.03] text-xs text-white/50 hover:bg-white/[0.02]">
                    <span className="col-span-2 text-white/70">{p.name}</span><span>{p.price}</span><span>{p.sales}</span><span>{p.status}</span>
                  </div>
                ))
              )}
            </div>
          )}
          {tab === "pedidos" && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              <div className="grid grid-cols-5 gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
                <span>Pedido</span><span>Produto</span><span>Qtd</span><span>Total</span><span>Status</span>
              </div>
              {pedidosMock.map((p) => (
                <div key={p.id} className="grid grid-cols-5 gap-3 px-4 py-3 border-b border-white/[0.03] text-xs text-white/50 hover:bg-white/[0.02]">
                  <span className="text-white/70">{p.id}</span><span>{p.product}</span><span>{p.qty}</span><span>{p.total}</span><span>{p.status}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "clientes" && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              <div className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
                <span className="col-span-2">Cliente</span><span>Pedidos</span><span>Total</span>
              </div>
              {clientesMock.map((c) => (
                <div key={c.name} className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-white/[0.03] text-xs text-white/50 hover:bg-white/[0.02]">
                  <div className="col-span-2"><span className="text-white/70">{c.name}</span><span className="text-[10px] text-white/30 ml-2">{c.email}</span></div>
                  <span>{c.orders}</span><span>{c.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="text-xs font-medium text-white/50 mb-4">Novo Produto</div>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Nome do produto" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Preço" />
                <input type="number" value={form.sales} onChange={(e) => setForm((p) => ({ ...p, sales: e.target.value }))} className="bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Vendas" />
              </div>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20">
                <option value="Ativo">Ativo</option>
                <option value="Pausado">Pausado</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAddProduct} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Adicionar</button>
              <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AnalyticsAdvanced() {
  const [period, setPeriod] = useLocalStorage("branpy_analytics_period", "7d");
  const periods = ["7d", "30d", "90d"];

  const dataByPeriod = {
    "7d": {
      metrics: [
        { label: "Receita Total", value: "R$ 24.580", change: "+18.5%", up: true },
        { label: "Visualizações", value: "45.230", change: "+12.3%", up: true },
        { label: "CTR Médio", value: "4.8%", change: "-0.6%", up: false },
        { label: "Conversões", value: "342", change: "+22.1%", up: true },
      ],
      chart: [40, 55, 45, 70, 60, 80, 65],
      platforms: [
        { name: "TikTok", value: 45, color: "bg-blue-500/30" },
        { name: "Instagram", value: 30, color: "bg-purple-500/30" },
        { name: "YouTube", value: 15, color: "bg-red-500/30" },
        { name: "Kwai", value: 10, color: "bg-amber-500/30" },
      ],
      chartLabel: "últimos 7 dias",
      chartDays: ["D1","D2","D3","D4","D5","D6","D7"],
      topProducts: [
        { name: "Fone Bluetooth", value: "R$ 4.230", rank: 1 },
        { name: "Carregador USB", value: "R$ 3.120", rank: 2 },
        { name: "Capa Silicone", value: "R$ 2.890", rank: 3 },
      ],
    },
    "30d": {
      metrics: [
        { label: "Receita Total", value: "R$ 98.450", change: "+24.2%", up: true },
        { label: "Visualizações", value: "182.500", change: "+18.7%", up: true },
        { label: "CTR Médio", value: "5.2%", change: "+0.4%", up: true },
        { label: "Conversões", value: "1.423", change: "+31.5%", up: true },
      ],
      chart: [50, 65, 55, 80, 75, 90, 85, 70, 60, 95, 88, 72, 68, 82, 78, 92, 85, 76, 69, 88, 95, 80, 74, 90, 86, 78, 92, 84, 76, 70],
      platforms: [
        { name: "TikTok", value: 38, color: "bg-blue-500/30" },
        { name: "Instagram", value: 32, color: "bg-purple-500/30" },
        { name: "YouTube", value: 20, color: "bg-red-500/30" },
        { name: "Kwai", value: 10, color: "bg-amber-500/30" },
      ],
      chartLabel: "últimos 30 dias",
      chartDays: Array.from({ length: 30 }, (_, i) => `D${i + 1}`),
      topProducts: [
        { name: "Fone Bluetooth", value: "R$ 12.450", rank: 1 },
        { name: "Carregador USB", value: "R$ 8.920", rank: 2 },
        { name: "Capa Silicone", value: "R$ 6.780", rank: 3 },
      ],
    },
    "90d": {
      metrics: [
        { label: "Receita Total", value: "R$ 285.700", change: "+42.8%", up: true },
        { label: "Visualizações", value: "520.100", change: "+35.2%", up: true },
        { label: "CTR Médio", value: "5.8%", change: "+1.2%", up: true },
        { label: "Conversões", value: "4.215", change: "+48.3%", up: true },
      ],
      chart: [60, 72, 58, 85, 78, 92, 88, 75, 68, 90, 82, 95, 80, 74, 88, 96, 84, 78, 92, 88, 98, 85, 76, 94, 90, 82, 96, 88, 80, 92, 86, 78, 95, 90, 82, 98, 88, 80, 94, 86, 78, 96, 92, 84, 100, 90, 82, 98, 88, 80, 94, 90, 82, 96, 92, 84, 98, 88, 80, 92, 86, 78, 95, 90, 82, 96, 88, 80, 94, 86, 78, 96, 92, 84, 100, 90, 82, 98, 88, 80, 94, 90, 82, 96, 92, 84, 98, 88, 80, 92],
      platforms: [
        { name: "TikTok", value: 35, color: "bg-blue-500/30" },
        { name: "Instagram", value: 28, color: "bg-purple-500/30" },
        { name: "YouTube", value: 22, color: "bg-red-500/30" },
        { name: "Kwai", value: 15, color: "bg-amber-500/30" },
      ],
      chartLabel: "últimos 90 dias",
      chartDays: Array.from({ length: 90 }, (_, i) => `D${i + 1}`),
      topProducts: [
        { name: "Fone Bluetooth", value: "R$ 32.400", rank: 1 },
        { name: "Carregador USB", value: "R$ 21.500", rank: 2 },
        { name: "Capa Silicone", value: "R$ 15.800", rank: 3 },
      ],
    },
  };

  const data = dataByPeriod[period];
  const maxChart = Math.max(...data.chart);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Analytics">
        {periods.map((p) => (
          <Btn key={p} active={period === p} onClick={() => setPeriod(p)}>{p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}</Btn>
        ))}
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Btn primary>Exportar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {data.metrics.map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                <div className="text-[10px] text-white/30">{s.label}</div>
                <div className="text-lg font-semibold text-white/80 mt-1">{s.value}</div>
                <div className={`text-[10px] mt-1 ${s.up ? "text-emerald-400" : "text-red-400"}`}>{s.change}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 mb-4">
            <div className="text-xs font-medium text-white/50 mb-4">Receita ({data.chartLabel})</div>
            <div className="flex items-end gap-[1px] h-32">
              {data.chart.map((h, i) => {
                const barHeight = maxChart > 0 ? (h / maxChart) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[8px] text-white/40 bg-black/60 px-1 rounded whitespace-nowrap">{h}%</div>
                    <div className="w-full rounded-t bg-emerald-500/30 hover:bg-emerald-500/50 transition-all" style={{ height: `${barHeight}%` }} />
                    {data.chart.length <= 30 && <span className="text-[8px] text-white/20">{data.chartDays[i]}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-xs font-medium text-white/50 mb-3">Por Plataforma</div>
              {data.platforms.map((p) => (
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
              {data.topProducts.map((p) => (
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
  const categories = ["Todos", "Vídeo", "Imagem", "Site", "Design"];
  const allTemplates = [
    { name: "Review Produto", type: "Vídeo", dur: "30s", category: "Vídeo" },
    { name: "Unboxing", type: "Vídeo", dur: "45s", category: "Vídeo" },
    { name: "Dica Rápida", type: "Vídeo", dur: "15s", category: "Vídeo" },
    { name: "Post Carrossel", type: "Imagem", dur: "—", category: "Imagem" },
    { name: "Banner Promo", type: "Imagem", dur: "—", category: "Imagem" },
    { name: "Story Oferta", type: "Imagem", dur: "—", category: "Imagem" },
    { name: "Landing Page", type: "Site", dur: "—", category: "Site" },
    { name: "Card Produto", type: "Design", dur: "—", category: "Design" },
  ];
  const [selected, setSelected] = useLocalStorage("template_library_selected", null);
  const [recentTemplates, setRecentTemplates] = useLocalStorage("template_library_recent", []);
  const [filter, setFilter] = useState("Todos");

  const handleSelect = (idx) => {
    setSelected(idx);
    const t = allTemplates[idx];
    setRecentTemplates((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      return [t.name, ...filtered].slice(0, 10);
    });
  };

  const filtered = filter === "Todos" ? allTemplates : allTemplates.filter((t) => t.category === filter);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Biblioteca de Templates">
        <Btn primary>Criar Template</Btn>
        <Btn>Importar</Btn>
      </TopBar>
      <div className="flex gap-1 px-5 py-2 border-b border-white/[0.06] bg-[#0c0c0c]">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1 text-[10px] rounded-md transition-all ${filter === cat ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50"}`}>{cat}</button>
        ))}
      </div>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-4">
          {filtered.map((t, i) => {
            const realIdx = allTemplates.indexOf(t);
            return (
              <div key={i} onClick={() => handleSelect(realIdx)} className={`group rounded-xl bg-white/[0.02] border overflow-hidden hover:bg-white/[0.04] transition-all cursor-pointer ${selected === realIdx ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-white/[0.06]"}`}>
                <div className="aspect-[16/10] bg-white/[0.03] flex items-center justify-center">
                  <span className="text-2xl text-white/10 group-hover:text-white/20">{t.category === "Vídeo" ? "🎬" : t.category === "Imagem" ? "🖼️" : t.category === "Site" ? "🌐" : "🎨"}</span>
                </div>
                <div className="p-3">
                  <div className="text-xs text-white/70">{t.name}</div>
                  <div className="text-[10px] text-white/30 mt-0.5">{t.type} • {t.dur}</div>
                </div>
              </div>
            );
          })}
        </div>
        {recentTemplates.length > 0 && (
          <div className="max-w-5xl mx-auto mt-6 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
            <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-2">Usados Recentemente</div>
            <div className="flex flex-wrap gap-2">
              {recentTemplates.map((name, i) => (
                <span key={i} className="px-2 py-1 text-[10px] rounded bg-white/5 text-white/40">{name}</span>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function VoiceAI() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Narrativa");
  const [history, setHistory] = useLocalStorage("voiceai_history", []);
  const [selectedVoice, setSelectedVoice] = useLocalStorage("voiceai_selected_voice", "Maria");
  const voices = [
    { name: "Maria", lang: "PT-BR", gender: "Feminino" },
    { name: "João", lang: "PT-BR", gender: "Masculino" },
    { name: "Sophie", lang: "EN-US", gender: "Feminino" },
    { name: "James", lang: "EN-US", gender: "Masculino" },
  ];

  const handleGenerate = () => {
    if (!text.trim()) return;
    setHistory((prev) => [{ text, voice: selectedVoice, date: new Date().toLocaleDateString() }, ...prev].slice(0, 20));
    setText("");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Voz AI & Dublagem">
        <Btn primary onClick={handleGenerate}>Gerar Voz</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
            <div className="text-xs font-medium text-white/50 mb-3">Texto para Voz</div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-24 bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs text-white/60 outline-none focus:border-white/20 resize-none" placeholder="Digite o texto que deseja converter em voz..." />
            <div className="flex items-center gap-2 mt-3">
              {["Narrativa", "Animada", "Suave", "Formal"].map((v) => (
                <button key={v} onClick={() => setVoice(v)} className={`px-3 py-1 rounded-lg text-[10px] transition-all ${voice === v ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>{v}</button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
            <div className="text-xs font-medium text-white/50 mb-3">Biblioteca de Vozes</div>
            <div className="grid grid-cols-2 gap-2">
              {voices.map((v) => (
                <div key={v.name} onClick={() => setSelectedVoice(v.name)} className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all ${selectedVoice === v.name ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                  <div>
                    <div className="text-xs text-white/60">{v.name}</div>
                    <div className="text-[10px] text-white/30">{v.lang} • {v.gender}</div>
                  </div>
                  <button className={`text-[10px] ${selectedVoice === v.name ? "text-emerald-400" : "text-white/30 hover:text-white/60"}`}>{selectedVoice === v.name ? "🔊" : "▶"}</button>
                </div>
              ))}
            </div>
          </div>
          {history.length > 0 && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-2">Histórico</div>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] text-[10px]">
                    <span className="text-white/50 truncate flex-1">{h.text}</span>
                    <span className="text-white/20 ml-2">{h.voice} • {h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function TranscriptionAI() {
  const [transcriptions, setTranscriptions] = useLocalStorage("transcriptionai_items", [
    { name: "entrevista.mp3", dur: "12:30", date: "Hoje" },
    { name: "podcast.mp4", dur: "45:00", date: "Ontem" },
  ]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setTimeout(() => {
      setTranscriptions((prev) => [{ name: "audio_gravado.wav", dur: "03:22", date: "Agora" }, ...prev]);
      setUploading(false);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Transcrição AI">
        <Btn primary onClick={handleUpload} disabled={uploading}>{uploading ? "Processando..." : "Upload Arquivo"}</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto">
          <div onClick={handleUpload} className="rounded-xl bg-white/[0.02] border border-white/[0.06] border-dashed p-8 text-center cursor-pointer hover:bg-white/[0.04] transition-all">
            <svg className="w-8 h-8 mx-auto text-white/20 mb-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
            </svg>
            <p className="text-xs text-white/30">Arraste arquivos de áudio ou vídeo aqui</p>
            <p className="text-[10px] text-white/20 mt-1">MP3, WAV, MP4, MOV • Máx 100MB</p>
            {uploading && <div className="mt-3 w-32 h-1 bg-white/10 rounded-full mx-auto overflow-hidden"><div className="h-full bg-emerald-500/50 rounded-full animate-pulse" style={{ width: "60%" }} /></div>}
          </div>
          <div className="mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
            <div className="text-[10px] text-white/20 uppercase tracking-wider mb-2">Transcrições Recentes</div>
            {transcriptions.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-white/20">Nenhuma transcrição ainda. Faça upload de um arquivo.</div>
            ) : (
              transcriptions.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.03] text-xs">
                  <span className="text-white/60">{t.name}</span>
                  <span className="text-white/30">{t.dur} • {t.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function CodeGenerator() {
  const initialFiles = [
    { name: "App.js", content: 'import React, { useState } from "react";\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="app">\n      <h1>Hello BRANPY</h1>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>\n        Increment\n      </button>\n    </div>\n  );\n}' },
    { name: "api.py", content: "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get(\"/api/hello\")\nasync def hello():\n    return {\"message\": \"Hello BRANPY\"}" },
    { name: "styles.css", content: ".app {\n  text-align: center;\n  padding: 2rem;\n}\n\nh1 {\n  color: #333;\n}\n\np {\n  color: #666;\n}" },
    { name: "index.html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <title>BRANPY App</title>\n</head>\n<body>\n  <div id=\"root\"></div>\n</body>\n</html>" },
    { name: "database.sql", content: "CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(255) UNIQUE\n);\n\nCREATE TABLE products (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(200),\n  price DECIMAL(10,2)\n);" },
  ];
  const [files, setFiles] = useLocalStorage("codegen_files", initialFiles);
  const [currentFile, setCurrentFile] = useState(0);
  const [promptHistory, setPromptHistory] = useLocalStorage("codegen_prompts", []);
  const [prompt, setPrompt] = useState("");
  const [terminal, setTerminal] = useLocalStorage("codegen_terminal", ["> npm start", "> server running on port 3000"]);

  const handleNewFile = () => {
    const name = prompt("Nome do arquivo:");
    if (name) {
      setFiles((prev) => [...prev, { name, content: "" }]);
    }
  };

  const handleDeleteFile = (i) => {
    if (files.length <= 1) return;
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    if (currentFile >= files.length - 1) setCurrentFile(Math.max(0, files.length - 2));
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setPromptHistory((prev) => [...prev, prompt]);
    setTerminal((prev) => [...prev, `> IA gerando código para: ${prompt}`]);
    setTimeout(() => setTerminal((prev) => [...prev, "> Código gerado com sucesso!"]), 800);
    setTimeout(() => setTerminal((prev) => [...prev, "> Pronto para executar"]), 1600);
    setPrompt("");
  };

  const handleContentChange = (e) => {
    setFiles((prev) => prev.map((f, i) => i === currentFile ? { ...f, content: e.target.value } : f));
  };

  const highlightSyntax = (code) => {
    const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = escaped.split("\n");
    return lines.map((line, i) => {
      let h = line;
      h = h.replace(/(\/\/.*)/g, '<span style="color:#6b7280">$1</span>');
      h = h.replace(/(["'`].*?["'`])/g, '<span style="color:#fbbf24">$1</span>');
      h = h.replace(/\b(\d+)\b/g, '<span style="color:#a78bfa">$1</span>');
      const keywords = ["import", "export", "return", "from", "function", "const", "let", "var", "default", "async", "await", "class", "extends", "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "new", "this", "try", "catch", "finally", "throw", "SELECT", "FROM", "WHERE", "CREATE", "TABLE", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "ALTER", "DROP", "INDEX", "JOIN", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "SERIAL", "INT", "VARCHAR", "DECIMAL", "def", "True", "False", "None", "async", "await", "in", "as", "not", "and", "or", "is"];
      keywords.forEach((kw) => {
        h = h.replace(new RegExp(`\\b(${kw})\\b`, "g"), '<span style="color:#60a5fa">$1</span>');
      });
      return h;
    });
  };

  const current = files[currentFile] || files[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Gerador de Código">
        <Btn onClick={() => setTerminal((prev) => [...prev, "> Executando..."])} primary>Executar</Btn>
        <Btn>Deploy</Btn>
        <Btn>Git Push</Btn>
      </TopBar>
      <div className="flex-1 flex min-h-0">
        <div className="w-44 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider">Arquivos</span>
            <button onClick={handleNewFile} className="text-[10px] text-white/30 hover:text-white/60 w-4 h-4 flex items-center justify-center rounded hover:bg-white/10">+</button>
          </div>
          {files.map((f, i) => (
            <div key={i} className="flex items-center group">
              <button onClick={() => setCurrentFile(i)} className={`flex-1 text-left px-2 py-1.5 rounded-md text-xs mb-0.5 ${currentFile === i ? "bg-white/10 text-white/70" : "text-white/40 hover:bg-white/5"}`}>
                {f.name}
              </button>
              {files.length > 1 && (
                <button onClick={() => handleDeleteFile(i)} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400/50 hover:text-red-400 px-1 py-1">×</button>
              )}
            </div>
          ))}
          <div className="mt-auto pt-3 border-t border-white/[0.06]">
            <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-2">AI Assistente</div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-lg p-2 text-[10px] text-white/50 outline-none focus:border-white/20 resize-none h-20" placeholder="Peça para gerar código..." />
            <button onClick={handleGenerate} className="mt-2 w-full text-[10px] py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Gerar</button>
            {promptHistory.length > 0 && (
              <div className="mt-2">
                <div className="text-[10px] text-white/20 mb-1">Histórico</div>
                {promptHistory.slice(-3).reverse().map((p, i) => (
                  <div key={i} className="text-[9px] text-white/20 truncate py-0.5 border-b border-white/[0.03]">{p}</div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#0c0c0c] border-b border-white/[0.06] text-[10px] text-white/30">
            <span className="text-white/50">{current.name}</span>
            <span className="ml-auto">{current.name.split(".").pop() === "py" ? "Python" : current.name.split(".").pop() === "css" ? "CSS" : current.name.split(".").pop() === "html" ? "HTML" : current.name.split(".").pop() === "sql" ? "SQL" : "JavaScript"}</span>
          </div>
          <textarea value={current.content} onChange={handleContentChange} className="flex-1 bg-[#080808] p-3 font-mono text-xs text-white/40 outline-none resize-none scrollbar-thin" spellCheck={false} />
          <div className="h-28 bg-[#0c0c0c] border-t border-white/[0.06] p-3 overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-2 text-[10px] text-white/20 mb-1">
              <span className="text-emerald-400">$</span> terminal
            </div>
            {terminal.map((line, i) => (
              <div key={i} className="text-[10px] text-white/20 font-mono">{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentsAI() {
  const { items: documents, set: setDocuments, add: addDocument, remove: removeDocument, update: updateDocument } = useArray("documents_ai", [
    { title: "Plano de Marketing", body: "Plano de marketing para o primeiro semestre de 2026.\n\nObjetivos:\n- Aumentar base de clientes em 30%\n- Lançar 3 novos produtos\n- Expandir para 2 novas regiões" },
    { title: "Roteiro Vídeo", body: "Roteiro para vídeo de review do produto X.\n\nAbertura: 15s - Apresentação do produto\nDesenvolvimento: 2min - Mostrando funcionalidades\nEncerramento: 30s - CTA" },
    { title: "Briefing", body: "Briefing do projeto de redesign do site.\n\nCliente: Empresa ABC\nEscopo: Home, Produtos, Blog, Contato\nPrazo: 45 dias" },
    { title: "Contrato", body: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nEntre as partes:\n1. BRANPY Tecnologia Ltda.\n2. Cliente\n\nCláusula Primeira - Do Objeto..." },
    { title: "Pauta Reunião", body: "Pauta da reunião semanal - 15/05\n\n1. Review da semana\n2. Status dos projetos\n3. Próximos passos\n4. Dúvidas" },
  ]);
  const [selectedDoc, setSelectedDoc] = useState(0);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const handleNewDocument = () => {
    const title = prompt("Nome do documento:");
    if (title) {
      addDocument({ title, body: "" });
      setSelectedDoc(documents.length);
    }
  };

  const handleDeleteDocument = (i) => {
    if (documents.length <= 1) return;
    removeDocument(i);
    if (selectedDoc >= documents.length - 1) setSelectedDoc(Math.max(0, documents.length - 2));
  };

  const handleTitleSave = () => {
    updateDocument(selectedDoc, { title: titleInput || "Sem título" });
    setEditingTitle(false);
  };

  const current = documents[selectedDoc] || documents[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Documentos AI">
        <Btn primary onClick={handleNewDocument}>Novo Documento</Btn>
        <Btn>Upload</Btn>
      </TopBar>
      <div className="flex-1 flex min-h-0">
        <div className="w-48 flex-shrink-0 border-r border-white/[0.06] bg-[#0c0c0c] p-3 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider">Documentos</span>
            <span className="text-[10px] text-white/20">{documents.length}</span>
          </div>
          {documents.map((d, i) => (
            <div key={i} className="flex items-center group">
              <button onClick={() => setSelectedDoc(i)} className={`flex-1 text-left px-2 py-1.5 rounded-md text-xs mb-0.5 ${selectedDoc === i ? "bg-white/10 text-white/70" : "text-white/40 hover:bg-white/5"}`}>
                <span className="truncate block">{d.title}</span>
              </button>
              {documents.length > 1 && (
                <button onClick={() => handleDeleteDocument(i)} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400/50 hover:text-red-400 px-1 py-1">×</button>
              )}
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-6 py-3 border-b border-white/[0.06] flex items-center gap-2">
            {editingTitle ? (
              <input autoFocus value={titleInput} onChange={(e) => setTitleInput(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e) => e.key === "Enter" && handleTitleSave()} className="flex-1 bg-transparent text-sm text-white/70 outline-none border-b border-emerald-500/30" />
            ) : (
              <input className="flex-1 bg-transparent text-sm text-white/70 outline-none cursor-text" value={current.title} onChange={(e) => { setEditingTitle(true); setTitleInput(e.target.value); }} onFocus={() => { setEditingTitle(true); setTitleInput(current.title); }} />
            )}
          </div>
          <textarea value={current.body} onChange={(e) => updateDocument(selectedDoc, { body: e.target.value })} className="flex-1 p-6 bg-transparent text-sm text-white/40 leading-relaxed outline-none resize-none scrollbar-thin" placeholder="Documento em branco. Comece a escrever ou use a IA para gerar conteúdo..." />
        </div>
      </div>
    </div>
  );
}

export function MediaBank() {
  const { items: media, add: addMedia, remove: removeMedia } = useArray("media_bank", []);
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState("Todas");
  const categories = ["Todas", "Vídeos", "Imagens", "Áudios", "Documentos"];
  const icons = ["🎬", "🖼️", "🎵", "📄"];
  const names = ["video_demo.mp4", "foto_produto.png", "trilha_sonora.mp3", "manual.pdf"];

  const handleUpload = () => {
    const catIdx = Math.floor(Math.random() * 4);
    const item = { name: names[catIdx], type: categories[catIdx + 1], icon: icons[catIdx], color: `bg-${["blue","purple","emerald","amber"][catIdx]}-500/10` };
    addMedia(item);
  };

  const filtered = category === "Todas" ? media : media.filter((m) => m.type === category);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Banco de Mídia">
        <Btn primary onClick={handleUpload}>Upload</Btn>
      </TopBar>
      <div className="flex gap-1 px-5 py-2 border-b border-white/[0.06] bg-[#0c0c0c]">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1 text-[10px] rounded-md transition-all ${category === cat ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50"}`}>{cat}</button>
        ))}
      </div>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto">
          {media.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 mx-auto text-white/10 mb-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
              <p className="text-xs text-white/20">Nenhuma mídia. Clique em Upload para adicionar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-3">
              {filtered.map((item, i) => (
                <div key={i} className="group relative aspect-square rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] cursor-pointer transition-all flex items-center justify-center" onClick={() => setPreview(item)}>
                  <span className="text-xl text-white/20 group-hover:text-white/40">{item.icon}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeMedia(i); }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[10px] w-4 h-4 flex items-center justify-center rounded bg-red-500/30 text-red-400 hover:bg-red-500/50">×</button>
                  <div className="absolute bottom-1 left-1 right-1 text-[8px] text-white/30 truncate text-center">{item.name}</div>
                </div>
              ))}
            </div>
          )}
          {preview && (
            <div onClick={() => setPreview(null)} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
              <div onClick={(e) => e.stopPropagation()} className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 max-w-sm w-full mx-4">
                <div className="text-4xl text-center mb-3">{preview.icon}</div>
                <div className="text-sm text-white/70 text-center">{preview.name}</div>
                <div className="text-[10px] text-white/30 text-center mt-1">{preview.type}</div>
                <button onClick={() => setPreview(null)} className="mt-4 w-full text-xs py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Fechar</button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function MusicHub() {
  const { items: tracks, add: addTrack, remove: removeTrack } = useArray("music_hub_tracks", [
    { name: "Summer Vibes", dur: "2:45", bpm: "120", mood: "Energético" },
    { name: "Lo-Fi Study", dur: "3:30", bpm: "85", mood: "Relaxante" },
    { name: "Upbeat Corporate", dur: "2:15", bpm: "130", mood: "Profissional" },
    { name: "Cinematic Drone", dur: "4:00", bpm: "60", mood: "Épico" },
    { name: "Acoustic Folk", dur: "3:10", bpm: "100", mood: "Natural" },
    { name: "Electronic Groove", dur: "2:55", bpm: "128", mood: "Moderno" },
  ]);
  const [playing, setPlaying] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", dur: "", bpm: "", mood: "" });

  const handleAdd = () => {
    if (!form.name) return;
    addTrack({ name: form.name, dur: form.dur || "3:00", bpm: form.bpm || "100", mood: form.mood || "Outro" });
    setForm({ name: "", dur: "", bpm: "", mood: "" });
    setShowForm(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Músicas & Sons">
        <Btn primary onClick={() => setShowForm(true)}>+ Adicionar</Btn>
        <Btn>Upload</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
              <span>Faixa</span><span>Duração</span><span>BPM</span><span>Estilo</span>
            </div>
            {tracks.map((t, i) => (
              <div key={i} className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/[0.03] text-xs text-white/50 hover:bg-white/[0.02] group items-center">
                <div className="flex items-center gap-2">
                  <button onClick={() => setPlaying(playing === i ? null : i)} className={`transition-all ${playing === i ? "text-emerald-400" : "text-white/20 group-hover:text-emerald-400"}`}>{playing === i ? "⏸" : "▶"}</button>
                  <span className={`${playing === i ? "text-emerald-400" : "text-white/70"}`}>{t.name}</span>
                  {playing === i && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                <span>{t.dur}</span><span>{t.bpm}</span><span>{t.mood}</span>
              </div>
            ))}
          </div>
          {showForm && (
            <div className="mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Nova Faixa</div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Nome" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20" />
                <input placeholder="Duração (ex: 3:30)" value={form.dur} onChange={(e) => setForm((p) => ({ ...p, dur: e.target.value }))} className="bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20" />
                <input placeholder="BPM" value={form.bpm} onChange={(e) => setForm((p) => ({ ...p, bpm: e.target.value }))} className="bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20" />
                <input placeholder="Estilo" value={form.mood} onChange={(e) => setForm((p) => ({ ...p, mood: e.target.value }))} className="bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleAdd} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Adicionar</button>
                <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function AIAvatars() {
  const { items: avatars, add: addAvatar, remove: removeAvatar } = useArray("ai_avatars", []);
  const [selected, setSelected] = useState(null);
  const [customizing, setCustomizing] = useState(null);
  const [customName, setCustomName] = useState("");
  const defaults = [
    { name: "Avatar Realista", style: "Foto realista", preview: "🧑‍💼" },
    { name: "Avatar Animado", style: "Estilo cartoon", preview: "😊" },
    { name: "Avatar 3D", style: "Modelo 3D", preview: "🧑‍🎤" },
    { name: "Apresentador", style: "Notícias/Talk show", preview: "🎙️" },
    { name: "Influencer", style: "Estilo gamer", preview: "🎮" },
    { name: "Profissional", style: "Corporativo", preview: "👔" },
  ];

  const handlePersonalizar = (avatar, i) => {
    setCustomizing(i);
    setCustomName(avatar.name);
  };

  const handleSaveCustom = () => {
    if (!customName.trim()) return;
    addAvatar({ name: customName, style: "Customizado", preview: defaults[customizing]?.preview || "🧑‍💼" });
    setCustomizing(null);
    setCustomName("");
  };

  const allAvatars = [...defaults, ...avatars];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="AI Avatares">
        <Btn primary onClick={() => setCustomizing(0)}>Criar Avatar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {allAvatars.map((a, i) => (
            <div key={i} onClick={() => setSelected(i)} className={`rounded-xl bg-white/[0.02] border p-5 text-center hover:bg-white/[0.04] transition-all cursor-pointer ${selected === i ? "border-emerald-500/40 ring-1 ring-emerald-500/20" : "border-white/[0.06]"}`}>
              <div className="text-4xl mb-3">{a.preview}</div>
              <div className="text-sm text-white/70">{a.name}</div>
              <div className="text-[10px] text-white/30 mt-1">{a.style}</div>
              <button onClick={(e) => { e.stopPropagation(); handlePersonalizar(a, i); }} className="mt-3 text-[10px] px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Personalizar</button>
              {selected === i && <div className="mt-2 text-[10px] text-emerald-400">✓ Selecionado</div>}
            </div>
          ))}
        </div>
        {customizing !== null && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
            <div onClick={(e) => e.stopPropagation()} className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 max-w-sm w-full mx-4">
              <div className="text-xs font-medium text-white/50 mb-3">Personalizar Avatar</div>
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20 mb-3" placeholder="Nome do avatar" />
              <div className="flex gap-2">
                <button onClick={handleSaveCustom} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Salvar</button>
                <button onClick={() => setCustomizing(null)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function Projects() {
  const { items: projects, add: addProject, remove: removeProject, update: updateProject } = useArray("projects_list", [
    { name: "Campanha TikTok", tasks: [{ name: "Criar roteiro", done: true }, { name: "Gravar vídeo", done: true }, { name: "Editar", done: true }, { name: "Publicar", done: true }, { name: "Analisar métricas", done: true }, { name: "Relatório", done: true }, { name: "Otimizar", done: true }, { name: "Anunciar", done: true }, { name: "A/B test", done: false }, { name: "Escalar", done: false }, { name: "Novo criativo", done: false }, { name: "Review", done: false }] },
    { name: "Review Produtos", tasks: [{ name: "Selecionar produtos", done: true }, { name: "Testar", done: true }, { name: "Escrever review", done: true }, { name: "Fotos", done: false }, { name: "Publicar", done: false }, { name: "Divulgar", done: false }, { name: "Monitorar", done: false }, { name: "Atualizar", done: false }] },
    { name: "Site Afiliados", tasks: [{ name: "Registrar domínio", done: true }, { name: "Escolher tema", done: true }, { name: "Configurar", done: true }, { name: "Importar produtos", done: true }, { name: "Criar páginas", done: true }, { name: "SEO", done: true }, { name: "Conteúdo", done: true }, { name: "Testar", done: true }, { name: "Lançar", done: true }, { name: "Tráfego", done: true }, { name: "Conversão", done: true }, { name: "Escalar", done: true }, { name: "Email marketing", done: true }, { name: "Webinars", done: true }, { name: "Parcerias", done: true }, { name: "Anúncios", done: true }, { name: "Relatórios", done: true }, { name: "Otimizar landing", done: true }, { name: "CTA teste", done: true }, { name: "Cross-sell", done: true }, { name: "Upsell", done: true }, { name: "Chat", done: true }, { name: "Suporte", done: true }, { name: "Manutenção", done: false }] },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [newTaskText, setNewTaskText] = useState("");

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    addProject({ name: newProjectName, tasks: [] });
    setNewProjectName("");
    setShowForm(false);
  };

  const handleToggleTask = (projIdx, taskIdx) => {
    updateProject(projIdx, (prev) => ({
      ...prev,
      tasks: prev.tasks.map((t, i) => i === taskIdx ? { ...t, done: !t.done } : t),
    }));
  };

  const handleAddTask = (projIdx) => {
    if (!newTaskText.trim()) return;
    updateProject(projIdx, (prev) => ({
      ...prev,
      tasks: [...prev.tasks, { name: newTaskText, done: false }],
    }));
    setNewTaskText("");
  };

  const doneCount = (tasks) => tasks.filter((t) => t.done).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Projetos">
        <Btn primary onClick={() => setShowForm(true)}>Novo Projeto</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {projects.map((p, i) => {
              const total = p.tasks.length;
              const done = doneCount(p.tasks);
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-all">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-white/70">{p.name}</div>
                    <button onClick={() => removeProject(i)} className="text-[10px] text-white/20 hover:text-red-400">×</button>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/50 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-white/30">{done}/{total}</span>
                  </div>
                  <button onClick={() => setExpanded(expanded === i ? null : i)} className="mt-2 text-[10px] text-white/20 hover:text-white/40 w-full text-left">
                    {expanded === i ? "▲ Recuar" : "▼ Gerenciar tarefas"}
                  </button>
                  {expanded === i && (
                    <div className="mt-2 space-y-1 border-t border-white/[0.06] pt-2">
                      {p.tasks.map((t, j) => (
                        <div key={j} className="flex items-center gap-2 text-[10px]">
                          <input type="checkbox" checked={t.done} onChange={() => handleToggleTask(i, j)} className="accent-emerald-500" />
                          <span className={t.done ? "text-white/30 line-through" : "text-white/50"}>{t.name}</span>
                        </div>
                      ))}
                      <div className="flex gap-1 pt-1">
                        <input value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddTask(i)} className="flex-1 bg-white/[0.03] border border-white/10 rounded px-2 py-1 text-[10px] text-white/50 outline-none focus:border-white/20" placeholder="Nova tarefa..." />
                        <button onClick={() => handleAddTask(i)} className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/30 hover:bg-white/10">+</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {showForm && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Novo Projeto</div>
              <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddProject()} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20 mb-3" placeholder="Nome do projeto" />
              <div className="flex gap-2">
                <button onClick={handleAddProject} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Criar</button>
                <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function IntegrationsPage() {
  const defaultConnections = {
    "OpenAI": true, "TikTok": true, "Instagram": false, "Shopee": true,
    "Amazon": false, "Railway": false, "YouTube": false, "Mercado Livre": false, "Vercel": false,
  };
  const [connections, setConnections] = useLocalStorage("integrations_connections", defaultConnections);

  const integrations = [
    { name: "OpenAI", icon: "🤖" },
    { name: "TikTok", icon: "🎵" },
    { name: "Instagram", icon: "📸" },
    { name: "Shopee", icon: "🛒" },
    { name: "Amazon", icon: "📦" },
    { name: "Railway", icon: "🚂" },
    { name: "YouTube", icon: "▶️" },
    { name: "Mercado Livre", icon: "📋" },
    { name: "Vercel", icon: "▲" },
  ];

  const toggleConnection = (name) => {
    setConnections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Integrações">
        <Btn primary>+ Adicionar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {integrations.map((i) => {
            const connected = connections[i.name];
            return (
              <div key={i.name} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{i.icon}</span>
                  <span className="text-sm text-white/70">{i.name}</span>
                </div>
                <button onClick={() => toggleConnection(i.name)} className={`text-[10px] px-2 py-1 rounded-lg transition-all ${connected ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-white/5 text-white/30 hover:bg-white/10"}`}>
                  {connected ? "Conectado" : "Conectar"}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function PlansPage() {
  const [billing, setBilling] = useState("monthly");
  const [currentPlan, setCurrentPlan] = useLocalStorage("current_plan", null);

  const plans = [
    { name: "Free", price: "R$ 0", desc: "Teste a plataforma", features: ["50 créditos/mês", "Chat IA básico", "Importar produtos", "1 projeto"], popular: false },
    { name: "Pro", price: billing === "monthly" ? "R$ 49" : "R$ 39", desc: "Para profissionais", features: ["500 créditos/mês", "Chat IA completo", "Video Studio", "Automações", "10 projetos", "Suporte prioritário"], popular: true },
    { name: "Enterprise", price: billing === "monthly" ? "R$ 199" : "R$ 159", desc: "Para equipes", features: ["Créditos ilimitados", "Tudo do Pro", "Equipe até 10", "API dedicada", "Projetos ilimitados", "Onboarding personalizado"], popular: false },
  ];

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
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.name;
            return (
              <div key={plan.name} className={`rounded-xl bg-white/[0.02] border p-5 relative ${plan.popular ? "border-emerald-500/20 bg-emerald-500/[0.03]" : "border-white/[0.06]"} ${isCurrent ? "ring-2 ring-emerald-500/30" : ""}`}>
                {plan.popular && <div className="absolute -top-2.5 left-5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Mais popular</div>}
                {isCurrent && <div className="absolute -top-2.5 right-5 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Atual</div>}
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
                <button onClick={() => setCurrentPlan(plan.name)} className={`mt-5 w-full text-xs py-2 rounded-lg transition-all ${isCurrent ? "bg-emerald-500/20 text-emerald-400" : plan.popular ? "bg-emerald-500/80 text-white hover:bg-emerald-500" : "bg-white/5 text-white/40 hover:bg-white/10"}`}>
                  {isCurrent ? "Assinatura Ativa" : plan.name === "Free" ? "Começar Grátis" : "Assinar"}
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function TeamPage() {
  const { items: members, add: addMember, remove: removeMember } = useArray("team_members", [
    { name: "Você", email: "admin@brane.app", role: "Owner", status: "Online" },
    { name: "Ana Silva", email: "ana@brane.app", role: "Editor", status: "Ausente" },
    { name: "Carlos Mendes", email: "carlos@brane.app", role: "Viewer", status: "Offline" },
  ]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const handleInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    addMember({ name: inviteName, email: inviteEmail, role: "Editor", status: "Offline" });
    setInviteName("");
    setInviteEmail("");
    setShowInvite(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Equipe">
        <Btn primary onClick={() => setShowInvite(true)}>Convidar</Btn>
      </TopBar>
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] text-white/30 uppercase tracking-wider">
              <span className="col-span-2">Membro</span><span>Função</span><span>Status</span>
            </div>
            {members.map((m, i) => (
              <div key={i} className="grid grid-cols-4 gap-3 px-4 py-3 border-b border-white/[0.03] text-xs text-white/50 hover:bg-white/[0.02] items-center group">
                <div className="col-span-2 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/40">{m.name[0]}</div>
                  <div className="flex-1"><div className="text-white/70">{m.name}</div><div className="text-[10px] text-white/30">{m.email}</div></div>
                </div>
                <span className="text-white/40">{m.role}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${m.status === "Online" ? "text-emerald-400" : m.status === "Ausente" ? "text-amber-400" : "text-white/30"}`}>{m.status}</span>
                  {i > 0 && <button onClick={() => removeMember(i)} className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400/50 hover:text-red-400 ml-auto">×</button>}
                </div>
              </div>
            ))}
          </div>
          {showInvite && (
            <div className="mt-4 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">Convidar Membro</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Nome" />
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 outline-none focus:border-white/20" placeholder="Email" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleInvite} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Enviar Convite</button>
                <button onClick={() => setShowInvite(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useLocalStorage("app_settings", {
    Nome: "Admin",
    Email: "admin@brane.app",
    "Notificação Email": "Ativado",
    "Notificação Push": "Desativado",
    "OpenAI Key": "••••••••",
    "TikTok Key": "••••••••",
    "2FA": "Desativado",
    Sessões: "1 ativa",
  });

  const sections = [
    { section: "Perfil", fields: ["Nome", "Email"] },
    { section: "Notificações", fields: ["Notificação Email", "Notificação Push"] },
    { section: "API Keys", fields: ["OpenAI Key", "TikTok Key"] },
    { section: "Segurança", fields: ["2FA", "Sessões"] },
  ];

  const updateField = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Configurações" />
      <ScrollArea className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {sections.map((s) => (
            <div key={s.section} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="text-[10px] font-medium text-white/20 uppercase tracking-wider mb-3">{s.section}</div>
              {s.fields.map((f) => (
                <div key={f} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                  <span className="text-xs text-white/50">{f}</span>
                  <input value={settings[f] || ""} onChange={(e) => updateField(f, e.target.value)} className="text-xs text-white/30 bg-transparent border-b border-transparent hover:border-white/10 focus:border-white/20 outline-none text-right px-2 py-0.5 w-40" />
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
  const { items: tickets, add: addTicket } = useArray("support_tickets", [
    { subject: "Problema ao importar produto", status: "Aberto", date: "Hoje" },
    { subject: "Dúvida sobre plano Pro", status: "Respondido", date: "Ontem" },
    { subject: "Sugestão de nova feature", status: "Fechado", date: "3 dias" },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const handleNewTicket = () => {
    if (!subject.trim()) return;
    addTicket({ subject, status: "Aberto", date: "Agora", description });
    setSubject("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <TopBar title="Suporte">
        <Btn primary onClick={() => setShowForm(true)}>Novo Ticket</Btn>
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
          {tickets.length === 0 ? (
            <div className="text-center py-6 text-[10px] text-white/20">Nenhum ticket ainda. Crie um novo ticket.</div>
          ) : (
            tickets.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.03] text-xs">
                <span className="text-white/60">{t.subject}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${t.status === "Aberto" ? "text-amber-400" : t.status === "Respondido" ? "text-emerald-400" : "text-white/30"}`}>{t.status}</span>
                  <span className="text-white/20">{t.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
            <div onClick={(e) => e.stopPropagation()} className="bg-[#0c0c0c] border border-white/[0.06] rounded-xl p-6 max-w-lg w-full mx-4">
              <div className="text-xs font-medium text-white/50 mb-3">Novo Ticket</div>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded px-3 py-2 text-xs text-white/60 outline-none focus:border-white/20 mb-3" placeholder="Assunto" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-24 bg-white/[0.03] border border-white/10 rounded p-3 text-xs text-white/60 outline-none focus:border-white/20 resize-none mb-3" placeholder="Descreva seu problema..." />
              <div className="flex gap-2">
                <button onClick={handleNewTicket} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white">Criar Ticket</button>
                <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
