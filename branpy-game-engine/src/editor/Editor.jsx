import React, { useState } from "react";
import Toolbar from "./Toolbar";
import Viewport from "./Viewport";
import SidePanel from "./SidePanel";
import { useEditorStore } from "@store/editorStore";

export default function Editor() {
  const [tab, setTab] = useState("objects");
  const mode = useEditorStore((s) => s.mode);

  return (
    <div className="w-full h-full flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Viewport />
        <SidePanel tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}
