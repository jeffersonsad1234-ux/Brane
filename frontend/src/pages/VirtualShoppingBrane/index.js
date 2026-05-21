import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import "./VirtualShoppingBrane.css";

// ─── NOISE ──────────────────────────────────────────────
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }
function smooth(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx) + ((hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * sx) - (hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx)) * sy;
}
function fbm(x, y, o = 5) { let v = 0, a = 1, f = 1, m = 0; for (let i = 0; i < o; i++) { v += smooth(x * f, y * f) * a; m += a; a *= 0.5; f *= 2; } return v / m; }

// ─── HELPERS ────────────────────────────────────────────
const W = 200, BLOCK = 1.4, WH = 12;
function rng(m, M) { return m + Math.random() * (M - m); }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

const SKIN = "wildcraft_data";
const BLOCK_TYPES = {
  dirt: { color: 0x8B6914, name: "Terra", roughness: 0.9 },
  wood: { color: 0x6a4a2a, name: "Madeira", roughness: 0.8 },
  stone: { color: 0x808080, name: "Pedra", roughness: 0.7 },
  plank: { color: 0xc4a46a, name: "Tábua", roughness: 0.6 },
  brick: { color: 0xaa5533, name: "Tijolo", roughness: 0.7 },
  crystal_block: { color: 0xcc66ff, name: "Bloco de Cristal", roughness: 0.2, metalness: 0.5 },
};
const RES_COLORS = { tree: 0x44cc44, rock: 0x999999, crystal: 0xff66ff, coal: 0x444444 };
const RES_NAMES = { tree: "Madeira", rock: "Pedra", crystal: "Cristal Mágico", coal: "Carvão" };
const RES_HP = { tree: 5, rock: 4, crystal: 3, coal: 4 };

// ─── AUDIO ──────────────────────────────────────────────
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playMine() {
  if (!audioCtx) return; try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = "square";
    o.frequency.setValueAtTime(200, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.07);
    g.gain.setValueAtTime(0.06, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.07);
  } catch {}
}
function playBreak() {
  if (!audioCtx) return; try {
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const n = audioCtx.createBufferSource(); n.buffer = buf;
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    n.connect(g); g.connect(audioCtx.destination); n.start();
  } catch {}
}
function playCollect() {
  if (!audioCtx) return; try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = "sine";
    o.frequency.setValueAtTime(600, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.12);
    g.gain.setValueAtTime(0.05, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.15);
  } catch {}
}

// ─── GET HEIGHT ─────────────────────────────────────────
function getHeight(x, z) {
  const base = fbm(x * 0.009, z * 0.009) * 6 - 2;
  const ridge = 1 - Math.abs(fbm(x * 0.004 + 5, z * 0.004 + 5) * 2 - 1);
  const mountains = Math.pow(ridge, 2) * 9;
  const warp = fbm(x * 0.003, z * 0.003) * 15;
  const detail = fbm((x + warp) * 0.018 + 10, (z + warp) * 0.018 + 10) * 1.5;
  const riverVal = Math.abs(fbm(x * 0.0035 + 50, z * 0.0035 + 50) - 0.5) * 2;
  const riverCut = Math.max(0, 1 - riverVal * 4) * -2.2;
  const ldx = 18, ldz = -12;
  const lakeDist = Math.sqrt((x - ldx) ** 2 + (z - ldz) ** 2);
  const lakeCut = Math.max(0, 1 - lakeDist / 14) * -3;
  let h = base + mountains + detail + riverCut + lakeCut;
  const terrace = Math.floor(h * 1.5) / 1.5;
  const blend = Math.min(1, Math.max(0, (Math.abs(h - terrace) - 0.15) * 4));
  h = terrace * (1 - blend) + h * blend;
  return Math.floor(h * 2) / 2;
}

