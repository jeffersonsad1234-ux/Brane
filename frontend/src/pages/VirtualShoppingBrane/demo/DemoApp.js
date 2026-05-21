import React, { useRef, useEffect, useState, useCallback } from "react";
import GameManager from "./GameManager.js";

export default function DemoApp({ onClose }) {
  const mountRef = useRef(null);
  const gmRef = useRef(null);
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
    if (s.phase === "playing") setStatus("playing");
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let gm = null;

    try {
      gm = new GameManager(container, { onStateChange });
      gmRef.current = gm;
      const ok = gm.init();
      if (!ok) setStatus("error");
    } catch (e) {
      console.error("[DemoApp] Fatal:", e);
      setStatus("error");
    }

    return () => {
      if (gm) { try { gm.dispose(); } catch {} }
      gmRef.current = null;
    };
  }, [onStateChange]);

  const handleRestart = () => window.location.reload();

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="demo-app-root">
      <div ref={mountRef} className="demo-app-canvas" />

      {/* Close button */}
      <button className="demo-app-close" onClick={onClose}>✕ Fechar Demo</button>

      {/* Loading */}
      {status === "starting" && (
        <div className="demo-app-loading">
          <div className="demo-app-spinner" />
          <p>Inicializando engine...</p>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="demo-app-overlay">
          <div className="demo-app-modal">
            <div className="demo-app-modal-icon">⚠️</div>
            <h2>Erro na Engine</h2>
            <p>Não foi possível iniciar a demonstração. WebGL pode não estar disponível.</p>
            <div className="demo-app-buttons">
              <button className="bs-btn bs-btn-primary" onClick={handleRestart}>🔄 Tentar novamente</button>
              <button className="bs-btn bs-btn-secondary" onClick={onClose}>✕ Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* HUD */}
      {status === "playing" && !hud.gameOver && (
        <div className="dh-hud">
          {/* Top-left: health + stamina */}
          <div className="dh-stats">
            <div className="dh-stat">
              <div className="dh-stat-label">❤️ VIDA</div>
              <div className="dh-stat-bar">
                <div className="dh-stat-fill health" style={{ width: `${hud.health}%` }} />
              </div>
              <div className="dh-stat-value">{hud.health}</div>
            </div>
            <div className="dh-stat">
              <div className="dh-stat-label">⚡ STAMINA</div>
              <div className="dh-stat-bar">
                <div className="dh-stat-fill stamina" style={{ width: `${hud.stamina}%` }} />
              </div>
              <div className="dh-stat-value">{hud.stamina}</div>
            </div>
          </div>

          {/* Crosshair */}
          <div className="dh-crosshair">+</div>

          {/* Bottom center: objective */}
          <div className="dh-objective">
            <span>🧟 {hud.zombiesAlive} zumbis</span>
            <span className="dh-sep">|</span>
            <span>Sobreviva</span>
          </div>

          {/* Bottom right: controls */}
          <div className="dh-controls">
            <div>WASD — Andar</div>
            <div>Shift — Correr</div>
            <div>Espaço — Pular</div>
          </div>
        </div>
      )}

      {/* Game Over */}
      {hud.gameOver && (
        <div className="demo-app-overlay">
          <div className="demo-app-modal">
            <div className="demo-app-modal-icon">💀</div>
            <h2 style={{ color: "#ee3344" }}>GAME OVER</h2>
            <p>Os zumbis te pegaram. Você sobreviveu {formatTime(hud.gameTime)}.</p>
            <div className="demo-app-buttons">
              <button className="bs-btn bs-btn-primary" onClick={handleRestart}>🔄 Reiniciar</button>
              <button className="bs-btn bs-btn-secondary" onClick={onClose}>✕ Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
