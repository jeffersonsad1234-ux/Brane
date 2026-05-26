import React, { useState, useRef } from "react";
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

  return (
    <div className="h-10 flex items-center gap-1 px-2 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.04)] flex-shrink-0">
      <div className="flex items-center gap-1 mr-2">
        <span className="text-xs font-bold text-[#6366f1] tracking-wide">BRANPY</span>
        <span className="text-[10px] text-[rgba(255,255,255,0.2)] font-mono">v0.1</span>
      </div>

      <div className="relative">
        <button onClick={() => setShowFile(!showFile)}
          className="px-2 py-1 text-xs text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.7)] rounded transition-colors"
        >File ▾</button>
        {showFile && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowFile(false)} />
            <div className="absolute top-full left-0 mt-1 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-lg p-1 z-20 min-w-[140px] shadow-xl">
              <button onClick={() => { resetScene(); setShowFile(false); }}
                className="block w-full text-left px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.04)] rounded"
              >New Scene</button>
              <button onClick={() => { exportScene(); setShowFile(false); }}
                className="block w-full text-left px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.04)] rounded"
              >Export JSON</button>
              <button onClick={() => { fileRef.current?.click(); }}
                className="block w-full text-left px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.04)] rounded"
              >Import JSON</button>
              <button onClick={() => { handleDownloadBuild(); setShowFile(false); }}
                className="block w-full text-left px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.04)] rounded"
              >Download Build</button>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            </div>
          </>
        )}
      </div>

      <div className="w-px h-4 bg-[rgba(255,255,255,0.06)] mx-1" />

      {[{ t: "cube", l: "⬡" }, { t: "sphere", l: "⬤" }, { t: "plane", l: "▭" }, { t: "cylinder", l: "⬢" }, { t: "light", l: "☀" }, { t: "camera", l: "◉" }].map(({ t, l }) => (
        <button key={t} onClick={() => addObject(t)} title={`Add ${t}`}
          className="px-1.5 py-1 text-xs text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.04)] rounded transition-all"
        >{l}</button>
      ))}

      <div className="flex-1" />

      <div className="relative">
        <button onClick={() => setShowDemo(!showDemo)}
          className="px-2 py-1 text-xs text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.7)] rounded transition-colors"
        >Scenes ▾</button>
        {showDemo && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDemo(false)} />
            <div className="absolute top-full right-0 mt-1 bg-[#151515] border border-[rgba(255,255,255,0.08)] rounded-lg p-1 z-20 min-w-[160px] shadow-xl">
              <button onClick={loadHorrorDemo}
                className="block w-full text-left px-2.5 py-1.5 text-xs text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.04)] rounded"
              >🌫️ Silent Hill — Dark Street</button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => setMode(mode === "edit" ? "play" : "edit")}
          className={`px-2.5 py-1 text-xs rounded transition-colors font-medium ${
            mode === "play" ? "bg-[rgba(16,185,129,0.12)] text-[#10b981]" : "bg-[rgba(99,102,241,0.1)] text-[#6366f1] hover:bg-[rgba(99,102,241,0.18)]"
          }`}
        >{mode === "edit" ? "▶ Play" : "◼ Stop"}</button>
      </div>
    </div>
  );
}
