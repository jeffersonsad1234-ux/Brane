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
  // Domain warping for organic shapes
  const dw = fbm(x * 0.004 + 1.5, z * 0.004 + 1.5, 4) * 20;
  const dw2 = fbm(x * 0.005 + 3.7, z * 0.005 + 3.7, 4) * 15;
  const wx = x + dw, wz = z + dw2;

  const base = fbm(wx * 0.008, wz * 0.008, 6) * 3.2 - 0.3;
  const ridge = 1 - Math.abs(fbm(wx * 0.0025 + 5, wz * 0.0025 + 5) * 2 - 1);
  const rm = Math.pow(ridge, 2.2) * fbm(wx * 0.005 + 30, wz * 0.005 + 30) * 11;
  const hills = Math.pow(ridge, 1.2) * fbm(wx * 0.018 + 10, wz * 0.018 + 10) * 5;
  const detail = fbm(wx * 0.035 + 60, wz * 0.035 + 60) * 0.7;

  // River through valley
  const rAngle = 0.35;
  const rx = x * Math.cos(rAngle) - z * Math.sin(rAngle);
  const ry = x * Math.sin(rAngle) + z * Math.cos(rAngle);
  const rv = Math.abs(fbm(rx * 0.0025 + 100, ry * 0.0025 + 100) - 0.5) * 2;
  const riverCut = Math.max(0, 1 - rv * 5) * -2.8;

  // Lake
  const lkx = 30, lkz = -22;
  const ld = Math.sqrt((x - lkx) ** 2 + (z - lkz) ** 2);
  const lakeCut = Math.max(0, 1 - ld / 18) * (ld < 6 ? -3.8 : -3.8 + (ld - 6) * 0.08);

  let h = base + hills + rm + detail + riverCut + lakeCut;
  h = Math.floor(h * 2) / 2;
  return h;
}

