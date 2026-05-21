import React, { useState, useEffect, useRef, useCallback } from "react";
import ShoppingEngine, { SCENES } from "./ShoppingEngine";
import "./Shopping.css";

/* ── Ambient sound ── */
function useAmbient(started) {
  useEffect(() => {
    if (!started) return;
    let ctx, gain, noise, hum, mounted = true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      gain = ctx.createGain();
      gain.gain.value = 0.06;
      gain.connect(ctx.destination);

      noise = ctx.createOscillator();
      noise.type = "sawtooth";
      noise.frequency.value = 95;
      const ng = ctx.createGain();
      ng.gain.value = 0.006;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.value = 700; filt.Q.value = 0.3;
      noise.connect(ng); ng.connect(filt); filt.connect(gain);
      noise.start();

      hum = ctx.createOscillator();
      hum.type = "sine";
      hum.frequency.value = 50;
      const hg = ctx.createGain();
      hg.gain.value = 0.008;
      hum.connect(hg); hg.connect(gain);
      hum.start();
    } catch {}
    return () => {
      mounted = false;
      setTimeout(() => { try { noise?.stop(); hum?.stop(); ctx?.close(); } catch {} }, 300);
    };
  }, [started]);
}

export default function ShoppingApp({ onClose }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const engineRef = useRef(null);
  const animRef = useRef(null);

  const [engine] = useState(() => { const e = new ShoppingEngine({}); engineRef.current = e; return e; });

  const [scene, setScene] = useState(engine.scene);
  const [sceneId, setSceneId] = useState(engine.sceneId);
  const [ready, setReady] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [transition, setTransition] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [started, setStarted] = useState(false);
  const [hint, setHint] = useState(true);

  useAmbient(started);

  /* ── Panorama state ── */
  const stateRef = useRef({ yaw: 0, pitch: 0, vy: 0, vp: 0, dragging: false, lx: 0, ly: 0, fov: 85 });
  const imgLoadRef = useRef(null);

  /* ── Load image helper ── */
  const loadImage = useCallback((url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject();
      img.src = url;
    });
  }, []);

  /* ── Render panorama frame ── */
  const renderFrame = useCallback((img, yaw, pitch, fov) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    const iw = img.width;
    const ih = img.height;
    const viewFrac = fov / 360;
    const vw = iw * viewFrac;
    const vh = vw * (ch / cw);

    const cx = ((yaw / 360) * iw + iw) % iw;
    const cy = Math.max(0, Math.min(ih - vh, ((pitch + 90) / 180) * ih - vh / 2));

    // Draw with horizontal wrapping
    if (cx + vw <= iw) {
      ctx.drawImage(img, cx, cy, vw, vh, 0, 0, cw, ch);
    } else {
      const rw = iw - cx;
      const lw = vw - rw;
      const rcw = cw * (rw / vw);
      ctx.drawImage(img, cx, cy, rw, vh, 0, 0, rcw, ch);
      ctx.drawImage(img, 0, cy, lw, vh, rcw, 0, cw - rcw, ch);
    }

    // Vignette overlay
    const grad = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.25, cw / 2, ch / 2, cw * 0.7);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // Subtle edge gradient for wrap seam
    if (cx + vw > iw) {
      const seamX = rcw;
      const sg = ctx.createLinearGradient(seamX - 4, 0, seamX + 4, 0);
      sg.addColorStop(0, "rgba(0,0,0,0)");
      sg.addColorStop(0.5, "rgba(0,0,0,0.08)");
      sg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(seamX - 4, 0, 8, ch);
    }
  }, []);

  /* ── Animation loop ── */
  const loopRef = useRef(null);
  useEffect(() => {
    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      const s = stateRef.current;
      const img = imgRef.current;
      if (!img) return;

      // Apply inertia
      if (!s.dragging) {
        s.yaw += s.vy;
        s.pitch += s.vp;
        s.vy *= 0.92;
        s.vp *= 0.92;
        if (Math.abs(s.vy) < 0.01) s.vy = 0;
        if (Math.abs(s.vp) < 0.01) s.vp = 0;
      }

      // Wrap yaw 0-360, clamp pitch
      s.yaw = ((s.yaw % 360) + 360) % 360;
      s.pitch = Math.max(-60, Math.min(60, s.pitch));

      renderFrame(img, s.yaw, s.pitch, s.fov);
    };
    loop();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [renderFrame]);

  /* ── Set up canvas + image ── */
  const setupScene = useCallback(async (sc, scId) => {
    setImgLoaded(false);
    setImgError(false);
    const s = stateRef.current;
    s.yaw = 0;
    s.pitch = 0;
    s.vy = 0;
    s.vp = 0;

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.clientWidth * 1.5;
      canvas.height = canvas.clientHeight * 1.5;
    }

    try {
      const img = await loadImage(sc.image);
      imgRef.current = img;
      imgLoadRef.current = img;
      setImgLoaded(true);
      setImgError(false);
      setReady(true);
      renderFrame(img, 0, 0, 85);
    } catch {
      setImgError(true);
      setReady(true);
    }
  }, [loadImage, renderFrame]);

  /* ── Scene change ── */
  useEffect(() => {
    engine.callbacks.onChange = ({ sceneId: id, scene: sc }) => {
      setTransition(true);
      setTimeout(() => {
        setSceneId(id);
        setScene(sc);
        setupScene(sc, id);
        setTimeout(() => setTransition(false), 100);
      }, 300);
    };
    engine.callbacks.onCart = ({ items, total, count }) => {
      setCartItems(items);
      setCartTotal(total);
      setCartCount(count);
    };
    engine._emitCart();
    setupScene(engine.scene, engine.sceneId);
  }, [engine, setupScene]);

  /* ── Resize ── */
  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.clientWidth * 1.5;
      canvas.height = canvas.clientHeight * 1.5;
      const img = imgRef.current;
      if (img) renderFrame(img, stateRef.current.yaw, stateRef.current.pitch, stateRef.current.fov);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [renderFrame]);

  /* ── Mouse drag ── */
  const onPointerDown = useCallback((e) => {
    if (!started) setStarted(true);
    const s = stateRef.current;
    s.dragging = true;
    s.lx = e.clientX || e.touches?.[0]?.clientX || 0;
    s.ly = e.clientY || e.touches?.[0]?.clientY || 0;
    s.vy = 0;
    s.vp = 0;
  }, [started]);

  const onPointerMove = useCallback((e) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const cx = e.clientX || e.touches?.[0]?.clientX || 0;
    const cy = e.clientY || e.touches?.[0]?.clientY || 0;
    const dx = cx - s.lx;
    const dy = cy - s.ly;
    s.yaw -= dx * 0.25;
    s.pitch += dy * 0.2;
    s.vy = -dx * 0.25 * 0.08;
    s.vp = dy * 0.2 * 0.08;
    s.lx = cx;
    s.ly = cy;
  }, []);

  const onPointerUp = useCallback(() => {
    stateRef.current.dragging = false;
  }, []);

  /* ── Click on hotspot ── */
  const onClickCanvas = useCallback((e) => {
    if (!imgRef.current) return;
    const s = stateRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Convert screen position to yaw/pitch
    const clickYaw = s.yaw + (x - 0.5) * s.fov;
    const clickPitch = s.pitch + (0.5 - y) * (s.fov * rect.height / rect.width);

    for (const conn of scene.connections) {
      const dyaw = ((conn.yaw - clickYaw + 180) % 360 + 360) % 360 - 180;
      const dpitch = conn.pitch - clickPitch;
      if (Math.abs(dyaw) < conn.range && Math.abs(dpitch) < conn.range) {
        engine.navigate(conn.target);
        return;
      }
    }

    // Check products
    for (const prod of scene.products) {
      const dyaw = ((prod.yaw - clickYaw + 180) % 360 + 360) % 360 - 180;
      const dpitch = prod.pitch - clickPitch;
      if (Math.abs(dyaw) < 6 && Math.abs(dpitch) < 6) {
        addToCart(prod);
        return;
      }
    }
  }, [scene, engine]);

  /* ── Hotspot-to-screen positions ── */
  const getScreenPos = useCallback((yaw, pitch) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const dyaw = ((yaw - s.yaw + 180) % 360 + 360) % 360 - 180;
    const dpitch = pitch - s.pitch;
    const x = (dyaw / s.fov + 0.5) * canvas.clientWidth;
    const y = (0.5 - dpitch / (s.fov * canvas.clientHeight / canvas.clientWidth)) * canvas.clientHeight;
    // Check if in front (not behind)
    if (Math.abs(dyaw) > s.fov * 0.55 || Math.abs(dpitch) > s.fov * 0.55 * canvas.clientWidth / canvas.clientHeight) return null;
    return { x, y };
  }, []);

  const addToCart = useCallback((product) => {
    engine.addToCart(product);
    setToast({ name: product.name, emoji: product.emoji });
    setTimeout(() => setToast(null), 2200);
  }, [engine]);

  const removeFromCart = useCallback((id) => engine.removeFromCart(id), [engine]);
  const finalizar = useCallback(() => {
    alert("Compra finalizada com sucesso!");
    engine.clearCart();
    setCartOpen(false);
  }, [engine]);
  const go = useCallback((target) => engine.navigate(target), [engine]);

  const nav = useCallback((target) => go(target), [go]);

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

  /* ── Hint fade ── */
  useEffect(() => {
    if (ready) { const t = setTimeout(() => setHint(false), 5000); return () => clearTimeout(t); }
  }, [ready, sceneId]);

  /* ── Preload adjacent ── */
  useEffect(() => {
    if (!scene) return;
    scene.connections.forEach((c) => {
      const s = SCENES[c.target];
      if (s) { const img = new Image(); img.src = s.image; }
    });
  }, [scene]);

  const isStore = scene.products?.length > 0;

  return (
    <div className="pv-root" onPointerDown={started ? undefined : () => setStarted(true)}>
      {/* ── Canvas ── */}
      <div className={`pv-stage ${transition ? "pv-fade" : ""}`}>
        <canvas
          ref={canvasRef}
          className={`pv-canvas ${imgLoaded ? "active" : ""}`}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
          onClick={onClickCanvas}
        />

        {!imgLoaded && !imgError && (
          <div className="pv-loader"><div className="pv-spinner" /></div>
        )}

        {imgError && (
          <div className="pv-fallback">
            <div className="pv-fallback-inner">
              <span className="pv-fallback-icon">🛍️</span>
              <h2>{scene.name}</h2>
              <div className="pv-fallback-nav">
                {scene.connections.map((c, i) => (
                  <button key={i} className="pv-fallback-btn" onClick={() => nav(c.target)}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Hotspot labels ── */}
      {imgLoaded && scene.connections.map((c, i) => {
        const pos = getScreenPos(c.yaw, c.pitch);
        if (!pos) return null;
        return (
          <button
            key={i}
            className="pv-hotspot"
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
            onClick={() => nav(c.target)}
          >
            <span className="pv-hotspot-arrow">⊙</span>
            <span className="pv-hotspot-label">{c.label}</span>
          </button>
        );
      })}

      {/* ── Product labels ── */}
      {imgLoaded && isStore && scene.products.map((p, i) => {
        const pos = getScreenPos(p.yaw, p.pitch);
        if (!pos) return null;
        return (
          <div
            key={i}
            className="pv-product-label"
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -100%)" }}
            onClick={() => addToCart(p)}
          >
            <img src={p.image} alt={p.name} className="pv-product-thumb" />
            <div className="pv-product-info">
              <span className="pv-product-name">{p.name}</span>
              <span className="pv-product-price">R$ {p.price.toFixed(2)}</span>
            </div>
          </div>
        );
      })}

      {/* ── Drag hint ── */}
      {hint && imgLoaded && (
        <div className="pv-hint">
          <span>Arraste para olhar ao redor • Clique nos pontos para navegar</span>
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="pv-topbar">
        {sceneId !== "entrance" && (
          <button className="pv-btn pv-btn-back" onClick={() => go("back")}>← Voltar</button>
        )}
        <div className="pv-location">{scene.name}</div>
        <div className="pv-top-right">
          <button className="pv-btn pv-cart-icon" onClick={() => setCartOpen(true)}>
            🛒{cartCount > 0 && <span className="pv-cart-badge">{cartCount}</span>}
          </button>
          <button className="pv-btn pv-close-top" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* ── Cart bar ── */}
      <div className="pv-cart-bar">
        <div className="pv-cart-bar-inner">
          <span className="pv-cart-bar-icon">🛒</span>
          <div className="pv-cart-bar-info">
            <span className="pv-cart-bar-label">Meu Carrinho</span>
            {cartCount > 0 && <span className="pv-cart-bar-detail">{cartCount} item(ns)</span>}
          </div>
          <div className="pv-cart-bar-right">
            {cartCount > 0 ? (
              <>
                <span className="pv-cart-bar-total">R$ {cartTotal.toFixed(2)}</span>
                <button className="pv-cart-bar-btn" onClick={() => setCartOpen(true)}>Abrir</button>
              </>
            ) : (
              <span className="pv-cart-bar-empty">Vazio</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Cart panel ── */}
      {cartOpen && (
        <div className="pv-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="pv-cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="pv-cart-head">
              <h3>🛒 Carrinho</h3>
              <button className="pv-cart-head-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <div className="pv-cart-body">
              {cartItems.length === 0 ? (
                <p className="pv-cart-empty">Seu carrinho está vazio</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item._id} className="pv-cart-row">
                    <div className="pv-cart-row-img">
                      <img src={item.image} alt={item.name} className="pv-cart-thumb" />
                    </div>
                    <div className="pv-cart-row-info">
                      <span className="pv-cart-row-name">{item.name}</span>
                      <div className="pv-cart-row-meta">
                        <span>Qtd: {item.qty}</span>
                        <span className="pv-cart-row-price">R$ {(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    </div>
                    <button className="pv-cart-row-rm" onClick={() => removeFromCart(item._id)}>−</button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="pv-cart-foot">
                <div className="pv-cart-total">
                  <span>Total</span>
                  <strong>R$ {cartTotal.toFixed(2)}</strong>
                </div>
                <button className="pv-cart-finish" onClick={finalizar}>Finalizar Compra</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="pv-toast" key={toast.name}>
          <span>{toast.emoji} {toast.name} adicionado!</span>
        </div>
      )}
    </div>
  );
}
