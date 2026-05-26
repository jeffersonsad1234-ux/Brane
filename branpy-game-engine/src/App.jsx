import React, { useState, useEffect, useCallback } from "react";
import Editor from "@editor/Editor";
import TechDemo from "./engine/demo/TechDemo";
import { useEditorStore } from "@store/editorStore";

function getPageFromPath() {
  const path = window.location.pathname;
  if (path.endsWith("/editor")) return "editor";
  return "play";
}

export default function App() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const [page, setPage] = useState(getPageFromPath);

  useEffect(() => {
    const handlePop = () => setPage(getPageFromPath());
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  const goToPlay = useCallback(() => {
    window.history.pushState(null, "", "/engine/play");
    setPage("play");
  }, []);

  const goToEditor = useCallback(() => {
    window.history.pushState(null, "", "/engine/editor");
    setPage("editor");
    setMode("edit");
  }, [setMode]);

  useEffect(() => {
    if (mode === "play" && page === "editor") {
      goToPlay();
    }
  }, [mode, page, goToPlay]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (page === "play") goToEditor();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [page, goToEditor]);

  if (page === "play") {
    return (
      <div className="w-full h-full" style={{ position: "relative" }}>
        <TechDemo />
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 8, zIndex: 50, pointerEvents: "auto",
        }}>
          <button onClick={goToEditor}
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "5px 14px", borderRadius: 6, fontSize: 10, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(4px)" }}>
            Open Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col" tabIndex={0}>
      <Editor />
    </div>
  );
}
