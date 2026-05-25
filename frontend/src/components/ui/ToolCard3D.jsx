import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

const FALLBACK_GRADIENTS = {
  create: "linear-gradient(135deg, #1a0533, #0d1b3e, #0a0a1a)",
  ai: "linear-gradient(135deg, #0a0a2d, #0d1a3d, #050510)",
  business: "linear-gradient(135deg, #0a1a0a, #0d2d1a, #050505)",
  marketing: "linear-gradient(135deg, #1a0d00, #2d1a00, #0a0a0a)",
  developer: "linear-gradient(135deg, #0d0d1a, #1a1a3d, #0a0a0a)",
  media: "linear-gradient(135deg, #1a0a1a, #2d0d1a, #0a0a0a)",
  productivity: "linear-gradient(135deg, #001a0d, #0d2d1a, #0a0a0a)",
  automation: "linear-gradient(135deg, #0d0520, #1a0d3d, #0a0a0a)",
  cloud: "linear-gradient(135deg, #001a2d, #0d1a3d, #0a0a0a)",
  future: "linear-gradient(135deg, #05051a, #0d0d3d, #0a0a0a)",
};

const TOOL_COLORS = {
  create: "#a855f7", ai: "#6366f1", business: "#10b981", marketing: "#f97316",
  developer: "#3b82f6", media: "#ec4899", productivity: "#14b8a6", automation: "#8b5cf6",
  cloud: "#06b6d4", future: "#f59e0b",
};

const TOOL_IMAGES = {
  "image-studio": "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&q=80&auto=format",
  "logo-studio": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80&auto=format",
  "mockup-studio": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80&auto=format",
  "brand-studio": "https://images.unsplash.com/photo-1560472355-b422c19f6e7c?w=600&q=80&auto=format",
  "canva-editor": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80&auto=format",
  "photoshop-editor": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&auto=format",
  "ai-art": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80&auto=format",
  "studio-3d": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80&auto=format",
  chat: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80&auto=format",
  "code-generator": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80&auto=format",
  "code-studio": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80&auto=format",
  "site-builder": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&auto=format",
  "app-builder": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80&auto=format",
  "video-studio": "https://images.unsplash.com/photo-1536240478700-b869070f7209?w=600&q=80&auto=format",
  "movie-studio": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80&auto=format",
  "animation-studio": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80&auto=format",
  "social-publisher": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80&auto=format",
  "seo-studio": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format",
  copywriting: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80&auto=format",
  analytics: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&auto=format",
  "leads-crm": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&auto=format",
  affiliate: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80&auto=format",
  ecommerce: "https://images.unsplash.com/photo-1553729459-afe8f2e3a584?w=600&q=80&auto=format",
  "finance-hub": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80&auto=format",
  "ai-video-gen": "https://images.unsplash.com/photo-1536240478700-b869070f7209?w=600&q=80&auto=format",
  "ai-influencer": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80&auto=format",
};

function getToolImage(app) {
  return TOOL_IMAGES[app.id] || null;
}

export default function ToolCard3D({ app, index = 0, onClick, isFavorite, onToggleFavorite }) {
  const cardRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const color = TOOL_COLORS[app.cat] || "#6366f1";
  const fallback = FALLBACK_GRADIENTS[app.cat] || FALLBACK_GRADIENTS.ai;
  const image = getToolImage(app);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8 }}
      onMouseMove={(e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect || !cardRef.current) return;
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        cardRef.current.style.transform = `perspective(1200px) rotateY(${x * 10}deg) rotateX(${y * -7}deg) translateZ(20px)`;
      }}
      onMouseLeave={() => {
        if (cardRef.current) cardRef.current.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
      }}
      onClick={() => onClick?.(app)}
      className="relative group cursor-pointer rounded-2xl overflow-hidden"
      style={{ aspectRatio: "3/4", minHeight: 280 }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -inset-8 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${color}22, transparent 70%)` }}
      />

      {/* Card body */}
      <div
        ref={cardRef}
        className="relative w-full h-full rounded-2xl overflow-hidden will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease-out",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          {image && !imgError && (
            <img
              src={image}
              alt=""
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              style={{ opacity: imgLoaded ? 1 : 0 }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: (!image || imgError) ? fallback : "none",
              opacity: (!image || imgError) ? 1 : (imgLoaded ? 0 : 1),
              transition: "opacity 0.5s",
            }}
          />
          {/* Dark overlay */}
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.85) 100%)",
            }}
          />
          {/* Glass hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ backdropFilter: "blur(3px) saturate(1.2)", background: "rgba(0,0,0,0.08)" }}
          />
        </div>

        {/* Gradient border on hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-30"
          style={{
            border: "1.5px solid transparent",
            backgroundImage: `linear-gradient(135deg, ${color}aa, transparent 40%, ${color}44)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-4">
          {/* Top: Icon + Badge */}
          <div className="flex items-start justify-between">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: `linear-gradient(135deg, ${color}33, transparent)`,
                border: `1px solid ${color}33`,
                backdropFilter: "blur(8px)",
              }}
            >
              {app.icon}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(app.id); }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                  isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                }`}
                style={{ background: `${color}22`, border: `1px solid ${color}33` }}
              >
                {isFavorite ? "★" : "☆"}
              </button>
              <div
                className="px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-widest"
                style={{
                  background: `${color}22`,
                  color: color,
                  border: `1px solid ${color}33`,
                  backdropFilter: "blur(8px)",
                }}
              >
                {app.cat}
              </div>
            </div>
          </div>

          {/* Bottom: Title + Desc + Button */}
          <div style={{ transform: "translateZ(30px)" }}>
            <h3
              className="text-base sm:text-lg font-bold mb-1 leading-tight"
              style={{
                color: "rgba(255,255,255,0.95)",
                textShadow: "0 2px 12px rgba(0,0,0,0.6)",
              }}
            >
              {app.name}
            </h3>
            <p
              className="text-[11px] leading-relaxed mb-3 max-w-[90%]"
              style={{
                color: "rgba(255,255,255,0.5)",
                textShadow: "0 1px 6px rgba(0,0,0,0.4)",
              }}
            >
              {app.desc || ""}
            </p>

            {/* Button - appears on hover */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300"
              style={{ transform: "translateZ(40px)" }}
            >
              <div
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                  color: "white",
                  boxShadow: `0 4px 16px ${color}44`,
                }}
              >
                Abrir
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Corner glow */}
        <div
          className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-0 group-hover:opacity-60 transition-all duration-700 pointer-events-none z-10"
          style={{ background: `radial-gradient(circle, ${color}33, transparent 70%)` }}
        />

        {/* Bottom accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}99, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}
