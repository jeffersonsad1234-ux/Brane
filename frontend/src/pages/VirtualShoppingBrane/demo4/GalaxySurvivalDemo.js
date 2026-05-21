import * as THREE from "three";

function rng(min, max) { return min + Math.random() * (max - min); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

const SKY_TOP = new THREE.Color(0x0a0a2e);
const SKY_HORIZON = new THREE.Color(0x1a3a5a);
const SKY_BOTTOM = new THREE.Color(0x2a4a3a);

export default class GalaxySurvivalDemo {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.state = { health: 100, stamina: 100, oxygen: 100, nearShip: false, shipMode: false, canExit: false, shipSpeed: 0 };
    this.keys = {};
    this.running = false;
    this.clock = new THREE.Clock();
    this.objects = [];
    this.shipMode = false;
    this.shipYaw = 0.5;
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
      console.error("[GalaxySurvival] Init error:", e);
      return false;
    }
  }

  // ─── RENDERER ────────────────────────────────────────
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
      const cw = this.container.clientWidth, ch = this.container.clientHeight;
      this.camera.aspect = cw / ch;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(cw, ch);
    };
    window.addEventListener("resize", this._onResize);
  }

  // ─── SCENE ───────────────────────────────────────────
  _setupScene() {
    this.scene = new THREE.Scene();
    this._updateSky();
    this.scene.fog = new THREE.FogExp2(SKY_HORIZON, 0.008);
  }

  _updateSky() {
    const c = document.createElement("canvas");
    c.width = 1; c.height = 128;
    const ctx = c.getContext("2d");
    const grd = ctx.createLinearGradient(0, 0, 0, c.height);
    grd.addColorStop(0, `#${SKY_TOP.getHexString()}`);
    grd.addColorStop(0.5, `#${SKY_HORIZON.getHexString()}`);
    grd.addColorStop(1, `#${SKY_BOTTOM.getHexString()}`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    this.scene.background = tex;
    if (this.scene.fog) this.scene.fog.color.copy(SKY_HORIZON);
  }

  // ─── LIGHTS ──────────────────────────────────────────
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
    this.objects.push(this.sun);
  }

  // ─── TERRAIN ─────────────────────────────────────────
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
      const nearRoad = Math.abs(x) < 2 && z < 2 && z > -12;
      if (nearPad) {
        colors[i*3] = 0.3 + Math.random()*0.04;
        colors[i*3+1] = 0.28 + Math.random()*0.04;
        colors[i*3+2] = 0.22 + Math.random()*0.04;
      } else if (nearRoad) {
        colors[i*3] = 0.28 + Math.random()*0.04;
        colors[i*3+1] = 0.26 + Math.random()*0.04;
        colors[i*3+2] = 0.20 + Math.random()*0.04;
      } else {
        const g = 0.2 + Math.random()*0.08 + (h+0.5)*0.15;
        colors[i*3] = 0.08 + Math.random()*0.06;
        colors[i*3+1] = clamp(g, 0.1, 0.5);
        colors[i*3+2] = 0.04 + Math.random()*0.04;
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

  // ─── ROAD ────────────────────────────────────────────
  _buildRoad() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 1 });
    for (let z = 2; z >= -11; z -= 2) {
      const h = this._terrainHeight(0, z);
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), mat);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(0, h + 0.02, z);
      this.scene.add(seg);
      this.objects.push(seg);
    }
    // Road from pad to z direction
    for (let z = 2; z <= 6; z += 2) {
      const h = this._terrainHeight(0, z);
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), mat);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(0, h + 0.02, z);
      this.scene.add(seg);
      this.objects.push(seg);
    }
  }

  // ─── BUILDINGS ───────────────────────────────────────
  _buildBuildings() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, roughness: 0.7, metalness: 0.3 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.6, metalness: 0.5 });
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.3 });

    const defs = [
      { x: -9, z: 4, w: 2, h: 1.6, d: 2, rot: 0.2 },
      { x: 5, z: -6, w: 1.8, h: 2, d: 1.8, rot: -0.3 },
      { x: -11, z: -5, w: 2.2, h: 1.4, d: 2.2, rot: 0.5 },
    ];

    for (const d of defs) {
      const g = new THREE.Group();
      const groundH = this._terrainHeight(d.x, d.z);

      const wall = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, d.d), wallMat);
      wall.position.y = d.h / 2;
      wall.castShadow = true;
      g.add(wall);

      // Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(d.w + 0.2, 0.15, d.d + 0.2), roofMat);
      roof.position.y = d.h + 0.08;
      g.add(roof);

      // Windows
      for (const [wx, wz] of [[-0.3, d.d/2+0.01], [0.3, d.d/2+0.01]]) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.18), winMat);
        win.position.set(wx, d.h * 0.6, wz);
        g.add(win);
      }

      // Door
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x2a1a0a }));
      door.position.set(0, 0.25, d.d/2 + 0.01);
      g.add(door);

      g.position.set(d.x, groundH, d.z);
      g.rotation.y = d.rot;
      this.scene.add(g);
      this.objects.push(g);
    }
  }

  // ─── LAMP POSTS ──────────────────────────────────────
  _buildLampPosts() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.5, metalness: 0.8 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xaaccff });

    const positions = [0, -2, -4, -6, -8];
    for (const z of positions) {
      const g = new THREE.Group();
      const h = this._terrainHeight(1.8, z);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.8, 6), poleMat);
      pole.position.y = 0.4;
      g.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.015), poleMat);
      arm.position.set(0.12, 0.78, 0);
      g.add(arm);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), lampMat);
      bulb.position.set(0.22, 0.78, 0);
      g.add(bulb);

      g.position.set(1.8, h, z);
      this.scene.add(g);
      this.objects.push(g);

      // Mirror on other side
      const g2 = g.clone();
      g2.position.set(-1.8, h, z);
      this.scene.add(g2);
      this.objects.push(g2);
    }
  }

  // ─── TREES ───────────────────────────────────────────
  _buildTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1a4a2a, roughness: 0.85 });

    const positions = [];
    for (let i = 0; i < 20; i++) {
      let x, z, ok = false;
      for (let t = 0; t < 20; t++) {
        x = rng(-22, 22);
        z = rng(-22, 22);
        const nearPad = Math.abs(x + 3) < 4 && Math.abs(z + 2) < 4;
        const nearRoad = Math.abs(x) < 2.5 && z < 8 && z > -12;
        const nearBuilding = positions.some(p => Math.hypot(p[0]-x, p[1]-z) < 3);
        if (!nearPad && !nearRoad && !nearBuilding) { ok = true; break; }
      }
      if (!ok) continue;
      const h = this._terrainHeight(x, z);
      const s = rng(0.7, 1.3);
      const g = new THREE.Group();

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03*s, 0.06*s, 0.6*s, 5), trunkMat);
      trunk.position.y = 0.3*s;
      g.add(trunk);

      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.25*s, 6, 6), leafMat);
      leaf.position.y = 0.7*s + 0.2*s;
      leaf.castShadow = true;
      g.add(leaf);

      g.position.set(x, h, z);
      this.scene.add(g);
      this.objects.push(g);
      positions.push([x, z]);
    }
  }

  // ─── ROCKS ───────────────────────────────────────────
  _buildRocks() {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, roughness: 0.9 });
    for (let i = 0; i < 15; i++) {
      let x = rng(-20, 20), z = rng(-20, 20);
      if (Math.abs(x+3) < 4 && Math.abs(z+2) < 4) continue;
      if (Math.abs(x) < 2.5 && z < 6 && z > -10) continue;
      const h = this._terrainHeight(x, z);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rng(0.08, 0.2), 0), rockMat);
      rock.position.set(x, h + rng(0.02, 0.06), z);
      rock.rotation.set(rng(0, 6), rng(0, 6), rng(0, 6));
      rock.scale.y = rng(0.4, 0.7);
      this.scene.add(rock);
      this.objects.push(rock);
    }
  }

  // ─── SHIP ────────────────────────────────────────────
  _buildShip() {
    const g = new THREE.Group();
    const shipH = this._terrainHeight(-3, 2);

    const darkMetal = { color: 0x1a1a2e, roughness: 0.3, metalness: 0.9 };
    const lightMetal = { color: 0x2a2a4a, roughness: 0.4, metalness: 0.85 };
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a, roughness: 0.1, metalness: 0.95,
      transparent: true, opacity: 0.4,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x0044aa, emissive: 0x0088ff, emissiveIntensity: 0.5,
    });
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x222244, emissive: 0x4488ff, emissiveIntensity: 0.4,
    });

    const dm = (opt) => new THREE.MeshStandardMaterial(opt);

    // Main fuselage
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.2, 8), dm(darkMetal));
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.6;
    body.castShadow = true;
    g.add(body);

    // Nose cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.5, 8), dm(darkMetal));
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 0.6, -1.3);
    g.add(nose);

    // Cockpit window
    const cw = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), cockpitMat);
    cw.position.set(0, 0.8, -0.9);
    cw.scale.set(1, 0.6, 0.5);
    g.add(cw);

    const cg = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 8, 12), glowMat);
    cg.position.set(0, 0.8, -0.9);
    cg.rotation.x = 0.3;
    g.add(cg);

    // Wings
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.9), dm(lightMetal));
      wing.position.set(side * 0.8, 0.45, 0.4);
      wing.rotation.z = side * 0.15;
      wing.castShadow = true;
      g.add(wing);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshBasicMaterial({ color: side === -1 ? 0xff4422 : 0x22ff44 }));
      tip.position.set(side * 0.82, 0.45, 0.4);
      g.add(tip);
    }

    // Engines
    for (const side of [-1, 1]) {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.4, 6), dm(darkMetal));
      nacelle.position.set(side * 0.45, 0.35, 1.2);
      nacelle.rotation.x = 0.2;
      g.add(nacelle);

      const eg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.01, 0.15, 6), engineMat);
      eg.position.set(side * 0.45, 0.3, 1.4);
      g.add(eg);
    }

    const cEngine = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.35, 6), dm(darkMetal));
    cEngine.position.set(0, 0.4, 1.3);
    cEngine.rotation.x = 0.2;
    g.add(cEngine);

    const cGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.02, 0.15, 6), {
      color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.6,
    });
    cGlow.position.set(0, 0.35, 1.5);
    g.add(cGlow);

    // Landing struts
    for (const [sx, sz] of [[-0.5, -0.6], [0.5, -0.6], [-0.5, 0.8], [0.5, 0.8]]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 4), dm(darkMetal));
      strut.position.set(sx, 0.12, sz);
      g.add(strut);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), dm(darkMetal));
      foot.position.set(sx, 0.02, sz);
      g.add(foot);
    }

    // Hull details
    for (let i = 0; i < 6; i++) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.04),
        dm({ color: 0x222240, roughness: 0.5, metalness: 0.8 }));
      const angle = (i / 6) * Math.PI * 2;
      panel.position.set(Math.cos(angle) * 0.65, 0.5 + Math.sin(i) * 0.1, Math.sin(angle) * 0.65);
      panel.lookAt(new THREE.Vector3(0, 0.5, 0));
      g.add(panel);
    }

    // Hover glow (underside)
    const hoverMat = new THREE.MeshStandardMaterial({
      color: 0x0044ff, emissive: 0x0088ff, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.4,
    });
    this.hoverGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.05, 12), hoverMat);
    this.hoverGlow.position.y = 0.02;
    g.add(this.hoverGlow);

    // Hover light
    this.hoverLight = new THREE.PointLight(0x4488ff, 0.3, 6);
    this.hoverLight.position.y = 0.1;
    g.add(this.hoverLight);

    // Ship light (top)
    const shipLight = new THREE.PointLight(0x4488ff, 0.4, 5);
    shipLight.position.set(0, 1.2, -0.5);
    g.add(shipLight);

    this.shipPos = new THREE.Vector3(-3, shipH, 2);
    g.position.copy(this.shipPos);
    g.rotation.y = this.shipYaw;
    this.scene.add(g);
    this.objects.push(g);
    this.shipGroup = g;

    // Landing pad markers
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide,
    });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + 0.5;
      const m = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.2, 12), markerMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(-3 + Math.cos(angle) * 1.1, shipH + 0.01, 2 + Math.sin(angle) * 1.1);
      this.scene.add(m);
      this.objects.push(m);
    }
  }

  // ─── PLAYER ──────────────────────────────────────────
  _setupPlayer() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 100);
    this.playerHeight = 1.7;
    this.playerPos = new THREE.Vector3(0, this.playerHeight, 5);
    this.playerVel = new THREE.Vector3(0, 0, 0);
    this.yaw = 0.2;
    this.pitch = -0.05;
    this.onGround = false;

    this.gravity = -22;
    this.jumpSpeed = 6;
    this.walkSpeed = 4;
    this.sprintSpeed = 7;

    this.health = 100;
    this.stamina = 100;
    this.oxygen = 100;

    // Ship mode
    this.shipSpeed = 0;
    this.shipTargetAlt = 3;
    this.shipAltitude = 0;
  }

  // ─── INPUT ───────────────────────────────────────────
  _setupInput() {
    this._onKeyDown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if ([' ', 'control'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    this._onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
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
      }
    };
    this.container.addEventListener("click", this._onClick);
  }

  // ─── LOOP ────────────────────────────────────────────
  _startLoop() {
    this.running = true;
    this.clock.start();
    const loop = () => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this._update(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  _update(dt) {
    this._handleShipEntry(dt);
    if (this.shipMode) {
      this._updateShipMovement(dt);
    } else {
      this._updateFootMovement(dt);
      this._updateSurvival(dt);
    }
    this._updateState();
  }

  // ─── SHIP ENTRY/EXIT ─────────────────────────────────
  _handleShipEntry(_dt) {
    if (this.keys['e'] && !this._eWasDown) {
      this._eWasDown = true;
      if (this.shipMode) {
        // Try to exit
        if (this.shipAltitude < 2) {
          this._exitShip();
        }
      } else {
        // Try to enter
        const toShip = new THREE.Vector3(this.shipPos.x, 0, this.shipPos.z)
          .sub(new THREE.Vector3(this.playerPos.x, 0, this.playerPos.z));
        if (toShip.length() < 2.5) {
          this._enterShip();
        }
      }
    }
    if (!this.keys['e']) this._eWasDown = false;
  }

  _enterShip() {
    this.shipMode = true;
    // Sync ship yaw to player's look direction
    this.shipYaw = this.yaw;
    this.shipTargetAlt = 3;
    // Place camera at ship cockpit position
    this.pitch = -0.1;
    // Refresh oxygen
    this.oxygen = Math.min(100, this.oxygen + 30);
  }

  _exitShip() {
    this.shipMode = false;
    const exitH = this._terrainHeight(this.shipPos.x, this.shipPos.z);
    this.playerPos.set(this.shipPos.x + 2, exitH + this.playerHeight, this.shipPos.z + 2);
    this.playerVel.set(0, 0, 0);
    this.yaw = this.shipYaw;
  }

  // ─── SHIP MOVEMENT ───────────────────────────────────
  _updateShipMovement(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.shipYaw), 0, -Math.cos(this.shipYaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    // Turn with A/D
    const turnRate = 1.2;
    if (this.keys['a']) this.shipYaw += turnRate * dt;
    if (this.keys['d']) this.shipYaw -= turnRate * dt;

    // Thrust with W/S
    const boost = this.keys['shift'] ? 2.0 : 1.0;
    if (this.keys['w']) {
      this.shipSpeed = Math.min(25, this.shipSpeed + 15 * dt * boost);
    } else if (this.keys['s']) {
      this.shipSpeed = Math.max(-8, this.shipSpeed - 20 * dt);
    } else {
      this.shipSpeed *= 0.97;
      if (Math.abs(this.shipSpeed) < 0.1) this.shipSpeed = 0;
    }

    // Altitude control
    if (this.keys[' ']) this.shipTargetAlt = Math.min(8, this.shipTargetAlt + 3 * dt);
    if (this.keys['control']) this.shipTargetAlt = Math.max(1, this.shipTargetAlt - 3 * dt);

    // Move ship
    this.shipPos.x += forward.x * this.shipSpeed * dt;
    this.shipPos.z += forward.z * this.shipSpeed * dt;

    // Clamp to world bounds
    this.shipPos.x = clamp(this.shipPos.x, -23, 23);
    this.shipPos.z = clamp(this.shipPos.z, -23, 23);

    // Apply altitude
    const groundH = this._terrainHeight(this.shipPos.x, this.shipPos.z);
    this.shipAltitude += (this.shipTargetAlt - this.shipAltitude) * 3 * dt;
    this.shipPos.y = groundH + this.shipAltitude;

    // Smooth yaw toward look direction when turning
    // Camera yaw follows ship yaw with a slight offset for mouse look
    const lookOffset = this.yaw - this.shipYaw;
    // Normalize
    const normalized = ((lookOffset + Math.PI) % (Math.PI * 2)) - Math.PI;
    this.yaw = this.shipYaw + normalized * 0.9;

    // Camera follows ship
    this.camera.position.set(this.shipPos.x, this.shipPos.y + 0.4, this.shipPos.z + forward.z * 0.2);
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Update ship group position/rotation
    this.shipGroup.position.copy(this.shipPos);
    this.shipGroup.rotation.y = this.shipYaw;

    // Hover glow intensity based on speed
    const hoverIntensity = 0.3 + Math.min(this.shipSpeed / 10, 0.7);
    this.hoverGlow.material.emissiveIntensity = hoverIntensity;
    this.hoverGlow.material.opacity = 0.2 + hoverIntensity * 0.4;
    this.hoverLight.intensity = 0.2 + hoverIntensity * 0.6;

    // Engine glow pulse
    const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
    this.shipGroup.children.forEach(child => {
      if (child.isMesh && child.material && child.material.emissive) {
        if (child.geometry.type === 'CylinderGeometry' && child.position.z > 1.2) {
          child.material.emissiveIntensity = pulse;
        }
      }
    });

    this.state.shipSpeed = Math.round(this.shipSpeed);
    this.state.canExit = this.shipAltitude < 2;
  }

  // ─── FOOT MOVEMENT ───────────────────────────────────
  _updateFootMovement(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    const sprint = this.keys['shift'] && this.stamina > 0 && this.onGround;
    const speed = sprint ? this.sprintSpeed : this.walkSpeed;

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.keys['w']) moveDir.add(forward);
    if (this.keys['s']) moveDir.sub(forward);
    if (this.keys['a']) moveDir.sub(right);
    if (this.keys['d']) moveDir.add(right);

    if (moveDir.length() > 0) {
      moveDir.normalize();
      this.playerVel.x = moveDir.x * speed;
      this.playerVel.z = moveDir.z * speed;
    } else {
      this.playerVel.x *= 0.88;
      this.playerVel.z *= 0.88;
    }

    this.playerVel.y += this.gravity * dt;

    if (this.keys[' '] && this.onGround) {
      this.playerVel.y = this.jumpSpeed;
      this.onGround = false;
    }

    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;
    this.playerPos.z += this.playerVel.z * dt;

    this.playerPos.x = clamp(this.playerPos.x, -23, 23);
    this.playerPos.z = clamp(this.playerPos.z, -23, 23);

    const groundY = this._terrainHeight(this.playerPos.x, this.playerPos.z);
    if (this.playerPos.y <= groundY + this.playerHeight) {
      this.playerPos.y = groundY + this.playerHeight;
      this.playerVel.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.camera.position.copy(this.playerPos);
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    if (sprint) {
      this.stamina = Math.max(0, this.stamina - 20 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 12 * dt);
    }
  }

  _updateSurvival(dt) {
    // Oxygen near ship
    if (!this.shipMode) {
      const toShip = new THREE.Vector3(this.shipPos.x, 0, this.shipPos.z)
        .sub(new THREE.Vector3(this.playerPos.x, 0, this.playerPos.z));
      const distToShip = toShip.length();
      this.state.nearShip = distToShip < 4;
      if (distToShip < 4) {
        this.oxygen = Math.min(100, this.oxygen + 20 * dt);
      } else {
        this.oxygen = Math.max(0, this.oxygen - 3 * dt);
      }
      if (this.oxygen <= 0) {
        this.health = Math.max(0, this.health - 5 * dt);
      }
    }
  }

  _updateState() {
    this.state.health = Math.round(this.health);
    this.state.stamina = Math.round(this.stamina);
    this.state.oxygen = Math.round(this.oxygen);
    this.state.shipMode = this.shipMode;
    this.state.shipSpeed = this.shipSpeed;
    this.state.canExit = this.shipAltitude < 2;
    this.callbacks.onStateChange?.({ ...this.state });
  }

  // ─── DISPOSE ─────────────────────────────────────────
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
        } else if (obj.isGroup || obj.isLight) {
          if (obj.isGroup) {
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
        }
      } catch {}
    }

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
