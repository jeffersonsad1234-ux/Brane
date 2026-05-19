import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/virtualShopping.css";

const STORES = [
  {
    id: "moda", name: "Brane Moda", icon: "👗", color: "#FF6B9D", textColor: "#fff",
    desc: "Moda feminina e masculina",
    products: [
      { name: "Vestido Floral", price: "R$ 189,90", emoji: "👗", color: "#FF6B9D" },
      { name: "Jaqueta Jeans", price: "R$ 299,90", emoji: "🧥", color: "#4A6FA5" },
      { name: "Bolsa Couro", price: "R$ 349,90", emoji: "👜", color: "#D4A24C" },
    ],
  },
  {
    id: "tenis", name: "Brane Tênis", icon: "👟", color: "#00BFFF", textColor: "#fff",
    desc: "Os melhores tênis e calçados",
    products: [
      { name: "Air Max 3000", price: "R$ 599,90", emoji: "👟", color: "#FF4500" },
      { name: "Runner Pro X", price: "R$ 429,90", emoji: "👟", color: "#4A90D9" },
      { name: "Casual Street", price: "R$ 349,90", emoji: "👞", color: "#1A1A1A" },
    ],
  },
  {
    id: "gamer", name: "Brane Gamer", icon: "🎮", color: "#8A2CFF", textColor: "#fff",
    desc: "Equipamentos gamers",
    products: [
      { name: "Headset RGB", price: "R$ 299,90", emoji: "🎧", color: "#8A2CFF" },
      { name: "Mouse Pro", price: "R$ 199,90", emoji: "🖱️", color: "#00FF88" },
      { name: "Teclado Mecânico", price: "R$ 449,90", emoji: "⌨️", color: "#2C2C2C" },
    ],
  },
  {
    id: "celulares", name: "Brane Celulares", icon: "📱", color: "#00E5A0", textColor: "#000",
    desc: "Tecnologia e smartphones",
    products: [
      { name: "Phone X Ultra", price: "R$ 4.299,90", emoji: "📱", color: "#1A1A2E" },
      { name: "Tablet Pro 12", price: "R$ 2.899,90", emoji: "💻", color: "#C0C0C0" },
      { name: "SmartWatch 5", price: "R$ 1.299,90", emoji: "⌚", color: "#FFD700" },
    ],
  },
  {
    id: "perfumes", name: "Brane Perfumes", icon: "🧴", color: "#FFD700", textColor: "#000",
    desc: "Perfumes importados",
    products: [
      { name: "Essence Gold", price: "R$ 429,90", emoji: "🧴", color: "#FFD700" },
      { name: "Oud Prestige", price: "R$ 599,90", emoji: "🧴", color: "#800020" },
      { name: "Floral Dream", price: "R$ 299,90", emoji: "🌹", color: "#FFB6C1" },
    ],
  },
  {
    id: "esportes", name: "Brane Esportes", icon: "⚽", color: "#32CD32", textColor: "#000",
    desc: "Artigos esportivos",
    products: [
      { name: "Bola Oficial", price: "R$ 129,90", emoji: "⚽", color: "#FFFFFF" },
      { name: "Mochila Sport", price: "R$ 199,90", emoji: "🎒", color: "#1A1A1A" },
      { name: "Garrafa Térmica", price: "R$ 89,90", emoji: "🧊", color: "#32CD32" },
    ],
  },
];

