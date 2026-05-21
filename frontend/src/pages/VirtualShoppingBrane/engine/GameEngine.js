import * as THREE from "three";
import { W, BLOCK, SKIN, BLOCK_TYPES, RES_COLORS, RES_HP } from "./constants.js";
import { makeEnvMap } from "./procgen.js";
import { getHeight, buildTerrain } from "./terrain.js";
import { buildVegetation, buildStructures, spawnAnimals, makeClouds, makeBirds, makeSky, makeSun } from "./world.js";
import { initAudio, playMine, playCollect, spawnParticles, updateParticles, spawnItemDrop, updateDrops, makeDamageBar, updateDamageBar } from "./world.js";
import { makePlayer, makeShadow } from "./player.js";

// ─── GAME ENGINE ────────────────────────────────────────
export default class GameEngine {
  constructor(mountEl, callbacks = {}) {
    this.mount = mountEl;
    this.cb = callbacks;
    this.keys = {};
    this.joy = { x: 0, y: 0 };
    this.yaw = 0;
    this.sceneRef = { scene: null, renderer: null, camera: null, world: null };
    this.playerRef = null;
    this.animId = null;
    this.worldOk = false;
    this.mining = { active: false, target: null, progress: 0 };
    this.dmgBar = null;
    this.placedBlocks = [];
    this.selectedSlot = 0;
    this.items = [];
    this.debugData = { camX: 0, camY: 0, camZ: 0, meshes: 0, worldOk: false, phase: "init" };
    this.gameTime = 6;
    this.pShadow = null;
    this.clouds = [];
    this.animals = [];
    this.birds = [];
    this.skyDome = null;
    this.sunMesh = null;
    this.debugMode = false;
    this.gridHelper = null;
    this.axesHelper = null;

    // Player state
    this.playerVel = new THREE.Vector3();
    this.isGrounded = true;
    this.isCrouching = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.jumpTimer = 0;
    this.landTimer = 0;
    this.walkPhase = 0;
    this.wasGrounded = true;
    this.moveDir = new THREE.Vector3();
    this.targetFov = 55;
    this.camHOffset = 0;
    this.camDist = 8;
    this.camHeight = 5;
    this.camPos = new THREE.Vector3(0, 5, 8);
    this.camTarget = new THREE.Vector3();

    // Survival
    this.health = 100;
    this.hunger = 100;
    this.energy = 100;
    this.coins = 100;
    this.level = 1;
    this.xp = 0;
    this.survivalTimer = 0;

    // Load saved data
    try {
      const saved = JSON.parse(localStorage.getItem(SKIN));
      if (saved) {
        this.coins = saved.coins || 100;
        this.level = saved.level || 1;
        this.xp = saved.xp || 0;
        if (saved.items) this.items = saved.items;
      }
    } catch {}
  }

  save() {
    try {
      localStorage.setItem(SKIN, JSON.stringify({
        coins: this.coins, level: this.level, xp: this.xp, items: this.items,
      }));
    } catch {}
  }

