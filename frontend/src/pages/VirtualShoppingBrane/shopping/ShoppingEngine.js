import * as THREE from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Store definitions
const STORE_DATA = [
  { id: "shoes", name: "Sneaker King", cat: "Sapatos", color: 0x2a1a3a, accent: 0x8844aa },
  { id: "clothes", name: "Fashion Store", cat: "Roupas", color: 0x1a2a3a, accent: 0x4488cc },
  { id: "electronics", name: "TechWorld", cat: "Eletrônicos", color: 0x0a1a2a, accent: 0x00aaff },
  { id: "jewelry", name: "Lux Gold", cat: "Bijuterias", color: 0x2a1a0a, accent: 0xffaa00 },
  { id: "supermarket", name: "Super Market", cat: "Mercado", color: 0x1a2a1a, accent: 0x44aa44 },
  { id: "cosmetics", name: "Glow Beauty", cat: "Cosméticos", color: 0x2a1a2a, accent: 0xff66aa },
  { id: "cafe", name: "Coffee & Co", cat: "Café", color: 0x1a1a0a, accent: 0x886633 },
  { id: "tech", name: "Gamer Zone", cat: "Tecnologia", color: 0x0a0a1a, accent: 0x00ff88 },
  { id: "fashion", name: "Urban Style", cat: "Moda", color: 0x1a0a0a, accent: 0xcc3344 },
  { id: "accessories", name: "Access", cat: "Acessórios", color: 0x0a1a1a, accent: 0x44ddff },
  { id: "sports", name: "Sport Max", cat: "Esportes", color: 0x1a2a0a, accent: 0x88ff44 },
  { id: "books", name: "Book House", cat: "Livros", color: 0x1a1a0a, accent: 0xcc8833 },
];

