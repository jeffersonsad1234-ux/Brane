const SCENES = {
  entrance: {
    id: "entrance",
    name: "Entrada do Shopping",
    image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1400&q=85",
    ambient: "mall",
    connections: [
      { x: 30, y: 45, w: 40, h: 35, target: "hall-entrance", label: "Corredor Principal" },
    ],
    products: [],
    npcs: [{ type: "walk", x: 20, y: 55 }, { type: "stand", x: 60, y: 50 }, { type: "walk", x: 75, y: 60 }],
  },
  "hall-entrance": {
    id: "hall-entrance",
    name: "Hall de Entrada",
    image: "https://images.unsplash.com/photo-1517363898874-737b62a7db91?w=1400&q=85",
    ambient: "mall",
    connections: [
      { x: 5, y: 75, w: 90, h: 20, target: "hall-center", label: "Andar" },
      { x: 5, y: 5, w: 15, h: 12, target: "entrance", label: "← Entrada" },
    ],
    products: [],
    npcs: [{ type: "walk", x: 30, y: 52 }, { type: "walk", x: 55, y: 58 }, { type: "stand", x: 80, y: 48 }],
  },
  "hall-center": {
    id: "hall-center",
    name: "Praça Central",
    image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1400&q=85",
    ambient: "mall",
    connections: [
      { x: 5, y: 50, w: 16, h: 30, target: "hall-west", label: "← Alas Oeste" },
      { x: 79, y: 50, w: 16, h: 30, target: "hall-east", label: "Alas Leste →" },
      { x: 38, y: 10, w: 24, h: 20, target: "food-court", label: "↑ Praça Alimentação" },
      { x: 5, y: 5, w: 15, h: 12, target: "hall-entrance", label: "← Hall" },
    ],
    products: [],
    npcs: [
      { type: "walk", x: 20, y: 55 }, { type: "walk", x: 40, y: 50 },
      { type: "walk", x: 60, y: 58 }, { type: "stand", x: 50, y: 45 },
    ],
  },
  "hall-west": {
    id: "hall-west",
    name: "Ala Oeste",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&q=85",
    ambient: "mall",
    connections: [
      { x: 10, y: 42, w: 22, h: 28, target: "shoe-store", label: "👟 Sneaker King" },
      { x: 40, y: 42, w: 22, h: 28, target: "clothes-store", label: "👔 Fashion Store" },
      { x: 5, y: 5, w: 15, h: 12, target: "hall-center", label: "← Central" },
    ],
    products: [],
    npcs: [{ type: "walk", x: 25, y: 52 }, { type: "walk", x: 60, y: 55 }],
  },
  "hall-east": {
    id: "hall-east",
    name: "Ala Leste",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1400&q=85",
    ambient: "mall",
    connections: [
      { x: 10, y: 42, w: 22, h: 28, target: "electronics-store", label: "💻 TechWorld" },
      { x: 40, y: 42, w: 22, h: 28, target: "jewelry-store", label: "💎 Lux Gold" },
      { x: 70, y: 42, w: 22, h: 28, target: "perfume-store", label: "🌸 Glow Beauty" },
      { x: 5, y: 5, w: 15, h: 12, target: "hall-center", label: "← Central" },
    ],
    products: [],
    npcs: [{ type: "walk", x: 30, y: 50 }, { type: "stand", x: 65, y: 48 }],
  },
  "food-court": {
    id: "food-court",
    name: "Praça de Alimentação",
    image: "https://images.unsplash.com/photo-1555992336-fb0d29498b80?w=1400&q=85",
    ambient: "food",
    connections: [
      { x: 5, y: 5, w: 15, h: 12, target: "hall-center", label: "← Corredor" },
    ],
    products: [
      { name: "Café Expresso", price: 12.90, emoji: "☕", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80", x: 12, y: 30 },
      { name: "Cappuccino Cremoso", price: 16.90, emoji: "🫧", image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&q=80", x: 28, y: 30 },
      { name: "Bolo Red Velvet", price: 19.90, emoji: "🍰", image: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=300&q=80", x: 44, y: 30 },
      { name: "Sanduíche Natural", price: 24.90, emoji: "🥪", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80", x: 60, y: 30 },
    ],
    npcs: [{ type: "walk", x: 20, y: 60 }, { type: "sit", x: 40, y: 50 }, { type: "walk", x: 70, y: 55 }],
  },
  "shoe-store": {
    id: "shoe-store",
    name: "Sneaker King",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1400&q=85",
    ambient: "store",
    connections: [
      { x: 5, y: 75, w: 15, h: 12, target: "hall-west", label: "← Corredor" },
    ],
    products: [
      { name: "Tênis Runner Pro", price: 299.90, emoji: "👟", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80", x: 15, y: 30 },
      { name: "Sapato Social Luxo", price: 459.90, emoji: "👞", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&q=80", x: 30, y: 30 },
      { name: "Chinelo Confort", price: 79.90, emoji: "🩴", image: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300&q=80", x: 45, y: 30 },
      { name: "Bota Couro Clássica", price: 589.90, emoji: "🥾", image: "https://images.unsplash.com/photo-1608256246200-53e635b09170?w=300&q=80", x: 60, y: 30 },
      { name: "Tênis Casual Slim", price: 199.90, emoji: "👟", image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&q=80", x: 75, y: 30 },
      { name: "Sandália Verão", price: 129.90, emoji: "🩴", image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=300&q=80", x: 88, y: 30 },
    ],
    npcs: [{ type: "stand", x: 30, y: 50 }, { type: "browse", x: 55, y: 45 }],
  },
  "clothes-store": {
    id: "clothes-store",
    name: "Fashion Store",
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1400&q=85",
    ambient: "store",
    connections: [
      { x: 5, y: 75, w: 15, h: 12, target: "hall-west", label: "← Corredor" },
    ],
    products: [
      { name: "Camisa Premium Slim", price: 189.90, emoji: "👔", image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=300&q=80", x: 12, y: 30 },
      { name: "Calça Jeans Comfort", price: 249.90, emoji: "👖", image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=300&q=80", x: 27, y: 30 },
      { name: "Vestido Elegante", price: 329.90, emoji: "👗", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80", x: 42, y: 30 },
      { name: "Jaqueta Corta Vento", price: 399.90, emoji: "🧥", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80", x: 57, y: 30 },
      { name: "Moletom Premium", price: 259.90, emoji: "👕", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&q=80", x: 72, y: 30 },
      { name: "Blazer Executivo", price: 599.90, emoji: "🧥", image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=300&q=80", x: 87, y: 30 },
    ],
    npcs: [{ type: "browse", x: 25, y: 48 }, { type: "stand", x: 60, y: 52 }],
  },
  "electronics-store": {
    id: "electronics-store",
    name: "TechWorld",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1400&q=85",
    ambient: "store",
    connections: [
      { x: 5, y: 75, w: 15, h: 12, target: "hall-east", label: "← Corredor" },
    ],
    products: [
      { name: "Smart TV 55\" 4K", price: 3299.90, emoji: "📺", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&q=80", x: 12, y: 25 },
      { name: "Notebook Ultra Pro", price: 5499.90, emoji: "💻", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80", x: 28, y: 25 },
      { name: "Smartphone Z10", price: 2499.90, emoji: "📱", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80", x: 44, y: 25 },
      { name: "Fone Bluetooth Max", price: 449.90, emoji: "🎧", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80", x: 60, y: 25 },
      { name: "Tablet Pro 12.9", price: 4299.90, emoji: "📱", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&q=80", x: 76, y: 25 },
      { name: "Caixa Som Portátil", price: 599.90, emoji: "🔊", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&q=80", x: 88, y: 25 },
    ],
    npcs: [{ type: "browse", x: 35, y: 45 }, { type: "walk", x: 65, y: 50 }],
  },
  "jewelry-store": {
    id: "jewelry-store",
    name: "Lux Gold Joias",
    image: "https://images.unsplash.com/photo-1515562141589-63e8a100171a?w=1400&q=85",
    ambient: "store",
    connections: [
      { x: 5, y: 75, w: 15, h: 12, target: "hall-east", label: "← Corredor" },
    ],
    products: [
      { name: "Anel Ouro 18k", price: 1299.90, emoji: "💍", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300&q=80", x: 15, y: 30 },
      { name: "Colar Prata Elegance", price: 899.90, emoji: "📿", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&q=80", x: 30, y: 30 },
      { name: "Pulseira Diamante", price: 2499.90, emoji: "💎", image: "https://images.unsplash.com/photo-1611652022419-a9410f743df2?w=300&q=80", x: 45, y: 30 },
      { name: "Brinco Pérola Fina", price: 699.90, emoji: "✨", image: "https://images.unsplash.com/photo-1535632066927-ab7c8ab60908?w=300&q=80", x: 60, y: 30 },
      { name: "Relógio Luxo Importado", price: 4999.90, emoji: "⌚", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=300&q=80", x: 78, y: 30 },
    ],
    npcs: [{ type: "stand", x: 50, y: 50 }],
  },
  "perfume-store": {
    id: "perfume-store",
    name: "Glow Beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=85",
    ambient: "store",
    connections: [
      { x: 5, y: 75, w: 15, h: 12, target: "hall-east", label: "← Corredor" },
    ],
    products: [
      { name: "Perfume Bloom", price: 259.90, emoji: "🌸", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&q=80", x: 12, y: 28 },
      { name: "Base Matte Perfeita", price: 129.90, emoji: "💄", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80", x: 27, y: 28 },
      { name: "Sérum Revitalizante", price: 189.90, emoji: "🧴", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80", x: 42, y: 28 },
      { name: "Paleta Sombras Luxo", price: 199.90, emoji: "🎨", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&q=80", x: 57, y: 28 },
      { name: "Hidratante Facial Premium", price: 159.90, emoji: "🧴", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&q=80", x: 73, y: 28 },
      { name: "Kit Presente Luxo", price: 399.90, emoji: "🎁", image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&q=80", x: 87, y: 28 },
    ],
    npcs: [{ type: "browse", x: 30, y: 48 }, { type: "stand", x: 70, y: 50 }],
  },
};

export { SCENES };

export default class ShoppingEngine {
  constructor(callbacks) {
    this.callbacks = callbacks || {};
    this.history = ["entrance"];
    this.cart = [];
    this._idCounter = 0;
  }

  get sceneId() {
    return this.history[this.history.length - 1];
  }

  get scene() {
    return SCENES[this.sceneId] || SCENES.entrance;
  }

  navigate(target) {
    if (target === "back") {
      if (this.history.length > 1) this.history.pop();
    } else if (SCENES[target]) {
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
    if (this.cart[idx].qty > 1) {
      this.cart[idx].qty -= 1;
    } else {
      this.cart.splice(idx, 1);
    }
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
