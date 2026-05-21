import React, { useRef, useEffect, useState, useCallback } from "react";
import GalaxySurvivalDemo from "./GalaxySurvivalDemo.js";

export default function GalaxySurvivalApp({ onClose }) {
  const mountRef = useRef(null);
  const demoRef = useRef(null);
  const [status, setStatus] = useState("starting");
  const [hud, setHud] = useState({ health: 100, stamina: 100, oxygen: 100, nearShip: false });

  const onStateChange = useCallback((s) => {
    setHud(s);
    if (status === "starting") setStatus("playing");
  }, [status]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const demo = new GalaxySurvivalDemo(container, { onStateChange });
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
          <p>Inicializando Galaxy Survival...</p>
        </div>
      )}

      {status === "error" && (
        <div className="demo-app-overlay">
          <div className="demo-app-modal">
            <div className="demo-app-modal-icon">⚠️</div>
            <h2>Erro na Engine</h2>
            <p>Não foi possível iniciar Galaxy Survival.</p>
            <div className="demo-app-buttons">
              <button className="bs-btn bs-btn-primary" onClick={handleRestart}>🔄 Tentar novamente</button>
              <button className="bs-btn bs-btn-secondary" onClick={handleClose}>✕ Fechar</button>
            </div>
          </div>
        </div>
      )}

      {status === "playing" && (
        <div className="gs-hud">
          <div className="gs-stats">
            <div className="gs-stat">
              <div className="gs-stat-icon">❤️</div>
              <div className="gs-stat-bar">
                <div className="gs-stat-fill gs-health" style={{ width: `${hud.health}%` }} />
              </div>
              <div className="gs-stat-value">{hud.health}</div>
            </div>
            <div className="gs-stat">
              <div className="gs-stat-icon">🔋</div>
              <div className="gs-stat-bar">
                <div className="gs-stat-fill gs-stamina" style={{ width: `${hud.stamina}%` }} />
              </div>
              <div className="gs-stat-value">{hud.stamina}</div>
            </div>
            <div className="gs-stat">
              <div className="gs-stat-icon">💨</div>
              <div className="gs-stat-bar">
                <div className="gs-stat-fill gs-oxygen" style={{ width: `${hud.oxygen}%` }} />
              </div>
              <div className="gs-stat-value">{hud.oxygen}</div>
            </div>
          </div>

          {hud.nearShip && (
            <div className="gs-ship-notice">🚀 Na nave — oxigênio recarregando</div>
          )}

          <div className="gs-crosshair">+</div>

          <div className="gs-controls">
            <div>WASD — Andar</div>
            <div>Shift — Correr</div>
            <div>Espaço — Pular</div>
          </div>
        </div>
      )}
    </div>
  );
}