// ─── WORLD ──────────────────────────────────────────────
function buildWorld(scene) {
  const seg = Math.floor(W / BLOCK);
  const verts = [], colors = [];
  const trees = [], rocks = [], crystals = [], coals = [];
  const grassPositions = [];

  // Pre-compute height map
  const H = [];
  for (let iz = 0; iz <= seg; iz++) {
    H[iz] = [];
    for (let ix = 0; ix <= seg; ix++) {
      const x = ix * BLOCK - W / 2, z = iz * BLOCK - W / 2;
      H[iz][ix] = getHeight(x, z);
    }
  }

  // Non-indexed terrain: 6 verts per quad (2 triangles, no vertex sharing)
  for (let iz = 0; iz < seg; iz++) {
    for (let ix = 0; ix < seg; ix++) {
      const x = ix * BLOCK - W / 2, z = iz * BLOCK - W / 2;
      const x1 = x - BLOCK / 2, x2 = x + BLOCK / 2;
      const z1 = z - BLOCK / 2, z2 = z + BLOCK / 2;
      const y00 = H[iz][ix], y10 = H[iz][ix + 1];
      const y01 = H[iz + 1][ix], y11 = H[iz + 1][ix + 1];
      const avgY = (y00 + y10 + y01 + y11) / 4;

      // Biome color
      const minY = Math.min(y00, y10, y01, y11);
      const maxY = Math.max(y00, y10, y01, y11);
      const slope = maxY - minY;
      const isCliff = slope > 1.8;
      const isDeep = avgY < -2;
      const isShallow = avgY >= -2 && avgY < -0.5;
      const isSand = avgY >= -0.5 && avgY < 0.8;
      const isGrass = avgY >= 0.8 && avgY < 3.5;
      const isForest = avgY >= 3.5 && avgY < 6;
      const isRock = avgY >= 6 && avgY < 9;
      const isSnow = avgY >= 9;
      let r, g, b;
      if (isCliff) { const t = fbm(x * 0.05 + 300, z * 0.05 + 300); r = 0.35 + t * 0.25; g = 0.3 + t * 0.2; b = 0.25 + t * 0.15; }
      else if (isSnow) { r = 0.97; g = 0.97; b = 1; }
      else if (isRock) { const t = fbm(x * 0.04, z * 0.04); r = 0.4 + t * 0.2; g = 0.38 + t * 0.18; b = 0.35 + t * 0.15; }
      else if (isForest) { const t = fbm(x * 0.06, z * 0.06); r = 0.06 + t * 0.12; g = 0.25 + t * 0.2; b = 0.04 + t * 0.06; }
      else if (isGrass) { const t = fbm(x * 0.07 + 100, z * 0.07 + 100); r = 0.12 + t * 0.22; g = 0.42 + t * 0.3; b = 0.06 + t * 0.1; }
      else if (isSand) { const t = fbm(x * 0.05 + 200, z * 0.05 + 200); r = 0.78 + t * 0.12; g = 0.72 + t * 0.1; b = 0.5 + t * 0.08; }
      else if (isShallow) { r = 0.12; g = 0.45; b = 0.65; }
      else { r = 0.06; g = 0.12; b = 0.3; }

      // Triangle 1: (x1,y00,z1) (x2,y10,z1) (x1,y01,z2)
      verts.push(x1, y00, z1, x2, y10, z1, x1, y01, z2);
      for (let c = 0; c < 3; c++) colors.push(r, g, b);
      // Triangle 2: (x2,y10,z1) (x2,y11,z2) (x1,y01,z2)
      verts.push(x2, y10, z1, x2, y11, z2, x1, y01, z2);
      for (let c = 0; c < 3; c++) colors.push(r, g, b);

      // Collect grass positions on grassy terrain
      if (isGrass && fbm(x * 0.08 + 200, z * 0.08 + 200) > 0.25) {
        const gx = rng(x1, x2), gz = rng(z1, z2);
        grassPositions.push(gx, getHeight(gx, gz), gz);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.03, flatShading: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true; mesh.castShadow = true;
  scene.add(mesh);

  // Water
  const wMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a8aba, roughness: 0.0, metalness: 0.2, transparent: true, opacity: 0.45, clearcoat: 0.4,
    envMapIntensity: 0.6,
  });
  const wGeo = new THREE.PlaneGeometry(W + 20, W + 20, 40, 40);
  const wMesh = new THREE.Mesh(wGeo, wMat);
  wMesh.rotation.x = -Math.PI / 2;
  wMesh.position.y = -0.5;
  wMesh.receiveShadow = true;
  scene.add(wMesh);

  // Trees — 350 with tagged resource
  for (let i = 0; i < 350; i++) {
    const tx = rng(-W / 2 + 5, W / 2 - 5), tz = rng(-W / 2 + 5, W / 2 - 5);
    const th = getHeight(tx, tz);
    if (th > 0.8 && th < 5.5 && fbm(tx * 0.04 + 20, tz * 0.04 + 20) > 0.32) {
      const trunkH = rng(1.8, 4);
      const trunkR = rng(0.15, 0.3);
      const treeRes = {
        type: "tree", hp: RES_HP.tree, maxHp: RES_HP.tree,
        parts: [], drops: [{ id: "wood", n: "Madeira", i: "🪵", c: 2 }],
        center: new THREE.Vector3(tx, th + trunkH * 0.6, tz),
      };
      const trunkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.25 + rng(0, 0.12), 0.12 + rng(0, 0.06), 0.04 + rng(0, 0.04)), roughness: 0.9 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkR * 0.5, trunkR, trunkH, 6), trunkMat);
      trunk.position.set(tx, th + trunkH / 2, tz);
      trunk.castShadow = true; trunk.userData.resource = treeRes;
      scene.add(trunk); treeRes.parts.push(trunk);

      const hue = rng(0.22, 0.4), sat = rng(0.5, 0.8), light = rng(0.25, 0.5);
      const col = new THREE.Color().setHSL(hue, sat, light);
      const col2 = new THREE.Color().setHSL(hue + rng(-0.05, 0.05), sat, light + rng(0.05, 0.15));
      const canopyCount = 3 + Math.floor(Math.random() * 5);
      for (let j = 0; j < canopyCount; j++) {
        const cr = rng(0.3, 1.1);
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(cr, 7, 7),
          new THREE.MeshStandardMaterial({ color: j % 2 === 0 ? col : col2, roughness: 0.7, flatShading: true })
        );
        leaf.position.set(tx + rng(-0.8, 0.8), th + trunkH + rng(-0.2, 1), tz + rng(-0.8, 0.8));
        leaf.scale.y = rng(0.6, 1.3);
        leaf.castShadow = true; leaf.userData.resource = treeRes;
        scene.add(leaf); treeRes.parts.push(leaf);
      }
      trees.push(treeRes);
    }
  }

  // Rocks — 150
  for (let i = 0; i < 150; i++) {
    const rx = rng(-W / 2 + 3, W / 2 - 3), rz = rng(-W / 2 + 3, W / 2 - 3);
    const rh = getHeight(rx, rz);
    if (rh > 0.3 && rh < 7) {
      const rockRes = { type: "rock", hp: RES_HP.rock, maxHp: RES_HP.rock, drops: [{ id: "stone", n: "Pedra", i: "🪨", c: 1 }], mesh: null };
      const rockMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.35 + rng(0, 0.15), 0.32 + rng(0, 0.1), 0.28 + rng(0, 0.08)), roughness: 0.9, flatShading: true });
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rng(0.25, 0.9), 0), rockMat);
      rock.position.set(rx, rh + rng(0, 0.3), rz);
      rock.scale.set(1, rng(0.25, 0.6), 1);
      rock.rotation.set(rng(0, 6), rng(0, 6), rng(0, 6));
      rock.castShadow = true; rock.userData.resource = rockRes; rockRes.mesh = rock;
      scene.add(rock); rocks.push(rockRes);
    }
  }

  // Coal — 40
  for (let i = 0; i < 40; i++) {
    const cx = rng(-W / 2 + 5, W / 2 - 5), cz = rng(-W / 2 + 5, W / 2 - 5);
    const ch = getHeight(cx, cz);
    if (ch > -0.5 && ch < 4.5) {
      const coalRes = { type: "coal", hp: RES_HP.coal, maxHp: RES_HP.coal, drops: [{ id: "coal", n: "Carvão", i: "⬛", c: 2 }], mesh: null };
      const coal = new THREE.Mesh(new THREE.OctahedronGeometry(rng(0.2, 0.45), 0), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.95, flatShading: true }));
      coal.position.set(cx, ch + rng(0.05, 0.2), cz);
      coal.rotation.set(rng(0, 6), rng(0, 6), rng(0, 6));
      coal.castShadow = true; coal.userData.resource = coalRes; coalRes.mesh = coal;
      scene.add(coal); coals.push(coalRes);
    }
  }

  // Magic Crystals — 80 with glow lights
  const oreColors = [0xff44aa, 0x44aaff, 0x44ffaa, 0xffaa00, 0xcc66ff, 0xff6644];
  for (let i = 0; i < 80; i++) {
    const ox = rng(-W / 2 + 5, W / 2 - 5), oz = rng(-W / 2 + 5, W / 2 - 5);
    const oh = getHeight(ox, oz);
    if (oh > 0.5 && oh < 5.5) {
      const col = oreColors[Math.floor(Math.random() * oreColors.length)];
      const crystalRes = {
        type: "crystal", hp: RES_HP.crystal, maxHp: RES_HP.crystal,
        drops: [{ id: "crystal", n: "Cristal", i: "💎", c: 1 }], mesh: null, color: col, value: 5 + Math.floor(Math.random() * 15),
      };
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(rng(0.12, 0.4), 0), new THREE.MeshStandardMaterial({ color: col, roughness: 0.15, metalness: 0.6, emissive: col, emissiveIntensity: 0.3 }));
      crystal.position.set(ox, oh + 0.1, oz);
      crystal.castShadow = true;
      crystal.userData.resource = crystalRes; crystalRes.mesh = crystal;
      scene.add(crystal); crystals.push(crystalRes);
      if (i % 3 === 0) {
        const pLight = new THREE.PointLight(col, 0.15, 2.5);
        pLight.position.copy(crystal.position); pLight.position.y += 0.2;
        scene.add(pLight);
      }
    }
  }

  // Flowers — 300
  for (let i = 0; i < 300; i++) {
    const fx = rng(-W / 2 + 3, W / 2 - 3), fz = rng(-W / 2 + 3, W / 2 - 3);
    const fh = getHeight(fx, fz);
    if (fh > 0.5 && fh < 4) {
      const fcol = new THREE.Color().setHSL(rng(0.4, 1), 0.8, 0.5 + rng(0, 0.2));
      const f = new THREE.Mesh(new THREE.SphereGeometry(rng(0.04, 0.08), 4, 4), new THREE.MeshStandardMaterial({ color: fcol }));
      f.position.set(fx, fh + rng(0.04, 0.1), fz);
      scene.add(f);
    }
  }

  // Villages — 4
  for (let v = 0; v < 4; v++) {
    const vx = rng(-W / 2 + 20, W / 2 - 20), vz = rng(-W / 2 + 20, W / 2 - 20);
    const vh = getHeight(vx, vz);
    if (vh > 0.5 && vh < 4) {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xd4a46a, roughness: 0.85 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: 0.8 });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.0), wallMat);
      wall.position.set(vx, vh + 0.35, vz); wall.castShadow = true; wall.receiveShadow = true; scene.add(wall);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.6, 4), roofMat);
      roof.position.set(vx, vh + 1.0, vz); roof.rotation.y = Math.PI / 4; roof.castShadow = true; scene.add(roof);
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff8844 }));
      lantern.position.set(vx, vh + 1.2, vz); scene.add(lantern);
      const lLight = new THREE.PointLight(0xff8844, 0.4, 2.5);
      lLight.position.copy(lantern.position); scene.add(lLight);
      if (Math.random() > 0.4) {
        const w2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.8), wallMat);
        w2.position.set(vx + 1.8, vh + 0.25, vz + 0.5); w2.castShadow = true; w2.receiveShadow = true; scene.add(w2);
        const r2 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.4, 4), roofMat);
        r2.position.set(vx + 1.8, vh + 0.7, vz + 0.5); r2.rotation.y = Math.PI / 4; r2.castShadow = true; scene.add(r2);
      }
    }
  }

  return { ground: mesh, water: wMesh, trees, rocks, crystals, coals, grassPositions };
}