// ─── WORLD ──────────────────────────────────────────────
function buildWorld(scene) {
  const seg = Math.floor(W / BLOCK);
  const verts = [], colors = [];
  const trees = [], rocks = [], bushes = [], flowers = [];

  const H = [];
  for (let iz = 0; iz <= seg; iz++) { H[iz] = [];
    for (let ix = 0; ix <= seg; ix++) {
      H[iz][ix] = getHeight(ix * BLOCK - W / 2, iz * BLOCK - W / 2);
    }
  }

  function getCol(ay, x, z, minY, maxY) {
    const slope = maxY - minY;
    const n = fbm(x * 0.06 + 100, z * 0.06 + 100);
    const m = fbm(x * 0.03 + 400, z * 0.03 + 400);
    if (slope > 1.8) { const t = fbm(x * 0.05 + 300, z * 0.05 + 300); return [0.28 + t * 0.18, 0.22 + t * 0.15, 0.18 + t * 0.12]; }
    if (slope > 1.2) { const t = fbm(x * 0.04 + 310, z * 0.04 + 310); return [0.45 + t * 0.15, 0.38 + t * 0.12, 0.28 + t * 0.1]; }
    if (ay < -1.5) return [0.03, 0.1, 0.28];
    if (ay < -0.3) return [0.08 + n * 0.08, 0.32 + n * 0.12, 0.55 + n * 0.08];
    if (ay < 0.5) { const t = fbm(x * 0.05 + 200, z * 0.05 + 200); return [0.72 + t * 0.15, 0.6 + t * 0.12, 0.3 + t * 0.1]; }
    if (ay < 2.5) return [0.08 + n * 0.2 + m * 0.08, 0.35 + n * 0.28 + m * 0.12, 0.04 + n * 0.1];
    if (ay < 5) return [0.03 + n * 0.12 + m * 0.05, 0.2 + n * 0.2 + m * 0.08, 0.02 + n * 0.05];
    if (ay < 8) return [0.3 + n * 0.18, 0.26 + n * 0.15, 0.22 + n * 0.12];
    const s = fbm(x * 0.04 + 500, z * 0.04 + 500);
    return [0.85 + s * 0.1, 0.85 + s * 0.1, 0.9 + s * 0.08];
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
  scene.add(mesh);

  // Water — river + lake plane
  const wMat = new THREE.MeshStandardMaterial({ color: 0x2a9aca, transparent: true, opacity: 0.4, side: THREE.DoubleSide, roughness: 0.2, metalness: 0.1 });
  const wGeo = new THREE.PlaneGeometry(W + 20, W + 20, 60, 60);
  const wMesh = new THREE.Mesh(wGeo, wMat);
  wMesh.rotation.x = -Math.PI / 2;
  wMesh.position.y = -0.5;
  scene.add(wMesh);

  // ─── MATERIALS ───
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 });
  const trunkMat2 = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const leafGreen = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.8, flatShading: true });
  const leafDark = new THREE.MeshStandardMaterial({ color: 0x338833, roughness: 0.8, flatShading: true });
  const leafLight = new THREE.MeshStandardMaterial({ color: 0x66cc66, roughness: 0.8, flatShading: true });
  const leafAutumn = new THREE.MeshStandardMaterial({ color: 0x88aa33, roughness: 0.8, flatShading: true });
  const leafMats = [leafGreen, leafDark, leafLight, leafAutumn];
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9, flatShading: true });
  const rockMat2 = new THREE.MeshStandardMaterial({ color: 0x707070, roughness: 0.9, flatShading: true });
  const flowerMat = (hue) => new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.7, 0.55 + rng(0, 0.15)), roughness: 0.5 });
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x336633, roughness: 0.8, flatShading: true });

  // ─── TREES (120) ───
  for (let i = 0; i < 120; i++) {
    const tx = rng(-W/2+5, W/2-5), tz = rng(-W/2+5, W/2-5);
    const th = getHeight(tx, tz);
    if (th > 0.6 && th < 4 && fbm(tx*0.04+20, tz*0.04+20) > 0.3) {
      const trunkH = rng(1.2, 3.5);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, trunkH, 5), i%3===0?trunkMat2:trunkMat);
      trunk.position.set(tx, th + trunkH/2, tz);
      scene.add(trunk);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(rng(0.4, 1), 6, 6), leafMats[i%4]);
      leaf.position.set(tx, th + trunkH * 0.7 + rng(0.2, 0.6), tz);
      leaf.scale.y = rng(0.7, 1.2);
      scene.add(leaf);
      trees.push(trunk);
    }
  }

  // ─── FALLEN LOGS (20) ───
  const logMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  for (let i = 0; i < 20; i++) {
    const lx = rng(-W/2+5, W/2-5), lz = rng(-W/2+5, W/2-5);
    const lh = getHeight(lx, lz);
    if (lh > 0.3 && lh < 4 && fbm(lx*0.04+140, lz*0.04+140) > 0.35) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, rng(0.5, 1.2), 5), logMat);
      log.position.set(lx, lh + 0.04, lz);
      log.rotation.x = Math.PI / 2 + rng(-0.3, 0.3);
      log.rotation.z = rng(0, Math.PI * 2);
      scene.add(log);
    }
  }

  // ─── RESOURCE NODES (crystals 20, gold 15) ───
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0xff66ff, roughness: 0.15, metalness: 0.5, emissive: 0xff44ff, emissiveIntensity: 0.2 });
  for (let i = 0; i < 20; i++) {
    const cx = rng(-W/2+8, W/2-8), cz = rng(-W/2+8, W/2-8);
    const ch = getHeight(cx, cz);
    if (ch > 0.5 && ch < 5 && fbm(cx*0.05+300, cz*0.05+300) > 0.4) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(rng(0.08, 0.25), 0), crystalMat);
      c.position.set(cx, ch + rng(0, 0.1), cz);
      c.rotation.set(rng(0,6), rng(0,6), rng(0,6));
      scene.add(c);
      if (i % 3 === 0) { const gl = new THREE.PointLight(0xff44ff, 0.12, 1.5); gl.position.set(cx, ch+0.2, cz); scene.add(gl); }
    }
  }
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.3, metalness: 0.8, emissive: 0xff8800, emissiveIntensity: 0.15 });
  for (let i = 0; i < 15; i++) {
    const gx = rng(-W/2+8, W/2-8), gz = rng(-W/2+8, W/2-8);
    const gh = getHeight(gx, gz);
    if (gh > 0.3 && gh < 4.5 && fbm(gx*0.04+400, gz*0.04+400) > 0.35) {
      const g = new THREE.Mesh(new THREE.DodecahedronGeometry(rng(0.06, 0.18), 0), goldMat);
      g.position.set(gx, gh, gz);
      g.rotation.set(rng(0,6), rng(0,6), rng(0,6));
      scene.add(g);
    }
  }

  // ─── PINE TREES (40) ───
  const pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x225522, roughness: 0.8, flatShading: true });
  for (let i = 0; i < 40; i++) {
    const px = rng(-W/2+5, W/2-5), pz = rng(-W/2+5, W/2-5);
    const ph = getHeight(px, pz);
    if (ph > 1.5 && ph < 6 && fbm(px*0.03+80, pz*0.03+80) > 0.35) {
      const h = rng(1.5, 3.5);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, h, 5), pineTrunkMat);
      trunk.position.set(px, ph + h/2, pz);
      scene.add(trunk); trees.push(trunk);
      for (let j = 0; j < 3; j++) {
        const r = rng(0.2, 0.5) * (1 - j * 0.2);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r, rng(0.4, 0.7), 5), pineLeafMat);
        cone.position.set(px, ph + h * 0.4 + j * h * 0.25, pz);
        scene.add(cone); trees.push(cone);
      }
    }
  }

  // ─── BUSHES (60) ───
  for (let i = 0; i < 60; i++) {
    const bx = rng(-W/2+5, W/2-5), bz = rng(-W/2+5, W/2-5);
    const bh = getHeight(bx, bz);
    if (bh > 0.8 && bh < 3 && fbm(bx*0.06+50, bz*0.06+50) > 0.4) {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(rng(0.15, 0.3), 5, 5), bushMat);
      bush.position.set(bx, bh + rng(0.1, 0.25), bz);
      bush.scale.y = rng(0.5, 0.8);
      scene.add(bush); bushes.push(bush);
    }
  }

  // ─── ROCKS (60) ───
  for (let i = 0; i < 60; i++) {
    const rx = rng(-W/2+5, W/2-5), rz = rng(-W/2+5, W/2-5);
    const rh = getHeight(rx, rz);
    if (rh > 0.2 && rh < 6) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rng(0.15, 0.7), 0), i%3===0?rockMat2:rockMat);
      rock.position.set(rx, rh + rng(0, 0.15), rz);
      rock.scale.y = rng(0.25, 0.55);
      rock.rotation.set(rng(0,6), rng(0,6), rng(0,6));
      scene.add(rock); rocks.push(rock);
    }
  }

  // ─── FLOWERS (150) ───
  for (let i = 0; i < 150; i++) {
    const fx = rng(-W/2+5, W/2-5), fz = rng(-W/2+5, W/2-5);
    const fh = getHeight(fx, fz);
    if (fh > 0.5 && fh < 3.5 && fbm(fx*0.07+80, fz*0.07+80) > 0.35) {
      const fm = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(rng(0.4, 1), 0.75, 0.5+rng(0,0.15)), roughness: 0.5 });
      const f = new THREE.Mesh(new THREE.SphereGeometry(rng(0.04, 0.07), 4, 4), fm);
      f.position.set(fx, fh + rng(0.04, 0.12), fz);
      scene.add(f); flowers.push(f);
    }
  }

  // ─── GRASS POINTS ───
  let gp = [];
  for (let i = 0; i < 500; i++) {
    const gx = rng(-W/2+5, W/2-5), gz = rng(-W/2+5, W/2-5);
    const gh = getHeight(gx, gz);
    if (gh > 0.5 && gh < 3.5 && fbm(gx*0.05+120, gz*0.05+120) > 0.3) {
      gp.push(gx, gh, gz);
    }
  }
  if (gp.length > 0) {
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
    const gMat = new THREE.PointsMaterial({ color: 0x55cc55, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.7 });
    const gMesh = new THREE.Points(gGeo, gMat);
    scene.add(gMesh);
  }

  return { ground: mesh, water: wMesh, trees, rocks, bushes, flowers };
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
  for (let i = 0; i < 60; i++) {
    const cloud = new THREE.Sprite(cloudMat);
    const s = rng(4, 12);
    cloud.scale.set(s, s * 0.4, 1);
    cloud.position.set(rng(-W, W), rng(12, 20), rng(-W, W));
    scene.add(cloud);
    clouds.push({ sprite: cloud, speed: rng(0.1, 0.3), dx: rng(-1, 1) });
  }
  return clouds;
}

