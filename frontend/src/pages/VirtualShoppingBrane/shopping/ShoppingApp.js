import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ShoppingEngine, { SCENES } from "./ShoppingEngine";
import "./Shopping.css";

/* ── Ambient sound engine ── */
function useAmbient(engineRef) {
  const ctxRef = useRef(null);
  const gainRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const start = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(ctx.destination);

        const noise = ctx.createOscillator();
        noise.type = "sawtooth";
        noise.frequency.value = 120;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.008;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
        noise.connect(noiseGain);
        noiseGain.connect(filter);
        filter.connect(gain);
        noise.start();

        const hum = ctx.createOscillator();
        hum.type = "sine";
        hum.frequency.value = 55;
        const humGain = ctx.createGain();
        humGain.gain.value = 0.01;
        hum.connect(humGain);
        humGain.connect(gain);
        hum.start();

        ctxRef.current = ctx;
        gainRef.current = gain;

        const fadeIn = () => {
          if (!mounted) return;
          gain.gain.value = Math.min(0.15, gain.gain.value + 0.005);
          if (gain.gain.value < 0.15) requestAnimationFrame(fadeIn);
        };
        fadeIn();
      } catch {}
    };

    const onFirstTouch = () => { if (!ctxRef.current) start(); document.removeEventListener("click", onFirstTouch); document.removeEventListener("touchstart", onFirstTouch); };
    document.addEventListener("click", onFirstTouch);
    document.addEventListener("touchstart", onFirstTouch);

    return () => {
      mounted = false;
      if (gainRef.current) {
        try { gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.5); } catch {}
      }
      setTimeout(() => {
        try { ctxRef.current?.close(); } catch {}
      }, 600);
      document.removeEventListener("click", onFirstTouch);
      document.removeEventListener("touchstart", onFirstTouch);
    };
  }, []);
}

/* ── NPC Sprite ── */
function NpcSprite({ type, index }) {
  const style = useMemo(() => {
    const baseDelay = index * 2.5;
    if (type === "walk") {
      return {
        animation: `sv-npc-walk ${8 + Math.random() * 4}s ${baseDelay}s infinite linear`,
      };
    }
    if (type === "stand") {
      return {
        animation: `sv-npc-stand ${3 + Math.random() * 2}s ${baseDelay}s infinite ease-in-out`,
      };
    }
    if (type === "sit") {
      return { animation: `sv-npc-sit ${4 + Math.random() * 2}s ${baseDelay}s infinite ease-in-out` };
    }
    if (type === "browse") {
      return { animation: `sv-npc-browse ${5 + Math.random() * 2}s ${baseDelay}s infinite ease-in-out` };
    }
    return {};
  }, [type, index]);

  return <div className={`sv-npc sv-npc-${type}`} style={style} />;
}

