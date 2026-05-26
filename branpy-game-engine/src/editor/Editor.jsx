import React from "react";
import Toolbar from "./Toolbar";
import Viewport from "./Viewport";
import ObjectList from "./ObjectList";
import Properties from "./Properties";
import StatusBar from "./StatusBar";
import BottomPanel from "./BottomPanel";

export default function Editor() {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "var(--bg)" }}>
      <Toolbar />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <aside style={{
          width: "var(--panel-w)", flexShrink: 0, display: "flex", flexDirection: "column",
          overflow: "hidden", background: "var(--panel)", borderRight: "1px solid var(--border)"
        }}>
          <div className="panel-header">
            <span>Hierarchy</span>
            <span className="badge">0</span>
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

        <Viewport />

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
    </div>
  );
}