// Fake products per store
const PRODUCTS_BY_STORE = {
  shoes: [
    { name: "Tênis Runner Pro", price: 299.90, emoji: "👟", color: 0x4488ff },
    { name: "Sapato Social Luxo", price: 459.90, emoji: "👞", color: 0x1a1a1a },
    { name: "Chinelo Confort", price: 79.90, emoji: "🩴", color: 0x44aaff },
    { name: "Bota Couro Clássica", price: 589.90, emoji: "🥾", color: 0x5a3a1a },
  ],
  clothes: [
    { name: "Camisa Premium Slim", price: 189.90, emoji: "👔", color: 0x4488cc },
    { name: "Calça Jeans Comfort", price: 249.90, emoji: "👖", color: 0x2a4a6a },
    { name: "Vestido Elegante", price: 329.90, emoji: "👗", color: 0xcc4488 },
    { name: "Jaqueta Corta Vento", price: 399.90, emoji: "🧥", color: 0x2a2a3a },
  ],
  electronics: [
    { name: "Smart TV 55\" 4K", price: 3299.90, emoji: "📺", color: 0x0a0a0a },
    { name: "Notebook Ultra Pro", price: 5499.90, emoji: "💻", color: 0xcccccc },
    { name: "Smartphone Z10", price: 2499.90, emoji: "📱", color: 0x222222 },
    { name: "Fone Bluetooth Max", price: 449.90, emoji: "🎧", color: 0x1a1a2a },
  ],
  jewelry: [
    { name: "Anel Ouro 18k", price: 1299.90, emoji: "💍", color: 0xffcc00 },
    { name: "Colar Prata Elegance", price: 899.90, emoji: "📿", color: 0xcccccc },
    { name: "Pulseira Diamante", price: 2499.90, emoji: "💎", color: 0x88ccff },
    { name: "Brinco Pérola Fina", price: 699.90, emoji: "✨", color: 0xffeeee },
  ],
  supermarket: [
    { name: "Café Gourmet 500g", price: 34.90, emoji: "☕", color: 0x4a2a1a },
    { name: "Azeite Extra Virgem", price: 49.90, emoji: "🫒", color: 0x2a5a1a },
    { name: "Chocolate Belga", price: 29.90, emoji: "🍫", color: 0x3a1a0a },
    { name: "Vinho Tinto Reserva", price: 89.90, emoji: "🍷", color: 0x4a0a0a },
  ],
  cosmetics: [
    { name: "Perfume Bloom", price: 259.90, emoji: "🌸", color: 0xff88aa },
    { name: "Base Matte Perfeita", price: 129.90, emoji: "💄", color: 0xddbbaa },
    { name: "Sérum Revitalizante", price: 189.90, emoji: "🧴", color: 0x88ccff },
    { name: "Paleta Sombras Luxo", price: 199.90, emoji: "🎨", color: 0xcc88aa },
  ],
  cafe: [
    { name: "Café Expresso", price: 12.90, emoji: "☕", color: 0x3a1a0a },
    { name: "Cappuccino Cremoso", price: 16.90, emoji: "🫧", color: 0xddbb99 },
    { name: "Bolo Red Velvet", price: 19.90, emoji: "🍰", color: 0xcc3344 },
    { name: "Sanduíche Natural", price: 24.90, emoji: "🥪", color: 0x88aa44 },
  ],
  tech: [
    { name: "Mouse Gamer RGB", price: 199.90, emoji: "🖱️", color: 0x00ff88 },
    { name: "Teclado Mecânico", price: 449.90, emoji: "⌨️", color: 0x111111 },
    { name: "Cadeira Ergonômica", price: 1899.90, emoji: "🪑", color: 0x1a1a2a },
    { name: "Monitor Curvo 32\"", price: 2199.90, emoji: "🖥️", color: 0x0a0a0a },
  ],
  fashion: [
    { name: "Tênis Fashion High", price: 349.90, emoji: "👟", color: 0xff4488 },
    { name: "Bolsa Couro Premium", price: 599.90, emoji: "👜", color: 0x3a1a0a },
    { name: "Óculos Sol Style", price: 299.90, emoji: "🕶️", color: 0x111111 },
    { name: "Relógio Esportivo", price: 799.90, emoji: "⌚", color: 0x444466 },
  ],
  accessories: [
    { name: "Mochila Urbana", price: 199.90, emoji: "🎒", color: 0x2a3a4a },
    { name: "Cinto Couro Legítimo", price: 149.90, emoji: "🪢", color: 0x3a2a1a },
    { name: "Cachecol Cashmere", price: 179.90, emoji: "🧣", color: 0x884466 },
    { name: "Luva Tátil Inverno", price: 129.90, emoji: "🧤", color: 0x2a2a3a },
  ],
  sports: [
    { name: "Bola Oficial Society", price: 149.90, emoji: "⚽", color: 0xffffff },
    { name: "Tênis Corrida Air", price: 399.90, emoji: "👟", color: 0x00ccff },
    { name: "Garrafa Térmica 1L", price: 89.90, emoji: "🧴", color: 0x4488ff },
    { name: "Peso Academia 10kg", price: 129.90, emoji: "🏋️", color: 0x333333 },
  ],
  books: [
    { name: "O Guia do Mochileiro", price: 59.90, emoji: "📚", color: 0x224488 },
    { name: "Inteligência Artificial", price: 89.90, emoji: "🤖", color: 0x2288aa },
    { name: "Culinária Italiana", price: 69.90, emoji: "🍝", color: 0xcc6644 },
    { name: "Box Harry Potter", price: 199.90, emoji: "⚡", color: 0x4a0a0a },
  ],
};