// ─── SKY ─────────────────────────────────────────────────
function makeSky(scene) {
  const c = document.createElement("canvas"); c.width = 1; c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#0a1428"); g.addColorStop(0.15, "#1a3050");
  g.addColorStop(0.35, "#4a7abb"); g.addColorStop(0.55, "#87CEEB");
  g.addColorStop(0.72, "#FFCC88"); g.addColorStop(0.85, "#FFEECC");
  g.addColorStop(1, "#FFEECC");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 256);
  const tex = new THREE.CanvasTexture(c);
  const geo = new THREE.SphereGeometry(190, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
  const sky = new THREE.Mesh(geo, mat); scene.add(sky);
  return sky;
}

// ─── PLAYER SHADOW ──────────────────────────────────────
function makeShadow() {
  const c = document.createElement("canvas"); c.width = 32; c.height = 32;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0,"rgba(0,0,0,0.35)"); g.addColorStop(0.5,"rgba(0,0,0,0.12)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  s.scale.set(1.2, 1.2, 1);
  return s;
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

// ─── SUN ─────────────────────────────────────────────────
function makeSun(scene) {
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFEEAA });
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), sunMat);
  sunMesh.position.set(50, 60, 30);
  scene.add(sunMesh);
  const glowMat = new THREE.SpriteMaterial({
    map: (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 64;
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0,"rgba(255,238,170,0.8)"); g.addColorStop(0.3,"rgba(255,238,170,0.3)");
      g.addColorStop(1,"rgba(255,238,170,0)");
      ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(20,20,1);
  glow.position.copy(sunMesh.position);
  scene.add(glow);
  return sunMesh;
}

// ─── BIRDS ──────────────────────────────────────────────
function makeBirds(scene) {
  const birds = [];
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true, side: THREE.DoubleSide });
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.25), wingMat);
    body.position.y = 0; g.add(body);
    const lWing = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.08), wingMat);
    lWing.position.set(-0.15, 0.04, 0);
    lWing.rotation.z = 0.3; lWing.name = "lw";
    g.add(lWing);
    const rWing = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.08), wingMat);
    rWing.position.set(0.15, 0.04, 0);
    rWing.rotation.z = -0.3; rWing.name = "rw";
    g.add(rWing);
    g.position.set(rng(-W/2, W/2), rng(8, 15), rng(-W/2, W/2));
    g.rotation.y = rng(0, Math.PI*2);
    scene.add(g);
    birds.push({ g, lWing, rWing, phase: rng(0, Math.PI*2), speed: rng(0.3, 0.7), cx: g.position.x, cy: g.position.y, cz: g.position.z });
  }
  return birds;
}

