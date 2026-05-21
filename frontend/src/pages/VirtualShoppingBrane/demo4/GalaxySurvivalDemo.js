import * as THREE from "three";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

function rng(min, max) { return min + Math.random() * (max - min); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

const SKY_TOP = "#05051a";
const SKY_MID = "#0d2b5e";
const SKY_BOT = "#4a3a2a";

export default class GalaxySurvivalDemo {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};

    // State sent to React
    this.state = {
      mode: "player", health: 100, stamina: 100, oxygen: 100,
      nearShip: false, distToShip: 0, shipSpeed: 0, canExit: false,
      camMode: "third",
      renderOk: true, cameraOk: true, lightsOk: true,
    };

    // Keyboard
    this.keys = {};
    this._eWasDown = false;
    this._cWasDown = false;

    // Three.js
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sun = null;
    this.terrain = null;
    this.shipGroup = null;
    this.shipPos = new THREE.Vector3(0, 0, 0);
    this.hoverGlow = null;
    this.hoverLight = null;
    this.objects = [];
    this.composer = null;
    this.bloomPass = null;
    this.particles = null;

    // Player
    this.yaw = 0.2;
    this.pitch = -0.05;
    this.playerHeight = 1.7;
    this.playerPos = new THREE.Vector3(0, 1.7, 5);
    this.playerVel = new THREE.Vector3(0, 0, 0);
    this.onGround = false;

    // Ship
    this.mode = "player";
    this.shipYaw = 0.5;
    this.shipSpeed = 0;
    this.shipTargetAlt = 3;
    this.shipAltitude = 0;

    // Camera modes
    this.camMode = "third";
    this.camDistance = 10;
    this.camHeight = 5;
    this.thirdCamPos = new THREE.Vector3(0, 5, 10);

    // Physics
    this.gravity = -22;
    this.jumpSpeed = 6;
    this.walkSpeed = 4;
    this.sprintSpeed = 7;

    // Survival
    this.health = 100;
    this.stamina = 100;
    this.oxygen = 100;

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
      this._buildCity();
      this._buildShip();
      this._buildCockpitInterior();
      this._setupPlayer();
      this._setupInput();
      this._setupParticles();
      if (this.composer) {
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(this.bloomPass);
      }
      this._startLoop();

      // Safety checks
      this.state.renderOk = !!this.renderer && !!this.scene;
      this.state.cameraOk = !!this.camera;
      this.state.lightsOk = !!this.sun;
      this.debugInfo = [
        `Render OK`,
        `Camera OK`,
        `Lights OK`,
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
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x05051a, 1);
    this.container.appendChild(this.renderer.domElement);

    this.composer = new EffectComposer(this.renderer);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.15, 0.3, 0.05);

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
    g.addColorStop(0.3, SKY_MID);
    g.addColorStop(0.6, "#1a3a4a");
    g.addColorStop(0.85, "#3a4a3a");
    g.addColorStop(1, SKY_BOT);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 256);
    this.scene.background = new THREE.CanvasTexture(c);
    this.scene.backgroundIntensity = 0.8;
    this.scene.fog = new THREE.FogExp2(new THREE.Color(0x3a4a3a), 0.006);
  }

  // ═══════════════════════════════════════════════════════
  // LIGHTS
  // ═══════════════════════════════════════════════════════
  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0x334466, 0.4));
    this.scene.add(new THREE.HemisphereLight(0x4488ff, 0x553322, 0.5));
    this.sun = new THREE.DirectionalLight(0xffcc88, 2.2);
    this.sun.position.set(20, 30, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
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
    const fill = new THREE.DirectionalLight(0x6688ff, 0.3);
    fill.position.set(-10, 15, -10);
    this.scene.add(fill);
  }

  // ═══════════════════════════════════════════════════════
  // TERRAIN
  // ═══════════════════════════════════════════════════════
  _terrainHeight(x, z) {
    return (
      Math.sin(x * 0.03 + 1.3) * Math.cos(z * 0.035 + 0.7) * 0.8
      + Math.sin(x * 0.07 + z * 0.06 + 3.0) * 0.35
      + Math.sin(x * 0.12 + z * 0.15 + 2.0) * 0.15
      + Math.cos(x * 0.02 + z * 0.025) * 0.2
    );
  }

  _buildTerrain() {
    const segs = 80, size = 60;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = this._terrainHeight(x, z);
      pos.setY(i, h);
      const nearPad = Math.abs(x + 3) < 3 && Math.abs(z + 2) < 3;
      const nearRd = Math.abs(x) < 3 && z < 4 && z > -14;
      const n = h * 0.3 + 0.5;
      if (nearPad) {
        colors[i * 3] = 0.25 + Math.random() * 0.04;
        colors[i * 3 + 1] = 0.24 + Math.random() * 0.04;
        colors[i * 3 + 2] = 0.20 + Math.random() * 0.04;
      } else if (nearRd) {
        colors[i * 3] = 0.22 + Math.random() * 0.04;
        colors[i * 3 + 1] = 0.20 + Math.random() * 0.04;
        colors[i * 3 + 2] = 0.18 + Math.random() * 0.04;
      } else if (h > 0.3) {
        colors[i * 3] = 0.10 + Math.random() * 0.06;
        colors[i * 3 + 1] = clamp(0.35 + n * 0.3, 0.15, 0.55);
        colors[i * 3 + 2] = 0.05 + Math.random() * 0.04;
      } else if (h < -0.3) {
        colors[i * 3] = 0.06 + Math.random() * 0.04;
        colors[i * 3 + 1] = clamp(0.15 + n * 0.3, 0.1, 0.35);
        colors[i * 3 + 2] = 0.03 + Math.random() * 0.03;
      } else {
        colors[i * 3] = 0.08 + Math.random() * 0.05;
        colors[i * 3 + 1] = clamp(0.2 + n * 0.25, 0.12, 0.45);
        colors[i * 3 + 2] = 0.04 + Math.random() * 0.04;
      }
    }
    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    this.terrain = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.85, metalness: 0, clearcoat: 0.02,
    }));
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
    this.objects.push(this.terrain);
  }

  // ═══════════════════════════════════════════════════════
  // CITY
  // ═══════════════════════════════════════════════════════
  _buildCity() {
    // Shared materials (PBR)
    const roadMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a3a, roughness: 0.95, metalness: 0.05, clearcoat: 0.05 });
    const wallMat = new THREE.MeshPhysicalMaterial({ color: 0x5a6a7a, roughness: 0.5, metalness: 0.4, clearcoat: 0.1 });
    const roofMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3a4a, roughness: 0.6, metalness: 0.3, clearcoat: 0.1 });
    const winMat = new THREE.MeshPhysicalMaterial({ color: 0xffcc44, emissive: 0xffaa22, emissiveIntensity: 0.3, transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0.9 });
    const doorMat = new THREE.MeshPhysicalMaterial({ color: 0x2a1a0a, roughness: 0.9, metalness: 0.3 });
    const houseWallMat = new THREE.MeshPhysicalMaterial({ color: 0x7a8a6a, roughness: 0.7, metalness: 0.1, clearcoat: 0.05 });
    const houseRoofMat = new THREE.MeshPhysicalMaterial({ color: 0x6a3a1a, roughness: 0.8, metalness: 0.1 });
    const trunkMat = new THREE.MeshPhysicalMaterial({ color: 0x4a3a2a, roughness: 0.9, metalness: 0 });
    const leafMat = new THREE.MeshPhysicalMaterial({ color: 0x1a5a2a, roughness: 0.85, metalness: 0, clearcoat: 0.1 });
    const poleMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a3a, roughness: 0.3, metalness: 0.8, clearcoat: 0.2 });
    const lampMat = new THREE.MeshPhysicalMaterial({ color: 0xaaccff, emissive: 0xaaccff, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.1 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.2, clearcoat: 0.5, ior: 1.5 });
    const detailMat = new THREE.MeshPhysicalMaterial({ color: 0x4a5a6a, roughness: 0.4, metalness: 0.6 });

    // Helper: road segment
    const addRoad = (x, z, w, h) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), roadMat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(x, this._terrainHeight(x, z) + 0.02, z);
      this.scene.add(s);
      this.objects.push(s);
    };

    // Helper: modern building
    const addBuilding = (x, z, w, ht, d, clr) => {
      const g = new THREE.Group();
      const gh = this._terrainHeight(x, z);
      const wallM = new THREE.MeshPhysicalMaterial({ color: clr || 0x5a6a7a, roughness: 0.4, metalness: 0.5, clearcoat: 0.15 });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), wallM);
      wall.position.y = ht / 2;
      wall.castShadow = true;
      g.add(wall);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.15, 0.08, d + 0.15), roofMat);
      roof.position.y = ht + 0.04;
      g.add(roof);
      // Rooftop AC unit
      const ac = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.15), detailMat);
      ac.position.set(w * 0.2, ht + 0.08, 0);
      g.add(ac);
      // Window grid
      for (let wy = 0.3; wy < ht - 0.2; wy += 0.5) {
        for (const wx of [-w * 0.28, -w * 0.08, w * 0.08, w * 0.28]) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.15), winMat);
          win.position.set(wx, wy, d / 2 + 0.01);
          g.add(win);
        }
      }
      // Glass panels on sides
      for (const wx of [-1, 1]) {
        const gp = new THREE.Mesh(new THREE.PlaneGeometry(0.01, ht * 0.6), glassMat);
        gp.position.set(wx * (w / 2 + 0.01), ht * 0.5, 0);
        g.add(gp);
      }
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.35), doorMat);
      door.position.set(0, 0.17, d / 2 + 0.01);
      g.add(door);
      g.position.set(x, gh, z);
      this.scene.add(g);
      this.objects.push(g);
    };

    // Helper: house with peaked roof
    const addHouse = (x, z, w, d, rot) => {
      const g = new THREE.Group();
      const gh = this._terrainHeight(x, z);
      const ht = 0.7;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), houseWallMat);
      wall.position.y = ht / 2;
      wall.castShadow = true;
      g.add(wall);
      // Peaked roof
      const roofShape = new THREE.Shape();
      roofShape.moveTo(-w * 0.7, 0);
      roofShape.lineTo(0, 0.4);
      roofShape.lineTo(w * 0.7, 0);
      roofShape.lineTo(-w * 0.7, 0);
      const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: d + 0.15, bevelEnabled: false });
      const roof = new THREE.Mesh(roofGeo, houseRoofMat);
      roof.position.set(0, ht, -d * 0.57);
      roof.castShadow = true;
      g.add(roof);
      // Roof trim
      const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.02, d + 0.1), roofMat);
      trim.position.y = ht + 0.01;
      g.add(trim);
      // Door
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.3), doorMat);
      door.position.set(0, 0.15, d / 2 + 0.01);
      g.add(door);
      // Warm windows
      for (const wx of [-w * 0.2, w * 0.2]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), winMat);
        win.position.set(wx, 0.38, d / 2 + 0.01);
        g.add(win);
      }
      g.position.set(x, gh, z);
      g.rotation.y = rot || 0;
      this.scene.add(g);
      this.objects.push(g);
    };

    // Helper: lamp post
    const addLamp = (x, z) => {
      const g = new THREE.Group();
      const h = this._terrainHeight(x, z);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.9, 6), poleMat);
      pole.position.y = 0.45;
      g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.01, 0.01), poleMat);
      arm.position.set(0.14, 0.85, 0);
      g.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), lampMat);
      bulb.position.set(0.26, 0.85, 0);
      g.add(bulb);
      const pl = new THREE.PointLight(0xaaccff, 0.15, 2);
      pl.position.set(0.26, 0.85, 0);
      g.add(pl);
      g.position.set(x, h, z);
      this.scene.add(g);
      this.objects.push(g);
    };

    // Helper: tree (multi-layer canopy)
    const addTree = (x, z, s) => {
      s = s || rng(0.8, 1.5);
      const h = this._terrainHeight(x, z);
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.025 * s, 0.05 * s, 0.7 * s, 5), trunkMat);
      trunk.position.y = 0.35 * s;
      g.add(trunk);
      for (let i = 0; i < 3; i++) {
        const ls = 0.2 * s - i * 0.04 * s;
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(ls, 7, 7), leafMat);
        leaf.position.set((i - 1) * 0.1 * s, 0.7 * s + i * 0.1 * s, 0);
        leaf.castShadow = true;
        g.add(leaf);
      }
      g.position.set(x, h, z);
      this.scene.add(g);
      this.objects.push(g);
    };

    // ── ROAD NETWORK ──
    // Main avenue (along Z)
    for (let z = 8; z >= -14; z -= 1) {
      addRoad(0, z, 4, 1);
    }
    // Cross streets
    for (let z = 3; z >= -7; z -= 5) {
      for (let x = -12; x <= 14; x += 1) {
        addRoad(x, z, 1, 1);
      }
    }
    // Residential streets
    for (let z = 5; z >= -5; z -= 2) {
      for (let x = -15; x <= -5; x += 1) {
        addRoad(x, z, 1, 1.8);
      }
    }

    // ── CITY CENTER (east of avenue) ──
    const centerDefs = [
      { x: 5, z: 1, w: 2.5, ht: 3.0, d: 2.5 },
      { x: 7.5, z: -3, w: 2.0, ht: 3.5, d: 2.0 },
      { x: 10, z: 0, w: 2.2, ht: 2.5, d: 2.2 },
      { x: 12, z: -4, w: 2.5, ht: 3.2, d: 2.5 },
      { x: 8, z: -6, w: 1.8, ht: 2.0, d: 1.8 },
      { x: 13, z: 2, w: 2.0, ht: 2.8, d: 2.0 },
      { x: 10.5, z: -2, w: 1.6, ht: 2.2, d: 1.6 },
    ];
    for (const d of centerDefs) {
      addBuilding(d.x, d.z, d.w, d.ht, d.d, Math.floor(rng(-0x111111, 0x222222)));
    }

    // ── RESIDENTIAL (west, away from port) ──
    const housePositions = [
      [-12, 4], [-10, 3.5], [-8, 4.5], [-13, 1],
      [-11, 0], [-9, 0.5], [-7, 1], [-12, -3],
      [-10, -2.5], [-8, -3.5], [-14, -2], [-9, -5],
      [-6, -4], [-11, -5.5], [-7, -6], [-13, -5],
    ];
    for (const [hx, hz] of housePositions) {
      if (Math.abs(hx + 3) > 3 || Math.abs(hz - 2) > 3) {
        addHouse(hx, hz, 0.6, 0.6, rng(-0.2, 0.2));
      }
    }

    // ── LAMP POSTS along main avenue ──
    for (const z of [6, 4, 2, 0, -2, -4, -6, -8, -10, -12]) {
      addLamp(-1.6, z);
      addLamp(1.6, z);
    }

    // ── FOREST (edges) ──
    for (let i = 0; i < 35; i++) {
      let x, z, ok = false;
      for (let t = 0; t < 30; t++) {
        x = rng(-23, 23);
        z = rng(-23, 23);
        // Keep away from city center
        if (x > 3 && z > -8 && z < 4) continue;
        if (x < -3 && z > -8 && z < 6) continue;
        if (Math.abs(x) < 3 && z < 10 && z > -14) continue;
        // Keep away from landing port
        if (Math.abs(x + 3) < 4 && Math.abs(z - 2) < 4) continue;
        ok = true;
        break;
      }
      if (ok) addTree(x, z);
    }

    // ── LANDING PORT plaza ──
    // Flat area around ship
    const portMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3a4a, roughness: 0.7, metalness: 0.2, clearcoat: 0.1 });
    for (let x = -5; x <= -1; x += 1) {
      for (let z = 0; z <= 4; z += 1) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), portMat);
        p.rotation.x = -Math.PI / 2;
        p.position.set(x, this._terrainHeight(x, z) + 0.015, z);
        this.scene.add(p);
        this.objects.push(p);
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // SHIP
  // ═══════════════════════════════════════════════════════
  _buildShip() {
    const g = new THREE.Group();
    const shipH = this._terrainHeight(-3, 2);

    const dk = { color: 0x1a1a2e, roughness: 0.2, metalness: 0.9, clearcoat: 0.3, clearcoatRoughness: 0.2 };
    const lt = { color: 0x2a2a4a, roughness: 0.3, metalness: 0.85, clearcoat: 0.1 };
    const cp = new THREE.MeshPhysicalMaterial({ color: 0x0a0a2a, roughness: 0.05, metalness: 0.95, transparent: true, opacity: 0.3, clearcoat: 0.5, ior: 1.5 });
    const gl = new THREE.MeshPhysicalMaterial({ color: 0x0044aa, emissive: 0x00aaff, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.5, clearcoat: 0.2 });
    const en = new THREE.MeshPhysicalMaterial({ color: 0x222244, emissive: 0x4488ff, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.8 });
    const neonMat = new THREE.MeshPhysicalMaterial({ color: 0x00ddff, emissive: 0x00ddff, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.1 });

    const m = (o) => new THREE.MeshPhysicalMaterial(o);

    // Fuselage
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.2, 12), m(dk));
    body.rotation.x = Math.PI / 2; body.position.y = 0.6; body.castShadow = true;
    g.add(body);

    // Fuselage panel lines
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65 + i * 0.05, 0.005, 6, 12),
        new THREE.MeshPhysicalMaterial({ color: 0x334466, roughness: 0.2, metalness: 0.9 }));
      ring.position.set(0, 0.6, -0.6 + i * 0.6);
      ring.rotation.x = Math.PI / 2;
      g.add(ring);
    }

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.5, 12), m(dk));
    nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0.6, -1.3);
    g.add(nose);

    // Nose neon ring
    const nr = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.015, 6, 12), neonMat);
    nr.position.set(0, 0.6, -1.5);
    nr.rotation.x = Math.PI / 2;
    g.add(nr);

    // Cockpit
    const cw = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), cp);
    cw.position.set(0, 0.8, -0.9); cw.scale.set(1, 0.6, 0.5);
    g.add(cw);
    const cg = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 8, 16), gl);
    cg.position.set(0, 0.8, -0.9); cg.rotation.x = 0.3;
    g.add(cg);

    // Wings
    for (const side of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.9), m(lt));
      w.position.set(side * 0.8, 0.45, 0.4); w.rotation.z = side * 0.15; w.castShadow = true;
      g.add(w);
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshPhysicalMaterial({ color: side === -1 ? 0xff4422 : 0x22ff44, emissive: side === -1 ? 0xff2200 : 0x00ff44, emissiveIntensity: 0.4 }));
      t.position.set(side * 0.82, 0.45, 0.4);
      g.add(t);
      // Wing neon strip
      const ns = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.005, 0.6), neonMat);
      ns.position.set(side * 0.82, 0.28, 0.4);
      g.add(ns);
    }

    // Engines
    for (const side of [-1, 1]) {
      const n = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.4, 8), m(dk));
      n.position.set(side * 0.45, 0.35, 1.2); n.rotation.x = 0.2;
      g.add(n);
      const e = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.01, 0.15, 8), en);
      e.position.set(side * 0.45, 0.3, 1.4);
      g.add(e);
    }
    const ce = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.35, 8), m(dk));
    ce.position.set(0, 0.4, 1.3); ce.rotation.x = 0.2;
    g.add(ce);
    const cg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.02, 0.15, 8),
      new THREE.MeshPhysicalMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.5 }));
    cg2.position.set(0, 0.35, 1.5);
    g.add(cg2);

    // Struts
    for (const [sx, sz] of [[-0.5, -0.6], [0.5, -0.6], [-0.5, 0.8], [0.5, 0.8]]) {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 4), m(dk));
      st.position.set(sx, 0.12, sz);
      g.add(st);
      const ft = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), m(dk));
      ft.position.set(sx, 0.02, sz);
      g.add(ft);
    }

    // Hull detail
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.04),
        new THREE.MeshPhysicalMaterial({ color: 0x222240, roughness: 0.5, metalness: 0.8 }));
      const a = (i / 6) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.65, 0.5 + Math.sin(i) * 0.1, Math.sin(a) * 0.65);
      p.lookAt(new THREE.Vector3(0, 0.5, 0));
      g.add(p);
    }

    // Hover glow
    this.hoverGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.05, 16),
      new THREE.MeshPhysicalMaterial({ color: 0x0044ff, emissive: 0x0088ff, emissiveIntensity: 0.4, transparent: true, opacity: 0.4, roughness: 0.1 }));
    this.hoverGlow.position.y = 0.02;
    g.add(this.hoverGlow);

    this.hoverLight = new THREE.PointLight(0x4488ff, 0.5, 8);
    this.hoverLight.position.y = 0.1;
    g.add(this.hoverLight);

    const sl = new THREE.PointLight(0x4488ff, 0.6, 6);
    sl.position.set(0, 1.2, -0.5);
    g.add(sl);

    this.shipPos.set(-3, shipH, 2);
    g.position.copy(this.shipPos);
    g.rotation.y = this.shipYaw;
    this.scene.add(g);
    this.objects.push(g);
    this.shipGroup = g;

    // Landing pad
    const mm = new THREE.MeshPhysicalMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.15, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const m2 = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.18, 16), mm);
      m2.rotation.x = -Math.PI / 2;
      m2.position.set(-3 + Math.cos(a) * 1.2, shipH + 0.01, 2 + Math.sin(a) * 1.2);
      this.scene.add(m2);
      this.objects.push(m2);
    }
  }

  // ═══════════════════════════════════════════════════════
  // COCKPIT INTERIOR
  // ═══════════════════════════════════════════════════════
  _buildCockpitInterior() {
    const g = this.shipGroup;

    const dk = { color: 0x0e0e1a, roughness: 0.3, metalness: 0.9, clearcoat: 0.2 };
    const neonMat = { color: 0x00ddff, emissive: 0x00ddff, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.2 };
    const holo = new THREE.MeshPhysicalMaterial({
      color: 0x0066ff, emissive: 0x0088ff, emissiveIntensity: 0.4,
      transparent: true, opacity: 0.2, side: THREE.DoubleSide, roughness: 0.1, metalness: 0.1,
    });
    const scr = new THREE.MeshPhysicalMaterial({
      color: 0x002244, emissive: 0x0044aa, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.5,
    });

    const m = (o) => new THREE.MeshPhysicalMaterial(o);

    // Main dashboard panel
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.08), m(dk));
    dash.position.set(0, -0.1, -0.82);
    g.add(dash);

    // Dashboard slope
    const slope = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.12), m(dk));
    slope.position.set(0, -0.06, -0.88);
    slope.rotation.x = 0.25;
    g.add(slope);

    // Holographic display (center)
    const holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), holo);
    holoScreen.position.set(0, -0.02, -0.87);
    this._holoScreen = holoScreen;
    g.add(holoScreen);

    // Holo border
    const hb = new THREE.Line(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.24, 0.16)),
      new THREE.LineBasicMaterial({ color: 0x00ddff, transparent: true, opacity: 0.3 })
    );
    hb.position.copy(holoScreen.position);
    hb.position.z += 0.001;
    g.add(hb);

    // Radar circular display (left)
    const radarRing = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.06, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
    radarRing.position.set(-0.14, -0.02, -0.85);
    this._radarRing = radarRing;
    g.add(radarRing);

    const radarDot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x00ff88 }));
    radarDot.position.set(-0.14, -0.02, -0.85);
    this._radarDot = radarDot;
    g.add(radarDot);

    // Small screen (right side)
    const rScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.06), scr);
    rScreen.position.set(0.16, -0.02, -0.85);
    g.add(rScreen);

    // Left side panel
    const lp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), m(dk));
    lp.position.set(-0.32, 0.02, -0.72);
    g.add(lp);

    // Right side panel
    const rp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), m(dk));
    rp.position.set(0.32, 0.02, -0.72);
    g.add(rp);

    // Neon strips on side panels
    for (const sx of [-0.35, 0.35]) {
      const ns = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.15, 0.01), m(neonMat));
      ns.position.set(sx, 0.02, -0.72);
      g.add(ns);
    }

    // Control stick
    const stickMat = m({ color: 0x1a1a2e, roughness: 0.5, metalness: 0.7 });
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.15, 6), stickMat);
    stick.position.set(0, -0.2, -0.65);
    g.add(stick);

    const grip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), stickMat);
    grip.position.set(0, -0.12, -0.65);
    g.add(grip);

    // Buttons on left panel
    const btnColors = [0x00ff44, 0xffaa00, 0xff3344];
    for (let i = 0; i < 3; i++) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6),
        new THREE.MeshBasicMaterial({ color: btnColors[i] }));
      btn.position.set(-0.32, 0.06 + i * 0.04, -0.68);
      g.add(btn);
    }

    // Buttons on right panel
    for (let i = 0; i < 2; i++) {
      const btn = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x4488ff }));
      btn.position.set(0.32, 0.06 + i * 0.04, -0.68);
      g.add(btn);
    }

    // Dashboard neon accent
    const dna = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.005, 0.01), m(neonMat));
    dna.position.set(0, -0.07, -0.86);
    g.add(dna);

    // Windshield frame top
    const frameMat = m(dk);
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.025), frameMat);
    topFrame.position.set(0, 0.25, -0.72);
    g.add(topFrame);

    // Canopy side pillars
    for (const sx of [-0.32, 0.32]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), frameMat);
      pillar.position.set(sx, 0.15, -0.72);
      g.add(pillar);
    }
  }

  // ═══════════════════════════════════════════════════════
  // PARTICLES
  // ═══════════════════════════════════════════════════════
  _setupParticles() {
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = rng(-28, 28);
      positions[i * 3 + 1] = rng(0.2, 6);
      positions[i * 3 + 2] = rng(-28, 28);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x88aadd, transparent: true, opacity: 0.08, size: 0.04,
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
    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    this.camera.position.copy(this.playerPos);
    this.camera.lookAt(0, 0, -1);
  }

  // ═══════════════════════════════════════════════════════
  // INPUT
  // ═══════════════════════════════════════════════════════
  _setupInput() {
    this._onKeyDown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if ([' ', 'control', 'e', 'c'].includes(e.key.toLowerCase())) e.preventDefault();
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

    if (this.mode === "player") {
      this._updatePlayer(dt);
      this._updateSurvival(dt);
    } else {
      this._updateShip(dt);
    }

    this._animateParticles(dt);
    this._updateState();
  }

  // ═══════════════════════════════════════════════════════
  // INPUT HANDLER
  // ═══════════════════════════════════════════════════════
  _handleInput(_dt) {
    // E key edge detection
    if (this.keys['e'] && !this._eWasDown) {
      this._eWasDown = true;

      if (this.mode === "ship") {
        if (this.shipAltitude < 2) {
          this._exitShip();
        }
      } else {
        const dx = this.shipPos.x - this.playerPos.x;
        const dz = this.shipPos.z - this.playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 5) {
          this._enterShip();
        }
      }
    }
    if (!this.keys['e']) this._eWasDown = false;

    // C key to toggle camera mode (only in ship)
    if (this.mode === "ship" && this.keys['c'] && !this._cWasDown) {
      this._cWasDown = true;
      this.camMode = this.camMode === "third" ? "cockpit" : "third";
      this.state.camMode = this.camMode;
    }
    if (!this.keys['c']) this._cWasDown = false;
  }

  // ═══════════════════════════════════════════════════════
  // PLAYER MODE
  // ═══════════════════════════════════════════════════════
  _updatePlayer(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    const spr = this.keys['shift'] && this.stamina > 0 && this.onGround;
    const speed = spr ? this.sprintSpeed : this.walkSpeed;

    // Build move direction
    const mx = ((this.keys['w'] ? 1 : 0) + (this.keys['s'] ? -1 : 0)) * forward.x
             + ((this.keys['d'] ? 1 : 0) + (this.keys['a'] ? -1 : 0)) * right.x;
    const mz = ((this.keys['w'] ? 1 : 0) + (this.keys['s'] ? -1 : 0)) * forward.z
             + ((this.keys['d'] ? 1 : 0) + (this.keys['a'] ? -1 : 0)) * right.z;

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0.01) {
      this.playerVel.x = (mx / len) * speed;
      this.playerVel.z = (mz / len) * speed;
    } else {
      this.playerVel.x *= 0.88;
      this.playerVel.z *= 0.88;
    }

    // Gravity
    this.playerVel.y += this.gravity * dt;

    // Jump
    if (this.keys[' '] && this.onGround) {
      this.playerVel.y = this.jumpSpeed;
      this.onGround = false;
    }

    // Apply
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;
    this.playerPos.z += this.playerVel.z * dt;
    this.playerPos.x = clamp(this.playerPos.x, -23, 23);
    this.playerPos.z = clamp(this.playerPos.z, -23, 23);

    // Ground
    const gy = this._terrainHeight(this.playerPos.x, this.playerPos.z);
    if (this.playerPos.y <= gy + this.playerHeight) {
      this.playerPos.y = gy + this.playerHeight;
      this.playerVel.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Camera safety check
    if (isNaN(this.playerPos.x) || isNaN(this.playerPos.y) || isNaN(this.playerPos.z)) {
      this.playerPos.set(0, this.playerHeight, 5);
    }

    // Camera
    this.camera.position.copy(this.playerPos);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

    // Stamina
    if (spr) {
      this.stamina = Math.max(0, this.stamina - 20 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 12 * dt);
    }

    // Debug
    this.debugInfo = [
      `Mode: PLAYER`,
      `Render OK | Camera OK | Lights OK`,
      `Pos: ${this.playerPos.x.toFixed(1)}, ${this.playerPos.y.toFixed(1)}, ${this.playerPos.z.toFixed(1)}`,
      `Vel: ${this.playerVel.x.toFixed(1)}, ${this.playerVel.y.toFixed(1)}, ${this.playerVel.z.toFixed(1)}`,
      `Keys: ${Object.entries(this.keys).filter(([,v]) => v).map(([k]) => k).join(' ') || 'none'}`,
      `Ship dist: ${Math.sqrt((this.shipPos.x - this.playerPos.x)**2 + (this.shipPos.z - this.playerPos.z)**2).toFixed(1)}`,
    ];
  }

  // ═══════════════════════════════════════════════════════
  // SURVIVAL
  // ═══════════════════════════════════════════════════════
  _updateSurvival(dt) {
    const dx = this.shipPos.x - this.playerPos.x;
    const dz = this.shipPos.z - this.playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    this.state.nearShip = dist < 4;
    this.state.distToShip = Math.round(dist);

    if (dist < 4) {
      this.oxygen = Math.min(100, this.oxygen + 20 * dt);
    } else {
      this.oxygen = Math.max(0, this.oxygen - 3 * dt);
    }
    if (this.oxygen <= 0) {
      this.health = Math.max(0, this.health - 5 * dt);
    }
  }

  // ═══════════════════════════════════════════════════════
  // ENTER / EXIT SHIP
  // ═══════════════════════════════════════════════════════
  _enterShip() {
    this.mode = "ship";
    this.shipYaw = this.yaw;
    this.shipSpeed = 0;
    this.shipTargetAlt = 3;
    this.oxygen = Math.min(100, this.oxygen + 30);
    this.camMode = "third";
    // Initialize third person camera position
    const behind = new THREE.Vector3(-Math.sin(this.shipYaw), 0, -Math.cos(this.shipYaw));
    this.thirdCamPos.set(
      this.shipPos.x - behind.x * this.camDistance,
      this.shipPos.y + this.camHeight,
      this.shipPos.z - behind.z * this.camDistance
    );
    this.debugInfo = [`Mode: SHIP`, `Entered ship`];
  }

  _exitShip() {
    this.mode = "player";
    const eh = this._terrainHeight(this.shipPos.x, this.shipPos.z);
    this.playerPos.set(this.shipPos.x + 2, eh + this.playerHeight, this.shipPos.z + 2);
    this.playerVel.set(0, 0, 0);
    this.yaw = this.shipYaw;
    this.debugInfo = [`Mode: PLAYER`, `Exited ship`];
  }

  // ═══════════════════════════════════════════════════════
  // SHIP MODE
  // ═══════════════════════════════════════════════════════
  _updateShip(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.shipYaw), 0, -Math.cos(this.shipYaw));

    // Turn
    const tr = 1.5;
    if (this.keys['a']) this.shipYaw += tr * dt;
    if (this.keys['d']) this.shipYaw -= tr * dt;

    // Thrust
    const boost = this.keys['shift'] ? 2.5 : 1.0;
    if (this.keys['w']) {
      this.shipSpeed = Math.min(30, this.shipSpeed + 18 * dt * boost);
    } else if (this.keys['s']) {
      this.shipSpeed = Math.max(-10, this.shipSpeed - 22 * dt);
    } else {
      this.shipSpeed *= 0.96;
      if (Math.abs(this.shipSpeed) < 0.05) this.shipSpeed = 0;
    }

    // Altitude
    if (this.keys[' ']) this.shipTargetAlt = Math.min(30, this.shipTargetAlt + 4 * dt);
    if (this.keys['control']) this.shipTargetAlt = Math.max(2, this.shipTargetAlt - 4 * dt);

    // Move
    this.shipPos.x += forward.x * this.shipSpeed * dt;
    this.shipPos.z += forward.z * this.shipSpeed * dt;
    this.shipPos.x = clamp(this.shipPos.x, -23, 23);
    this.shipPos.z = clamp(this.shipPos.z, -23, 23);

    // Altitude
    const gh = this._terrainHeight(this.shipPos.x, this.shipPos.z);
    this.shipAltitude += (this.shipTargetAlt - this.shipAltitude) * 2.5 * dt;
    this.shipPos.y = gh + this.shipAltitude;

    // Ship yaw from mouse look
    const yawDelta = this.yaw - this.shipYaw;
    const normYaw = ((yawDelta + Math.PI) % (Math.PI * 2)) - Math.PI;
    this.shipYaw += normYaw * 4 * dt;
    this.yaw = this.shipYaw;

    // Ship mesh
    this.shipGroup.position.copy(this.shipPos);
    this.shipGroup.rotation.y = this.shipYaw;

    // Camera based on mode
    if (this.camMode === "third") {
      const behind = new THREE.Vector3(-Math.sin(this.shipYaw), 0, -Math.cos(this.shipYaw));
      const targetPos = new THREE.Vector3(
        this.shipPos.x - behind.x * this.camDistance,
        this.shipPos.y + this.camHeight,
        this.shipPos.z - behind.z * this.camDistance
      );
      this.thirdCamPos.lerp(targetPos, Math.min(1, 4 * dt));
      this.camera.position.copy(this.thirdCamPos);
      this.camera.lookAt(this.shipPos.x, this.shipPos.y + 1, this.shipPos.z);
    } else {
      // Cockpit fallback safety
      try {
        const ck = new THREE.Vector3(0, 0.7, -0.5);
        ck.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.shipYaw);
        this.camera.position.copy(this.shipPos).add(ck);
        const cp = this.pitch + Math.sin(Date.now() * 0.003) * 0.01;
        this.camera.quaternion.setFromEuler(new THREE.Euler(cp, this.shipYaw, 0, 'YXZ'));
      } catch (e) {
        // Fallback to third person if cockpit fails
        console.warn("[GS] Cockpit camera failed, switching to third person");
        this.camMode = "third";
        this.state.camMode = "third";
        const behind = new THREE.Vector3(-Math.sin(this.shipYaw), 0, -Math.cos(this.shipYaw));
        this.thirdCamPos.set(
          this.shipPos.x - behind.x * this.camDistance,
          this.shipPos.y + this.camHeight,
          this.shipPos.z - behind.z * this.camDistance
        );
        this.camera.position.copy(this.thirdCamPos);
        this.camera.lookAt(this.shipPos.x, this.shipPos.y + 1, this.shipPos.z);
      }
    }

    // Glow effects
    const hi = 0.3 + Math.min(this.shipSpeed / 15, 0.7);
    this.hoverGlow.material.emissiveIntensity = hi;
    this.hoverGlow.material.opacity = 0.2 + hi * 0.4;
    this.hoverLight.intensity = 0.2 + hi * 0.6;

    const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
    this.shipGroup.children.forEach(child => {
      try {
        if (child.isMesh && child.material && child.material.emissive && child.geometry) {
          if (child.geometry.type === 'CylinderGeometry' && child.position.z > 1.2) {
            child.material.emissiveIntensity = pulse;
          }
        }
      } catch {}
    });

    // State
    this.state.canExit = this.shipAltitude < 2;
    this.state.shipSpeed = Math.round(this.shipSpeed);

    // Debug
    this.debugInfo = [
      `Mode: SHIP [${this.camMode}]`,
      `Render OK | Camera OK | Lights OK`,
      `Speed: ${this.shipSpeed.toFixed(1)}`,
      `Alt: ${this.shipAltitude.toFixed(1)}m`,
      `Keys: ${Object.entries(this.keys).filter(([,v]) => v).map(([k]) => k).join(' ') || 'none'}`,
      `Can exit: ${this.state.canExit}`,
      `C: swap camera | E: exit`,
    ];
  }

  // ═══════════════════════════════════════════════════════
  // STATE → REACT
  // ═══════════════════════════════════════════════════════
  _updateState() {
    this.state.mode = this.mode;
    this.state.health = Math.round(this.health);
    this.state.stamina = Math.round(this.stamina);
    this.state.oxygen = Math.round(this.oxygen);
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
