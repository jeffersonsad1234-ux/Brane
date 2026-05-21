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
      camMode: "third",
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
    this.camDistance = 14;
    this.camHeight = 8;
    this.thirdCamPos = new THREE.Vector3(0, 8, 14);

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
      this._buildCockpitInterior();
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
  // COCKPIT INTERIOR
  // ═══════════════════════════════════════════════════════
  _buildCockpitInterior() {
    const g = this.shipGroup;

    const dk = { color: 0x0e0e1a, roughness: 0.4, metalness: 0.85 };
    const neon = { color: 0x00ddff, emissive: 0x00ddff, emissiveIntensity: 0.5 };
    const holo = new THREE.MeshStandardMaterial({
      color: 0x0066ff, emissive: 0x0088ff, emissiveIntensity: 0.3,
      transparent: true, opacity: 0.25, side: THREE.DoubleSide,
    });
    const scr = new THREE.MeshStandardMaterial({
      color: 0x002244, emissive: 0x0044aa, emissiveIntensity: 0.4,
    });

    const m = (o) => new THREE.MeshStandardMaterial(o);

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
      const ns = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.15, 0.01), m(neon));
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
    const dna = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.005, 0.01), m(neon));
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
      // Third person: behind and above ship
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
      // Cockpit: inside ship
      const ck = new THREE.Vector3(0, 0.7, -0.5);
      ck.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.shipYaw);
      this.camera.position.copy(this.shipPos).add(ck);
      const cp = this.pitch + Math.sin(Date.now() * 0.003) * 0.01;
      this.camera.quaternion.setFromEuler(new THREE.Euler(cp, this.shipYaw, 0, 'YXZ'));
    }

    // Glow effects

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
