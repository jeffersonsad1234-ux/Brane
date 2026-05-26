import React, { useState, useRef } from "react";
import Editor from "@editor/Editor";
import { useEditorStore } from "@store/editorStore";

export default function App() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const scene = useEditorStore((s) => s.scene);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && mode === "play") {
      setMode("edit");
    }
  };

  return (
    <div className="w-full h-full flex flex-col" tabIndex={0} onKeyDown={handleKeyDown} ref={canvasRef}>
      {mode === "edit" ? (
        <Editor />
      ) : (
        <div className="w-full h-full flex flex-col bg-[#0a0a0a]">
          <div className="h-9 flex items-center px-3 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.04)]">
            <span className="text-xs text-[rgba(16,185,129,0.6)]">▶ PLAY MODE</span>
            <span className="text-xs text-[rgba(255,255,255,0.2)] ml-2">WASD move · Mouse look · Space jump · Esc exit</span>
            <div className="flex-1" />
            <button onClick={() => setMode("edit")}
              className="px-2 py-0.5 text-xs bg-[rgba(239,68,68,0.1)] text-[rgba(239,68,68,0.5)] hover:bg-[rgba(239,68,68,0.15)] rounded transition-colors"
            >Stop</button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-10">🎮</div>
              <p className="text-sm text-[rgba(255,255,255,0.3)] mb-2">Game Preview — {scene.name}</p>
              <p className="text-xs text-[rgba(255,255,255,0.15)]">Export as HTML build for full first-person experience</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
