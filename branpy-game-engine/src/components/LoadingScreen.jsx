import React from "react";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="text-4xl font-bold text-[#6366f1] mb-2 animate-pulse">BRANPY</div>
        <div className="text-sm text-[rgba(255,255,255,0.3)]">Game Engine · Loading...</div>
      </div>
    </div>
  );
}
