import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import "./VirtualShoppingBrane.css";

const WORLD = { size: 200, treeCount: 120, deadTreeCount: 30 };

const BUILDINGS = [
  { x: -22, z: -24, w: 7, h: 5.5, d: 6, story: 2, type: "house" },
  { x: -14, z: -26, w: 5, h: 4.5, d: 4.5, story: 2, type: "apartment", broken: true },
  { x: -8, z: -20, w: 5, h: 3.8, d: 4.5, story: 1, type: "house" },
  { x: 0, z: -28, w: 9, h: 8.0, d: 6, story: 3, type: "apartment" },
  { x: 8, z: -24, w: 5.5, h: 5.0, d: 5, story: 1, type: "store", broken: true },
  { x: 16, z: -26, w: 5, h: 4.2, d: 4, story: 1, type: "house" },
  { x: -24, z: 2, w: 6, h: 5.5, d: 5, story: 2, type: "apartment", broken: true },
  { x: -16, z: 6, w: 4.5, h: 3.8, d: 4, story: 1, type: "house" },
  { x: -8, z: 2, w: 7, h: 6.5, d: 5.5, story: 2, type: "apartment" },
  { x: 2, z: 8, w: 5, h: 4.5, d: 4.5, story: 1, type: "store", broken: true },
  { x: 10, z: 4, w: 5.5, h: 5.0, d: 5, story: 1, type: "house" },
  { x: 18, z: 1, w: 4, h: 3.5, d: 3.5, story: 1, type: "house" },
  { x: -28, z: 18, w: 5, h: 3.8, d: 4, story: 1, type: "house" },
  { x: -20, z: 22, w: 6, h: 5.5, d: 5, story: 2, type: "apartment" },
  { x: -12, z: 18, w: 4.5, h: 3.8, d: 4, story: 1, type: "house", broken: true },
  { x: -2, z: 24, w: 7, h: 6.5, d: 5.5, story: 2, type: "apartment" },
  { x: 8, z: 20, w: 5, h: 4.5, d: 4.5, story: 1, type: "house" },
  { x: 16, z: 18, w: 4.5, h: 3.8, d: 4, story: 1, type: "house" },
];

const ENEMIES = [
  { x: -10, z: -12 }, { x: 6, z: 4 }, { x: -14, z: 12 }, { x: 12, z: -8 }, { x: -4, z: 18 },
];

const INTERACTIVES = [
  { name: "Kit Médico", emoji: "🩹", color: "#ff4444", desc: "Bandagens e antisséptico. Cura 30 de vida.", x: -12, z: -8 },
  { name: "Ração Militar", emoji: "🥫", color: "#cc8833", desc: "Alimento enlatado não perecível.", x: 5, z: 2 },
  { name: "Munição 9mm", emoji: "🔫", color: "#aaaacc", desc: "Caixa de munição calibre 9mm.", x: -4, z: -12 },
  { name: "Gasolina", emoji: "⛽", color: "#33cc33", desc: "Galão de gasolina 5L.", x: 10, z: -4 },
  { name: "Faca Tática", emoji: "🔪", color: "#888888", desc: "Faca de combate tática.", x: -8, z: 10 },
  { name: "Lampião", emoji: "💡", color: "#ffdd44", desc: "Lanterna de mão com pilhas.", x: 2, z: 14 },
];

const ENEMY_DETECT = 14, ENEMY_ATTACK_DIST = 1.8, ENEMY_DMG = 9, ENEMY_HP = 60;
const PLAYER_ATTACK_DIST = 2.2, PLAYER_ATTACK_DMG = 30, HEAL_AMOUNT = 30;

// ── PBR TEXTURES ──

function heightNoise(x, y, w, h, seed) {
  const sx = (x + seed * 137.5) % w, sy = (y + seed * 97.3) % h;
  const v = (Math.sin(sx * 12.9898 + sy * 78.233) * 43758.5453) % 1;
  return (v + 1) * 0.5;
}

// 2D value noise with smooth interpolation for natural terrain
function valNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const h = (a, b) => { const n = a * 374761393 + b * 668265263; return ((n * (n + 17) * 668265263) >>> 0) / 4294967296; };
  const v00 = h(ix, iy), v10 = h(ix + 1, iy), v01 = h(ix, iy + 1), v11 = h(ix + 1, iy + 1);
  return (v00 + (v10 - v00) * sx) + ((v01 + (v11 - v01) * sx) - (v00 + (v10 - v00) * sx)) * sy;
}

function fbm(x, y, oct) {
  let val = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < (oct || 5); i++) { val += valNoise(x * freq, y * freq) * amp; max += amp; amp *= 0.5; freq *= 2; }
  return val / max;
}

function pbrTex(w, h, baseR, baseG, baseB, intensity, repeat, opt) {
  const dc = document.createElement("canvas");
  dc.width = w; dc.height = h;
  const dctx = dc.getContext("2d");
  const dId = dctx.createImageData(w, h);
  const nc = document.createElement("canvas");
  nc.width = w; nc.height = h;
  const nctx = nc.getContext("2d");
  const nId = nctx.createImageData(w, h);
  const hf = new Float32Array(w * h);
  const seed = opt?.seed || 1, contrast = opt?.contrast || 1;
  const groutH = opt?.groutH || 0, groutV = opt?.groutV || 0, gw = opt?.groutWidth || 2;
  const sc = opt?.scratchCount || 10;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const f1 = heightNoise(x, y, w, h, seed);
    const f2 = heightNoise(x + 53, y + 71, w, h, seed + 1);
    const f3 = heightNoise(x + 137, y + 211, w, h, seed + 2);
    const height = (f1 * 0.5 + f2 * 0.3 + f3 * 0.2) * intensity * contrast;
    hf[y * w + x] = height;
    const idx = (y * w + x) * 4;
    let r = baseR + height, g = baseG + height, b = baseB + height;
    if (groutH && y % groutH < gw) { r *= 0.6; g *= 0.6; b *= 0.6; }
    if (groutV && x % groutV < gw) { r *= 0.6; g *= 0.6; b *= 0.6; }
    dId.data[idx] = Math.min(255, Math.max(0, r));
    dId.data[idx + 1] = Math.min(255, Math.max(0, g));
    dId.data[idx + 2] = Math.min(255, Math.max(0, b));
    dId.data[idx + 3] = 255;
  }
  dctx.putImageData(dId, 0, 0);
  for (let i = 0; i < sc; i++) {
    const sy = Math.random() * h;
    dctx.fillStyle = `rgba(${baseR - 30},${baseG - 30},${baseB - 30},0.1)`;
    dctx.fillRect(0, sy, w, 1 + Math.random() * 2);
  }
  const ns = opt?.normalStrength || 2;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const hl = hf[y * w + (x - 1)], hr = hf[y * w + (x + 1)];
    const hd = hf[(y - 1) * w + x], hu = hf[(y + 1) * w + x];
    const dx = (hr - hl) * ns / w, dy = (hu - hd) * ns / h;
    const len = Math.sqrt(dx * dx + dy * dy + 1);
    const idx = (y * w + x) * 4;
    nId.data[idx] = ((-dx / len) * 0.5 + 0.5) * 255;
    nId.data[idx + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
    nId.data[idx + 2] = (1 / len * 0.5 + 0.5) * 255;
    nId.data[idx + 3] = 255;
  }
  nctx.putImageData(nId, 0, 0);
  const diffuse = new THREE.CanvasTexture(dc);
  diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
  if (repeat) diffuse.repeat.set(repeat, repeat);
  diffuse.anisotropy = 4; diffuse.needsUpdate = true;
  const normal = new THREE.CanvasTexture(nc);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  if (repeat) normal.repeat.set(repeat * 0.5, repeat * 0.5);
  normal.anisotropy = 4; normal.needsUpdate = true;
  return { map: diffuse, normalMap: normal };
}

const texCache = {};
function getTex(name, fn) { if (!texCache[name]) texCache[name] = fn(); return texCache[name]; }

