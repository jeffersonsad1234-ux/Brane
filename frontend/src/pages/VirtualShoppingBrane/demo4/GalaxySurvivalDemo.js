import * as THREE from "three";

function rng(min, max) { return min + Math.random() * (max - min); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

const SKY_TOP = "#0a0a2e";
const SKY_MID = "#1a3a5a";
const SKY_BOT = "#2a4a3a";

export default class GalaxySurvivalDemo {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};

    // State sent to React
    this.state = {
      mode: "player", health: 100, stamina: 100, oxygen: 100,
      nearShip: false, distToShip: 0, shipSpeed: 0, canExit: false,
    };

    // Keyboard
    this.keys = {};
    this._eWasDown = false;

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
      this._buildRoad();
      this._buildBuildings();
      this._buildLampPosts();
      this._buildTrees();
      this._buildRocks();
      this._buildShip();
      this._setupPlayer();
      this._setupInput();
      this._startLoop();
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
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    this._onResize = () => {
      const cw = this.container.clientWidth;
      const ch = this.container.clientHeight;
      this.camera.aspect = cw / ch;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(cw, ch);
    };
    window.addEventListener("resize", this._onResize);
  }

  // ═══════════════════════════════════════════════════════
  // SCENE
  // ═══════════════════════════════════════════════════════
  _setupScene() {
    this.scene = new THREE.Scene();
    const c = document.createElement("canvas");
    c.width = 1; c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, SKY_TOP);
    g.addColorStop(0.5, SKY_MID);
    g.addColorStop(1, SKY_BOT);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 128);
    this.scene.background = new THREE.CanvasTexture(c);
    this.scene.fog = new THREE.FogExp2(new THREE.Color(SKY_MID), 0.008);
  }

  // ═══════════════════════════════════════════════════════
  // LIGHTS
  // ═══════════════════════════════════════════════════════
  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0x446688, 0.4));
    this.scene.add(new THREE.HemisphereLight(0x4488ff, 0x442222, 0.5));
    this.sun = new THREE.DirectionalLight(0xffddaa, 1.5);
    this.sun.position.set(15, 25, 5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.near = 1; sc.far = 50;
    sc.left = -25; sc.right = 25;
    sc.top = 25; sc.bottom = -25;
    this.scene.add(this.sun);
  }

  // ═══════════════════════════════════════════════════════
  // TERRAIN
  // ═══════════════════════════════════════════════════════
  _terrainHeight(x, z) {
    return (Math.sin(x * 0.04 + 1.3) * Math.cos(z * 0.05 + 0.7) * 0.3
      + Math.sin(x * 0.09 + z * 0.07) * 0.12
      + Math.sin(x * 0.15 + z * 0.12 + 2.0) * 0.05);
  }

  _buildTerrain() {
    const segs = 50, size = 50;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = this._terrainHeight(x, z);
      pos.setY(i, h);
      const nearPad = Math.abs(x + 3) < 3 && Math.abs(z + 2) < 3;
      const nearRd = Math.abs(x) < 2 && z < 2 && z > -12;
      if (nearPad) {
        colors[i * 3] = 0.3 + Math.random() * 0.04;
        colors[i * 3 + 1] = 0.28 + Math.random() * 0.04;
        colors[i * 3 + 2] = 0.22 + Math.random() * 0.04;
      } else if (nearRd) {
        colors[i * 3] = 0.28 + Math.random() * 0.04;
        colors[i * 3 + 1] = 0.26 + Math.random() * 0.04;
        colors[i * 3 + 2] = 0.20 + Math.random() * 0.04;
      } else {
        const gr = 0.2 + Math.random() * 0.08 + (h + 0.5) * 0.15;
        colors[i * 3] = 0.08 + Math.random() * 0.06;
        colors[i * 3 + 1] = clamp(gr, 0.1, 0.5);
        colors[i * 3 + 2] = 0.04 + Math.random() * 0.04;
      }
    }
    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    this.terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.9, metalness: 0,
    }));
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
    this.objects.push(this.terrain);
  }

  // ═══════════════════════════════════════════════════════
  // ROAD
  // ═══════════════════════════════════════════════════════
  _buildRoad() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 1 });
    for (let z = 2; z >= -11; z -= 2) {
      const h = this._terrainHeight(0, z);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), mat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, h + 0.02, z);
      this.scene.add(s);
      this.objects.push(s);
    }
    for (let z = 2; z <= 6; z += 2) {
      const h = this._terrainHeight(0, z);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), mat);
      s.rotation.x = -Math.PI / 2;
      s.position.set(0, h + 0.02, z);
      this.scene.add(s);
      this.objects.push(s);
    }
  }

  // ═══════════════════════════════════════════════════════
  // BUILDINGS
  // ═══════════════════════════════════════════════════════
  _buildBuildings() {
    const defs = [
      { x: -9, z: 4, w: 2, h: 1.6, d: 2, rot: 0.2 },
      { x: 5, z: -6, w: 1.8, h: 2, d: 1.8, rot: -0.3 },
      { x: -11, z: -5, w: 2.2, h: 1.4, d: 2.2, rot: 0.5 },
    ];
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, roughness: 0.7, metalness: 0.3 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.6, metalness: 0.5 });
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.3 });
    const doorMat = new THREE.MeshBasicMaterial({ color: 0x2a1a0a });

    for (const d of defs) {
      const g = new THREE.Group();
      const gh = this._terrainHeight(d.x, d.z);
      const wall = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), wallMat);
      wall.position.y = d.h / 2;
      wall.castShadow = true;
      g.add(wall);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(d.w + 0.2, 0.15, d.d + 0.2), roofMat);
      roof.position.y = d.h + 0.08;
      g.add(roof);
      for (const wx of [-0.3, 0.3]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.18), winMat);
        win.position.set(wx, d.h * 0.6, d.d / 2 + 0.01);
        g.add(win);
      }
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), doorMat);
      door.position.set(0, 0.25, d.d / 2 + 0.01);
      g.add(door);
      g.position.set(d.x, gh, d.z);
      g.rotation.y = d.rot;
      this.scene.add(g);
      this.objects.push(g);
    }
  }

  // ═══════════════════════════════════════════════════════
  // LAMP POSTS
  // ═══════════════════════════════════════════════════════
  _buildLampPosts() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.5, metalness: 0.8 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xaaccff });
    for (const z of [0, -2, -4, -6, -8]) {
      for (const side of [-1.8, 1.8]) {
        const g = new THREE.Group();
        const h = this._terrainHeight(side, z);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.8, 6), poleMat);
        pole.position.y = 0.4;
        g.add(pole);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.015), poleMat);
        arm.position.set(side > 0 ? 0.12 : -0.12, 0.78, 0);
        g.add(arm);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), lampMat);
        bulb.position.set(side > 0 ? 0.22 : -0.22, 0.78, 0);
        g.add(bulb);
        g.position.set(side, h, z);
        this.scene.add(g);
        this.objects.push(g);
      }
    }
  }

  // ═══════════════════════════════════════════════════════
  // TREES
  // ═══════════════════════════════════════════════════════
  _buildTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1a4a2a, roughness: 0.85 });
    for (let i = 0; i < 20; i++) {
      let x, z;
      for (let t = 0; t < 50; t++) {
        x = rng(-22, 22);
        z = rng(-22, 22);
        if (Math.abs(x + 3) < 4 && Math.abs(z + 2) < 4) continue;
        if (Math.abs(x) < 2.5 && z < 8 && z > -12) continue;
        break;
      }
      const h = this._terrainHeight(x, z);
      const s = rng(0.7, 1.3);
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.06 * s, 0.6 * s, 5), trunkMat);
      trunk.position.y = 0.3 * s;
      g.add(trunk);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.25 * s, 6, 6), leafMat);
      leaf.position.y = 0.7 * s + 0.2 * s;
      leaf.castShadow = true;
      g.add(leaf);
      g.position.set(x, h, z);
      this.scene.add(g);
      this.objects.push(g);
    }
  }

  // ═══════════════════════════════════════════════════════
  // ROCKS
  // ═══════════════════════════════════════════════════════
  _buildRocks() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, roughness: 0.9 });
    for (let i = 0; i < 15; i++) {
      let x = rng(-20, 20), z = rng(-20, 20);
      if (Math.abs(x + 3) < 4 && Math.abs(z + 2) < 4) continue;
      if (Math.abs(x) < 2.5 && z < 6 && z > -10) continue;
      const h = this._terrainHeight(x, z);
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rng(0.08, 0.2), 0), mat);
      r.position.set(x, h + rng(0.02, 0.06), z);
      r.rotation.set(rng(0, 6), rng(0, 6), rng(0, 6));
      r.scale.y = rng(0.4, 0.7);
      this.scene.add(r);
      this.objects.push(r);
    }
  }

  // ═══════════════════════════════════════════════════════
  // SHIP
  // ═══════════════════════════════════════════════════════
  _buildShip() {
    const g = new THREE.Group();
    const shipH = this._terrainHeight(-3, 2);

    const dk = { color: 0x1a1a2e, roughness: 0.3, metalness: 0.9 };
    const lt = { color: 0x2a2a4a, roughness: 0.4, metalness: 0.85 };
    const cp = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.1, metalness: 0.95, transparent: true, opacity: 0.4 });
    const gl = new THREE.MeshStandardMaterial({ color: 0x0044aa, emissive: 0x0088ff, emissiveIntensity: 0.5 });
    const en = new THREE.MeshStandardMaterial({ color: 0x222244, emissive: 0x4488ff, emissiveIntensity: 0.4 });

    const m = (o) => new THREE.MeshStandardMaterial(o);

    // Fuselage
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.2, 8), m(dk));
    body.rotation.x = Math.PI / 2; body.position.y = 0.6; body.castShadow = true;
    g.add(body);

    // Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.5, 8), m(dk));
    nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0.6, -1.3);
    g.add(nose);

    // Cockpit
    const cw = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), cp);
    cw.position.set(0, 0.8, -0.9); cw.scale.set(1, 0.6, 0.5);
    g.add(cw);
    const cg = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 8, 12), gl);
    cg.position.set(0, 0.8, -0.9); cg.rotation.x = 0.3;
    g.add(cg);

    // Wings
    for (const side of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.9), m(lt));
      w.position.set(side * 0.8, 0.45, 0.4); w.rotation.z = side * 0.15; w.castShadow = true;
      g.add(w);
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshBasicMaterial({ color: side === -1 ? 0xff4422 : 0x22ff44 }));
      t.position.set(side * 0.82, 0.45, 0.4);
      g.add(t);
    }

    // Engines
    for (const side of [-1, 1]) {
      const n = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.4, 6), m(dk));
      n.position.set(side * 0.45, 0.35, 1.2); n.rotation.x = 0.2;
      g.add(n);
      const e = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.01, 0.15, 6), en);
      e.position.set(side * 0.45, 0.3, 1.4);
      g.add(e);
    }
    const ce = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.35, 6), m(dk));
    ce.position.set(0, 0.4, 1.3); ce.rotation.x = 0.2;
    g.add(ce);
    const cg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.02, 0.15, 6), {
      color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.6,
    });
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
        m({ color: 0x222240, roughness: 0.5, metalness: 0.8 }));
      const a = (i / 6) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.65, 0.5 + Math.sin(i) * 0.1, Math.sin(a) * 0.65);
      p.lookAt(new THREE.Vector3(0, 0.5, 0));
      g.add(p);
    }

    // Hover glow
    this.hoverGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x0044ff, emissive: 0x0088ff, emissiveIntensity: 0.3, transparent: true, opacity: 0.4 }));
    this.hoverGlow.position.y = 0.02;
    g.add(this.hoverGlow);

    this.hoverLight = new THREE.PointLight(0x4488ff, 0.3, 6);
    this.hoverLight.position.y = 0.1;
    g.add(this.hoverLight);

    const sl = new THREE.PointLight(0x4488ff, 0.4, 5);
    sl.position.set(0, 1.2, -0.5);
    g.add(sl);

    this.shipPos.set(-3, shipH, 2);
    g.position.copy(this.shipPos);
    g.rotation.y = this.shipYaw;
    this.scene.add(g);
    this.objects.push(g);
    this.shipGroup = g;

    // Landing pad
    const mm = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.5;
      const m2 = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.2, 12), mm);
      m2.rotation.x = -Math.PI / 2;
      m2.position.set(-3 + Math.cos(a) * 1.1, shipH + 0.01, 2 + Math.sin(a) * 1.1);
      this.scene.add(m2);
      this.objects.push(m2);
    }
  }

  // ═══════════════════════════════════════════════════════
  // PLAYER
  // ═══════════════════════════════════════════════════════
  _setupPlayer() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    this.camera.position.copy(this.playerPos);
  }

  // ═══════════════════════════════════════════════════════
  // INPUT
  // ═══════════════════════════════════════════════════════
  _setupInput() {
    this._onKeyDown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if ([' ', 'control', 'e'].includes(e.key.toLowerCase())) e.preventDefault();
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
        this.renderer.render(this.scene, this.camera);
      } catch (e) {
        console.error("[GS] Loop error:", e);
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

    // Camera yaw follows ship yaw with mouse look offset
    const lookOff = this.yaw - this.shipYaw;
    const normOff = ((lookOff + Math.PI) % (Math.PI * 2)) - Math.PI;
    this.yaw = this.shipYaw + normOff * 0.9;

    // Camera
    this.camera.position.set(this.shipPos.x, this.shipPos.y + 0.4, this.shipPos.z);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

    // Ship mesh
    this.shipGroup.position.copy(this.shipPos);
    this.shipGroup.rotation.y = this.shipYaw;

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
      `Mode: SHIP`,
      `Speed: ${this.shipSpeed.toFixed(1)}`,
      `Alt: ${this.shipAltitude.toFixed(1)}m`,
      `Keys: ${Object.entries(this.keys).filter(([,v]) => v).map(([k]) => k).join(' ') || 'none'}`,
      `Can exit: ${this.state.canExit}`,
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
