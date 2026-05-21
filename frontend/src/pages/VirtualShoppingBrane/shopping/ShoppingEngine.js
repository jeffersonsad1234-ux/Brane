const PLACEHOLDER_CACHE = {};

function createPlaceholder(id) {
  if (PLACEHOLDER_CACHE[id]) return PLACEHOLDER_CACHE[id];
  const c = document.createElement('canvas');
  c.width = 4096; c.height = 2048;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 2048);
    g.addColorStop(0, '#0a0a14');
    g.addColorStop(0.3, '#141428');
    g.addColorStop(0.7, '#1a1a30');
    g.addColorStop(1, '#0f0f20');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4096, 2048);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(200,220,255,${Math.random() * 0.04})`;
      ctx.beginPath();
      ctx.arc(Math.random() * 4096, Math.random() * 2048, Math.random() * 2 + 0.5, 0, 6.28);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('adicione sua imagem IA aqui', 2048, 1040);
  }
  PLACEHOLDER_CACHE[id] = c;
  return c;
}

const SCENE_DEFS = {
  "city-street-1": {
    id: "city-street-1",
    name: "Rua da Cidade",
    image: null,
    connections: [
      { yaw: 0, pitch: 0, range: 14, target: "city-street-2", label: "Seguir em frente" },
      { yaw: -70, pitch: -5, range: 12, target: "mall-entrance", label: "← Shopping Brane" },
    ],
    products: [],
  },
  "city-street-2": {
    id: "city-street-2",
    name: "Avenida Principal",
    image: null,
    connections: [
      { yaw: 0, pitch: 0, range: 14, target: "city-street-1", label: "Seguir em frente" },
      { yaw: 100, pitch: -5, range: 12, target: "mall-entrance", label: "Shopping Brane →" },
      { yaw: 180, pitch: 0, range: 12, target: "city-street-1", label: "← Voltar" },
    ],
    products: [],
  },
  "mall-entrance": {
    id: "mall-entrance",
    name: "Entrada do Shopping",
    image: null,
    connections: [
      { yaw: 180, pitch: 0, range: 16, target: "city-street-1", label: "← Rua" },
      { yaw: 0, pitch: -2, range: 14, target: "mall-hall", label: "Entrar no Shopping" },
    ],
    products: [],
  },
  "mall-hall": {
    id: "mall-hall",
    name: "Hall do Shopping",
    image: null,
    connections: [
      { yaw: -55, pitch: -5, range: 8, target: "shoe-store", label: "👟 Sneaker King" },
      { yaw: -30, pitch: -5, range: 8, target: "clothes-store", label: "👔 Fashion Store" },
      { yaw: -10, pitch: -5, range: 8, target: "electronics", label: "💻 TechWorld" },
      { yaw: 10, pitch: -5, range: 8, target: "jewelry-store", label: "💎 Lux Gold" },
      { yaw: 35, pitch: -5, range: 8, target: "supermarket", label: "🛒 Super Market" },
      { yaw: 60, pitch: -5, range: 8, target: "perfume-store", label: "🌸 Glow Beauty" },
      { yaw: 0, pitch: 20, range: 10, target: "food-court", label: "↑ Food Court" },
      { yaw: 180, pitch: 0, range: 14, target: "mall-entrance", label: "← Entrada" },
    ],
    products: [],
  },
  "shoe-store": {
    id: "shoe-store",
    name: "Sneaker King",
    image: null,
    connections: [
      { yaw: 180, pitch: 0, range: 14, target: "mall-hall", label: "← Corredor" },
    ],
    products: [
      { name: "Tênis Runner Pro", price: 299.90, emoji: "👟", image: null, yaw: -30, pitch: -8 },
      { name: "Sapato Social Luxo", price: 459.90, emoji: "👞", image: null, yaw: -10, pitch: -8 },
      { name: "Chinelo Confort", price: 79.90, emoji: "🩴", image: null, yaw: 10, pitch: -8 },
      { name: "Bota Couro", price: 589.90, emoji: "🥾", image: null, yaw: 30, pitch: -8 },
    ],
  },
  "clothes-store": {
    id: "clothes-store",
    name: "Fashion Store",
    image: null,
    connections: [
      { yaw: 180, pitch: 0, range: 14, target: "mall-hall", label: "← Corredor" },
    ],
    products: [
      { name: "Camisa Premium", price: 189.90, emoji: "👔", image: null, yaw: -30, pitch: -8 },
      { name: "Calça Jeans", price: 249.90, emoji: "👖", image: null, yaw: -10, pitch: -8 },
      { name: "Vestido Elegante", price: 329.90, emoji: "👗", image: null, yaw: 10, pitch: -8 },
      { name: "Jaqueta Corta Vento", price: 399.90, emoji: "🧥", image: null, yaw: 30, pitch: -8 },
    ],
  },
  electronics: {
    id: "electronics",
    name: "TechWorld",
    image: null,
    connections: [
      { yaw: 180, pitch: 0, range: 14, target: "mall-hall", label: "← Corredor" },
    ],
    products: [
      { name: "Smart TV 55\" 4K", price: 3299.90, emoji: "📺", image: null, yaw: -30, pitch: -8 },
      { name: "Notebook Ultra", price: 5499.90, emoji: "💻", image: null, yaw: -10, pitch: -8 },
      { name: "Smartphone Z10", price: 2499.90, emoji: "📱", image: null, yaw: 10, pitch: -8 },
      { name: "Fone Bluetooth", price: 449.90, emoji: "🎧", image: null, yaw: 30, pitch: -8 },
    ],
  },
  supermarket: {
    id: "supermarket",
    name: "Super Market",
    image: null,
    connections: [
      { yaw: 180, pitch: 0, range: 14, target: "mall-hall", label: "← Corredor" },
    ],
    products: [
      { name: "Café Gourmet 500g", price: 34.90, emoji: "☕", image: null, yaw: -30, pitch: -8 },
      { name: "Azeite Extra Virgem", price: 49.90, emoji: "🫒", image: null, yaw: -10, pitch: -8 },
      { name: "Chocolate Belga", price: 29.90, emoji: "🍫", image: null, yaw: 10, pitch: -8 },
      { name: "Vinho Tinto", price: 89.90, emoji: "🍷", image: null, yaw: 30, pitch: -8 },
    ],
  },
  "perfume-store": {
    id: "perfume-store",
    name: "Glow Beauty",
    image: null,
    connections: [
      { yaw: 180, pitch: 0, range: 14, target: "mall-hall", label: "← Corredor" },
    ],
    products: [
      { name: "Perfume Bloom", price: 259.90, emoji: "🌸", image: null, yaw: -30, pitch: -8 },
      { name: "Base Matte", price: 129.90, emoji: "💄", image: null, yaw: -10, pitch: -8 },
      { name: "Sérum Revitalizante", price: 189.90, emoji: "🧴", image: null, yaw: 10, pitch: -8 },
      { name: "Paleta Sombras", price: 199.90, emoji: "🎨", image: null, yaw: 30, pitch: -8 },
    ],
  },
  "jewelry-store": {
    id: "jewelry-store",
    name: "Lux Gold",
    image: null,
    connections: [
      { yaw: 180, pitch: 0, range: 14, target: "mall-hall", label: "← Corredor" },
    ],
    products: [
      { name: "Anel Ouro 18k", price: 1299.90, emoji: "💍", image: null, yaw: -30, pitch: -8 },
      { name: "Colar Prata", price: 899.90, emoji: "📿", image: null, yaw: -10, pitch: -8 },
      { name: "Pulseira Diamante", price: 2499.90, emoji: "💎", image: null, yaw: 10, pitch: -8 },
      { name: "Brinco Pérola", price: 699.90, emoji: "✨", image: null, yaw: 30, pitch: -8 },
    ],
  },
  "food-court": {
    id: "food-court",
    name: "Praça de Alimentação",
    image: null,
    connections: [
      { yaw: 180, pitch: 0, range: 14, target: "mall-hall", label: "← Corredor" },
    ],
    products: [
      { name: "Café Expresso", price: 12.90, emoji: "☕", image: null, yaw: -30, pitch: -8 },
      { name: "Cappuccino", price: 16.90, emoji: "🫧", image: null, yaw: -10, pitch: -8 },
      { name: "Bolo Red Velvet", price: 19.90, emoji: "🍰", image: null, yaw: 10, pitch: -8 },
      { name: "Sanduíche Natural", price: 24.90, emoji: "🥪", image: null, yaw: 30, pitch: -8 },
    ],
  },
};

const imageCache = {};

export function loadSceneImage(id) {
  const scene = SCENE_DEFS[id];
  if (!scene || !scene.image) return null;
  if (imageCache[id]) return imageCache[id];
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = scene.image;
  imageCache[id] = img;
  return img;
}

export function getScenePlaceholder(id) {
  return createPlaceholder(id);
}

export function preloadScene(id) {
  loadSceneImage(id);
  createPlaceholder(id);
}

export { SCENE_DEFS };

export default class ShoppingEngine {
  constructor(callbacks) {
    this.callbacks = callbacks || {};
    this.history = ["city-street-1"];
    this.cart = [];
    this._idCounter = 0;
  }

  get sceneId() {
    return this.history[this.history.length - 1];
  }

  get scene() {
    return SCENE_DEFS[this.sceneId] || SCENE_DEFS["city-street-1"];
  }

  navigate(target) {
    if (target === "back") {
      if (this.history.length > 1) this.history.pop();
    } else if (SCENE_DEFS[target]) {
      this.history.push(target);
    }
    this.callbacks.onChange?.({ sceneId: this.sceneId, scene: this.scene });
  }

  addToCart(product) {
    const idx = this.cart.findIndex((p) => p.name === product.name && p.price === product.price);
    if (idx >= 0) {
      this.cart[idx].qty += 1;
    } else {
      this.cart.push({ ...product, qty: 1, _id: ++this._idCounter });
    }
    this._emitCart();
  }

  removeFromCart(id) {
    const idx = this.cart.findIndex((p) => p._id === id);
    if (idx < 0) return;
    if (this.cart[idx].qty > 1) this.cart[idx].qty -= 1;
    else this.cart.splice(idx, 1);
    this._emitCart();
  }

  clearCart() {
    this.cart = [];
    this._emitCart();
  }

  _emitCart() {
    const total = this.cart.reduce((s, p) => s + p.price * p.qty, 0);
    const count = this.cart.reduce((s, p) => s + p.qty, 0);
    this.callbacks.onCart?.({ items: [...this.cart], total, count });
  }

  dispose() {}
}