function concTex(r) { return pbrTex(256, 256, 120, 125, 130, 30, r || 2, { groutH: 48, groutV: 64, gw: 2, scratchCount: 15, normalStrength: 3, contrast: 1.2, seed: 10 }); }
function aspTex(r) { return pbrTex(256, 256, 50, 52, 58, 25, r || 3, { scratchCount: 10, normalStrength: 3.5, contrast: 1.5, seed: 20 }); }
function mudTex(r) { return pbrTex(128, 128, 55, 45, 35, 25, r || 3, { scratchCount: 3, normalStrength: 1.5, contrast: 1, seed: 26 }); }
function roofTex(r) { return pbrTex(128, 128, 65, 60, 55, 18, r || 2, { scratchCount: 12, normalStrength: 2.5, contrast: 1.2, seed: 30 }); }
function woodTex(r) { return pbrTex(128, 128, 95, 75, 55, 20, r || 2, { groutV: 8, gw: 3, scratchCount: 20, normalStrength: 4, contrast: 1.4, seed: 40 }); }
function barkTex(r) { return pbrTex(128, 256, 65, 45, 25, 22, r || 1, { groutV: 10, gw: 4, scratchCount: 20, normalStrength: 4, contrast: 1.5, seed: 50 }); }
function leafTex(r) { return pbrTex(128, 128, 30, 70, 20, 28, r || 2, { scratchCount: 0, normalStrength: 2.5, contrast: 1.4, seed: 60 }); }
function rustTex(r) { return pbrTex(64, 64, 100, 55, 30, 25, r || 1, { scratchCount: 8, normalStrength: 3, contrast: 1.6, seed: 70 }); }
function fabricTex(r) { return pbrTex(64, 64, 60, 60, 75, 12, r || 1, { groutH: 4, groutV: 4, gw: 1, scratchCount: 0, normalStrength: 0.8, contrast: 0.6, seed: 80 }); }
function skinTex() { return pbrTex(64, 64, 200, 155, 115, 8, 1, { scratchCount: 0, normalStrength: 0.5, contrast: 0.3, seed: 90 }); }
function zombieSkinTex() { return pbrTex(64, 64, 70, 90, 60, 15, 1, { scratchCount: 10, normalStrength: 0.8, contrast: 1.2, seed: 95 }); }

function mat(ts, roughness, metalness, color) {
  return new THREE.MeshStandardMaterial({ map: ts.map, normalMap: ts.normalMap, roughness, metalness, color: color || 0xffffff, envMapIntensity: 0.2 });
}

function skyGrad() {
  const c = document.createElement("canvas");
  c.width = 1; c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#2a3a4a"); g.addColorStop(0.1, "#3a4a5a"); g.addColorStop(0.25, "#5a7a8a");
  g.addColorStop(0.4, "#7a9aaa"); g.addColorStop(0.55, "#9ababb"); g.addColorStop(0.7, "#aabbab");
  g.addColorStop(0.85, "#bbaaaa"); g.addColorStop(0.95, "#ccbbaa"); g.addColorStop(1, "#ddccbb");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

function windowDarkTex() {
  const c = document.createElement("canvas"); c.width = 32; c.height = 64;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#050510"; ctx.fillRect(0, 0, 32, 64);
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 32, y = Math.random() * 64;
    const br = 20 + Math.random() * 30;
    ctx.fillStyle = `rgba(${br},${br + 5},${br + 15},0.03)`;
    ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  ctx.fillStyle = "rgba(10,10,20,0.3)";
  ctx.fillRect(0, 20, 32, 2); ctx.fillRect(0, 42, 32, 2);
  ctx.fillRect(15, 0, 2, 64);
  return new THREE.CanvasTexture(c);
}

// ── WORLD BUILDERS ──

function makeTerrain() {
  const seg = 160;
  const geo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const grassSet = getTex("grass", () => pbrTex(128, 128, 65, 120, 40, 30, 15, { scratchCount: 0, normalStrength: 2.5, contrast: 1.3, seed: 100 }));
  const hf = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = (fbm(x * 0.02 + 5.3, z * 0.02 + 9.1, 5) - 0.5) * 2.0 + Math.sin(x * 0.015 + z * 0.018) * 0.3;
    const flatVal = Math.max(0, 1 - Math.abs(h) * 1.5);
    const h2 = h * (0.6 + flatVal * 0.4);
    pos.setY(i, h2);
    hf[i] = h2;
    const n = (h2 + 1) * 0.5;
    const grassAmt = Math.max(0, 1 - Math.abs(h2) * 1.8 - Math.max(0, (h2 - 0.3)) * 2);
    const mudAmt = Math.max(0, 1 - (h2 + 0.8) * 2);
    const rockAmt = Math.max(0, (h2 - 0.4) * 1.5);
    const r = mudAmt * 0.35 + grassAmt * (0.12 + Math.random() * 0.06) + rockAmt * 0.28;
    const g = mudAmt * 0.28 + grassAmt * (0.18 + Math.random() * 0.08) + rockAmt * 0.22;
    const b = mudAmt * 0.2 + grassAmt * (0.07 + Math.random() * 0.04) + rockAmt * 0.18;
    colors[i * 3] = Math.min(0.5, r); colors[i * 3 + 1] = Math.min(0.6, g); colors[i * 3 + 2] = Math.min(0.4, b);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const m = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, vertexColors: true, map: grassSet.map, normalMap: grassSet.normalMap, normalScale: new THREE.Vector2(2, 2), envMapIntensity: 0.15 });
  const mesh = new THREE.Mesh(geo, m);
  mesh.receiveShadow = true;
  return { mesh, hf };
}

function makeRoadBroken(px, pz, w, d, angle) {
  const g = new THREE.PlaneGeometry(w, d, 12, 12);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x2 = pos.getX(i), z2 = pos.getZ(i);
    let h = (Math.sin(x2 * 0.5 + z2 * 0.3) * 0.02 + Math.sin(x2 * 0.3 - z2 * 0.4) * 0.015) + 0.008;
    if (Math.random() < 0.15) h -= 0.02 + Math.random() * 0.04;
    pos.setY(i, h);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  const aspSet = getTex("road", () => aspTex(2));
  const m2 = new THREE.Mesh(g, mat(aspSet, 0.9, 0.05));
  m2.position.set(px, 0.015, pz);
  m2.rotation.y = angle;
  m2.receiveShadow = true;
  return m2;
}

function makeTreePine(x, z, s) {
  const g = new THREE.Group();
  const barkS = getTex("bark", () => barkTex(1));
  const leafS = getTex("pine_leaf", () => pbrTex(64, 64, 25, 55, 18, 28, 2, { scratchCount: 0, normalStrength: 2.5, contrast: 1.4, seed: 65 }));
  const trunkM = mat(barkS, 0.9, 0);
  const folColors = [0x1a4a0a, 0x1a5a0a, 0x1a3a0a, 0x2a4a0a, 0x1a5a08, 0x2a5a0a];
  const folMs = folColors.map(c => mat(leafS, 0.85, 0, c));
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.055 * s, 0.1 * s, s, 7), trunkM);
  trunk.position.y = 0.5 * s; trunk.castShadow = true; g.add(trunk);
  const nLayers = 6 + Math.floor(Math.random() * 2);
  for (let i = 0; i < nLayers; i++) {
    const t = i / nLayers;
    const yr = 0.55 + t * 0.55;
    const rad = (0.45 - t * 0.2) * s * (0.9 + Math.random() * 0.1);
    const height = (0.25 + (1 - t) * 0.12) * s;
    const fol = new THREE.Mesh(new THREE.ConeGeometry(rad, height, 7), folMs[i % folMs.length]);
    fol.position.y = yr * s;
    fol.rotation.z = (Math.random() - 0.5) * 0.04;
    fol.rotation.x = (Math.random() - 0.5) * 0.04;
    fol.castShadow = true; g.add(fol);
  }
  for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * s, 0.015 * s, 0.08 * s * (0.8 + Math.random() * 0.4), 4), trunkM);
    const a = Math.random() * 6.28;
    br.position.set(Math.cos(a) * 0.06 * s, 0.3 * s + Math.random() * 0.4 * s, Math.sin(a) * 0.06 * s);
    br.rotation.z = Math.cos(a) * (0.3 + Math.random() * 0.4);
    br.rotation.x = Math.sin(a) * (0.3 + Math.random() * 0.4);
    g.add(br);
  }
  g.position.set(x, 0, z); g.rotation.y = Math.random() * 6.28;
  return g;
}

function makeTreeDead(x, z, s) {
  const g = new THREE.Group();
  const barkS = getTex("bark_dead", () => pbrTex(64, 128, 55, 40, 25, 20, 1, { groutV: 8, gw: 3, scratchCount: 15, normalStrength: 3.5, contrast: 1.3, seed: 55 }));
  const trunkM = mat(barkS, 0.9, 0, 0x3a2a1a);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.08 * s, 0.8 * s, 6), trunkM);
  trunk.position.y = 0.4 * s; trunk.castShadow = true; g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.01 * s, 0.02 * s, 0.15 * s * (0.5 + Math.random() * 0.5), 3), trunkM);
    br.position.set((Math.random() - 0.5) * 0.15 * s, 0.4 * s + Math.random() * 0.3 * s, (Math.random() - 0.5) * 0.15 * s);
    br.rotation.z = (Math.random() - 0.5) * 1.2; br.rotation.x = (Math.random() - 0.5) * 1.2;
    g.add(br);
  }
  g.position.set(x, 0, z);
  return g;
}

