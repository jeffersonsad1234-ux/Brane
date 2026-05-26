import React, { useState, useEffect, useRef } from "react";
import { useEditorStore } from "@store/editorStore";

export default function StatusBar() {
  const scene = useEditorStore((s) => s.scene);
  const mode = useEditorStore((s) => s.mode);
  const transformMode = useEditorStore((s) => s.transformMode);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const fpsCam = useEditorStore((s) => s.fpsCam);
  const env = scene.environment || {};

  const [fps, setFps] = useState(0);
  const ref = useRef({ frames: 0, last: performance.now() });

  useEffect(() => {
    let raf;
    const tick = () => {
      const s = ref.current;
      s.frames++;
      const now = performance.now();
      if (now - s.last >= 1000) {
        setFps(s.frames);
        s.frames = 0;
        s.last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const qualityColors = {
    performance: "var(--warning)",
    balanced: "var(--info)",
    ultra: "var(--success)",
  };

  return (
    <div className="statusbar">
      <span>{fps} FPS</span>
      <span style={{ color: qualityColors[env.qualityPreset] || "var(--text-faint)" }}>
        {env.qualityPreset || "balanced"}
      </span>

      <div style={{ flex: 1 }} />

      <span>{scene.objects.length} objects</span>
      <span>Mode: {mode}</span>
      <span>Gizmo: {transformMode}</span>
      <span>Snap: {snapEnabled ? "ON" : "OFF"}</span>
      <span>Cam: {fpsCam ? "FPS" : "Orbit"}</span>
      <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
      <span style={{ color: "var(--text-faint)" }}>{scene.name || "Untitled"}</span>
    </div>
  );
}