  // ─── PHASED INIT ──────────────────────────────────────
  init() {
    console.log("[ENGINE] === INIT START ===");
    const mount = this.mount;
    const W2 = mount.clientWidth, H2 = mount.clientHeight;
    let ok = true;

    // Phase 1: Renderer
    this.debugData.phase = "renderer";
    try {
      console.log("[ENGINE] Phase 1: Creating renderer...");
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W2, H2);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);
      this.renderer = renderer;
      console.log("[ENGINE] Renderer OK");
    } catch (e) {
      console.error("[ENGINE] FATAL: Renderer creation failed:", e);
      mount.innerHTML = `<div style="color:#fff;background:#c00;padding:20px;font-family:sans-serif">
        <h2>❌ WebGL não disponível</h2><p>Seu navegador não suporta WebGL.</p>
        <pre>${e.message}</pre></div>`;
      return false;
    }

    // Phase 2: Scene + Camera
    this.debugData.phase = "scene";
    try {
      console.log("[ENGINE] Phase 2: Creating scene and camera...");
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB);
      // Fog disabled for debug visibility — re-enable later
      // scene.fog = new THREE.FogExp2(0x87CEEB, 0.001);
      scene.environment = makeEnvMap();
      this.scene = scene;

      const camera = new THREE.PerspectiveCamera(55, W2 / H2, 0.1, 250);
      camera.position.set(0, 15, 20);
      camera.lookAt(0, 0, 0);
      this.camera = camera;

      // Raycaster
      this.raycaster = new THREE.Raycaster();
      console.log("[ENGINE] Scene + Camera OK");
    } catch (e) {
      console.error("[ENGINE] FATAL: Scene creation failed:", e);
      this.renderer.domElement.remove();
      mount.innerHTML = `<div style="color:#fff;background:#c00;padding:20px;font-family:sans-serif">
        <h2>❌ Erro de inicialização</h2><pre>${e.message}</pre></div>`;
      return false;
    }

    // Phase 3: Lighting
    this.debugData.phase = "lighting";
    try {
      console.log("[ENGINE] Phase 3: Creating lights...");
      this.amb = new THREE.AmbientLight(0xffffff, 0.35);
      this.scene.add(this.amb);
      this.hemi = new THREE.HemisphereLight(0x88CCFF, 0xCC9966, 0.25);
      this.scene.add(this.hemi);
      this.sun = new THREE.DirectionalLight(0xFFCC88, 1.0);
      this.sun.position.set(20, 35, 15);
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(1024, 1024);
      this.sun.shadow.camera.near = 0.5; this.sun.shadow.camera.far = 60;
      this.sun.shadow.camera.left = -25; this.sun.shadow.camera.right = 25;
      this.sun.shadow.camera.top = 25; this.sun.shadow.camera.bottom = -25;
      this.sun.shadow.bias = -0.001;
      this.scene.add(this.sun);
      const fill = new THREE.DirectionalLight(0x88AAEE, 0.15);
      fill.position.set(-10, 15, -15);
      this.scene.add(fill);
      console.log("[ENGINE] Lighting OK");
    } catch (e) {
      console.error("[ENGINE] Lighting failed (non-fatal):", e);
    }

    // Phase 4: Fallback (always safe)
    this.debugData.phase = "fallback";
    console.log("[ENGINE] Phase 4: Creating fallback...");
    try {
      const fbMat = new THREE.MeshBasicMaterial({ color: 0x44cc44, side: THREE.DoubleSide });
      this.fbGround = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), fbMat);
      this.fbGround.rotation.x = -Math.PI / 2;
      this.fbGround.position.y = -1;
      this.fbGround.name = "fallback";
      this.scene.add(this.fbGround);
      this.fbCube = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
      this.fbCube.position.set(0, -0.7, 0);
      this.fbCube.name = "fallback";
      this.scene.add(this.fbCube);
      console.log("[ENGINE] Fallback OK");
    } catch (e) {
      console.error("[ENGINE] Fallback creation failed (non-fatal):", e);
    }

    // Phase 5: Terrain
    this.debugData.phase = "terrain";
    try {
      console.log("[ENGINE] Phase 5: Building terrain...");
      const terrain = buildTerrain(this.scene);
      this.world = terrain;
      this.worldOk = true;
      if (this.fbGround) { this.fbGround.visible = false; this.fbGround.position.y = -999; }
      if (this.fbCube) { this.fbCube.visible = false; this.fbCube.position.y = -999; }
      console.log("[ENGINE] Terrain OK — ground mesh children:", this.scene.children.filter(c => c.isMesh).length);
    } catch (e) {
      console.error("[ENGINE] Terrain failed (using fallback):", e);
      this.worldOk = false;
      this.world = null;
      // Ensure fallback is big and visible
      if (this.fbGround) {
        this.fbGround.position.y = -1;
        this.fbGround.visible = true;
        this.fbGround.scale.set(3, 1, 3);
      }
      if (this.fbCube) {
        this.fbCube.position.set(0, 0, 0);
        this.fbCube.visible = true;
        this.fbCube.scale.set(3, 3, 3);
      }
      // Extra bright orange plane right under camera
      try {
        const emg = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 40),
          new THREE.MeshBasicMaterial({ color: 0xff8800, side: THREE.DoubleSide })
        );
        emg.rotation.x = -Math.PI / 2;
        emg.position.set(0, -2, 0);
        emg.name = "emergency_floor";
        this.scene.add(emg);
        console.log("[ENGINE] Emergency floor added");
      } catch {}
    }

    // Phase 6: Debug helpers (hide water for visibility)
    try {
      if (this.world?.water) {
        this.world.water.visible = false;
        console.log("[ENGINE] Water hidden for debug");
      }
      this.gridHelper = new THREE.GridHelper(200, 40, 0xff4444, 0x444444);
      this.gridHelper.position.y = -2;
      this.gridHelper.visible = this.debugMode;
      this.scene.add(this.gridHelper);
      this.axesHelper = new THREE.AxesHelper(10);
      this.axesHelper.visible = this.debugMode;
      this.scene.add(this.axesHelper);
    } catch (e) { console.warn("[ENGINE] Debug helpers failed:", e); }

    // Phase 7: Vegetation
    this.debugData.phase = "veg";
    try {
      if (this.worldOk) {
        console.log("[ENGINE] Phase 6: Building vegetation...");
        const veg = buildVegetation(this.scene);
        this.trees = veg.trees;
        console.log("[ENGINE] Vegetation OK");
      }
    } catch (e) {
      console.error("[ENGINE] Vegetation failed (non-fatal):", e);
    }

    // Phase 7: Structures
    this.debugData.phase = "structures";
    try {
      if (this.worldOk) {
        console.log("[ENGINE] Phase 7: Building structures...");
        buildStructures(this.scene);
        console.log("[ENGINE] Structures OK");
      }
    } catch (e) {
      console.error("[ENGINE] Structures failed (non-fatal):", e);
    }

    // Phase 8: Player (spawn 3m above terrain for visibility)
    this.debugData.phase = "player";
    try {
      const spawnH = this.worldOk ? getHeight(0, 0) : 0;
      console.log("[ENGINE] Phase 8: Creating player at Y=" + (spawnH + 3) + " (terrain=" + spawnH + ")");
      const player = makePlayer(this.scene);
      player.group.position.set(0, spawnH + 3, 0);
      this.player = player;
      this.pShadow = makeShadow();
      this.scene.add(this.pShadow);
      console.log("[ENGINE] Player OK");
    } catch (e) {
      console.error("[ENGINE] Player creation failed:", e);
      this.player = null;
    }

    // Phase 9: Atmosphere
    this.debugData.phase = "atmosphere";
    try {
      console.log("[ENGINE] Phase 9: Creating atmosphere...");
      this.clouds = makeClouds(this.scene);
      if (this.worldOk) {
        this.animals = spawnAnimals(this.scene);
        this.birds = makeBirds(this.scene);
        this.sunMesh = makeSun(this.scene);
        this.skyDome = makeSky(this.scene);
      }
      console.log("[ENGINE] Atmosphere OK");
    } catch (e) {
      console.error("[ENGINE] Atmosphere failed (non-fatal):", e);
    }

    // Phase 10: Damage bar
    this.debugData.phase = "dmgbar";
    try {
      this.dmgBar = makeDamageBar(this.scene);
    } catch (e) { console.warn("[ENGINE] Damage bar failed:", e); }

    // Phase 11: Resize handler
    window.addEventListener("resize", this._onResize);

    // Phase 12: Input
    this._setupInput();

    // Phase 13: Store refs
    this.sceneRef = {
      scene: this.scene, renderer: this.renderer, camera: this.camera,
      sun: this.sun, world: this.world, raycaster: this.raycaster,
      player: this.player,
    };

    // Phase 14: Start loop
    this.frameCount = 0;
    this.prevTime = performance.now();
    this._loop(performance.now());

    this.debugData.phase = "running";
    console.log("[ENGINE] === INIT COMPLETE === worldOk=" + this.worldOk);
    return true;
  }

  // ─── RESIZE ───────────────────────────────────────────
  _onResize = () => {
    if (!this.renderer || !this.camera || !this.mount) return;
    const W2 = this.mount.clientWidth, H2 = this.mount.clientHeight;
    this.renderer.setSize(W2, H2);
    this.camera.aspect = W2 / H2;
    this.camera.updateProjectionMatrix();
  };

  // ─── INPUT ────────────────────────────────────────────
  _setupInput() {
    this._onKeyDown = (e) => {
      this.keys[e.code] = true;
      if (e.code === "F1") {
        this.debugMode = !this.debugMode;
        console.log("[ENGINE] Debug mode:", this.debugMode);
        if (this.gridHelper) this.gridHelper.visible = this.debugMode;
        if (this.axesHelper) this.axesHelper.visible = this.debugMode;
        if (this.world?.water) {
          this.world.water.visible = !this.debugMode; // hide water in debug
        }
      }
      if (e.code >= "Digit1" && e.code <= "Digit5") {
        this.selectedSlot = parseInt(e.code[5]) - 1;
      }
    };
    this._onKeyUp = (e) => { this.keys[e.code] = false; };
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    this._onMouseMove = (e) => {
      this.yaw -= e.movementX * 0.003;
    };
    document.addEventListener("mousemove", this._onMouseMove);

    this._onMouseDown = (e) => {
      if (e.button === 0) this._startMine();
      else if (e.button === 2) this._placeBlock();
    };
    this._onMouseUp = () => { this.mining = { active: false, target: null, progress: 0 }; };
    this._onCtx = (e) => e.preventDefault();
    this.mount.addEventListener("mousedown", this._onMouseDown);
    this.mount.addEventListener("contextmenu", this._onCtx);
    window.addEventListener("mouseup", this._onMouseUp);
  }

  _removeInput() {
    try {
      window.removeEventListener("keydown", this._onKeyDown);
      window.removeEventListener("keyup", this._onKeyUp);
      document.removeEventListener("mousemove", this._onMouseMove);
      window.removeEventListener("mouseup", this._onMouseUp);
      if (this.mount) {
        this.mount.removeEventListener("mousedown", this._onMouseDown);
        this.mount.removeEventListener("contextmenu", this._onCtx);
      }
    } catch {}
  }

  // ─── MINING ───────────────────────────────────────────
  _mineableMeshes() {
    if (!this.world) return [];
    const meshes = [];
    for (const t of this.world.trees || []) meshes.push(t);
    if (this.world.rocks) for (const r of this.world.rocks) meshes.push(r);
    return meshes;
  }

  _startMine() {
    initAudio();
    if (!this.world || !this.player) return;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(this._mineableMeshes());
    if (hits.length === 0) return;
    const res = hits[0].object.userData?.resource;
    if (!res || res.hp <= 0) return;
    playMine();
    spawnParticles(this.scene, hits[0].point, RES_COLORS[res.type] || 0xffffff, 6);
    this.mining = { active: true, target: res, progress: 0 };
  }

  _placeBlock() {
    if (!this.world?.ground || !this.player) return;
    const item = this.items[this.selectedSlot];
    if (!item || !BLOCK_TYPES[item.id]) return;
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const bt = BLOCK_TYPES[item.id];
    const targets = [this.world.ground, ...this.placedBlocks.map(b => b.mesh)];
    const hits = this.raycaster.intersectObjects(targets);
    if (hits.length === 0) return;
    const hit = hits[0];
    const normal = hit.face.normal.clone();
    const pos = hit.point.clone().add(normal.multiplyScalar(BLOCK * 0.5 + 0.01));
    const sx = Math.round(pos.x / BLOCK) * BLOCK;
    const sy = Math.round(pos.y / BLOCK) * BLOCK;
    const sz = Math.round(pos.z / BLOCK) * BLOCK;
    if (this.placedBlocks.some(b => Math.abs(b.x - sx) < 0.01 && Math.abs(b.y - sy) < 0.01 && Math.abs(b.z - sz) < 0.01)) return;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(BLOCK * 0.95, BLOCK * 0.95, BLOCK * 0.95),
      new THREE.MeshStandardMaterial({ color: bt.color, roughness: bt.roughness, flatShading: true, metalness: bt.metalness || 0 })
    );
    block.position.set(sx, sy, sz);
    block.castShadow = true; block.receiveShadow = true;
    this.scene.add(block);
    this.placedBlocks.push({ x: sx, y: sy, z: sz, type: item.id, mesh: block });
    item.c--;
    if (item.c <= 0) { this.items.splice(this.selectedSlot, 1); if (this.selectedSlot >= this.items.length) this.selectedSlot = Math.max(0, this.items.length - 1); }
    this.cb.onItems?.(this.items);
    this.cb.onMessage?.(`${bt.name} colocada`);
  }

  // ─── GAME LOOP ────────────────────────────────────────
  _loop = (now) => {
    this.animId = requestAnimationFrame(this._loop);
    this.frameCount++;
    const dt = Math.min(0.05, (now - this.prevTime) / 1000);
    this.prevTime = now;

    // Day/night
    this.gameTime += dt * 0.008;
    const hours = this.gameTime % 24;
    const angle = (hours / 24) * Math.PI * 2 - Math.PI / 2;
    const sunY = Math.sin(angle) * 35 + 15;
    const sunX = Math.cos(angle) * 35;
    this.sun.position.set(sunX, Math.max(1, sunY), 0);

    let sunInt, sunCol, ambInt, hemiInt;
    if (hours < 5.5) {
      sunInt = 0.08; sunCol = new THREE.Color(0x446688); ambInt = 0.06; hemiInt = 0.08;
      this.scene.background.setHex(0x0a0a1a);
    } else if (hours < 7.5) {
      const t = (hours - 5.5) / 2;
      sunInt = 0.08 + t * 1.0; sunCol = new THREE.Color().lerpColors(new THREE.Color(0xFF6633), new THREE.Color(0xFFCC88), t);
      ambInt = 0.06 + t * 0.3; hemiInt = 0.08 + t * 0.22;
      this.scene.background.setHSL(0.6 - t * 0.08, 0.5 - t * 0.2, 0.1 + t * 0.25);
    } else if (hours < 17) {
      sunInt = 1.2; sunCol = new THREE.Color(0xFFCC88); ambInt = 0.4; hemiInt = 0.32;
      this.scene.background.setHex(0x87CEEB);
    } else if (hours < 19.5) {
      const t = (hours - 17) / 2.5;
      sunInt = 1.2 - t * 1.12; sunCol = new THREE.Color().lerpColors(new THREE.Color(0xFFCC88), new THREE.Color(0xFF5522), t);
      ambInt = 0.4 - t * 0.34; hemiInt = 0.32 - t * 0.24;
      this.scene.background.setHSL(0.58 + t * 0.08, 0.4 + t * 0.2, 0.55 - t * 0.3);
    } else {
      sunInt = 0.08; sunCol = new THREE.Color(0x446688); ambInt = 0.06; hemiInt = 0.08;
      this.scene.background.setHex(0x0a0a1a);
    }
    this.sun.color.copy(sunCol);
    this.sun.intensity = sunInt;
    this.amb.intensity = ambInt;
    this.hemi.intensity = hemiInt;

    // Notify time
    this.cb.onTime?.(hours / 24);

    // ─── PHYSICS ────────────────────────────────────────
    const tgt = this.player?.group;
    if (tgt) {
      const sprinting = this.keys["ShiftLeft"] || this.keys["ShiftRight"];
      const crouching = this.keys["ControlLeft"] || this.keys["ControlRight"] || this.keys["KeyC"];
      const jumping = this.keys["Space"];
      const gravity = 16, jumpSpeed = 5, accel = 14, friction = 10;
      const maxWalk = 3, maxRun = 5.5, maxSprint = 8.5;

      const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
      const inputDir = new THREE.Vector2();
      if (this.keys["KeyW"] || this.keys["ArrowUp"]) inputDir.y += 1;
      if (this.keys["KeyS"] || this.keys["ArrowDown"]) inputDir.y -= 1;
      if (this.keys["KeyA"] || this.keys["ArrowLeft"]) inputDir.x -= 1;
      if (this.keys["KeyD"] || this.keys["ArrowRight"]) inputDir.x += 1;

      // Mobile
      if (Math.abs(this.joy.x) > 0.1 || Math.abs(this.joy.y) > 0.1) {
        inputDir.x += this.joy.x; inputDir.y += this.joy.y;
      }

      if (inputDir.lengthSq() > 1) inputDir.normalize();

      const wishDir = new THREE.Vector3().addScaledVector(fwd, inputDir.y).addScaledVector(right, inputDir.x);
      const hasInput = wishDir.lengthSq() > 0.001;
      if (hasInput) { wishDir.normalize(); this.moveDir.copy(wishDir); }

      // Slide
      if (sprinting && crouching && !this.isSliding && this.isGrounded && hasInput) {
        this.isSliding = true; this.slideTimer = 0;
        this.isCrouching = false;
      }
      if (this.isSliding) {
        this.slideTimer += dt;
        if (this.slideTimer > 0.4 || !hasInput) { this.isSliding = false; this.isCrouching = crouching; }
        else { wishDir.copy(this.moveDir); }
      }
      this.isCrouching = this.isSliding ? false : crouching;

      // Ground
      const gh = this.worldOk ? getHeight(tgt.x, tgt.z) : 0;
      this.wasGrounded = this.isGrounded;
      if (tgt.y <= gh + 0.05) {
        if (!this.wasGrounded && this.playerVel.y < -2) { this.landTimer = 0.3; }
        if (!this.isGrounded) { tgt.y = gh; this.playerVel.y = 0; }
        this.isGrounded = true;
      }
      if (this.isGrounded && jumping && !this.isSliding) {
        this.playerVel.y = jumpSpeed; this.isGrounded = false; this.jumpTimer = 0;
      }

      let maxSpeed = this.isSliding ? maxSprint * 0.9 : sprinting ? (crouching ? maxRun * 0.5 : maxSprint) : (crouching ? maxWalk * 0.5 : maxWalk);
      if (!this.isGrounded) maxSpeed *= 1.2;
      const curSpeed = new THREE.Vector2(this.playerVel.x, this.playerVel.z).length();

      if (hasInput && !this.isSliding) {
        const acc = accel * dt;
        const newVx = this.playerVel.x + wishDir.x * acc;
        const newVz = this.playerVel.z + wishDir.z * acc;
        if (new THREE.Vector2(newVx, newVz).length() <= maxSpeed || curSpeed > maxSpeed) {
          this.playerVel.x = newVx; this.playerVel.z = newVz;
        } else {
          const scale = maxSpeed / curSpeed;
          this.playerVel.x *= scale; this.playerVel.z *= scale;
        }
      }

      if (!hasInput || this.isSliding) {
        const fric = (this.isSliding ? 1.5 : friction) * dt;
        const cs = curSpeed;
        if (cs > fric) { const s = 1 - fric / cs; this.playerVel.x *= s; this.playerVel.z *= s; }
        else { this.playerVel.x = 0; this.playerVel.z = 0; }
      }

      this.playerVel.y -= gravity * dt;
      tgt.x += this.playerVel.x * dt;
      tgt.z += this.playerVel.z * dt;

      const newH = this.worldOk ? getHeight(tgt.x, tgt.z) : 0;
      tgt.y += this.playerVel.y * dt;
      if (tgt.y < newH) { tgt.y = newH; this.playerVel.y = 0; this.isGrounded = true; }
      if (this.isGrounded) { tgt.y = newH; }

      // Face movement direction
      const hSpeed = Math.sqrt(this.playerVel.x * this.playerVel.x + this.playerVel.z * this.playerVel.z);
      const isMoving = hSpeed > 0.1;
      if (isMoving) {
        tgt.rotation.y = Math.atan2(this.playerVel.x, this.playerVel.z);
        this.walkPhase += dt * hSpeed * 2.5;
      } else { this.walkPhase += dt * 0.3; }

      if (this.landTimer > 0) this.landTimer -= dt;

      // ─── PLAYER ANIMATION ───
      const p = this.player;
      if (p) {
        const isSl = this.isSliding;
        const sp = sprinting;
        const breathe = Math.sin(performance.now() * 0.002) * 0.015;
        const headTilt = Math.sin(performance.now() * 0.0015) * 0.02;
        const swingAmp = isSl ? 0.05 : sp ? 0.35 : 0.2;
        if (isMoving && this.isGrounded) {
          const swing = Math.sin(this.walkPhase) * swingAmp;
          p.lArm.rotation.x = swing;
          p.rArm.rotation.x = -swing;
          p.lLeg.rotation.x = -swing * 0.5;
          p.rLeg.rotation.x = swing * 0.5;
          p.body.position.y = 0.8 + Math.abs(Math.sin(this.walkPhase)) * (sp ? 0.06 : 0.03);
          p.head.position.y = 1.3 + breathe;
        } else if (isSl) {
          p.lArm.rotation.x = -0.5; p.rArm.rotation.x = -0.5;
          p.lLeg.rotation.x = 0.3; p.rLeg.rotation.x = 0.3;
          p.body.position.y = 0.5;
          p.head.position.y = 1.0;
        } else if (!this.isGrounded) {
          p.lArm.rotation.x = -0.3; p.rArm.rotation.x = -0.3;
          p.lLeg.rotation.x = 0.1; p.rLeg.rotation.x = 0.1;
          p.body.position.y = 0.8;
          p.head.position.y = 1.3 + breathe;
        } else {
          const idleSwing = Math.sin(performance.now() * 0.0008) * 0.03;
          p.lArm.rotation.x = idleSwing + breathe;
          p.rArm.rotation.x = -idleSwing + breathe;
          p.lLeg.rotation.x = -idleSwing * 0.3;
          p.rLeg.rotation.x = idleSwing * 0.3;
          p.body.position.y = 0.8 + breathe * 0.5 + (this.landTimer > 0 ? Math.sin(this.landTimer * 20) * 0.04 : 0);
          p.head.position.y = 1.3 + breathe;
          p.head.rotation.x = headTilt;
        }
      }

      // ─── CAMERA ───
      this.targetFov = sprinting ? 63 : 55;
      this.camera.fov += (this.targetFov - this.camera.fov) * dt * 3;
      this.camera.updateProjectionMatrix();

      const targetHOffset = this.isSliding ? -0.6 : this.isCrouching ? -0.35 : 0;
      this.camHOffset += (targetHOffset - this.camHOffset) * dt * 6;

      const tgtDist = sprinting ? 10 : 8;
      this.camDist += (tgtDist - this.camDist) * dt * 2;
      const camHeightBase = this.camHeight;

      const targetPos = new THREE.Vector3(
        tgt.x + Math.sin(this.yaw) * this.camDist,
        tgt.y + 1 + this.camHOffset + camHeightBase - 1,
        tgt.z + Math.cos(this.yaw) * this.camDist
      );
      this.camPos.lerp(targetPos, 1 - Math.pow(0.01, dt));
      this.camera.position.copy(this.camPos);
      this.camTarget.set(tgt.x, tgt.y + 1 + this.camHOffset * 0.5, tgt.z);
      this.camera.lookAt(this.camTarget);

      if (sprinting && isMoving && this.isGrounded) {
        this.camera.position.y += Math.sin(this.walkPhase * 2) * 0.003;
      }

      // Player shadow
      if (this.pShadow) {
        this.pShadow.position.set(tgt.x, tgt.y + 0.05, tgt.z);
      }
    }

    // ─── CLOUDS ───
    for (const c of this.clouds) {
      c.sprite.position.x += c.dx * dt * c.speed;
      if (c.sprite.position.x > W + 20) c.sprite.position.x = -(W + 20);
      if (c.sprite.position.x < -(W + 20)) c.sprite.position.x = W + 20;
    }

    // ─── ANIMALS ───
    for (const a of this.animals) {
      a.phase += dt * a.speed * 0.2;
      a.group.position.x = a.ax + Math.sin(a.phase) * 2;
      a.group.position.z = a.az + Math.cos(a.phase * 0.7) * 2;
      a.group.position.y = this.worldOk ? getHeight(a.group.position.x, a.group.position.z) : 0;
    }

    // ─── BIRDS ───
    const birdTime = performance.now() * 0.001;
    for (const b of this.birds) {
      b.g.position.x = b.cx + Math.sin(birdTime * b.speed + b.phase) * 6;
      b.g.position.z = b.cz + Math.cos(birdTime * b.speed * 0.7 + b.phase) * 6;
      b.g.position.y = b.cy + Math.sin(birdTime * b.speed * 0.5 + b.phase) * 2;
      const wingAngle = Math.sin(birdTime * 3 + b.phase) * 0.5;
      b.lWing.rotation.z = 0.3 + wingAngle;
      b.rWing.rotation.z = -0.3 - wingAngle;
    }

    // ─── WATER ───
    if (this.world?.water?.geometry?.attributes?.position) {
      const wp = this.world.water.geometry.attributes.position;
      const wt = performance.now() * 0.001;
      for (let i = 0; i < wp.count; i++) {
        const wx = wp.getX(i), wz = wp.getZ(i);
        wp.setY(i, Math.sin(wx * 0.08 + wt * 0.8) * 0.08 + Math.cos(wz * 0.1 + wt * 0.6) * 0.06);
      }
      wp.needsUpdate = true;
      this.world.water.geometry.computeVertexNormals();
    }

    // ─── PARTICLES ───
    updateParticles(dt);

    // ─── MINING PROGRESS ───
    if (this.mining.active && this.mining.target) {
      this.mining.progress += dt;
      if (this.dmgBar && this.mining.target.mesh) {
        updateDamageBar(this.dmgBar, this.mining.target.mesh.position, this.mining.target.hp - this.mining.progress * 2, this.mining.target.maxHp);
      }
      if (this.mining.progress * 2 >= this.mining.target.hp || this.mining.target.hp <= 0) {
        if (this.mining.target.mesh.parent) {
          spawnParticles(this.scene, this.mining.target.mesh.position, RES_COLORS[this.mining.target.type] || 0xffffff, 8);
          spawnItemDrop(this.scene, this.mining.target.mesh.position, this.mining.target.type, 1);
          this.scene.remove(this.mining.target.mesh);
          this.mining.target.mesh.geometry.dispose();
        }
        this.mining = { active: false, target: null, progress: 0 };
        if (this.dmgBar) this.dmgBar.sprite.visible = false;
      }
    }

    // ─── ITEM DROPS ───
    if (this.player) {
      updateDrops(this.player.group.position, dt, (itemId, count) => {
        playCollect();
        const idx = this.items.findIndex(it => it.id === itemId);
        if (idx >= 0) { this.items[idx].c += count; }
        else {
          const icon = itemId === "wood" ? "🪵" : itemId === "stone" ? "🪨" : itemId === "crystal" ? "💎" : "⬛";
          this.items.push({ id: itemId, n: icon, i: icon, c: count });
        }
        this.cb.onItems?.(this.items);
        this.cb.onMessage?.(`+${count} ${itemId === "wood" ? "🪵" : itemId === "stone" ? "🪨" : itemId === "crystal" ? "💎" : "⬛"}`);
      });
    }

    // ─── SURVIVAL ───
    this.survivalTimer += dt;
    if (this.survivalTimer > 2) {
      this.survivalTimer = 0;
      // Passive hunger drain
      if (this.hunger > 0) this.hunger = Math.max(0, this.hunger - 0.2);
      if (this.energy < 100) this.energy = Math.min(100, this.energy + 0.3);
      if (this.hunger <= 0 && this.health > 0) this.health = Math.max(0, this.health - 0.5);
      if (this.hunger > 50 && this.health < 100) this.health = Math.min(100, this.health + 0.2);
      this.cb.onHealth?.(Math.round(this.health));
      this.cb.onHunger?.(Math.round(this.hunger));
      this.cb.onEnergy?.(Math.round(this.energy));
    }

    // ─── DEBUG (every 30 frames) ───
    if (this.frameCount % 10 === 0) {
      const pp = this.player?.group?.position;
      this.debugData = {
        camX: this.camera.position.x.toFixed(1),
        camY: this.camera.position.y.toFixed(1),
        camZ: this.camera.position.z.toFixed(1),
        pX: pp ? pp.x.toFixed(1) : "?",
        pY: pp ? pp.y.toFixed(1) : "?",
        pZ: pp ? pp.z.toFixed(1) : "?",
        meshes: this.scene.children.filter(c => c.isMesh).length,
        worldOk: this.worldOk,
        phase: this.debugData.phase,
        terrainH: this.worldOk ? getHeight(pp?.x || 0, pp?.z || 0).toFixed(1) : "?",
      };
    }

    // ─── RENDER ───
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (e) {
      console.error("[ENGINE] Render error:", e);
    }
  };

  // ─── DISPOSE ──────────────────────────────────────────
  dispose() {
    console.log("[ENGINE] Disposing...");
    if (this.animId) cancelAnimationFrame(this.animId);
    this._removeInput();
    window.removeEventListener("resize", this._onResize);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement?.remove();
    }
    this.scene = null;
    this.camera = null;
    this.player = null;
    console.log("[ENGINE] Disposed");
  }

  // ─── GET STATE FOR REACT ──────────────────────────────
  getState() {
    const h = this.gameTime % 24;
    return {
      health: Math.round(this.health),
      hunger: Math.round(this.hunger),
      energy: Math.round(this.energy),
      coins: this.coins,
      level: this.level,
      xp: this.xp,
      hour: Math.floor(h),
      min: Math.floor((h % 1) * 60),
      items: this.items,
      selectedSlot: this.selectedSlot,
      debug: this.debugData,
    };
  }
}