function EntranceScreen({ onEnter }) {
  return (
    <div className="vsb-entrance">
      <div className="vsb-entrance-bg" />
      <div className="vsb-entrance-content">
        <div className="vsb-entrance-icon-wrap">
          <span className="vsb-entrance-icon">🏬</span>
        </div>
        <h1 className="vsb-entrance-title">
          <span className="vsb-entrance-accent">Virtual Shopping</span> Brane
        </h1>
        <p className="vsb-entrance-sub">Bem-vindo ao shopping virtual mais inovador</p>
        <div className="vsb-entrance-features">
          <span>🏪 6 lojas incríveis para explorar</span>
          <span>🛍️ Produtos em 3D com detalhes</span>
          <span>🛒 Carrinho de compras interativo</span>
        </div>
        <button className="vsb-entrance-btn" onClick={onEnter}>Entrar no shopping</button>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onAddToCart }) {
  return (
    <div className="vsb-modal-overlay" onClick={onClose}>
      <div className="vsb-modal" onClick={e => e.stopPropagation()}>
        <button className="vsb-modal-x" onClick={onClose}>✕</button>
        <div className="vsb-modal-product" style={{ background: `radial-gradient(circle, ${product.color}22, transparent)` }}>
          <span className="vsb-modal-emoji">{product.emoji}</span>
        </div>
        <div className="vsb-modal-details">
          <h2 className="vsb-modal-name">{product.name}</h2>
          <p className="vsb-modal-price">{product.price}</p>
          <p className="vsb-modal-desc">Produto premium com qualidade garantida. Frete grátis para todo o Brasil.</p>
          <div className="vsb-modal-badges">
            <span className="vsb-badge">Frete Grátis</span>
            <span className="vsb-badge">Em Estoque</span>
            <span className="vsb-badge">Original</span>
          </div>
          <button className="vsb-modal-add" onClick={() => onAddToCart(product)}>🛒 Adicionar ao carrinho</button>
        </div>
      </div>
    </div>
  );
}

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
          <button className="vsb-modal-x" onClick={onClose}>✕</button>
        </div>
        {cart.length === 0 ? (
          <div className="vsb-cart-empty-state">
            <span className="vsb-cart-empty-icon">🛒</span>
            <p>Seu carrinho está vazio</p>
            <p className="vsb-cart-empty-sub">Explore as lojas e adicione produtos</p>
          </div>
        ) : (
          <>
            <div className="vsb-cart-list">
              {cart.map((item, i) => (
                <div key={i} className="vsb-cart-item">
                  <div className="vsb-cart-item-left">
                    <span className="vsb-cart-item-emoji">{item.emoji}</span>
                    <div>
                      <div className="vsb-cart-item-name">{item.name}</div>
                      <div className="vsb-cart-item-qty">Qtd: {item.qty}</div>
                    </div>
                  </div>
                  <div className="vsb-cart-item-right">
                    <span className="vsb-cart-item-price">{item.price}</span>
                    <button className="vsb-cart-remove" onClick={() => onRemove(item.name)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="vsb-cart-total">
              <span>Total</span>
              <span className="vsb-cart-total-value">R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
            <button className="vsb-cart-checkout-btn" onClick={onCheckout}>Ir para o caixa</button>
          </>
        )}
      </div>
    </div>
  );
}

function CheckoutScreen({ cart, onRemove, onKeepShopping }) {
  const total = cart.reduce((sum, item) => {
    const num = parseFloat(item.price.replace(/[^\d,]/g, "").replace(",", "."));
    return sum + (isNaN(num) ? 0 : num * item.qty);
  }, 0);

  return (
    <div className="vsb-checkout">
      <div className="vsb-checkout-card">
        <div className="vsb-checkout-header">
          <button className="vsb-back-arrow" onClick={onKeepShopping}>← Voltar</button>
          <h2>🧾 Finalizar Compra</h2>
        </div>
        {cart.length === 0 ? (
          <div className="vsb-checkout-empty">
            <p>Carrinho vazio</p>
            <button className="vsb-back-btn" onClick={onKeepShopping}>Voltar ao shopping</button>
          </div>
        ) : (
          <>
            <div className="vsb-checkout-items">
              {cart.map((item, i) => (
                <div key={i} className="vsb-checkout-row">
                  <div className="vsb-checkout-row-left">
                    <span className="vsb-checkout-row-emoji">{item.emoji}</span>
                    <div>
                      <div className="vsb-checkout-row-name">{item.name}</div>
                      <div className="vsb-checkout-row-qty">Qtd: {item.qty}</div>
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
              <div className="vsb-checkout-line"><span>Frete</span><span className="vsb-free">Grátis</span></div>
              <div className="vsb-checkout-line vsb-checkout-total-line"><span>Total</span><span className="vsb-total-value">R$ {total.toFixed(2).replace(".", ",")}</span></div>
            </div>
            <button className="vsb-pay-btn">💳 Simular Pagamento</button>
            <p className="vsb-checkout-note">Ambiente de demonstração • Nenhuma cobrança real</p>
          </>
        )}
      </div>
    </div>
  );
}

function Notification({ message, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 2500); return () => clearTimeout(t); }, [message, onHide]);
  return <div className="vsb-notif" onClick={onHide}>{message}</div>;
}

export default function VirtualShoppingBrane() {
  const [view, setView] = useState("entrance");
  const [currentStore, setCurrentStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [notif, setNotif] = useState("");
  const [storeIndex, setStoreIndex] = useState(0);
  const corridorRef = useRef(null);

  const notify = useCallback((msg) => { setNotif(msg); }, []);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const exist = prev.find(item => item.name === product.name);
      if (exist) return prev.map(item => item.name === product.name ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setSelectedProduct(null);
    notify(`${product.name} adicionado ao carrinho!`);
  }, [notify]);

  const removeFromCart = useCallback((name) => {
    setCart(prev => prev.filter(item => item.name !== name));
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const leftStores = STORES.filter((_, i) => i % 2 === 0);
  const rightStores = STORES.filter((_, i) => i % 2 === 1);

  if (view === "entrance") {
    return <EntranceScreen onEnter={() => setView("mall")} />;
  }

  if (view === "checkout") {
    return (
      <CheckoutScreen
        cart={cart}
        onRemove={removeFromCart}
        onKeepShopping={() => setView("mall")}
      />
    );
  }

  if (view === "store" && currentStore) {
    const store = STORES.find(s => s.id === currentStore);
    if (!store) return null;
    return (
      <div className="vsb-store-view" style={{ background: `linear-gradient(180deg, ${store.color}11, #05050E)` }}>
        <div className="vsb-store-header">
          <button className="vsb-back-btn" onClick={() => { setView("mall"); setCurrentStore(null); }}>
            ← Corredor
          </button>
          <div className="vsb-store-header-info">
            <span className="vsb-store-header-icon">{store.icon}</span>
            <div>
              <h2 className="vsb-store-header-name">{store.name}</h2>
              <p className="vsb-store-header-desc">{store.desc}</p>
            </div>
          </div>
          <button className="vsb-cart-btn-corner" onClick={() => setShowCart(true)}>
            🛒{cartCount > 0 && <span className="vsb-cart-badge">{cartCount}</span>}
          </button>
        </div>
        <div className="vsb-store-products">
          {store.products.map((product, i) => (
            <div key={i} className="vsb-product-card" onClick={() => setSelectedProduct(product)}
              style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="vsb-product-visual" style={{ background: `radial-gradient(circle at 30% 30%, ${product.color}33, transparent)` }}>
                <span className="vsb-product-emoji">{product.emoji}</span>
              </div>
              <div className="vsb-product-info">
                <span className="vsb-product-name">{product.name}</span>
                <span className="vsb-product-price">{product.price}</span>
              </div>
              <button className="vsb-product-add" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>+</button>
            </div>
          ))}
        </div>
        {showCart && (
          <CartPopup cart={cart} onRemove={removeFromCart}
            onCheckout={() => { setShowCart(false); setView("checkout"); }} onClose={() => setShowCart(false)} />
        )}
        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />
        )}
      </div>
    );
  }

  // ── MALL CORRIDOR VIEW ──
  const prevStore = () => setStoreIndex(i => Math.max(0, i - 1));
  const nextStore = () => setStoreIndex(i => Math.min(leftStores.length - 1, i + 1));

  const currentLeft = leftStores[storeIndex];
  const currentRight = rightStores[storeIndex] || rightStores[rightStores.length - 1];

  return (
    <div className="vsb-mall-corridor">
      {/* Corridor background */}
      <div className="vsb-corr-bg">
        <div className="vsb-corr-ceiling">
          {[0,1,2,3,4,5,6,7].map(i => (
            <div key={i} className="vsb-corr-light" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </div>
        <div className="vsb-corr-floor">
          <div className="vsb-corr-tiles" />
          <div className="vsb-corr-stripe" />
        </div>
      </div>

      {/* Center walkway */}
      <div className="vsb-corr-center">
        <div className="vsb-corr-path" />
      </div>

      {/* Left side store */}
      <div className="vsb-corr-side vsb-corr-left">
        <div className="vsb-storefront" onClick={() => { setCurrentStore(currentLeft.id); setView("store"); }}
          style={{ borderColor: currentLeft.color + "44" }}>
          <div className="vsb-storefront-awning" style={{ background: `linear-gradient(135deg, ${currentLeft.color}, ${currentLeft.color}cc)` }}>
            <div className="vsb-awning-fringe" />
          </div>
          <div className="vsb-storefront-sign">
            <span className="vsb-storefront-icon">{currentLeft.icon}</span>
            <span className="vsb-storefront-name">{currentLeft.name}</span>
          </div>
          <div className="vsb-storefront-window" style={{ borderColor: currentLeft.color + "22" }}>
            <div className="vsb-window-glow" style={{ background: `radial-gradient(ellipse, ${currentLeft.color}22, transparent)` }} />
            <div className="vsb-window-products">
              {currentLeft.products.slice(0, 3).map((p, i) => (
                <div key={i} className="vsb-window-product" style={{ animationDelay: `${i * 0.2}s` }}>
                  <span className="vsb-window-emoji">{p.emoji}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="vsb-storefront-door" style={{ background: currentLeft.color + "22", borderColor: currentLeft.color + "44" }}>
            <div className="vsb-door-handle" style={{ background: currentLeft.color }} />
          </div>
        </div>
      </div>

      {/* Right side store */}
      <div className="vsb-corr-side vsb-corr-right">
        <div className="vsb-storefront" onClick={() => { setCurrentStore(currentRight.id); setView("store"); }}
          style={{ borderColor: currentRight.color + "44" }}>
          <div className="vsb-storefront-awning" style={{ background: `linear-gradient(135deg, ${currentRight.color}, ${currentRight.color}cc)` }}>
            <div className="vsb-awning-fringe" />
          </div>
          <div className="vsb-storefront-sign">
            <span className="vsb-storefront-icon">{currentRight.icon}</span>
            <span className="vsb-storefront-name">{currentRight.name}</span>
          </div>
          <div className="vsb-storefront-window" style={{ borderColor: currentRight.color + "22" }}>
            <div className="vsb-window-glow" style={{ background: `radial-gradient(ellipse, ${currentRight.color}22, transparent)` }} />
            <div className="vsb-window-products">
              {currentRight.products.slice(0, 3).map((p, i) => (
                <div key={i} className="vsb-window-product" style={{ animationDelay: `${i * 0.2}s` }}>
                  <span className="vsb-window-emoji">{p.emoji}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="vsb-storefront-door" style={{ background: currentRight.color + "22", borderColor: currentRight.color + "44" }}>
            <div className="vsb-door-handle" style={{ background: currentRight.color }} />
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="vsb-nav-arrows">
        <button className={`vsb-nav-arrow vsb-nav-prev ${storeIndex === 0 ? "vsb-nav-disabled" : ""}`}
          onClick={prevStore} disabled={storeIndex === 0}>◀</button>
        <div className="vsb-nav-dots">
          {leftStores.map((_, i) => (
            <span key={i} className={`vsb-nav-dot ${i === storeIndex ? "vsb-dot-active" : ""}`}
              style={i === storeIndex ? { background: STORES[i * 2].color } : {}} onClick={() => setStoreIndex(i)} />
          ))}
        </div>
        <button className={`vsb-nav-arrow vsb-nav-next ${storeIndex >= leftStores.length - 1 ? "vsb-nav-disabled" : ""}`}
          onClick={nextStore} disabled={storeIndex >= leftStores.length - 1}>▶</button>
      </div>

      {/* HUD */}
      <div className="vsb-corr-hud">
        <span className="vsb-corr-logo">🏬 Virtual Shopping Brane</span>
      </div>

      {/* Store names overlay */}
      <div className="vsb-corr-labels">
        <span className="vsb-corr-label vsb-corr-label-left" style={{ color: currentLeft.color }}>
          {currentLeft.icon} {currentLeft.name}
        </span>
        <span className="vsb-corr-label vsb-corr-label-right" style={{ color: currentRight.color }}>
          {currentRight.icon} {currentRight.name}
        </span>
      </div>

      {/* Walk hint */}
      <div className="vsb-corr-hint">
        Clique nas lojas para entrar • Use as setas para navegar
      </div>

      {/* Cart FAB */}
      <button className="vsb-cart-fab" onClick={() => setShowCart(true)}>
        🛒{cartCount > 0 && <span className="vsb-cart-badge">{cartCount}</span>}
      </button>

      {showCart && (
        <CartPopup cart={cart} onRemove={removeFromCart}
          onCheckout={() => { setShowCart(false); setView("checkout"); }} onClose={() => setShowCart(false)} />
      )}

      {notif && <Notification message={notif} onHide={() => setNotif("")} />}
    </div>
  );
}
