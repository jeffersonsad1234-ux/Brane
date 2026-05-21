import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const SKY_COLOR = 0x1a1828;
const FOG_COLOR = 0x1a1820;

export default class SceneSetup {
  constructor(container) {
    this.container = container;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.composer = null;
    this.sunLight = null;
    this.playerLight = null;
    this.ok = false;
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
      this.renderer.toneMappingExposure = 0.9;
      this.container.appendChild(this.renderer.domElement);
    } catch (e) {
      this.errorMsg = "WebGL não disponível: " + e.message;
      return false;
    }

    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(SKY_COLOR);
      this.scene.fog = new THREE.FogExp2(FOG_COLOR, 0.006);
    } catch (e) {
      this.errorMsg = "Falha ao criar cena: " + e.message;
      return false;
    }

    try {
      this.camera = new THREE.PerspectiveCamera(
        75,
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
      this._buildSky();

      // Hemisphere: warm sky + ground fill
      const hemi = new THREE.HemisphereLight(0xffaa66, 0x446688, 0.8);
      this.scene.add(hemi);

      // Main sun — golden afternoon
      this.sunLight = new THREE.DirectionalLight(0xffcc77, 1.5);
      this.sunLight.position.set(-12, 15, 8);
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(1024, 1024);
      this.sunLight.shadow.camera.near = 0.1;
      this.sunLight.shadow.camera.far = 50;
      this.sunLight.shadow.camera.left = -25;
      this.sunLight.shadow.camera.right = 25;
      this.sunLight.shadow.camera.top = 25;
      this.sunLight.shadow.camera.bottom = -25;
      this.scene.add(this.sunLight);

      // Fill — cool blue
      const fill = new THREE.DirectionalLight(0x88bbff, 0.5);
      fill.position.set(8, 5, -10);
      this.scene.add(fill);

      // Ambient — raise overall brightness
      const amb = new THREE.AmbientLight(0x445566, 0.3);
      this.scene.add(amb);

      // Player follow light (parented to camera later via GameManager)
      this.playerLight = new THREE.PointLight(0xff8844, 0.6, 15);
      this.scene.add(this.playerLight);
    } catch (e) {
      this.errorMsg = "Falha ao criar iluminação: " + e.message;
      return false;
    }

    // Bloom (subtle)
    try {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
        0.08,
        0.3,
        0.5
      );
      this.composer.addPass(bloom);
      this.composer.addPass(new OutputPass());
    } catch (e) {
      this.composer = null;
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

      let r, g, b;
      if (h > 0.4) {
        const t = (h - 0.4) / 0.6;
        r = 0.25 + t * 0.45;
        g = 0.15 + t * 0.25;
        b = 0.20 + t * 0.45;
      } else {
        const t = h / 0.4;
        r = 0.25 + t * 0.15;
        g = 0.15 + t * 0.10;
        b = 0.20 + t * 0.05;
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

  updatePlayerLight(pos) {
    if (this.playerLight) {
      this.playerLight.position.copy(pos);
    }
  }

  onResize() {
    if (!this.ok) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.composer) this.composer.setSize(w, h);
  }

  render() {
    if (!this.ok) return;
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.composer) { try { this.composer.dispose(); } catch {} }
    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    if (this.renderer) this.renderer.dispose();
    this.ok = false;
  }
}
