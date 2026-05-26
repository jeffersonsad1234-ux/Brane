import React from "react";
import { useEditorStore } from "@store/editorStore";

const labels = { cube: "Cube", sphere: "Sphere", plane: "Plane", cylinder: "Cylinder", light: "Light", camera: "Camera" };

function EnvironmentTab() {
  const env = useEditorStore((s) => s.scene.environment);
  const updateEnvironment = useEditorStore((s) => s.updateEnvironment);

  if (!env) return null;

  const toggle = (key) => updateEnvironment({ [key]: !env[key] });

  return (
    <div className="p-3 space-y-2.5">
      <div className="text-xs font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider mb-3">Renderer</div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={env.bloom} onChange={() => toggle("bloom")} className="accent-[#6366f1]" />
        <span className="text-xs text-[rgba(255,255,255,0.45)]">Bloom</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={env.ssao} onChange={() => toggle("ssao")} className="accent-[#6366f1]" />
        <span className="text-xs text-[rgba(255,255,255,0.45)]">SSAO</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={env.colorGrading} onChange={() => toggle("colorGrading")} className="accent-[#6366f1]" />
        <span className="text-xs text-[rgba(255,255,255,0.45)]">Color Grading</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={env.vignette !== false} onChange={() => toggle("vignette")} className="accent-[#6366f1]" />
        <span className="text-xs text-[rgba(255,255,255,0.45)]">Vignette</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={env.volumetricFog} onChange={() => toggle("volumetricFog")} className="accent-[#6366f1]" />
        <span className="text-xs text-[rgba(255,255,255,0.45)]">Volumetric Fog</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={env.rain} onChange={() => toggle("rain")} className="accent-[#6366f1]" />
        <span className="text-xs text-[rgba(255,255,255,0.45)]">Rain</span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={env.shadows !== false} onChange={() => toggle("shadows")} className="accent-[#6366f1]" />
        <span className="text-xs text-[rgba(255,255,255,0.45)]">Shadows</span>
      </label>

      <div className="text-xs text-[rgba(255,255,255,0.3)] mt-3 mb-1">Bloom Intensity: {env.bloomIntensity?.toFixed(2)}</div>
      <input type="range" min={0} max={2} step={0.05} value={env.bloomIntensity ?? 0.5}
        onChange={(e) => updateEnvironment({ bloomIntensity: parseFloat(e.target.value) })}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[rgba(255,255,255,0.06)]"
      />

      <div className="text-xs text-[rgba(255,255,255,0.3)] mb-1">Exposure: {env.exposure?.toFixed(2)}</div>
      <input type="range" min={0.1} max={3} step={0.05} value={env.exposure ?? 1.2}
        onChange={(e) => updateEnvironment({ exposure: parseFloat(e.target.value) })}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[rgba(255,255,255,0.06)]"
      />

      <div className="text-xs text-[rgba(255,255,255,0.3)] mb-1">Fog Distance: {env.fog?.far ?? 60}</div>
      <input type="range" min={5} max={100} step={1} value={env.fog?.far ?? 60}
        onChange={(e) => updateEnvironment({ fog: { ...env.fog, far: parseInt(e.target.value) } })}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[rgba(255,255,255,0.06)]"
      />

      <div className="text-xs font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider mt-4 mb-2">Quality</div>

      <div className="flex gap-1">
        {[
          { key: "performance", label: "Low" },
          { key: "balanced", label: "Med" },
          { key: "ultra", label: "Ultra" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => updateEnvironment({
            qualityPreset: key,
            pixelRatio: key === "performance" ? 0.75 : key === "ultra" ? 2 : 1,
            shadowQuality: key === "performance" ? "low" : key === "balanced" ? "medium" : "high",
          })}
            className={`flex-1 py-1 text-xs rounded transition-colors ${
              env.qualityPreset === key ? "bg-[#6366f1] text-white" : "bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.08)]"
            }`}
          >{label}</button>
        ))}
      </div>

      <div className="text-[10px] text-[rgba(255,255,255,0.2)] mt-1">
        Shadows: {env.shadowQuality} · Pixel Ratio: {env.pixelRatio}x · LOD: {env.useLOD ? "on" : "off"}
      </div>
    </div>
  );
}

