import React, { useRef, useEffect, useState, useCallback } from "react";
import SpaceDemo from "./SpaceDemo.js";

export default function SpaceDemoApp({ onClose }) {
  const mountRef = useRef(null);
  const demoRef = useRef(null);
  const [status, setStatus] = useState("starting");
  const [hud, setHud] = useState({ speed: 0, cruising: false });

  const onStateChange = useCallback((s) => {
    setHud(s);
    if (status === "starting") setStatus("playing");
  }, [status]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const demo = new SpaceDemo(container, { onStateChange });
    demoRef.current = demo;
    const ok = demo.init();
    if (!ok) setStatus("error");

    return () => {
      if (demo) demo.dispose();
      demoRef.current = null;
    };
  }, [onStateChange]);

  const handleRestart = () => window.location.reload();

  const handleClose = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    onClose();
  };

  return (
    <div className="demo-app-root">
      <div ref={mountRef} className="demo-app-canvas" />

      <button className="demo-app-close" onClick={handleClose}>✕ Fechar Demo</button>

      {status === "starting" && (
        <div className="demo-app-loading">
          <div className="demo-app-spinner" />
          <p>Inicializando espaço profundo...</p>
        </div>
      )}

      {status === "error" && (
        <div className="demo-app-overlay">
          <div className="demo-app-modal">
            <div className="demo-app-modal-icon">⚠️</div>
            <h2>Erro na Engine</h2>
            <p>Não foi possível iniciar a demonstração espacial.</p>
            <div className="demo-app-buttons">
              <button className="bs-btn bs-btn-primary" onClick={handleRestart}>🔄 Tentar novamente</button>
              <button className="bs-btn bs-btn-secondary" onClick={handleClose}>✕ Fechar</button>
            </div>
          </div>
        </div>
      )}

      {status === "playing" && (
        <div className="sp-hud">
          <div className="sp-speed-display">
            <div className="sp-speed-bar-track">
              <div
                className="sp-speed-bar-fill"
                style={{ width: `${Math.min(hud.speed / 40 * 100, 100)}%` }}
              />
            </div>
            <div className="sp-speed-text">
              {hud.speed} <span className="sp-speed-unit">U/s</span>
            </div>
          </div>
          {hud.cruising && (
            <div className="sp-cruising-indicator">● CRUISE</div>
          )}
          <div className="sp-controls-hint">
            <div>W/S — Propulsão</div>
            <div>A/D — Lateral</div>
            <div>Shift — Turbo</div>
            <div>Mouse — Visão</div>
          </div>
        </div>
      )}
    </div>
  );
}