function makeBuildingAbandoned(p) {
  const g = new THREE.Group();
  const h = p.h * (p.story || 1);
  const concS = getTex("concrete", () => concTex(1.5));
  const wallMat = mat(concS, 0.9, 0.05, p.type === "store" ? 0x9a8a7a : 0x7a7a82);
  const body = new THREE.Mesh(new THREE.BoxGeometry(p.w, h, p.d), wallMat);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  // Floor ledges between stories
  if (p.story > 1) {
    const ledgeM = new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 0.85 });
    for (let s = 1; s < p.story; s++) {
      const ly = h * s / p.story;
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(p.w * 1.06, 0.03, p.d * 1.06), ledgeM);
      ledge.position.y = ly; g.add(ledge);
    }
  }
  const roofS = getTex("roof", () => roofTex(2));
  const roofMat2 = mat(roofS, 0.9, 0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(p.w, p.d) * 0.5, h * 0.15 + 0.15, 4), roofMat2);
  roof.position.y = h + 0.05; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  // Chimney for houses
  if (p.type === "house" && Math.random() > 0.5) {
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.9 }));
    chim.position.set(0.3, h + 0.08, 0.3); g.add(chim);
  }
  const winTex = windowDarkTex();
  const winMat = new THREE.MeshStandardMaterial({ map: winTex, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.05, color: 0x111122 });
  const frameMat2 = new THREE.MeshStandardMaterial({ color: 0x2a2a32, roughness: 0.8, metalness: 0.1 });
  const winN = Math.floor(p.w * 1.5);
  for (let side of [-1, 1]) for (let i = 0; i < winN; i++) {
    const wx = (i / (winN - 1 || 1) - 0.5) * p.w * 0.55;
    const wy = h * (0.35 + 0.3 * (i % 2));
    const broken = p.broken && Math.random() > 0.6;
    if (!broken) {
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), winMat);
      glass.position.set(wx, wy, side * (p.d / 2 + 0.01)); g.add(glass);
      for (let ft of [{ dy: 0.22 }, { dy: -0.22 }, { dx: -0.16 }, { dx: 0.16 }]) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(ft.dx ? 0.02 : 0.36, ft.dy ? 0.02 : 0.42, 0.02), frameMat2);
        f.position.set(wx + (ft.dx || 0), wy + (ft.dy || 0), side * (p.d / 2 + 0.015)); g.add(f);
      }
    }
  }
  if (p.broken) {
    const debS = getTex("debris", () => concTex(1));
    const debM = mat(debS, 0.95, 0.05, p.type === "store" ? 0x9a8a7a : 0x7a7a82);
    for (let i = 0; i < 12; i++) {
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.03 + Math.random() * 0.1, 0), debM);
      r.position.set((Math.random() - 0.5) * p.w * 0.7, 0.01 + Math.random() * 0.15, (Math.random() - 0.5) * p.d * 0.7);
      r.scale.set(1 + Math.random() * 1.5, 0.2 + Math.random() * 0.5, 1 + Math.random() * 1.5);
      r.castShadow = true; g.add(r);
    }
    const beamM = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9, metalness: 0.1 });
    for (let i = 0; i < 4; i++) {
      const bm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08 + Math.random() * 0.12, 0.03), beamM);
      bm.position.set((Math.random() - 0.5) * p.w * 0.6, Math.random() * h * 0.7 + 0.05, (Math.random() - 0.5) * p.d * 0.4);
      bm.rotation.x = Math.random() * 0.8; bm.rotation.z = Math.random() * 0.8;
      g.add(bm);
    }
  }
  const vineMat = new THREE.MeshBasicMaterial({ color: 0x2a3a1a, transparent: true, opacity: 0.12 + Math.random() * 0.12, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) {
    const vine = new THREE.Mesh(new THREE.PlaneGeometry(0.02 + Math.random() * 0.015, 0.3 + Math.random() * 1.0), vineMat);
    vine.position.set((Math.random() - 0.5) * p.w * 0.85, Math.random() * h * 0.75 + 0.15, p.d / 2 + 0.02);
    vine.rotation.z = (Math.random() - 0.5) * 0.4;
    g.add(vine);
  }
  g.position.set(p.x, 0, p.z);
  return g;
}

function makePowerPole(x, z) {
  const g = new THREE.Group();
  const woodS = getTex("wood", () => woodTex(1));
  const woodM = mat(woodS, 0.9, 0, 0x5a4a3a);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 1.6, 6), woodM);
  pole.position.y = 0.8; pole.castShadow = true; g.add(pole);
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), woodM);
  cross.rotation.z = Math.PI / 2; cross.position.set(0, 1.35, 0); g.add(cross);
  g.position.set(x, 0.02, z);
  return g;
}

function makeDestroyedCar(x, z, angle) {
  const g = new THREE.Group();
  const bodyS = getTex("car_body", () => pbrTex(128, 64, 68, 30, 25, 20, 1, { scratchCount: 15, normalStrength: 2.5, contrast: 1.3, seed: 400 }));
  const rustS = getTex("rust", () => rustTex(1));
  const bodyMat2 = mat(bodyS, 0.6, 0.5, 0x552222);
  const body2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.6), bodyMat2);
  body2.position.y = 0.2; body2.castShadow = true; g.add(body2);
  const cabin2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.7), mat(rustS, 0.5, 0.3, 0x443333));
  cabin2.position.set(0, 0.38, -0.15); g.add(cabin2);
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.15), new THREE.MeshStandardMaterial({ color: 0x334455, transparent: true, opacity: 0.15, roughness: 0.1, metalness: 0.3 }));
  windshield.position.set(0, 0.35, -0.48); g.add(windshield);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.4), mat(rustS, 0.8, 0.2, 0x552222));
  hood.position.set(0, 0.37, 0.5); g.add(hood);
  for (let s of [-1, 1]) for (let f of [-1, 1]) {
    if (Math.random() > 0.3) {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 5, 6), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 }));
      w.position.set(s * 0.35, 0.1, f * 0.5); w.rotation.y = Math.PI / 2; w.castShadow = true; g.add(w);
    }
  }
  g.position.set(x, 0.05, z); g.rotation.y = angle;
  return g;
}

function makeBarricade(x, z, angle) {
  const g = new THREE.Group();
  const woodS = getTex("wood", () => woodTex(1));
  const woodM = mat(woodS, 0.9, 0, 0x5a4a3a);
  for (let i = -1; i <= 1; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.5), woodM);
    plank.position.set(0, 0.08 + i * 0.08, 0); g.add(plank);
  }
  for (let s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.35, 4), woodM);
    leg.position.set(s * 0.2, 0.15, 0); g.add(leg);
  }
  g.position.set(x, 0.02, z); g.rotation.y = angle;
  return g;
}

function makeDebrisPile(x, z, s) {
  const g = new THREE.Group();
  const debS = getTex("debris2", () => concTex(1));
  const debM = mat(debS, 0.95, 0.05, 0x7a7a72);
  for (let i = 0; i < 5 + Math.floor(Math.random() * 5); i++) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.03 * s * (0.5 + Math.random() * 0.8), 0), debM);
    r.position.set((Math.random() - 0.5) * 0.3 * s, 0.01 + Math.random() * 0.08 * s, (Math.random() - 0.5) * 0.3 * s);
    r.scale.set(1 + Math.random(), 0.3 + Math.random() * 0.6, 1 + Math.random());
    r.castShadow = true; g.add(r);
  }
  g.position.set(x, 0, z);
  return g;
}

function makeFence(x, z, angle, len) {
  const g = new THREE.Group();
  const woodS = getTex("wood", () => woodTex(1));
  const woodM = mat(woodS, 0.9, 0, 0x4a3a2a);
  const n = Math.floor((len || 1.5) / 0.2);
  for (let i = 0; i < n; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.4, 4), woodM);
    post.position.set(i * 0.2 - (n - 1) * 0.1, 0.2, 0); g.add(post);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry((n - 1) * 0.2, 0.015, 0.015), woodM);
  rail.position.set(0, 0.25, 0); g.add(rail);
  const rail2 = new THREE.Mesh(new THREE.BoxGeometry((n - 1) * 0.2, 0.015, 0.015), woodM);
  rail2.position.set(0, 0.1, 0); g.add(rail2);
  g.position.set(x, 0.02, z); g.rotation.y = angle;
  return g;
}