// ─── STRUCTURES ─────────────────────────────────────────
function buildStructures(scene) {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xc4a46a, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: 0.8 });
  const roofMat2 = new THREE.MeshStandardMaterial({ color: 0x6a2a1a, roughness: 0.8 });
  const logMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x707070, roughness: 0.9 });
  const plankMat = new THREE.MeshStandardMaterial({ color: 0xbb9955, roughness: 0.7 });
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.95 });
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 });
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xff8844 });

  function hut(vx, vz, rotY) {
    const vh = getHeight(vx, vz);
    if (vh < 0.3 || vh > 3) return;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.2), wallMat);
    wall.position.set(vx, vh+0.4, vz); scene.add(wall);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 4), rotY > 0 ? roofMat2 : roofMat);
    roof.position.set(vx, vh+1.05, vz);
    roof.rotation.y = rotY + Math.PI/4; scene.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.05), new THREE.MeshStandardMaterial({ color: 0x5a3a1a }));
    door.position.set(vx, vh+0.3, vz+0.6); scene.add(door);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0x88ccff }));
    win.position.set(vx+0.5, vh+0.5, vz); scene.add(win);
    const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0x88ccff }));
    win2.position.set(vx-0.5, vh+0.5, vz); scene.add(win2);
  }

  // Village near spawn (5 huts)
  hut(8, 0, 0);
  hut(10.5, 2, 0.5);
  hut(6, 3, -0.3);
  hut(4, -2, 0.8);
  hut(12, -1, -0.2);

  // Well at village center
  const wwx = 8.5, wwz = 1, wwh = getHeight(wwx, wwz);
  if (wwh > 0) {
    const wellMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 });
    const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.15, 8), wellMat);
    wellBase.position.set(wwx, wwh + 0.07, wwz); scene.add(wellBase);
    for (let i = 0; i < 4; i++) {
      const a = (i/4)*Math.PI*2 + Math.PI/4;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), wellMat);
      p.position.set(wwx + Math.cos(a)*0.2, wwh+0.25, wwz + Math.sin(a)*0.2);
      scene.add(p);
    }
    const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.08, 4), new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: 0.8 }));
    wellRoof.position.set(wwx, wwh+0.45, wwz); wellRoof.rotation.y = Math.PI/4; scene.add(wellRoof);
  }

  // Stone path between huts
  const stoneMat2 = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.9 });
  for (let i = 0; i < 20; i++) {
    const spx = 7 + rng(-2, 4), spz = -1 + rng(-1.5, 3.5);
    const sph = getHeight(spx, spz);
    if (sph > 0) {
      const st = new THREE.Mesh(new THREE.CircleGeometry(rng(0.04, 0.1), 5), stoneMat2);
      st.position.set(spx, sph, spz);
      st.rotation.x = -Math.PI / 2;
      scene.add(st);
    }
  }

  // Fence around village
  const fencePositions = [[7, -1.5], [11, -1.5], [12.5, 1], [12.5, 3], [11, 4.5], [7, 4.5], [5.5, 3], [5.5, 1]];
  for (const [fx, fz] of fencePositions) {
    const fh = getHeight(fx, fz);
    if (fh > 0) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.5, 4), fenceMat);
      post.position.set(fx, fh + 0.25, fz);
      scene.add(post);
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), lanternMat);
      lantern.position.set(fx, fh + 0.55, fz);
      scene.add(lantern);
    }
  }

  // Campfire at village center
  const cfx = 8, cfz = 1.5, cfh = getHeight(cfx, cfz);
  if (cfh > 0) {
    for (let i = 0; i < 6; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.25, 5), logMat);
      log.position.set(cfx + rng(-0.15, 0.15), cfh + 0.05, cfz + rng(-0.15, 0.15));
      log.rotation.set(rng(0, 1), 0, rng(0, 1)); scene.add(log);
    }
    const fireLight = new THREE.PointLight(0xff6622, 0.8, 4);
    fireLight.position.set(cfx, cfh + 0.5, cfz); scene.add(fireLight);
  }

  // Dirt road from spawn to village
  for (let i = -5; i <= 12; i++) {
    const rx = i * 0.3, rz = Math.sin(i * 0.3) * 0.5 + 1;
    const rh = getHeight(rx, rz);
    if (rh > -0.5) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), roadMat);
      seg.position.set(rx, rh - 0.01, rz);
      scene.add(seg);
    }
  }

  // Small lookout tower
  const twx = 4, twz = -6, twh = getHeight(twx, twz);
  if (twh > 0.5 && twh < 5) {
    for (let i = 0; i < 3; i++) {
      const tw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), stoneMat);
      tw.position.set(twx, twh + i * 0.7 + 0.35, twz);
      scene.add(tw);
    }
    const troof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.3, 4), roofMat);
    troof.position.set(twx, twh + 2.6, twz);
    troof.rotation.y = Math.PI / 4; scene.add(troof);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.2, 0.12), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
    flag.position.set(twx + 0.4, twh + 2.8, twz);
    scene.add(flag);
  }

  // Ruin (broken stone walls)
  const rux = -14, ruz = -8, ruh = getHeight(rux, ruz);
  if (ruh > 0) {
    for (let i = 0; i < 8; i++) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(rng(0.25, 0.6), rng(0.15, 0.5), rng(0.15, 0.25)), stoneMat);
      sw.position.set(rux + rng(-1.2, 1.2), ruh + rng(0.05, 0.4), ruz + rng(-1.2, 1.2));
      sw.rotation.set(rng(-0.3, 0.3), rng(0, 6), rng(-0.3, 0.3));
      scene.add(sw);
    }
    const ivy = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.02), new THREE.MeshBasicMaterial({ color: 0x336633 }));
    ivy.position.set(rux + 0.8, ruh + 0.3, ruz + 0.7);
    ivy.rotation.z = 0.2; scene.add(ivy);
  }

  // Wooden bridge over river
  const bStart = 5, bEnd = 12;
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const bx = bStart + t * (bEnd - bStart);
    const bz = Math.sin(bx * 0.15) * 3;
    const bh = getHeight(bx, bz);
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.15), plankMat);
    plank.position.set(bx, bh + 0.05, bz);
    plank.rotation.y = Math.atan2(Math.cos(bx * 0.15) * 3 * 0.15, 1) * 0.5;
    scene.add(plank);
  }
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

  // ─── INIT: RENDERER + SCENE + WORLD ───
  useEffect(() => {
    console.log("[BASE] Init start");
    if (screen !== "game" || !mountRef.current || sceneRef.current) return;
    const mount = mountRef.current;
    const W2 = mount.clientWidth, H2 = mount.clientHeight;
    document.body.style.cursor = "default";
    let worldOk = false;

    // Renderer — minimal, no shadows, no tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W2, H2);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Scene — cinematic sky + subtle fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.0012);

    // Camera — third person, safe height
    const camDist = 8, camHeight = 5;
    const camera = new THREE.PerspectiveCamera(55, W2 / H2, 0.1, 250);
    camera.position.set(0, camHeight, camDist);
    camera.lookAt(0, 0, 0);

    // Lighting — warm golden hour
    const amb = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(amb);
    const hemi = new THREE.HemisphereLight(0x88CCFF, 0xCC9966, 0.3);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xFFCC88, 1.2);
    sun.position.set(20, 35, 15);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x88AAEE, 0.2);
    fill.position.set(-10, 15, -15);
    scene.add(fill);

    // ─── SAFETY FALLBACK ───
    const fbMat = new THREE.MeshBasicMaterial({ color: 0x44cc44, side: THREE.DoubleSide });
    const fbGround = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), fbMat);
    fbGround.rotation.x = -Math.PI / 2;
    fbGround.position.y = -1;
    fbGround.name = "fallback";
    scene.add(fbGround);
    const fbCube = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
    fbCube.position.set(0, -0.7, 0);
    fbCube.name = "fallback";
    scene.add(fbCube);

    // ─── BUILD WORLD ───
    let world = null;
    try {
      world = buildWorld(scene);
      worldOk = true;
      fbGround.visible = false;
      fbCube.visible = false;
      console.log("[BASE] World built OK");
    } catch (e) {
      console.error("[BASE] World failed:", e);
      world = null;
      worldOk = false;
    }

    // ─── PLAYER ───
    const spawnH = worldOk ? getHeight(0, 0) : 0;
    const player = makePlayer(scene);
    player.group.position.set(0, spawnH, 0);
    playerRef.current = player;

    // ─── CLOUDS ───
    const clouds = makeClouds(scene);

    // ─── ANIMALS ───
    let animals = [];
    if (worldOk) {
      try { animals = spawnAnimals(scene, world); } catch (e) { animals = []; }
    }

    // ─── BIRDS ───
    let birds = [];
    if (worldOk) { try { birds = makeBirds(scene); } catch (e) { birds = []; } }

    // ─── SUN VISIBLE ───
    const sunMesh = worldOk ? makeSun(scene) : null;

    // ─── SKY DOME ───
    const skyDome = worldOk ? makeSky(scene) : null;

    // ─── STRUCTURES ───
    if (worldOk) { try { buildStructures(scene); } catch (e) { console.warn("[BASE] Structures failed:", e); } }

    // ─── PLAYER SHADOW ───
    const pShadow = makeShadow();
    if (worldOk) { scene.add(pShadow); }

    // ─── STORE REFS ───
    const raycaster = new THREE.Raycaster();
    sceneRef.current = { scene, renderer, camera, sun, amb, hemi, world, raycaster, player, spawnH };

    // Smooth camera variables
    const camPos = new THREE.Vector3(0, camHeight, camDist);
    const camTarget = new THREE.Vector3();

    // Walking animation state
    let walkPhase = 0;
    let wasMoving = false;

    // Day/night cycle
    let gameTime = 6;

    // ─── GAME LOOP ───
    let frameCount = 0;
    let prevTime = performance.now();
    const loop = (now) => {
      animRef.current = requestAnimationFrame(loop);
      frameCount++;

      const dt = Math.min(0.05, (now - prevTime) / 1000);
      prevTime = now;

      // Day/night cycle
      gameTime += dt * 0.008;
      const hours = gameTime % 24;
      const angle = (hours / 24) * Math.PI * 2 - Math.PI / 2;
      const sunY = Math.sin(angle) * 35 + 15;
      const sunX = Math.cos(angle) * 35;
      sun.position.set(sunX, Math.max(1, sunY), 0);

      let sunInt, sunCol, ambInt, hemiInt;
      if (hours < 5.5) {
        sunInt = 0.08; sunCol = new THREE.Color(0x446688); ambInt = 0.06; hemiInt = 0.08;
        scene.background.setHex(0x0a0a1a);
      } else if (hours < 7.5) {
        const t = (hours - 5.5) / 2;
        sunInt = 0.08 + t * 1.0; sunCol = new THREE.Color().lerpColors(new THREE.Color(0xFF6633), new THREE.Color(0xFFCC88), t);
        ambInt = 0.06 + t * 0.3; hemiInt = 0.08 + t * 0.22;
        scene.background.setHSL(0.6 - t * 0.08, 0.5 - t * 0.2, 0.1 + t * 0.25);
      } else if (hours < 17) {
        sunInt = 1.2; sunCol = new THREE.Color(0xFFCC88); ambInt = 0.4; hemiInt = 0.32;
        scene.background.setHex(0x87CEEB);
      } else if (hours < 19.5) {
        const t = (hours - 17) / 2.5;
        sunInt = 1.2 - t * 1.12; sunCol = new THREE.Color().lerpColors(new THREE.Color(0xFFCC88), new THREE.Color(0xFF5522), t);
        ambInt = 0.4 - t * 0.34; hemiInt = 0.32 - t * 0.24;
        scene.background.setHSL(0.58 + t * 0.08, 0.4 + t * 0.2, 0.55 - t * 0.3);
      } else {
        sunInt = 0.08; sunCol = new THREE.Color(0x446688); ambInt = 0.06; hemiInt = 0.08;
        scene.background.setHex(0x0a0a1a);
      }
      sun.color.copy(sunCol);
      sun.intensity = sunInt;
      amb.intensity = ambInt;
      hemi.intensity = hemiInt;

      // Player movement
      const keys = keysRef.current;
      const speed = keys["ShiftLeft"] || keys["ShiftRight"] ? 6 : 3;
      const yaw = cameraRef.current.yaw;
      const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
      const move = new THREE.Vector3();
      let moving = false;
      if (keys["KeyW"] || keys["ArrowUp"]) { move.add(fwd); moving = true; }
      if (keys["KeyS"] || keys["ArrowDown"]) { move.sub(fwd); moving = true; }
      if (keys["KeyA"] || keys["ArrowLeft"]) { move.sub(right); moving = true; }
      if (keys["KeyD"] || keys["ArrowRight"]) { move.add(right); moving = true; }
      const isMoving = move.lengthSq() > 0.0001;
      if (isMoving) {
        move.normalize().multiplyScalar(speed * dt);
        const nx = player.group.position.x + move.x;
        const nz = player.group.position.z + move.z;
        const nh = worldOk ? getHeight(nx, nz) : 0;
        player.group.position.set(nx, nh, nz);
        player.group.rotation.y = Math.atan2(move.x, move.z);
        walkPhase += dt * speed * 2;
        wasMoving = true;
      } else {
        walkPhase += dt * 0.3;
        wasMoving = false;
      }

      // Player animation
      const breathe = Math.sin(performance.now() * 0.002) * 0.015;
      const headTilt = Math.sin(performance.now() * 0.0015) * 0.02;
      if (isMoving) {
        const swing = Math.sin(walkPhase) * 0.2;
        player.lArm.rotation.x = swing;
        player.rArm.rotation.x = -swing;
        player.lLeg.rotation.x = -swing * 0.5;
        player.rLeg.rotation.x = swing * 0.5;
        player.body.position.y = 0.85 + Math.abs(Math.sin(walkPhase)) * 0.04;
        player.head.position.y = 1.35 + breathe;
      } else {
        const idleSwing = Math.sin(performance.now() * 0.0008) * 0.03;
        player.lArm.rotation.x = idleSwing + breathe;
        player.rArm.rotation.x = -idleSwing + breathe;
        player.lLeg.rotation.x = -idleSwing * 0.3;
        player.rLeg.rotation.x = idleSwing * 0.3;
        player.body.position.y = 0.85 + breathe * 0.5;
        player.head.position.y = 1.35 + breathe;
        player.head.rotation.x = headTilt;
      }

      // Smooth third-person camera
      const tgt = player.group.position;
      const targetPos = new THREE.Vector3(
        tgt.x + Math.sin(yaw) * camDist,
        tgt.y + camHeight,
        tgt.z + Math.cos(yaw) * camDist
      );
      camPos.lerp(targetPos, 1 - Math.pow(0.01, dt));
      camera.position.copy(camPos);
      camTarget.set(tgt.x, tgt.y + 1, tgt.z);
      camera.lookAt(camTarget);

      // Clouds drift
      for (const c of clouds) {
        c.sprite.position.x += c.dx * dt * c.speed;
        if (c.sprite.position.x > W + 20) c.sprite.position.x = -(W + 20);
        if (c.sprite.position.x < -(W + 20)) c.sprite.position.x = W + 20;
      }

      // Animals
      for (const a of animals) {
        a.phase += dt * a.speed * 0.2;
        a.group.position.x = a.ax + Math.sin(a.phase) * 2;
        a.group.position.z = a.az + Math.cos(a.phase * 0.7) * 2;
        a.group.position.y = worldOk ? getHeight(a.group.position.x, a.group.position.z) : 0;
      }

      // Birds
      const birdTime = performance.now() * 0.001;
      for (const b of birds) {
        b.g.position.x = b.cx + Math.sin(birdTime * b.speed + b.phase) * 6;
        b.g.position.z = b.cz + Math.cos(birdTime * b.speed * 0.7 + b.phase) * 6;
        b.g.position.y = b.cy + Math.sin(birdTime * b.speed * 0.5 + b.phase) * 2;
        const wingAngle = Math.sin(birdTime * 3 + b.phase) * 0.5;
        b.lWing.rotation.z = 0.3 + wingAngle;
        b.rWing.rotation.z = -0.3 - wingAngle;
      }

      // Water animation
      if (world?.water?.geometry?.attributes?.position) {
        const wp = world.water.geometry.attributes.position;
        const wt = performance.now() * 0.001;
        for (let i = 0; i < wp.count; i++) {
          const wx = wp.getX(i), wz = wp.getZ(i);
          wp.setY(i, Math.sin(wx * 0.08 + wt * 0.8) * 0.08 + Math.cos(wz * 0.1 + wt * 0.6) * 0.06);
        }
        wp.needsUpdate = true;
        world.water.geometry.computeVertexNormals();
      }

      // Player shadow
      pShadow.position.set(player.group.position.x, player.group.position.y + 0.05, player.group.position.z);

      // Debug (every 30 frames)
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
    console.log("[BASE] Loop started");

    return () => {
      cancelAnimationFrame(animRef.current);
      renderer.dispose();
      sceneRef.current = null;
      playerRef.current = null;
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
