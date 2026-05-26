import React from "react";
import { useEditorStore } from "@store/editorStore";

const icons = {
  cube: "◇",
  sphere: "●",
  plane: "▭",
  cylinder: "⬢",
  light: "☀",
  camera: "◉",
};

const typeColors = {
  cube: "var(--accent)",
  sphere: "#ec4899",
  plane: "#2a2a3a",
  cylinder: "#f59e0b",
  light: "#fbbf24",
  camera: "#10b981",
};

export default function ObjectList() {
  const objects = useEditorStore((s) => s.scene.objects);
  const selectedId = useEditorStore((s) => s.selectedId);
  const setSelected = useEditorStore((s) => s.setSelected);
  const removeObject = useEditorStore((s) => s.removeObject);
  const updateObject = useEditorStore((s) => s.updateObject);

  if (objects.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">◇</div>
        <div>Empty Scene</div>
        <div style={{ marginTop: 4, fontSize: 10 }}>Add objects from the toolbar</div>
      </div>
    );
  }

  return (
    <div>
      {objects.map((obj, i) => (
        <div key={obj.id}
          className={`tree-item ${selectedId === obj.id ? "tree-item--selected" : ""}`}
          onClick={() => setSelected(obj.id)}
          style={{ paddingLeft: 8 + (obj.parent ? 16 : 0) }}
        >
          {/* Expand hint (flat list, no nesting yet) */}
          <span className="tree-item-icon" style={{ color: typeColors[obj.type] || "var(--text-faint)" }}>
            {icons[obj.type] || "?"}
          </span>

          <span className="tree-item-label">{obj.name}</span>

          <div className="tree-item-actions">
            <button className="tree-item-action"
              onClick={(e) => { e.stopPropagation(); updateObject(obj.id, { visible: !obj.visible }); }}
              title={obj.visible ? "Hide" : "Show"}
            >{obj.visible ? "◉" : "○"}</button>
            <button className="tree-item-action tree-item-action--danger"
              onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
              title="Delete"
            >✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}