import React from "react";
import Editor from "@editor/Editor";
import HollowCity from "./game/HollowCity";
import { useEditorStore } from "@store/editorStore";

export default function App() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);

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
