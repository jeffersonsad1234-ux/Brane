import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/virtualShopping.css";

const STORES = [
  {
    id:"moda", name:"Brane Moda", icon:"👗", color:"#FF6B9D",
    desc:"Roupas e acessórios",
    products:[
      { name:"Vestido Premium", price:"R$ 189,90", emoji:"👗", color:"#FF6B9D", store:"Moda" },
      { name:"Jaqueta Leather", price:"R$ 349,90", emoji:"🧥", color:"#8B4513", store:"Moda" },
      { name:"Bolsa Elegance", price:"R$ 259,90", emoji:"👜", color:"#D4A24C", store:"Moda" },
    ],
  },
  {
    id:"tenis", name:"Brane Tênis", icon:"👟", color:"#00BFFF",
    desc:"Calçados esportivos",
    products:[
      { name:"Air Max 3000", price:"R$ 599,90", emoji:"👟", color:"#FF4500", store:"Tênis" },
      { name:"Runner Pro X", price:"R$ 429,90", emoji:"👟", color:"#4A90D9", store:"Tênis" },
      { name:"Casual Street", price:"R$ 349,90", emoji:"👞", color:"#1A1A1A", store:"Tênis" },
    ],
  },
  {
    id:"gamer", name:"Brane Gamer", icon:"🎮", color:"#8A2CFF",
    desc:"Equipamentos gamers",
    products:[
      { name:"Headset RGB", price:"R$ 299,90", emoji:"🎧", color:"#8A2CFF", store:"Gamer" },
      { name:"Controle Pro", price:"R$ 199,90", emoji:"🎮", color:"#00FF88", store:"Gamer" },
      { name:"Teclado Mecânico", price:"R$ 449,90", emoji:"⌨️", color:"#2C2C2C", store:"Gamer" },
    ],
  },
  {
    id:"celulares", name:"Brane Celulares", icon:"📱", color:"#00E5A0",
    desc:"Smartphones e tablets",
    products:[
      { name:"Phone X Ultra", price:"R$ 4.299,90", emoji:"📱", color:"#1A1A2E", store:"Celulares" },
      { name:"Tablet Pro 12", price:"R$ 2.899,90", emoji:"💻", color:"#C0C0C0", store:"Celulares" },
      { name:"Smartwatch 5", price:"R$ 1.299,90", emoji:"⌚", color:"#FFD700", store:"Celulares" },
    ],
  },
  {
    id:"perfumes", name:"Brane Perfumes", icon:"🧴", color:"#FFD700",
    desc:"Perfumes importados",
    products:[
      { name:"Essence Gold", price:"R$ 429,90", emoji:"🧴", color:"#FFD700", store:"Perfumes" },
      { name:"Oud Prestige", price:"R$ 599,90", emoji:"🧴", color:"#800020", store:"Perfumes" },
      { name:"Floral Dream", price:"R$ 299,90", emoji:"🌹", color:"#FFB6C1", store:"Perfumes" },
    ],
  },
  {
    id:"esportes", name:"Brane Esportes", icon:"⚽", color:"#32CD32",
    desc:"Artigos esportivos",
    products:[
      { name:"Bola Oficial", price:"R$ 129,90", emoji:"⚽", color:"#FFFFFF", store:"Esportes" },
      { name:"Mochila Sport", price:"R$ 199,90", emoji:"🎒", color:"#1A1A1A", store:"Esportes" },
      { name:"Garrafa Térmica", price:"R$ 89,90", emoji:"🧊", color:"#32CD32", store:"Esportes" },
    ],
  },
];

// ── ENTRANCE ──────────────────────────────────────────
function Entrance({ onEnter }) {
  return (
    <div className="vsb-entrance">
      <div className="vsb-entrance-bg" />
      <div className="vsb-entrance-body">
        <div className="vsb-entrance-icon-box">
          <span className="vsb-entrance-icon">🏬</span>
        </div>
        <h1 className="vsb-entrance-title">
          Virtual Shopping <span className="vsb-entrance-gold">Brane</span>
        </h1>
        <p className="vsb-entrance-sub">Bem-vindo ao shopping virtual</p>
        <div className="vsb-entrance-feats">
          <span>⤵ Ande clicando no chão</span>
          <span>🏪 Entre nas lojas clicando na porta</span>
          <span>🛒 Carrinho interativo</span>
        </div>
        <button className="vsb-entrance-go" onClick={onEnter}>Entrar no shopping</button>
      </div>
    </div>
  );
}

