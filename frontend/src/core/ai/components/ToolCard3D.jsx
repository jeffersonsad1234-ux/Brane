import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

const COLORS = {
  purple: { base: "#8b5cf6", glow: "rgba(139,92,246,0.15)" },
  blue: { base: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
  green: { base: "#10b981", glow: "rgba(16,185,129,0.15)" },
  orange: { base: "#f97316", glow: "rgba(249,115,22,0.15)" },
  pink: { base: "#ec4899", glow: "rgba(236,72,153,0.15)" },
  cyan: { base: "#06b6d4", glow: "rgba(6,182,212,0.15)" },
  indigo: { base: "#6366f1", glow: "rgba(99,102,241,0.15)" },
  amber: { base: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
  teal: { base: "#14b8a6", glow: "rgba(20,184,166,0.15)" },
  red: { base: "#ef4444", glow: "rgba(239,68,68,0.12)" },
  violet: { base: "#a855f7", glow: "rgba(168,85,247,0.15)" },
  emerald: { base: "#34d399", glow: "rgba(52,211,153,0.15)" },
  sky: { base: "#0ea5e9", glow: "rgba(14,165,233,0.15)" },
  rose: { base: "#f43f5e", glow: "rgba(244,63,94,0.12)" },
  yellow: { base: "#eab308", glow: "rgba(234,179,8,0.15)" },
  lime: { base: "#84cc16", glow: "rgba(132,204,22,0.12)" },
};

const FALLBACK_GRADIENTS = {
  purple: "linear-gradient(135deg, #1a0533, #0d1b3e, #0a0a1a)",
  blue: "linear-gradient(135deg, #001a2d, #0d1a3d, #0a0a0a)",
  green: "linear-gradient(135deg, #0a1a0a, #0d2d1a, #0a0a0a)",
  orange: "linear-gradient(135deg, #1a0d00, #3d1a00, #0a0a0a)",
  pink: "linear-gradient(135deg, #1a0a1a, #3d0d1a, #0a0a0a)",
  cyan: "linear-gradient(135deg, #001a1a, #0d1a2d, #0a0a0a)",
  indigo: "linear-gradient(135deg, #0d0d1a, #1a1a3d, #0a0a0a)",
  amber: "linear-gradient(135deg, #1a0d00, #2d1a00, #0a0a0a)",
  teal: "linear-gradient(135deg, #001a0d, #0d2d1a, #0a0a0a)",
  red: "linear-gradient(135deg, #1a0505, #3d0d0d, #0a0a0a)",
  violet: "linear-gradient(135deg, #0d0520, #1a0d3d, #0a0a0a)",
  emerald: "linear-gradient(135deg, #051a0d, #0d2d1a, #0a0a0a)",
  sky: "linear-gradient(135deg, #001a2d, #0d1a3d, #0a0a0a)",
  rose: "linear-gradient(135deg, #1a0505, #3d0d1a, #0a0a0a)",
  yellow: "linear-gradient(135deg, #1a0d00, #2d1a00, #0a0a0a)",
  lime: "linear-gradient(135deg, #051a00, #0d2d00, #0a0a0a)",
};

export default function ToolCard3D({ tool, index = 0, onClick }) {
  const cardRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const color = COLORS[tool.color] || COLORS.indigo;
  const fallback = FALLBACK_GRADIENTS[tool.color] || FALLBACK_GRADIENTS.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
      onClick={() => onClick?.(tool)}
      className="relative group cursor-pointer rounded-2xl overflow-hidden"
      style={{ aspectRatio: "3/4", minHeight: 300 }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -inset-8 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${color.glow}, transparent 70%)` }}
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
          {!imgError && (
            <img
              src={tool.image}
              alt=""
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              style={{ opacity: imgLoaded ? 1 : 0 }}
            />
          )}
          {/* Fallback gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: (imgError || !imgLoaded) ? fallback : "none",
              opacity: (imgError || !imgLoaded) ? 1 : 0,
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
          {/* Glass hover overlay */}
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
            backgroundImage: `linear-gradient(135deg, ${color.base}aa, transparent 40%, ${color.base}44)`,
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
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: `linear-gradient(135deg, ${color.base}33, transparent)`,
                border: `1px solid ${color.base}33`,
                backdropFilter: "blur(8px)",
              }}
            >
              {tool.icon}
            </div>
            <div
              className="px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-widest"
              style={{
                background: `${color.base}22`,
                color: color.base,
                border: `1px solid ${color.base}33`,
                backdropFilter: "blur(8px)",
              }}
            >
              {tool.tag}
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
              {tool.title}
            </h3>
            <p
              className="text-[11px] leading-relaxed mb-3 max-w-[90%]"
              style={{
                color: "rgba(255,255,255,0.5)",
                textShadow: "0 1px 6px rgba(0,0,0,0.4)",
              }}
            >
              {tool.description}
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
                  background: `linear-gradient(135deg, ${color.base}, ${color.base}bb)`,
                  color: "white",
                  boxShadow: `0 4px 16px ${color.base}44`,
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
          style={{ background: `radial-gradient(circle, ${color.base}33, transparent 70%)` }}
        />

        {/* Bottom accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 z-10"
          style={{
            background: `linear-gradient(90deg, transparent, ${color.base}99, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}
