import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ToolCard3D from "../../../components/ui/ToolCard3D";

const TOOLS = [
  {
    id: "ai-chat", title: "AI Chat", description: "Assistente inteligente com modelos de IA para conversas, análises e criação de conteúdo.",
    tag: "IA", icon: "🤖", color: "blue",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80&auto=format&fit=crop",
    prompt: "Vamos conversar sobre seu projeto",
  },
  {
    id: "video-editor", title: "Video Editor", description: "Edição profissional com IA para criar vídeos virais e conteúdo cinematográfico.",
    tag: "Vídeo", icon: "🎬", color: "purple",
    image: "https://images.unsplash.com/photo-1536240478700-b869070f7209?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie um roteiro para vídeo de produto",
  },
  {
    id: "image-studio", title: "Image Studio", description: "Gere e edite imagens com IA para campanhas, posts e branding visual.",
    tag: "Design", icon: "🎨", color: "pink",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie uma imagem para post de Instagram",
  },
  {
    id: "photoshop-editor", title: "Photoshop Editor", description: "Edição avançada de fotos com remoção de fundo, ajustes e filtros inteligentes.",
    tag: "Design", icon: "🖌️", color: "violet",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&auto=format&fit=crop",
    prompt: "Edite esta foto profissionalmente",
  },
  {
    id: "canva-builder", title: "Canva Builder", description: "Monte designs profissionais para redes sociais, apresentações e marketing.",
    tag: "Design", icon: "✨", color: "indigo",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie um design para post de Instagram",
  },
  {
    id: "logo-studio", title: "Logo Studio", description: "Crie logos profissionais com IA para sua marca ou empresa em segundos.",
    tag: "Branding", icon: "⭐", color: "teal",
    image: "https://images.unsplash.com/photo-1560472355-b422c19f6e7c?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie um logo profissional para minha marca",
  },
  {
    id: "marketing-agent", title: "Marketing Agent", description: "Automatize campanhas de marketing com estratégias inteligentes e multicanal.",
    tag: "Marketing", icon: "📢", color: "orange",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie uma estratégia de marketing digital",
  },
  {
    id: "seo-studio", title: "SEO Studio", description: "Otimize seu site para mecanismos de busca com análise de palavras-chave e conteúdo.",
    tag: "SEO", icon: "📈", color: "green",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop",
    prompt: "Análise SEO completa para meu site",
  },
  {
    id: "copywriting-ai", title: "Copywriting AI", description: "Copywriting persuasivo com IA para anúncios, landing pages e vendas.",
    tag: "Escrita", icon: "✍️", color: "amber",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80&auto=format&fit=crop",
    prompt: "Escreva um copy persuasivo para anúncio",
  },
  {
    id: "social-publisher", title: "Social Publisher", description: "Publique e agende conteúdo em múltiplas redes sociais com um clique.",
    tag: "Social", icon: "📱", color: "cyan",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie um post para redes sociais",
  },
  {
    id: "code-studio", title: "Code Studio", description: "Ambiente de desenvolvimento com IA para gerar código, debugar e otimizar.",
    tag: "Dev", icon: "💻", color: "sky",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80&auto=format&fit=crop",
    prompt: "Gere código para uma feature específica",
  },
  {
    id: "workflow-engine", title: "Workflow Engine", description: "Automatize processos de negócio com fluxos de trabalho inteligentes.",
    tag: "Automação", icon: "⚡", color: "lime",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie um workflow de automação",
  },
  {
    id: "app-builder", title: "App Builder", description: "Construa aplicativos móveis e web com interface drag-and-drop e IA.",
    tag: "Dev", icon: "📱", color: "emerald",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie um aplicativo para minha ideia",
  },
  {
    id: "website-builder", title: "Website Builder", description: "Crie sites profissionais com templates inteligentes e otimização integrada.",
    tag: "Web", icon: "🌐", color: "blue",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&auto=format&fit=crop",
    prompt: "Crie um site profissional para meu negócio",
  },
  {
    id: "payment-center", title: "Payment Center", description: "Gestão de pagamentos, assinaturas e faturamento recorrente para seu negócio.",
    tag: "Finanças", icon: "💰", color: "green",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80&auto=format&fit=crop",
    prompt: "Configure pagamentos para minha plataforma",
  },
  {
    id: "crm", title: "CRM", description: "Gerencie clientes, vendas e relacionamento com dashboard inteligente e automação.",
    tag: "Vendas", icon: "👥", color: "indigo",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&auto=format&fit=crop",
    prompt: "Gestão de clientes e vendas",
  },
];

const CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "ia", label: "IA" },
  { id: "design", label: "Design" },
  { id: "video", label: "Vídeo" },
  { id: "social", label: "Social" },
  { id: "dev", label: "Dev" },
  { id: "marketing", label: "Marketing" },
  { id: "branding", label: "Branding" },
];

export default function ToolGrid({ onSelectTool, activeCategory, onCategoryChange }) {
  const filtered = activeCategory && activeCategory !== "all"
    ? TOOLS.filter((t) => {
        const tag = t.tag.toLowerCase();
        const cat = activeCategory.toLowerCase();
        if (cat === "video") return tag === "vídeo" || tag === "video";
        if (cat === "social") return tag === "social";
        if (cat === "ia") return tag === "ia";
        if (cat === "dev") return ["dev", "web", "automação"].includes(tag);
        if (cat === "design") return ["design", "branding"].includes(tag);
        if (cat === "marketing") return ["marketing", "vendas", "seo", "escrita", "finanças"].includes(tag);
        if (cat === "branding") return tag === "branding";
        return true;
      })
    : TOOLS;

  return (
    <div className="w-full">
      {/* Category pills */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none justify-center">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id || (!activeCategory && cat.id === "all");
          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange?.(cat.id)}
              className="px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))"
                  : "rgba(255,255,255,0.04)",
                color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
                border: isActive
                  ? "1px solid rgba(99,102,241,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(8px)",
              }}
            >
              {cat.label}
            </motion.button>
          );
        })}
      </div>

      {/* Grid: 4 cols desktop, 2 tablet, 1 mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((tool, i) => (
            <ToolCard3D key={tool.id} app={{ id: tool.id, name: tool.title, desc: tool.description, cat: tool.tag.toLowerCase(), icon: tool.icon }} index={i} onClick={onSelectTool} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            Nenhuma ferramenta encontrada nessa categoria.
          </p>
        </motion.div>
      )}
    </div>
  );
}
