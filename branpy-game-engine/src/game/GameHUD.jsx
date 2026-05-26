import { useEffect, useRef, useState } from "react";

function useGameAudio() {
  const ctxRef = useRef(null);
  useEffect(() => {
    return () => { try { ctxRef.current?.close(); } catch {} };
  }, []);

  const getCtx = () => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  };

  return {
    playCollect: () => {
      try {
        const ctx = getCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.3);
      } catch {}
    },
    playJumpscare: () => {
      try {
        const ctx = getCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(200, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 1.5);
        f.type = "lowpass";
        f.frequency.value = 800;
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        o.connect(f).connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 1.5);
      } catch {}
    },
    playWin: () => {
      try {
        const ctx = getCtx();
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = freq;
          const t = ctx.currentTime + i * 0.15;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.1, t + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
          o.connect(g).connect(ctx.destination);
          o.start(t);
          o.stop(t + 0.45);
        });
      } catch {}
    },
  };
}

export default function GameHUD({ collected, total, gameState }) {
  const [showHint, setShowHint] = useState(true);
  const [flash, setFlash] = useState(false);
  const audio = useGameAudio();

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (collected > 0 && gameState === "playing") {
      audio.playCollect();
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 200);
      return () => clearTimeout(t);
    }
  }, [collected, gameState]);

  useEffect(() => {
    if (gameState === "jumpscare") audio.playJumpscare();
    if (gameState === "won") audio.playWin();
  }, [gameState]);

  return (
    <div className="absolute inset-0 pointer-events-none z-40" style={{ fontFamily: "'Courier New', monospace" }}>
      {/* Crosshair */}
      {gameState === "playing" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-1 h-4 bg-white/30 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
          <div className="w-4 h-1 bg-white/30 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
          <div className="w-0.5 h-0.5 bg-white/60 rounded-full absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Objective */}
      {gameState !== "won" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
          <div className="text-xs text-gray-500 tracking-widest uppercase mb-1">Objetivo</div>
          <div className="text-sm text-gray-300">
            Encontre os símbolos: <span className="text-[#D4A24C] font-bold">{collected}/{total}</span>
          </div>
        </div>
      )}

      {/* Controls hint */}
      {showHint && gameState === "playing" && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-xs text-gray-600 animate-pulse text-center">
          WASD para andar · Shift correr · Mouse olhar · Clique para focar
        </div>
      )}

      {/* Flash on collect */}
      {flash && (
        <div className="absolute inset-0 bg-white/10" style={{ animation: "fadeOut 0.2s ease-out" }} />
      )}

      {/* Jumpscare */}
      {gameState === "jumpscare" && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ animation: "none" }}>
          <div className="absolute inset-0 bg-red-900/40" />
          <div className="animate-ping text-8xl font-black text-red-600 opacity-80 select-none">☠</div>
          <div className="absolute bottom-1/3 text-2xl font-black text-red-500 tracking-widest" style={{ textShadow: "0 0 40px rgba(255,0,0,0.6)" }}>
            ⚠ VOCÊ VIU ALGO ⚠
          </div>
        </div>
      )}

      {/* Win Screen */}
      {gameState === "won" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-6xl mb-4">✨</div>
          <div className="text-2xl font-bold text-[#44ff88] mb-2 tracking-wider">VOCÊ ESCAPOU</div>
          <div className="text-sm text-gray-400 mb-6">Os símbolos foram libertados. A cidade está em paz.</div>
          <div className="text-xs text-gray-600">Hollow City — Prototype 0.1</div>
          <div className="mt-8 text-xs text-gray-500">Pressione <span className="text-gray-300">Stop</span> para voltar ao editor</div>
        </div>
      )}
    </div>
  );
}
