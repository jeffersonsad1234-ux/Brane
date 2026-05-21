import * as THREE from "three";
import { fbm } from "./noise.js";
import { W, BLOCK } from "./constants.js";

export function getHeight(x, z) {
  const dw = fbm(x * 0.004 + 1.5, z * 0.004 + 1.5, 4) * 20;
  const dw2 = fbm(x * 0.005 + 3.7, z * 0.005 + 3.7, 4) * 15;
  const wx = x + dw, wz = z + dw2;
  const base = fbm(wx * 0.008, wz * 0.008, 6) * 3.2 - 0.3;
  const ridge = 1 - Math.abs(fbm(wx * 0.0025 + 5, wz * 0.0025 + 5) * 2 - 1);
  const rm = Math.pow(ridge, 2.2) * fbm(wx * 0.005 + 30, wz * 0.005 + 30) * 11;
  const hills = Math.pow(ridge, 1.2) * fbm(wx * 0.018 + 10, wz * 0.018 + 10) * 5;
  const detail = fbm(wx * 0.035 + 60, wz * 0.035 + 60) * 0.7;
  const rAngle = 0.35;
  const rx = x * Math.cos(rAngle) - z * Math.sin(rAngle);
  const ry = x * Math.sin(rAngle) + z * Math.cos(rAngle);
  const rv = Math.abs(fbm(rx * 0.0025 + 100, ry * 0.0025 + 100) - 0.5) * 2;
  const riverCut = Math.max(0, 1 - rv * 5) * -2.8;
  const lkx = 30, lkz = -22;
  const ld = Math.sqrt((x - lkx) ** 2 + (z - lkz) ** 2);
  const lakeCut = Math.max(0, 1 - ld / 18) * (ld < 6 ? -3.8 : -3.8 + (ld - 6) * 0.08);
  let h = base + hills + rm + detail + riverCut + lakeCut;
  h = Math.floor(h * 2) / 2;
  return h;
}

export function buildTerrain(scene) {
  console.log("[TERRAIN] Building terrain...");
  const seg = Math.floor(W / BLOCK);
  const verts = [], colors = [];
  const H = [];
  for (let iz = 0; iz <= seg; iz++) {
    H[iz] = [];
    for (let ix = 0; ix <= seg; ix++) {
      H[iz][ix] = getHeight(ix * BLOCK - W / 2, iz * BLOCK - W / 2);
    }
  }

  function getCol(ay, x, z, minY, maxY) {
    const slope = maxY - minY;
    const n = fbm(x * 0.06 + 100, z * 0.06 + 100);
    const m = fbm(x * 0.03 + 400, z * 0.03 + 400);
    if (slope > 1.8) { const t = fbm(x * 0.05 + 300, z * 0.05 + 300); return [0.25 + t * 0.15, 0.2 + t * 0.12, 0.15 + t * 0.1]; }
    if (slope > 1.2) { const t = fbm(x * 0.04 + 310, z * 0.04 + 310); return [0.42 + t * 0.12, 0.35 + t * 0.1, 0.25 + t * 0.08]; }
    if (ay < -1.5) return [0.02, 0.08, 0.25];
    if (ay < -0.3) return [0.06 + n * 0.06, 0.28 + n * 0.1, 0.52 + n * 0.06];
    if (ay < 0.5) { const t = fbm(x * 0.05 + 200, z * 0.05 + 200); return [0.7 + t * 0.12, 0.58 + t * 0.1, 0.25 + t * 0.08]; }
    if (ay < 2.5) return [0.05 + n * 0.15 + m * 0.05, 0.32 + n * 0.25 + m * 0.1, 0.02 + n * 0.06];
    if (ay < 5) return [0.02 + n * 0.1 + m * 0.04, 0.18 + n * 0.18 + m * 0.06, 0.01 + n * 0.04];
    if (ay < 8) return [0.28 + n * 0.15, 0.24 + n * 0.12, 0.2 + n * 0.1];
    const s = fbm(x * 0.04 + 500, z * 0.04 + 500);
    return [0.82 + s * 0.1, 0.82 + s * 0.1, 0.88 + s * 0.08];
  }

  for (let iz = 0; iz < seg; iz++) {
    for (let ix = 0; ix < seg; ix++) {
      const x = ix * BLOCK - W / 2, z = iz * BLOCK - W / 2;
      const x1 = x - BLOCK / 2, x2 = x + BLOCK / 2;
      const z1 = z - BLOCK / 2, z2 = z + BLOCK / 2;
      const minY = Math.min(H[iz][ix], H[iz][ix+1], H[iz+1][ix], H[iz+1][ix+1]);
      const maxY = Math.max(H[iz][ix], H[iz][ix+1], H[iz+1][ix], H[iz+1][ix+1]);
      const avg = (minY + maxY) / 2;
      const [r, g, b] = getCol(avg, x, z, minY, maxY);
      verts.push(x1, H[iz][ix], z1, x2, H[iz][ix+1], z1, x1, H[iz+1][ix], z2);
      colors.push(r, g, b, r, g, b, r, g, b);
      verts.push(x2, H[iz][ix+1], z1, x2, H[iz+1][ix+1], z2, x1, H[iz+1][ix], z2);
      colors.push(r, g, b, r, g, b, r, g, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.02, flatShading: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Water
  const wMat = new THREE.MeshPhysicalMaterial({ color: 0x1a8aba, transparent: true, opacity: 0.35, side: THREE.DoubleSide, roughness: 0.15, metalness: 0.05, clearcoat: 0.3, envMapIntensity: 0.6 });
  const wGeo = new THREE.PlaneGeometry(W + 20, W + 20, 60, 60);
  const wMesh = new THREE.Mesh(wGeo, wMat);
  wMesh.rotation.x = -Math.PI / 2;
  wMesh.position.y = -0.5;
  wMesh.receiveShadow = true;
  scene.add(wMesh);

  console.log("[TERRAIN] Done");
  return { ground: mesh, water: wMesh, seg };
}