// ─── ANIMALS ────────────────────────────────────────────
function spawnAnimals(scene, world) {
  const animals = [];
  for (let i = 0; i < 20; i++) {
    const ax = rng(-W / 2 + 10, W / 2 - 10), az = rng(-W / 2 + 10, W / 2 - 10);
    const ah = getHeight(ax, az);
    if (ah > 0.5 && ah < 4) {
      const bodyCol = new THREE.Color().setHSL(rng(0.05, 0.15), rng(0.2, 0.5), rng(0.3, 0.6));
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.8 }));
      body.scale.set(1, 0.7, 1.2); body.position.y = 0.25; group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.8 }));
      head.position.set(0, 0.2, 0.3); group.add(head);
      group.position.set(ax, ah, az);
      group.rotation.y = rng(0, Math.PI * 2);
      scene.add(group);
      animals.push({ group, ax, az, ah, phase: rng(0, Math.PI * 2), speed: rng(0.3, 0.8), wanderTarget: null });
    }
  }
  return animals;
}

// ─── PARTICLES ──────────────────────────────────────────
const particleSystems = [];
function spawnParticles(scene, pos, color, count = 15) {
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.15;
    positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.15;
    positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.15;
    velocities.push({ x: (Math.random() - 0.5) * 3, y: Math.random() * 2.5 + 0.5, z: (Math.random() - 0.5) * 3 });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color, size: 0.1, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  particleSystems.push({ points, velocities, life: 1 });
}
function updateParticles(dt) {
  for (let i = particleSystems.length - 1; i >= 0; i--) {
    const sys = particleSystems[i];
    if (!sys.points.parent) { particleSystems.splice(i, 1); continue; }
    const pos = sys.points.geometry.attributes.position.array;
    for (let j = 0; j < pos.length / 3; j++) {
      pos[j * 3] += sys.velocities[j].x * dt;
      pos[j * 3 + 1] += sys.velocities[j].y * dt;
      pos[j * 3 + 2] += sys.velocities[j].z * dt;
      sys.velocities[j].y -= 4 * dt;
    }
    sys.points.geometry.attributes.position.needsUpdate = true;
    sys.life -= dt * 1.8;
    sys.points.material.opacity = Math.max(0, sys.life);
    if (sys.life <= 0) {
      sys.points.geometry.dispose(); sys.points.material.dispose();
      sys.points.parent?.remove(sys.points);
      particleSystems.splice(i, 1);
    }
  }
}

