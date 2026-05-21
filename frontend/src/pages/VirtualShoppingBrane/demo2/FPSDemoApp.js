import React, { useRef, useEffect, useState, useCallback } from "react";
import FPSDemo from "./FPSDemo.js";

export default function FPSDemoApp({ onClose }) {
  const mountRef = useRef(null);
  const demoRef = useRef(null);
  const [status, setStatus] = useState("starting");
  const [hud, setHud] = useState({
    health: 100,
    stamina: 100,
    zombiesAlive: 0,
    gameTime: 0,
    gameOver: false,
  });

  const onStateChange = useCallback((s) => {
    setHud(s);
    if (status === "starting") setStatus("playing");
  }, [status]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const demo = new FPSDemo(container, { onStateChange });
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

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="demo-app-root">
      <div ref={mountRef} className="demo-app-canvas" />

      <button className="demo-app-close" onClick={handleClose}>✕ Fechar Demo</button>

      {status === "starting" && (
        <div className="demo-app-loading">
          <div className="demo-app-spinner" />
          <p>Inicializando...</p>
        </div>
      )}

      {status === "error" && (
        <div className="demo-app-overlay">
          <div className="demo-app-modal">
            <div className="demo-app-modal-icon">⚠️</div>
            <h2>Erro na Engine</h2>
            <p>Não foi possível iniciar a demonstração.</p>
            <div className="demo-app-buttons">
              <button className="bs-btn bs-btn-primary" onClick={handleRestart}>🔄 Tentar novamente</button>
              <button className="bs-btn bs-btn-secondary" onClick={handleClose}>✕ Fechar</button>
            </div>
          </div>
        </div>
      )}

      {status === "playing" && !hud.gameOver && (
        <div className="dh-hud">
          <div className="dh-stats">
            <div className="dh-stat">
              <div className="dh-stat-label">❤️ VIDA</div>
              <div className="dh-stat-bar">
                <div className="dh-stat-fill health" style={{ width: `${hud.health}%` }} />
              </div>
              <div className="dh-stat-value">{Math.round(hud.health)}</div>
            </div>
            <div className="dh-stat">
              <div className="dh-stat-label">⚡ STAMINA</div>
              <div className="dh-stat-bar">
                <div className="dh-stat-fill stamina" style={{ width: `${hud.stamina}%` }} />
              </div>
              <div className="dh-stat-value">{Math.round(hud.stamina)}</div>
            </div>
          </div>

          <div className="dh-crosshair">+</div>

          <div className="dh-objective">
            <span>🧟 {hud.zombiesAlive} zumbis</span>
            <span className="dh-sep">|</span>
            <span>Sobreviva</span>
            <span className="dh-sep">|</span>
            <span>⏱ {formatTime(hud.gameTime)}</span>
          </div>

          <div className="dh-controls">
            <div>WASD — Andar</div>
            <div>Shift — Correr</div>
            <div>Espaço — Pular</div>
            <div>Ctrl — Deslizar</div>
          </div>
        </div>
      )}

      {hud.gameOver && (
        <div className="demo-app-overlay">
          <div className="demo-app-modal">
            <div className="demo-app-modal-icon">💀</div>
            <h2 style={{ color: "#ee3344" }}>GAME OVER</h2>
            <p>Você foi pego pelos zumbis. Sobreviveu {formatTime(hud.gameTime)}.</p>
            <div className="demo-app-buttons">
              <button className="bs-btn bs-btn-primary" onClick={handleRestart}>🔄 Reiniciar</button>
              <button className="bs-btn bs-btn-secondary" onClick={handleClose}>✕ Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
