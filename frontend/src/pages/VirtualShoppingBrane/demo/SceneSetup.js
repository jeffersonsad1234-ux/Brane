import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const SUNSET_COLOR = 0x1a0a12;
const FOG_COLOR = 0x1a1218;

export default class SceneSetup {
  constructor(container) {
    this.container = container;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.composer = null;
    this.sunLight = null;
    this.ok = false;
    this.fallbackBloom = false;
    this.errorMsg = null;
  }

  init() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.7;
      this.container.appendChild(this.renderer.domElement);
    } catch (e) {
      this.errorMsg = "WebGL não disponível: " + e.message;
      return false;
    }

    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(SUNSET_COLOR);
      this.scene.fog = new THREE.FogExp2(FOG_COLOR, 0.012);
    } catch (e) {
      this.errorMsg = "Falha ao criar cena: " + e.message;
      return false;
    }

    try {
      this.camera = new THREE.PerspectiveCamera(
        50,
        this.container.clientWidth / this.container.clientHeight,
        0.1,
        200
      );
      this.camera.position.set(8, 6, 10);
    } catch (e) {
      this.errorMsg = "Falha ao criar câmera: " + e.message;
      return false;
    }

    try {
      // Sunset sky: procedural gradient using a large sphere
      this._buildSky();

      // Hemisphere: warm sky, cool ground shadows
      const hemi = new THREE.HemisphereLight(0xff8844, 0x223366, 0.5);
      this.scene.add(hemi);

      // Main sun — low angle sunset
      this.sunLight = new THREE.DirectionalLight(0xff9944, 1.8);
      this.sunLight.position.set(-15, 8, 10);
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(1024, 1024);
      this.sunLight.shadow.camera.near = 0.1;
      this.sunLight.shadow.camera.far = 50;
      this.sunLight.shadow.camera.left = -25;
      this.sunLight.shadow.camera.right = 25;
      this.sunLight.shadow.camera.top = 25;
      this.sunLight.shadow.camera.bottom = -25;
      this.scene.add(this.sunLight);

      // Fill light — cool blue from opposite side
      const fill = new THREE.DirectionalLight(0x4488ff, 0.4);
      fill.position.set(10, 5, -10);
      this.scene.add(fill);

      // Rim light — warm backlight
      const rim = new THREE.DirectionalLight(0xff6633, 0.35);
      rim.position.set(5, 3, -15);
      this.scene.add(rim);

      // Sun glow disc
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xff8844, transparent: true, opacity: 0.12 })
      );
      glow.position.copy(this.sunLight.position).multiplyScalar(2);
      this.scene.add(glow);
    } catch (e) {
      this.errorMsg = "Falha ao criar iluminação: " + e.message;
      return false;
    }

    // Bloom (optional — if fails, render without it)
    try {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
        0.12,
        0.4,
        0.6
      );
      this.composer.addPass(bloom);
      this.composer.addPass(new OutputPass());
    } catch (e) {
      this.composer = null;
      this.fallbackBloom = true;
    }

    this.ok = true;
    return true;
  }

  _buildSky() {
    const geo = new THREE.SphereGeometry(80, 24, 16);
    const colors = new Float32Array(geo.attributes.position.count * 3);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const h = (y / 80 + 1) / 2;

      // Sunset gradient: dark purple at top, orange at horizon, dark at bottom
      let r, g, b;
      if (h > 0.4) {
        const t = (h - 0.4) / 0.6;
        r = 0.15 + t * 0.35;
        g = 0.06 + t * 0.12;
        b = 0.10 + t * 0.30;
      } else {
        const t = h / 0.4;
        r = 0.15 + t * 0.1;
        g = 0.06 + t * 0.05;
        b = 0.10 + t * 0.02;
      }
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(geo, mat);
    sky.position.y = -5;
    this.scene.add(sky);
  }

  onResize() {
    if (!this.ok) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.composer) {
      this.composer.setSize(w, h);
    }
  }

  render() {
    if (!this.ok) return;
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    if (this.composer) {
      try { this.composer.dispose(); } catch {}
    }
    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    if (this.renderer) this.renderer.dispose();
    this.ok = false;
  }
}