function makeLampPost(x, z) {
  const g = new THREE.Group();
  const poleM = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.7, metalness: 0.3 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.6, 6), poleM);
  post.position.y = 0.8; g.add(post);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4), poleM);
  arm.rotation.z = Math.PI / 2; arm.position.set(0.12, 1.5, 0); g.add(arm);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: 0x888833 }));
  lamp.position.set(0.25, 1.48, 0); g.add(lamp);
  g.position.set(x, 0.02, z);
  return g;
}

function makeCloudLayer() {
  const g = new THREE.Group();
  const cloudM = new THREE.SpriteMaterial({ map: (() => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 64;
    const ctx = c.getContext("2d");
    const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,240,230,0.25)"); grd.addColorStop(0.3, "rgba(230,220,210,0.12)");
    grd.addColorStop(0.6, "rgba(200,190,180,0.04)"); grd.addColorStop(1, "rgba(200,190,180,0)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.5 });
  for (let i = 0; i < 20; i++) {
    const s = new THREE.Sprite(cloudM);
    const angle = Math.random() * 6.28;
    const rad = 30 + Math.random() * 50;
    s.position.set(Math.cos(angle) * rad, 18 + Math.random() * 12, Math.sin(angle) * rad);
    s.scale.set(8 + Math.random() * 14, 3 + Math.random() * 5, 1);
    s.material = cloudM.clone();
    s.material.opacity = 0.15 + Math.random() * 0.25;
    g.add(s);
  }
  return g;
}

function makeSkyCinematic() {
  const g = new THREE.Group();
  const skyG = new THREE.SphereGeometry(140, 32, 24);
  const skyT = skyGrad();
  const skyM = new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, fog: false });
  const sky = new THREE.Mesh(skyG, skyM);
  sky.position.y = -5; g.add(sky);
  const sunG = document.createElement("canvas");
  sunG.width = 128; sunG.height = 128;
  const sctx = sunG.getContext("2d");
  const sg = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  sg.addColorStop(0, "rgba(255,235,200,0.5)"); sg.addColorStop(0.2, "rgba(240,200,160,0.3)");
  sg.addColorStop(0.5, "rgba(200,170,140,0.08)"); sg.addColorStop(1, "rgba(200,170,140,0)");
  sctx.fillStyle = sg; sctx.fillRect(0, 0, 128, 128);
  const sMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(sunG), blending: THREE.AdditiveBlending, transparent: true, opacity: 0.6, depthWrite: false });
  const sprite = new THREE.Sprite(sMat);
  sprite.position.set(30, 35, 20); sprite.scale.set(18, 18, 1); g.add(sprite);
  g.add(makeCloudLayer());
  return g;
}

// ── CHARACTER ──

function makeCharacter() {
  const g = new THREE.Group();
  const skinS = getTex("skin", () => skinTex());
  const skinM = mat(skinS, 0.5, 0);
  const pantsS = getTex("pants", () => fabricTex(1));
  const pantsM = mat(pantsS, 0.85, 0.05, 0x3a3a3a);
  const jacketS = pbrTex(64, 64, 70, 85, 60, 14, 1, { scratchCount: 8, normalStrength: 1.5, contrast: 0.8, seed: 500 });
  const jacketM = mat(jacketS, 0.8, 0.02, 0x4a5a3a);
  const bootM = new THREE.MeshStandardMaterial({ color: 0x2a2a1a, roughness: 0.9 });
  const bagS = getTex("bag", () => pbrTex(64, 64, 85, 70, 55, 12, 1, { scratchCount: 10, normalStrength: 1.8, contrast: 0.9, seed: 510 }));
  const bagM = mat(bagS, 0.85, 0.02, 0x5a4a3a);
  const hairM = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9 });
  const parts = {};
  // Head with more detail
  parts.head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), skinM);
  parts.head.position.y = 1.64; parts.head.castShadow = true; g.add(parts.head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 10, 0, 6.28, 0, 1.2), hairM);
  hair.position.set(0, 1.75, 0.04); hair.scale.set(1.6, 0.5, 1.2); g.add(hair);
  parts.neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.085, 0.07, 8), skinM);
  parts.neck.position.y = 1.48; g.add(parts.neck);
  parts.chest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.24), jacketM);
  parts.chest.position.set(0, 1.18, 0); parts.chest.castShadow = true; g.add(parts.chest);
  parts.hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.2), pantsM);
  parts.hips.position.set(0, 0.92, 0); g.add(parts.hips);
  const collarM = new THREE.MeshStandardMaterial({ color: 0x3a4a2a, roughness: 0.8 });
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.06), collarM);
  collar.position.set(0, 1.35, -0.13); g.add(collar);
  // Backpack with more shape
  parts.bag = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.16), bagM);
  parts.bag.position.set(0, 1.18, -0.19); g.add(parts.bag);
  const bagStrap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.01), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 }));
  bagStrap.position.set(0.15, 1.16, -0.18); bagStrap.rotation.z = -0.1; g.add(bagStrap);
  const bagStrap2 = bagStrap.clone(); bagStrap2.position.x = -0.15; bagStrap2.rotation.z = 0.1; g.add(bagStrap2);
  parts.leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.22, 7), jacketM);
  parts.leftUpperArm.position.set(-0.29, 1.2, 0); parts.leftUpperArm.castShadow = true; g.add(parts.leftUpperArm);
  parts.rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.22, 7), jacketM);
  parts.rightUpperArm.position.set(0.29, 1.2, 0); parts.rightUpperArm.castShadow = true; g.add(parts.rightUpperArm);
  parts.leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.2, 7), jacketM);
  parts.leftForearm.position.set(-0.33, 0.99, 0); g.add(parts.leftForearm);
  parts.rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.2, 7), jacketM);
  parts.rightForearm.position.set(0.33, 0.99, 0); g.add(parts.rightForearm);
  parts.leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skinM);
  parts.leftHand.position.set(-0.35, 0.8, 0); g.add(parts.leftHand);
  parts.rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skinM);
  parts.rightHand.position.set(0.35, 0.8, 0); g.add(parts.rightHand);
  parts.leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.32, 7), pantsM);
  parts.leftThigh.position.set(-0.13, 0.65, 0); parts.leftThigh.castShadow = true; g.add(parts.leftThigh);
  parts.rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.32, 7), pantsM);
  parts.rightThigh.position.set(0.13, 0.65, 0); parts.rightThigh.castShadow = true; g.add(parts.rightThigh);
  parts.leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 7), pantsM);
  parts.leftCalf.position.set(-0.13, 0.34, 0); g.add(parts.leftCalf);
  parts.rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 7), pantsM);
  parts.rightCalf.position.set(0.13, 0.34, 0); g.add(parts.rightCalf);
  parts.leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.14), bootM);
  parts.leftFoot.position.set(-0.13, 0.015, 0.035); g.add(parts.leftFoot);
  parts.rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.14), bootM);
  parts.rightFoot.position.set(0.13, 0.015, 0.035); g.add(parts.rightFoot);
  // Shoulder pads
  const padM = new THREE.MeshStandardMaterial({ color: 0x3a4a2a, roughness: 0.85 });
  [-1, 1].forEach(s => {
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4, 0, 6.28, 0, 0.6), padM);
    pad.position.set(s * 0.28, 1.32, 0); pad.scale.set(1, 0.7, 1.3); g.add(pad);
  });
  return { group: g, parts };
}

