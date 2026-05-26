import React from "react";

export default function FileMenu({ onExportJSON, onImportJSON, onReset, onBuild }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onReset}
        className="px-2 py-1 text-xs text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.7)] rounded transition-colors"
      >New</button>
      <button onClick={onImportJSON}
        className="px-2 py-1 text-xs text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.7)] rounded transition-colors"
      >Import</button>
      <button onClick={onExportJSON}
        className="px-2 py-1 text-xs text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.7)] rounded transition-colors"
      >Export</button>
      <button onClick={onBuild}
        className="px-2 py-1 text-xs bg-[rgba(99,102,241,0.1)] text-[#6366f1] hover:bg-[rgba(99,102,241,0.18)] rounded transition-colors"
      >Build</button>
    </div>
  );
}
