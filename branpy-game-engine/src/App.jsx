import React, { useEffect } from "react";
import Editor from "@editor/Editor";
import { useEditorStore } from "@store/editorStore";

export default function App() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);

  useEffect(() => {
    const path = window.location.pathname;
    setMode(path.endsWith("/editor") ? "edit" : "play");
  }, [setMode]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && mode === "play") {
        setMode("edit");
        window.history.pushState(null, "", "/engine/editor");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode, setMode]);

  return (
    <div className="w-full h-full flex flex-col">
      <Editor />
    </div>
  );
}
