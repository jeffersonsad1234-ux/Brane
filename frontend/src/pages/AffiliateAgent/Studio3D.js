import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const cx = "rounded-xl border border-white/[0.06] bg-white/[0.02] p-4";
const lx = "text-[11px] text-white/30 uppercase tracking-wider mb-1";
const ix = "w-full bg-white/5 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/80 placeholder-white/20 outline-none focus:border-cyan-500/40 focus:bg-white/[0.08] transition";

const MODELS = [
  { id: "cube", name: "Cube", icon: "⬡", gradient: "from-cyan-500/40 to-blue-500/40" },
  { id: "sphere", name: "Sphere", icon: "◉", gradient: "from-violet-500/40 to-purple-500/40" },
  { id: "cylinder", name: "Cylinder", icon: "⬢", gradient: "from-emerald-500/40 to-teal-500/40" },
  { id: "pyramid", name: "Pyramid", icon: "△", gradient: "from-amber-500/40 to-orange-500/40" },
  { id: "torus", name: "Torus", icon: "◎", gradient: "from-pink-500/40 to-rose-500/40" },
];

const MATERIALS = ["Matte", "Glossy", "Metallic", "Wireframe"];

function ShapePreview({ model, rx, ry, rz, scale, color }) {
  const rotationStyle = {
    transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale / 100})`,
  };
  const shape = model?.id || "cube";
  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-500">
      <motion.div
        animate={{ rotateX: rx, rotateY: ry, rotateZ: rz }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
        className="relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {shape === "cube" && (
          <div className="w-32 h-32 rounded-xl shadow-2xl" style={{ backgroundColor: color, boxShadow: `0 0 60px ${color}44` }} />
        )}
        {shape === "sphere" && (
          <div className="w-32 h-32 rounded-full shadow-2xl" style={{ background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44)`, boxShadow: `0 0 60px ${color}44` }} />
        )}
        {shape === "cylinder" && (
          <div className="w-28 h-36 rounded-[50%] shadow-2xl" style={{ background: `linear-gradient(180deg, ${color}cc, ${color}44)`, boxShadow: `0 0 60px ${color}44` }} />
        )}
        {shape === "pyramid" && (
          <div style={{ width: 0, height: 0, borderLeft: "60px solid transparent", borderRight: "60px solid transparent", borderBottom: `120px solid ${color}`, filter: `drop-shadow(0 0 40px ${color}44)` }} />
        )}
        {shape === "torus" && (
          <div className="w-36 h-20 rounded-[50%] shadow-2xl border-8" style={{ borderColor: color, backgroundColor: `${color}22`, boxShadow: `0 0 60px ${color}44` }} />
        )}
      </motion.div>
    </div>
  );
}

export default function Studio3D() {
  const [settings, setSettings] = useLocalStorage("brane_3d_settings", {
    modelId: "cube",
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 100,
    color: "#06b6d4",
    material: "Matte",
  });
  const [rendering, setRendering] = useState(false);

  const model = useMemo(() => MODELS.find((m) => m.id === settings.modelId), [settings.modelId]);

  const patch = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, [setSettings]);

  const handleRender = useCallback(() => {
    setRendering(true);
    setTimeout(() => setRendering(false), 2500);
  }, []);

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0a] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white/90 tracking-tight">3D Studio</h1>
          <div className="flex items-center gap-2">
            <button onClick={handleRender}
              className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/20 transition"
            >{rendering ? "Rendering..." : "Render"}</button>
            <button
              className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white/40 border border-white/[0.06] transition"
            >Export</button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          <div className="w-48 flex-shrink-0 space-y-2 overflow-y-auto">
            {MODELS.map((m) => (
              <motion.button key={m.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => patch({ modelId: m.id })}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  settings.modelId === m.id
                    ? "border-cyan-500/40 bg-cyan-500/10"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${m.gradient} flex items-center justify-center text-lg mb-2`}>
                  {m.icon}
                </div>
                <div className="text-xs font-medium text-white/70">{m.name}</div>
              </motion.button>
            ))}
          </div>

          <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden relative">
            {rendering && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 bg-[#0a0a0a]/80 flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full mx-auto mb-3"
                  />
                  <div className="text-sm text-white/50">Rendering scene...</div>
                </div>
              </motion.div>
            )}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
              <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 border border-white/[0.06] text-white/40 hover:text-white/70 text-xs" title="Rotate">↻</button>
              <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 border border-white/[0.06] text-white/40 hover:text-white/70 text-xs" title="Pan">✥</button>
              <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 border border-white/[0.06] text-white/40 hover:text-white/70 text-xs" title="Zoom">⊕</button>
            </div>
            <ShapePreview model={model} rx={settings.rotationX} ry={settings.rotationY} rz={settings.rotationZ} scale={settings.scale} color={settings.color} />
          </div>

          <div className="w-64 flex-shrink-0 space-y-4">
            <div className={cx}>
              <div className={lx}>Rotation</div>
              {["X", "Y", "Z"].map((axis) => (
                <div key={axis} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30 font-mono">{axis}</span>
                    <span className="text-[10px] text-white/40 font-mono">{settings[`rotation${axis}`]}°</span>
                  </div>
                  <input type="range" min="0" max="360" value={settings[`rotation${axis}`]}
                    onChange={(e) => patch({ [`rotation${axis}`]: Number(e.target.value) })}
                    className="w-full h-1 appearance-none bg-white/10 rounded-full outline-none cursor-pointer accent-cyan-400"
                  />
                </div>
              ))}
            </div>

            <div className={cx}>
              <div className={lx}>Scale</div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30 font-mono">Size</span>
                <span className="text-[10px] text-white/40 font-mono">{settings.scale}%</span>
              </div>
              <input type="range" min="10" max="200" value={settings.scale}
                onChange={(e) => patch({ scale: Number(e.target.value) })}
                className="w-full h-1 appearance-none bg-white/10 rounded-full outline-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className={cx}>
              <div className={lx}>Color</div>
              <div className="flex items-center gap-3">
                <input type="color" value={settings.color}
                  onChange={(e) => patch({ color: e.target.value })}
                  className="w-10 h-10 rounded-lg border-none cursor-pointer bg-transparent"
                />
                <span className="text-[11px] text-white/40 font-mono">{settings.color}</span>
              </div>
            </div>

            <div className={cx}>
              <div className={lx}>Material</div>
              <select value={settings.material} onChange={(e) => patch({ material: e.target.value })} className={ix}>
                {MATERIALS.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
