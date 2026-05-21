const SCENES = {
  entrance: {
    name: "Entrada do Shopping",
    image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&q=80",
    hotspots: [
      { x: 28, y: 42, w: 44, h: 35, target: "hall", label: "Corredor Principal" },
    ],
    products: [],
  },
  hall: {
    name: "Corredor Principal",
    image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=1200&q=80",
    hotspots: [
      { x: 5, y: 50, w: 18, h: 25, target: "shoes", label: "👟 Sneaker King" },
      { x: 25, y: 50, w: 18, h: 25, target: "clothes", label: "👔 Fashion Store" },
      { x: 45, y: 50, w: 18, h: 25, target: "electronics", label: "💻 TechWorld" },
      { x: 65, y: 50, w: 18, h: 25, target: "supermarket", label: "🛒 Super Market" },
      { x: 45, y: 20, w: 18, h: 18, target: "foodcourt", label: "🍔 Praça Alimentação" },
      { x: 85, y: 50, w: 18, h: 25, target: "cosmetics", label: "🌸 Glow Beauty" },
    ],
    products: [],
  },
  foodcourt: {
    name: "Praça de Alimentação",
    image: "https://images.unsplash.com/photo-1555992336-fb0d29498b80?w=1200&q=80",
    hotspots: [
      { x: 5, y: 85, w: 15, h: 12, target: "hall", label: "← Voltar" },
    ],
    products: [
      { name: "Café Expresso", price: 12.90, emoji: "☕", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80" },
      { name: "Cappuccino Cremoso", price: 16.90, emoji: "🫧", image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80" },
      { name: "Bolo Red Velvet", price: 19.90, emoji: "🍰", image: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=400&q=80" },
      { name: "Sanduíche Natural", price: 24.90, emoji: "🥪", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80" },
    ],
  },
  shoes: {
    name: "Sneaker King",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&q=80",
    hotspots: [
      { x: 5, y: 85, w: 15, h: 12, target: "hall", label: "← Voltar" },
    ],
    products: [
      { name: "Tênis Runner Pro", price: 299.90, emoji: "👟", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
      { name: "Sapato Social Luxo", price: 459.90, emoji: "👞", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80" },
      { name: "Chinelo Confort", price: 79.90, emoji: "🩴", image: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&q=80" },
      { name: "Bota Couro Clássica", price: 589.90, emoji: "🥾", image: "https://images.unsplash.com/photo-1608256246200-53e635b09170?w=400&q=80" },
    ],
  },
  clothes: {
    name: "Fashion Store",
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&q=80",
    hotspots: [
      { x: 5, y: 85, w: 15, h: 12, target: "hall", label: "← Voltar" },
    ],
    products: [
      { name: "Camisa Premium Slim", price: 189.90, emoji: "👔", image: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400&q=80" },
      { name: "Calça Jeans Comfort", price: 249.90, emoji: "👖", image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&q=80" },
      { name: "Vestido Elegante", price: 329.90, emoji: "👗", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&q=80" },
      { name: "Jaqueta Corta Vento", price: 399.90, emoji: "🧥", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80" },
    ],
  },
  electronics: {
    name: "TechWorld",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&q=80",
    hotspots: [
      { x: 5, y: 85, w: 15, h: 12, target: "hall", label: "← Voltar" },
    ],
    products: [
      { name: "Smart TV 55\" 4K", price: 3299.90, emoji: "📺", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80" },
      { name: "Notebook Ultra Pro", price: 5499.90, emoji: "💻", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80" },
      { name: "Smartphone Z10", price: 2499.90, emoji: "📱", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80" },
      { name: "Fone Bluetooth Max", price: 449.90, emoji: "🎧", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80" },
    ],
  },
  supermarket: {
    name: "Super Market",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80",
    hotspots: [
      { x: 5, y: 85, w: 15, h: 12, target: "hall", label: "← Voltar" },
    ],
    products: [
      { name: "Café Gourmet 500g", price: 34.90, emoji: "☕", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80" },
      { name: "Azeite Extra Virgem", price: 49.90, emoji: "🫒", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80" },
      { name: "Chocolate Belga", price: 29.90, emoji: "🍫", image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80" },
      { name: "Vinho Tinto Reserva", price: 89.90, emoji: "🍷", image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80" },
    ],
  },
  cosmetics: {
    name: "Glow Beauty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&q=80",
    hotspots: [
      { x: 5, y: 85, w: 15, h: 12, target: "hall", label: "← Voltar" },
    ],
    products: [
      { name: "Perfume Bloom", price: 259.90, emoji: "🌸", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80" },
      { name: "Base Matte Perfeita", price: 129.90, emoji: "💄", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80" },
      { name: "Sérum Revitalizante", price: 189.90, emoji: "🧴", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80" },
      { name: "Paleta Sombras Luxo", price: 199.90, emoji: "🎨", image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&q=80" },
    ],
  },
};

export { SCENES };

export default class ShoppingEngine {
  constructor(callbacks) {
    this.callbacks = callbacks || {};
    this.sceneHistory = ["entrance"];
    this.cartItems = [];
    this.currentScene = "entrance";
    this.imagesLoaded = new Set();
  }

  get scene() {
    return SCENES[this.currentScene] || SCENES.entrance;
  }

  get sceneId() {
    return this.currentScene;
  }

  navigateTo(sceneId) {
    if (!SCENES[sceneId]) return;
    if (sceneId === "back") {
      if (this.sceneHistory.length > 1) {
        this.sceneHistory.pop();
        this.currentScene = this.sceneHistory[this.sceneHistory.length - 1];
      }
    } else {
      this.sceneHistory.push(sceneId);
      this.currentScene = sceneId;
    }
    this.callbacks.onSceneChange?.(this.currentScene, this.scene);
  }

  addToCart(product) {
    const existing = this.cartItems.find(
      (item) => item.name === product.name && item.price === product.price
    );
    if (existing) {
      existing.qty += 1;
    } else {
      this.cartItems.push({ ...product, qty: 1, id: Date.now() + Math.random() });
    }
    this._update();
  }

  removeFromCart(productId) {
    const idx = this.cartItems.findIndex((item) => item.id === productId);
    if (idx >= 0) {
      if (this.cartItems[idx].qty > 1) {
        this.cartItems[idx].qty -= 1;
      } else {
        this.cartItems.splice(idx, 1);
      }
    }
    this._update();
  }

  clearCart() {
    this.cartItems = [];
    this._update();
  }

  _update() {
    const total = this.cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const count = this.cartItems.reduce((s, i) => s + i.qty, 0);
    this.callbacks.onCartUpdate?.({ items: [...this.cartItems], total, count });
  }

  imageLoaded(url) {
    this.imagesLoaded.add(url);
  }

  isImageLoaded(url) {
    return this.imagesLoaded.has(url);
  }

  dispose() {}
}