// ─── ITEM DROPS ─────────────────────────────────────────
const DROP_ICONS = { wood: { color: 0x6a4a2a }, stone: { color: 0x808080 }, crystal: { color: 0xff66ff }, coal: { color: 0x444444 } };
const itemDrops = [];
function spawnItemDrop(scene, pos, itemId, count) {
  const info = DROP_ICONS[itemId] || { color: 0xffffff };
  const drop = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 0.15),
    new THREE.MeshStandardMaterial({ color: info.color, emissive: info.color, emissiveIntensity: 0.3, roughness: 0.5 })
  );
  drop.position.copy(pos); drop.position.y += 0.4;
  drop.castShadow = true; scene.add(drop);
  const glow = new THREE.PointLight(info.color, 0.3, 1.5);
  glow.position.copy(drop.position); scene.add(glow);
  itemDrops.push({ mesh: drop, light: glow, itemId, count, yBase: drop.position.y, phase: Math.random() * Math.PI * 2, life: 30 });
}
function updateDrops(playerPos, dt, setItems, showMsg, scene) {
  for (let i = itemDrops.length - 1; i >= 0; i--) {
    const d = itemDrops[i];
    d.life -= dt;
    const bob = Math.sin(performance.now() * 0.002 + d.phase) * 0.1;
    d.mesh.position.y = d.yBase + bob;
    d.light.position.copy(d.mesh.position);
    const dx = d.mesh.position.x - playerPos.x, dz = d.mesh.position.z - playerPos.z, dy = d.mesh.position.y - playerPos.y;
    if (dx * dx + dz * dz + dy * dy < 3.2) {
      playCollect();
      scene.remove(d.mesh); scene.remove(d.light);
      d.mesh.geometry.dispose(); d.mesh.material.dispose();
      setItems(prev => {
        const idx = prev.findIndex(it => it.id === d.itemId);
        if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], c: n[idx].c + d.count }; return n; }
        const icon = d.itemId === "wood" ? "🪵" : d.itemId === "stone" ? "🪨" : d.itemId === "crystal" ? "💎" : "⬛";
        return [...prev, { id: d.itemId, n: icon, i: icon, c: d.count }];
      });
      showMsg(`+${d.count} ${d.itemId === "wood" ? "🪵" : d.itemId === "stone" ? "🪨" : d.itemId === "crystal" ? "💎" : "⬛"}`);
      itemDrops.splice(i, 1);
    } else if (d.life <= 0) {
      scene.remove(d.mesh); scene.remove(d.light);
      d.mesh.geometry.dispose(); d.mesh.material.dispose();
      itemDrops.splice(i, 1);
    }
  }
}

