import * as THREE from "three";

function rng(min, max) {
  return min + Math.random() * (max - min);
}

export default class FPSDemo {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.state = { health: 100, stamina: 100, zombiesAlive: 0, gameOver: false, gameTime: 0 };
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
      this._buildRoad();
      this._buildTrees();
      this._buildRocks();
      this._buildHouses();
      this._setupPlayer();
      this._setupEnemies();
      this._setupInput();
      this._startLoop();
      return true;
    } catch (e) {
      console.error("[FPSDemo] Init error:", e);
      return false;
    }
  }

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

  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 40, 70);
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x44aa44, 0.5);
    this.scene.add(hemi);

    this.sun = new THREE.DirectionalLight(0xffeedd, 1.8);
    this.sun.position.set(15, 25, 10);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.near = 1;
    sc.far = 50;
    sc.left = -25;
    sc.right = 25;
    sc.top = 25;
    sc.bottom = -25;
    this.scene.add(this.sun);

    const fill = new THREE.DirectionalLight(0x88aaff, 0.3);
    fill.position.set(-10, 10, -5);
    this.scene.add(fill);
  }

  // ─── TERRAIN HEIGHT ──────────────────────────────────
  _getTerrainHeight(x, z) {
    return (Math.sin(x * 0.06) * 0.15 + Math.cos(z * 0.06) * 0.1
      + Math.sin(x * 0.13 + z * 0.08) * 0.08);
  }

  // ─── TERRAIN ─────────────────────────────────────────
  _buildTerrain() {
    const segs = 50;
    const size = 60;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = this._getTerrainHeight(x, z);
      pos.setY(i, h);

      const nearRoad = Math.abs(x) < 2.5;
      if (nearRoad) {
        colors[i * 3] = 0.4 + Math.random() * 0.05;
        colors[i * 3 + 1] = 0.28 + Math.random() * 0.04;
        colors[i * 3 + 2] = 0.18 + Math.random() * 0.03;
      } else {
        colors[i * 3] = 0.08 + Math.random() * 0.06;
        colors[i * 3 + 1] = 0.35 + Math.random() * 0.15;
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

  // ─── ROAD ────────────────────────────────────────────
  _buildRoad() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 1 });
    for (let z = -28; z <= 28; z += 2) {
      const h = this._getTerrainHeight(0, z);
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2), roadMat);
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(0, h + 0.02, z);
      this.scene.add(seg);
      this.objects.push(seg);
    }
  }

  // ─── TREES ───────────────────────────────────────────
  _buildTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
    const folColors = [
      new THREE.Color(0.08, 0.25, 0.06),
      new THREE.Color(0.12, 0.33, 0.08),
      new THREE.Color(0.16, 0.38, 0.10),
    ];

    for (let i = 0; i < 30; i++) {
      try {
        let x, z;
        do {
          x = rng(-25, 25);
          z = rng(-25, 25);
        } while (Math.abs(x) < 3.5 && Math.abs(z) < 25);

        const s = rng(0.8, 1.6);
        const h = this._getTerrainHeight(x, z);
        const g = new THREE.Group();

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.1 * s, 0.7 * s, 5), trunkMat);
        trunk.position.y = 0.35 * s;
        trunk.castShadow = true;
        g.add(trunk);

        for (let layer = 0; layer < 3; layer++) {
          const r = (0.45 - layer * 0.1) * s;
          const fh = (0.4 - layer * 0.08) * s;
          const fol = new THREE.Mesh(new THREE.ConeGeometry(r, fh, 6),
            new THREE.MeshStandardMaterial({ color: folColors[layer], roughness: 0.85 })
          );
          fol.position.y = (0.7 + layer * 0.3) * s;
          fol.castShadow = true;
          g.add(fol);
        }

        g.position.set(x, h, z);
        g.rotation.y = rng(0, Math.PI * 2);
        this.scene.add(g);
        this.objects.push(g);
      } catch {}
    }
  }

  // ─── ROCKS ───────────────────────────────────────────
  _buildRocks() {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x666677, roughness: 0.9 });
    for (let i = 0; i < 15; i++) {
      try {
        let x, z;
        do {
          x = rng(-24, 24);
          z = rng(-24, 24);
        } while (Math.abs(x) < 3);
        const h = this._getTerrainHeight(x, z);
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rng(0.1, 0.25), 0), rockMat);
        rock.position.set(x, h + rng(0.02, 0.08), z);
        rock.rotation.set(rng(0, 6), rng(0, 6), rng(0, 6));
        rock.scale.y = rng(0.4, 0.7);
        rock.castShadow = true;
        this.scene.add(rock);
        this.objects.push(rock);
      } catch {}
    }
  }

  // ─── HOUSES ──────────────────────────────────────────
  _buildHouses() {
    const positions = [
      { x: -9, z: -11, r: 0.3 }, { x: 11, z: -7, r: -0.4 },
      { x: -13, z: 10, r: 0.6 }, { x: 10, z: 13, r: -0.2 },
    ];
    for (const p of positions) {
      try { this._addHouse(p.x, p.z, p.r); } catch {}
    }
  }

  _addHouse(x, z, rot) {
    const h = this._getTerrainHeight(x, z);
    const g = new THREE.Group();

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x9B8365, roughness: 0.95 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 2.6), wallMat);
    wall.position.y = 0.9;
    wall.castShadow = true;
    g.add(wall);

    const roofMat = new THREE.MeshStandardMaterial({ color: 0x7B5236, roughness: 0.9 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.8, 4), roofMat);
    roof.position.y = 1.8 + 0.4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);

    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x3a2010 }));
    door.position.set(0, 0.3, 1.31);
    g.add(door);

    for (const wx of [-0.5, 0.5]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.2),
        new THREE.MeshBasicMaterial({ color: 0x0a0a14 }));
      win.position.set(wx, 0.9, 1.31);
      g.add(win);
    }

    g.position.set(x, h, z);
    g.rotation.y = rot;
    this.scene.add(g);
    this.objects.push(g);
  }

  // ─── PLAYER ──────────────────────────────────────────
  _setupPlayer() {
    this.camera = new THREE.PerspectiveCamera(75,
      this.container.clientWidth / this.container.clientHeight, 0.1, 100);
    this.playerHeight = 1.6;
    this.playerPos = new THREE.Vector3(0, this.playerHeight, 10);
    this.playerVel = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.camera.position.copy(this.playerPos);

    this.gravity = -25;
    this.jumpSpeed = 6.5;
    this.walkSpeed = 4.5;
    this.sprintSpeed = 7.5;
    this.slideSpeed = 9;

    this.stamina = 100;
    this.isExhausted = false;
  }

  // ─── ENEMIES ─────────────────────────────────────────
  _setupEnemies() {
    this.enemies = [];
    const bodyColors = [0x556b2f, 0x6b5b3a, 0x5a4a3a, 0x4a5a3a];

    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColors[i % bodyColors.length], roughness: 0.9,
      });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.6, 5), bodyMat);
      body.position.y = 0.3;
      body.castShadow = true;
      g.add(body);

      const headMat = new THREE.MeshStandardMaterial({ color: 0x7a6a5a, roughness: 0.9 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), headMat);
      head.position.y = 0.7;
      head.castShadow = true;
      g.add(head);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
      for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), eyeMat);
        eye.position.set(side * 0.07, 0.72, 0.13);
        g.add(eye);
      }

      const armMat = new THREE.MeshStandardMaterial({ color: 0x6b5a4a, roughness: 0.9 });
      const arms = [];
      for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.35, 4), armMat);
        arm.position.set(side * 0.26, 0.35, 0);
        arm.rotation.z = side * 0.4;
        g.add(arm);
        arms.push(arm);
      }

      let x, z;
      do {
        const angle = Math.random() * Math.PI * 2;
        const dist = 8 + Math.random() * 12;
        x = Math.sin(angle) * dist;
        z = Math.cos(angle) * dist;
      } while (Math.abs(x) < 3 && Math.abs(z) < 20);

      const th = this._getTerrainHeight(x, z);
      g.position.set(x, th, z);
      this.scene.add(g);
      this.objects.push(g);

      this.enemies.push({
        pos: new THREE.Vector3(x, th, z),
        speed: 1.8 + Math.random() * 0.7,
        health: 3,
        group: g,
        arms,
        attackTimer: 0,
      });
    }
    this.state.zombiesAlive = this.enemies.length;
  }

  // ─── INPUT ───────────────────────────────────────────
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
      this.pitch = Math.max(-Math.PI / 2.8, Math.min(Math.PI / 2.8, this.pitch));
    };
    document.addEventListener("mousemove", this._onMouseMove);

    this._onPointerLockChange = () => {
      this.container.style.cursor = document.pointerLockElement === this.container ? 'default' : 'pointer';
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
    this.state.gameTime = 0;
    const loop = () => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.state.gameTime += dt;
      if (!this.state.gameOver) this._update(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  _update(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    const isSprint = this.keys['shift'] && !this.isExhausted && this.onGround;
    const isJump = this.keys[' '];
    const isSlideKey = this.keys['control'];

    // Stamina
    if (isSprint) {
      this.stamina = Math.max(0, this.stamina - 20 * dt);
    } else if (this.isSliding) {
      this.stamina = Math.max(0, this.stamina - 15 * dt);
    } else {
      this.stamina = Math.min(100, this.stamina + 15 * dt);
    }
    this.isExhausted = this.stamina <= 0;
    this.state.stamina = Math.round(this.stamina);

    // Speed
    let speed = this.walkSpeed;
    if (isSprint) speed = this.sprintSpeed;
    if (this.isSliding) speed = this.slideSpeed;

    // Horizontal movement
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
      this.playerVel.x *= 0.85;
      this.playerVel.z *= 0.85;
    }

    // Slide
    if (isSlideKey && this.onGround && !this.isSliding && this.stamina > 10) {
      this.isSliding = true;
      this.slideTimer = 0.4;
    }
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.isSliding = false;
    }

    // Gravity
    this.playerVel.y += this.gravity * dt;

    // Jump
    if (isJump && this.onGround && !this.isSliding) {
      this.playerVel.y = this.jumpSpeed;
      this.onGround = false;
    }

    // Apply velocity
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;
    this.playerPos.z += this.playerVel.z * dt;

    // Clamp to terrain bounds
    this.playerPos.x = Math.max(-27, Math.min(27, this.playerPos.x));
    this.playerPos.z = Math.max(-27, Math.min(27, this.playerPos.z));

    // Ground check
    const groundY = this._getTerrainHeight(this.playerPos.x, this.playerPos.z);
    if (this.isSliding) {
      this.playerPos.y = groundY + 0.5;
      this.playerVel.y = 0;
      this.onGround = true;
    } else if (this.playerPos.y <= groundY + this.playerHeight) {
      this.playerPos.y = groundY + this.playerHeight;
      this.playerVel.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Camera
    this.camera.position.copy(this.playerPos);
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Enemies
    this._updateEnemies(dt);

    // Health
    this.state.health = Math.round(this.state.health * 10) / 10;
    if (this.state.health <= 0) {
      this.state.health = 0;
      this.state.gameOver = true;
    }

    this.state.zombiesAlive = this.enemies.filter(e => e.health > 0).length;
    this.callbacks.onStateChange?.({ ...this.state });
  }

  _updateEnemies(dt) {
    const playerXZ = new THREE.Vector3(this.playerPos.x, 0, this.playerPos.z);

    for (const enemy of this.enemies) {
      if (enemy.health <= 0) continue;

      const enemyXZ = new THREE.Vector3(enemy.pos.x, 0, enemy.pos.z);
      const toPlayer = new THREE.Vector3().copy(playerXZ).sub(enemyXZ);
      const dist = toPlayer.length();

      if (dist < 20) {
        toPlayer.normalize();
        const spd = enemy.speed * (dist > 10 ? 1 : 1.3);
        enemy.pos.x += toPlayer.x * spd * dt;
        enemy.pos.z += toPlayer.z * spd * dt;

        const th = this._getTerrainHeight(enemy.pos.x, enemy.pos.z);
        enemy.pos.y = th;
        const bob = Math.sin(Date.now() * 0.005) * 0.06;
        enemy.group.position.set(enemy.pos.x, th + bob, enemy.pos.z);
        enemy.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        // Arm swing
        enemy.arms.forEach((arm, idx) => {
          arm.rotation.z = (idx === 0 ? 1 : -1) * (0.4 + Math.sin(Date.now() * 0.008 + idx) * 0.2);
        });

        // Contact damage
        if (dist < 1.8) {
          enemy.attackTimer -= dt;
          if (enemy.attackTimer <= 0) {
            this.state.health -= 5;
            enemy.attackTimer = 1.5;
          }
        } else {
          enemy.attackTimer = 0;
        }
      }
    }
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
        if (obj.isMesh || obj.isInstancedMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material?.dispose();
          }
        } else if (obj.isGroup) {
          obj.traverse(child => {
            if (child.isMesh) {
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
