import React from "react";
import { useEditorStore } from "@store/editorStore";
import ObjectList from "./ObjectList";
import Properties from "./Properties";

export default function SidePanel({ tab, setTab }) {
  const scene = useEditorStore((s) => s.scene);
  const selectedId = useEditorStore((s) => s.selectedId);

  return (
    <div className="w-72 flex-shrink-0 flex flex-col bg-[#0d0d0d] border-l border-[rgba(255,255,255,0.04)] overflow-hidden">
      <div className="flex border-b border-[rgba(255,255,255,0.04)]">
        {["objects", "properties"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === t ? "text-[#6366f1] border-b-2 border-[#6366f1]" : "text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.55)]"
            }`}
          >{t === "objects" ? "Objects" : "Properties"}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "objects" ? <ObjectList /> : <Properties />}
      </div>
      <div className="p-2 border-t border-[rgba(255,255,255,0.04)]">
        <div className="text-xs text-[rgba(255,255,255,0.25)] font-mono">
          {scene.objects.length} objects · {scene.name}
        </div>
      </div>
    </div>
  );
}
