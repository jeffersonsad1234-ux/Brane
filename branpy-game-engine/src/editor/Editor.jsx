import React from "react";
import Toolbar from "./Toolbar";
import Viewport from "./Viewport";
import ObjectList from "./ObjectList";
import Properties from "./Properties";
import StatusBar from "./StatusBar";
import { useEditorStore } from "@store/editorStore";

export default function Editor() {
  const mode = useEditorStore((s) => s.mode);
  const transformMode = useEditorStore((s) => s.transformMode);
  const snapEnabled = useEditorStore((s) => s.snapEnabled);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: "var(--bg)" }}>
      <Toolbar />

      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Left Panel - Object List */}
        <aside
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: "var(--panel-w)", background: "var(--panel)", borderRight: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.25)", borderBottom: "1px solid var(--border)" }}
          >
            <span>Objects</span>
            <span style={{ color: "rgba(255,255,255,0.12)", fontWeight: 400 }}>
              ({useEditorStore((s) => s.scene.objects.length)})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ObjectList />
          </div>
        </aside>

        {/* Center - Viewport */}
        <Viewport />

        {/* Right Panel - Properties */}
        <aside
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{ width: "var(--panel-w)", background: "var(--panel)", borderLeft: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.25)", borderBottom: "1px solid var(--border)" }}
          >
            <span>Properties</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Properties />
          </div>
        </aside>
      </div>

      <StatusBar />

      {mode === "play" && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div className="text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
            <div className="text-3xl mb-2 opacity-40">▶</div>
            <div className="text-sm mb-1">Play Mode</div>
            <div className="text-xs opacity-40">WASD move · Mouse look · Esc to exit</div>
          </div>
        </div>
      )}
    </div>
  );
}
