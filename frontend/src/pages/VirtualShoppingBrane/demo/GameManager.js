import * as THREE from "three";
import InputManager from "./InputManager.js";
import SceneSetup from "./SceneSetup.js";
import World from "./World.js";
import Player from "./Player.js";
import CameraController from "./CameraController.js";
import EnemyManager from "./EnemyManager.js";
import DebugOverlay from "./DebugOverlay.js";

const PHASES = ["input", "renderer", "world", "player", "camera", "enemies", "debug"];
const MAX_HEALTH = 100;
const STAMINA_DRAIN = 16;
const STAMINA_REGEN = 8;
const STAMINA_MAX = 100;

export default class GameManager {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.input = null;
    this.sceneSetup = null;
    this.world = null;
    this.player = null;
    this.cameraController = null;
    this.enemies = null;
    this.debug = null;

    this.health = MAX_HEALTH;
    this.stamina = STAMINA_MAX;
    this.zombiesAlive = 0;
    this.gameTime = 0;
    this.gameOver = false;

    this.phaseStatus = {};
    for (const p of PHASES) this.phaseStatus[p] = "pending";

    this.running = false;
    this.animId = null;
    this.lastTime = 0;
    this.error = null;

    this._onResize = () => {
      if (this.sceneSetup) this.sceneSetup.onResize();
    };
  }

  init() {
    try { window.addEventListener("resize", this._onResize); } catch {}
    return this._initPhases();
  }

  _initPhases() {
    // Input
    try {
      this.input = new InputManager();
      this.phaseStatus["input"] = "ok";
    } catch { this.phaseStatus["input"] = "fail"; }

    // Renderer + Scene + Camera + Lights
    try {
      this.sceneSetup = new SceneSetup(this.container);
      const ok = this.sceneSetup.init();
      this.phaseStatus["renderer"] = ok ? "ok" : "fail";
      if (!ok) throw new Error(this.sceneSetup.errorMsg || "Renderer failed");
    } catch (e) {
      this.phaseStatus["renderer"] = "fail";
      this._showFatalError("Renderer: " + e.message);
      return false;
    }

    // World
    const getHeight = (x, z) => 0;
    try {
      this.world = new World(this.sceneSetup.scene);
      const ok = this.world.init();
      this.phaseStatus["world"] = ok ? "ok" : "fail";
    } catch { this.phaseStatus["world"] = "fail"; }

    const worldGetHeight = this.world && this.world.ok
      ? (x, z) => this.world.getHeightAt(x, z)
      : () => 0;

    // Player
    try {
      this.player = new Player(this.sceneSetup.scene, worldGetHeight);
      const ok = this.player.init();
      this.phaseStatus["player"] = ok ? "ok" : "fail";
    } catch { this.phaseStatus["player"] = "fail"; }

    // Camera
    try {
      this.cameraController = new CameraController(this.sceneSetup.camera);
      this.phaseStatus["camera"] = "ok";
    } catch { this.phaseStatus["camera"] = "fail"; }

    // Enemies
    try {
      this.enemies = new EnemyManager(
        this.sceneSetup.scene,
        () => this.player && this.player.ok ? this.player.position : new THREE.Vector3(),
        worldGetHeight
      );
      const ok = this.enemies.init(5);
      this.phaseStatus["enemies"] = ok ? "ok" : "fail";
    } catch { this.phaseStatus["enemies"] = "fail"; }

    this.zombiesAlive = this.enemies && this.enemies.ok ? this.enemies.getAliveCount() : 0;

    // Debug
    try {
      this.debug = new DebugOverlay();
      this.phaseStatus["debug"] = "ok";
    } catch { this.phaseStatus["debug"] = "fail"; }

    this._updateDebugStatus();

    this.running = true;
    this.lastTime = performance.now();
    this._loop(this.lastTime);

    if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.getState());
    return true;
  }

  getState() {
    return {
      health: Math.max(0, Math.round(this.health)),
      stamina: Math.max(0, Math.round(this.stamina)),
      zombiesAlive: this.zombiesAlive,
      gameTime: this.gameTime,
      gameOver: this.gameOver,
      phase: this.gameOver ? "gameover" : "playing",
    };
  }

  _emitState() {
    if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.getState());
  }

  _updateDebugStatus() {
    if (!this.debug) return;
    for (const p of PHASES) {
      this.debug.set(p, this.phaseStatus[p] === "ok" ? "✓" : "✗");
    }
  }

  _loop(now) {
    if (!this.running) return;
    this.animId = requestAnimationFrame((t) => this._loop(t));

    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.input) this.input.clearFrame();

    if (this.player && this.player.ok && this.input) {
      const wasSprinting = this.player.sprinting;

      this.player.update(dt, this.input);

      // Stamina drain/regen
      if (this.player.sprinting && this.player.grounded) {
        this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN * dt);
        if (this.stamina <= 0) { this.stamina = 0; }
      } else if (this.stamina < STAMINA_MAX) {
        this.stamina = Math.min(STAMINA_MAX, this.stamina + STAMINA_REGEN * dt);
      }
    }

    // Enemies
    let damage = 0;
    if (this.enemies && this.enemies.ok) {
      damage = this.enemies.update(dt);
      this.zombiesAlive = this.enemies.getAliveCount();
    }

    // Apply damage
    if (damage > 0 && !this.gameOver) {
      this.health = Math.max(0, this.health - damage);
      if (this.health <= 0) {
        this.health = 0;
        this.gameOver = true;
      }
    }

    // Game timer
    if (!this.gameOver) {
      this.gameTime += dt;
    }

    // Update camera
    if (this.cameraController && this.player && this.player.ok) {
      this.cameraController.follow(this.player.position, this.player.velocity);
      this.cameraController.update(dt);
    }

    // Update player follow light
    if (this.sceneSetup && this.player && this.player.ok) {
      this.sceneSetup.updatePlayerLight(this.player.position);
    }

    // Debug
    if (this.debug) {
      this.debug.update(now);
      if (this.player && this.player.ok) {
        const p = this.player.position;
        this.debug.set("pos", `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`);
      }
      if (this.sceneSetup && this.sceneSetup.renderer) {
        const info = this.sceneSetup.renderer.info;
        this.debug.set("tris", info.render.triangles);
        this.debug.set("calls", info.render.calls);
      }
      this.debug.set("hp", this.health.toFixed(0));
      this.debug.set("zombies", this.zombiesAlive);
    }

    // Render
    if (this.sceneSetup) this.sceneSetup.render();

    // Emit state periodically (every 5 frames ≈ 12 times/sec)
    if (this._frameCount === undefined) this._frameCount = 0;
    this._frameCount++;
    if (this._frameCount % 5 === 0) this._emitState();
  }

  _showFatalError(msg) {
    this.error = msg;
    const div = document.createElement("div");
    div.id = "gm-fatal";
    div.style.cssText = `
      position: absolute; inset: 0; z-index: 99999;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px;
      background: #08080e; color: #ee4455;
      font-family: 'Segoe UI', system-ui, sans-serif; text-align: center;
      padding: 40px;
    `;
    div.innerHTML = `
      <div style="font-size:3rem">⚠</div>
      <h2 style="margin:0;font-size:1.3rem;color:#fff">Erro na Engine</h2>
      <p style="margin:0;font-size:.85rem;color:#888;max-width:400px">${msg}</p>
      <p style="margin:0;font-size:.78rem;color:#555">WebGL pode não estar disponível ou o navegador não é compatível.</p>
    `;
    this.container.appendChild(div);
  }

  dispose() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.input) this.input.destroy();
    if (this.player) this.player.dispose();
    if (this.enemies) this.enemies.dispose();
    if (this.world) this.world.dispose();
    if (this.sceneSetup) this.sceneSetup.dispose();
    if (this.debug) this.debug.dispose();
    window.removeEventListener("resize", this._onResize);
    this.phaseStatus = {};
  }
}