export default function Properties() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const obj = useEditorStore((s) => s.scene.objects.find((o) => o.id === s.selectedId));
  const updateObject = useEditorStore((s) => s.updateObject);

  if (!obj) {
    return <EnvironmentTab />;
  }

  const setPos = (i, v) => {
    const p = [...obj.position];
    p[i] = parseFloat(v) || 0;
    updateObject(obj.id, { position: p });
  };

  const setRot = (i, v) => {
    const r = [...obj.rotation];
    r[i] = parseFloat(v) || 0;
    updateObject(obj.id, { rotation: r });
  };

  const setScale = (i, v) => {
    const s = [...obj.scale];
    s[i] = parseFloat(v) || 0.01;
    updateObject(obj.id, { scale: s });
  };

  return (
    <div className="p-3 space-y-3">
      <div className="text-xs font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">{labels[obj.type] || obj.type}</div>

      <div>
        <div className="text-xs text-[rgba(255,255,255,0.3)] mb-1">Name</div>
        <input value={obj.name} onChange={(e) => updateObject(obj.id, { name: e.target.value })}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] rounded px-2 py-1 text-xs text-[rgba(255,255,255,0.65)] outline-none"
        />
      </div>

      <div>
        <div className="text-xs text-[rgba(255,255,255,0.3)] mb-1">Position</div>
        <div className="flex gap-1">
          {["X", "Y", "Z"].map((l, i) => (
            <div key={l} className="flex-1 flex items-center gap-1 bg-[rgba(255,255,255,0.03)] rounded px-1.5 py-1">
              <span className="text-xs text-[rgba(255,255,255,0.2)]">{l}</span>
              <input value={(obj.position?.[i] || 0).toFixed(2)} onChange={(e) => setPos(i, e.target.value)}
                className="w-full bg-transparent text-xs text-[rgba(255,255,255,0.6)] outline-none text-right font-mono" type="number" step="0.1"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-[rgba(255,255,255,0.3)] mb-1">Rotation</div>
        <div className="flex gap-1">
          {["X", "Y", "Z"].map((l, i) => (
            <div key={l} className="flex-1 flex items-center gap-1 bg-[rgba(255,255,255,0.03)] rounded px-1.5 py-1">
              <span className="text-xs text-[rgba(255,255,255,0.2)]">{l}</span>
              <input value={((obj.rotation?.[i] || 0) * 180 / Math.PI).toFixed(0)} onChange={(e) => setRot(i, (parseFloat(e.target.value) || 0) * Math.PI / 180)}
                className="w-full bg-transparent text-xs text-[rgba(255,255,255,0.6)] outline-none text-right font-mono" type="number" step="5"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-[rgba(255,255,255,0.3)] mb-1">Scale</div>
        <div className="flex gap-1">
          {["X", "Y", "Z"].map((l, i) => (
            <div key={l} className="flex-1 flex items-center gap-1 bg-[rgba(255,255,255,0.03)] rounded px-1.5 py-1">
              <span className="text-xs text-[rgba(255,255,255,0.2)]">{l}</span>
              <input value={(obj.scale?.[i] || 1).toFixed(2)} onChange={(e) => setScale(i, e.target.value)}
                className="w-full bg-transparent text-xs text-[rgba(255,255,255,0.6)] outline-none text-right font-mono" type="number" step="0.1" min="0.01"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-[rgba(255,255,255,0.3)] mb-1">Color</div>
        <div className="flex items-center gap-2">
          <input value={obj.color || "#888888"} onChange={(e) => updateObject(obj.id, { color: e.target.value })}
            type="color" className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
          />
          <span className="text-xs font-mono text-[rgba(255,255,255,0.4)]">{obj.color || "#888888"}</span>
        </div>
      </div>

      {obj.type === "light" && (
        <div>
          <div className="text-xs text-[rgba(255,255,255,0.3)] mb-1">Intensity: {obj.intensity?.toFixed(1)}</div>
          <input type="range" min={0} max={3} step={0.1} value={obj.intensity || 1}
            onChange={(e) => updateObject(obj.id, { intensity: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[rgba(255,255,255,0.06)]"
          />
        </div>
      )}

      {obj.type === "camera" && (
        <div>
          <div className="text-xs text-[rgba(255,255,255,0.3)] mb-1">FOV: {obj.fov || 60}°</div>
          <input type="range" min={20} max={120} value={obj.fov || 60}
            onChange={(e) => updateObject(obj.id, { fov: parseInt(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[rgba(255,255,255,0.06)]"
          />
        </div>
      )}
    </div>
  );
}
