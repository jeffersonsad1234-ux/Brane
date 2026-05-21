import * as THREE from "three";

export default class SceneSetup {
  constructor(container) {
    this.container = container;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
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
      this.container.appendChild(this.renderer.domElement);
    } catch (e) {
      this.errorMsg = "WebGL não disponível: " + e.message;
      return false;
    }

    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1a3a);
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
      this.camera.lookAt(0, 0, 0);
    } catch (e) {
      this.errorMsg = "Falha ao criar câmera: " + e.message;
      return false;
    }

    try {
      const amb = new THREE.AmbientLight(0x334466, 0.5);
      this.scene.add(amb);

      const sun = new THREE.DirectionalLight(0xffdd99, 1.2);
      sun.position.set(10, 20, 5);
      this.scene.add(sun);

      const fill = new THREE.DirectionalLight(0x4488ff, 0.3);
      fill.position.set(-10, 5, -10);
      this.scene.add(fill);
    } catch (e) {
      this.errorMsg = "Falha ao criar iluminação: " + e.message;
      return false;
    }

    this.ok = true;
    return true;
  }

  onResize() {
    if (!this.ok) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    if (this.ok) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    if (this.renderer && this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    if (this.renderer) this.renderer.dispose();
    this.ok = false;
  }
}
