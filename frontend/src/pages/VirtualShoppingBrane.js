import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import "../styles/virtualShopping.css";

const STORE_DATA = [
  { id:"fashion", name:"Fashion District", icon:"👗", color:"#FF6B9D", desc:"Roupas e acessórios premium",
    products:[
      { name:"Vestido Premium", price:"R$ 189,90", color:"#FF6B9D", shape:"cylinder" },
      { name:"Jaqueta Leather", price:"R$ 349,90", color:"#8B4513", shape:"box" },
      { name:"Bolsa Elegance", price:"R$ 259,90", color:"#D4A24C", shape:"torus" },
    ]},
  { id:"gamer", name:"Gamer Zone", icon:"🎮", color:"#8A2CFF", desc:"Equipamentos gamers",
    products:[
      { name:"Headset RGB", price:"R$ 299,90", color:"#8A2CFF", shape:"torus" },
      { name:"Mouse Pro X", price:"R$ 199,90", color:"#00FF88", shape:"box" },
      { name:"Teclado Mecânico", price:"R$ 449,90", color:"#2C2C2C", shape:"box" },
    ]},
  { id:"sneakers", name:"Sneaker Arena", icon:"👟", color:"#00D4AA", desc:"Os melhores tênis",
    products:[
      { name:"Air Max 3000", price:"R$ 599,90", color:"#FF4500", shape:"sphere" },
      { name:"Runner Pro", price:"R$ 429,90", color:"#4A90D9", shape:"sphere" },
      { name:"Street Style", price:"R$ 349,90", color:"#1A1A1A", shape:"sphere" },
    ]},
  { id:"perfumes", name:"Parfum Luxe", icon:"🧴", color:"#FFD700", desc:"Perfumes importados",
    products:[
      { name:"Essence Gold", price:"R$ 429,90", color:"#FFD700", shape:"cylinder" },
      { name:"Oud Prestige", price:"R$ 599,90", color:"#800020", shape:"cylinder" },
      { name:"Floral Dream", price:"R$ 299,90", color:"#FFB6C1", shape:"cylinder" },
    ]},
  { id:"eletronics", name:"Tech Hub", icon:"📱", color:"#00BFFF", desc:"Tecnologia e inovação",
    products:[
      { name:"Phone X Ultra", price:"R$ 4.299,90", color:"#1A1A2E", shape:"box" },
      { name:"Tablet Pro 12", price:"R$ 2.899,90", color:"#C0C0C0", shape:"box" },
      { name:"SmartWatch 5", price:"R$ 1.299,90", color:"#FFD700", shape:"torus" },
    ]},
  { id:"accessories", name:"Access World", icon:"⌚", color:"#FF8C00", desc:"Acessórios e relógios",
    products:[
      { name:"Relógio Classic", price:"R$ 799,90", color:"#D4A24C", shape:"torus" },
      { name:"Óculos Premium", price:"R$ 349,90", color:"#1A1A1A", shape:"box" },
      { name:"Carteira Slim", price:"R$ 189,90", color:"#8B4513", shape:"box" },
    ]},
  { id:"sports", name:"Sports Club", icon:"⚽", color:"#32CD32", desc:"Artigos esportivos",
    products:[
      { name:"Bola Oficial", price:"R$ 129,90", color:"#FFFFFF", shape:"sphere" },
      { name:"Mochila Sport", price:"R$ 199,90", color:"#1A1A1A", shape:"box" },
      { name:"Garrafa Térmica", price:"R$ 89,90", color:"#32CD32", shape:"cylinder" },
    ]},
];

// ── ENTRANCE ──────────────────────────────────────────
function EntranceScreen({ onEnter }) {
  return (
    <div className="vsb-entrance">
      <div className="vsb-entrance-glow" />
      <div className="vsb-entrance-content">
        <div className="vsb-entrance-icon-wrap">
          <span className="vsb-entrance-icon">🛍️</span>
        </div>
        <h1 className="vsb-entrance-title">
          Virtual Shopping <span className="vsb-entrance-accent">Brane</span>
        </h1>
        <p className="vsb-entrance-sub">Um shopping virtual imersivo direto do seu navegador</p>
        <div className="vsb-entrance-features">
          <span>📍 Ande clicando na tela</span>
          <span>🏪 Entre nas lojas e veja produtos 3D</span>
          <span>🛒 Carrinho interativo</span>
        </div>
        <button className="vsb-entrance-btn" onClick={onEnter}>Entrar no shopping</button>
      </div>
    </div>
  );
}

