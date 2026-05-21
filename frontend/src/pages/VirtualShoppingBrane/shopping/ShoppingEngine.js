const SCENES = {
  entrance: {
    id: "entrance",
    name: "Entrada do Shopping",
    image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1600&q=85",
    connections: [
      { yaw: 0, pitch: 0, range: 15, target: "hall", label: "Corredor Principal" },
    ],
    products: [],
  },
  hall: {
    id: "hall",
    name: "Corredor Principal",
    image: "https://images.unsplash.com/photo-1517363898874-737b62a7db91?w=1600&q=85",
    connections: [
      { yaw: -35, pitch: -5, range: 10, target: "shoe-store", label: "👟 Sneaker King" },
      { yaw: -15, pitch: -5, range: 10, target: "clothes-store", label: "👔 Fashion Store" },
      { yaw: 15, pitch: -5, range: 10, target: "electronics-store", label: "💻 TechWorld" },
      { yaw: 35, pitch: -5, range: 10, target: "jewelry-store", label: "💎 Lux Gold" },
      { yaw: 60, pitch: -5, range: 10, target: "supermarket", label: "🛒 Super Market" },
      { yaw: -60, pitch: -5, range: 10, target: "perfume-store", label: "🌸 Glow Beauty" },
      { yaw: 0, pitch: 15, range: 12, target: "food-court", label: "🍔 Praça Alimentação" },
      { yaw: 180, pitch: 0, range: 15, target: "entrance", label: "← Entrada" },
    ],
    products: [],
  },
  "food-court": {
    id: "food-court",
    name: "Praça de Alimentação",
    image: "https://images.unsplash.com/photo-1555992336-fb0d29498b80?w=1600&q=85",
    connections: [
      { yaw: 180, pitch: 0, range: 15, target: "hall", label: "← Corredor" },
    ],
    products: [
      { name: "Café Expresso", price: 12.90, emoji: "☕", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80", yaw: -30, pitch: -8 },
      { name: "Cappuccino Cremoso", price: 16.90, emoji: "🫧", image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&q=80", yaw: -10, pitch: -8 },
      { name: "Bolo Red Velvet", price: 19.90, emoji: "🍰", image: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=300&q=80", yaw: 10, pitch: -8 },
      { name: "Sanduíche Natural", price: 24.90, emoji: "🥪", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80", yaw: 30, pitch: -8 },
    ],
  },
  "shoe-store": {
    id: "shoe-store",
    name: "Sneaker King",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1600&q=85",
    connections: [
      { yaw: 180, pitch: 0, range: 15, target: "hall", label: "← Corredor" },
    ],
    products: [
      { name: "Tênis Runner Pro", price: 299.90, emoji: "👟", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80", yaw: -40, pitch: -10 },
      { name: "Sapato Social Luxo", price: 459.90, emoji: "👞", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300&q=80", yaw: -20, pitch: -10 },
      { name: "Chinelo Confort", price: 79.90, emoji: "🩴", image: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=300&q=80", yaw: 0, pitch: -10 },
      { name: "Bota Couro Clássica", price: 589.90, emoji: "🥾", image: "https://images.unsplash.com/photo-1608256246200-53e635b09170?w=300&q=80", yaw: 20, pitch: -10 },
      { name: "Tênis Casual Slim", price: 199.90, emoji: "👟", image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=300&q=80", yaw: 40, pitch: -10 },
    ],
  },
  "clothes-store": {
    id: "clothes-store",
    name: "Fashion Store",
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1600&q=85",
    connections: [
      { yaw: 180, pitch: 0, range: 15, target: "hall", label: "← Corredor" },
    ],
    products: [
      { name: "Camisa Premium Slim", price: 189.90, emoji: "👔", image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=300&q=80", yaw: -35, pitch: -10 },
      { name: "Calça Jeans Comfort", price: 249.90, emoji: "👖", image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=300&q=80", yaw: -15, pitch: -10 },
      { name: "Vestido Elegante", price: 329.90, emoji: "👗", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80", yaw: 5, pitch: -10 },
      { name: "Jaqueta Corta Vento", price: 399.90, emoji: "🧥", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80", yaw: 25, pitch: -10 },
    ],
  },
  "electronics-store": {
    id: "electronics-store",
    name: "TechWorld",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1600&q=85",
    connections: [
      { yaw: 180, pitch: 0, range: 15, target: "hall", label: "← Corredor" },
    ],
    products: [
      { name: "Smart TV 55\" 4K", price: 3299.90, emoji: "📺", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&q=80", yaw: -35, pitch: -10 },
      { name: "Notebook Ultra Pro", price: 5499.90, emoji: "💻", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80", yaw: -12, pitch: -10 },
      { name: "Smartphone Z10", price: 2499.90, emoji: "📱", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80", yaw: 12, pitch: -10 },
      { name: "Fone Bluetooth Max", price: 449.90, emoji: "🎧", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80", yaw: 35, pitch: -10 },
    ],
  },
  "jewelry-store": {
    id: "jewelry-store",
    name: "Lux Gold Joias",
    image: "https://images.unsplash.com/photo-1515562141589-63e8a100171a?w=1600&q=85",
    connections: [
      { yaw: 180, pitch: 0, range: 15, target: "hall", label: "← Corredor" },
    ],
    products: [
      { name: "Anel Ouro 18k", price: 1299.90, emoji: "💍", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300&q=80", yaw: -30, pitch: -10 },
      { name: "Colar Prata Elegance", price: 899.90, emoji: "📿", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&q=80", yaw: -10, pitch: -10 },
      { name: "Pulseira Diamante", price: 2499.90, emoji: "💎", image: "https://images.unsplash.com/photo-1611652022419-a9410f743df2?w=300&q=80", yaw: 10, pitch: -10 },
      { name: "Brinco Pérola Fina", price: 699.90, emoji: "✨", image: "https://images.unsplash.com/photo-1535632066927-ab7c8ab60908?w=300&q=80", yaw: 30, pitch: -10 },
    ],
  },
  supermarket: {
    id: "supermarket",
    name: "Super Market",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=85",
    connections: [
      { yaw: 180, pitch: 0, range: 15, target: "hall", label: "← Corredor" },
    ],
    products: [
      { name: "Café Gourmet 500g", price: 34.90, emoji: "☕", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&q=80", yaw: -30, pitch: -10 },
      { name: "Azeite Extra Virgem", price: 49.90, emoji: "🫒", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80", yaw: -10, pitch: -10 },
      { name: "Chocolate Belga", price: 29.90, emoji: "🍫", image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300&q=80", yaw: 10, pitch: -10 },
      { name: "Vinho Tinto Reserva", price: 89.90, emoji: "🍷", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&q=80", yaw: 30, pitch: -10 },
    ],
  },
  "perfume-store": {
    id: "perfume-store",
    name: "Glow Beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&q=85",
    connections: [
      { yaw: 180, pitch: 0, range: 15, target: "hall", label: "← Corredor" },
    ],
    products: [
      { name: "Perfume Bloom", price: 259.90, emoji: "🌸", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&q=80", yaw: -30, pitch: -10 },
      { name: "Base Matte Perfeita", price: 129.90, emoji: "💄", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80", yaw: -10, pitch: -10 },
      { name: "Sérum Revitalizante", price: 189.90, emoji: "🧴", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80", yaw: 10, pitch: -10 },
      { name: "Paleta Sombras Luxo", price: 199.90, emoji: "🎨", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&q=80", yaw: 30, pitch: -10 },
    ],
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