let charAnimTime = 0;
function animateChar(parts, speed, delta, isMoving, isRunning) {
  charAnimTime += delta * (isRunning ? 2.6 : 1.5);
  const t = charAnimTime;
  if (isMoving) {
    const freq = isRunning ? 6.5 : 5;
    const legAmp = isRunning ? 0.55 : 0.4;
    const armAmp = isRunning ? 0.4 : 0.3;
    const legSwing = Math.sin(t * freq) * legAmp;
    const armSwing = Math.sin(t * freq) * armAmp;
    parts.leftThigh.rotation.x = legSwing;
    parts.rightThigh.rotation.x = -legSwing;
    parts.leftCalf.rotation.x = Math.max(0, Math.sin(t * freq - 1) * 0.25);
    parts.rightCalf.rotation.x = Math.max(0, -Math.sin(t * freq - 1) * 0.25);
    parts.leftUpperArm.rotation.x = -armSwing * 0.8;
    parts.rightUpperArm.rotation.x = armSwing * 0.8;
    parts.leftForearm.rotation.x = Math.min(0, Math.sin(t * freq - 0.5) * 0.12);
    parts.rightForearm.rotation.x = Math.min(0, -Math.sin(t * freq - 0.5) * 0.12);
    // Body bob and sway
    parts.chest.position.z = Math.sin(t * freq) * 0.025;
    parts.head.position.z = Math.sin(t * freq) * 0.016;
    parts.chest.position.y = 1.18 + Math.abs(Math.sin(t * freq)) * 0.006;
    parts.head.position.y = 1.64 + Math.abs(Math.sin(t * freq)) * 0.004;
    parts.chest.rotation.z = Math.sin(t * freq * 0.5) * 0.015;
    parts.hips.rotation.z = -Math.sin(t * freq * 0.5) * 0.01;
    // Arm swing
    parts.leftUpperArm.rotation.z = isRunning ? 0.15 : 0.05;
    parts.rightUpperArm.rotation.z = isRunning ? -0.15 : -0.05;
  } else {
    for (let k of ["leftThigh", "rightThigh", "leftCalf", "rightCalf", "leftUpperArm", "rightUpperArm", "leftForearm", "rightForearm"]) {
      if (parts[k]) parts[k].rotation.x *= 0.92;
    }
    parts.chest.position.z *= 0.95;
    parts.head.position.z *= 0.95;
    parts.chest.rotation.z *= 0.95;
    parts.hips.rotation.z *= 0.95;
    parts.chest.position.y = 1.18 + Math.sin(t * 2) * 0.003;
    parts.head.position.y = 1.64 + Math.sin(t * 2) * 0.002;
    // Breathing
    parts.chest.scale.y = 1 + Math.sin(t * 1.8) * 0.004;
  }
}

// ── ENEMY ──

function makeEnemy(pos) {
  const g = new THREE.Group();
  const zSkinS = getTex("zskin", () => zombieSkinTex());
  const zSkinM = mat(zSkinS, 0.7, 0, 0x4a5a3a);
  const ragS = pbrTex(64, 64, 40, 35, 30, 15, 1, { scratchCount: 12, normalStrength: 1.5, contrast: 1.2, seed: 96 });
  const ragM = mat(ragS, 0.9, 0, 0x2a2a1a);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xff2200 });
  const parts = {};
  parts.head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), zSkinM);
  parts.head.position.y = 1.55; parts.head.castShadow = true; g.add(parts.head);
  parts.neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.05, 5), zSkinM);
  parts.neck.position.y = 1.42; g.add(parts.neck);
  parts.chest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.2), ragM);
  parts.chest.position.set(0, 1.12, 0); parts.chest.castShadow = true; g.add(parts.chest);
  parts.hips = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.18), ragM);
  parts.hips.position.set(0, 0.88, 0); g.add(parts.hips);
  parts.leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.18, 5), ragM);
  parts.leftUpperArm.position.set(-0.24, 1.14, 0); g.add(parts.leftUpperArm);
  parts.rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.18, 5), ragM);
  parts.rightUpperArm.position.set(0.24, 1.14, 0); g.add(parts.rightUpperArm);
  parts.leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.16, 5), ragM);
  parts.leftForearm.position.set(-0.27, 0.96, 0); g.add(parts.leftForearm);
  parts.rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.16, 5), ragM);
  parts.rightForearm.position.set(0.27, 0.96, 0); g.add(parts.rightForearm);
  parts.leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.25, 5), ragM);
  parts.leftThigh.position.set(-0.1, 0.62, 0); g.add(parts.leftThigh);
  parts.rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.25, 5), ragM);
  parts.rightThigh.position.set(0.1, 0.62, 0); g.add(parts.rightThigh);
  parts.leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.24, 5), ragM);
  parts.leftCalf.position.set(-0.1, 0.35, 0); g.add(parts.leftCalf);
  parts.rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.24, 5), ragM);
  parts.rightCalf.position.set(0.1, 0.35, 0); g.add(parts.rightCalf);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 5), eyeM);
  eyeL.position.set(-0.08, 1.6, -0.14); g.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 5), eyeM);
  eyeR.position.set(0.08, 1.6, -0.14); g.add(eyeR);
  g.position.set(pos.x, 0, pos.z);
  return { group: g, parts };
}

function animateEnemy(parts, delta, speed) {
  const t = performance.now() / 1000;
  if (speed > 0.1) {
    const swing = Math.sin(t * 4) * 0.2 * Math.min(1, speed);
    parts.leftThigh.rotation.x = swing;
    parts.rightThigh.rotation.x = -swing;
    parts.leftUpperArm.rotation.x = -swing * 0.7;
    parts.rightUpperArm.rotation.x = swing * 0.7;
  }
  parts.chest.position.y = 1.12 + Math.sin(t * 2) * 0.004;
  parts.head.rotation.z = Math.sin(t * 0.5) * 0.03;
}

// ── GROUND DETAILS ──

function addGroundDetails(scene, terrainHf, terrainMesh) {
  const tPos = terrainMesh.geometry.attributes.position;
  const tColors = terrainMesh.geometry.attributes.color;
  const rockM = new THREE.MeshStandardMaterial({ color: 0x6a6a5a, roughness: 0.95, metalness: 0.05 });
  const rockM2 = new THREE.MeshStandardMaterial({ color: 0x7a7a6a, roughness: 0.9, metalness: 0.05 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2a4a1a, roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 80; i++) {
    const x = (Math.random() - 0.5) * WORLD.size * 0.75, z = (Math.random() - 0.5) * WORLD.size * 0.75;
    if (BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 3)) continue;
    const h = fbm(x * 0.02 + 5.3, z * 0.02 + 9.1, 3);
    if (h > -0.2 && h < 0.4) {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03 + Math.random() * 0.06, 0), Math.random() > 0.5 ? rockM : rockM2);
      rock.position.set(x, -0.02 + Math.random() * 0.02, z);
      rock.scale.set(1 + Math.random() * 0.5, 0.3 + Math.random() * 0.4, 1 + Math.random() * 0.5);
      rock.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      rock.castShadow = true; rock.receiveShadow = true;
      scene.add(rock);
    }
  }
  for (let i = 0; i < 100; i++) {
    const x = (Math.random() - 0.5) * WORLD.size * 0.7, z = (Math.random() - 0.5) * WORLD.size * 0.7;
    if (BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 2.5)) continue;
    const h = fbm(x * 0.02 + 5.3, z * 0.02 + 9.1, 3);
    if (h > -0.3 && h < 0.3) {
      const g = new THREE.Group();
      for (let j = 0; j < 3 + Math.floor(Math.random() * 3); j++) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.04 + Math.random() * 0.06, 3), grassMat);
        blade.position.set((Math.random() - 0.5) * 0.06, 0.02 + Math.random() * 0.01, (Math.random() - 0.5) * 0.06);
        blade.rotation.set((Math.random() - 0.5) * 0.3, Math.random() * 6.28, (Math.random() - 0.5) * 0.3);
        g.add(blade);
      }
      g.position.set(x, 0, z);
      scene.add(g);
    }
  }
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * WORLD.size * 0.7, z = (Math.random() - 0.5) * WORLD.size * 0.7;
    if (BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 2.5)) continue;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0x4a3a1a + Math.floor(Math.random() * 0x001a00), transparent: true, opacity: 0.3 + Math.random() * 0.2, side: THREE.DoubleSide, depthWrite: false }));
    leaf.position.set(x, 0.005, z);
    leaf.rotation.set(Math.random() * 0.5, Math.random() * 6.28, Math.random() * 0.5);
    scene.add(leaf);
  }
}

// ── WORLD GENERATION ──

