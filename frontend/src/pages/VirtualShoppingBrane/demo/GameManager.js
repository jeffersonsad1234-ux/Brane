import InputManager from "./InputManager.js";
import SceneSetup from "./SceneSetup.js";
import World from "./World.js";
import Player from "./Player.js";
import CameraController from "./CameraController.js";
import DebugOverlay from "./DebugOverlay.js";

const PHASES = ["renderer", "scene", "camera", "lights", "world", "player"];

export default class GameManager {
  constructor(container) {
    this.container = container;
    this.input = null;
    this.sceneSetup = null;
    this.world = null;
    this.player = null;
    this.cameraController = null;
    this.debug = null;

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
    try {
      window.addEventListener("resize", this._onResize);
    } catch {}
    return this._initPhases();
  }

  _initPhases() {
    // Phase 1: Input
    try {
      this.input = new InputManager();
      this.phaseStatus["input"] = "ok";
    } catch (e) {
      this.phaseStatus["input"] = "fail";
    }

    // Phase 2: Renderer
    try {
      this.sceneSetup = new SceneSetup(this.container);
      const ok = this.sceneSetup.init();
      this.phaseStatus["renderer"] = ok ? "ok" : "fail";
      if (!ok) throw new Error(this.sceneSetup.errorMsg || "Renderer init failed");
    } catch (e) {
      this.phaseStatus["renderer"] = "fail";
      this._showFatalError("Renderer: " + e.message);
      return false;
    }

    // Phase 3: World (can fail gracefully)
    try {
      this.world = new World(this.sceneSetup.scene);
      const ok = this.world.init();
      this.phaseStatus["world"] = ok ? "ok" : "fail";
    } catch (e) {
      this.phaseStatus["world"] = "fail";
    }

    // Phase 4: Player (can fail gracefully)
    try {
      this.player = new Player(this.sceneSetup.scene);
      const ok = this.player.init();
      this.phaseStatus["player"] = ok ? "ok" : "fail";
    } catch (e) {
      this.phaseStatus["player"] = "fail";
    }

    // Phase 5: Camera
    try {
      this.cameraController = new CameraController(this.sceneSetup.camera);
      this.phaseStatus["camera"] = "ok";
    } catch (e) {
      this.phaseStatus["camera"] = "fail";
    }

    // Phase 6: Debug
    try {
      this.debug = new DebugOverlay();
      this.phaseStatus["debug"] = "ok";
    } catch (e) {
      this.phaseStatus["debug"] = "fail";
    }

    // Update debug with phase status
    this._updateDebugStatus();

    // Start loop
    this.running = true;
    this.lastTime = performance.now();
    this._loop(this.lastTime);

    return true;
  }

  _updateDebugStatus() {
    if (!this.debug) return;
    for (const p of PHASES) {
      this.debug.set(p, this.phaseStatus[p] === "ok" ? "✓" : "✗");
    }
    if (this.player && this.player.ok) {
      this.debug.set("pos", "0, 0, 0");
    }
  }

  _loop(now) {
    if (!this.running) return;
    this.animId = requestAnimationFrame((t) => this._loop(t));

    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    // Update input
    if (this.input) this.input.clearFrame();

    // Update player
    if (this.player && this.player.ok && this.input) {
      this.player.update(dt, this.input);
    }

    // Update camera
    if (this.cameraController && this.player && this.player.ok) {
      this.cameraController.follow(this.player.position);
      this.cameraController.update(dt);
    }

    // Update debug
    if (this.debug) {
      this.debug.update(now);
      if (this.player && this.player.ok) {
        const p = this.player.position;
        this.debug.set("pos", `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`);
      }
      if (this.sceneSetup) {
        if (this.sceneSetup.renderer) {
          const info = this.sceneSetup.renderer.info;
          this.debug.set("tris", info.render.triangles);
          this.debug.set("calls", info.render.calls);
        }
      }
    }

    // Render
    if (this.sceneSetup) {
      this.sceneSetup.render();
    }
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
    if (this.world) this.world.dispose();
    if (this.sceneSetup) {
      this.sceneSetup.dispose();
    }
    if (this.debug) this.debug.dispose();
    window.removeEventListener("resize", this._onResize);
    this.phaseStatus = {};
  }
}
