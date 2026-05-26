import React, { useState } from "react";
import { useEditorStore } from "@store/editorStore";

export default function BottomPanel() {
  const [tab, setTab] = useState("console");
  const [isOpen, setIsOpen] = useState(false);
  const scene = useEditorStore((s) => s.scene);
  const env = scene.environment || {};

  const tabs = [
    { key: "console", label: "Console", icon: ">" },
    { key: "assets", label: "Assets", icon: "▣" },
    { key: "stats", label: "Stats", icon: "◈" },
  ];

  return (
    <div className="bottom-panel" style={{ height: isOpen ? "var(--bottom-panel-h)" : 0 }}>
      {/* Toggle handle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)",
          width: 40, height: 16, cursor: "pointer", zIndex: 5,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--panel)", border: "1px solid var(--border)", borderBottom: "none",
          borderRadius: "6px 6px 0 0", color: "var(--text-faint)", fontSize: 8
        }}
        title={isOpen ? "Close panel" : "Open panel"}
      >{isOpen ? "▾" : "▴"}</div>

      {isOpen && (
        <>
          <div className="bottom-panel-header">
            {tabs.map(({ key, label, icon }) => (
              <button key={key}
                className={`bottom-panel-tab ${tab === key ? "bottom-panel-tab--active" : ""}`}
                onClick={() => setTab(key)}
              >
                <span style={{ marginRight: 4, opacity: 0.6 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <div className="bottom-panel-content" key={tab}>
            {tab === "console" && (
              <div>
                <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>[INFO] BRANPY Engine v0.2</div>
                <div style={{ color: "var(--text-muted)" }}>[INFO] Scene &ldquo;{scene.name}&rdquo; loaded ({scene.objects.length} objects)</div>
                <div style={{ color: "var(--text-muted)" }}>[INFO] Renderer: WebGL{typeof WebGL2RenderingContext !== "undefined" ? "2" : ""} &middot; ACES Filmic Tone Mapping</div>
                <div style={{ color: "var(--warning)", marginTop: 4 }}>[WARN] Audio requires user interaction to start</div>
              </div>
            )}
            {tab === "assets" && (
              <div style={{ color: "var(--text-faint)" }}>
                No assets imported yet. Use File &rarr; Import JSON to load a scene.
              </div>
            )}
            {tab === "stats" && (
              <div>
                <div>Objects: {scene.objects.length}</div>
                <div>Quality: {env.qualityPreset || "balanced"}</div>
                <div>Shadows: {env.shadowQuality || "medium"}</div>
                <div>PostFX: {["bloom", "ssao", "colorGrading", "vignette", "volumetricFog"].filter(k => env[k]).join(", ") || "none"}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}