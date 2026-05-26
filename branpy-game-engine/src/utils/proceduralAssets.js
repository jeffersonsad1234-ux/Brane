import * as THREE from "three";

export function createProceduralEnvMap(renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#111122");

  const geo = new THREE.SphereGeometry(50, 16, 16);
  const mat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    vertexColors: false,
  });
  const colors = [
    { color: "#0a0a1a", i: 0 }, { color: "#111133", i: 1 }, { color: "#0d0d22", i: 2 },
    { color: "#080812", i: 3 }, { color: "#1a1a2e", i: 4 }, { color: "#0a0a1a", i: 5 },
  ];
  const mesh = new THREE.Mesh(geo, mat);
  envScene.add(mesh);

  const light = new THREE.PointLight("#4466aa", 2, 30);
  light.position.set(3, 5, 3);
  envScene.add(light);

  for (let i = 0; i < 12; i++) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.15 + Math.random() * 0.2, 6, 6),
      new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.6 + Math.random() * 0.15, 0.5, 0.3 + Math.random() * 0.2) })
    );
    glow.position.set((Math.random() - 0.5) * 30, Math.random() * 10, (Math.random() - 0.5) * 30);
    envScene.add(glow);
  }

  const envMap = pmrem.fromScene(envScene, 0, 0.1, 100).texture;
  pmrem.dispose();
  return envMap;
}

export function makeNormalMap(size = 128, seed = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = (Math.sin(x * 12.9898 + y * 78.233 + seed * 43.123) * 43758.5453) % 1;
      const r = v * 255;
      const g = v * 255;
      const b = 255;
      ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function makeRoughnessMap(size = 64, roughness = 0.6) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const base = roughness * 255;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const noise = (Math.sin(x * 7.7 + y * 13.3) * 43758.5453) % 1;
      const v = Math.min(255, Math.max(0, base + (noise - 0.5) * 40));
      ctx.fillStyle = `rgb(${v|0},${v|0},${v|0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

export function makeWetNormalMap(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = Math.sin(x * 3.141 + y * 7.293 + 42) * Math.sin(x * 5.871 + y * 2.431 + 11);
      const val = 128 + (n % 1) * 20;
      ctx.fillStyle = `rgb(${val|0},${val|0},255)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}