// ─── DAMAGE BAR ─────────────────────────────────────────
function makeDamageBar(scene) {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 8;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, 64, 8);
  ctx.fillStyle = "#44aaff"; ctx.fillRect(1, 1, 62, 6);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.5, 0.06, 1); sprite.visible = false;
  scene.add(sprite);
  return { sprite, canvas: c, ctx, tex };
}
function updateDamageBar(dmgBar, target, hp, maxHp) {
  if (!dmgBar || !target) return;
  const pct = Math.max(0, hp / maxHp);
  dmgBar.ctx.clearRect(0, 0, 64, 8);
  dmgBar.ctx.fillStyle = "rgba(0,0,0,0.6)"; dmgBar.ctx.fillRect(0, 0, 64, 8);
  dmgBar.ctx.fillStyle = "#44aaff"; dmgBar.ctx.fillRect(1, 1, 62 * pct, 6);
  dmgBar.tex.needsUpdate = true;
  dmgBar.sprite.visible = true;
  const center = target.center || target.mesh?.position || (target.parts?.[0]?.position);
  if (center) { dmgBar.sprite.position.copy(center); dmgBar.sprite.position.y += 1.2; }
}

// ─── CLOUDS ─────────────────────────────────────────────
function makeClouds(scene) {
  const clouds = [];
  const cloudMat = new THREE.SpriteMaterial({
    map: (() => {
      const c = document.createElement("canvas"); c.width = 64; c.height = 64;
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,0.6)"); g.addColorStop(0.4, "rgba(255,255,255,0.3)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5,
  });
  for (let i = 0; i < 40; i++) {
    const cloud = new THREE.Sprite(cloudMat);
    const s = rng(4, 12);
    cloud.scale.set(s, s * 0.4, 1);
    cloud.position.set(rng(-W, W), rng(12, 20), rng(-W, W));
    scene.add(cloud);
    clouds.push({ sprite: cloud, speed: rng(0.1, 0.3), dx: rng(-1, 1) });
  }
  return clouds;
}

// ─── PLAYER ─────────────────────────────────────────────
function makePlayer(scene) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.5, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), bodyMat);
  body.position.y = 0.85; body.castShadow = true; g.add(body);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, roughness: 0.4, flatShading: true });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), headMat);
  head.position.y = 1.35; head.castShadow = true; g.add(head);
  const eMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eMat);
  e1.position.set(-0.1, 1.38, -0.18); g.add(e1);
  const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eMat);
  e2.position.set(0.1, 1.38, -0.18); g.add(e2);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xaa66ff, roughness: 0.3 });
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.15, 6), hatMat);
  hat.position.y = 1.55; g.add(hat);
  const armMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, roughness: 0.5 });
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), armMat);
  lArm.position.set(-0.3, 0.85, 0); g.add(lArm);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), armMat);
  rArm.position.set(0.3, 0.85, 0); g.add(rArm);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x3355aa, roughness: 0.6 });
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.14), legMat);
  lLeg.position.set(-0.13, 0.25, 0); g.add(lLeg);
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.14), legMat);
  rLeg.position.set(0.13, 0.25, 0); g.add(rLeg);
  g.position.set(0, 0, 0);
  scene.add(g);
  return { group: g, body, head, lArm, rArm, lLeg, rLeg };
}

