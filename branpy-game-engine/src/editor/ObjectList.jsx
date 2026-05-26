import React from "react";
import { useEditorStore } from "@store/editorStore";

const icons = { cube: "⬡", sphere: "⬤", plane: "▭", cylinder: "⬢", light: "☀", camera: "◉" };

export default function ObjectList() {
  const objects = useEditorStore((s) => s.scene.objects);
  const selectedId = useEditorStore((s) => s.selectedId);
  const setSelected = useEditorStore((s) => s.setSelected);
  const removeObject = useEditorStore((s) => s.removeObject);
  const updateObject = useEditorStore((s) => s.updateObject);

  return (
    <div className="p-1 space-y-0.5">
      {objects.length === 0 && (
        <div className="text-xs text-[rgba(255,255,255,0.2)] p-3 text-center">Empty scene</div>
      )}
      {objects.map((obj) => (
        <div key={obj.id}
          onClick={() => setSelected(obj.id)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors group ${
            selectedId === obj.id ? "bg-[rgba(99,102,241,0.1)] text-[#6366f1]" : "hover:bg-[rgba(255,255,255,0.03)] text-[rgba(255,255,255,0.55)]"
          }`}
        >
          <span className="w-5 text-center opacity-50 text-sm">{icons[obj.type] || "?"}</span>
          <span className="flex-1 truncate">{obj.name}</span>
          <button onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { visible: !obj.visible }); }}
            className={`text-xs opacity-0 group-hover:opacity-50 transition-opacity ${obj.visible ? "text-[rgba(255,255,255,0.3)]" : "text-[rgba(255,255,255,0.1)]"}`}
          >{obj.visible ? "👁" : "—"}</button>
          <button onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
            className="text-xs opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity text-red-400"
          >✕</button>
        </div>
      ))}
    </div>
  );
}
