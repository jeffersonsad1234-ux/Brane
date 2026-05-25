import React, { useRef } from "react";
import { motion } from "framer-motion";

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

const accentColors = {
  video: "#8b5cf6",
  analytics: "#10b981",
  design: "#f97316",
  social: "#3b82f6",
  ai: "#a855f7",
  marketing: "#f59e0b",
  seo: "#14b8a6",
  code: "#6366f1",
};

const glowColors = {
  video: "rgba(139,92,246,0.15)",
  analytics: "rgba(16,185,129,0.15)",
  design: "rgba(249,115,22,0.15)",
  social: "rgba(59,130,246,0.15)",
  ai: "rgba(168,85,247,0.15)",
  marketing: "rgba(245,158,11,0.15)",
  seo: "rgba(20,184,166,0.15)",
  code: "rgba(99,102,241,0.15)",
};

export default function ToolCard({ tool, index = 0, onClick }) {
  const cardRef = useRef(null);
  const g = gradients[tool.gradient] || gradients.ai;
  const accent = accentColors[tool.gradient] || accentColors.ai;
  const glow = glowColors[tool.gradient] || glowColors.ai;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      onMouseMove={(e) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        if (cardRef.current) {
          cardRef.current.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${y * -6}deg)`;
        }
      }}
      onMouseLeave={() => {
        if (cardRef.current) {
          cardRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
        }
      }}
      onClick={() => onClick?.(tool)}
      className="relative group cursor-pointer rounded-2xl overflow-hidden"
      style={{ minHeight: 160 }}
    >
      {/* Glow effect */}
      <div
        className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
        style={{ background: glow }}
      />

      {/* Card body */}
      <div
        ref={cardRef}
        className="relative h-full rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: g,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Glassmorphism overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 60%)",
            backdropFilter: "blur(1px)",
          }}
        />

        {/* Hover gradient border */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            border: "1px solid transparent",
            backgroundImage: `linear-gradient(135deg, ${accent}88, transparent 50%, ${accent}44)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-5 flex flex-col h-full">
          {/* Icon area */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: `linear-gradient(135deg, ${accent}33, transparent)`,
                border: `1px solid ${accent}22`,
              }}
            >
              {tool.icon}
            </div>
            <div>
              <h3
                className="text-sm font-semibold tracking-tight"
                style={{ color: "rgba(255,255,255,0.9)" }}
              >
                {tool.title}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p
            className="text-xs leading-relaxed flex-1"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {tool.description}
          </p>

          {/* Bottom accent bar */}
          <div
            className="mt-3 h-px w-8 rounded-full transition-all duration-300 group-hover:w-full"
            style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
          />
        </div>

        {/* Corner decoration */}
        <div
          className="absolute -top-6 -right-6 w-12 h-12 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
        />
      </div>
    </motion.div>
  );
}
