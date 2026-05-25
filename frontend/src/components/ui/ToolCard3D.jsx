import React, { useRef, useState, useMemo } from "react";
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

const UNSPLASH_POOL = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80",
  "https://images.unsplash.com/photo-1536240478700-b869070f7209?w=600&q=80",
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
  "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&q=80",
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80",
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80",
  "https://images.unsplash.com/photo-1553729459-afe8f2e3a584?w=600&q=80",
  "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80",
  "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80",
  "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80",
  "https://images.unsplash.com/photo-1560472355-b422c19f6e7c?w=600&q=80",
  "https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=600&q=80",
  "https://images.unsplash.com/photo-1559526324-4bd87da1d86a?w=600&q=80",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f53?w=600&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80",
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80",
  "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
  "https://images.unsplash.com/photo-1432889821006-3149403ab8c4?w=600&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80",
  "https://images.unsplash.com/photo-1558746818-05e20f3e1993?w=600&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
  "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  "https://images.unsplash.com/photo-1559526324-4bd87da1d86a?w=600&q=80",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80",
  "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&q=80",
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
];

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

const TOOL_IMAGES = {
  chat: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80",
  "image-studio": "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=600&q=80",
  "video-studio": "https://images.unsplash.com/photo-1536240478700-b869070f7209?w=600&q=80",
  "site-builder": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  "code-studio": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80",
  "code-generator": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80",
  "social-publisher": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80",
  "logo-studio": "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80",
  "brand-studio": "https://images.unsplash.com/photo-1560472355-b422c19f6e7c?w=600&q=80",
  "canva-editor": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80",
  "photoshop-editor": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
  "seo-studio": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
  copywriting: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
  analytics: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
  "leads-crm": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  affiliate: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80",
  ecommerce: "https://images.unsplash.com/photo-1553729459-afe8f2e3a584?w=600&q=80",
  "finance-hub": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
  "ai-art": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  "studio-3d": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80",
  "movie-studio": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
  "mockup-studio": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80",
  "app-builder": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80",
};

export default function ToolCard3D({ app, index = 0, onClick, isFavorite, onToggleFavorite }) {
  const cardRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [clicking, setClicking] = useState(false);
  const color = TOOL_COLORS[app.cat] || "#6366f1";
  const fallback = FALLBACK_GRADIENTS[app.cat] || FALLBACK_GRADIENTS.ai;

  const image = useMemo(() => {
    return TOOL_IMAGES[app.id] || UNSPLASH_POOL[hashId(app.id) % UNSPLASH_POOL.length];
  }, [app.id]);

  const handleClick = (e) => {
    setClicking(true);
    setTimeout(() => setClicking(false), 200);
    onClick?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -10, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onMouseMove={(e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect || !cardRef.current) return;
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        cardRef.current.style.transform = `perspective(1200px) rotateY(${x * 12}deg) rotateX(${y * -8}deg) translateZ(25px)`;
      }}
      onMouseLeave={() => {
        if (cardRef.current) cardRef.current.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px)";
      }}
      onClick={handleClick}
      className="relative group cursor-pointer rounded-2xl overflow-hidden select-none"
      style={{ aspectRatio: "3/4", minHeight: 280 }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -inset-8 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${color}33, transparent 70%)` }}
      />

      {/* Card body */}
      <div
        ref={cardRef}
        className="relative w-full h-full rounded-2xl overflow-hidden will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease-out",
          boxShadow: clicking
            ? `0 2px 12px rgba(0,0,0,0.3)`
            : "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          {!imgError && (
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
          {/* Always show fallback gradient until image loads or on error */}
          <div
            className="absolute inset-0"
            style={{
              background: imgError || !imgLoaded ? fallback : "none",
              opacity: imgError || !imgLoaded ? 1 : 0,
              transition: "opacity 0.6s",
            }}
          />
          {/* Dark overlay */}
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.85) 100%)",
            }}
          />
          {/* Glass hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ backdropFilter: "blur(4px) saturate(1.3)", background: "rgba(0,0,0,0.1)" }}
          />
        </div>

        {/* Gradient border */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-30"
          style={{
            border: "2px solid transparent",
            backgroundImage: `linear-gradient(135deg, ${color}cc, transparent 40%, ${color}55)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-5">
          {/* Top: Icon + Badge */}
          <div className="flex items-start justify-between">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: `linear-gradient(135deg, ${color}44, transparent)`,
                border: `1px solid ${color}44`,
                backdropFilter: "blur(8px)",
              }}
            >
              {app.icon}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(app.id); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                  isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                } hover:scale-110`}
                style={{ background: `${color}22`, border: `1px solid ${color}33` }}
              >
                {isFavorite ? "★" : "☆"}
              </button>
              <div
                className="px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-widest"
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
          <div style={{ transform: "translateZ(35px)" }}>
            <h3
              className="text-lg sm:text-xl font-bold mb-1.5 leading-tight"
              style={{
                color: "rgba(255,255,255,0.95)",
                textShadow: "0 2px 16px rgba(0,0,0,0.7)",
              }}
            >
              {app.name}
            </h3>
            <p
              className="text-xs leading-relaxed mb-4 max-w-[90%]"
              style={{
                color: "rgba(255,255,255,0.5)",
                textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              }}
            >
              {app.desc || ""}
            </p>

            {/* Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300"
              style={{ transform: "translateZ(50px)" }}
            >
              <div
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                  color: "white",
                  boxShadow: `0 4px 20px ${color}55`,
                }}
              >
                Abrir ferramenta
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Corner glow */}
        <div
          className="absolute -top-12 -right-12 w-28 h-28 rounded-full opacity-0 group-hover:opacity-70 transition-all duration-700 pointer-events-none z-10"
          style={{ background: `radial-gradient(circle, ${color}44, transparent 70%)` }}
        />

        {/* Bottom accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}aa, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}
