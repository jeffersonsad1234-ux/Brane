import React, { useState, useEffect } from "react";
import { useEditorStore } from "@store/editorStore";

function FpsCounter() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0, last = performance.now(), raf;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span>{fps} FPS</span>;
}

export default function StatusBar() {
  const scene = useEditorStore((s) => s.scene);
  const mode = useEditorStore((s) => s.mode);
  const transformMode = useEditorStore((s) => s.transformMode);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const fpsCam = useEditorStore((s) => s.fpsCam);

  return (
    <div
      className="flex items-center gap-3 px-3 flex-shrink-0"
      style={{ height: "var(--statusbar-h)", background: "var(--panel)", borderTop: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
        <FpsCounter />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
        <span>{scene.objects.length} objects</span>
        <span>Mode: {mode}</span>
        <span>Gizmo: {transformMode}</span>
        <span>Snap: {snapEnabled ? "ON" : "OFF"}</span>
        <span>Cam: {fpsCam ? "FPS" : "Orbit"}</span>
        <span style={{ color: "rgba(255,255,255,0.12)" }}>{scene.name || "Untitled"}</span>
      </div>
    </div>
  );
}