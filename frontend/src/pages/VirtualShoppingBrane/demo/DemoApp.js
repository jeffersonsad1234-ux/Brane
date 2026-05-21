import React, { useRef, useEffect, useState } from "react";
import GameManager from "./GameManager.js";

export default function DemoApp({ onClose }) {
  const mountRef = useRef(null);
  const gmRef = useRef(null);
  const [status, setStatus] = useState("starting");

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let gm = null;

    try {
      gm = new GameManager(container);
      gmRef.current = gm;
      const ok = gm.init();
      setStatus(ok ? "playing" : "error");
      if (!ok) {
        console.error("[DemoApp] GameManager init failed");
      }
    } catch (e) {
      console.error("[DemoApp] Fatal:", e);
      setStatus("error");
    }

    return () => {
      if (gm) {
        try { gm.dispose(); } catch {}
      }
      gmRef.current = null;
    };
  }, []);

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="demo-app-root">
      <div ref={mountRef} className="demo-app-canvas" />

      {/* Always visible close button */}
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
    </div>
  );
}
