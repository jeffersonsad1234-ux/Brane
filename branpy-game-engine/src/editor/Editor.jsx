import React, { useState, useRef, useCallback, useEffect } from "react";
import Toolbar from "./Toolbar";
import Viewport from "./Viewport";
import ObjectList from "./ObjectList";
import Properties from "./Properties";
import StatusBar from "./StatusBar";
import BottomPanel from "./BottomPanel";

function ResizablePanel({ side, defaultWidth, minWidth, maxWidth, children }) {
  const [width, setWidth] = useState(defaultWidth);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const newW = side === "left" ? e.clientX : window.innerWidth - e.clientX;
      setWidth(Math.max(minWidth, Math.min(maxWidth, newW)));
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [side, minWidth, maxWidth]);

  return (
    <aside style={{ width, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--panel)", borderRight: side === "left" ? "1px solid var(--border)" : "none", borderLeft: side === "right" ? "1px solid var(--border)" : "none", position: "relative" }}>
      {children}
      <div onMouseDown={onMouseDown} style={{ position: "absolute", top: 0, bottom: 0, [side === "left" ? "right" : "left"]: -2, width: 4, cursor: "col-resize", zIndex: 10 }} />
    </aside>
  );
}

export default function Editor() {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "var(--bg)" }}>
      <Toolbar />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <ResizablePanel side="left" defaultWidth={270} minWidth={180} maxWidth={400}>
          <div className="panel-header">
            <span>Hierarchy</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}>
            <ObjectList />
          </div>
        </ResizablePanel>

        <Viewport />

        <ResizablePanel side="right" defaultWidth={270} minWidth={180} maxWidth={400}>
          <div className="panel-header">
            <span>Inspector</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <Properties />
          </div>
        </ResizablePanel>
      </div>

      <BottomPanel />
      <StatusBar />
    </div>
  );
}
