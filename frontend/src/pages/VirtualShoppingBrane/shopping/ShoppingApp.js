import React, { useState, useEffect, useRef, useCallback } from "react";
import ShoppingEngine, { SCENE_DEFS, getSceneCanvas, preloadScene } from "./ShoppingEngine";
import "./Shopping.css";

function useAmbient(started) {
  useEffect(() => {
    if (!started) return;
    let ctx, gain, noise, hum, mounted = true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      gain = ctx.createGain();
      gain.gain.value = 0.05;
      gain.connect(ctx.destination);
      noise = ctx.createOscillator();
      noise.type = "sawtooth";
      noise.frequency.value = 95;
      const ng = ctx.createGain(); ng.gain.value = 0.005;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass"; filt.frequency.value = 700; filt.Q.value = 0.3;
      noise.connect(ng); ng.connect(filt); filt.connect(gain);
      noise.start();
      hum = ctx.createOscillator();
      hum.type = "sine"; hum.frequency.value = 50;
      const hg = ctx.createGain(); hg.gain.value = 0.007;
      hum.connect(hg); hg.connect(gain);
      hum.start();
    } catch {}
    return () => {
      mounted = false;
      setTimeout(() => { try { noise?.stop(); hum?.stop(); ctx?.close(); } catch {} }, 300);
    };
  }, [started]);
}

function createFallbackScene(sceneId) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1024;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0, '#1a1a2e');
    g.addColorStop(0.3, '#16213e');
    g.addColorStop(0.7, '#0f3460');
    g.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2048, 1024);
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((sceneId || 'brane').replace(/-/g, ' ').toUpperCase(), 1024, 500);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '16px sans-serif';
    ctx.fillText('Clique nos pontos ⊙ para navegar', 1024, 540);
  }
  return c;
}

function resizeCanvas(canvas) {
  if (!canvas) return false;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 1 || h < 1) {
    canvas.width = 300;
    canvas.height = 150;
    return false;
  }
  canvas.width = Math.round(w * 1.5);
  canvas.height = Math.round(h * 1.5);
  return true;
}

