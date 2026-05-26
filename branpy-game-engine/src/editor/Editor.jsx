import React from "react";
import Toolbar from "./Toolbar";
import Viewport from "./Viewport";
import ObjectList from "./ObjectList";
import Properties from "./Properties";
import StatusBar from "./StatusBar";
import BottomPanel from "./BottomPanel";
import { useEditorStore } from "@store/editorStore";

export default function Editor() {
  const mode = useEditorStore((s) => s.mode);
  const scene = useEditorStore((s) => s.scene);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "var(--bg)" }}>
      <Toolbar />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* Left Panel - Hierarchy */}
        <aside style={{
          width: "var(--panel-w)", flexShrink: 0, display: "flex", flexDirection: "column",
          overflow: "hidden", background: "var(--panel)", borderRight: "1px solid var(--border)"
        }}>
          <div className="panel-header">
            <span>Hierarchy</span>
            <span className="badge">{scene.objects.length}</span>
          </div>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "4px 6px", flexShrink: 0 }}>
              <input className="input input--string" placeholder="Search objects..." style={{ fontSize: 10, padding: "3px 6px" }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}>
              <ObjectList />
            </div>
          </div>
        </aside>

        {/* Center - Viewport */}
        <Viewport />

        {/* Right Panel - Inspector */}
        <aside style={{
          width: "var(--panel-w)", flexShrink: 0, display: "flex", flexDirection: "column",
          overflow: "hidden", background: "var(--panel)", borderLeft: "1px solid var(--border)"
        }}>
          <div className="panel-header">
            <span>Inspector</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <Properties />
          </div>
        </aside>
      </div>

      <BottomPanel />
      <StatusBar />

      {mode === "play" && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)"
        }}>
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>▶</div>
            <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Play Mode</div>
            <div style={{ fontSize: 10, opacity: 0.4 }}>WASD &middot; Mouse &middot; Esc to exit</div>
          </div>
        </div>
      )}
    </div>
  );
}