import React from "react";
import { motion } from "framer-motion";

const TOOLS = [
  {
    id: "script",
    title: "Criar Roteiro",
    description: "Roteiros prontos para TikTok, Reels e YouTube Shorts",
    icon: "🎬",
    gradient: "video",
    prompt: "Crie um roteiro curto para um vídeo de produto no TikTok",
  },
  {
    id: "copy",
    title: "Melhorar Copy",
    description: "Otimize descrições de produtos com copywriting persuasivo",
    icon: "✍️",
    gradient: "design",
    prompt: "Melhore esta descrição de produto para conversão: ",
  },
  {
    id: "ideas",
    title: "Ideias Virais",
    description: "Conteúdo criativo para afiliados e redes sociais",
    icon: "🚀",
    gradient: "social",
    prompt: "Me dê 5 ideias de conteúdo para afiliados",
  },
  {
    id: "seo",
    title: "Estratégia SEO",
    description: "Otimização completa para mecanismos de busca",
    icon: "📈",
    gradient: "seo",
    prompt: "Crie uma estratégia de SEO para um ecommerce de moda",
  },
  {
    id: "prompt",
    title: "Prompt AI",
    description: "Prompts profissionais para gerar anúncios e campanhas",
    icon: "🤖",
    gradient: "ai",
    prompt: "Monte um prompt profissional para criar um anúncio do Facebook",
  },
  {
    id: "analyze",
    title: "Analytics",
    description: "Análise de concorrentes e sugestões de melhoria",
    icon: "📊",
    gradient: "analytics",
    prompt: "Analise um concorrente e sugira melhorias para o negócio",
  },
  {
    id: "marketing",
    title: "Marketing Digital",
    description: "Estratégias completas de marketing para afiliados",
    icon: "🎯",
    gradient: "marketing",
    prompt: "Crie uma estratégia de marketing digital para um produto digital",
  },
  {
    id: "code",
    title: "Gerar Código",
    description: "Código pronto para landing pages e ferramentas",
    icon: "⚡",
    gradient: "code",
    prompt: "Gere um código HTML/CSS para uma landing page de produto",
  },
];

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "video", label: "Vídeo" },
  { id: "social", label: "Social" },
  { id: "ai", label: "AI" },
  { id: "analytics", label: "Dados" },
];

export default function ToolGrid({ onSelectTool, activeCategory, onCategoryChange }) {
  const filtered = activeCategory && activeCategory !== "all"
    ? TOOLS.filter((t) => t.gradient === activeCategory)
    : TOOLS;

  return (
    <div className="w-full">
      {/* Category pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onCategoryChange?.(cat.id)}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              background: activeCategory === cat.id || (!activeCategory && cat.id === "all")
                ? "rgba(59,130,246,0.15)"
                : "rgba(255,255,255,0.04)",
              color: activeCategory === cat.id || (!activeCategory && cat.id === "all")
                ? "rgba(59,130,246,0.9)"
                : "rgba(255,255,255,0.5)",
              border: activeCategory === cat.id || (!activeCategory && cat.id === "all")
                ? "1px solid rgba(59,130,246,0.2)"
                : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
            {cat.label}
          </motion.button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((tool, i) => (
          <ToolCardInner key={tool.id} tool={tool} index={i} onClick={onSelectTool} />
        ))}
      </div>
    </div>
  );
}

function ToolCardInner({ tool, index, onClick }) {
  const cardRef = React.useRef(null);

  const gradients = {
    video: "linear-gradient(135deg, #1a0533 0%, #0d1b3e 50%, #0a0a1a 100%)",
    analytics: "linear-gradient(135deg, #0a1a0a 0%, #0d2d1a 50%, #0a0a0a 100%)",
    design: "linear-gradient(135deg, #1a0a0a 0%, #3d1a0d 50%, #0a0a0a 100%)",
    social: "linear-gradient(135deg, #001a2d 0%, #0d1a3d 50%, #0a0a0a 100%)",
    ai: "linear-gradient(135deg, #0d0a1a 0%, #1a0d3d 50%, #0a0a0a 100%)",
    marketing: "linear-gradient(135deg, #1a0d00 0%, #3d1a00 50%, #0a0a0a 100%)",
    seo: "linear-gradient(135deg, #001a0d 0%, #0d2d1a 50%, #0a0a0a 100%)",
    code: "linear-gradient(135deg, #0d0d1a 0%, #1a1a3d 50%, #0a0a0a 100%)",
  };

  const accent = {
    video: "#8b5cf6", analytics: "#10b981", design: "#f97316",
    social: "#3b82f6", ai: "#a855f7", marketing: "#f59e0b",
    seo: "#14b8a6", code: "#6366f1",
  }[tool.gradient] || "#a855f7";

  const glow = {
    video: "rgba(139,92,246,0.15)", analytics: "rgba(16,185,129,0.15)",
    design: "rgba(249,115,22,0.15)", social: "rgba(59,130,246,0.15)",
    ai: "rgba(168,85,247,0.15)", marketing: "rgba(245,158,11,0.15)",
    seo: "rgba(20,184,166,0.15)", code: "rgba(99,102,241,0.15)",
  }[tool.gradient] || "rgba(168,85,247,0.15)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      onMouseMove={(e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        if (cardRef.current) cardRef.current.style.transform = `perspective(800px) rotateY(${x * 5}deg) rotateX(${y * -5}deg)`;
      }}
      onMouseLeave={() => { if (cardRef.current) cardRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)"; }}
      onClick={() => onClick?.(tool)}
      className="relative group cursor-pointer rounded-xl overflow-hidden"
    >
      <div className="absolute -inset-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none" style={{ background: glow }} />
      <div
        ref={cardRef}
        className="relative rounded-xl overflow-hidden transition-all duration-200"
        style={{
          background: gradients[tool.gradient] || gradients.ai,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 60%)", backdropFilter: "blur(1px)" }}
        />
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            border: "1px solid transparent",
            backgroundImage: `linear-gradient(135deg, ${accent}88, transparent 50%, ${accent}33)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: `linear-gradient(135deg, ${accent}33, transparent)`, border: `1px solid ${accent}22` }}
            >
              {tool.icon}
            </div>
            <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              {tool.title}
            </h3>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
            {tool.description}
          </p>
          <div className="mt-2.5 h-px w-6 rounded-full transition-all duration-300 group-hover:w-full"
            style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
          />
        </div>
        <div className="absolute -top-5 -right-5 w-10 h-10 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
        />
      </div>
    </motion.div>
  );
}
