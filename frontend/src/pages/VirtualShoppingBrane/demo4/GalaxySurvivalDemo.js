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
    this.state = { health: 100, stamina: 100, oxygen: 100, nearShip: false };
    this.keys = {};
    this.running = false;
    this.clock = new THREE.Clock();
    this.objects = [];
  }

  init() {
    try {
      this._setupRenderer();
      this._setupScene();
      this._setupLights();
      this._buildTerrain();
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
    this._updateSky(0);
    this.scene.fog = new THREE.FogExp2(SKY_HORIZON, 0.008);
  }

  _updateSky(_time) {
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
    this.scene.fog?.color.copy(SKY_HORIZON);
  }

  // ─── LIGHTS ──────────────────────────────────────────
  _setupLights() {
    const ambient = new THREE.AmbientLight(0x446688, 0.4);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x4488ff, 0x442222, 0.5);
    this.scene.add(hemi);

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
    const segs = 50;
    const size = 50;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this._terrainHeight(x, z);
      pos.setY(i, h);

      const nearShip = Math.abs(x + 3) < 3 && Math.abs(z + 2) < 3;
      if (nearShip) {
        colors[i * 3] = 0.3 + Math.random() * 0.05;
        colors[i * 3 + 1] = 0.28 + Math.random() * 0.04;
        colors[i * 3 + 2] = 0.22 + Math.random() * 0.04;
      } else {
        const g = 0.2 + Math.random() * 0.08 + (h + 0.5) * 0.15;
        colors[i * 3] = 0.08 + Math.random() * 0.06;
        colors[i * 3 + 1] = clamp(g, 0.1, 0.5);
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
      color: 0x0044aa, emissive: 0x0044ff, emissiveIntensity: 0.5,
    });
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x222244, emissive: 0x4488ff, emissiveIntensity: 0.3,
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

    // Cockpit frame glow
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

      // Wing tip light
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6),
        new THREE.MeshBasicMaterial({ color: side === -1 ? 0xff4422 : 0x22ff44 }));
      tip.position.set(side * 0.82, 0.45, 0.4);
      g.add(tip);
    }

    // Engine nacelles
    for (const side of [-1, 1]) {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.4, 6), dm(darkMetal));
      nacelle.position.set(side * 0.45, 0.35, 1.2);
      nacelle.rotation.x = 0.2;
      g.add(nacelle);

      // Engine glow
      const eg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.01, 0.15, 6), engineMat);
      eg.position.set(side * 0.45, 0.3, 1.4);
      g.add(eg);
    }

    // Center engine
    const cEngine = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.35, 6), dm(darkMetal));
    cEngine.position.set(0, 0.4, 1.3);
    cEngine.rotation.x = 0.2;
    g.add(cEngine);

    const cGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.02, 0.15, 6), {
      color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 0.5,
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

    // Ship light
    const shipLight = new THREE.PointLight(0x4488ff, 0.4, 5);
    shipLight.position.set(-3, shipH + 1.5, 2);
    this.scene.add(shipLight);
    this.objects.push(shipLight);

    this.shipPos = new THREE.Vector3(-3, shipH, 2);
    g.position.copy(this.shipPos);
    g.rotation.y = 0.5;
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
    this.isSprinting = false;

    this.gravity = -22;
    this.jumpSpeed = 6;
    this.walkSpeed = 4;
    this.sprintSpeed = 7;

    this.health = 100;
    this.stamina = 100;
    this.oxygen = 100;
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
    this._updateMovement(dt);
    this._updateSurvival(dt);
    this._updateState();
  }

  _updateMovement(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    this.isSprinting = this.keys['shift'] && this.stamina > 0 && this.onGround;
    const speed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

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
      if (!this.onGround) {
        // Landing
      }
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.camera.position.copy(this.playerPos);
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Stamina
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - 20 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 12 * dt);
    }
  }

  _updateSurvival(dt) {
    // Check proximity to ship for oxygen
    const toShip = new THREE.Vector3(this.shipPos.x, 0, this.shipPos.z)
      .sub(new THREE.Vector3(this.playerPos.x, 0, this.playerPos.z));
    const distToShip = toShip.length();
    this.state.nearShip = distToShip < 4;

    if (this.state.nearShip) {
      this.oxygen = Math.min(100, this.oxygen + 20 * dt);
    } else {
      this.oxygen = Math.max(0, this.oxygen - 3 * dt);
    }

    if (this.oxygen <= 0) {
      this.health = Math.max(0, this.health - 5 * dt);
    }
  }

  _updateState() {
    this.state.health = Math.round(this.health);
    this.state.stamina = Math.round(this.stamina);
    this.state.oxygen = Math.round(this.oxygen);
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
