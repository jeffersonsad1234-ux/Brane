import React, { useRef, useEffect, useState, useCallback } from "react";
import GalaxySurvivalDemo from "./GalaxySurvivalDemo.js";

export default function GalaxySurvivalApp({ onClose }) {
  const mountRef = useRef(null);
  const demoRef = useRef(null);
  const [status, setStatus] = useState("starting");
  const [hud, setHud] = useState({
    mode: "player", health: 100, stamina: 100, oxygen: 100,
    nearShip: false, distToShip: 0, shipSpeed: 0, canExit: false,
    debug: [],
  });

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

  const isPlayer = hud.mode === "player";

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
          {/* Stats panel */}
          <div className="gs-stats">
            {isPlayer ? (
              <>
                <div className="gs-stat">
                  <span className="gs-stat-icon">❤️</span>
                  <div className="gs-stat-bar"><div className="gs-stat-fill gs-health" style={{ width: `${hud.health}%` }} /></div>
                  <span className="gs-stat-value">{hud.health}</span>
                </div>
                <div className="gs-stat">
                  <span className="gs-stat-icon">⚡</span>
                  <div className="gs-stat-bar"><div className="gs-stat-fill gs-stamina" style={{ width: `${hud.stamina}%` }} /></div>
                  <span className="gs-stat-value">{hud.stamina}</span>
                </div>
                <div className="gs-stat">
                  <span className="gs-stat-icon">💨</span>
                  <div className="gs-stat-bar"><div className="gs-stat-fill gs-oxygen" style={{ width: `${hud.oxygen}%` }} /></div>
                  <span className="gs-stat-value">{hud.oxygen}</span>
                </div>
              </>
            ) : (
              <>
                <div className="gs-stat">
                  <span className="gs-stat-icon">🚀</span>
                  <div className="gs-stat-bar"><div className="gs-stat-fill gs-speed" style={{ width: `${Math.min(hud.shipSpeed / 30 * 100, 100)}%` }} /></div>
                  <span className="gs-stat-value">{hud.shipSpeed}</span>
                </div>
                <div className="gs-stat">
                  <span className="gs-stat-icon">💨</span>
                  <div className="gs-stat-bar"><div className="gs-stat-fill gs-oxygen" style={{ width: `${hud.oxygen}%` }} /></div>
                  <span className="gs-stat-value">{hud.oxygen}</span>
                </div>
              </>
            )}
          </div>

          {/* Context notices */}
          {isPlayer && hud.nearShip && (
            <div className="gs-notice">🚀 Pressione <strong>E</strong> para entrar na nave</div>
          )}
          {!isPlayer && hud.canExit && (
            <div className="gs-notice">🛸 Pressione <strong>E</strong> para sair da nave</div>
          )}

          {/* Crosshair */}
          <div className="gs-crosshair">+</div>

          {/* Controls */}
          <div className="gs-controls">
            {isPlayer ? (
              <>
                <div>WASD — Andar</div>
                <div>Shift — Correr</div>
                <div>Espaço — Pular</div>
                <div>E — Entrar na nave</div>
              </>
            ) : (
              <>
                <div>W/S — Acelerar/Reduzir</div>
                <div>A/D — Virar</div>
                <div>Espaço — Subir</div>
                <div>Ctrl — Descer</div>
                <div>Shift — Turbo</div>
                <div>E — Sair</div>
              </>
            )}
          </div>

          {/* Debug overlay */}
          <div className="gs-debug">
            {hud.debug.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
