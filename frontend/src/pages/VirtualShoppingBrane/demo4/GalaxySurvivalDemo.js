import * as THREE from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

function rng(min, max) { return min + Math.random() * (max - min); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

const SKY_TOP = "#020210";
const SKY_MID = "#081838";
const SKY_BOT = "#2a2a1a";

export default class GalaxySurvivalDemo {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};

    // State sent to React
    this.state = {
      mode: "player", stamina: 100,
      renderOk: true, cameraOk: true,
    };

    // Keyboard
    this.keys = {};
    

    // Three.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sun = null;
    this.terrain = null;
    this.objects = [];
    this.composer = null;
    this.bloomPass = null;
    this.particles = null;
    this.buildings = [];

    // Crouch
    this.crouching = false;
    this.eyeHeight = 1.6;
    this.standHeight = 1.6;
    this.crouchHeight = 0.8;
    this.playerWidth = 0.4;

    // Player
    this.yaw = 0.2;
    this.pitch = -0.05;
    this.playerHeight = 1.7;
    this.playerPos = new THREE.Vector3(0, 1.7, 5);
    this.playerVel = new THREE.Vector3(0, 0, 0);
    this.onGround = false;


    // Physics
    this.gravity = -22;
    this.jumpSpeed = 6;
    this.walkSpeed = 4;
    this.sprintSpeed = 7;

    // Stamina
    this.stamina = 100;

    // Loop
    this.running = false;
    this.clock = new THREE.Clock();
    this._boundLoop = null;

    // Debug
    this.debugInfo = [];
  }

  init() {
    try {
      this._setupRenderer();
      this._setupScene();
      this._setupLights();
      this._buildTerrain();
      this._buildSkylineBackdrop();
      this._buildPersistentRoads();
      this._buildInitialNeighborhood();
      this._setupPlayer();
      this._buildHumanBody();
      this._setupInput();
      this._setupParticles();
      if (this.composer) {
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(this.bloomPass);
      }
      this._startLoop();

      this.state.renderOk = !!this.renderer && !!this.scene;
      this.state.cameraOk = !!this.camera;
      this.debugInfo = [
        `Render OK`,
        `Camera OK`,
      ];
      return true;
    } catch (e) {
      console.error("[GS] Init error:", e);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════
  // RENDERER
  // ═══════════════════════════════════════════════════════
  _setupRenderer() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.bias = 0.0005;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x05051a, 1);
    this.container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.15, 0.5, 0.02);

    this._onResize = () => {
      const cw = this.container.clientWidth;
      const ch = this.container.clientHeight;
      if (this.camera) {
        this.camera.aspect = cw / ch;
        this.camera.updateProjectionMatrix();
      }
      if (this.renderer) this.renderer.setSize(cw, ch);
      if (this.composer) this.composer.setSize(cw, ch);
    };
    window.addEventListener("resize", this._onResize);
  }

  // ═══════════════════════════════════════════════════════
  // SCENE
  // ═══════════════════════════════════════════════════════
  _setupScene() {
    this.scene = new THREE.Scene();
    const c = document.createElement("canvas");
    c.width = 1; c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(0.35, SKY_MID);
    g.addColorStop(0.6, "#0a2a3a");
    g.addColorStop(0.8, "#1a2a2a");
    g.addColorStop(1, SKY_BOT);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 256);
    this.scene.background = new THREE.CanvasTexture(c);
    this.scene.backgroundIntensity = 0.8;
    this.scene.fog = new THREE.FogExp2(new THREE.Color(0x1a2020), 0.005);
  }

  // ═══════════════════════════════════════════════════════
  // LIGHTS
  // ═══════════════════════════════════════════════════════
  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0x334466, 0.4));
    this.scene.add(new THREE.HemisphereLight(0x4488ff, 0x553322, 0.5));
    this.sun = new THREE.DirectionalLight(0xffcc77, 3.0);
    this.sun.position.set(30, 40, 20);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.bias = -0.001;
    this.sun.shadow.normalBias = 0.02;
    const sc = this.sun.shadow.camera;
    sc.near = 1; sc.far = 60;
    sc.left = -30; sc.right = 30;
    sc.top = 30; sc.bottom = -30;
    this.scene.add(this.sun);
    // Warm rim light
    const rim = new THREE.DirectionalLight(0xff8844, 0.5);
    rim.position.set(-15, 5, -20);
    this.scene.add(rim);
    // Cool fill
    const fill = new THREE.DirectionalLight(0x6688ff, 0.4);
    fill.position.set(-15, 20, -15);
    this.scene.add(fill);
  }

  // ═══════════════════════════════════════════════════════
  // TERRAIN
  // ═══════════════════════════════════════════════════════
  _terrainHeight(x, z) {
    return (
      Math.sin(x * 0.018 + z * 0.022 + 0.5) * 1.4
      + Math.sin(x * 0.045 + 1.7) * Math.cos(z * 0.05 + 2.3) * 0.7
      + Math.sin(x * 0.09 + z * 0.08 + 1.0) * 0.35
      + Math.cos(x * 0.025 + z * 0.03) * 0.25
    );
  }

  _buildTerrain() {
    this._chunkTerrainMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.9, metalness: 0,
      clearcoat: 0.03, clearcoatRoughness: 0.8,
    });
  }

  // ═══════════════════════════════════════════════════════
  // CITY — CHUNK-BASED OPEN WORLD
  // ═══════════════════════════════════════════════════════
  _buildSkylineBackdrop() {
    // ── LAYER 3: Horizon skyline (outer ring, fake, no shadows) ──
    const skyMat = new THREE.MeshPhysicalMaterial({
      color: 0x2a2a3a, roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide, clearcoat: 0.05,
    });
    const roofMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a2a, roughness: 0.6, metalness: 0.3, side: THREE.DoubleSide,
    });
    const winMat = new THREE.MeshPhysicalMaterial({
      color: 0xffcc44, emissive: 0xffaa22, emissiveIntensity: 0.15,
      transparent: true, opacity: 0.08, side: THREE.DoubleSide,
    });
    // Inner ring (radius 42) — mid-distance skyline
    const innerCount = 32;
    for (let i = 0; i < innerCount; i++) {
      const a = (i / innerCount) * Math.PI * 2;
      const h = 4 + Math.sin(i * 1.7 + 0.5) * 4 + Math.cos(i * 3.1) * 2;
      const w = 3 + Math.sin(i * 2.3) * 2;
      const d = 2;
      const rOff = Math.sin(i * 0.7) * 6;
      const x = Math.cos(a) * (42 + rOff);
      const z = Math.sin(a) * (42 + rOff);
      const y = this._terrainHeight(x, z);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skyMat);
      b.position.set(x, y + h / 2, z);
      b.castShadow = false;
      b.receiveShadow = false;
      this.scene.add(b); this.objects.push(b);
      // Lite windows
      for (let wy = 1; wy < h - 0.5; wy += 3) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.3), winMat);
        win.position.set(x, y + wy, z + d / 2 + 0.1);
        this.scene.add(win); this.objects.push(win);
      }
    }
    // Outer ring (radius 65) — far horizon skyscrapers
    const outerCount = 40;
    const outerMat = new THREE.MeshPhysicalMaterial({
      color: 0x22223a, roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide,
    });
    for (let i = 0; i < outerCount; i++) {
      const a = (i / outerCount) * Math.PI * 2;
      const h = 8 + Math.sin(i * 1.3 + 2.0) * 6 + Math.cos(i * 2.7) * 4;
      const w = 4 + Math.sin(i * 1.9) * 2;
      const d = 3;
      const rOff = Math.cos(i * 0.5) * 8;
      const x = Math.cos(a) * (65 + rOff);
      const z = Math.sin(a) * (65 + rOff);
      const y = this._terrainHeight(x, z);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), outerMat);
      b.position.set(x, y + h / 2, z);
      b.castShadow = false;
      b.receiveShadow = false;
      this.scene.add(b); this.objects.push(b);
      // Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.1, d + 0.3), roofMat);
      roof.position.set(x, y + h, z);
      this.scene.add(roof); this.objects.push(roof);
    }
    // ── LAYER 2: Mid-distance city ring (simplified blocks, always visible) ──
    const midMat = new THREE.MeshPhysicalMaterial({
      color: 0x3a3a4a, roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide,
    });
    const midCount = 50;
    for (let i = 0; i < midCount; i++) {
      const a = (i / midCount) * Math.PI * 2;
      const h = 3 + Math.sin(i * 3.1) * 3 + Math.cos(i * 1.7) * 2;
      const w = 2 + Math.sin(i * 2.1) * 1.5;
      const d = 2 + Math.cos(i * 1.3) * 1;
      const rOff = Math.sin(i * 0.6) * 5;
      const x = Math.cos(a) * (32 + rOff);
      const z = Math.sin(a) * (32 + rOff);
      const y = this._terrainHeight(x, z);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), midMat);
      b.position.set(x, y + h / 2, z);
      b.castShadow = false;
      b.receiveShadow = false;
      this.scene.add(b); this.objects.push(b);
    }
  }

  _buildPersistentRoads() {
    // Main avenue (x=0) extending far for visibility
    const roadMat = new THREE.MeshPhysicalMaterial({ color: 0x1e1e2a, roughness: 0.95, metalness: 0.02 });
    const highMat = new THREE.MeshPhysicalMaterial({ color: 0x22222e, roughness: 0.95, metalness: 0.02 });
    // North-south avenue (from -55 to 55)
    for (let z = -55; z <= 55; z += 1) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), roadMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, this._terrainHeight(0, z) + 0.02, z);
      this.scene.add(s); this.objects.push(s);
    }
    // East-west highway (from -55 to 55)
    for (let x = -55; x <= 55; x += 1) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 6), highMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(x, this._terrainHeight(x, 0) + 0.02, 0);
      this.scene.add(s); this.objects.push(s);
    }
  }





















  // ═══════════════════════════════════════════════════════
  // SHIP
  // ═══════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════
  // COCKPIT INTERIOR
  // ═══════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════
  // HUMAN BODY (simple FPS body visible looking down)
  // ═══════════════════════════════════════════════════════
  _buildHumanBody() {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x3a5a7a, roughness: 0.7, metalness: 0.1,
    });
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0xddbb99, roughness: 0.8, metalness: 0,
    });
    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.5, 8), bodyMat);
    torso.position.y = 0.8;
    torso.castShadow = true;
    g.add(torso);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), skinMat);
    head.position.set(0, 1.2, 0.05);
    head.castShadow = true;
    g.add(head);
    // Arms
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.5, 6), bodyMat);
      arm.position.set(side * 0.35, 0.75, 0);
      arm.rotation.z = side * 0.2;
      g.add(arm);
    }
    // Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.6, 6), new THREE.MeshPhysicalMaterial({
        color: 0x2a3a4a, roughness: 0.8, metalness: 0,
      }));
      leg.position.set(side * 0.12, 0.3, 0);
      g.add(leg);
    }
    this.humanBody = g;
    this.scene.add(g);
    this.objects.push(g);
  }

  // ═══════════════════════════════════════════════════════
  // INITIAL NEIGHBORHOOD — human scale, pre-built
  // ═══════════════════════════════════════════════════════
  _buildInitialNeighborhood() {
    // Shared materials
    const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xd4c4a8, roughness: 0.8, metalness: 0 });
    const roofMat = new THREE.MeshPhysicalMaterial({ color: 0x8a3a1a, roughness: 0.9, metalness: 0 });
    const doorMat = new THREE.MeshPhysicalMaterial({ color: 0x4a2a1a, roughness: 0.9, metalness: 0.1 });
    const winMat = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.3 });
    const frameMat = new THREE.MeshPhysicalMaterial({ color: 0x3a2a1a, roughness: 0.7, metalness: 0.1 });
    const sidewalkMat = new THREE.MeshPhysicalMaterial({ color: 0x8a8a8a, roughness: 0.95, metalness: 0 });
    const roadMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3a3a, roughness: 0.95, metalness: 0 });
    const treeTrunkMat = new THREE.MeshPhysicalMaterial({ color: 0x5a3a1a, roughness: 0.9, metalness: 0 });
    const treeLeafMat = new THREE.MeshPhysicalMaterial({ color: 0x2a7a2a, roughness: 0.9, metalness: 0 });

    const terrainFn = (x, z) => this._terrainHeight(x, z);

    // Helper: build a house at (x, z) with rotation
    const addHouse = (hx, hz, rot) => {
      const w = 6, d = 5, wallH = 2.8, roofH = 1.5;
      const gh = terrainFn(hx, hz);
      const g = new THREE.Group();
      // Walls
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
      wall.position.y = wallH / 2;
      wall.castShadow = true;
      wall.receiveShadow = true;
      g.add(wall);
      // Peaked roof
      const shape = new THREE.Shape();
      shape.moveTo(-w * 0.55, 0);
      shape.lineTo(0, roofH);
      shape.lineTo(w * 0.55, 0);
      shape.lineTo(-w * 0.55, 0);
      const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: d + 0.2, bevelEnabled: false });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, wallH, -d * 0.6);
      roof.castShadow = true;
      g.add(roof);
      // Door (front)
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), doorMat);
      door.position.set(0, 1.0, d / 2 + 0.01);
      g.add(door);
      // Door frame
      const df = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.05), frameMat);
      df.position.set(0, 1.05, d / 2 + 0.03);
      g.add(df);
      // Windows
      for (const wx of [-1.5, 1.5]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), winMat);
        win.position.set(wx, 1.8, d / 2 + 0.01);
        g.add(win);
        const wf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.05), frameMat);
        wf.position.set(wx, 1.8, d / 2 + 0.03);
        g.add(wf);
      }
      // Side windows
      for (const wz of [-1.2, 1.2]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), winMat);
        win.position.set(w / 2 + 0.01, 1.8, wz);
        win.rotation.y = Math.PI / 2;
        g.add(win);
      }
      g.position.set(hx, gh, hz);
      if (rot) g.rotation.y = rot;
      this.scene.add(g);
      this.objects.push(g);
      // Collision box
      this.buildings.push({
        minX: hx - w / 2, maxX: hx + w / 2,
        minZ: hz - d / 2, maxZ: hz + d / 2,
        minY: gh, maxY: gh + wallH + roofH,
      });
      return g;
    };

    // Helper: add tree
    const addTree = (tx, tz, scale) => {
      const gh = terrainFn(tx, tz);
      const g = new THREE.Group();
      const trunkH = 2.5 * scale;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.15 * scale, trunkH, 6), treeTrunkMat);
      trunk.position.y = trunkH / 2;
      g.add(trunk);
      const canopyY = trunkH;
      const r = 1.0 * scale;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 7), treeLeafMat);
      leaf.position.set(0, canopyY + r * 0.5, 0);
      leaf.scale.y = 0.7;
      leaf.castShadow = true;
      g.add(leaf);
      g.position.set(tx, gh, tz);
      this.scene.add(g);
      this.objects.push(g);
    };

    // Helper: add lamp post
    const addLamp = (lx, lz) => {
      const gh = terrainFn(lx, lz);
      const g = new THREE.Group();
      const poleMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a3a, roughness: 0.3, metalness: 0.8 });
      const lampMat = new THREE.MeshPhysicalMaterial({ color: 0xddddff, emissive: 0xddddff, emissiveIntensity: 0.3, roughness: 0.1 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 4.0, 8), poleMat);
      pole.position.y = 2.0;
      g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.04), poleMat);
      arm.position.set(0.45, 3.8, 0);
      g.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), lampMat);
      bulb.position.set(0.85, 3.8, 0);
      g.add(bulb);
      g.position.set(lx, gh, lz);
      this.scene.add(g);
      this.objects.push(g);
    };

    // ── STREET LAYOUT ──
    // Two parallel streets at z = -15 and z = 15
    // Houses face the streets (inward)
    // Cross street at x = 0
    
    // Street 1 (south): z = -15, runs from x = -90 to 90
    for (let x = -90; x <= 90; x += 1) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 8), roadMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(x, terrainFn(x, -15) + 0.03, -15);
      this.scene.add(s); this.objects.push(s);
    }
    // Sidewalks
    for (let x = -90; x <= 90; x += 2) {
      for (const zOff of [-1, -11]) {
        const sw = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sidewalkMat);
        sw.rotation.x = -Math.PI / 2;
        sw.position.set(x + 1, terrainFn(x + 1, -15 + zOff) + 0.02, -15 + zOff);
        this.scene.add(sw); this.objects.push(sw);
      }
    }

    // Street 2 (north): z = 15, runs from x = -90 to 90
    for (let x = -90; x <= 90; x += 1) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 8), roadMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(x, terrainFn(x, 15) + 0.03, 15);
      this.scene.add(s); this.objects.push(s);
    }
    for (let x = -90; x <= 90; x += 2) {
      for (const zOff of [1, 11]) {
        const sw = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sidewalkMat);
        sw.rotation.x = -Math.PI / 2;
        sw.position.set(x + 1, terrainFn(x + 1, 15 + zOff) + 0.02, 15 + zOff);
        this.scene.add(sw); this.objects.push(sw);
      }
    }

    // Cross street at x = 0
    for (let z = -30; z <= 30; z += 1) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), roadMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, terrainFn(0, z) + 0.03, z);
      this.scene.add(s); this.objects.push(s);
    }

    // ── HOUSES ──
    // South side of Street 1 (facing north): z = -19, x from -80 to 80
    for (let hx = -80; hx <= 80; hx += 12) {
      addHouse(hx, -19, 0);
    }
    // North side of Street 1 (facing south): z = -11
    for (let hx = -80; hx <= 80; hx += 12) {
      addHouse(hx, -11, Math.PI);
    }
    // South side of Street 2 (facing north): z = 11
    for (let hx = -80; hx <= 80; hx += 12) {
      addHouse(hx, 11, 0);
    }
    // North side of Street 2 (facing south): z = 19
    for (let hx = -80; hx <= 80; hx += 12) {
      addHouse(hx, 19, Math.PI);
    }

    // ── TREES along streets ──
    for (let tx = -85; tx <= 85; tx += 20) {
      addTree(tx, -23, 1.0);
      addTree(tx, -7, 1.0);
      addTree(tx, 7, 1.0);
      addTree(tx, 23, 1.0);
    }

    // ── LAMP POSTS along streets ──
    for (let lx = -80; lx <= 80; lx += 30) {
      addLamp(lx, -18.5);
      addLamp(lx, -11.5);
      addLamp(lx, 11.5);
      addLamp(lx, 18.5);
    }

    // ── COMMERCIAL BUILDING (corner) ──
    const comMat = new THREE.MeshPhysicalMaterial({ color: 0x6a7a8a, roughness: 0.5, metalness: 0.3 });
    const comGlass = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.2 });
    for (const [cx, cz] of [[30, -25], [-30, 25], [30, 25]]) {
      const gh = terrainFn(cx, cz);
      const h = 5;
      const com = new THREE.Mesh(new THREE.BoxGeometry(5, h, 5), comMat);
      com.position.set(cx, gh + h / 2, cz);
      com.castShadow = true;
      this.scene.add(com); this.objects.push(com);
      // Glass front
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(4, h - 0.5), comGlass);
      glass.position.set(cx, gh + h / 2, cz + 2.51);
      this.scene.add(glass); this.objects.push(glass);
      this.buildings.push({
        minX: cx - 2.5, maxX: cx + 2.5,
        minZ: cz - 2.5, maxZ: cz + 2.5,
        minY: gh, maxY: gh + h,
      });
    }
  }
  // ═══════════════════════════════════════════════════════
  // PARTICLES
  // ═══════════════════════════════════════════════════════
  _setupParticles() {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = rng(-30, 30);
      positions[i * 3 + 1] = rng(0.1, 8);
      positions[i * 3 + 2] = rng(-30, 30);
      sizes[i] = rng(0.02, 0.08);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    const mat = new THREE.PointsMaterial({
      color: 0xaaccee, transparent: true, opacity: 0.06, size: 0.05,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
    this.objects.push(this.particles);
  }

  _animateParticles(dt) {
    if (!this.particles) return;
    this.particles.rotation.y += dt * 0.008;
    const pos = this.particles.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.array[i * 3 + 1] += Math.sin(Date.now() * 0.0005 + i * 0.1) * 0.0008;
    }
    pos.needsUpdate = true;
  }

  // ═══════════════════════════════════════════════════════
  // PLAYER
  // ═══════════════════════════════════════════════════════
  _setupPlayer() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 100);
    this.camera.position.set(this.playerPos.x, this.playerPos.y + this.eyeHeight, this.playerPos.z);
    this.playerHeight = this.standHeight;
    this.camera.lookAt(0, this.eyeHeight, -1);
  }

  // ═══════════════════════════════════════════════════════
  // INPUT
  // ═══════════════════════════════════════════════════════
  _setupInput() {
    this._onKeyDown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if ([' ', 'control'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    this._onKeyUp = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    this._onMouseMove = (e) => {
      if (document.pointerLockElement !== this.container) return;
      this.yaw -= e.movementX * 0.002;
      this.pitch -= e.movementY * 0.002;
      this.pitch = clamp(this.pitch, -Math.PI / 2.5, Math.PI / 2.5);
    };
    document.addEventListener("mousemove", this._onMouseMove);

    this._onPointerLockChange = () => {
      this.container.style.cursor =
        document.pointerLockElement === this.container ? 'default' : 'pointer';
    };
    document.addEventListener("pointerlockchange", this._onPointerLockChange);

    this._onClick = () => {
      if (document.pointerLockElement !== this.container) {
        this.container.requestPointerLock();
        this.renderer.domElement.focus();
      }
    };
    this.container.addEventListener("click", this._onClick);
    this.container.setAttribute("tabindex", "0");
    this.container.focus();
  }

  // ═══════════════════════════════════════════════════════
  // LOOP
  // ═══════════════════════════════════════════════════════
  _startLoop() {
    this.running = true;
    this.clock.start();
    this._boundLoop = () => {
      if (!this.running) return;
      requestAnimationFrame(this._boundLoop);
      try {
        const dt = Math.min(this.clock.getDelta(), 0.05);
        this._update(dt);
        if (this.composer) {
          this.composer.render();
        } else {
          this.renderer.render(this.scene, this.camera);
        }
      } catch (e) {
        console.error("[GS] Loop error:", e);
        try {
          if (this.camera && !isNaN(this.camera.position.x)) {
            this.camera.position.set(0, 5, 10);
            this.camera.lookAt(0, 0, 0);
          }
          if (this.renderer && this.scene) {
            this.renderer.render(this.scene, this.camera);
          }
        } catch {}
      }
    };
    this._boundLoop();
  }

  _update(dt) {
    this._handleInput(dt);
    this._updatePlayer(dt);
    this._updateStamina(dt);
    this._animateParticles(dt);
    this._updateState();
  }

  // ═══════════════════════════════════════════════════════
  // INPUT HANDLER
  // ═══════════════════════════════════════════════════════
  _handleInput(_dt) {
    // Crouch
    this.crouching = !!this.keys['control'];
    this.playerHeight = this.crouching ? this.crouchHeight : this.standHeight;
  }

  // ═══════════════════════════════════════════════════════
  // PLAYER MODE
  // ═══════════════════════════════════════════════════════
  _updatePlayer(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    const sprint = this.keys['shift'] && this.stamina > 0 && this.onGround;
    const speed = sprint ? 6.0 : 3.0;
    if (this.crouching) speed * 0.5;

    // Build move direction
    let mx = ((this.keys['w'] ? 1 : 0) + (this.keys['s'] ? -1 : 0)) * forward.x
             + ((this.keys['d'] ? 1 : 0) + (this.keys['a'] ? -1 : 0)) * right.x;
    let mz = ((this.keys['w'] ? 1 : 0) + (this.keys['s'] ? -1 : 0)) * forward.z
             + ((this.keys['d'] ? 1 : 0) + (this.keys['a'] ? -1 : 0)) * right.z;

    const len = Math.sqrt(mx * mx + mz * mz);
    const spd = this.crouching ? speed * 0.5 : speed;
    if (len > 0.01) {
      this.playerVel.x = (mx / len) * spd;
      this.playerVel.z = (mz / len) * spd;
    } else {
      this.playerVel.x *= 0.88;
      this.playerVel.z *= 0.88;
    }

    // Gravity
    this.playerVel.y += this.gravity * dt;

    // Jump
    if (this.keys[' '] && this.onGround && !this.crouching) {
      this.playerVel.y = 5.0;
      this.onGround = false;
    }

    // Apply horizontal with collision
    const newX = this.playerPos.x + this.playerVel.x * dt;
    const newZ = this.playerPos.z + this.playerVel.z * dt;
    if (!this._checkCollision(newX, this.playerPos.z)) this.playerPos.x = newX;
    if (!this._checkCollision(this.playerPos.x, newZ)) this.playerPos.z = newZ;
    this.playerPos.y += this.playerVel.y * dt;

    // Ground
    const gy = this._terrainHeight(this.playerPos.x, this.playerPos.z);
    if (this.playerPos.y <= gy + this.playerHeight) {
      this.playerPos.y = gy + this.playerHeight;
      this.playerVel.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Safety
    if (isNaN(this.playerPos.x) || isNaN(this.playerPos.y) || isNaN(this.playerPos.z)) {
      this.playerPos.set(0, this.eyeHeight, 0);
    }

    // Camera
    const bobAmount = (this.onGround && len > 0.1 && !this.crouching) ? Math.sin(Date.now() * 0.015) * 0.015 : 0;
    this.camera.position.set(this.playerPos.x, this.playerPos.y + this.eyeHeight + bobAmount, this.playerPos.z);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch + bobAmount * 0.3, this.yaw, 0, 'YXZ'));

    // Human body follows
    if (this.humanBody) {
      this.humanBody.position.copy(this.playerPos);
      this.humanBody.position.y = this.playerPos.y;
      this.humanBody.rotation.y = this.yaw;
    }

    // Stamina
    if (sprint) {
      this.stamina = Math.max(0, this.stamina - 20 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 12 * dt);
    }

    // Debug
    this.debugInfo = [
      `FPS mode | Eye: ${(this.playerPos.y + this.eyeHeight).toFixed(1)}m`,
      `Pos: ${this.playerPos.x.toFixed(1)}, ${this.playerPos.y.toFixed(1)}, ${this.playerPos.z.toFixed(1)}`,
      `Vel: ${this.playerVel.x.toFixed(1)}, ${this.playerVel.y.toFixed(1)}, ${this.playerVel.z.toFixed(1)}`,
      `Crouch: ${this.crouching ? "YES" : "NO"} | Sprint: ${sprint ? "YES" : "NO"}`,
    ];
  }

  _updateStamina(dt) {
    // Simple stamina regen
    if (this.keys['shift'] && this.onGround) {
      this.stamina = Math.max(0, this.stamina - 15 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 10 * dt);
    }
  }

  _checkCollision(x, z) {
    const r = this.playerWidth;
    const feet = this.playerPos.y;
    const head = this.playerPos.y + this.playerHeight;
    for (const b of this.buildings) {
      if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ && head > b.minY && feet < b.maxY) {
        return true;
      }
    }
    return false;
  }  // ═══════════════════════════════════════════════════════
  // SURVIVAL
  // ═══════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════
  // ENTER / EXIT SHIP
  // ═══════════════════════════════════════════════════════


  // ═══════════════════════════════════════════════════════
  // SHIP MODE
  // ═══════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════
  // STATE → REACT
  // ═══════════════════════════════════════════════════════
  _updateState() {
    this.state.mode = "player";
    this.state.stamina = Math.round(this.stamina);
    this.callbacks.onStateChange?.({ ...this.state, debug: this.debugInfo });
  }

  // ═══════════════════════════════════════════════════════
  // DISPOSE
  // ═══════════════════════════════════════════════════════
  dispose() {
    this.running = false;
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    this.container.removeEventListener("click", this._onClick);
    window.removeEventListener("resize", this._onResize);

    if (document.pointerLockElement === this.container) {
      document.exitPointerLock();
    }

    for (const obj of this.objects) {
      try {
        this.scene.remove(obj);
        if (obj.isMesh || obj.isPoints) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material?.dispose();
          }
        } else if (obj.isGroup) {
          obj.traverse(child => {
            if (child.isMesh || child.isPoints) {
              child.geometry?.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material?.dispose();
              }
            }
          });
        }
      } catch {}
    }

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