/* ── Product on shelf ── */
function ProductShelf({ product, onAdd }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div
      className="sv-product"
      style={{ left: `${product.x}%`, top: `${product.y}%` }}
      onClick={() => onAdd(product)}
      title={product.name}
    >
      <div className="sv-product-shelf">
        {imgOk ? (
          <img
            src={product.image}
            alt={product.name}
            className="sv-product-img"
            onError={() => setImgOk(false)}
          />
        ) : (
          <span className="sv-product-emoji">{product.emoji}</span>
        )}
        <div className="sv-product-tag">
          <span className="sv-product-name">{product.name}</span>
          <span className="sv-product-price">R$ {product.price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main App ── */
export default function ShoppingApp({ onClose }) {
  const engineRef = useRef(null);
  const containerRef = useRef(null);
  const [engine] = useState(() => {
    const e = new ShoppingEngine({});
    engineRef.current = e;
    return e;
  });

  const [scene, setScene] = useState(engine.scene);
  const [sceneId, setSceneId] = useState(engine.sceneId);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgFail, setBgFail] = useState(false);
  const [transition, setTransition] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState(null);

  useAmbient(engineRef);

  /* ── Engine callbacks ── */
  useEffect(() => {
    engine.callbacks.onChange = ({ sceneId: id, scene: sc }) => {
      setTransition(true);
      setBgLoaded(false);
      setBgFail(false);
      setTimeout(() => {
        setSceneId(id);
        setScene(sc);
        setTimeout(() => setTransition(false), 50);
      }, 250);
    };
    engine.callbacks.onCart = ({ items, total, count }) => {
      setCartItems(items);
      setCartTotal(total);
      setCartCount(count);
    };
    engine._emitCart();
  }, [engine]);

  /* ── Navigation ── */
  const go = useCallback((target) => engine.navigate(target), [engine]);

  /* ── Add to cart ── */
  const add = useCallback((product) => {
    engine.addToCart(product);
    setToast({ name: product.name, emoji: product.emoji });
    setTimeout(() => setToast(null), 2200);
  }, [engine]);

  /* ── Remove from cart ── */
  const remove = useCallback((id) => engine.removeFromCart(id), [engine]);

  /* ── Finalizar ── */
  const finalizar = useCallback(() => {
    alert("Compra finalizada com sucesso!");
    engine.clearCart();
    setCartOpen(false);
  }, [engine]);

  /* ── Parallax mouse move ── */
  const onMouseMove = useCallback((e) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    setParallax({ x: x * 4, y: y * 2 });
  }, []);

  /* ── Touch drag look ── */
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, []);
  const onTouchMove = useCallback((e) => {
    if (!touchStart || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStart.x;
    const dy = e.touches[0].clientY - touchStart.y;
    setParallax({ x: Math.max(-15, Math.min(15, dx * 0.15)), y: Math.max(-8, Math.min(8, dy * 0.1)) });
  }, [touchStart]);
  const onTouchEnd = useCallback(() => setTouchStart(null), []);

  /* ── Keyboard ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (cartOpen) setCartOpen(false);
        else if (sceneId !== "entrance") go("back");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, sceneId, go]);

  /* ── Preload adjacent ── */
  useEffect(() => {
    if (!scene) return;
    const urls = scene.connections.map((c) => SCENES[c.target]?.image).filter(Boolean);
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [scene]);

  /* ── Floor click check ── */
  const onBgClick = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    for (const c of scene.connections) {
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
        go(c.target);
        return;
      }
    }
  }, [scene, go]);

  const isStore = sceneId !== "entrance" && sceneId !== "hall-entrance" && sceneId !== "hall-center" && sceneId !== "hall-west" && sceneId !== "hall-east" && sceneId !== "food-court";

  return (
    <div
      ref={containerRef}
      className="sv-root"
      onMouseMove={onMouseMove}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Scene image ── */}
      <div className={`sv-stage ${transition ? "sv-fade" : ""}`}>
        {!bgFail ? (
          <img
            key={sceneId}
            src={scene.image}
            alt={scene.name}
            className={`sv-bg ${bgLoaded ? "loaded" : ""}`}
            style={{
              transform: `translate(${parallax.x}px, ${parallax.y}px) scale(${1 + Math.abs(parallax.x) * 0.003})`,
            }}
            onLoad={() => setBgLoaded(true)}
            onError={() => setBgFail(true)}
            draggable={false}
          />
        ) : (
          <div className="sv-fallback">
            <div className="sv-fallback-inner">
              <span className="sv-fallback-icon">🛍️</span>
              <h2>{scene.name}</h2>
              <div className="sv-fallback-nav">
                {scene.connections.map((c, i) => (
                  <button key={i} className="sv-fallback-btn" onClick={() => go(c.target)}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {!bgLoaded && !bgFail && <div className="sv-loader"><div className="sv-loader-spinner" /></div>}

        {/* ── NPCs ── */}
        {bgLoaded && scene.npcs?.map((n, i) => <NpcSprite key={i} type={n.type} index={i} />)}

        {/* ── Products on shelves ── */}
        {bgLoaded && scene.products?.map((p, i) => <ProductShelf key={i} product={p} onAdd={add} />)}

        {/* ── Navigation click area ── */}
        {bgLoaded && (
          <div className="sv-click-area" onClick={onBgClick}>
            {scene.connections.map((c, i) => (
              <div
                key={i}
                className="sv-hotspot"
                style={{ left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, height: `${c.h}%` }}
              >
                <span className="sv-hotspot-label">{c.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Floor move indicator ── */}
        {bgLoaded && scene.connections.some((c) => c.y > 60) && (
          <div className="sv-floor-arrow">
            <span>👣 Clique no chão para andar</span>
          </div>
        )}
      </div>

      {/* ── Top bar ── */}
      <div className="sv-topbar">
        {sceneId !== "entrance" && (
          <button className="sv-back-btn" onClick={() => go("back")}>← Voltar</button>
        )}
        <div className="sv-location">{scene.name}</div>
        <div className="sv-top-right">
          <button className="sv-cart-icon" onClick={() => setCartOpen(true)}>
            🛒{cartCount > 0 && <span className="sv-cart-badge">{cartCount}</span>}
          </button>
          <button className="sv-close-top" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* ── Floor tap hint (mobile) ── */}
      {bgLoaded && !transition && (
        <div className="sv-tap-hint">
          <span>Toque na tela para navegar</span>
        </div>
      )}

      {/* ── Cart bar ── */}
      <div className="sv-cart-bar">
        <div className="sv-cart-bar-inner">
          <span className="sv-cart-bar-icon">🛒</span>
          <div className="sv-cart-bar-info">
            <span className="sv-cart-bar-label">Meu Carrinho</span>
            {cartCount > 0 && <span className="sv-cart-bar-detail">{cartCount} item(ns)</span>}
          </div>
          <div className="sv-cart-bar-right">
            {cartCount > 0 ? (
              <>
                <span className="sv-cart-bar-total">R$ {cartTotal.toFixed(2)}</span>
                <button className="sv-cart-bar-btn" onClick={() => setCartOpen(true)}>Abrir</button>
              </>
            ) : (
              <span className="sv-cart-bar-empty">Vazio</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Cart panel ── */}
      {cartOpen && (
        <div className="sv-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="sv-cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sv-cart-head">
              <h3>🛒 Carrinho</h3>
              <button className="sv-cart-head-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <div className="sv-cart-body">
              {cartItems.length === 0 ? (
                <p className="sv-cart-empty">Seu carrinho está vazio</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item._id} className="sv-cart-row">
                    <div className="sv-cart-row-img">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="sv-cart-thumb" />
                      ) : (
                        <span className="sv-cart-emoji">{item.emoji}</span>
                      )}
                    </div>
                    <div className="sv-cart-row-info">
                      <span className="sv-cart-row-name">{item.name}</span>
                      <div className="sv-cart-row-meta">
                        <span className="sv-cart-row-qty">Qtd: {item.qty}</span>
                        <span className="sv-cart-row-price">R$ {(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    </div>
                    <button className="sv-cart-row-rm" onClick={() => remove(item._id)}>−</button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="sv-cart-foot">
                <div className="sv-cart-total">
                  <span>Total</span>
                  <strong>R$ {cartTotal.toFixed(2)}</strong>
                </div>
                <button className="sv-cart-finish" onClick={finalizar}>Finalizar Compra</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="sv-toast" key={toast.name}>
          <span className="sv-toast-emoji">{toast.emoji}</span>
          <span>{toast.name} adicionado!</span>
        </div>
      )}
    </div>
  );
}