// ─── REACT ──────────────────────────────────────────────
export default function VirtualShoppingBrane() {
  const mountRef = useRef(null);
  const [screen, setScreen] = useState("menu");
  const [health, setHealth] = useState(100);
  const [hunger, setHunger] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [coins, setCoins] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SKIN))?.coins || 100; } catch { return 100; }
  });
  const [level, setLevel] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SKIN))?.level || 1; } catch { return 1; }
  });
  const [xp, setXp] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SKIN))?.xp || 0; } catch { return 0; }
  });
  const [time, setTime] = useState(0.25);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SKIN))?.items || [
      { id: "dirt", n: "Terra", i: "🟫", c: 15 }, { id: "wood", n: "Madeira", i: "🪵", c: 8 }, { id: "stone", n: "Pedra", i: "🪨", c: 5 },
    ]; } catch { return [
      { id: "dirt", n: "Terra", i: "🟫", c: 15 }, { id: "wood", n: "Madeira", i: "🪵", c: 8 }, { id: "stone", n: "Pedra", i: "🪨", c: 5 },
    ]; }
  });
  const [selectedSlot, setSelectedSlot] = useState(0);
  const itemsRef = useRef(items); itemsRef.current = items;
  const selectedSlotRef = useRef(selectedSlot); selectedSlotRef.current = selectedSlot;
  const placedBlocksRef = useRef([]);
  const sceneRef = useRef(null);
  const animRef = useRef(null);
  const playerRef = useRef(null);
  const keysRef = useRef({});
  const msgTimer = useRef(null);
  const miningRef = useRef({ active: false, target: null, progress: 0 });
  const dmgBarRef = useRef(null);
  const debugRef = useRef({ camX: 0, camY: 0, camZ: 0, meshes: 0, worldOk: false });

  const coinsR = useRef(coins); coinsR.current = coins;
  const xpR = useRef(xp); xpR.current = xp;
  const levelR = useRef(level); levelR.current = level;
  const healthR = useRef(health); healthR.current = health;
  const hungerR = useRef(hunger); hungerR.current = hunger;

  const showMsg = useCallback((m) => {
    setMessage(m);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(""), 2000);
  }, []);

  const save = useCallback(() => {
    localStorage.setItem(SKIN, JSON.stringify({ coins, level, xp, items }));
  }, [coins, level, xp, items]);

  useEffect(() => { save(); }, [save]);

  // ─── STEP 1: FALLBACK + TERRAIN + LIGHTING ───
  useEffect(() => {
    console.log("[STEP1] Init start, screen:", screen);
    if (screen !== "game" || !mountRef.current || sceneRef.current) return;
    const mount = mountRef.current;
    const w = mount.clientWidth, h = mount.clientHeight;
    console.log("[STEP1] Mount size:", w, h);

    // ─── RENDERER ───
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    console.log("[STEP1] Renderer + canvas appended");

    // ─── SCENE ───
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a8ad4);
    console.log("[STEP1] Scene bg:", scene.background.getHex());

    // ─── CAMERA ───
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 200);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);
    console.log("[STEP1] Camera:", camera.position.toArray());

    // ─── LIGHTING ───
    console.log("[STEP1] Adding lights...");
    const amb = new THREE.AmbientLight(0x8899ff, 0.4);
    scene.add(amb);
    const hemi = new THREE.HemisphereLight(0x88ccff, 0x885533, 0.5);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffdd99, 1.2);
    sun.position.set(30, 40, 20);
    scene.add(sun);
    console.log("[STEP1] Lights added");

    // ─── FALLBACK GROUND (hidden if terrain works) ───
    const fbMat = new THREE.MeshBasicMaterial({ color: 0x55cc55, side: THREE.DoubleSide });
    const fbGround = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), fbMat);
    fbGround.rotation.x = -Math.PI / 2;
    fbGround.position.y = -1;
    scene.add(fbGround);
    const fbCube = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0xff4400 }));
    fbCube.position.set(0, -0.7, 0);
    scene.add(fbCube);

    // ─── PROCEDURAL TERRAIN ───
    let world = null;
    let worldOk = false;
    try {
      world = buildWorld(scene);
      worldOk = true;
    } catch (e) {
      console.error("[TERRAIN] Failed:", e);
    }
    // Hide fallback when terrain works
    fbGround.visible = !worldOk;
    fbCube.visible = !worldOk;
    console.log("[STEP2] World OK:", worldOk, "meshes:", worldOk ? scene.children.filter(c => c.isMesh).length : "fallback");

    sceneRef.current = { scene, renderer, camera, sun, amb, hemi, world };

    // ─── ANIMATION LOOP ───
    let frameCount = 0;
    const loop = (now) => {
      animRef.current = requestAnimationFrame(loop);
      frameCount++;

      if (frameCount % 30 === 0) {
        debugRef.current = {
          camX: camera.position.x.toFixed(1),
          camY: camera.position.y.toFixed(1),
          camZ: camera.position.z.toFixed(1),
          meshes: scene.children.filter(c => c.isMesh).length,
          worldOk,
        };
      }

      renderer.render(scene, camera);
    };

    animRef.current = requestAnimationFrame(loop);
    console.log("[STEP1] Loop started");

    return () => {
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      sceneRef.current = null;
    };
  }, [screen]);

  // ─── KEYBOARD + MOUSE ───
  const cameraRef = useRef({ yaw: 0 });
  const energyR = useRef(energy); energyR.current = energy;

  useEffect(() => {
    const onKeyDown = (e) => {
      keysRef.current[e.code] = true;
      if (e.code >= "Digit1" && e.code <= "Digit5") setSelectedSlot(parseInt(e.code[5]) - 1);
    };
    const onKeyUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onMouseMove = (e) => {
      if (screen !== "game") return;
      cameraRef.current.yaw -= e.movementX * 0.003;
    };
    document.addEventListener("mousemove", onMouseMove);

    const mineableMeshes = () => {
      const w = sceneRef.current?.world;
      if (!w) return [];
      const m = [];
      for (const t of w.trees || []) for (const p of t.parts || []) m.push(p);
      for (const r of w.rocks || []) if (r.mesh) m.push(r.mesh);
      for (const c of w.crystals || []) if (c.mesh) m.push(c.mesh);
      for (const c of w.coals || []) if (c.mesh) m.push(c.mesh);
      return m;
    };

    const startMine = () => {
      if (screen !== "game") return;
      if (!document.pointerLockElement) { mountRef.current?.requestPointerLock?.(); return; }
      initAudio();
      const ref = sceneRef.current;
      if (!ref?.world) return;
      const { raycaster, camera, scene, world } = ref;
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const hits = raycaster.intersectObjects(mineableMeshes());
      if (hits.length === 0) return;
      const res = hits[0].object.userData?.resource;
      if (!res || res.hp <= 0) return;
      playMine();
      spawnParticles(scene, hits[0].point, RES_COLORS[res.type] || 0xffffff, 6);
      miningRef.current = { active: true, target: res, progress: 0 };
    };

    const placeBlock = () => {
      const ref = sceneRef.current;
      if (!ref?.world?.ground) return;
      const { raycaster, camera, scene, world } = ref;
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const targets = [world.ground, ...placedBlocksRef.current.map(b => b.mesh)];
      const hits = raycaster.intersectObjects(targets);
      if (hits.length === 0) return;
      const hit = hits[0];
      const normal = hit.face.normal.clone();
      const pos = hit.point.clone().add(normal.multiplyScalar(BLOCK * 0.5 + 0.01));
      const sx = Math.round(pos.x / BLOCK) * BLOCK, sy = Math.round(pos.y / BLOCK) * BLOCK, sz = Math.round(pos.z / BLOCK) * BLOCK;
      if (placedBlocksRef.current.some(b => Math.abs(b.x - sx) < 0.01 && Math.abs(b.y - sy) < 0.01 && Math.abs(b.z - sz) < 0.01)) return;
      const item = itemsRef.current[selectedSlotRef.current];
      if (!item || !BLOCK_TYPES[item.id]) return;
      const bt = BLOCK_TYPES[item.id];
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(BLOCK * 0.95, BLOCK * 0.95, BLOCK * 0.95),
        new THREE.MeshStandardMaterial({ color: bt.color, roughness: bt.roughness, flatShading: true, metalness: bt.metalness || 0 })
      );
      block.position.set(sx, sy, sz);
      block.castShadow = true; block.receiveShadow = true;
      scene.add(block);
      placedBlocksRef.current.push({ x: sx, y: sy, z: sz, type: item.id, mesh: block });
      const newItems = itemsRef.current.map((it, idx) => idx === selectedSlotRef.current ? { ...it, c: it.c - 1 } : it);
      if (newItems[selectedSlotRef.current].c <= 0) newItems.splice(selectedSlotRef.current, 1);
      setItems(newItems);
      showMsg(`${bt.name} colocada`);
    };

    const onMouseDown = (e) => {
      if (screen !== "game") return;
      if (!document.pointerLockElement) { mountRef.current?.requestPointerLock?.(); return; }
      if (e.button === 0) startMine();
      else if (e.button === 2) placeBlock();
    };
    const onMouseUp = () => { miningRef.current = { active: false, target: null, progress: 0 }; };
    const onCtx = (e) => e.preventDefault();
    mountRef.current?.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    mountRef.current?.addEventListener("contextmenu", onCtx);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      mountRef.current?.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      mountRef.current?.removeEventListener("contextmenu", onCtx);
    };
  }, [screen, showMsg]);

  const startGame = useCallback(() => {
    setScreen("game");
    setTimeout(() => mountRef.current?.requestPointerLock?.(), 500);
  }, []);

  const hour = Math.floor(time * 24);
  const min = Math.floor((time * 24) % 1 * 60);

  return (
    <div className="sb-root">
      {screen === "menu" && (
        <div className="sb-menu">
          <div className="sb-menu-content">
            <div className="sb-logo">
              <span className="sb-l-t" style={{background:'linear-gradient(135deg,#ff66aa,#aa66ff,#66aaff)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',backgroundSize:'200% 200%',animation:'logoShift 4s ease infinite'}}>WILD</span>
              <span className="sb-l-s" style={{color:'#ffd700'}}>CRAFT</span>
            </div>
            <p className="sb-m-sub" style={{color:'#999',fontSize:'.7rem',marginBottom:'.5rem'}}>✨ Sandbox Mágico • Sobrevivência • Construção</p>
            <div className="sb-m-stats" style={{marginBottom:'.6rem'}}>
              <span>⭐ Nv.{level}</span><span>🪙 {coins}</span><span>🏆 {xp}XP</span>
            </div>
            <button className="sb-btn sb-btn-play" onClick={startGame}>🌍 ENTRAR NO MUNDO</button>
            <div className="sb-m-hint" style={{fontSize:'.55rem',color:'#666',marginTop:'.4rem'}}>WASD andar • Shift correr • Mouse olhar • Esquerda minerar • Direita construir</div>
            <div className="sb-m-info" style={{marginTop:'.5rem'}}>
              <span>🌲 350 árvores</span><span>💎 80 cristais mágicos</span><span>🪨 150 pedras</span>
              <span>🌙 Dia/Noite</span><span>✨ Bloom</span><span>🦌 Animais</span>
            </div>
          </div>
        </div>
      )}

      {screen === "game" && (
        <div className="sb-game">
          <div className="sb-canvas" ref={mountRef} />
          <div className="sb-hud">
            <div className="sb-hud-top">
              <div className="sb-hud-stats">
                <div className="sb-stat"><span className="sb-si">❤️</span><div className="sb-st"><div className="sb-sf" style={{width:`${health}%`,background:'linear-gradient(90deg,#ff3344,#ff6688)'}} /></div></div>
                <div className="sb-stat"><span className="sb-si">🍖</span><div className="sb-st"><div className="sb-sf" style={{width:`${hunger}%`,background:'linear-gradient(90deg,#cc8833,#eeaa44)'}} /></div></div>
                <div className="sb-stat"><span className="sb-si">⚡</span><div className="sb-st"><div className="sb-sf" style={{width:`${energy}%`,background:'linear-gradient(90deg,#44aaff,#66ddff)'}} /></div></div>
                <div className="sb-hud-coin">🪙 {coins}</div>
                <div className="sb-hud-lvl">⭐ {level}</div>
              </div>
              <div className="sb-hud-time">🕐 {hour.toString().padStart(2,"0")}:{min.toString().padStart(2,"0")}</div>
            </div>

            <div className="sb-crosshair">+</div>

            <div className="sb-hotbar">
              {[...Array(5)].map((_, i) => {
                const item = items[i];
                const isActive = i === selectedSlot;
                return (
                  <div key={i} className={`sb-hotbar-slot${isActive?' active':''}`} onClick={() => setSelectedSlot(i)}>
                    {item ? <><span className="sb-hotbar-icon">{item.i}</span><span className="sb-hotbar-count">{item.c}</span></> : null}
                  </div>
                );
              })}
            </div>

            {message && <div className="sb-msg">{message}</div>}

            {/* ─── DEBUG OVERLAY ─── */}
            <div style={{
              position:'fixed', bottom:0, left:0, zIndex:50,
              background:'rgba(0,0,0,0.7)', color:'#0f0',
              fontFamily:'monospace', fontSize:'11px', padding:'4px 8px',
              lineHeight:1.3, pointerEvents:'none', whiteSpace:'pre',
            }}>
              cam {debugRef.camX} {debugRef.camY} {debugRef.camZ}
              {'  '}meshes {debugRef.meshes}
              {'  '}world {debugRef.worldOk?'OK':'FALLBACK'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