export default class ShoppingEngine {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};

    this.state = { stamina: 100, cartItems: [], cartTotal: 0, cartCount: 0 };
    this.keys = {};

    // Three.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;
    this.objects = [];
    this.clock = new THREE.Clock();
    this.running = false;
    this._boundLoop = null;

    // Player
    this.yaw = 0;
    this.pitch = -0.05;
    this.playerPos = new THREE.Vector3(0, 0, 0);
    this.playerVel = new THREE.Vector3(0, 0, 0);
    this.targetPos = null;
    this.moveSpeed = 4;
    this.eyeHeight = 1.6;
    this.onGround = false;
    this.gravity = -18;

    // Cart
    this.cartItems = [];
    this.cartGroup = null;

    // Stores
    this.storeMeshes = [];
    this.productMeshes = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;

    // Minimap
    this.minimapCanvas = null;
    this.minimapCtx = null;
  }

  init() {
    try {
      this._setupRenderer();
      this._setupScene();
      this._setupLights();
      this._buildMall();
      this._buildStores();
      this._buildCart();
      this._setupInput();
      this._startLoop();

      this.state.renderOk = true;
      return true;
    } catch (e) {
      console.error("[Shopping] Init error:", e);
      return false;
    }
  }

  _setupRenderer() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x1a1a2a, 1);
    this.container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.15, 0.5, 0.02);
    this.composer.addPass(this.bloomPass);

    window.addEventListener("resize", () => {
      const cw = this.container.clientWidth;
      const ch = this.container.clientHeight;
      if (this.camera) { this.camera.aspect = cw / ch; this.camera.updateProjectionMatrix(); }
      if (this.renderer) this.renderer.setSize(cw, ch);
      if (this.composer) this.composer.setSize(cw, ch);
    });
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    // Sky gradient
    const c = document.createElement("canvas");
    c.width = 1; c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#0a0a1a"); g.addColorStop(0.5, "#1a1a3a"); g.addColorStop(1, "#2a2a3a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 256);
    this.scene.background = new THREE.CanvasTexture(c);
    this.scene.backgroundIntensity = 0.6;
    this.scene.fog = new THREE.FogExp2(new THREE.Color(0x1a1a2a), 0.008);
  }

  _setupLights() {
    // Ambient
    this.scene.add(new THREE.AmbientLight(0x334466, 0.4));
    // Hemisphere
    this.scene.add(new THREE.HemisphereLight(0x4488ff, 0x553322, 0.3));
    // Main directional (simulating skylight through glass ceiling)
    const sun = new THREE.DirectionalLight(0xffeedd, 0.6);
    sun.position.set(0, 20, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.001;
    const sc = sun.shadow.camera;
    sc.near = 1; sc.far = 50;
    sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30;
    this.scene.add(sun);
    // Warm fill
    const fill = new THREE.DirectionalLight(0xff8844, 0.2);
    fill.position.set(-5, 5, -10);
    this.scene.add(fill);
    // Cool fill
    const cool = new THREE.DirectionalLight(0x4488ff, 0.15);
    cool.position.set(10, 5, 5);
    this.scene.add(cool);
  }

  _buildMall() {
    // ── FLOOR (polished marble) ──
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8e0d8, roughness: 0.05, metalness: 0.2,
      clearcoat: 0.8, clearcoatRoughness: 0.05, envMapIntensity: 2.0,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.scene.add(floor); this.objects.push(floor);

    // ── CEILING ──
    const ceilMat = new THREE.MeshPhysicalMaterial({ color: 0xf0f0f0, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(68, 48), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 5.5, 0);
    this.scene.add(ceil); this.objects.push(ceil);

    // Ceiling light panels
    const lightMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 0.4,
      roughness: 0.9, metalness: 0, side: THREE.DoubleSide,
    });
    for (let x = -30; x <= 30; x += 6) {
      for (let z = -20; z <= 20; z += 6) {
        if (Math.abs(x) < 8 && Math.abs(z) < 8) continue; // open atrium
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), lightMat);
        panel.rotation.x = Math.PI / 2;
        panel.position.set(x, 5.4, z);
        this.scene.add(panel); this.objects.push(panel);
      }
    }

    // ── WALLS (perimeter) ──
    const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xf5f0ea, roughness: 0.6, metalness: 0 });
    const wallH = 5.5;
    const makeWall = (w, x, z, ry) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.3), wallMat);
      wall.position.set(x, wallH / 2, z);
      wall.rotation.y = ry || 0;
      wall.castShadow = true;
      this.scene.add(wall); this.objects.push(wall);
    };
    makeWall(70, 0, -25); // south
    makeWall(70, 0, 25);  // north
    makeWall(50, -35, 0, Math.PI / 2); // west
    makeWall(50, 35, 0, Math.PI / 2);  // east

    // ── ATRIUM CENTER ──
    // Decorative fountain base
    const fountainMat = new THREE.MeshPhysicalMaterial({ color: 0x888899, roughness: 0.3, metalness: 0.5 });
    const fountain = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 0.3, 16), fountainMat);
    fountain.position.set(0, 0.15, 0);
    this.scene.add(fountain); this.objects.push(fountain);
    // Water
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x4488cc, roughness: 0.0, metalness: 0.0,
      transparent: true, opacity: 0.4, clearcoat: 1.0, ior: 1.33,
    });
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.3, 0);
    this.scene.add(water); this.objects.push(water);
    // Central column/skylight support
    const colMat = new THREE.MeshPhysicalMaterial({ color: 0xccccee, roughness: 0.2, metalness: 0.7 });
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5.2, 8), colMat);
    col.position.set(0, 2.6, 0);
    this.scene.add(col); this.objects.push(col);
    // Glass panels around atrium (decorative)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff, roughness: 0.0, metalness: 0.0,
      transparent: true, opacity: 0.08, clearcoat: 1.0, ior: 1.5,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const gp = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.5), glassMat);
      gp.position.set(Math.cos(a) * 0.8, 1.25, Math.sin(a) * 0.8);
      gp.lookAt(0, 1.25, 0);
      this.scene.add(gp); this.objects.push(gp);
    }

    // ── ESCALATORS (decorative) ──
    const escMat = new THREE.MeshPhysicalMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.6 });
    const escStepMat = new THREE.MeshPhysicalMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2 });
    for (const [ex, ez, rot] of [[-5, -2, 0], [5, -2, 0], [-5, 2, Math.PI], [5, 2, Math.PI]]) {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 3.5), escMat);
      base.position.set(ex, 0.05, ez);
      base.rotation.y = rot;
      this.scene.add(base); this.objects.push(base);
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 3.0), escMat);
      ramp.position.set(ex, 0.3, ez + (rot === 0 ? 0.3 : -0.3));
      ramp.rotation.x = rot === 0 ? 0.15 : -0.15;
      this.scene.add(ramp); this.objects.push(ramp);
      // Steps
      for (let s = 0; s < 6; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.4), escStepMat);
        step.position.set(ex, 0.08 + s * 0.08, ez + (rot === 0 ? -1.2 + s * 0.5 : 1.2 - s * 0.5));
        this.scene.add(step); this.objects.push(step);
      }
    }

    // ── BENCHES ──
    const benchMat = new THREE.MeshPhysicalMaterial({ color: 0x5a4a3a, roughness: 0.7, metalness: 0.1 });
    for (const [bx, bz] of [[-3, -4], [3, -4], [-3, 4], [3, 4]]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.4), benchMat);
      seat.position.set(bx, 0.5, bz);
      this.scene.add(seat); this.objects.push(seat);
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), benchMat);
      leg1.position.set(bx - 0.6, 0.23, bz - 0.15);
      this.scene.add(leg1); this.objects.push(leg1);
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), benchMat);
      leg2.position.set(bx + 0.6, 0.23, bz - 0.15);
      this.scene.add(leg2); this.objects.push(leg2);
      const leg3 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), benchMat);
      leg3.position.set(bx - 0.6, 0.23, bz + 0.15);
      this.scene.add(leg3); this.objects.push(leg3);
      const leg4 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.04), benchMat);
      leg4.position.set(bx + 0.6, 0.23, bz + 0.15);
      this.scene.add(leg4); this.objects.push(leg4);
    }

    // ── PLANTS (decorative) ──
    const potMat = new THREE.MeshPhysicalMaterial({ color: 0x3a2a1a, roughness: 0.9, metalness: 0 });
    const leafMat = new THREE.MeshPhysicalMaterial({ color: 0x1a6a2a, roughness: 0.9, metalness: 0, clearcoat: 0.1 });
    for (const [px, pz] of [[-8, -5], [8, -5], [-8, 5], [8, 5]]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.4, 8), potMat);
      pot.position.set(px, 0.2, pz);
      this.scene.add(pot); this.objects.push(pot);
      for (let l = 0; l < 5; l++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), leafMat);
        leaf.position.set(px + Math.cos(l * 1.2) * 0.2, 0.4 + Math.sin(l * 0.7) * 0.15, pz + Math.sin(l * 1.2) * 0.2);
        this.scene.add(leaf); this.objects.push(leaf);
      }
    }
  }

  _buildStores() {
    const storeW = 8;
    const storeD = 6;
    const storeH = 4;
    const wallH = 5.5;

    // Store positions: [x, z, rotation_y]
    const positions = [
      // North row (z = -23 to -15)
      [-26, -22, 0], [-16, -22, 0], [-6, -22, 0], [4, -22, 0], [14, -22, 0], [24, -22, 0],
      // South row (z = 15 to 23)
      [-26, 22, Math.PI], [-16, 22, Math.PI], [-6, 22, Math.PI], [4, 22, Math.PI], [14, 22, Math.PI], [24, 22, Math.PI],
    ];

    // Store indices for positioning
    const northIndices = [0, 1, 2, 3, 4, 5];
    const southIndices = [6, 7, 8, 9, 10, 11];

    for (let si = 0; si < STORE_DATA.length; si++) {
      const store = STORE_DATA[si];
      const idx = si < 6 ? northIndices[si] : southIndices[si - 6];
      const [sx, sz, rot] = positions[idx];
      const gh = 0; // floor level

      const wallMat = new THREE.MeshPhysicalMaterial({ color: store.color, roughness: 0.5, metalness: 0.3 });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff, roughness: 0.0, metalness: 0.0,
        transparent: true, opacity: 0.15, clearcoat: 1.0, ior: 1.5,
      });
      const floorMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3a4a, roughness: 0.5, metalness: 0.1 });
      const signMat = new THREE.MeshPhysicalMaterial({ color: store.accent, emissive: store.accent, emissiveIntensity: 0.3, roughness: 0.2, metalness: 0.5 });
      const shelfMat = new THREE.MeshPhysicalMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.3 });

      const group = new THREE.Group();

      // Back wall
      const back = new THREE.Mesh(new THREE.BoxGeometry(storeW, storeH, 0.15), wallMat);
      back.position.set(0, storeH / 2, -storeD / 2);
      group.add(back);

      // Side walls (glass)
      for (const side of [-1, 1]) {
        const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, storeH, storeD), glassMat);
        sideWall.position.set(side * storeW / 2, storeH / 2, 0);
        group.add(sideWall);
      }

      // Front glass
      const front = new THREE.Mesh(new THREE.BoxGeometry(storeW, storeH, 0.05), glassMat);
      front.position.set(0, storeH / 2, storeD / 2 - 0.025);
      group.add(front);

      // Floor
      const sFloor = new THREE.Mesh(new THREE.BoxGeometry(storeW - 0.2, 0.05, storeD - 0.2), floorMat);
      sFloor.position.set(0, 0.025, 0);
      group.add(sFloor);

      // Sign (above store)
      const signH = 0.5;
      const sign = new THREE.Mesh(new THREE.BoxGeometry(storeW - 1, signH, 0.1), signMat);
      sign.position.set(0, storeH + signH / 2, storeD / 2 - 0.3);
      group.add(sign);

      // Shelves inside
      for (let sh = 0; sh < 3; sh++) {
        for (let sd = 0; sd < 3; sd++) {
          const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.6), shelfMat);
          shelf.position.set(-storeW / 4 + sd * 2.5, 0.5 + sh * 1.0, 0.3);
          group.add(shelf);
        }
      }

      // Products on shelves
      const products = PRODUCTS_BY_STORE[store.id] || [];
      for (let pi = 0; pi < Math.min(4, products.length); pi++) {
        const prod = products[pi];
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2),
          new THREE.MeshPhysicalMaterial({ color: prod.color, roughness: 0.4, metalness: 0.2 }));
        const sx2 = -storeW / 4 + (pi % 2) * 2.5;
        const sz2 = 0.8 + Math.floor(pi / 2) * 1.5;
        box.position.set(sx2, 0.6 + (pi % 3) * 0.8, sz2);
        box.userData = { isProduct: true, storeId: store.id, productIndex: pi };
        this.productMeshes.push(box);
        group.add(box);
      }

      // Door opening (a simple door mesh)
      const doorMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff, roughness: 0.0, metalness: 0.0,
        transparent: true, opacity: 0.3, clearcoat: 0.8, ior: 1.5,
      });
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), doorMat);
      door.position.set(0, 1.1, storeD / 2 + 0.01);
      group.add(door);

      group.position.set(sx, gh, sz);
      group.rotation.y = rot;
      this.scene.add(group);
      this.objects.push(group);
      this.storeMeshes.push({ group, store, position: [sx, sz] });

      // Spotlight above store
      const spot = new THREE.SpotLight(0xffffff, 0.15, 6, Math.PI / 6, 0.5, 1);
      spot.position.set(sx, 5, sz - 1);
      spot.target.position.set(sx, 0, sz - 2);
      this.scene.add(spot);
      this.scene.add(spot.target);
    }
  }

  _buildCart() {
    this.cartGroup = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x888899, roughness: 0.3, metalness: 0.7 });
    const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x333344, roughness: 0.5, metalness: 0.3 });

    // Basket
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.3), mat);
    basket.position.set(0, 0.125, 0);
    this.cartGroup.add(basket);

    // Basket interior
    const innerMat = new THREE.MeshPhysicalMaterial({ color: 0x666677, roughness: 0.5, metalness: 0.2 });
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.21, 0.26), innerMat);
    inner.position.set(0, 0.15, 0);
    this.cartGroup.add(inner);

    // Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6), darkMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0.28, -0.15);
    this.cartGroup.add(handle);

    const handle2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6), darkMat);
    handle2.rotation.z = Math.PI / 2;
    handle2.position.set(0, 0.28, 0.15);
    this.cartGroup.add(handle2);

    // Wheels
    for (const [wx, wz] of [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]]) {
      const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), darkMat);
      wheel.position.set(wx, 0.02, wz);
      wheel.scale.set(1, 0.5, 1);
      this.cartGroup.add(wheel);
    }

    this.scene.add(this.cartGroup);
  }

  _setupInput() {
    this._onKeyDown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if ([' ', 'control'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    this._onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    // Mouse look
    this._onMouseMove = (e) => {
      if (document.pointerLockElement !== this.container) return;
      this.yaw -= e.movementX * 0.002;
      this.pitch -= e.movementY * 0.002;
      this.pitch = clamp(this.pitch, -Math.PI / 3, Math.PI / 3);
    };
    document.addEventListener("mousemove", this._onMouseMove);

    // Click to move or interact
    this._onClick = () => {
      if (document.pointerLockElement !== this.container) {
        this.container.requestPointerLock();
        return;
      }
      // Raycast for product interaction
      this._handleInteraction();
    };
    this.container.addEventListener("click", this._onClick);
    this.container.setAttribute("tabindex", "0");
    this.container.focus();

    // Touch support for mobile
    let touchStartPos = null;
    this._onTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    this._onTouchMove = (e) => {
      if (e.touches.length === 1 && touchStartPos) {
        const dx = e.touches[0].clientX - touchStartPos.x;
        const dy = e.touches[0].clientY - touchStartPos.y;
        this.yaw -= dx * 0.005;
        this.pitch -= dy * 0.005;
        this.pitch = clamp(this.pitch, -Math.PI / 3, Math.PI / 3);
        touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    this._onTouchEnd = (e) => {
      if (touchStartPos && e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartPos.x;
        const dy = e.changedTouches[0].clientY - touchStartPos.y;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
          this._handleInteraction();
        }
      }
      touchStartPos = null;
    };
    this.container.addEventListener("touchstart", this._onTouchStart, { passive: true });
    this.container.addEventListener("touchmove", this._onTouchMove, { passive: true });
    this.container.addEventListener("touchend", this._onTouchEnd, { passive: true });
  }

  _handleInteraction() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.productMeshes);
    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData && obj.userData.isProduct) {
        const store = STORE_DATA.find(s => s.id === obj.userData.storeId);
        const products = PRODUCTS_BY_STORE[store.id] || [];
        const prod = products[obj.userData.productIndex];
        if (prod) {
          this.callbacks.onProductClick?.({
            storeName: store.name,
            ...prod,
            id: store.id + "_" + obj.userData.productIndex,
          });
        }
        return;
      }
    }
    // Click to move: raycast to floor
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const floorIntersects = this.raycaster.intersectObject(this.objects[0]); // floor is first
    if (floorIntersects.length > 0) {
      const pt = floorIntersects[0].point;
      this.targetPos = new THREE.Vector3(pt.x, 0, pt.z);
    }
  }

  addToCart(storeId, productIndex) {
    const store = STORE_DATA.find(s => s.id === storeId);
    if (!store) return;
    const products = PRODUCTS_BY_STORE[store.id] || [];
    const prod = products[productIndex];
    if (!prod) return;

    const existing = this.cartItems.find(item => item.storeId === storeId && item.productIndex === productIndex);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cartItems.push({
        storeId, productIndex, qty: 1,
        name: prod.name, price: prod.price, emoji: prod.emoji, storeName: store.name,
      });
    }
    this._updateCartState();
  }

  removeFromCart(storeId, productIndex) {
    const idx = this.cartItems.findIndex(item => item.storeId === storeId && item.productIndex === productIndex);
    if (idx >= 0) {
      if (this.cartItems[idx].qty > 1) {
        this.cartItems[idx].qty -= 1;
      } else {
        this.cartItems.splice(idx, 1);
      }
    }
    this._updateCartState();
  }

  _updateCartState() {
    const total = this.cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const count = this.cartItems.reduce((sum, item) => sum + item.qty, 0);
    this.state.cartItems = [...this.cartItems];
    this.state.cartTotal = total;
    this.state.cartCount = count;
    this.callbacks.onCartUpdate?.({ items: this.cartItems, total, count });
  }

  _startLoop() {
    this.running = true;
    this.clock.start();
    this._boundLoop = () => {
      if (!this.running) return;
      requestAnimationFrame(this._boundLoop);
      try {
        const dt = Math.min(this.clock.getDelta(), 0.05);
        this._update(dt);
        this.composer.render();
      } catch (e) {
        console.error("[Shopping] Loop error:", e);
      }
    };
    this._boundLoop();
  }

  _update(dt) {
    this._handleInput(dt);
    this._updatePlayer(dt);
    this._updateCart(dt);
  }

  _handleInput(_dt) {
    // WASD movement
    if (document.pointerLockElement === this.container) {
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(forward.z, 0, -forward.x);
      let mx = 0, mz = 0;
      if (this.keys['w']) { mx += forward.x; mz += forward.z; }
      if (this.keys['s']) { mx -= forward.x; mz -= forward.z; }
      if (this.keys['d']) { mx += right.x; mz += right.z; }
      if (this.keys['a']) { mx -= right.x; mz -= right.z; }
      const len = Math.sqrt(mx * mx + mz * mz);
      const speed = this.keys['shift'] ? 6 : 3;
      if (len > 0.01) {
        this.playerVel.x = (mx / len) * speed;
        this.playerVel.z = (mz / len) * speed;
        this.targetPos = null;
      } else {
        this.playerVel.x *= 0.88;
        this.playerVel.z *= 0.88;
      }
    }

    // Click-to-move
    if (this.targetPos) {
      const dx = this.targetPos.x - this.playerPos.x;
      const dz = this.targetPos.z - this.playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.3) {
        this.playerVel.x = (dx / dist) * 3.5;
        this.playerVel.z = (dz / dist) * 3.5;
        // Face movement direction
        this.yaw = Math.atan2(-dx, -dz);
      } else {
        this.targetPos = null;
        this.playerVel.x = 0;
        this.playerVel.z = 0;
      }
    }
  }

  _updatePlayer(dt) {
    // Apply velocity
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.z += this.playerVel.z * dt;
    // Keep inside mall bounds
    this.playerPos.x = clamp(this.playerPos.x, -33, 33);
    this.playerPos.z = clamp(this.playerPos.z, -23, 23);

    // Ground at y=0
    this.playerPos.y = 0;

    // Walk bob
    const moving = Math.abs(this.playerVel.x) > 0.05 || Math.abs(this.playerVel.z) > 0.05;
    const bob = moving ? Math.sin(Date.now() * 0.012) * 0.02 : 0;

    // Camera
    this.camera.position.set(this.playerPos.x, this.playerPos.y + this.eyeHeight + bob, this.playerPos.z);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

    // Update state for stamina
    const sprinting = this.keys['shift'] && moving;
    if (sprinting) {
      this.state.stamina = Math.max(0, this.state.stamina - 15 * dt);
    } else {
      this.state.stamina = Math.min(100, this.state.stamina + 10 * dt);
    }
    this.callbacks.onStateChange?.({ ...this.state, pos: this.playerPos });
  }

  _updateCart(dt) {
    if (!this.cartGroup) return;
    // Cart is always in front of camera, slightly below
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const target = new THREE.Vector3(
      this.playerPos.x + forward.x * 0.8,
      this.playerPos.y + 0.3 + Math.sin(Date.now() * 0.005) * 0.01,
      this.playerPos.z + forward.z * 0.8
    );
    this.cartGroup.position.lerp(target, 0.1);
    this.cartGroup.rotation.y = this.yaw;
  }

  enablePointerLock() {
    if (document.pointerLockElement !== this.container) {
      this.container.requestPointerLock();
    }
  }

  dispose() {
    this.running = false;
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    document.removeEventListener("mousemove", this._onMouseMove);
    this.container.removeEventListener("click", this._onClick);
    this.container.removeEventListener("touchstart", this._onTouchStart);
    this.container.removeEventListener("touchmove", this._onTouchMove);
    this.container.removeEventListener("touchend", this._onTouchEnd);

    if (document.pointerLockElement === this.container) document.exitPointerLock();

    for (const obj of this.objects) {
      try {
        this.scene.remove(obj);
        if (obj.isMesh || obj.isPoints) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material?.dispose();
        } else if (obj.isGroup) {
          obj.traverse(child => {
            if (child.isMesh || child.isPoints) {
              child.geometry?.dispose();
              if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
              else child.material?.dispose();
            }
          });
        }
      } catch {}
    }
    this.renderer.dispose();
    this.composer = null;
  }
}