// ── CHECKOUT ──────────────────────────────────────────
function CheckoutScreen({ cart, onRemove, onBack }) {
  const total = cart.reduce((sum, item) => {
    const num = parseFloat(item.price.replace(/[^\d,]/g, "").replace(",", "."));
    return sum + (isNaN(num) ? 0 : num * item.qty);
  }, 0);

  return (
    <div className="vsb-checkout-screen">
      <div className="vsb-checkout-card">
        <div className="vsb-checkout-top">
          <button className="vsb-back-arrow" onClick={onBack}>← Voltar</button>
          <h2 className="vsb-checkout-title">🧾 Finalizar Compra</h2>
        </div>
        {cart.length === 0 ? (
          <div className="vsb-checkout-empty">
            <p>Carrinho vazio</p>
            <button className="vsb-back-btn" onClick={onBack}>Voltar ao shopping</button>
          </div>
        ) : (
          <>
            <div className="vsb-checkout-items">
              {cart.map((item, i) => (
                <div key={i} className="vsb-checkout-row">
                  <div className="vsb-checkout-row-left">
                    <div className="vsb-checkout-row-dot" style={{ background: item.color }} />
                    <div>
                      <span className="vsb-checkout-row-name">{item.name}</span>
                      <span className="vsb-checkout-row-qty">Qtd: {item.qty}</span>
                    </div>
                  </div>
                  <div className="vsb-checkout-row-right">
                    <span className="vsb-checkout-row-price">{item.price}</span>
                    <button className="vsb-cart-remove" onClick={() => onRemove(item.name)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="vsb-checkout-summary">
              <div className="vsb-checkout-line"><span>Subtotal</span><span>R$ {total.toFixed(2).replace(".", ",")}</span></div>
              <div className="vsb-checkout-line"><span>Frete</span><span>Grátis</span></div>
              <div className="vsb-checkout-line vsb-checkout-total-line"><span>Total</span><span className="vsb-checkout-total-amount">R$ {total.toFixed(2).replace(".", ",")}</span></div>
            </div>
            <button className="vsb-checkout-pay">Simular Pagamento</button>
            <p className="vsb-checkout-note">Ambiente de demonstração • Nenhuma cobrança real</p>
            <button className="vsb-checkout-back" onClick={onBack}>Continuar comprando</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── CART POPUP ────────────────────────────────────────
function CartPopup({ cart, onRemove, onCheckout, onClose }) {
  const total = cart.reduce((sum, item) => {
    const num = parseFloat(item.price.replace(/[^\d,]/g, "").replace(",", "."));
    return sum + (isNaN(num) ? 0 : num * item.qty);
  }, 0);

  return (
    <div className="vsb-cart-overlay" onClick={onClose}>
      <div className="vsb-cart-modal" onClick={e => e.stopPropagation()}>
        <div className="vsb-cart-header">
          <h3>🛒 Carrinho</h3>
          <button className="vsb-modal-close" onClick={onClose}>✕</button>
        </div>
        {cart.length === 0 ? (
          <p className="vsb-cart-empty">Seu carrinho está vazio</p>
        ) : (
          <div className="vsb-cart-list">
            {cart.map((item, i) => (
              <div key={i} className="vsb-cart-row">
                <div className="vsb-cart-row-info">
                  <span className="vsb-cart-row-name">{item.name}</span>
                  <span className="vsb-cart-row-qty">Qtd: {item.qty}</span>
                </div>
                <div className="vsb-cart-row-right">
                  <span className="vsb-cart-row-price">{item.price}</span>
                  <button className="vsb-cart-remove" onClick={() => onRemove(item.name)}>✕</button>
                </div>
              </div>
            ))}
            <div className="vsb-cart-total">
              <span>Total</span>
              <span className="vsb-cart-total-value">R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
        )}
        {cart.length > 0 && <button className="vsb-cart-checkout" onClick={onCheckout}>Ir para o caixa</button>}
        <p className="vsb-cart-simulate">Simulação • Lojas físicas em breve</p>
      </div>
    </div>
  );
}

// ── PRODUCT MODAL ─────────────────────────────────────
function ProductModal({ product, onClose, onAddToCart }) {
  const [rotate, setRotate] = useState(0);
  const rotRef = useRef(null);
  const [scale, setScale] = useState(1);

  const startRotate = () => { rotRef.current = setInterval(() => setRotate(p => p + 3), 30); };
  const stopRotate = () => { if (rotRef.current) clearInterval(rotRef.current); };

  return (
    <div className="vsb-product-modal-overlay" onClick={onClose}>
      <div className="vsb-product-modal" onClick={e => e.stopPropagation()}>
        <button className="vsb-modal-close" onClick={onClose}>✕</button>
        <div className="vsb-modal-3d">
          <div className="vsb-modal-3d-shape" style={{ transform: `rotateY(${rotate}deg) scale(${scale})`, background: `radial-gradient(circle at 35% 30%, ${product.color}33, transparent 70%)` }}
            onWheel={(e) => setScale(s => Math.max(0.5, Math.min(2, s - e.deltaY * 0.001)))}>
            {product.shape === "box" && <div className="vsb-shape-box" style={{ background: product.color, boxShadow: `0 0 30px ${product.color}44` }} />}
            {product.shape === "sphere" && <div className="vsb-shape-sphere" style={{ background: `radial-gradient(circle at 35% 35%, #fff, ${product.color})`, boxShadow: `0 0 30px ${product.color}44` }} />}
            {product.shape === "cylinder" && <div className="vsb-shape-cylinder" style={{ background: `linear-gradient(135deg, ${product.color}, ${product.color}aa)`, boxShadow: `0 0 30px ${product.color}44` }} />}
            {product.shape === "torus" && <div className="vsb-shape-torus" style={{ borderColor: product.color, boxShadow: `0 0 30px ${product.color}44` }} />}
          </div>
          <div className="vsb-modal-zoom-hint">Rolar para zoom</div>
        </div>
        <div className="vsb-modal-info">
          <h2 className="vsb-modal-name">{product.name}</h2>
          <p className="vsb-modal-price">{product.price}</p>
          <div className="vsb-modal-actions">
            <button className="vsb-rotate-action" onMouseDown={startRotate} onMouseUp={stopRotate} onMouseLeave={stopRotate} onTouchStart={startRotate} onTouchEnd={stopRotate}>⟳ Girar</button>
            <button className="vsb-cart-action" onClick={() => onAddToCart(product)}>🛒 Adicionar ao carrinho</button>
          </div>
          <p className="vsb-modal-shipping">Frete simulado • Consulte prazos</p>
        </div>
      </div>
    </div>
  );
}

// ── NOTIFICATION ──────────────────────────────────────
function Notification({ message, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 2500); return () => clearTimeout(t); }, [message, onHide]);
  return <div className="vsb-notification" onClick={onHide}>{message}</div>;
}

// ── STORE CARD (HTML fallback view) ───────────────────
function StoreCard({ store, onEnter, onSelectProduct, cartItems, onAddToCart }) {
  const [showProducts, setShowProducts] = useState(false);

  return (
    <div className="vsb-store-card" style={{ borderColor: store.color + "44" }}>
      <div className="vsb-store-card-header" onClick={() => setShowProducts(!showProducts)}>
        <span className="vsb-store-card-icon">{store.icon}</span>
        <div className="vsb-store-card-info">
          <h3 className="vsb-store-card-name">{store.name}</h3>
          <p className="vsb-store-card-desc">{store.desc}</p>
        </div>
        <span className={`vsb-store-card-arrow ${showProducts ? "vsb-arrow-open" : ""}`}>▾</span>
      </div>
      {showProducts && (
        <div className="vsb-store-card-products">
          {store.products.map((product, i) => (
            <div key={i} className="vsb-store-card-product" onClick={() => onSelectProduct(product)}>
              <div className="vsb-store-card-product-shape" style={{ background: product.color + "22", borderColor: product.color }}>
                {product.shape === "box" && <div className="vsb-shape-mini-box" style={{ background: product.color }} />}
                {product.shape === "sphere" && <div className="vsb-shape-mini-sphere" style={{ background: product.color }} />}
                {product.shape === "cylinder" && <div className="vsb-shape-mini-cylinder" style={{ background: product.color }} />}
                {product.shape === "torus" && <div className="vsb-shape-mini-torus" style={{ borderColor: product.color }} />}
              </div>
              <div className="vsb-store-card-product-info">
                <span className="vsb-store-card-product-name">{product.name}</span>
                <span className="vsb-store-card-product-price">{product.price}</span>
              </div>
              <button className="vsb-store-card-add" onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}>+</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MALL VIEW (HTML-only, no WebGL) ──────────────────
function MallView({ stores, onSelectProduct, cart, onAddToCart, onCheckout }) {
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const [showCart, setShowCart] = useState(false);
  const [hoveredStore, setHoveredStore] = useState(null);

  return (
    <div className="vsb-mall-view">
      {/* Background */}
      <div className="vsb-mall-bg">
        <div className="vsb-mall-floor" />
        <div className="vsb-mall-walls" />
        <div className="vsb-mall-ceiling">
          {[0,1,2,3,4,5,6,7].map(i => <div key={i} className="vsb-mall-light" style={{ animationDelay: `${i * 0.5}s` }} />)}
        </div>
      </div>

      {/* HUD */}
      <div className="vsb-hud">
        <div className="vsb-hud-top">
          <span className="vsb-hud-logo">🛍️ Virtual Shopping Brane</span>
        </div>
        <div className="vsb-hud-nav">
          {["Todos","Fashion","Gamer","Sneakers","Perfumes","Tech","Accessories","Sports"].map(tab => (
            <button key={tab} className={`vsb-hud-tab ${hoveredStore === tab.toLowerCase() ? "vsb-hud-tab-active" : ""}`}
              onClick={() => {
                const store = stores.find(s => s.name.toLowerCase().startsWith(tab.toLowerCase()));
                if (store) {
                  const el = document.getElementById("store-" + store.id);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}>
              {tab === "Todos" ? "🏪" : ""}{tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stores Grid */}
      <div className="vsb-mall-stores">
        {stores.map(store => (
          <div key={store.id} id={"store-" + store.id}>
            <StoreCard store={store} onEnter={() => {}} onSelectProduct={onSelectProduct} cartItems={cart} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>

      {/* Cart FAB */}
      <button className="vsb-cart-fab" onClick={() => setShowCart(true)}>
        🛒{cartCount > 0 && <span className="vsb-cart-badge">{cartCount}</span>}
      </button>

      {/* Cart Popup */}
      {showCart && <CartPopup cart={cart} onRemove={(name) => {}} onCheckout={onCheckout} onClose={() => setShowCart(false)} />}
    </div>
  );
}

// ── ERROR BOUNDARY ────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("[VSB Error]", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="vsb-error">
          <div className="vsb-error-content">
            <span className="vsb-error-icon">🛍️</span>
            <h2>Virtual Shopping Brane</h2>
            <p>Ocorreu um erro ao carregar a experiência 3D.</p>
            <button className="vsb-entrance-btn" onClick={() => this.setState({ hasError: false })}>
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── 3D MALL SCENE (WebGL Canvas) ─────────────────────
function MallScene3D({ stores, onSelectProduct, cartCount }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [webglReady, setWebglReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || webglFailed) return;

    try {
      const container = containerRef.current;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x05050E);
      scene.fog = new THREE.Fog(0x05050E, 12, 22);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 30);
      camera.position.set(0, 2.5, 6);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      // ── Lights ──
      scene.add(new THREE.AmbientLight(0x222244, 0.3));
      const hemi = new THREE.HemisphereLight(0x4444aa, 0x111122, 0.3);
      scene.add(hemi);
      const main = new THREE.DirectionalLight(0xFFEECC, 0.4);
      main.position.set(0, 6, 3);
      main.castShadow = true;
      scene.add(main);
      const fill = new THREE.DirectionalLight(0x8888FF, 0.15);
      fill.position.set(-3, 4, -4);
      scene.add(fill);

      // ── Floor ──
      const geoFloor = new THREE.PlaneGeometry(18, 14);
      const matFloor = new THREE.MeshStandardMaterial({ color: 0x0E0E20, roughness: 0.3, metalness: 0.15 });
      const floor = new THREE.Mesh(geoFloor, matFloor);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.01;
      floor.receiveShadow = true;
      scene.add(floor);

      // ── Walls ──
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0a18, roughness: 0.8 });
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.5, 14), wallMat);
      leftWall.position.set(-9, 1.75, 0);
      scene.add(leftWall);
      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.5, 14), wallMat);
      rightWall.position.set(9, 1.75, 0);
      scene.add(rightWall);

      // ── Ceiling ──
      const ceilMat = new THREE.MeshStandardMaterial({ color: 0x08081A, roughness: 0.9, metalness: 0.05 });
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), ceilMat);
      ceiling.rotation.x = -Math.PI / 2;
      ceiling.position.y = 3.5;
      scene.add(ceiling);

      // ── Stores ──
      const storeMeshes = [];
      stores.forEach((store, idx) => {
        const side = idx % 2 === 0 ? -1 : 1;
        const zPos = -5 + Math.floor(idx / 2) * 3.2;
        const xPos = side * 6.5;

        const wall = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.0, 2.5), new THREE.MeshStandardMaterial({ color: 0x0E0E20, roughness: 0.6, metalness: 0.1 }));
        wall.position.set(xPos, 1.5, zPos);
        wall.castShadow = true;
        scene.add(wall);

        const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.0), new THREE.MeshStandardMaterial({
          color: store.color, transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.1
        }));
        glass.position.set(xPos + side * 1.26, 1.5, zPos);
        scene.add(glass);

        const signBg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.3), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }));
        signBg.position.set(xPos, 2.85, zPos + side * 1.26);
        scene.add(signBg);

        const signMat = new THREE.MeshBasicMaterial({ color: store.color, transparent: true, opacity: 0.4 });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.1), signMat);
        sign.position.set(xPos, 3.05, zPos + side * 1.26);
        scene.add(sign);

        // Products on pedestal
        store.products.forEach((product, pi) => {
          const pGeo = product.shape === "box" ? new THREE.BoxGeometry(0.3, 0.3, 0.3)
            : product.shape === "sphere" ? new THREE.SphereGeometry(0.2, 12, 12)
            : product.shape === "cylinder" ? new THREE.CylinderGeometry(0.15, 0.15, 0.35, 10)
            : new THREE.TorusGeometry(0.18, 0.07, 8, 14);
          const pMat = new THREE.MeshStandardMaterial({ color: product.color, metalness: 0.2, roughness: 0.4 });
          const mesh = new THREE.Mesh(pGeo, pMat);
          const angle = (pi / store.products.length) * Math.PI * 2;
          mesh.position.set(xPos + Math.cos(angle) * 0.5, 0.35, zPos + Math.sin(angle) * 0.5);
          mesh.userData = { product, onClick: () => onSelectProduct(product) };
          scene.add(mesh);
          storeMeshes.push(mesh);
        });
      });

      // ── Center glow strip ──
      const stripMat = new THREE.MeshBasicMaterial({ color: 0xD4A24C, transparent: true, opacity: 0.08 });
      for (let i = -6; i <= 6; i += 3) {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 1.2), stripMat);
        strip.rotation.x = -Math.PI / 2;
        strip.position.set(i, 0.02, 0);
        scene.add(strip);
      }

      // ── Ceiling lights ──
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.1 });
      [-6, -2, 2, 6].forEach(x => {
        [-4, 0, 4].forEach(z => {
          const l = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.2), lightMat);
          l.position.set(x, 3.48, z);
          scene.add(l);
        });
      });

      setWebglReady(true);

      // ── Animation ──
      const clock = new THREE.Clock();
      const animate = () => {
        const t = clock.getElapsedTime();
        storeMeshes.forEach((mesh, i) => {
          mesh.rotation.y += 0.01;
          mesh.position.y = 0.35 + Math.sin(t * 1.5 + i) * 0.03;
        });
        renderer.render(scene, camera);
        animRef.current = requestAnimationFrame(animate);
      };
      const animRef = { current: requestAnimationFrame(animate) };

      // ── Click handler ──
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const handleClick = (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(storeMeshes);
        if (intersects.length > 0) {
          const data = intersects[0].object.userData;
          if (data.onClick) data.onClick();
        } else {
          // Walk to clicked floor position
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.01);
          const point = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, point);
          if (point) {
            targetPos.set(point.x, 2.5, point.z + 2);
            targetLook.set(point.x, 1.0, point.z);
          }
        }
      };
      renderer.domElement.addEventListener("click", handleClick);

      // ── Camera walk ──
      const currentPos = new THREE.Vector3(0, 2.5, 6);
      const currentLook = new THREE.Vector3(0, 1.0, 0);
      const targetPos = new THREE.Vector3(0, 2.5, 6);
      const targetLook = new THREE.Vector3(0, 1.0, 0);

      const animateCamera = () => {
        currentPos.lerp(targetPos, 0.05);
        currentLook.lerp(targetLook, 0.05);
        camera.position.copy(currentPos);
        camera.lookAt(currentLook);
        animRef2.current = requestAnimationFrame(animateCamera);
      };
      const animRef2 = { current: requestAnimationFrame(animateCamera) };

      // ── Resize ──
      const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      return () => {
        cancelAnimationFrame(animRef.current);
        cancelAnimationFrame(animRef2.current);
        window.removeEventListener("resize", onResize);
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer.dispose();
      };
    } catch (err) {
      console.error("[VSB 3D Error]", err);
      setWebglFailed(true);
    }
  }, [stores, onSelectProduct, webglFailed]);

  if (webglFailed) return null;

  return <div ref={containerRef} className="vsb-canvas" />;
}

