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

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = ((h << 5) - h) + id.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

/* ─── SVG Thumbnail Generator ───
 * Generates a unique, premium-looking abstract art SVG for each tool.
 * Deterministic: same tool ID always produces the same SVG.
 * No external dependencies, no duplicates, instant loading. */
function generateToolSvg(id, cat) {
  const h = hashId(id + cat);
  const color = TOOL_COLORS[cat] || "#6366f1";
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0,2), 16);
  const g = parseInt(hex.substring(2,4), 16);
  const b = parseInt(hex.substring(4,6), 16);
  const bgHue = (h % 24) * 15;
  const comp = h % 8;

  // Helper: generate deterministic positions
  const px = (shift, min, range) => min + ((h >> shift) % range);
  const op = (shift) => 0.06 + ((h >> shift) % 5) * 0.04;

  let shapes = "";

  // Composition types
  if (comp === 0) {
    // Radiant circles
    for (let i = 0; i < 4; i++) {
      const cx = px(i * 3, 30, 340);
      const cy = px(i * 3 + 1, 30, 340);
      const cr = 30 + ((h >> (i * 2)) % 80);
      shapes += `<circle cx="${cx}" cy="${cy}" r="${cr}" fill="rgba(${r},${g},${b},${op(i * 2)})"/>`;
    }
  } else if (comp === 1) {
    // Diagonal bars
    for (let i = 0; i < 5; i++) {
      const y = 10 + i * 85 + ((h >> (i * 2)) % 20);
      const w = 60 + ((h >> (i * 2 + 1)) % 100);
      shapes += `<rect x="${400 - w - ((h >> i) % 60)}" y="${y}" width="${w}" height="30" rx="15" fill="rgba(${r},${g},${b},${op(i * 3)})"/>`;
    }
  } else if (comp === 2) {
    // Corner glow
    shapes += `<circle cx="${px(0, 20, 160)}" cy="${px(1, 20, 160)}" r="${80 + (h % 60)}" fill="rgba(${r},${g},${b},0.08)"/>`;
    shapes += `<circle cx="${px(2, 220, 160)}" cy="${px(3, 220, 160)}" r="${60 + ((h >> 4) % 50)}" fill="rgba(${r},${g},${b},0.1)"/>`;
    shapes += `<circle cx="${px(4, 60, 100)}" cy="${px(5, 60, 100)}" r="${40 + ((h >> 8) % 40)}" fill="rgba(${r},${g},${b},0.06)"/>`;
  } else if (comp === 3) {
    // Grid dots
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const dotR = ((h >> (x + y * 8)) % 2 === 0) ? 3 + ((h >> (x * 2)) % 4) : 1;
        const dotOp = ((h >> (x + y * 3)) % 3 === 0) ? 0.15 : 0.05;
        shapes += `<circle cx="${30 + x * 48}" cy="${30 + y * 48}" r="${dotR}" fill="rgba(${r},${g},${b},${dotOp})"/>`;
      }
    }
  } else if (comp === 4) {
    // Wave lines
    for (let i = 0; i < 6; i++) {
      const y = 20 + i * 65;
      const w = 200 + ((h >> (i * 2)) % 160);
      shapes += `<path d="M${400 - w},${y} Q${200},${y + 15 + ((h >> i) % 20)} ${w},${y}" stroke="rgba(${r},${g},${b},${op(i * 2)})" stroke-width="${4 + ((h >> (i * 3)) % 6)}" fill="none" stroke-linecap="round"/>`;
    }
  } else if (comp === 5) {
    // Hex pattern
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cx = 50 + col * 80 + (row % 2) * 40;
        const cy = 40 + row * 80;
        const side = 8 + ((h >> (row + col)) % 12);
        const pts = [];
        for (let a = 0; a < 6; a++) {
          const angle = (Math.PI / 3) * a - Math.PI / 6;
          pts.push(`${cx + side * Math.cos(angle)},${cy + side * Math.sin(angle)}`);
        }
        const hexOp = ((h >> (row * 5 + col)) % 2 === 0) ? 0.12 : 0.04;
        shapes += `<polygon points="${pts.join(" ")}" fill="none" stroke="rgba(${r},${g},${b},${hexOp})" stroke-width="1"/>`;
      }
    }
  } else if (comp === 6) {
    // Pulse rings
    for (let i = 0; i < 5; i++) {
      const cx = 100 + ((h >> (i * 2)) % 200);
      const cy = 100 + ((h >> (i * 2 + 1)) % 200);
      const ringR = 20 + i * 25 + ((h >> (i * 3)) % 15);
      shapes += `<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="rgba(${r},${g},${b},${0.08 + i * 0.02})" stroke-width="${3 + i}"/>`;
    }
  } else {
    // Asymmetric composition
    shapes += `<rect x="${px(0, 10, 200)}" y="${px(1, 10, 200)}" width="${px(2, 80, 180)}" height="${px(3, 80, 180)}" rx="${px(4, 10, 40)}" fill="rgba(${r},${g},${b},${op(1)})"/>`;
    shapes += `<circle cx="${px(5, 180, 180)}" cy="${px(6, 180, 180)}" r="${px(7, 50, 100)}" fill="rgba(${r},${g},${b},${op(2)})"/>`;
    shapes += `<circle cx="${px(8, 50, 100)}" cy="${px(9, 50, 100)}" r="${px(10, 20, 50)}" fill="rgba(${r},${g},${b},0.1)"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bg_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${bgHue},25%,5%)"/>
        <stop offset="100%" stop-color="hsl(${bgHue},30%,2%)"/>
      </linearGradient>
      <radialGradient id="glow_${id}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(${r},${g},${b},0.12)"/>
        <stop offset="100%" stop-color="rgba(${r},${g},${b},0)"/>
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg_${id})"/>
    <circle cx="200" cy="200" r="200" fill="url(#glow_${id})"/>
    ${shapes}
    <rect width="400" height="400" fill="url(#glow_${id})" opacity="0.3"/>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* Memoized SVG generation for all tools — computed once */
const svgCache = {};

function getOrGenerateSvg(id, cat) {
  const key = `${id}::${cat}`;
  if (!svgCache[key]) {
    svgCache[key] = generateToolSvg(id, cat);
  }
  return svgCache[key];
}

/* ─── ToolCard3D ─── */
export default function ToolCard3D({ app, index = 0, onClick, isFavorite, onToggleFavorite }) {
  const cardRef = useRef(null);
  const [clicking, setClicking] = useState(false);
  const color = TOOL_COLORS[app.cat] || "#6366f1";
  const fallback = FALLBACK_GRADIENTS[app.cat] || FALLBACK_GRADIENTS.ai;

  const image = useMemo(() => {
    return getOrGenerateSvg(app.id, app.cat);
  }, [app.id, app.cat]);

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
      whileHover={{ y: -6, scale: 1.02 }}
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
      style={{ aspectRatio: "1/1", minHeight: 180, maxHeight: 220 }}
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
        {/* Background image (generated SVG) */}
        <div className="absolute inset-0">
          <img
            src={image}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
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
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-3">
          {/* Top: Icon + Badge */}
          <div className="flex items-start justify-between">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{
                background: `linear-gradient(135deg, ${color}44, transparent)`,
                border: `1px solid ${color}44`,
                backdropFilter: "blur(8px)",
              }}
            >
              {app.icon}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(app.id); }}
                className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all ${
                  isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                } hover:scale-110`}
                style={{ background: `${color}22`, border: `1px solid ${color}33` }}
              >
                {isFavorite ? "★" : "☆"}
              </button>
              <div
                className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-widest"
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
              className="text-sm sm:text-base font-semibold mb-0.5 leading-tight"
              style={{
                color: "rgba(255,255,255,0.95)",
                textShadow: "0 2px 16px rgba(0,0,0,0.7)",
              }}
            >
              {app.name}
            </h3>
            <p
              className="text-[11px] leading-tight mb-2 max-w-[95%]"
              style={{
                color: "rgba(255,255,255,0.45)",
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                  color: "white",
                  boxShadow: `0 4px 20px ${color}55`,
                }}
              >
                Abrir ferramenta
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
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
