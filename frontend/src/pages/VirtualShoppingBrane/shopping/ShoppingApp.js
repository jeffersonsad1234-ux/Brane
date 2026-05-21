import React, { useState, useEffect, useRef, useCallback } from "react";
import ShoppingEngine from "./ShoppingEngine";
import "./Shopping.css";

export default function ShoppingApp({ onClose }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const minimapRef = useRef(null);
  const [engineReady, setEngineReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [productModal, setProductModal] = useState(null);
  const [state, setState] = useState({ stamina: 100 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new ShoppingEngine(container, {
      onProductClick: (product) => {
        setProductModal(product);
        engine.addToCart(product.id.split("_")[0], parseInt(product.id.split("_")[1]));
      },
      onCartUpdate: ({ items, total, count }) => {
        setCartItems(items);
        setCartTotal(total);
        setCartCount(count);
      },
      onStateChange: (s) => setState(s),
    });

    const ok = engine.init();
    if (ok) {
      engineRef.current = engine;
      setEngineReady(true);
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Minimap render loop
  useEffect(() => {
    if (!engineReady || !engineRef.current) return;
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine || !minimapRef.current) return;
      const canvas = minimapRef.current;
      const ctx = canvas.getContext("2d");
      const w = canvas.width = 180;
      const h = canvas.height = 130;

      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, w, h);

      // Mall bounds
      const scale = 1.8;
      const ox = w / 2;
      const oy = h / 2;

      // Draw stores
      ctx.strokeStyle = "rgba(100, 200, 255, 0.3)";
      ctx.lineWidth = 1;
      for (const sm of engine.storeMeshes || []) {
        const [sx, sz] = sm.position;
        const px = ox + sx * scale;
        const py = oy + sz * scale;
        ctx.fillStyle = "#" + sm.store.color.toString(16).padStart(6, "0");
        ctx.globalAlpha = 0.5;
        ctx.fillRect(px - 6, py - 4, 12, 8);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#88ccff";
        ctx.font = "6px monospace";
        ctx.fillText(sm.store.name.slice(0, 0), px - 4, py + 2);
      }

      // Player dot
      const pos = engine.playerPos;
      const px = ox + pos.x * scale;
      const py = oy + pos.z * scale;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#00ff88";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Direction indicator
      const dx = Math.sin(engine.yaw) * 8;
      const dy = Math.cos(engine.yaw) * 8;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + dx, py + dy);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }, 200);
    return () => clearInterval(interval);
  }, [engineReady]);

  const handlePointerLock = useCallback(() => {
    engineRef.current?.enablePointerLock();
  }, []);

  const handleRemoveItem = useCallback((storeId, productIndex) => {
    engineRef.current?.removeFromCart(storeId, productIndex);
  }, []);

  const handleFinalizar = useCallback(() => {
    alert("Compra finalizada! (simulação)");
    engineRef.current.cartItems = [];
    engineRef.current._updateCartState();
    setCartOpen(false);
  }, []);

  return (
    <div className="shopping-wrapper">
      <div ref={containerRef} className="shopping-canvas" />

      {!engineReady && (
        <div className="shopping-loading">
          <div className="shopping-loading-spinner" />
          <p>Carregando shopping...</p>
        </div>
      )}

      {/* HUD */}
      <div className="shopping-hud">
        {/* Top bar */}
        <div className="shopping-top-bar">
          <button className="shopping-close-btn" onClick={onClose}>✕</button>
          <span className="shopping-title">🛍️ Shopping Brane</span>
          <div className="shopping-top-right">
            <div className="shopping-stamina">
              <div className="shopping-stamina-bar">
                <div className="shopping-stamina-fill" style={{ width: state.stamina + "%" }} />
              </div>
              <span className="shopping-stamina-label">⚡</span>
            </div>
            <button className="shopping-cart-btn" onClick={() => setCartOpen(!cartOpen)}>
              🛒 {cartCount > 0 && <span className="shopping-cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>

        {/* Controls hint */}
        <div className="shopping-controls-hint">
          <span>🖱️ Clique no chão para andar</span>
          <span>⌨️ WASD para se mover</span>
          <span>🎯 Clique nos produtos</span>
        </div>

        {/* Cart panel */}
        {cartOpen && (
          <div className="shopping-cart-panel">
            <div className="shopping-cart-header">
              <h3>🛒 Carrinho</h3>
              <button onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <div className="shopping-cart-items">
              {cartItems.length === 0 ? (
                <p className="shopping-cart-empty">Carrinho vazio</p>
              ) : (
                cartItems.map((item, i) => (
                  <div key={i} className="shopping-cart-item">
                    <span className="shopping-cart-emoji">{item.emoji}</span>
                    <div className="shopping-cart-info">
                      <span className="shopping-cart-name">{item.name}</span>
                      <span className="shopping-cart-store">{item.storeName}</span>
                      <span className="shopping-cart-price">
                        {item.qty} × R$ {item.price.toFixed(2)} = R$ {(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                    <button
                      className="shopping-cart-remove"
                      onClick={() => handleRemoveItem(item.storeId, item.productIndex)}
                    >
                      −
                    </button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="shopping-cart-footer">
                <div className="shopping-cart-total">
                  <span>Total:</span>
                  <strong>R$ {cartTotal.toFixed(2)}</strong>
                </div>
                <button className="shopping-finalizar-btn" onClick={handleFinalizar}>
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        )}

        {/* Minimap */}
        <div className="shopping-minimap-container">
          <canvas ref={minimapRef} className="shopping-minimap" width="180" height="130" />
        </div>

        {/* Pointer lock button */}
        <button className="shopping-pointer-btn" onClick={handlePointerLock}>
          🔒 Travar Mouse
        </button>
      </div>

      {/* Product modal */}
      {productModal && (
        <div className="shopping-modal-overlay" onClick={() => setProductModal(null)}>
          <div className="shopping-modal" onClick={(e) => e.stopPropagation()}>
            <button className="shopping-modal-close" onClick={() => setProductModal(null)}>✕</button>
            <div className="shopping-modal-emoji">{productModal.emoji}</div>
            <h2>{productModal.name}</h2>
            <p className="shopping-modal-store">{productModal.storeName}</p>
            <p className="shopping-modal-price">R$ {productModal.price.toFixed(2)}</p>
            <p className="shopping-modal-added">✓ Adicionado ao carrinho!</p>
          </div>
        </div>
      )}
    </div>
  );
}
