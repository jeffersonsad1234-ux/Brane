import React, { useState, useRef, useEffect } from "react";
import { useEditorStore } from "@store/editorStore";

export default function Toolbar() {
  const addObject = useEditorStore((s) => s.addObject);
  const exportScene = useEditorStore((s) => s.exportScene);
  const importScene = useEditorStore((s) => s.importScene);
  const setScene = useEditorStore((s) => s.setScene);
  const resetScene = useEditorStore((s) => s.resetScene);
  const scene = useEditorStore((s) => s.scene);
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const transformMode = useEditorStore((s) => s.transformMode);
  const setTransformMode = useEditorStore((s) => s.setTransformMode);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const setSnapEnabled = useEditorStore((s) => s.setSnapEnabled);
  const fpsCam = useEditorStore((s) => s.fpsCam);
  const setFpsCam = useEditorStore((s) => s.setFpsCam);
  const showGrid = useEditorStore((s) => s.showGrid);
  const setShowGrid = useEditorStore((s) => s.setShowGrid);
  const selectedId = useEditorStore((s) => s.selectedId);
  const removeObject = useEditorStore((s) => s.removeObject);
  const duplicateObject = useEditorStore((s) => s.duplicateObject);

  const [showFile, setShowFile] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const fileRef = useRef(null);

  const loadHorrorDemo = async () => {
    try {
      const mod = await import("@engine/presets/horrorScene");
      setScene(mod.default);
      setShowDemo(false);
    } catch (e) {
      console.error("Failed to load horror demo:", e);
    }
  };

  const handleImport = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { importScene(reader.result); setShowFile(false); };
    reader.readAsText(f);
    e.target.value = "";
  };

  const handleDownloadBuild = () => {
    const { downloadBuildHTML } = require("@engine/export/sceneExporter");
    downloadBuildHTML(scene);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "w" || e.key === "W") { setTransformMode("translate"); e.preventDefault(); }
      if (e.key === "e" || e.key === "E") { setTransformMode("rotate"); e.preventDefault(); }
      if (e.key === "r" || e.key === "R") { setTransformMode("scale"); e.preventDefault(); }
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedId) { removeObject(selectedId); e.preventDefault(); } }
      if ((e.key === "d" || e.key === "D") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (selectedId) duplicateObject(selectedId); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const gizmoModes = [
    { key: "translate", label: "T", title: "Translate (W)" },
    { key: "rotate", label: "R", title: "Rotate (E)" },
    { key: "scale", label: "S", title: "Scale (R)" },
  ];

  const addButtons = [
    { type: "cube", icon: "◇" },
    { type: "sphere", icon: "●" },
    { type: "plane", icon: "▭" },
    { type: "cylinder", icon: "⬢" },
    { type: "light", icon: "☀" },
    { type: "camera", icon: "◉" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 2, padding: "0 8px",
      height: "var(--toolbar-h)", background: "linear-gradient(180deg, var(--bg-alt) 0%, var(--panel) 100%)",
      borderBottom: "1px solid var(--border)", flexShrink: 0,
      position: "relative", zIndex: 20
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 12 }}>
        <span style={{
          fontSize: 14, fontWeight: 700,
          background: "var(--gradient-accent)", WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent", letterSpacing: "-0.02em"
        }}>BRANPY</span>
        <span style={{ fontSize: 9, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>v0.2</span>
      </div>

      <div className="sep" />

      {/* File Menu */}
      <div style={{ position: "relative" }}>
        <button className="btn" onClick={() => setShowFile(!showFile)}>File ▾</button>
        {showFile && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFile(false)} />
            <div className="panel animate-slide-up" style={{
              position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 20,
              minWidth: 150, padding: 4
            }}>
              <button className="btn" style={{ width: "100%", justifyContent: "flex-start", padding: "5px 8px", borderRadius: 3 }}
                onClick={() => { resetScene(); setShowFile(false); }}>New Scene</button>
              <button className="btn" style={{ width: "100%", justifyContent: "flex-start", padding: "5px 8px", borderRadius: 3 }}
                onClick={() => { exportScene(); setShowFile(false); }}>Export JSON</button>
              <button className="btn" style={{ width: "100%", justifyContent: "flex-start", padding: "5px 8px", borderRadius: 3 }}
                onClick={() => { fileRef.current?.click(); }}>Import JSON</button>
              <div className="sep" style={{ width: "100%", height: 1, margin: "4px 0" }} />
              <button className="btn" style={{ width: "100%", justifyContent: "flex-start", padding: "5px 8px", borderRadius: 3 }}
                onClick={() => { handleDownloadBuild(); setShowFile(false); }}>Download Build</button>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            </div>
          </>
        )}
      </div>

      <div className="sep" />

      {/* Add Objects */}
      {addButtons.map(({ type, icon }) => (
        <button key={type} className="btn btn--icon" title={`Add ${type}`}
          onClick={() => addObject(type)} style={{ fontSize: 13 }}>{icon}</button>
      ))}

      <div className="sep" />

      {/* Gizmo Modes */}
      {gizmoModes.map(({ key, label, title }) => (
        <button key={key} className={`btn btn--icon ${transformMode === key ? "btn--active" : ""}`}
          onClick={() => setTransformMode(key)} title={title}
          style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{label}</button>
      ))}

      <div className="sep" />

      {/* Snap */}
      <button className={`btn btn--icon ${snapEnabled ? "btn--active" : ""}`}
        onClick={() => setSnapEnabled(!snapEnabled)} title="Toggle Snap"
        style={{ fontSize: 11 }}>⊞</button>

      {/* Grid */}
      <button className={`btn btn--icon ${!showGrid ? "" : ""}`}
        onClick={() => setShowGrid(!showGrid)} title="Toggle Grid (G)"
        style={{ fontSize: 11 }}>⊟</button>

      <div style={{ flex: 1 }} />

      {/* Edit/Play mode */}
      <button className={`btn btn--icon ${fpsCam ? "btn--active" : ""}`}
        onClick={() => setFpsCam(!fpsCam)} title="FPS Camera"
        style={{ fontSize: 11 }}>👁</button>

      {/* Scene Presets */}
      <div style={{ position: "relative" }}>
        <button className="btn" onClick={() => setShowDemo(!showDemo)}>Scenes ▾</button>
        {showDemo && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDemo(false)} />
            <div className="panel animate-slide-up" style={{
              position: "absolute", top: "100%", right: 0, marginTop: 4, zIndex: 20,
              minWidth: 170, padding: 4
            }}>
              <button className="btn" style={{ width: "100%", justifyContent: "flex-start", padding: "5px 8px", borderRadius: 3 }}
                onClick={loadHorrorDemo}>Silent Hill &mdash; Dark Street</button>
            </div>
          </>
        )}
      </div>

      <div className="sep" />

      {/* Play/Stop */}
      <button onClick={() => setMode(mode === "edit" ? "play" : "edit")}
        className="btn"
        style={{
          color: mode === "play" ? "var(--success)" : "var(--text-dim)",
          background: mode === "play" ? "rgba(16,185,129,0.08)" : "transparent",
          border: mode === "play" ? "1px solid rgba(16,185,129,0.15)" : "1px solid transparent",
          fontWeight: 500
        }}>
        {mode === "edit" ? "▶ Play" : "◼ Stop"}
      </button>
    </div>
  );
}