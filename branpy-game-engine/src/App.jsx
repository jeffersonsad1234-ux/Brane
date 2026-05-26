import React, { useState, useEffect } from "react";
import Editor from "@editor/Editor";
import HollowCity from "./game/HollowCity";
import TechDemo from "./engine/demo/TechDemo";
import { useEditorStore } from "@store/editorStore";

export default function App() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const [showDemo, setShowDemo] = useState(true);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && mode !== "edit") {
        setMode("edit");
        setShowDemo(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode, setMode]);

  if (showDemo && mode === "edit") {
    return (
      <div className="w-full h-full" style={{ position: "relative" }}>
        <TechDemo />
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 8, zIndex: 50, pointerEvents: "auto",
        }}>
          <button onClick={() => setShowDemo(false)}
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "5px 14px", borderRadius: 6, fontSize: 10, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(4px)" }}>
            Open Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" tabIndex={0}>
      {mode === "edit" ? (
        <Editor />
      ) : (
        <HollowCity onStop={() => setMode("edit")} />
      )}
    </div>
  );
}
