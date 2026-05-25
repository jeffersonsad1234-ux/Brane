import React, { useRef } from "react";
import { motion } from "framer-motion";

const TOOLS = [
  {
    id: "script",
    title: "Roteiro para Vídeo",
    description: "Criar roteiro viral para TikTok, Reels e Shorts com estrutura profissional de storytelling.",
    tag: "Vídeo",
    image: "https://images.unsplash.com/photo-1536240478700-b869070f7209?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie um roteiro curto para um vídeo de produto no TikTok",
  },
  {
    id: "copy",
    title: "Copywriting Premium",
    description: "Otimizar descrições e anúncios com técnicas de copywriting persuasivo e conversão.",
    tag: "Design",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&auto=format&fit=crop",
    prompt: "Melhore esta descrição de produto para conversão: ",
  },
  {
    id: "ideas",
    title: "Conteúdo Viral",
    description: "Gerar ideias criativas para afiliados e redes sociais com alto potencial de engajamento.",
    tag: "Social",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80&auto=format&fit=crop",
    prompt: "Me dê 5 ideias de conteúdo para afiliados",
  },
  {
    id: "seo",
    title: "SEO Inteligente",
    description: "Estratégia completa de otimização para mecanismos de busca com análise de palavras-chave.",
    tag: "SEO",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie uma estratégia de SEO para um ecommerce de moda",
  },
  {
    id: "prompt",
    title: "Engenharia de Prompt",
    description: "Criar prompts profissionais para gerar anúncios, campanhas e conteúdo com IA generativa.",
    tag: "IA",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80&auto=format&fit=crop",
    prompt: "Monte um prompt profissional para criar um anúncio do Facebook",
  },
  {
    id: "analytics",
    title: "Análise de Mercado",
    description: "Analisar concorrentes, tendências e métricas com insights acionáveis para o negócio.",
    tag: "Dados",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&auto=format&fit=crop",
    prompt: "Analise um concorrente e sugira melhorias para o negócio",
  },
  {
    id: "marketing",
    title: "Growth Marketing",
    description: "Estratégias completas de marketing digital para lançamentos, produtos e campanhas.",
    tag: "Marketing",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie uma estratégia de marketing digital para um produto digital",
  },
  {
    id: "code",
    title: "Gerador de Código",
    description: "Código pronto para landing pages, ferramentas e componentes com as melhores práticas.",
    tag: "Dev",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80&auto=format&fit=crop",
    prompt: "Gere um código HTML/CSS para uma landing page de produto",
  },
  {
    id: "brand",
    title: "Identidade Visual",
    description: "Definir paleta de cores, tipografia e estilo visual para marcas e produtos digitais.",
    tag: "Branding",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie uma identidade visual para uma marca de produtos naturais",
  },
];

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "video", label: "Vídeo" },
  { id: "social", label: "Social" },
  { id: "ia", label: "IA" },
  { id: "dados", label: "Dados" },
  { id: "design", label: "Design" },
];

export default function ToolGrid({ onSelectTool, activeCategory, onCategoryChange }) {
  const filtered = activeCategory && activeCategory !== "all"
    ? TOOLS.filter((t) => {
        const tag = t.tag.toLowerCase();
        const cat = activeCategory.toLowerCase();
        if (cat === "video") return tag === "vídeo" || tag === "video";
        if (cat === "social") return tag === "social";
        if (cat === "ia") return tag === "ia";
        if (cat === "dados") return tag === "dados" || tag === "seo";
        if (cat === "design") return tag === "design" || tag === "branding";
        return true;
      })
    : TOOLS;

  return (
    <div className="w-full">
      {/* Category pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none justify-center">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onCategoryChange?.(cat.id)}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              background: (activeCategory === cat.id || (!activeCategory && cat.id === "all"))
                ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))"
                : "rgba(255,255,255,0.04)",
              color: (activeCategory === cat.id || (!activeCategory && cat.id === "all"))
                ? "rgba(255,255,255,0.9)"
                : "rgba(255,255,255,0.4)",
              border: (activeCategory === cat.id || (!activeCategory && cat.id === "all"))
                ? "1px solid rgba(99,102,241,0.25)"
                : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {cat.label}
          </motion.button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tool, i) => (
          <ToolCard key={tool.id} tool={tool} index={i} onClick={onSelectTool} />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ tool, index, onClick }) {
  const cardRef = useRef(null);
  const [loaded, setLoaded] = React.useState(false);

  const accentMap = {
    "Vídeo": "#8b5cf6", "Design": "#f97316", "Social": "#3b82f6",
    "SEO": "#14b8a6", "IA": "#a855f7", "Dados": "#10b981",
    "Marketing": "#f59e0b", "Dev": "#6366f1", "Branding": "#ec4899",
  };
  const accent = accentMap[tool.tag] || "#6366f1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      onMouseMove={(e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        if (cardRef.current) {
          cardRef.current.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${y * -6}deg) translateZ(10px)`;
        }
      }}
      onMouseLeave={() => {
        if (cardRef.current) cardRef.current.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
      }}
      onClick={() => onClick?.(tool)}
      className="relative group cursor-pointer rounded-2xl overflow-hidden"
      style={{ aspectRatio: "4/3", minHeight: 260 }}
    >
      {/* Glow background */}
      <div
        className="absolute -inset-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${accent}22 0%, transparent 70%)` }}
      />

      {/* Card */}
      <div
        ref={cardRef}
        className="relative w-full h-full rounded-2xl overflow-hidden transition-all duration-200"
        style={{
          transformStyle: "preserve-3d",
          boxShadow: "0 4px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={tool.image}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
            style={{ opacity: loaded ? 1 : 0 }}
          />
          {/* Loading placeholder */}
          {!loaded && (
            <div className="absolute inset-0" style={{ background: "rgba(15,15,15,0.9)" }} />
          )}
          {/* Dark overlay */}
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.85) 100%)",
            }}
          />
          {/* Glass overlay on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ backdropFilter: "blur(2px)", background: "rgba(0,0,0,0.1)" }}
          />
        </div>

        {/* Hover gradient border */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"
          style={{
            border: "1px solid transparent",
            backgroundImage: `linear-gradient(135deg, ${accent}99, transparent 40%, ${accent}33)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Content overlay */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-5">
          {/* Tag badge */}
          <div
            className="absolute top-4 left-4 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: `${accent}22`,
              color: accent,
              border: `1px solid ${accent}33`,
              backdropFilter: "blur(8px)",
            }}
          >
            {tool.tag}
          </div>

          <motion.div
            initial={false}
            className="transition-all duration-300"
            style={{ transform: "translateZ(20px)" }}
          >
            <h3
              className="text-lg font-bold mb-1.5 leading-tight"
              style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
            >
              {tool.title}
            </h3>
            <p
              className="text-xs leading-relaxed mb-3 max-w-[90%]"
              style={{ color: "rgba(255,255,255,0.6)", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
            >
              {tool.description}
            </p>

            {/* Open button - visible on hover */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300"
              style={{ transform: "translateZ(30px)" }}
            >
              <div
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  color: "white",
                  boxShadow: `0 4px 15px ${accent}44`,
                }}
              >
                Abrir ferramenta
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Corner glow */}
        <div
          className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-0 group-hover:opacity-60 transition-all duration-700 pointer-events-none z-10"
          style={{ background: `radial-gradient(circle, ${accent}44, transparent 70%)` }}
        />

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
            opacity: 0.6,
          }}
        />
      </div>
    </motion.div>
  );
}
