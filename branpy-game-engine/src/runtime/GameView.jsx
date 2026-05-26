import React from "react";

export default function GameView() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4 opacity-20">🎮</div>
        <h2 className="text-lg font-semibold text-[rgba(255,255,255,0.5)] mb-2">Game Preview</h2>
        <p className="text-sm text-[rgba(255,255,255,0.25)] mb-4">
          Play mode with first-person controls is available on the exported HTML build.
        </p>
        <div className="text-xs text-[rgba(255,255,255,0.15)] space-y-1">
          <p>WASD — Move</p>
          <p>Mouse — Look around</p>
          <p>Shift — Run</p>
          <p>Space — Jump</p>
        </div>
      </div>
    </div>
  );
}