function buildWorld(scene) {
  const terrain = makeTerrain();
  scene.add(terrain.mesh);
  const roads = [[0, -10, 2.5, 18, 0], [0, 12, 2.5, 12, 0], [-14, 0, 12, 2.5, 0], [12, 0, 10, 2.5, 0], [-10, 8, 2.5, 10, Math.PI / 3], [8, -6, 2.5, 10, -Math.PI / 4]];
  roads.forEach(r => scene.add(makeRoadBroken(r[0], r[1], r[2], r[3], r[4])));
  BUILDINGS.forEach(b => { scene.add(makeBuildingAbandoned(b)); if (Math.random() > 0.5) scene.add(makeDebrisPile(b.x + (Math.random() - 0.5) * 2, b.z + (Math.random() - 0.5) * 2, 0.3 + Math.random() * 0.5)); });
  const treePos = [];
  for (let i = 0; i < WORLD.treeCount; i++) {
    let x, z, ok = false, att = 0;
    do { x = (Math.random() - 0.5) * WORLD.size * 0.7; z = (Math.random() - 0.5) * WORLD.size * 0.7; ok = !BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 3.5) && !treePos.some(t => Math.hypot(x - t.x, z - t.z) < 2); att++; } while (!ok && att < 20);
    if (ok) { scene.add(makeTreePine(x, z, 0.5 + Math.random() * 0.6)); treePos.push({ x, z }); }
  }
  for (let i = 0; i < WORLD.deadTreeCount; i++) {
    let x, z, ok = false, att = 0;
    do { x = (Math.random() - 0.5) * WORLD.size * 0.7; z = (Math.random() - 0.5) * WORLD.size * 0.7; ok = !BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 3); att++; } while (!ok && att < 20);
    if (ok) scene.add(makeTreeDead(x, z, 0.4 + Math.random() * 0.5));
  }
  for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * WORLD.size * 0.65, z = (Math.random() - 0.5) * WORLD.size * 0.65;
    if (!BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 2.5)) {
      const bush = new THREE.Group();
      const leafS = getTex("bush_leaf", () => leafTex(2));
      const bushM = mat(leafS, 0.85, 0, 0x1a3a0a + Math.floor(Math.random() * 0x002a00));
      for (let j = 0; j < 4; j++) {
        const s2 = new THREE.SphereGeometry(0.06 * (0.5 + Math.random() * 0.6), 4, 3);
        const mesh = new THREE.Mesh(s2, bushM);
        mesh.position.set((Math.random() - 0.5) * 0.2, 0.03, (Math.random() - 0.5) * 0.2);
        mesh.castShadow = true; bush.add(mesh);
      }
      bush.position.set(x, 0.02, z);
      scene.add(bush);
    }
  }
  for (let i = 0; i < 16; i++) {
    const x = (Math.random() - 0.5) * WORLD.size * 0.7, z = (Math.random() - 0.5) * WORLD.size * 0.7;
    if (!BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 2.5)) scene.add(makeDebrisPile(x, z, 0.3 + Math.random() * 0.6));
  }
  addGroundDetails(scene, terrain.hf, terrain.mesh);
  [[-18, -14], [18, -14], [-18, 14], [18, 14], [-2, -20], [20, -2], [-20, 6], [6, 20]].forEach(p => scene.add(makePowerPole(p[0], p[1])));
  [[-4, -6], [8, -2], [-10, 4], [6, 10], [-6, -14], [14, -8]].forEach(p => scene.add(makeLampPost(p[0], p[1])));
  [[-6, -6, 0.3], [4, 6, -0.6], [-12, 14, 1.2], [12, -6, -0.3], [-20, -8, 0.8], [8, -14, -0.5]].forEach(c => scene.add(makeDestroyedCar(c[0], c[1], c[2])));
  [[-3, -8, 0], [5, -2, Math.PI / 2], [-11, 6, 0.5], [7, 9, -0.8]].forEach(b => scene.add(makeBarricade(b[0], b[1], b[2])));
  [[-8, -16, 0.3, 1.8], [14, 12, -0.5, 1.5], [-22, 10, 0.8, 1.2]].forEach(f => scene.add(makeFence(f[0], f[1], f[2], f[3])));
  scene.add(makeSkyCinematic());
}

// ── ATMOSPHERE ──

function makeAtmosphereParticles(scene) {
  const lc = 800, lGeo = new THREE.BufferGeometry(), lPos = new Float32Array(lc * 3);
  for (let i = 0; i < lc * 3; i++) lPos[i] = (Math.random() - 0.5) * 80;
  lGeo.setAttribute("position", new THREE.BufferAttribute(lPos, 3));
  const leaves = new THREE.Points(lGeo, new THREE.PointsMaterial({ color: 0x887755, size: 0.03, transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending, depthWrite: false }));
  leaves.position.y = 8; scene.add(leaves);
  const dc = 500, dGeo = new THREE.BufferGeometry(), dPos = new Float32Array(dc * 3);
  for (let i = 0; i < dc * 3; i++) dPos[i] = (Math.random() - 0.5) * 70;
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0x998877, size: 0.015, transparent: true, opacity: 0.02, blending: THREE.AdditiveBlending, depthWrite: false }));
  dust.position.y = 0.1; scene.add(dust);
  const bc = 20, bGeo = new THREE.BufferGeometry(), bPos = new Float32Array(bc * 3);
  for (let i = 0; i < bc; i++) { bPos[i * 3] = (Math.random() - 0.5) * 60; bPos[i * 3 + 1] = 5 + Math.random() * 15; bPos[i * 3 + 2] = (Math.random() - 0.5) * 60; }
  bGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
  const birds = new THREE.Points(bGeo, new THREE.PointsMaterial({ color: 0x111111, size: 0.06, transparent: true, opacity: 0.04, depthWrite: false }));
  scene.add(birds);
  return { leaves, dust, birds };
}

function makeAudio() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const bufSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.sin(i * 0.01) * 0.01 + (Math.random() - 0.5) * 0.3;
    const source = ctx.createBufferSource();
    source.buffer = buffer; source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 80;
    const gain = ctx.createGain();
    gain.gain.value = 0.025;
    source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    source.start();
    const birdBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const bData = birdBuf.getChannelData(0);
    for (let i = 0; i < bData.length; i++) { const t2 = i / ctx.sampleRate; bData[i] = Math.sin(t2 * 2000 + Math.sin(t2 * 8) * 500) * Math.max(0, Math.sin(t2 * 3)) * 0.04; }
    const birdSource = ctx.createBufferSource();
    birdSource.buffer = birdBuf; birdSource.loop = true;
    birdSource.playbackRate.value = 0.5 + Math.random() * 0.3;
    const birdGain = ctx.createGain();
    birdGain.gain.value = 0.008;
    birdSource.connect(birdGain); birdGain.connect(ctx.destination);
    birdSource.start();
    return { ctx, source, gain, birdGain };
  } catch (e) { return null; }
}

// ── REACT COMPONENTS ──

function Loading({ p, onStart }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { if (p >= 100) { const t = setTimeout(() => setReady(true), 300); return () => clearTimeout(t); } }, [p]);
  return (
    <div className="vsb-loading">
      <div className="vsb-loading-bg" />
      <div className="vsb-loading-box">
        <div className="vsb-loading-icon">☢️</div>
        <h1 className="vsb-loading-title">ZONA MORTA</h1>
        <p className="vsb-loading-sub">Sobrevivência em Mundo Aberto</p>
        <div className="vsb-loading-bar"><div className="vsb-loading-fill" style={{ width: `${p}%` }} /></div>
        <p className="vsb-loading-pct">{Math.floor(p)}%</p>
        {ready && <button className="vsb-loading-go" onClick={onStart}>▶ ENTRAR</button>}
      </div>
    </div>
  );
}

function DeathScreen({ onRestart }) {
  return (
    <div className="vsb-death">
      <div className="vsb-death-box">
        <h1 className="vsb-death-title">VOCÊ MORREU</h1>
        <p className="vsb-death-sub">A Zona Morta reivindicou mais um.</p>
        <button className="vsb-loading-go" onClick={onRestart}>TENTAR NOVAMENTE</button>
      </div>
    </div>
  );
}

function ItemModal({ item, onClose, onTake }) {
  return (
    <div className="vsb-modal-overlay" onClick={onClose}>
      <div className="vsb-modal-card" onClick={e => e.stopPropagation()}>
        <button className="vsb-modal-x" onClick={onClose}>✕</button>
        <div className="vsb-modal-img" style={{ background: `radial-gradient(circle,${item.color}22,transparent)` }}>
          <span className="vsb-modal-img-emoji">{item.emoji}</span>
        </div>
        <div className="vsb-modal-info">
          <h2>{item.name}</h2>
          <p>{item.desc}</p>
          <button className="vsb-modal-take" onClick={() => { onTake(item); onClose(); }}>Pegar item</button>
        </div>
      </div>
    </div>
  );
}

function Notif({ msg, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }, [msg, onHide]);
  return <div className="vsb-notif" onClick={onHide}>{msg}</div>;
}