// ── PRODUCT MODAL ──────────────────────────────────────
function ProductModal({ product, onClose, onAdd }) {
  return (
    <div className="vsb-modal-wrap" onClick={onClose}>
      <div className="vsb-modal-box" onClick={e => e.stopPropagation()}>
        <button className="vsb-modal-x" onClick={onClose}>✕</button>
        <div className="vsb-modal-visual" style={{ background: `radial-gradient(circle,${product.color}22,transparent)` }}>
          <span className="vsb-modal-emoji">{product.emoji}</span>
        </div>
        <div className="vsb-modal-body">
          <h2 className="vsb-modal-name">{product.name}</h2>
          <p className="vsb-modal-price">{product.price}</p>
          <p className="vsb-modal-desc">Produto premium • Frete grátis • Original</p>
          <div className="vsb-modal-badges">
            <span>Frete Grátis</span><span>Em Estoque</span>
          </div>
          <button className="vsb-modal-buy" onClick={() => onAdd(product)}>🛒 Adicionar ao carrinho</button>
        </div>
      </div>
    </div>
  );
}

// ── CART ──────────────────────────────────────────────
function CartPanel({ cart, onRemove, onCheckout, onClose }) {
  const total = cart.reduce((s, i) => s + (parseFloat(i.price.replace(/[^\d,]/g,"").replace(",","."))||0)*i.qty, 0);
  return (
    <div className="vsb-cart-overlay" onClick={onClose}>
      <div className="vsb-cart-sheet" onClick={e => e.stopPropagation()}>
        <div className="vsb-cart-head">
          <h3>🛒 Carrinho</h3>
          <button className="vsb-modal-x" onClick={onClose}>✕</button>
        </div>
        {cart.length===0 ? (
          <div className="vsb-cart-empty">
            <span className="vsb-cart-empty-icon">🛒</span>
            <p>Carrinho vazio</p>
          </div>
        ) : (
          <>
            <div className="vsb-cart-items">
              {cart.map((item,i) => (
                <div key={i} className="vsb-cart-row">
                  <span className="vsb-cart-emoji">{item.emoji}</span>
                  <div className="vsb-cart-mid">
                    <span className="vsb-cart-name">{item.name}</span>
                    <span className="vsb-cart-qty">Qtd: {item.qty}</span>
                  </div>
                  <div className="vsb-cart-end">
                    <span className="vsb-cart-price">{item.price}</span>
                    <button className="vsb-cart-del" onClick={()=>onRemove(item.name)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="vsb-cart-total">
              <span>Total</span>
              <span className="vsb-cart-total-val">R$ {total.toFixed(2).replace(".",",")}</span>
            </div>
            <button className="vsb-cart-pay" onClick={onCheckout}>Ir para o caixa</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── CHECKOUT ──────────────────────────────────────────
function Checkout({ cart, onRemove, onBack }) {
  const total = cart.reduce((s,i) => s+(parseFloat(i.price.replace(/[^\d,]/g,"").replace(",","."))||0)*i.qty, 0);
  return (
    <div className="vsb-checkout">
      <div className="vsb-checkout-card">
        <div className="vsb-checkout-head">
          <button className="vsb-back-btn" onClick={onBack}>← Voltar</button>
          <h2>🧾 Finalizar</h2>
        </div>
        {cart.length===0 ? (
          <div className="vsb-checkout-empty"><p>Vazio</p><button className="vsb-back-btn" onClick={onBack}>Voltar</button></div>
        ) : (
          <>
            {cart.map((item,i) => (
              <div key={i} className="vsb-checkout-row">
                <span className="vsb-checkout-emoji">{item.emoji}</span>
                <div className="vsb-checkout-mid">
                  <span>{item.name}</span>
                  <span className="vsb-checkout-qty">Qtd: {item.qty}</span>
                </div>
                <div className="vsb-checkout-end">
                  <span className="vsb-checkout-price">{item.price}</span>
                  <button className="vsb-cart-del" onClick={()=>onRemove(item.name)}>✕</button>
                </div>
              </div>
            ))}
            <div className="vsb-checkout-summary">
              <div className="vsb-checkout-line"><span>Subtotal</span><span>R$ {total.toFixed(2).replace(".",",")}</span></div>
              <div className="vsb-checkout-line"><span>Frete</span><span style={{color:"#32CD32"}}>Grátis</span></div>
              <div className="vsb-checkout-line vsb-checkout-total"><span>Total</span><span className="vsb-gold">R$ {total.toFixed(2).replace(".",",")}</span></div>
            </div>
            <button className="vsb-pay-btn">💳 Pagar</button>
            <p className="vsb-checkout-note">Simulação • Nenhuma cobrança real</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── NOTIFICATION ──────────────────────────────────────
function Notif({ msg, onHide }) {
  useEffect(()=>{const t=setTimeout(onHide,2500);return ()=>clearTimeout(t);},[msg,onHide]);
  return <div className="vsb-notif" onClick={onHide}>{msg}</div>;
}

// ── MAIN ──────────────────────────────────────────────
export default function VirtualShoppingBrane() {
  const [view, setView] = useState("entrance");
  const [phase, setPhase] = useState(0);
  const [currentStore, setCurrentStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [notif, setNotif] = useState("");
  const corridorRef = useRef(null);

  const notify = useCallback(m => setNotif(m), []);
  const add = useCallback(p => {
    setCart(prev => { const e = prev.find(i => i.name === p.name); return e ? prev.map(i => i.name===p.name ? {...i, qty: i.qty+1} : i) : [...prev, {...p, qty: 1}]; });
    setSelectedProduct(null);
    notify(`${p.name} adicionado!`);
  }, [notify]);
  const remove = useCallback(name => setCart(prev => prev.filter(i => i.name !== name)), []);
  const cartCount = cart.reduce((s,i) => s + i.qty, 0);

  if (view === "entrance") return <Entrance onEnter={() => setView("corridor")} />;
  if (view === "checkout") return <Checkout cart={cart} onRemove={remove} onBack={() => setView("corridor")} />;

  // ── STORE INTERIOR ──────────────────────────────────
  if (view === "store" && currentStore) {
    const s = STORES.find(x => x.id === currentStore);
    if (!s) return null;
    return (
      <div className="vsb-store-scene" style={{background:`linear-gradient(180deg,${s.color}11,#05050E)`}}>
        <div className="vsb-store-top">
          <button className="vsb-back-btn" onClick={()=>{setView("corridor");setCurrentStore(null);}}>← Corredor</button>
          <div className="vsb-store-top-info">
            <span className="vsb-store-top-icon">{s.icon}</span>
            <div>
              <h2 className="vsb-store-top-name">{s.name}</h2>
              <p className="vsb-store-top-desc">{s.desc}</p>
            </div>
          </div>
          <button className="vsb-cart-corner" onClick={()=>setShowCart(true)}>🛒{cartCount>0 && <span className="vsb-cart-badge-sm">{cartCount}</span>}</button>
        </div>
        {/* Shelf with products */}
        <div className="vsb-store-shelf">
          <div className="vsb-shelf-bg" style={{background:`linear-gradient(180deg,${s.color}11,${s.color}08,transparent)`}} />
          {s.products.map((p,i) => (
            <div key={i} className="vsb-shelf-item" style={{animationDelay:`${i*0.12}s`}} onClick={()=>setSelectedProduct(p)}>
              <div className="vsb-shelf-visual" style={{background:`radial-gradient(circle at 30% 30%,${p.color}44,transparent)`}}>
                <span className="vsb-shelf-emoji">{p.emoji}</span>
              </div>
              <div className="vsb-shelf-name">{p.name}</div>
              <div className="vsb-shelf-price">{p.price}</div>
              <button className="vsb-shelf-add" onClick={e=>{e.stopPropagation();add(p);}}>+</button>
            </div>
          ))}
        </div>
        {showCart && <CartPanel cart={cart} onRemove={remove} onCheckout={()=>{setShowCart(false);setView("checkout");}} onClose={()=>setShowCart(false)} />}
        {selectedProduct && <ProductModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} onAdd={add} />}
      </div>
    );
  }

  // ── CORRIDOR ────────────────────────────────────────
  const pairs = [
    [STORES[0], STORES[1]],
    [STORES[2], STORES[3]],
    [STORES[4], STORES[5]],
  ];

  const depthOrder = [2, 1, 0]; // close, medium, far

  const visible = depthOrder.map((depth, i) => {
    const idx = (phase + i) % pairs.length;
    return { pair: pairs[idx], depth, zIndex: 3 - i };
  });

  const handleFloorClick = (e) => {
    const rect = corridorRef.current.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;
    if (y > 0.62) setPhase(p => (p + 1) % pairs.length);
    if (y > 0.78) setPhase(p => (p + 2) % pairs.length);
  };

  return (
    <div className="vsb-corridor" ref={corridorRef}>
      {/* ── Background layers ── */}
      <div className="vsb-corridor-bg" onClick={handleFloorClick}>
        {/* Ceiling */}
        <div className="vsb-ceiling">
          <div className="vsb-ceil-inner">
            {[0,1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="vsb-ceil-light" style={{animationDelay:`${i*0.3}s`,opacity:1-i*0.08}} />
            ))}
          </div>
        </div>
        {/* Walls */}
        <div className="vsb-walls">
          <div className="vsb-wall vsb-wall-l" />
          <div className="vsb-wall-center" />
          <div className="vsb-wall vsb-wall-r" />
        </div>
        {/* Floor */}
        <div className="vsb-floor">
          <div className="vsb-floor-tiles" />
          <div className="vsb-floor-glare" />
        </div>
      </div>

      {/* ── Stores ── */}
      {visible.map(({ pair, depth, zIndex }) => (
        <React.Fragment key={`${pair[0].id}-${depth}`}>
          {/* Left store */}
          <div className={`vsb-store-3d vsb-store-left depth-${depth}`} style={{zIndex}} onClick={()=>{setCurrentStore(pair[0].id);setView("store");}}>
            <div className="vsb-3d-awning" style={{background:`linear-gradient(135deg,${pair[0].color},${pair[0].color}cc)`}}>
              <div className="vsb-3d-fringe" />
            </div>
            <div className="vsb-3d-sign">
              <span className="vsb-3d-icon">{pair[0].icon}</span>
              <span className="vsb-3d-name">{pair[0].name}</span>
            </div>
            <div className="vsb-3d-window" style={{borderColor:`${pair[0].color}22`}}>
              <div className="vsb-3d-glow" style={{background:`radial-gradient(ellipse,${pair[0].color}33,transparent)`}} />
              <div className="vsb-3d-products">
                {pair[0].products.slice(0,3).map((p,i) => (
                  <div key={i} className="vsb-3d-prod" style={{animationDelay:`${i*0.2}s`}}>
                    <span className="vsb-3d-prod-emoji">{p.emoji}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="vsb-3d-door" style={{background:`${pair[0].color}11`,borderColor:`${pair[0].color}33`}}>
              <div className="vsb-3d-handle" style={{background:pair[0].color}} />
              <span className="vsb-3d-door-label">Entrar</span>
            </div>
          </div>

          {/* Right store */}
          <div className={`vsb-store-3d vsb-store-right depth-${depth}`} style={{zIndex}} onClick={()=>{setCurrentStore(pair[1].id);setView("store");}}>
            <div className="vsb-3d-awning" style={{background:`linear-gradient(135deg,${pair[1].color},${pair[1].color}cc)`}}>
              <div className="vsb-3d-fringe" />
            </div>
            <div className="vsb-3d-sign">
              <span className="vsb-3d-icon">{pair[1].icon}</span>
              <span className="vsb-3d-name">{pair[1].name}</span>
            </div>
            <div className="vsb-3d-window" style={{borderColor:`${pair[1].color}22`}}>
              <div className="vsb-3d-glow" style={{background:`radial-gradient(ellipse,${pair[1].color}33,transparent)`}} />
              <div className="vsb-3d-products">
                {pair[1].products.slice(0,3).map((p,i) => (
                  <div key={i} className="vsb-3d-prod" style={{animationDelay:`${i*0.2}s`}}>
                    <span className="vsb-3d-prod-emoji">{p.emoji}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="vsb-3d-door" style={{background:`${pair[1].color}11`,borderColor:`${pair[1].color}33`}}>
              <div className="vsb-3d-handle" style={{background:pair[1].color}} />
              <span className="vsb-3d-door-label">Entrar</span>
            </div>
          </div>
        </React.Fragment>
      ))}

      {/* ── Navigation dots ── */}
      <div className="vsb-nav-dots">
        {pairs.map((_, i) => (
          <span key={i} className={`vsb-dot ${i === phase ? "vsb-dot-on" : ""}`}
            style={i===phase ? {background:STORES[i*2].color} : {}}
            onClick={() => setPhase(i)} />
        ))}
      </div>

      {/* ── HUD ── */}
      <div className="vsb-hud">
        <span className="vsb-hud-logo">🏬 Virtual Shopping Brane</span>
      </div>

      {/* ── Floor click hint ── */}
      <div className="vsb-hint">
        <span>Clique no chão para andar</span>
      </div>

      {/* ── Cart ── */}
      <button className="vsb-cart-fab" onClick={() => setShowCart(true)}>
        🛒{cartCount > 0 && <span className="vsb-cart-badge">{cartCount}</span>}
      </button>

      {showCart && <CartPanel cart={cart} onRemove={remove} onCheckout={()=>{setShowCart(false);setView("checkout");}} onClose={()=>setShowCart(false)} />}
      {notif && <Notif msg={notif} onHide={() => setNotif("")} />}
    </div>
  );
}
