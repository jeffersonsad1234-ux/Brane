import { useMemo } from "react";

const STYLES = {};

function buildStyle(css) {
  if (!STYLES[css]) {
    const id = "bg-anim-" + Math.random().toString(36).slice(2, 8);
    STYLES[css] = id;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }
  return STYLES[css];
}

const VARIANTS = {
  neon: {
    container: {
      position: "fixed", inset: 0, zIndex: 0, overflow: "hidden",
      background: "#050608",
      pointerEvents: "none",
    },
    content: (
      <>
        <style key="neon-style">{`
          @keyframes neonOrb1 {
            0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
            33% { transform: translate(120px, -80px) scale(1.2); opacity: 0.4; }
            66% { transform: translate(-60px, 100px) scale(0.9); opacity: 0.25; }
            100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          }
          @keyframes neonOrb2 {
            0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
            50% { transform: translate(-100px, 60px) scale(1.3); opacity: 0.35; }
            100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          }
          @keyframes neonOrb3 {
            0% { transform: translate(0, 0) scale(1); opacity: 0.15; }
            50% { transform: translate(80px, 40px) scale(0.8); opacity: 0.25; }
            100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          }
          @keyframes neonGrid {
            0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
            100% { transform: perspective(500px) rotateX(60deg) translateY(60px); }
          }
          .bg-neon-grid {
            position: absolute; inset: 0;
            backgroundImage: "linear-gradient(rgba(138,44,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(138,44,255,0.03) 1px, transparent 1px)";
            backgroundSize: "60px 60px";
            animation: "neonGrid 20s linear infinite";
          }
        `}</style>
        <div key="orb1" style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(138,44,255,0.12) 0%, transparent 70%)",
          top: "10%", left: "20%",
          animation: "neonOrb1 25s ease-in-out infinite",
        }} />
        <div key="orb2" style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)",
          bottom: "10%", right: "15%",
          animation: "neonOrb2 30s ease-in-out infinite",
        }} />
        <div key="orb3" style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(46,204,113,0.08) 0%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          animation: "neonOrb3 20s ease-in-out infinite",
        }} />
        <div key="grid" style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(138,44,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(138,44,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          animation: "neonGrid 20s linear infinite",
          opacity: 0.5,
        }} />
      </>
    ),
  },

  espaco: {
    container: {
      position: "fixed", inset: 0, zIndex: 0, overflow: "hidden",
      background: "linear-gradient(180deg, #020010 0%, #050608 50%, #0a0015 100%)",
      pointerEvents: "none",
    },
    content: (
      <>
        <style key="espaco-style">{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          @keyframes shootStar {
            0% { transform: translateX(-100px) translateY(0); opacity: 1; }
            100% { transform: translateX(calc(100vw + 100px)) translateY(80vh); opacity: 0; }
          }
          @keyframes nebulaPulse {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.25; transform: scale(1.05); }
          }
          @keyframes starDrift {
            0% { transform: translateY(0); }
            100% { transform: translateY(-100vh); }
          }
          .bg-espaco-star { position: absolute; borderRadius: "50%"; animation: "twinkle 3s ease-in-out infinite"; }
          .bg-espaco-shoot { position: absolute; width: 2px; height: 2px; background: "#fff"; borderRadius: "50%"; boxShadow: "0 0 6px #fff, 0 0 12px rgba(0,229,255,0.5)"; animation: "shootStar 4s linear infinite"; }
        `}</style>
        <div key="nebula1" style={{
          position: "absolute", width: 800, height: 800, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(138,44,255,0.1) 0%, transparent 60%)",
          top: "-20%", right: "-10%",
          animation: "nebulaPulse 15s ease-in-out infinite",
        }} />
        <div key="nebula2" style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 60%)",
          bottom: "-10%", left: "-5%",
          animation: "nebulaPulse 20s ease-in-out infinite",
        }} />
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={`star-${i}`} className="bg-espaco-star" style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            background: ["#fff", "#8a2cff", "#00e5ff"][Math.floor(Math.random() * 3)],
            boxShadow: ["none", "0 0 4px rgba(138,44,255,0.5)", "0 0 4px rgba(0,229,255,0.5)"][Math.floor(Math.random() * 3)],
            animationDelay: Math.random() * 5 + "s",
            animationDuration: (Math.random() * 3 + 2) + "s",
          }} />
        ))}
        <div key="shoot" className="bg-espaco-shoot" style={{
          top: Math.random() * 30 + 10 + "%",
          animationDelay: Math.random() * 10 + "s",
          transform: "rotate(-30deg)",
        }} />
      </>
    ),
  },

  cidade: {
    container: {
      position: "fixed", inset: 0, zIndex: 0, overflow: "hidden",
      background: "linear-gradient(180deg, #0a0017 0%, #050608 40%, #0d0020 100%)",
      pointerEvents: "none",
    },
    content: (
      <>
        <style key="cidade-style">{`
          @keyframes scanLine {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          @keyframes windowBlink {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.2; }
          }
          @keyframes neonPulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes cityGlow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.5; }
          }
          .bg-cidade-scan {
            position: absolute; left: 0; right: 0; height: 2px;
            background: linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent);
            animation: scanLine 4s linear infinite;
          }
        `}</style>
        <div key="glow" style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(0deg, rgba(138,44,255,0.08) 0%, transparent)",
          animation: "cityGlow 5s ease-in-out infinite",
        }} />
        <svg key="skyline" viewBox="0 0 800 200" preserveAspectRatio="xMidYMax meet" style={{
          position: "absolute", bottom: 0, left: 0, width: "100%", height: "40%",
        }}>
          <defs>
            <linearGradient id="bldgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(138,44,255,0.15)" />
              <stop offset="100%" stopColor="rgba(138,44,255,0.4)" />
            </linearGradient>
            <linearGradient id="bldgGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,229,255,0.1)" />
              <stop offset="100%" stopColor="rgba(0,229,255,0.3)" />
            </linearGradient>
          </defs>
          {[
            { x: 0, w: 50, h: 140, grad: "bldgGrad" },
            { x: 55, w: 35, h: 100, grad: "bldgGrad2" },
            { x: 95, w: 60, h: 180, grad: "bldgGrad" },
            { x: 160, w: 40, h: 80, grad: "bldgGrad2" },
            { x: 205, w: 55, h: 160, grad: "bldgGrad" },
            { x: 265, w: 45, h: 120, grad: "bldgGrad2" },
            { x: 315, w: 70, h: 190, grad: "bldgGrad" },
            { x: 390, w: 40, h: 90, grad: "bldgGrad2" },
            { x: 435, w: 55, h: 150, grad: "bldgGrad" },
            { x: 495, w: 35, h: 110, grad: "bldgGrad2" },
            { x: 535, w: 60, h: 170, grad: "bldgGrad" },
            { x: 600, w: 45, h: 100, grad: "bldgGrad2" },
            { x: 650, w: 50, h: 155, grad: "bldgGrad" },
            { x: 705, w: 40, h: 130, grad: "bldgGrad2" },
            { x: 750, w: 55, h: 165, grad: "bldgGrad" },
          ].map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={200 - b.h} width={b.w - 2} height={b.h} fill={`url(#${b.grad})`} rx={2} />
              {Array.from({ length: Math.floor(b.h / 20) }).map((_, j) => (
                <rect key={j} x={b.x + 4} y={200 - b.h + 8 + j * 20} width={(b.w - 10) / 2} height={6} rx={1}
                  fill={`rgba(255,255,255,${Math.random() * 0.3 + 0.2})`}
                  style={{ animation: `windowBlink ${Math.random() * 4 + 2}s ease-in-out infinite`, animationDelay: Math.random() * 3 + "s" }}
                />
              ))}
            </g>
          ))}
        </svg>
        <div key="scan" className="bg-cidade-scan" style={{ top: "30%" }} />
        <div key="neon-line" style={{
          position: "absolute", top: "45%", left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.2), rgba(138,44,255,0.2), transparent)",
          animation: "neonPulse 3s ease-in-out infinite",
        }} />
      </>
    ),
  },

  estudio: {
    container: {
      position: "fixed", inset: 0, zIndex: 0, overflow: "hidden",
      background: "linear-gradient(180deg, #080012 0%, #050608 50%, #0a0018 100%)",
      pointerEvents: "none",
    },
    content: (
      <>
        <style key="estudio-style">{`
          @keyframes scanVertical {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
          @keyframes vignettePulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.9; }
          }
          @keyframes lightBar {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.5; }
          }
          @keyframes dataFlow {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .bg-estudio-scan {
            position: absolute; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(0,229,255,0.08), transparent);
            animation: scanVertical 6s linear infinite;
          }
        `}</style>
        <div key="vignette" style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
          animation: "vignettePulse 8s ease-in-out infinite",
        }} />
        <div key="grid" style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(138,44,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(138,44,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.6,
        }} />
        <div key="bar-top" style={{
          position: "absolute", top: "30%", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(138,44,255,0.1), rgba(0,229,255,0.1), transparent)",
          animation: "lightBar 4s ease-in-out infinite",
        }} />
        <div key="bar-bottom" style={{
          position: "absolute", top: "70%", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.1), rgba(138,44,255,0.1), transparent)",
          animation: "lightBar 5s ease-in-out infinite",
          animationDelay: "1s",
        }} />
        <div key="scan1" className="bg-estudio-scan" style={{ top: "0%", animationDelay: "0s" }} />
        <div key="scan2" className="bg-estudio-scan" style={{ top: "0%", animationDelay: "3s" }} />
        <div key="corner-tl" style={{
          position: "absolute", top: 16, left: 16, width: 40, height: 40,
          borderTop: "1px solid rgba(138,44,255,0.15)",
          borderLeft: "1px solid rgba(138,44,255,0.15)",
        }} />
        <div key="corner-tr" style={{
          position: "absolute", top: 16, right: 16, width: 40, height: 40,
          borderTop: "1px solid rgba(138,44,255,0.15)",
          borderRight: "1px solid rgba(138,44,255,0.15)",
        }} />
        <div key="corner-bl" style={{
          position: "absolute", bottom: 16, left: 16, width: 40, height: 40,
          borderBottom: "1px solid rgba(138,44,255,0.15)",
          borderLeft: "1px solid rgba(138,44,255,0.15)",
        }} />
        <div key="corner-br" style={{
          position: "absolute", bottom: 16, right: 16, width: 40, height: 40,
          borderBottom: "1px solid rgba(138,44,255,0.15)",
          borderRight: "1px solid rgba(138,44,255,0.15)",
        }} />
        <div key="data-line" style={{
          position: "absolute", top: "50%", left: 0, width: "30%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.12))",
          animation: "dataFlow 8s linear infinite",
        }} />
      </>
    ),
  },

  particulas: {
    container: {
      position: "fixed", inset: 0, zIndex: 0, overflow: "hidden",
      background: "#050608",
      pointerEvents: "none",
    },
    content: (
      <>
        <style key="particulas-style">{`
          @keyframes floatUp {
            0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
            10% { opacity: 0.8; }
            90% { opacity: 0.6; }
            100% { transform: translateY(-100vh) translateX(50px) scale(0.5); opacity: 0; }
          }
          @keyframes particleDrift {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(30px, -20px); }
          }
          @keyframes energyWave {
            0% { transform: scaleY(0); opacity: 0; }
            50% { opacity: 0.1; transform: scaleY(1); }
            100% { transform: scaleY(0); opacity: 0; }
          }
        `}</style>
        <div key="wave1" style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
          background: "linear-gradient(0deg, rgba(138,44,255,0.05) 0%, transparent)",
          animation: "energyWave 8s ease-in-out infinite",
        }} />
        <div key="wave2" style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
          background: "linear-gradient(0deg, rgba(0,229,255,0.03) 0%, transparent)",
          animation: "energyWave 10s ease-in-out infinite",
          animationDelay: "2s",
        }} />
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={`p-${i}`} style={{
            position: "absolute",
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            borderRadius: "50%",
            left: Math.random() * 100 + "%",
            bottom: "-10px",
            background: [
              "rgba(138,44,255,0.8)",
              "rgba(0,229,255,0.7)",
              "rgba(46,204,113,0.6)",
              "rgba(255,255,255,0.5)",
            ][Math.floor(Math.random() * 4)],
            boxShadow: "0 0 6px currentColor",
            animation: `floatUp ${Math.random() * 10 + 10}s linear infinite`,
            animationDelay: Math.random() * 15 + "s",
          }} />
        ))}
      </>
    ),
  },
};

export default function AnimatedBackground({ variant }) {
  const cfg = VARIANTS[variant] || VARIANTS.neon;
  return (
    <div style={cfg.container}>
      {cfg.content}
    </div>
  );
}