// ── FALLBACK (no 3D) ─────────────────────────────────
function FallbackMall({ stores, onSelectProduct, cart, onAddToCart, onCheckout }) {
  return (
    <div className="vsb-fallback">
      <MallView stores={stores} onSelectProduct={onSelectProduct} cart={cart} onAddToCart={onAddToCart} onCheckout={onCheckout} />
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────
export default function VirtualShoppingBrane() {
  const [view, setView] = useState("entrance");
  const [productDetail, setProductDetail] = useState(null);
  const [cart, setCart] = useState([]);
  const [notif, setNotif] = useState("");
  const [use3D, setUse3D] = useState(true);

  useEffect(() => {
    try {
      if (typeof THREE === "undefined") setUse3D(false);
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!gl) setUse3D(false);
    } catch { setUse3D(false); }
  }, []);

  const notify = useCallback((msg) => { setNotif(msg); }, []);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const exist = prev.find(item => item.name === product.name);
      if (exist) return prev.map(item => item.name === product.name ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setProductDetail(null);
    notify(`${product.name} adicionado ao carrinho!`);
  }, [notify]);

  const removeFromCart = useCallback((name) => {
    setCart(prev => prev.filter(item => item.name !== name));
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const [showCart, setShowCart] = useState(false);

  if (view === "entrance") {
    return <EntranceScreen onEnter={() => setView("mall")} />;
  }

  if (view === "checkout") {
    return <CheckoutScreen cart={cart} onRemove={removeFromCart} onBack={() => setView("mall")} />;
  }

  // Mall view
  const scene3d = use3D && (
    <ErrorBoundary>
      <MallScene3D stores={STORE_DATA} onSelectProduct={setProductDetail} cartCount={cartCount} />
    </ErrorBoundary>
  );

  const fallbackView = (
    <div className="vsb-mall-container">
      {scene3d}
      {(!use3D) && (
        <FallbackMall stores={STORE_DATA} onSelectProduct={setProductDetail} cart={cart} onAddToCart={addToCart} onCheckout={() => setView("checkout")} />
      )}
      {/* Overlays */}
      <div className="vsb-hud">
        <div className="vsb-hud-top">
          <span className="vsb-hud-logo">🛍️ Virtual Shopping Brane</span>
        </div>
        <div className="vsb-hud-hint">Clique nos produtos para ver detalhes • Carrinho no canto</div>
      </div>
      <button className="vsb-cart-fab" onClick={() => setShowCart(true)}>
        🛒{cartCount > 0 && <span className="vsb-cart-badge">{cartCount}</span>}
      </button>
      {showCart && <CartPopup cart={cart} onRemove={removeFromCart} onCheckout={() => { setShowCart(false); setView("checkout"); }} onClose={() => setShowCart(false)} />}
    </div>
  );

  return (
    <>
      {fallbackView}
      {productDetail && (
        <ProductModal product={productDetail} onClose={() => setProductDetail(null)} onAddToCart={addToCart} cart={cart} />
      )}
      {notif && <Notification message={notif} onHide={() => setNotif("")} />}
    </>
  );
}
