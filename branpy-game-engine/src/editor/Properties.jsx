import React, { useState } from "react";
import { useEditorStore } from "@store/editorStore";

const labels = { cube: "Cube", sphere: "Sphere", capsule: "Capsule", plane: "Plane", cylinder: "Cylinder", light: "Point Light", spotlight: "Spotlight", camera: "Camera" };
const icons = { cube: "◇", sphere: "●", capsule: "⬡", plane: "▭", cylinder: "⬢", light: "☀", spotlight: "⌾", camera: "◉" };

const colorPresets = {
  cube: ["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#888888"],
  default: ["#888888", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"],
};

function TransformSection({ obj, updateObject }) {
  const setPos = (i, v) => { const p = [...obj.position]; p[i] = parseFloat(v) || 0; updateObject(obj.id, { position: p }); };
  const setRot = (i, v) => { const r = [...obj.rotation]; r[i] = parseFloat(v) || 0; updateObject(obj.id, { rotation: r }); };
  const setScale = (i, v) => { const s = [...obj.scale]; s[i] = parseFloat(v) || 0.01; updateObject(obj.id, { scale: s }); };
  return (
    <div className="section">
      <div className="section-header"><span>Transform</span></div>
      {[{ l: "Position", f: setPos, v: obj.position || [0, 0, 0], def: 0 },
        { l: "Rotation", f: setRot, v: (obj.rotation || [0, 0, 0]).map(r => r * 180 / Math.PI), def: 0, toRad: true },
        { l: "Scale", f: setScale, v: obj.scale || [1, 1, 1], def: 1, min: 0.01 }].map((sec, si) => (
        <div key={si} style={{ marginBottom: si < 2 ? 2 : 0 }}>
          <span className="label">{sec.l}</span>
          <div className="transform-row">
            {[["X", "var(--danger)"], ["Y", "var(--success)"], ["Z", "var(--info)"]].map(([l, c], i) => (
              <div key={l} className="transform-field">
                <span className="transform-label" style={{ color: c }}>{l}</span>
                <input className="transform-input" type="number" step="0.1" min={sec.min}
                  value={sec.v[i].toFixed(2)}
                  onChange={(e) => sec.f(i, sec.toRad ? (parseFloat(e.target.value) || 0) * Math.PI / 180 : e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MaterialSection({ obj, updateObject }) {
  return (
    <div className="section">
      <div className="section-header"><span>Material</span></div>
      <div style={{ marginBottom: 6 }}>
        <span className="label">Color</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <input type="color" value={obj.color || "#888888"} onChange={(e) => updateObject(obj.id, { color: e.target.value })}
            style={{ width: 28, height: 28, borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid var(--border)", padding: 1 }} />
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{obj.color || "#888888"}</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
          {(colorPresets[obj.type] || colorPresets.default).map((c) => (
            <div key={c} className={`color-preset ${obj.color === c ? "color-preset--active" : ""}`} style={{ background: c }} onClick={() => updateObject(obj.id, { color: c })} />
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 4 }}>
        <span className="label">Roughness: {obj.roughness?.toFixed(2) ?? "0.60"}</span>
        <input type="range" min={0} max={1} step={0.05} value={obj.roughness ?? 0.6} onChange={(e) => updateObject(obj.id, { roughness: parseFloat(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
      </div>
      <div style={{ marginBottom: 4 }}>
        <span className="label">Metalness: {obj.metalness?.toFixed(2) ?? "0.10"}</span>
        <input type="range" min={0} max={1} step={0.05} value={obj.metalness ?? 0.1} onChange={(e) => updateObject(obj.id, { metalness: parseFloat(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
      </div>
      <div>
        <span className="label">Emissive</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <input type="color" value={obj.emissive || "#000000"} onChange={(e) => updateObject(obj.id, { emissive: e.target.value })}
            style={{ width: 28, height: 28, borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid var(--border)", padding: 1 }} />
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{obj.emissive || "#000000"}</span>
        </div>
        <div style={{ marginTop: 4 }}>
          <span className="label">Intensity: {obj.emissiveIntensity?.toFixed(1) ?? "0"}</span>
          <input type="range" min={0} max={5} step={0.1} value={obj.emissiveIntensity || 0} onChange={(e) => updateObject(obj.id, { emissiveIntensity: parseFloat(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
        </div>
      </div>
    </div>
  );
}

function LightSection({ obj, updateObject }) {
  if (obj.type === "light") {
    return (
      <div className="section">
        <div className="section-header"><span>Point Light</span></div>
        <div style={{ marginBottom: 4 }}>
          <span className="label">Color</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <input type="color" value={obj.color || "#ffffff"} onChange={(e) => updateObject(obj.id, { color: e.target.value })}
              style={{ width: 28, height: 28, borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid var(--border)", padding: 1 }} />
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{obj.color || "#ffffff"}</span>
          </div>
        </div>
        <div>
          <span className="label">Intensity: {obj.intensity?.toFixed(1) ?? "1.0"}</span>
          <input type="range" min={0} max={10} step={0.1} value={obj.intensity || 1} onChange={(e) => updateObject(obj.id, { intensity: parseFloat(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
        </div>
      </div>
    );
  }
  if (obj.type === "spotlight") {
    return (
      <div className="section">
        <div className="section-header"><span>Spotlight</span></div>
        <div style={{ marginBottom: 4 }}>
          <span className="label">Color</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <input type="color" value={obj.color || "#ffdd44"} onChange={(e) => updateObject(obj.id, { color: e.target.value })}
              style={{ width: 28, height: 28, borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid var(--border)", padding: 1 }} />
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{obj.color || "#ffdd44"}</span>
          </div>
        </div>
        <div style={{ marginBottom: 4 }}>
          <span className="label">Intensity: {obj.intensity?.toFixed(1) ?? "2.0"}</span>
          <input type="range" min={0} max={10} step={0.1} value={obj.intensity || 2} onChange={(e) => updateObject(obj.id, { intensity: parseFloat(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <span className="label">Angle: {((obj.angle ?? 0.4) * 180 / Math.PI).toFixed(0)}°</span>
          <input type="range" min={1} max={90} step={1} value={(obj.angle ?? 0.4) * 180 / Math.PI}
            onChange={(e) => updateObject(obj.id, { angle: (parseFloat(e.target.value) || 1) * Math.PI / 180 })} style={{ width: "100%", marginTop: 4 }} />
        </div>
        <div style={{ marginBottom: 4 }}>
          <span className="label">Penumbra: {obj.penumbra?.toFixed(2) ?? "0.30"}</span>
          <input type="range" min={0} max={1} step={0.05} value={obj.penumbra ?? 0.3} onChange={(e) => updateObject(obj.id, { penumbra: parseFloat(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
        </div>
        <div>
          <span className="label">Distance: {obj.distance ?? 20}m</span>
          <input type="range" min={1} max={50} step={1} value={obj.distance ?? 20} onChange={(e) => updateObject(obj.id, { distance: parseInt(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
        </div>
      </div>
    );
  }
  return null;
}

function CameraSection({ obj, updateObject }) {
  if (obj.type !== "camera") return null;
  return (
    <div className="section">
      <div className="section-header"><span>Camera</span></div>
      <div>
        <span className="label">FOV: {obj.fov || 60}°</span>
        <input type="range" min={20} max={120} value={obj.fov || 60} onChange={(e) => updateObject(obj.id, { fov: parseInt(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
      </div>
    </div>
  );
}

function EnvironmentPanel() {
  const env = useEditorStore((s) => s.scene.environment);
  const updateEnvironment = useEditorStore((s) => s.updateEnvironment);
  if (!env) return null;
  const toggle = (key) => updateEnvironment({ [key]: !env[key] });

  const fxToggles = [
    { key: "bloom", label: "Bloom" },
    { key: "ssao", label: "SSAO" },
    { key: "colorGrading", label: "Color Grading" },
    { key: "chromaticAberration", label: "Chromatic Aberration" },
    { key: "vignette", label: "Vignette" },
    { key: "volumetricFog", label: "Volumetric Fog" },
    { key: "rain", label: "Rain" },
    { key: "wetGround", label: "Wet Ground" },
    { key: "flashlight", label: "Flashlight" },
    { key: "flickeringLights", label: "Flicker Lights" },
    { key: "ambientSound", label: "Ambient Sound" },
    { key: "shadows", label: "Shadows", negate: true },
  ];

  return (
    <div>
      <div className="section">
        <div className="section-header"><span>Post-Processing</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }}>
          {fxToggles.map(({ key, label, negate }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "2px 0" }}>
              <div className="toggle">
                <input type="checkbox" checked={negate ? env[key] !== false : !!env[key]} onChange={() => toggle(key)} />
                <div className="toggle-track" />
                <div className="toggle-thumb" />
              </div>
              <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-header"><span>Bloom</span></div>
        <div style={{ marginBottom: 4 }}>
          <span className="label">Intensity: {env.bloomIntensity?.toFixed(2) ?? "0.30"}</span>
          <input type="range" min={0} max={2} step={0.05} value={env.bloomIntensity ?? 0.3} onChange={(e) => updateEnvironment({ bloomIntensity: parseFloat(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
        </div>
        <div>
          <span className="label">Threshold: {env.bloomThreshold?.toFixed(2) ?? "0.10"}</span>
          <input type="range" min={0} max={1} step={0.05} value={env.bloomThreshold ?? 0.1} onChange={(e) => updateEnvironment({ bloomThreshold: parseFloat(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
        </div>
      </div>

      <div className="section">
        <div className="section-header"><span>Camera</span></div>
        <div style={{ marginBottom: 4 }}>
          <span className="label">Exposure: {env.exposure?.toFixed(2) ?? "1.00"}</span>
          <input type="range" min={0.1} max={3} step={0.05} value={env.exposure ?? 1} onChange={(e) => updateEnvironment({ exposure: parseFloat(e.target.value) })} style={{ width: "100%", marginTop: 4 }} />
        </div>
        <div>
          <span className="label">Fog Distance: {env.fog?.far ?? 50}m</span>
          <input type="range" min={5} max={100} step={1} value={env.fog?.far ?? 50} onChange={(e) => updateEnvironment({ fog: { ...env.fog, far: parseInt(e.target.value) } })} style={{ width: "100%", marginTop: 4 }} />
        </div>
      </div>

      <div className="section">
        <div className="section-header"><span>Quality</span></div>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ key: "performance", label: "Low" }, { key: "balanced", label: "Med" }, { key: "ultra", label: "Ultra" }].map(({ key, label }) => (
            <button key={key} onClick={() => updateEnvironment({
              qualityPreset: key, pixelRatio: key === "performance" ? 0.75 : key === "ultra" ? 2 : 1,
              shadowQuality: key === "performance" ? "low" : key === "balanced" ? "medium" : "high",
            })}
              className={`btn ${env.qualityPreset === key ? "btn--active" : ""}`} style={{ flex: 1, justifyContent: "center", fontSize: 10 }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
          Shadows: {env.shadowQuality} · Pixel Ratio: {env.pixelRatio}x
        </div>
      </div>
    </div>
  );
}

export default function Properties() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const obj = useEditorStore((s) => s.scene.objects.find((o) => o.id === s.selectedId));
  const updateObject = useEditorStore((s) => s.updateObject);
  if (!obj) return <EnvironmentPanel />;
  return (
    <div>
      <div className="section" style={{ borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.5 }}>{icons[obj.type] || "?"}</span>
          <input className="input input--string" value={obj.name} onChange={(e) => updateObject(obj.id, { name: e.target.value })}
            style={{ flex: 1, fontSize: 11, fontWeight: 500, fontFamily: "var(--font)" }} />
        </div>
        <div style={{ fontSize: 9, color: "var(--text-faint)", marginTop: 4 }}>
          {labels[obj.type] || obj.type} · ID: {obj.id.slice(0, 8)}
        </div>
      </div>
      <TransformSection obj={obj} updateObject={updateObject} />
      <MaterialSection obj={obj} updateObject={updateObject} />
      <LightSection obj={obj} updateObject={updateObject} />
      <CameraSection obj={obj} updateObject={updateObject} />
    </div>
  );
}
