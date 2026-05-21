import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ShoppingEngine, { SCENES } from "./ShoppingEngine";
import "./Shopping.css";

function ProductCard({ product, onAdd }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="sp-product-card">
      <div className="sp-product-image-wrap">
        {imgOk ? (
          <img
            src={product.image}
            alt={product.name}
            className="sp-product-image"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="sp-product-fallback">{product.emoji}</div>
        )}
      </div>
      <div className="sp-product-info">
        <span className="sp-product-name">{product.name}</span>
        <span className="sp-product-price">R$ {product.price.toFixed(2)}</span>
      </div>
      <button className="sp-product-add" onClick={() => onAdd(product)}>
        + Carrinho
      </button>
    </div>
  );
}

export default function ShoppingApp({ onClose }) {
  const engineRef = useRef(null);
  const [engine] = useState(() => new ShoppingEngine({}));
  const [scene, setScene] = useState(engine.scene);
  const [sceneId, setSceneId] = useState(engine.sceneId);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [productModal, setProductModal] = useState(null);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    engine.callbacks.onSceneChange = (id, sc) => {
      setTransitioning(true);
      setBgLoaded(false);
      setImgError(false);
      setTimeout(() => {
        setSceneId(id);
        setScene(sc);
        setTransitioning(false);
      }, 200);
    };
    engine.callbacks.onCartUpdate = ({ items, total, count }) => {
      setCartItems(items);
      setCartTotal(total);
      setCartCount(count);
    };
    engine._update();
  }, [engine]);

  const handleNavigate = useCallback((target) => {
    engine.navigateTo(target);
  }, [engine]);

  const handleAddToCart = useCallback((product) => {
    engine.addToCart(product);
    setProductModal(product);
    setTimeout(() => setProductModal(null), 2000);
  }, [engine]);

  const handleRemoveFromCart = useCallback((id) => {
    engine.removeFromCart(id);
  }, [engine]);

  const handleFinalizar = useCallback(() => {
    alert("Compra finalizada com sucesso!");
    engine.clearCart();
    setCartOpen(false);
  }, [engine]);

  const isStore = useMemo(() => {
    return ["shoes", "clothes", "electronics", "supermarket", "cosmetics", "foodcourt"].includes(sceneId);
  }, [sceneId]);

  const prevTargetRef = useRef(null);

  const handleImageClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    for (const h of scene.hotspots) {
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        handleNavigate(h.target);
        return;
      }
    }
  }, [scene, handleNavigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      if (cartOpen) setCartOpen(false);
      else if (sceneId !== "entrance") handleNavigate("back");
    }
  }, [cartOpen, sceneId, handleNavigate]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => setShowHint(false), 6000);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [handleKeyDown]);

  return (
    <div className="sp-root">
      {/* Background image */}
      <div className="sp-bg-container">
        {!imgError ? (
          <img
            key={sceneId}
            src={scene.image}
            alt={scene.name}
            className={`sp-bg-image ${bgLoaded ? "loaded" : ""} ${transitioning ? "exit" : ""}`}
            onLoad={() => setBgLoaded(true)}
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          <div className="sp-bg-fallback">
            <div className="sp-bg-fallback-inner">
              <span className="sp-bg-fallback-icon">🛍️</span>
              <h2>{scene.name}</h2>
              <p>Clique nos links para navegar</p>
              <div className="sp-fallback-nav">
                {scene.hotspots.map((h, i) => (
                  <button key={i} className="sp-fallback-btn" onClick={() => handleNavigate(h.target)}>
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!bgLoaded && !imgError && (
          <div className="sp-loading-overlay">
            <div className="sp-loading-spinner" />
          </div>
        )}

        {/* Hotspots overlay */}
        {bgLoaded && scene.hotspots.length > 0 && (
          <div className="sp-hotspots" onClick={handleImageClick}>
            {scene.hotspots.map((h, i) => (
              <div
                key={i}
                className="sp-hotspot"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
                title={h.label}
              >
                <span className="sp-hotspot-label">{h.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Scene name */}
        <div className="sp-scene-name">
          <span>{scene.name}</span>
        </div>

        {/* Back button */}
        {sceneId !== "entrance" && (
          <button className="sp-back-btn" onClick={() => handleNavigate("back")}>
            ← Voltar
          </button>
        )}

        {/* Products grid for store scenes */}
        {bgLoaded && isStore && scene.products.length > 0 && (
          <div className="sp-products-overlay">
            <div className="sp-products-row">
              {scene.products.map((p, i) => (
                <ProductCard key={i} product={p} onAdd={handleAddToCart} />
              ))}
            </div>
          </div>
        )}

        {/* Hint */}
        {showHint && (
          <div className="sp-hint">
            Clique nas áreas destacadas para navegar
          </div>
        )}
      </div>

      {/* Cart overlay (fixed at bottom) */}
      <div className="sp-cart-bar">
        <div className="sp-cart-bar-inner">
          <div className="sp-cart-bar-left">
            <span className="sp-cart-bar-emoji">🛒</span>
            <div className="sp-cart-bar-info">
              <span className="sp-cart-bar-label">Meu Carrinho</span>
              {cartCount > 0 && (
                <span className="sp-cart-bar-count">{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
              )}
            </div>
          </div>
          <div className="sp-cart-bar-right">
            {cartCount > 0 && (
              <>
                <span className="sp-cart-bar-total">R$ {cartTotal.toFixed(2)}</span>
                <button className="sp-cart-bar-btn" onClick={() => setCartOpen(true)}>
                  Ver Carrinho
                </button>
              </>
            )}
            {cartCount === 0 && (
              <span className="sp-cart-bar-empty">Carrinho vazio</span>
            )}
          </div>
        </div>
      </div>

      {/* Cart panel */}
      {cartOpen && (
        <div className="sp-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="sp-cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sp-cart-panel-header">
              <h3>🛒 Carrinho</h3>
              <button className="sp-cart-panel-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <div className="sp-cart-panel-items">
              {cartItems.length === 0 ? (
                <p className="sp-cart-empty-text">Seu carrinho está vazio</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="sp-cart-panel-item">
                    <div className="sp-cart-item-image-wrap">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="sp-cart-item-image" />
                      ) : (
                        <span className="sp-cart-item-emoji">{item.emoji}</span>
                      )}
                    </div>
                    <div className="sp-cart-item-info">
                      <span className="sp-cart-item-name">{item.name}</span>
                      <div className="sp-cart-item-meta">
                        <span className="sp-cart-item-qty">Qtd: {item.qty}</span>
                        <span className="sp-cart-item-price">R$ {(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    </div>
                    <button className="sp-cart-item-remove" onClick={() => handleRemoveFromCart(item.id)}>
                      −
                    </button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="sp-cart-panel-footer">
                <div className="sp-cart-panel-total">
                  <span>Total</span>
                  <strong>R$ {cartTotal.toFixed(2)}</strong>
                </div>
                <button className="sp-finalizar-btn" onClick={handleFinalizar}>
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product added toast */}
      {productModal && (
        <div className="sp-toast">
          <span className="sp-toast-emoji">{productModal.emoji}</span>
          <span className="sp-toast-text">{productModal.name} adicionado!</span>
        </div>
      )}

      {/* Close button */}
      <button className="sp-close-btn" onClick={onClose}>✕</button>
    </div>
  );
}