// ── MAIN ──
export default function VirtualShoppingBrane() {
  const [phase, setPhase] = useState("loading");
  const [loadP, setLoadP] = useState(0);
  const [hud, setHud] = useState({ health: 100, stamina: 100, hunger: 70, thirst: 60 });
  const [inv, setInv] = useState([]);
  const [foundItem, setFoundItem] = useState(null);
  const [notif, setNotif] = useState("");
  const [view, setView] = useState("world");
  const [dead, setDead] = useState(false);
  const [alertEnemy, setAlertEnemy] = useState(false);

  const container = useRef(null);
  const keys = useRef({});
  const charPos = useRef(new THREE.Vector3(0, 0, -2));
  const charRot = useRef(0);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const targetFov = useRef(48);
  const charParts = useRef(null);
  const charGroup = useRef(null);
  const velocity = useRef(0);
  const enemiesRef = useRef([]);
  const lastAttackRef = useRef(0);
  const lastDmgRef = useRef(0);

  const notify = useCallback(m => setNotif(m), []);

  function useMedkit() {
    setInv(prev => {
      const idx = prev.findIndex(i => i.name === "Kit Médico");
      if (idx === -1) return prev;
      setHud(h => ({ ...h, health: Math.min(100, h.health + HEAL_AMOUNT) }));
      const next = [...prev];
      if (next[idx].qty > 1) next[idx] = { ...next[idx], qty: next[idx].qty - 1 };
      else next.splice(idx, 1);
      return next;
    });
    notify("Kit Médico usado. +30 de vida.");
  }

  function restart() {
    setDead(false);
    setPhase("loading");
    setHud({ health: 100, stamina: 100, hunger: 70, thirst: 60 });
    setInv([]);
    charPos.current.set(0, 0, -2);
    charRot.current = 0;
    velocity.current = 0;
    mouseX.current = 0;
    mouseY.current = 0;
    const p = 0;
    const int = setInterval(() => { p + 2 + Math.random() * 3; if (p > 100) p = 100; setLoadP(p); if (p >= 100) clearInterval(int); }, 100);
  }

  useEffect(() => {
    let p = 0;
    const int = setInterval(() => { p += 2 + Math.random() * 3; if (p > 100) p = 100; setLoadP(p); if (p >= 100) clearInterval(int); }, 100);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (phase !== "world") return;
    const el = container.current;
    if (!el) return;
    let animDead = false;

    try {
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", stencil: false, depth: true });
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x4a6a7a);
      const camera = new THREE.PerspectiveCamera(48, el.clientWidth / el.clientHeight, 0.1, 200);
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const ssaoPass = new SSAOPass(scene, camera, el.clientWidth, el.clientHeight);
      ssaoPass.kernelRadius = 0.4; ssaoPass.minDistance = 0.01; ssaoPass.maxDistance = 0.12; ssaoPass.renderToScreen = false;
      composer.addPass(ssaoPass);
      const bloom = new UnrealBloomPass(new THREE.Vector2(el.clientWidth, el.clientHeight), 0.12, 0.4, 0.85);
      bloom.renderToScreen = false;
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      const ambient = new THREE.AmbientLight(0x99aabb, 0.35);
      scene.add(ambient);
      const hemi = new THREE.HemisphereLight(0x99aabb, 0x665544, 0.5);
      scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xffddbb, 1.6);
      sun.position.set(25, 35, 15);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
      sun.shadow.camera.left = -45; sun.shadow.camera.right = 45;
      sun.shadow.camera.top = 45; sun.shadow.camera.bottom = -45;
      sun.shadow.bias = -0.001; sun.shadow.normalBias = 0.01;
      scene.add(sun);
      const warmFill = new THREE.DirectionalLight(0xffdd88, 0.35);
      warmFill.position.set(-20, 10, -25);
      scene.add(warmFill);
      const rim = new THREE.DirectionalLight(0x99aacc, 0.2);
      rim.position.set(-30, 8, 35);
      scene.add(rim);
      scene.fog = new THREE.FogExp2(0x9aaaaa, 0.001);
      buildWorld(scene);
      const hero = makeCharacter();
      charGroup.current = hero.group;
      charParts.current = hero.parts;
      scene.add(hero.group);

      // ── Enemies ──
      const enemyData = ENEMIES.map(e => {
        const ent = makeEnemy(e);
        scene.add(ent.group);
        return {
          group: ent.group, parts: ent.parts, alive: true,
          pos: new THREE.Vector3(e.x, 0, e.z),
          spawnX: e.x, spawnZ: e.z,
          rot: Math.random() * 6.28,
          state: "wander",
          hp: ENEMY_HP,
          wanderTarget: new THREE.Vector3(e.x + (Math.random() - 0.5) * 8, 0, e.z + (Math.random() - 0.5) * 8),
          wanderTimer: 0,
        };
      });
      enemiesRef.current = enemyData;

      // ── Interactives ──
      const interactiveMeshes = [];
      INTERACTIVES.forEach((item) => {
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.2 }));
        glow.position.set(item.x, 0.12, item.z);
        scene.add(glow);
        interactiveMeshes.push({ mesh: glow, item, collected: false });
      });

      const particles = makeAtmosphereParticles(scene);
      const audio = makeAudio();

      // ── Controls ──
      const onKey = (e, down) => {
        keys.current[e.key.toLowerCase()] = down;
        if (e.key.toLowerCase() === "i" && down && view === "world") setView("inventory");
        if (e.key.toLowerCase() === "escape" && down && document.pointerLockElement) document.exitPointerLock();
        if ((e.key.toLowerCase() === "f" || e.key.toLowerCase() === " ") && down && !dead) {
          const now = performance.now();
          if (now - lastAttackRef.current > 500) {
            lastAttackRef.current = now;
            const angle = mouseX.current;
            const px = charPos.current.x, pz = charPos.current.z;
            enemyData.forEach(en => {
              if (!en.alive) return;
              const dx = en.pos.x - px, dz = en.pos.z - pz;
              const dist = Math.hypot(dx, dz);
              const enemyAngle = Math.atan2(dx, dz);
              let diff = enemyAngle - angle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              if (dist < PLAYER_ATTACK_DIST && Math.abs(diff) < 1.2) {
                en.hp -= PLAYER_ATTACK_DMG;
                if (en.hp <= 0) {
                  en.alive = false;
                  scene.remove(en.group);
                } else {
                  en.state = "chase";
                }
              }
            });
          }
        }
      };
      document.addEventListener("keydown", (e) => onKey(e, true));
      document.addEventListener("keyup", (e) => onKey(e, false));
      const onMouse = (e) => {
        if (document.pointerLockElement === renderer.domElement) {
          mouseX.current += e.movementX * 0.002;
          mouseY.current = Math.max(-1, Math.min(1, mouseY.current - e.movementY * 0.002));
        }
      };
      renderer.domElement.addEventListener("click", () => renderer.domElement.requestPointerLock());
      document.addEventListener("mousemove", onMouse);
      const onResize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.setSize(w, h); composer.setSize(w, h);
        ssaoPass.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      const clock = new THREE.Clock();
      const CAM_DIST = 4.5, CAM_HEIGHT = 1.8, CAM_LERP = 6;
      const camSmooth = { x: 0, y: 0, z: 0 };

      const animate = () => {
        if (animDead) return;
        const delta = Math.min(clock.getDelta(), 0.05);
        const t = clock.getElapsedTime();
        const k = keys.current;

        if (dead) { composer.render(); animRef.current = requestAnimationFrame(animate); return; }

        const fwd = k["w"] || k["arrowup"], bwd = k["s"] || k["arrowdown"];
        const lft = k["a"] || k["arrowleft"], rgt = k["d"] || k["arrowright"];
        const moving = fwd || bwd || lft || rgt;
        const run = k["shift"] && hud.stamina > 5;

        // Stamina
        if (run && moving) setHud(h => ({ ...h, stamina: Math.max(0, h.stamina - 14 * delta) }));
        else if (!moving) setHud(h => ({ ...h, stamina: Math.min(100, h.stamina + 8 * delta) }));
        else setHud(h => ({ ...h, stamina: Math.min(100, h.stamina + 3 * delta) }));

        const targetSpeed = moving ? (run ? 3.5 : 1.8) : 0;
        const accel = moving ? (run ? 8 : 5) : 6;
        velocity.current += (targetSpeed - velocity.current) * delta * accel;

        let mx = 0, mz = 0;
        if (fwd) mz -= 1; if (bwd) mz += 1; if (lft) mx -= 1; if (rgt) mx += 1;
        if (moving) {
          const len = Math.hypot(mx, mz); mx /= len; mz /= len;
          const ta = Math.atan2(mx, mz);
          let diff = ta - charRot.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          charRot.current += diff * delta * (run ? 12 : 8);
          charPos.current.x += Math.sin(charRot.current) * velocity.current * delta;
          charPos.current.z += Math.cos(charRot.current) * velocity.current * delta;
        }

        hero.group.position.copy(charPos.current);
        hero.group.rotation.y = charRot.current;
        animateChar(charParts.current, velocity.current, delta, moving, run);

        // ── Enemy AI ──
        let nearEnemy = false;
        enemyData.forEach(en => {
          if (!en.alive) return;
          const dx = charPos.current.x - en.pos.x, dz = charPos.current.z - en.pos.z;
          const dist = Math.hypot(dx, dz);
          if (dist < ENEMY_DETECT * 1.2) nearEnemy = true;

          if (en.state === "wander") {
            en.wanderTimer += delta;
            if (en.wanderTimer > 3 + Math.random() * 2) {
              en.wanderTarget.set(en.spawnX + (Math.random() - 0.5) * 8, 0, en.spawnZ + (Math.random() - 0.5) * 8);
              en.wanderTimer = 0;
              en.rot = Math.atan2(en.wanderTarget.x - en.pos.x, en.wanderTarget.z - en.pos.z);
            }
            if (dist < ENEMY_DETECT) { en.state = "chase"; }
          }

          if (en.state === "chase") {
            if (dist > ENEMY_DETECT * 1.5) { en.state = "wander"; en.wanderTimer = 3; }
            else {
              en.rot = Math.atan2(dx, dz);
              const spd = 1.8 * delta;
              if (dist > ENEMY_ATTACK_DIST) {
                en.pos.x += Math.sin(en.rot) * spd;
                en.pos.z += Math.cos(en.rot) * spd;
              }
              if (dist < ENEMY_ATTACK_DIST + 0.3) {
                const now = performance.now();
                if (now - lastDmgRef.current > 1200) {
                  lastDmgRef.current = now;
                  setHud(h => ({ ...h, health: Math.max(0, h.health - ENEMY_DMG) }));
                }
                en.state = "attack";
              }
            }
          }

          if (en.state === "attack") {
            if (dist > ENEMY_ATTACK_DIST + 0.8) { en.state = "chase"; }
            else {
              en.rot = Math.atan2(dx, dz);
              const now = performance.now();
              if (now - lastDmgRef.current > 1200) {
                lastDmgRef.current = now;
                setHud(h => ({ ...h, health: Math.max(0, h.health - ENEMY_DMG) }));
              }
            }
          }

          en.group.position.copy(en.pos);
          en.group.rotation.y = en.rot;
          animateEnemy(en.parts, delta, en.state === "chase" ? 1.8 : 0.3);
        });
        setAlertEnemy(nearEnemy);

        // Death check
        setHud(h => {
          if (h.health <= 0 && !dead) setDead(true);
          return h;
        });

        // Camera
        const angle = mouseX.current;
        const vert = Math.max(-0.3, Math.min(0.6, mouseY.current * 0.4));
        const dist = run ? 5.0 : CAM_DIST;
        const targetX = charPos.current.x + Math.sin(angle) * dist * Math.cos(vert);
        const targetY = charPos.current.y + CAM_HEIGHT + Math.sin(vert) * dist;
        const targetZ = charPos.current.z + Math.cos(angle) * dist * Math.cos(vert);
        camSmooth.x += (targetX - camSmooth.x) * delta * CAM_LERP;
        camSmooth.y += (targetY - camSmooth.y) * delta * CAM_LERP;
        camSmooth.z += (targetZ - camSmooth.z) * delta * CAM_LERP;
        camera.position.set(camSmooth.x, camSmooth.y, camSmooth.z);
        camera.lookAt(charPos.current.x + Math.sin(angle) * 0.5, 1.2 + vert * 0.5, charPos.current.z + Math.cos(angle) * 0.5);
        targetFov.current = run ? 55 : 48;
        camera.fov += (targetFov.current - camera.fov) * delta * 3;
        camera.updateProjectionMatrix();

        interactiveMeshes.forEach((obj) => {
          if (obj.collected) return;
          obj.mesh.material.opacity = 0.15 + Math.sin(t * 2 + obj.item.x) * 0.08;
          const dist2 = Math.hypot(charPos.current.x - obj.item.x, charPos.current.z - obj.item.z);
          if (dist2 < 1.5 && k["e"]) { obj.collected = true; scene.remove(obj.mesh); setFoundItem(obj.item); }
        });

        renderer.toneMappingExposure = 1.0;
        sun.intensity = 1.6; ambient.intensity = 0.35; hemi.intensity = 0.5;
        warmFill.intensity = 0.35; rim.intensity = 0.2;
        scene.background.setHex(0x6a8a9a);
        scene.fog.color.setHex(0x9aaaaa); scene.fog.density = 0.001;
        bloom.strength = 0.12;
        particles.leaves.rotation.y += delta * 0.005;
        particles.dust.rotation.y += delta * 0.004;
        setHud(h => ({ ...h, hunger: Math.max(0, h.hunger - delta * 0.3), thirst: Math.max(0, h.thirst - delta * 0.4) }));
        composer.render();
        animRef.current = requestAnimationFrame(animate);
      };

      const animRef = { current: requestAnimationFrame(animate) };

      return () => {
        animDead = true;
        cancelAnimationFrame(animRef.current);
        if (audio) try { audio.source.stop(); audio.ctx.close(); } catch (e) { }
        document.removeEventListener("keydown", (e) => onKey(e, true));
        document.removeEventListener("mousemove", onMouse);
        if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
        window.removeEventListener("resize", onResize);
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer.dispose();
      };
    } catch (err) { console.error("[VSB Error]", err); }
  }, [phase]);

  if (dead) return <DeathScreen onRestart={restart} />;

  if (phase === "loading") return <Loading p={loadP} onStart={() => setPhase("world")} />;

  if (view === "inventory") {
    return (
      <div className="vsb-inventory">
        <div className="vsb-inv-top"><h2>🎒 INVENTÁRIO</h2><button className="vsb-back-btn" onClick={() => setView("world")}>Fechar</button></div>
        <div className="vsb-inv-grid">
          {inv.length === 0 ? <p className="vsb-inv-none">Nenhum item encontrado. Explore o mundo.</p> :
            inv.map((item, i) => (
              <div key={i} className="vsb-inv-slot">
                <span className="vsb-inv-emoji">{item.emoji}</span>
                <span className="vsb-inv-name">{item.name}</span>
                <span className="vsb-inv-qty">x{item.qty || 1}</span>
                {item.name === "Kit Médico" && <button className="vsb-inv-use" onClick={useMedkit}>USAR</button>}
              </div>
            ))
          }
        </div>
        <div className="vsb-inv-stats">
          <span>❤️ {Math.floor(hud.health)}</span><span>⚡ {Math.floor(hud.stamina)}</span>
          <span>🍞 {Math.floor(hud.hunger)}</span><span>💧 {Math.floor(hud.thirst)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vsb-world">
      <div ref={container} className="vsb-canvas" />
      <div className="vsb-letterbox-t" /><div className="vsb-letterbox-b" />
      <div className="vsb-vignette" />
      <div className="vsb-hud">
        <div className="vsb-hud-bars">
          <div className="vsb-hud-bar bar-health"><span>❤️</span><div className="vsb-hud-track"><div className="vsb-hud-fill health" style={{ width: `${hud.health}%` }} /></div><span className="vsb-hud-val">{Math.floor(hud.health)}</span></div>
          <div className="vsb-hud-bar"><span>⚡</span><div className="vsb-hud-track"><div className="vsb-hud-fill stamina" style={{ width: `${hud.stamina}%` }} /></div></div>
          <div className="vsb-hud-bar"><span>🍞</span><div className="vsb-hud-track"><div className="vsb-hud-fill hunger" style={{ width: `${hud.hunger}%` }} /></div></div>
          <div className="vsb-hud-bar"><span>💧</span><div className="vsb-hud-track"><div className="vsb-hud-fill thirst" style={{ width: `${hud.thirst}%` }} /></div></div>
        </div>
        {alertEnemy && <div className="vsb-enemy-alert">⚠ INIMIGO PRÓXIMO</div>}
        <div className="vsb-hud-controls"><span>WASD</span><span>Shift correr</span><span>F/Espaço atacar</span><span>I inventário</span><span>E pegar</span></div>
        <div className="vsb-hud-location">ZONA MORTA — SETOR 7</div>
        <button className="vsb-hud-inv" onClick={() => setView("inventory")}>🎒<span className="vsb-hud-count">{inv.length}</span></button>
        <div className="vsb-hud-interact">Pressione E para interagir</div>
      </div>
      {foundItem && <ItemModal item={foundItem} onClose={() => setFoundItem(null)} onTake={(item) => {
        setInv(p => { const e = p.find(i => i.name === item.name); return e ? p.map(i => i.name === item.name ? { ...i, qty: (i.qty || 1) + 1 } : i) : [...p, { ...item, qty: 1 }]; });
        notify(`${item.name} coletado!`);
      }} />}
      {notif && <Notif msg={notif} onHide={() => setNotif("")} />}
    </div>
  );
}
