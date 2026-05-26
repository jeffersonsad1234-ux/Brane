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

  const gizmoModes = [
    { key: "translate", label: "T", title: "Translate (W)" },
    { key: "rotate", label: "R", title: "Rotate (E)" },
    { key: "scale", label: "S", title: "Scale (R)" },
  ];

  const addButtons = [
    { type: "cube", label: "Cube", icon: "◇" },
    { type: "sphere", label: "Sphere", icon: "●" },
    { type: "plane", label: "Plane", icon: "▭" },
    { type: "cylinder", label: "Cylinder", icon: "⬢" },
    { type: "light", label: "Light", icon: "☀" },
    { type: "camera", label: "Camera", icon: "◉" },
  ];

  const handleKeyDown = (e) => {
    if (e.key === "w" || e.key === "W") setTransformMode("translate");
    if (e.key === "e" || e.key === "E") setTransformMode("rotate");
    if (e.key === "r" || e.key === "R") setTransformMode("scale");
    if (e.key === "Delete" || e.key === "Backspace") { if (selectedId) removeObject(selectedId); }
    if (e.key === "d" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (selectedId) duplicateObject(selectedId); }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div
      className="flex items-center gap-1 px-2 flex-shrink-0"
      style={{ height: "var(--toolbar-h)", background: "var(--panel)", borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mr-3">
        <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>BRANPY</span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>v0.2</span>
      </div>

      <div className="separator" />

      {/* File menu */}
      <div className="relative">
        <button onClick={() => setShowFile(!showFile)} className="btn"
        >File ▾</button>
        {showFile && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFile(false)} />
            <div className="absolute top-full left-0 mt-1 z-20 panel p-1 min-w-[140px] shadow-xl">
              <button onClick={() => { resetScene(); setShowFile(false); }} className="btn w-full text-left px-2.5 py-1.5 rounded"
              >New Scene</button>
              <button onClick={() => { exportScene(); setShowFile(false); }} className="btn w-full text-left px-2.5 py-1.5 rounded"
              >Export JSON</button>
              <button onClick={() => { fileRef.current?.click(); }} className="btn w-full text-left px-2.5 py-1.5 rounded"
              >Import JSON</button>
              <button onClick={() => { handleDownloadBuild(); setShowFile(false); }} className="btn w-full text-left px-2.5 py-1.5 rounded"
              >Download Build</button>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            </div>
          </>
        )}
      </div>

      <div className="separator" />

      {/* Add object buttons */}
      {addButtons.map(({ type, label, icon }) => (
        <button key={type} onClick={() => addObject(type)} title={`Add ${label}`}
          className="btn btn--icon text-sm"
        >{icon}</button>
      ))}

      <div className="separator" />

      {/* Gizmo mode buttons */}
      {gizmoModes.map(({ key, label, title }) => (
        <button key={key} onClick={() => setTransformMode(key)} title={title}
          className={`btn btn--icon text-xs font-bold ${transformMode === key ? "btn--active" : ""}`}
        >{label}</button>
      ))}

      <div className="separator" />

      {/* Snap toggle */}
      <button onClick={() => setSnapEnabled(!snapEnabled)} title="Toggle Snap (S)"
        className={`btn btn--icon text-xs ${snapEnabled ? "btn--active" : ""}`}
        style={{ fontSize: 10 }}
      >⊞</button>

      {/* Grid toggle */}
      <button onClick={() => setShowGrid(!showGrid)} title="Toggle Grid (G)"
        className={`btn btn--icon text-xs ${showGrid ? "" : ""}`}
        style={{ fontSize: 10 }}
      >⊟</button>

      <div className="flex-1" />

      {/* FPS cam toggle */}
      <button onClick={() => setFpsCam(!fpsCam)} title="FPS Camera"
        className={`btn btn--icon text-xs ${fpsCam ? "btn--active" : ""}`}
      >👁</button>

      {/* Scene presets */}
      <div className="relative">
        <button onClick={() => setShowDemo(!showDemo)} className="btn"
        >Scenes ▾</button>
        {showDemo && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDemo(false)} />
            <div className="absolute top-full right-0 mt-1 z-20 panel p-1 min-w-[160px] shadow-xl">
              <button onClick={loadHorrorDemo}
                className="btn w-full text-left px-2.5 py-1.5 rounded"
              >Silent Hill — Dark Street</button>
            </div>
          </>
        )}
      </div>

      <div className="separator" />

      {/* Play/Stop */}
      <button onClick={() => setMode(mode === "edit" ? "play" : "edit")}
        className={`btn ${mode === "play" ? "btn--active" : ""}`}
        style={{
          color: mode === "play" ? "var(--success)" : undefined,
          background: mode === "play" ? "rgba(16,185,129,0.1)" : undefined,
        }}
      >{mode === "edit" ? "▶ Play" : "◼ Stop"}</button>
    </div>
  );
}