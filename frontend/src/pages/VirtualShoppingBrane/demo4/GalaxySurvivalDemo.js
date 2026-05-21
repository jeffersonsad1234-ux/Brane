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

    // Chunk system
    this.chunks = new Map();
    this.chunkSize = 20;
    this.chunkLoadRange = 25;
    this.chunkUnloadRange = 35;
    this.chunkFrameCounter = 0;
    this._chunkRoadMat = null;
    this._chunkSidewalkMat = null;

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
      this._buildSkylineBackdrop();
      this._initChunkManager();
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
    // Fake distant skyline — low-poly ring of buildings at horizon
    // Creates illusion of large city without geometry cost
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
    const radius = 42;
    const count = 24;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const h = 5 + Math.sin(i * 1.7 + 0.5) * 4 + Math.cos(i * 3.1) * 2;
      const w = 4 + Math.sin(i * 2.3) * 2;
      const d = 3;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const y = this._terrainHeight(x, z);
      const g = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skyMat);
      wall.position.y = h / 2;
      wall.castShadow = false;
      wall.receiveShadow = false;
      g.add(wall);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.08, d + 0.2), roofMat);
      roof.position.y = h;
      g.add(roof);
      // A few lit windows
      for (let wy = 1; wy < h - 0.5; wy += 2) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), winMat);
        win.position.set(0, wy, d / 2 + 0.01);
        g.add(win);
      }
      g.position.set(x, y, z);
      // Face inward
      g.lookAt(0, y + h / 2, 0);
      this.scene.add(g);
      this.objects.push(g);
    }
  }

  _initChunkManager() {
    this.chunks = new Map();
    this.chunkSize = 20;
    this.chunkLoadRange = 30;
    this.chunkUnloadRange = 45;
    this.chunkFrameCounter = 0;
    // Shared materials
    this._chunkRoadMat = new THREE.MeshPhysicalMaterial({ color: 0x1e1e2a, roughness: 0.95, metalness: 0.02 });
    this._chunkSidewalkMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3a44, roughness: 0.9, metalness: 0.05 });
    this._chunkHighwayMat = new THREE.MeshPhysicalMaterial({ color: 0x22222e, roughness: 0.95, metalness: 0.02 });
    this._chunkLaneMat = new THREE.MeshBasicMaterial({ color: 0xccddff, transparent: true, opacity: 0.15 });
    this._chunkTreeTrunkMat = new THREE.MeshPhysicalMaterial({ color: 0x4a3a2a, roughness: 0.9, metalness: 0 });
    this._chunkTreeLeafMat = new THREE.MeshPhysicalMaterial({ color: 0x1a5a2a, roughness: 0.85, metalness: 0, clearcoat: 0.1 });
    this._chunkWallMat = new THREE.MeshPhysicalMaterial({ color: 0x4a5a6a, roughness: 0.35, metalness: 0.6, clearcoat: 0.2 });
    this._chunkRoofMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3a4a, roughness: 0.6, metalness: 0.3 });
    this._chunkWinMat = new THREE.MeshPhysicalMaterial({ color: 0xffdd55, emissive: 0xffaa22, emissiveIntensity: 0.5, transparent: true, opacity: 0.4, roughness: 0.05, metalness: 0.95 });
    this._chunkDoorMat = new THREE.MeshPhysicalMaterial({ color: 0x2a1a0a, roughness: 0.9, metalness: 0.3 });
    this._chunkDetailMat = new THREE.MeshPhysicalMaterial({ color: 0x3a4a5a, roughness: 0.3, metalness: 0.7 });
    this._chunkHouseWallMat = new THREE.MeshPhysicalMaterial({ color: 0x7a8a6a, roughness: 0.7, metalness: 0.1, clearcoat: 0.05 });
    this._chunkHouseRoofMat = new THREE.MeshPhysicalMaterial({ color: 0x6a3a1a, roughness: 0.8, metalness: 0.1 });
    this._chunkPoleMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a3a, roughness: 0.3, metalness: 0.8, clearcoat: 0.2 });
    this._chunkLampMat = new THREE.MeshPhysicalMaterial({ color: 0xaaccff, emissive: 0xaaccff, emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.1 });
    this._chunkIndWallMat = new THREE.MeshPhysicalMaterial({ color: 0x5a5a5a, roughness: 0.7, metalness: 0.5, clearcoat: 0.1 });
    this._chunkIndRoofMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.4 });
    this._chunkGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x88ddff, roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.1, ior: 1.6 });

    // Build initial chunks
    const ref = this.mode === "player" ? this.playerPos : this.shipPos;
    const range = Math.ceil(this.chunkLoadRange / this.chunkSize);
    const refCx = Math.floor(ref.x / this.chunkSize);
    const refCz = Math.floor(ref.z / this.chunkSize);
    for (let dx = -range; dx <= range; dx++) {
      for (let dz = -range; dz <= range; dz++) {
        const cx = refCx + dx, cz = refCz + dz;
        const dist = Math.sqrt(dx * dx + dz * dz) * this.chunkSize;
        if (dist <= this.chunkLoadRange) this._buildChunk(cx, cz);
      }
    }
  }

  _chunkKey(cx, cz) { return cx + "," + cz; }

  _chunkRand(cx, cz, seed) {
    return Math.abs(Math.sin(cx * 12.9898 + cz * 78.233 + (seed || 0)) * 43758.5453) % 1;
  }

  _chunkZone(cx, cz) {
    const dist = Math.sqrt(cx * cx + cz * cz);
    const r = this._chunkRand(cx, cz, 999);
    // Center urban core (0,0 area)
    if (dist < 2.5) {
      if (cx === -1 && cz === 0) return "plaza";
      return "urban";
    }
    // Residential ring
    if (dist < 5) return "residential";
    // Industrial (east, mid distance)
    if (cx > 3 && cz > -3 && cz < 3 && dist < 8) return "industrial";
    // Space base (north-west)
    if (cz < -5 && cx > -3 && cx < 1 && dist < 10) return "spacebase";
    // Villages scattered in mid-distance
    if (dist > 5 && dist < 15 && r > 0.78) return "village";
    // Fields in mid-distance
    if (dist > 6 && dist < 20 && r > 0.45 && r < 0.55) return "fields";
    // Mountains in far distance
    if (dist > 15) return "mountains";
    // Default forest
    return "forest";
  }

  _buildChunk(cx, cz) {
    const key = this._chunkKey(cx, cz);
    if (this.chunks.has(key)) return;
    const zone = this._chunkZone(cx, cz);
    const elements = [];
    const bx = cx * this.chunkSize;
    const bz = cz * this.chunkSize;

    // 1. Terrain patch for this chunk
    this._buildChunkTerrain(cx, cz, bx, bz, elements);

    // 2. Roads
    this._buildChunkRoads(cx, cz, bx, bz, zone, elements);

    // 3. Zone content
    switch (zone) {
      case "urban": this._buildUrbanChunk(cx, cz, bx, bz, elements); break;
      case "plaza": this._buildPlazaChunk(cx, cz, bx, bz, elements); break;
      case "residential": this._buildResidentialChunk(cx, cz, bx, bz, elements); break;
      case "industrial": this._buildIndustrialChunk(cx, cz, bx, bz, elements); break;
      case "spacebase": this._buildSpaceBaseChunk(cx, cz, bx, bz, elements); break;
      case "village": this._buildVillageChunk(cx, cz, bx, bz, elements); break;
      case "fields": this._buildFieldsChunk(cx, cz, bx, bz, elements); break;
      case "mountains": this._buildMountainsChunk(cx, cz, bx, bz, elements); break;
      default: this._buildForestChunk(cx, cz, bx, bz, elements); break;
    }

    this.chunks.set(key, { zone, elements });
  }

  _buildChunkTerrain(cx, cz, bx, bz, elements) {
    const segs = 12;
    const size = this.chunkSize;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const centerX = bx + size / 2;
    const centerZ = bz + size / 2;

    for (let i = 0; i < pos.count; i++) {
      const wx = centerX + pos.getX(i);
      const wz = centerZ + pos.getZ(i);
      const h = this._terrainHeight(wx, wz);
      pos.setY(i, h);
      const n = h * 0.3 + 0.5;
      if (h > 0.5) {
        colors[i*3] = 0.08 + n * 0.08;
        colors[i*3+1] = 0.15 + n * 0.15;
        colors[i*3+2] = 0.04 + n * 0.03;
      } else if (h > 0.1) {
        colors[i*3] = 0.06 + n * 0.06;
        colors[i*3+1] = 0.25 + n * 0.25;
        colors[i*3+2] = 0.04 + n * 0.03;
      } else if (h < -0.2) {
        colors[i*3] = 0.04 + n * 0.04;
        colors[i*3+1] = 0.12 + n * 0.12;
        colors[i*3+2] = 0.02 + n * 0.02;
      } else {
        colors[i*3] = 0.05 + n * 0.05;
        colors[i*3+1] = 0.18 + n * 0.18;
        colors[i*3+2] = 0.03 + n * 0.03;
      }
    }
    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, this._chunkTerrainMat);
    mesh.position.set(centerX, 0, centerZ);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    elements.push(mesh);
  }

  _buildChunkRoads(cx, cz, bx, bz, zone, elements) {
    const isHighway = (cz >= -1 && cz <= 1);
    const hasAvenue = (cx >= -1 && cx <= 1);

    // Main east-west highway (along z=0)
    if (isHighway) {
      for (let x = bx; x < bx + this.chunkSize; x += 1) {
        if (Math.abs(x) > 50) continue;
        const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 6), this._chunkHighwayMat);
        s.rotation.x = -Math.PI / 2;
        s.position.set(x, this._terrainHeight(x, 0) + 0.02, 0);
        this.scene.add(s);
        elements.push(s);
      }
    }

    // North-south avenue (along x=0)
    if (hasAvenue) {
      for (let z = bz; z < bz + this.chunkSize; z += 1) {
        if (Math.abs(z) > 50) continue;
        const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), this._chunkRoadMat);
        s.rotation.x = -Math.PI / 2;
        s.position.set(0, this._terrainHeight(0, z) + 0.02, z);
        this.scene.add(s);
        elements.push(s);
      }
    }

    // Local streets for urban/residential
    if (zone === "urban" || zone === "residential") {
      const blockSize = zone === "urban" ? 8 : 10;
      for (let ox = blockSize; ox < this.chunkSize; ox += blockSize) {
        for (let oz = blockSize; oz < this.chunkSize; oz += blockSize) {
          const rx = bx + ox;
          const rz = bz + oz;
          if (Math.abs(rx) > 48 || Math.abs(rz) > 48) continue;
          const s = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._chunkRoadMat);
          s.rotation.x = -Math.PI / 2;
          s.position.set(rx, this._terrainHeight(rx, rz) + 0.02, rz);
          this.scene.add(s);
          elements.push(s);
        }
      }
    }

    // Industrial access roads
    if (zone === "industrial") {
      for (let x = bx + 5; x < bx + this.chunkSize; x += 10) {
        const z = bz + this.chunkSize / 2;
        if (Math.abs(x) > 48 || Math.abs(z) > 48) continue;
        const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 4), this._chunkRoadMat);
        s.rotation.x = -Math.PI / 2;
        s.position.set(x, this._terrainHeight(x, z) + 0.02, z);
        this.scene.add(s);
        elements.push(s);
      }
    }
  }

  _buildUrbanChunk(cx, cz, bx, bz, elements) {
    // City blocks with buildings along edges
    const blockSize = 8;
    const bm = this._chunkWallMat;
    const rm = this._chunkRoofMat;
    const wm = this._chunkWinMat;
    const dm = this._chunkDoorMat;
    const dt = this._chunkDetailMat;
    const gm = this._chunkGlassMat;

    for (let by = 0; by < this.chunkSize; by += blockSize) {
      for (let bz2 = 0; bz2 < this.chunkSize; bz2 += blockSize) {
        const cx2 = bx + by;
        const cz2 = bz + bz2;
        if (Math.abs(cx2) > 45 || Math.abs(cz2) > 45) continue;

        // Buildings along the SOUTH edge of this block
        const count = 1 + Math.floor(this._chunkRand(cx, cz, by + bz2 * 7 + 1) * 2);
        for (let i = 0; i < count; i++) {
          const bw = 1.5 + this._chunkRand(cx, cz, by + bz2 * 7 + i * 5 + 2) * 2;
          const bd = 1.5 + this._chunkRand(cx, cz, by + bz2 * 7 + i * 5 + 3) * 1.5;
          const ht = 4 + this._chunkRand(cx, cz, by + bz2 * 7 + i * 5 + 4) * 4;
          const offset = (i / count) * (blockSize - bw - 0.5) + bw / 2 + 0.25;
          const rx = cx2 + offset;
          const rz = cz2;
          const gh = this._terrainHeight(rx, rz);

          const g = new THREE.Group();
          const wall = new THREE.Mesh(new THREE.BoxGeometry(bw, ht, bd), bm);
          wall.position.y = ht / 2; wall.castShadow = true; g.add(wall);
          const roof = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.2, 0.08, bd + 0.2), rm);
          roof.position.y = ht + 0.04; g.add(roof);
          for (let wy = 0.4; wy < ht - 0.2; wy += 0.55) {
            const win = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.18), wm);
            win.position.set(0, wy, bd / 2 + 0.01); g.add(win);
          }
          const door = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.35), dm);
          door.position.set(0, 0.17, bd / 2 + 0.01); g.add(door);
          const ac = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.15), dt);
          ac.position.set(bw * 0.2, ht + 0.08, 0); g.add(ac);
          g.position.set(rx, gh, rz);
          this.scene.add(g); elements.push(g);

          // Sidewalk
          const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), this._chunkSidewalkMat);
          sw.rotation.x = -Math.PI / 2;
          sw.position.set(rx, gh + 0.02, rz + bd / 2 + 0.2);
          this.scene.add(sw); elements.push(sw);
        }
      }
    }

    // Lamp posts along avenue in this chunk
    if (cx >= -1 && cx <= 1) {
      for (let z = bz + 2; z < bz + this.chunkSize; z += 4) {
        if (Math.abs(z) > 45) continue;
        this._addChunkLamp(0, -2.0, z, elements);
        this._addChunkLamp(0, 2.0, z, elements);
      }
    }
    // Trees on side streets
    const treeCount = 2 + Math.floor(this._chunkRand(cx, cz, 50) * 2);
    for (let i = 0; i < treeCount; i++) {
      const tx = bx + this._chunkRand(cx, cz, i * 7 + 51) * this.chunkSize;
      const tz = bz + this._chunkRand(cx, cz, i * 7 + 52) * this.chunkSize;
      if (Math.abs(tx) > 45 || Math.abs(tz) > 45) continue;
      this._addChunkTree(tx, tz, 0.8 + this._chunkRand(cx, cz, i * 7 + 53) * 0.6, elements);
    }
  }

  _buildPlazaChunk(cx, cz, bx, bz, elements) {
    // Landing port plaza
    const portMat = new THREE.MeshPhysicalMaterial({ color: 0x3a3a4a, roughness: 0.7, metalness: 0.2, clearcoat: 0.1 });
    for (let x = -5; x <= -1; x += 1) {
      for (let z = 0; z <= 4; z += 1) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), portMat);
        p.rotation.x = -Math.PI / 2;
        p.position.set(x, this._terrainHeight(x, z) + 0.015, z);
        this.scene.add(p); elements.push(p);
      }
    }
    // Path from plaza to avenue
    for (let x = 0; x <= 1; x += 1) {
      for (let z = 1; z <= 3; z += 1) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), portMat);
        p.rotation.x = -Math.PI / 2;
        p.position.set(x, this._terrainHeight(x, z) + 0.015, z);
        this.scene.add(p); elements.push(p);
      }
    }
    // Trees around plaza
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.5;
      const tx = -3 + Math.cos(a) * 4.5;
      const tz = 2 + Math.sin(a) * 4.5;
      this._addChunkTree(tx, tz, 1.2, elements);
    }
    // Lamp posts at plaza
    this._addChunkLamp(-4.5, -0.5, 1, elements);
    this._addChunkLamp(-4.5, -0.5, 3, elements);
    this._addChunkLamp(-1.5, -0.5, 1, elements);
    this._addChunkLamp(-1.5, -0.5, 3, elements);
  }

  _buildResidentialChunk(cx, cz, bx, bz, elements) {
    const blockSize = 10;
    const hwm = this._chunkHouseWallMat;
    const hrm = this._chunkHouseRoofMat;
    const rm = this._chunkRoofMat;
    const wm = this._chunkWinMat;
    const dm = this._chunkDoorMat;

    for (let by = 0; by < this.chunkSize; by += blockSize) {
      for (let bz2 = 0; bz2 < this.chunkSize; bz2 += blockSize) {
        const rx = bx + by + 2;
        const rz = bz + bz2 + 2;
        if (Math.abs(rx) > 45 || Math.abs(rz) > 45) continue;
        const gh = this._terrainHeight(rx, rz);
        const ht = 0.7;
        const w = 0.6 + this._chunkRand(cx, cz, by + bz2 * 3 + 1) * 0.3;
        const d = 0.6 + this._chunkRand(cx, cz, by + bz2 * 3 + 2) * 0.3;
        const rot = this._chunkRand(cx, cz, by + bz2 * 3 + 3) * 0.2 - 0.1;

        const g = new THREE.Group();
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), hwm);
        wall.position.y = ht / 2; wall.castShadow = true; g.add(wall);
        const roofShape = new THREE.Shape();
        roofShape.moveTo(-w * 0.7, 0); roofShape.lineTo(0, 0.4);
        roofShape.lineTo(w * 0.7, 0); roofShape.lineTo(-w * 0.7, 0);
        const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: d + 0.15, bevelEnabled: false });
        const roof = new THREE.Mesh(roofGeo, hrm);
        roof.position.set(0, ht, -d * 0.57); roof.castShadow = true; g.add(roof);
        const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.02, d + 0.1), rm);
        trim.position.y = ht + 0.01; g.add(trim);
        const door = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.3), dm);
        door.position.set(0, 0.15, d / 2 + 0.01); g.add(door);
        for (const wx of [-w * 0.2, w * 0.2]) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), wm);
          win.position.set(wx, 0.38, d / 2 + 0.01); g.add(win);
        }
        const chim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.08), hrm);
        chim.position.set(-w * 0.15, ht + 0.08, -d * 0.15); g.add(chim);
        g.position.set(rx, gh, rz);
        g.rotation.y = rot;
        this.scene.add(g); elements.push(g);
      }
    }
    // Trees
    for (let i = 0; i < 2; i++) {
      const tx = bx + this._chunkRand(cx, cz, i * 7 + 100) * this.chunkSize;
      const tz = bz + this._chunkRand(cx, cz, i * 7 + 101) * this.chunkSize;
      if (Math.abs(tx) > 45 || Math.abs(tz) > 45) continue;
      this._addChunkTree(tx, tz, 1.0, elements);
    }
  }

  _buildIndustrialChunk(cx, cz, bx, bz, elements) {
    const count = 1 + Math.floor(this._chunkRand(cx, cz, 200) * 2);
    const iwm = this._chunkIndWallMat;
    const irm = this._chunkIndRoofMat;
    const dm = this._chunkDoorMat;

    for (let i = 0; i < count; i++) {
      const rx = bx + this._chunkRand(cx, cz, i * 7 + 201) * (this.chunkSize - 6) + 3;
      const rz = bz + this._chunkRand(cx, cz, i * 7 + 202) * (this.chunkSize - 6) + 3;
      if (Math.abs(rx) > 45 || Math.abs(rz) > 45) continue;
      const w = 3 + this._chunkRand(cx, cz, i * 7 + 203) * 2;
      const d = 2 + this._chunkRand(cx, cz, i * 7 + 204) * 2;
      const ht = 1.5 + this._chunkRand(cx, cz, i * 7 + 205) * 1;
      const gh = this._terrainHeight(rx, rz);

      const g = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), iwm);
      wall.position.y = ht / 2; wall.castShadow = true; g.add(wall);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.06, d + 0.2), irm);
      roof.position.y = ht + 0.03; g.add(roof);
      const bigDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), dm);
      bigDoor.position.set(0, 0.3, d / 2 + 0.01); g.add(bigDoor);
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.2), irm);
      vent.position.set(w * 0.2, ht + 0.06, 0); g.add(vent);
      g.position.set(rx, gh, rz);
      this.scene.add(g); elements.push(g);
    }
  }

  _buildSpaceBaseChunk(cx, cz, bx, bz, elements) {
    const iwm = this._chunkIndWallMat;
    const irm = this._chunkIndRoofMat;
    // Runway
    const runMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a3a, roughness: 0.8, metalness: 0.1 });
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(4, 14), runMat);
    runway.rotation.x = -Math.PI / 2;
    const cx2 = bx + this.chunkSize / 2;
    const cz2 = bz + this.chunkSize / 2;
    runway.position.set(cx2, this._terrainHeight(cx2, cz2) + 0.02, cz2);
    this.scene.add(runway); elements.push(runway);
    // Hangar
    const hangar = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 2.5), iwm);
    hangar.position.set(cx2 - 3, 0.75, cz2 + 3);
    hangar.castShadow = true;
    this.scene.add(hangar); elements.push(hangar);
    const hroof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 2.7), irm);
    hroof.position.set(cx2 - 3, 1.53, cz2 + 3);
    this.scene.add(hroof); elements.push(hroof);
    // Lamp posts on runway
    this._addChunkLamp(cx2 - 2.5, -0.5, cz2 + 6, elements);
    this._addChunkLamp(cx2 + 2.5, -0.5, cz2 + 6, elements);
    this._addChunkLamp(cx2 - 2.5, -0.5, cz2 - 6, elements);
    this._addChunkLamp(cx2 + 2.5, -0.5, cz2 - 6, elements);
  }

  _buildVillageChunk(cx, cz, bx, bz, elements) {
    const count = 2 + Math.floor(this._chunkRand(cx, cz, 300) * 2);
    const hwm = this._chunkHouseWallMat;
    const hrm = this._chunkHouseRoofMat;
    const wm = this._chunkWinMat;

    for (let i = 0; i < count; i++) {
      const rx = bx + this._chunkRand(cx, cz, i * 7 + 301) * (this.chunkSize - 4) + 2;
      const rz = bz + this._chunkRand(cx, cz, i * 7 + 302) * (this.chunkSize - 4) + 2;
      if (Math.abs(rx) > 48 || Math.abs(rz) > 48) continue;
      const gh = this._terrainHeight(rx, rz);
      const w = 0.5 + this._chunkRand(cx, cz, i * 7 + 303) * 0.3;
      const d = 0.5 + this._chunkRand(cx, cz, i * 7 + 304) * 0.3;
      const ht = 0.7;
      const g = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), hwm);
      wall.position.y = ht / 2; wall.castShadow = true; g.add(wall);
      const roofShape = new THREE.Shape();
      roofShape.moveTo(-w * 0.7, 0); roofShape.lineTo(0, 0.4);
      roofShape.lineTo(w * 0.7, 0); roofShape.lineTo(-w * 0.7, 0);
      const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: d + 0.15, bevelEnabled: false });
      const roof = new THREE.Mesh(roofGeo, hrm);
      roof.position.set(0, ht, -d * 0.57); roof.castShadow = true; g.add(roof);
      for (const wx of [-w * 0.2, w * 0.2]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), wm);
        win.position.set(wx, 0.38, d / 2 + 0.01); g.add(win);
      }
      g.position.set(rx, gh, rz);
      g.rotation.y = this._chunkRand(cx, cz, i * 7 + 305) * 0.3 - 0.15;
      this.scene.add(g); elements.push(g);
    }
    // Trees
    for (let i = 0; i < 3; i++) {
      const tx = bx + this._chunkRand(cx, cz, i * 5 + 310) * this.chunkSize;
      const tz = bz + this._chunkRand(cx, cz, i * 5 + 311) * this.chunkSize;
      if (Math.abs(tx) > 48 || Math.abs(tz) > 48) continue;
      this._addChunkTree(tx, tz, 0.8 + this._chunkRand(cx, cz, i * 5 + 312) * 0.6, elements);
    }
  }

  _buildFieldsChunk(cx, cz, bx, bz, elements) {
    // Just a few trees — terrain handles the visual
    const count = 1 + Math.floor(this._chunkRand(cx, cz, 400) * 3);
    for (let i = 0; i < count; i++) {
      const tx = bx + this._chunkRand(cx, cz, i * 3 + 401) * this.chunkSize;
      const tz = bz + this._chunkRand(cx, cz, i * 3 + 402) * this.chunkSize;
      if (Math.abs(tx) > 48 || Math.abs(tz) > 48) continue;
      this._addChunkTree(tx, tz, 0.6 + this._chunkRand(cx, cz, i * 3 + 403) * 0.6, elements);
    }
  }

  _buildMountainsChunk(cx, cz, bx, bz, elements) {
    // Sparse trees — terrain height creates mountain shapes naturally
    const count = Math.floor(this._chunkRand(cx, cz, 500) * 3);
    for (let i = 0; i < count; i++) {
      const tx = bx + this._chunkRand(cx, cz, i * 3 + 501) * this.chunkSize;
      const tz = bz + this._chunkRand(cx, cz, i * 3 + 502) * this.chunkSize;
      if (Math.abs(tx) > 48 || Math.abs(tz) > 48) continue;
      this._addChunkTree(tx, tz, 0.5 + this._chunkRand(cx, cz, i * 3 + 503) * 0.5, elements);
    }
  }

  _buildForestChunk(cx, cz, bx, bz, elements) {
    const count = 4 + Math.floor(this._chunkRand(cx, cz, 600) * 6);
    for (let i = 0; i < count; i++) {
      const tx = bx + this._chunkRand(cx, cz, i * 3 + 601) * this.chunkSize;
      const tz = bz + this._chunkRand(cx, cz, i * 3 + 602) * this.chunkSize;
      if (Math.abs(tx) > 48 || Math.abs(tz) > 48) continue;
      this._addChunkTree(tx, tz, 0.7 + this._chunkRand(cx, cz, i * 3 + 603) * 0.8, elements);
    }
  }

  _addChunkTree(tx, tz, s, elements) {
    const h = this._terrainHeight(tx, tz);
    const g = new THREE.Group();
    const trunkH = 0.8 * s;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.02 * s, 0.06 * s, trunkH, 6), this._chunkTreeTrunkMat);
    trunk.position.y = trunkH * 0.5; g.add(trunk);
    for (let i = 0; i < 5; i++) {
      const r = (0.1 + this._chunkRand(Math.floor(tx * 10), Math.floor(tz * 10), i) * 0.1) * s;
      const lx = (this._chunkRand(Math.floor(tx * 10), Math.floor(tz * 10), i + 10) * 0.3 - 0.15) * s;
      const lz = (this._chunkRand(Math.floor(tx * 10), Math.floor(tz * 10), i + 20) * 0.3 - 0.15) * s;
      const ly = trunkH + this._chunkRand(Math.floor(tx * 10), Math.floor(tz * 10), i + 30) * 0.2 * s;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 7), this._chunkTreeLeafMat);
      leaf.position.set(lx, ly, lz); leaf.castShadow = true; leaf.scale.y = 0.8; g.add(leaf);
    }
    g.position.set(tx, h, tz);
    g.rotation.y = this._chunkRand(Math.floor(tx * 10), Math.floor(tz * 10), 99) * Math.PI * 2;
    this.scene.add(g); elements.push(g);
  }

  _addChunkLamp(xOff, xOff2, zPos, elements) {
    const g = new THREE.Group();
    const ht = this._terrainHeight(xOff2, zPos);
    const poleH = 1.2;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, poleH, 8), this._chunkPoleMat);
    pole.position.y = poleH * 0.5; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.015, 0.015), this._chunkPoleMat);
    arm.position.set(0.18, poleH - 0.05, 0); g.add(arm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), this._chunkLampMat);
    bulb.position.set(0.32, poleH - 0.05, 0); g.add(bulb);
    const pl = new THREE.PointLight(0xaaccff, 0.25, 3);
    pl.position.set(0.32, poleH - 0.05, 0); g.add(pl);
    g.position.set(xOff2, ht, zPos);
    this.scene.add(g); elements.push(g);
  }

  _updateChunks() {
    this.chunkFrameCounter++;
    if (this.chunkFrameCounter % 15 !== 0) return;

    const refPos = this.mode === "player" ? this.playerPos : this.shipPos;
    const refCx = Math.floor(refPos.x / this.chunkSize);
    const refCz = Math.floor(refPos.z / this.chunkSize);
    const range = Math.ceil(this.chunkLoadRange / this.chunkSize);

    const needed = new Set();
    for (let dx = -range; dx <= range; dx++) {
      for (let dz = -range; dz <= range; dz++) {
        const cx = refCx + dx, cz = refCz + dz;
        const dist = Math.sqrt(dx * dx + dz * dz) * this.chunkSize;
        if (dist <= this.chunkLoadRange) needed.add(this._chunkKey(cx, cz));
      }
    }

    for (const [key] of this.chunks) {
      if (!needed.has(key)) this._disposeChunk(key);
    }
    for (const key of needed) {
      if (!this.chunks.has(key)) {
        const [cx, cz] = key.split(",").map(Number);
        this._buildChunk(cx, cz);
      }
    }
  }

  _disposeChunk(key) {
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    for (const obj of chunk.elements) {
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
    this.chunks.delete(key);
  }

  // ═══════════════════════════════════════════════════════
  // SHIP
  // ═══════════════════════════════════════════════════════
  _buildShip() {
    const g = new THREE.Group();
    const shipH = this._terrainHeight(-3, 2);

    const dk = { color: 0x12122a, roughness: 0.15, metalness: 0.95, clearcoat: 0.4, clearcoatRoughness: 0.15 };
    const lt = { color: 0x1e1e3e, roughness: 0.2, metalness: 0.9, clearcoat: 0.15 };
    const cp = new THREE.MeshPhysicalMaterial({ color: 0x0a0a2a, roughness: 0.02, metalness: 0.95, transparent: true, opacity: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.05, ior: 1.6, envMapIntensity: 2.0 });
    const gl = new THREE.MeshPhysicalMaterial({ color: 0x0044aa, emissive: 0x00aaff, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.5, clearcoat: 0.2 });
    const en = new THREE.MeshPhysicalMaterial({ color: 0x222244, emissive: 0x44aaff, emissiveIntensity: 1.5, roughness: 0.2, metalness: 0.8 });
    const neonMat = new THREE.MeshPhysicalMaterial({ color: 0x00eeff, emissive: 0x00eeff, emissiveIntensity: 1.5, roughness: 0.05, metalness: 0.0 });

    const m = (o) => new THREE.MeshPhysicalMaterial(o);

    // Fuselage
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.2, 20), m(dk));
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
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.5, 20), m(dk));
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
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10),
        new THREE.MeshPhysicalMaterial({ color: side === -1 ? 0xff4422 : 0x22ff44, emissive: side === -1 ? 0xff2200 : 0x00ff44, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.3 }));
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

    // Hull detail panels
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.04),
        new THREE.MeshPhysicalMaterial({ color: 0x222240, roughness: 0.5, metalness: 0.8 }));
      const a = (i / 4) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.65, 0.5 + Math.sin(i) * 0.1, Math.sin(a) * 0.65);
      p.lookAt(new THREE.Vector3(0, 0.5, 0));
      g.add(p);
    }
    // Fuselage stripe
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.008, 6, 20),
      new THREE.MeshPhysicalMaterial({ color: 0x00aaff, emissive: 0x004488, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.8 }));
    stripe.position.set(0, 0.6, 0.2);
    stripe.rotation.x = Math.PI / 2;
    g.add(stripe);

    // Hover glow
    this.hoverGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.05, 20),
      new THREE.MeshPhysicalMaterial({ color: 0x0044ff, emissive: 0x0088ff, emissiveIntensity: 0.6, transparent: true, opacity: 0.5, roughness: 0.1 }));
    this.hoverGlow.position.y = 0.02;
    g.add(this.hoverGlow);

    this.hoverLight = new THREE.PointLight(0x4488ff, 0.8, 10);
    this.hoverLight.position.y = 0.1;
    g.add(this.hoverLight);

    const sl = new THREE.PointLight(0x4488ff, 0.6, 6);
    sl.position.set(0, 1.2, -0.5);
    g.add(sl);
    // Tail warning light
    const tl = new THREE.PointLight(0xff2200, 0.3, 4);
    tl.position.set(0, 0.4, 1.5);
    g.add(tl);

    this.shipPos.set(-3, shipH, 2);
    g.position.copy(this.shipPos);
    g.rotation.y = this.shipYaw;
    this.scene.add(g);
    this.objects.push(g);
    this.shipGroup = g;

    // Landing pad
    const mm = new THREE.MeshPhysicalMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.3, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
    for (let i = 0; i < 12; i++) {
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
    const neonMat = { color: 0x00eeff, emissive: 0x00eeff, emissiveIntensity: 0.8, roughness: 0.1, metalness: 0.2 };
    const holo = new THREE.MeshPhysicalMaterial({
      color: 0x0066ff, emissive: 0x00aaff, emissiveIntensity: 0.6,
      transparent: true, opacity: 0.25, side: THREE.DoubleSide, roughness: 0.1, metalness: 0.1,
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
    this._updateChunks();
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
    // No bounds — infinite world

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

    // Camera with subtle walk bob
    const bob = this.onGround && len > 0.1 ? Math.sin(Date.now() * 0.015) * 0.015 : 0;
    this.camera.position.copy(this.playerPos);
    this.camera.position.y += bob;
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch + bob * 0.3, this.yaw, 0, 'YXZ'));

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
    // No bounds — infinite world

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

    const pulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.4;
    this.shipGroup.children.forEach(child => {
      try {
        if (child.isMesh && child.material && child.material.emissive && child.geometry) {
          if (child.geometry.type === 'CylinderGeometry' && child.position.z > 1.2) {
            child.material.emissiveIntensity = pulse;
          }
        }
      } catch {}
    });
    // Neon strip pulse
    this.shipGroup.children.forEach(child => {
      try {
        if (child.isMesh && child.material && child.material.emissive && child.geometry && child.position.y < 0.3 && child.position.z > 0.3 && child.position.z < 0.6) {
          child.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.003) * 0.4;
        }
      } catch {}
    });
    // Tail light blink
    try {
      const tailL = this.shipGroup.children.find(c => c.isPointLight && c.color.getHex() === 0xff2200);
      if (tailL) tailL.intensity = 0.2 + Math.sin(Date.now() * 0.01) * 0.15;
    } catch {}

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

    // Dispose all chunks
    for (const key of this.chunks.keys()) {
      this._disposeChunk(key);
    }
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