export default function ShoppingApp({ onClose }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const engineRef = useRef(null);
  const animRef = useRef(null);
  const resizeRef = useRef(null);
  const readyRef = useRef(false);

  const [engine] = useState(() => { const e = new ShoppingEngine({}); engineRef.current = e; return e; });

  const [scene, setScene] = useState(engine.scene);
  const [sceneId, setSceneId] = useState(engine.sceneId);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [transition, setTransition] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [started, setStarted] = useState(false);
  const [hint, setHint] = useState(true);

  useAmbient(started);

  const stateRef = useRef({ yaw: 0, pitch: 0, vy: 0, vp: 0, dragging: false, lx: 0, ly: 0, fov: 85 });

  const renderFrame = useCallback((source, yaw, pitch, fov) => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const cw = canvas.width;
    const ch = canvas.height;
    if (cw < 2 || ch < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, cw, ch);

    let img = (source instanceof HTMLCanvasElement || source instanceof HTMLImageElement) ? source : null;
    if (!img) return;

    const iw = img.width;
    const ih = img.height;
    if (iw < 2 || ih < 2) return;

    const viewFrac = fov / 360;
    const vw = Math.min(iw, iw * viewFrac);
    const vh = Math.max(1, vw * (ch / cw));

    const cx = ((yaw / 360) * iw + iw) % iw;
    const cy = Math.max(0, Math.min(ih - vh, ((pitch + 90) / 180) * ih - vh / 2));

    if (cx + vw <= iw) {
      ctx.drawImage(img, cx, cy, vw, vh, 0, 0, cw, ch);
    } else {
      const rw = iw - cx;
      const lw = vw - rw;
      const rcw = cw * (rw / vw);
      ctx.drawImage(img, cx, cy, rw, vh, 0, 0, Math.round(rcw), ch);
      ctx.drawImage(img, 0, cy, lw, vh, Math.round(rcw), 0, cw - Math.round(rcw), ch);
    }

    const grad = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.25, cw / 2, ch / 2, cw * 0.7);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
  }, []);

  const loopRef = useRef(null);
  useEffect(() => {
    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      const s = stateRef.current;
      const source = imgRef.current;
      if (!source) return;

      if (!s.dragging) {
        s.yaw += s.vy;
        s.pitch += s.vp;
        s.vy *= 0.92;
        s.vp *= 0.92;
        if (Math.abs(s.vy) < 0.005) s.vy = 0;
        if (Math.abs(s.vp) < 0.005) s.vp = 0;
      }
      s.yaw = ((s.yaw % 360) + 360) % 360;
      s.pitch = Math.max(-60, Math.min(60, s.pitch));
      renderFrame(source, s.yaw, s.pitch, s.fov);
    };
    loop();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [renderFrame]);

  const setupScene = useCallback((sc, scId) => {
    try {
      const s = stateRef.current;
      s.yaw = 0;
      s.pitch = 0;
      s.vy = 0;
      s.vp = 0;

      resizeCanvas(canvasRef.current);

      const sceneCanvas = getSceneCanvas(scId);
      if (!sceneCanvas || sceneCanvas.width < 2) {
        throw new Error("Invalid scene canvas");
      }
      imgRef.current = sceneCanvas;
      readyRef.current = true;
      setReady(true);
      setLoadFailed(false);
      renderFrame(sceneCanvas, 0, 0, 85);
    } catch (e) {
      const fallback = createFallbackScene(scId);
      imgRef.current = fallback;
      readyRef.current = true;
      setReady(true);
      setLoadFailed(true);
      resizeCanvas(canvasRef.current);
      renderFrame(fallback, 0, 0, 85);
    }
  }, [renderFrame]);

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

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 300;
      canvas.height = 150;
    }

    setTimeout(() => {
      setupScene(engine.scene, engine.sceneId);
    }, 50);

    const safetyTimer = setTimeout(() => {
      if (!readyRef.current) {
        const fallback = createFallbackScene(engine.sceneId);
        imgRef.current = fallback;
        readyRef.current = true;
        setReady(true);
        setLoadFailed(true);
        resizeCanvas(canvasRef.current);
        renderFrame(fallback, 0, 0, 85);
      }
    }, 5000);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [engine, setupScene, renderFrame]);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (resizeCanvas(canvas)) {
        const source = imgRef.current;
        if (source) {
          renderFrame(source, stateRef.current.yaw, stateRef.current.pitch, stateRef.current.fov);
        }
      }
    });
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [renderFrame]);

  const onPointerDown = useCallback((e) => {
    if (!started) setStarted(true);
    const s = stateRef.current;
    s.dragging = true;
    s.lx = e.clientX || e.touches?.[0]?.clientX || 0;
    s.ly = e.clientY || e.touches?.[0]?.clientY || 0;
    s.vy = 0; s.vp = 0;
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
    s.lx = cx; s.ly = cy;
  }, []);

  const onPointerUp = useCallback(() => { stateRef.current.dragging = false; }, []);

  const onClickCanvas = useCallback((e) => {
    const source = imgRef.current;
    if (!source) return;
    const s = stateRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const clickYaw = s.yaw + (x - 0.5) * s.fov;
    const clickPitch = s.pitch + (0.5 - y) * (s.fov * rect.height / rect.width);

    for (const conn of scene.connections) {
      const dyaw = ((conn.yaw - clickYaw + 180) % 360 + 360) % 360 - 180;
      const dpitch = conn.pitch - clickPitch;
      if (Math.abs(dyaw) < conn.range && Math.abs(dpitch) < conn.range + 5) {
        engine.navigate(conn.target);
        return;
      }
    }
    for (const prod of scene.products) {
      const dyaw = ((prod.yaw - clickYaw + 180) % 360 + 360) % 360 - 180;
      const dpitch = prod.pitch - clickPitch;
      if (Math.abs(dyaw) < 8 && Math.abs(dpitch) < 8) {
        addToCart(prod);
        return;
      }
    }
  }, [scene, engine]);

  const getScreenPos = useCallback((yaw, pitch) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (cw < 1 || ch < 1) return null;
    const dyaw = ((yaw - s.yaw + 180) % 360 + 360) % 360 - 180;
    const dpitch = pitch - s.pitch;
    const aspect = ch / cw;
    const x = (dyaw / s.fov + 0.5) * cw;
    const y = (0.5 - dpitch / (s.fov * aspect)) * ch;
    if (Math.abs(dyaw) > s.fov * 0.55 || Math.abs(dpitch) > s.fov * 0.55 / aspect) return null;
    if (x < -50 || x > cw + 50 || y < -50 || y > ch + 50) return null;
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

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (cartOpen) setCartOpen(false);
        else if (sceneId !== "city-street-1") go("back");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, sceneId, go]);

  useEffect(() => {
    if (ready) { const t = setTimeout(() => setHint(false), 6000); return () => clearTimeout(t); }
  }, [ready, sceneId]);

  useEffect(() => {
    if (!scene) return;
    scene.connections.forEach((c) => {
      if (SCENE_DEFS[c.target]) preloadScene(c.target);
    });
  }, [scene]);

  const isStore = scene.products?.length > 0;

  return (
    <div className="pv-root" onPointerDown={started ? undefined : (e) => { e.stopPropagation(); setStarted(true); }}>
      <div className={`pv-stage ${transition ? "pv-fade" : ""}`}>
        <canvas
          ref={canvasRef}
          className={`pv-canvas ${ready ? "active" : ""}`}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
          onClick={onClickCanvas}
        />
        {!ready && (
          <div className="pv-loader">
            <div className="pv-spinner" />
          </div>
        )}
      </div>

      {ready && scene.connections.map((c, i) => {
        const pos = getScreenPos(c.yaw, c.pitch);
        if (!pos) return null;
        return (
          <button key={i} className="pv-hotspot" style={{ left: pos.x, top: pos.y, transform: "translate(-50%,-50%)" }} onClick={() => go(c.target)}>
            <span className="pv-hotspot-dot">⊙</span>
            <span className="pv-hotspot-label">{c.label}</span>
          </button>
        );
      })}

      {ready && isStore && scene.products.map((p, i) => {
        const pos = getScreenPos(p.yaw, p.pitch);
        if (!pos) return null;
        return (
          <div key={i} className="pv-prod" style={{ left: pos.x, top: pos.y, transform: "translate(-50%,-100%)" }} onClick={() => addToCart(p)}>
            <div className="pv-prod-icon">{p.emoji}</div>
            <div className="pv-prod-info">
              <span className="pv-prod-name">{p.name}</span>
              <span className="pv-prod-price">R$ {p.price.toFixed(2)}</span>
            </div>
          </div>
        );
      })}

      {hint && ready && !loadFailed && (
        <div className="pv-hint">
          <span>Arraste para olhar • Clique nos pontos ⊙ para navegar</span>
        </div>
      )}

      {loadFailed && ready && (
        <div className="pv-hint" style={{ bottom: '120px' }}>
          <span>Modo de segurança ativo • Cena padrão</span>
        </div>
      )}

      <div className="pv-topbar">
        {sceneId !== "city-street-1" && (
          <button className="pv-btn pv-btn-back" onClick={() => go("back")}>← Voltar</button>
        )}
        <div className="pv-location">{scene.name}</div>
        <div className="pv-top-right">
          <button className="pv-btn pv-cart-icon" onClick={() => setCartOpen(true)}>
            🛒{cartCount > 0 && <span className="pv-cart-badge">{cartCount}</span>}
          </button>
          <button className="pv-btn pv-close" onClick={onClose}>✕</button>
        </div>
      </div>

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
                    <div className="pv-cart-emoji-box">{item.emoji}</div>
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

      {toast && (
        <div className="pv-toast" key={toast.name}>
          <span>{toast.emoji} {toast.name} adicionado!</span>
        </div>
      )}
    </div>
  );
}
