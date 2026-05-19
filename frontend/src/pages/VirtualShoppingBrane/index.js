import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import "./VirtualShoppingBrane.css";

const WORLD = { size: 140, treeCount: 80, rockCount: 40 };

const BUILDINGS = [
  { x: -22, z: -20, w: 6, h: 5.2, d: 5, story: 2, color: 0x8a8a92, broken: false },
  { x: -14, z: -22, w: 5, h: 4.8, d: 4, story: 2, color: 0x92929a, broken: true },
  { x: -8, z: -17, w: 4.5, h: 3.4, d: 4, story: 1, color: 0x888890, broken: false },
  { x: 0, z: -24, w: 8, h: 7.0, d: 5.5, story: 3, color: 0x8e8e96, broken: false },
  { x: 8, z: -20, w: 5, h: 4.5, d: 4.5, story: 1, color: 0x9a9aa2, broken: false },
  { x: 16, z: -22, w: 4, h: 4.0, d: 3.5, story: 1, color: 0x8c8c94, broken: false },
  { x: -20, z: 4, w: 5.5, h: 5.2, d: 4, story: 2, color: 0x909098, broken: true },
  { x: -12, z: 6, w: 4, h: 3.4, d: 3.5, story: 1, color: 0x96969e, broken: false },
  { x: -4, z: 3, w: 6, h: 5.8, d: 5, story: 2, color: 0x888890, broken: false },
  { x: 4, z: 8, w: 4.5, h: 4.0, d: 4, story: 1, color: 0x92929a, broken: true },
  { x: 12, z: 5, w: 5, h: 4.5, d: 4.5, story: 1, color: 0x9e9ea6, broken: false },
  { x: 20, z: 2, w: 3.5, h: 3.2, d: 3, story: 1, color: 0x8a8a92, broken: false },
  { x: -24, z: 18, w: 4, h: 3.4, d: 3.5, story: 1, color: 0x94949c, broken: false },
  { x: -16, z: 20, w: 5.5, h: 5.2, d: 4, story: 2, color: 0x8e8e96, broken: false },
  { x: -8, z: 16, w: 4, h: 3.4, d: 3.5, story: 1, color: 0x9898a0, broken: true },
  { x: 2, z: 22, w: 6, h: 5.8, d: 5, story: 2, color: 0x8c8c94, broken: false },
  { x: 10, z: 18, w: 4.5, h: 4.0, d: 4, story: 1, color: 0x96969e, broken: false },
  { x: 18, z: 16, w: 4, h: 3.4, d: 3.5, story: 1, color: 0x909098, broken: false },
];

const INTERACTIVES = [
  { name: "Kit Médico", emoji: "🩹", color: "#ff4444", desc: "Bandagens e antisséptico.", x: -12, z: -8 },
  { name: "Ração Militar", emoji: "🥫", color: "#cc8833", desc: "Alimento enlatado não perecível.", x: 5, z: 2 },
  { name: "Munição 9mm", emoji: "🔫", color: "#aaaacc", desc: "Caixa de munição calibre 9mm.", x: -4, z: -12 },
  { name: "Gasolina", emoji: "⛽", color: "#33cc33", desc: "Galão de gasolina 5L.", x: 10, z: -4 },
  { name: "Faca Tática", emoji: "🔪", color: "#888888", desc: "Faca de combate tática.", x: -8, z: 10 },
  { name: "Lampião", emoji: "💡", color: "#ffdd44", desc: "Lanterna de mão com pilhas.", x: 2, z: 14 },
];

// ── PBR TEXTURE GENERATION ──

function heightFromNoise(x, y, w, h, seed) {
  const sx = (x + seed * 137.5) % w, sy = (y + seed * 97.3) % h;
  const v = (Math.sin(sx * 12.9898 + sy * 78.233) * 43758.5453) % 1;
  return (v + 1) * 0.5;
}

function createPBRTextures(w, h, baseR, baseG, baseB, intensity, repeat, features) {
  const diffuseCanvas = document.createElement("canvas");
  diffuseCanvas.width = w; diffuseCanvas.height = h;
  const dctx = diffuseCanvas.getContext("2d");
  const dId = dctx.createImageData(w, h);
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = w; normalCanvas.height = h;
  const nctx = normalCanvas.getContext("2d");
  const nId = nctx.createImageData(w, h);
  const heightField = new Float32Array(w * h);
  const heightCanvas = document.createElement("canvas");
  heightCanvas.width = w; heightCanvas.height = h;
  const hctx = heightCanvas.getContext("2d");
  const hId = hctx.createImageData(w, h);

  const SEED = features?.seed || 1;
  const contrast = features?.contrast || 1.0;
  const groutH = features?.groutH || 0;
  const groutV = features?.groutV || 0;
  const groutWidth = features?.groutWidth || 2;
  const scratchCount = features?.scratchCount || 12;

  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const f1 = heightFromNoise(x, y, w, h, SEED);
    const f2 = heightFromNoise(x + 53, y + 71, w, h, SEED + 1);
    const f3 = heightFromNoise(x + 137, y + 211, w, h, SEED + 2);
    const height = (f1 * 0.5 + f2 * 0.3 + f3 * 0.2) * intensity * contrast;
    heightField[y * w + x] = height;
    const idx = (y * w + x) * 4;
    let r = baseR + height, g = baseG + height, b = baseB + height;
    if (groutH > 0) {
      const gy = y % groutH;
      if (gy < groutWidth) { r *= 0.65; g *= 0.65; b *= 0.65; }
    }
    if (groutV > 0) {
      const gx = x % groutV;
      if (gx < groutWidth) { r *= 0.65; g *= 0.65; b *= 0.65; }
    }
    dId.data[idx] = Math.min(255, Math.max(0, r));
    dId.data[idx + 1] = Math.min(255, Math.max(0, g));
    dId.data[idx + 2] = Math.min(255, Math.max(0, b));
    dId.data[idx + 3] = 255;
    hId.data[idx] = Math.min(255, Math.max(0, height * 8 + 128));
    hId.data[idx + 1] = 128;
    hId.data[idx + 2] = 128;
    hId.data[idx + 3] = 255;
  }
  dctx.putImageData(dId, 0, 0);
  hctx.putImageData(hId, 0, 0);

  // Scratches
  for (let i = 0; i < scratchCount; i++) {
    const sy = Math.random() * h;
    dctx.fillStyle = `rgba(${baseR - 30},${baseG - 30},${baseB - 30},0.12)`;
    dctx.fillRect(0, sy, w, 1 + Math.random() * 2);
  }

  // Normal map from height field
  const strength = features?.normalStrength || 2.0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const hl = heightField[y * w + (x - 1)], hr = heightField[y * w + (x + 1)];
    const hd = heightField[(y - 1) * w + x], hu = heightField[(y + 1) * w + x];
    const dx = (hr - hl) * strength / w;
    const dy = (hu - hd) * strength / h;
    const len = Math.sqrt(dx * dx + dy * dy + 1);
    const nx = -dx / len, ny = -dy / len, nz = 1 / len;
    const idx = (y * w + x) * 4;
    nId.data[idx] = (nx * 0.5 + 0.5) * 255;
    nId.data[idx + 1] = (ny * 0.5 + 0.5) * 255;
    nId.data[idx + 2] = (nz * 0.5 + 0.5) * 255;
    nId.data[idx + 3] = 255;
  }
  nctx.putImageData(nId, 0, 0);

  const diffuse = new THREE.CanvasTexture(diffuseCanvas);
  diffuse.wrapS = diffuse.wrapT = THREE.RepeatWrapping;
  if (repeat) diffuse.repeat.set(repeat, repeat);
  diffuse.anisotropy = 8;
  diffuse.needsUpdate = true;

  const normal = new THREE.CanvasTexture(normalCanvas);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  if (repeat) normal.repeat.set(repeat / 2, repeat / 2);
  normal.anisotropy = 8;
  normal.needsUpdate = true;

  return { map: diffuse, normalMap: normal };
}

function concreteTex(repeat) {
  return createPBRTextures(512, 512, 140, 145, 150, 28, repeat || 2, {
    groutH: 48, groutV: 64, groutWidth: 2, scratchCount: 20, normalStrength: 3.0, contrast: 1.2, seed: 10,
  });
}

function asphaltTex(repeat) {
  return createPBRTextures(256, 256, 55, 58, 65, 22, repeat || 4, {
    scratchCount: 8, normalStrength: 4.0, contrast: 1.5, seed: 20,
  });
}

function plasterTex(repeat) {
  return createPBRTextures(256, 256, 168, 162, 152, 14, repeat || 1.5, {
    scratchCount: 6, normalStrength: 1.5, contrast: 0.8, seed: 30,
  });
}

function brickTex(repeat) {
  return createPBRTextures(256, 256, 130, 80, 60, 35, repeat || 2, {
    groutH: 32, groutV: 64, groutWidth: 3, scratchCount: 4, normalStrength: 3.5, contrast: 1.8, seed: 40,
  });
}

function roofTex(repeat) {
  return createPBRTextures(256, 256, 70, 65, 60, 18, repeat || 2, {
    scratchCount: 15, normalStrength: 2.5, contrast: 1.2, seed: 50,
  });
}

function barkTex(repeat) {
  return createPBRTextures(128, 256, 74, 53, 32, 20, repeat || 1, {
    groutV: 12, groutWidth: 5, scratchCount: 25, normalStrength: 4.0, contrast: 1.5, seed: 60,
  });
}

function leafTex(repeat) {
  const t = createPBRTextures(128, 128, 35, 85, 20, 30, repeat || 2, {
    scratchCount: 0, normalStrength: 3.0, contrast: 1.6, seed: 70,
  });
  return t;
}

function fabricTex(repeat) {
  return createPBRTextures(128, 128, 58, 58, 74, 12, repeat || 1, {
    groutH: 4, groutV: 4, groutWidth: 1, scratchCount: 0, normalStrength: 0.8, contrast: 0.6, seed: 80,
  });
}

function skinTex() {
  return createPBRTextures(64, 64, 212, 165, 122, 8, 1, {
    scratchCount: 0, normalStrength: 0.5, contrast: 0.3, seed: 90,
  });
}

function makeMat(mapSet, roughness, metalness, color) {
  const m = new THREE.MeshStandardMaterial({
    map: mapSet.map,
    normalMap: mapSet.normalMap,
    roughness, metalness,
    color: color || 0xffffff,
    envMapIntensity: 0.3,
  });
  return m;
}

function skyGradientTex() {
  const c = document.createElement("canvas");
  c.width = 1; c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#223366");
  g.addColorStop(0.08, "#335588");
  g.addColorStop(0.2, "#4a7aaa");
  g.addColorStop(0.35, "#6a9ccc");
  g.addColorStop(0.5, "#88aacc");
  g.addColorStop(0.65, "#aabbcc");
  g.addColorStop(0.78, "#ccdde8");
  g.addColorStop(0.88, "#eef4f8");
  g.addColorStop(0.95, "#f8fafc");
  g.addColorStop(1, "#ffffff");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

function hazeTex() {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d");
  const id = ctx.createImageData(64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const i = (y * 64 + x) * 4;
    const v = Math.random() * 255;
    id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = v * 0.3;
  }
  ctx.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function windowEmissiveTex() {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 64, y = Math.random() * 128;
    const v = 80 + Math.random() * 120;
    ctx.fillStyle = `rgba(${v - 50},${v},${v + 30},0.04)`;
    ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  ctx.fillStyle = "rgba(10,10,20,0.4)";
  ctx.fillRect(0, 42, 64, 3);
  ctx.fillRect(0, 86, 64, 3);
  ctx.fillStyle = "rgba(10,10,20,0.35)";
  ctx.fillRect(31, 0, 3, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function windowGlowTex() {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 128;
  const ctx = c.getContext("2d");
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 64, y = Math.random() * 128;
    const v = 100 + Math.random() * 155;
    ctx.fillStyle = `rgba(${v - 40},${v + 20},${v + 40},${0.02 + Math.random() * 0.04})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// ── WORLD BUILDERS ──

function makeGround() {
  const seg = 150;
  const geo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const texSet = { map: null, normalMap: null };
  const grassSet = createPBRTextures(128, 128, 55, 120, 35, 30, 20, { scratchCount: 0, normalStrength: 2.0, contrast: 1.3, seed: 100 });
  const rockSet = createPBRTextures(128, 128, 100, 95, 90, 25, 15, { scratchCount: 15, normalStrength: 4.0, contrast: 1.5, seed: 110 });
  const groundMat = new THREE.MeshStandardMaterial({
    roughness: 0.9, metalness: 0, vertexColors: true,
    envMapIntensity: 0.1,
  });
  const blendTexCanvas = document.createElement("canvas");
  blendTexCanvas.width = 512; blendTexCanvas.height = 512;
  const bctx = blendTexCanvas.getContext("2d");
  const bId = bctx.createImageData(512, 512);
  const bPos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = Math.sin(x * 0.035 + z * 0.028) * 0.6
      + Math.sin(x * 0.07 - z * 0.055 + 1.2) * 0.3
      + Math.cos(x * 0.11 + z * 0.09 + 0.7) * 0.15
      + Math.sin(x * 0.15 + z * 0.17) * 0.06;
    pos.setY(i, h);
    const steep = Math.abs(h - (Math.sin((x + 0.5) * 0.035 + z * 0.028) * 0.6
      + Math.sin((x + 0.5) * 0.07 - z * 0.055 + 1.2) * 0.3
      + Math.cos((x + 0.5) * 0.11 + z * 0.09 + 0.7) * 0.15));
    const blend = Math.min(1, steep * 3.5);
    const grass = 0.14 + 0.15 * Math.random() + Math.max(0, h * 0.06);
    const rock = 0.25 + 0.1 * Math.random() + h * 0.03;
    const r = blend * rock + (1 - blend) * (0.12 + 0.1 * Math.random() + h * 0.04);
    const g = blend * (rock * 0.9) + (1 - blend) * grass;
    const bVal = blend * (rock * 0.7) + (1 - blend) * (0.08 + 0.06 * Math.random() + Math.max(0, h * 0.02));
    colors[i * 3] = Math.min(0.6, r);
    colors[i * 3 + 1] = Math.min(0.7, g);
    colors[i * 3 + 2] = Math.min(0.5, bVal);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // Blend texture
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const i = (y * 512 + x) * 4;
    const px = (x / 512 - 0.5) * WORLD.size;
    const pz = (y / 512 - 0.5) * WORLD.size;
    const h = Math.sin(px * 0.035 + pz * 0.028) * 0.6
      + Math.sin(px * 0.07 - pz * 0.055 + 1.2) * 0.3
      + Math.cos(px * 0.11 + pz * 0.09 + 0.7) * 0.15;
    const steep = Math.abs(h - (Math.sin((px + 0.5) * 0.035 + pz * 0.028) * 0.6
      + Math.sin((px + 0.5) * 0.07 - pz * 0.055 + 1.2) * 0.3
      + Math.cos((px + 0.5) * 0.11 + pz * 0.09 + 0.7) * 0.15));
    const blend = Math.min(1, steep * 3.5);
    bId.data[i] = blend * 255;
    bId.data[i + 1] = blend * 255;
    bId.data[i + 2] = blend * 255;
    bId.data[i + 3] = 255;
  }
  bctx.putImageData(bId, 0, 0);
  const blendTex = new THREE.CanvasTexture(blendTexCanvas);
  blendTex.wrapS = blendTex.wrapT = THREE.RepeatWrapping;
  blendTex.repeat.set(1, 1);

  // Use a combined approach: grass as main, rock as optional
  groundMat.map = grassSet.map;
  groundMat.normalMap = grassSet.normalMap;
  groundMat.normalScale = new THREE.Vector2(1.5, 1.5);

  const mesh = new THREE.Mesh(geo, groundMat);
  mesh.receiveShadow = true;
  // Add grass detail patches
  for (let i = 0; i < 80; i++) {
    const gx = (Math.random() - 0.5) * WORLD.size * 0.7;
    const gz = (Math.random() - 0.5) * WORLD.size * 0.7;
    const blade = new THREE.Mesh(
      new THREE.PlaneGeometry(0.02, 0.04 + Math.random() * 0.08),
      new THREE.MeshBasicMaterial({ color: 0x2a4a1a, transparent: true, opacity: 0.2 + Math.random() * 0.2, side: THREE.DoubleSide, depthWrite: false })
    );
    blade.position.set(gx, 0.02, gz);
    blade.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    blade.rotation.z = Math.random() * Math.PI * 2;
    mesh.add(blade);
  }
  return mesh;
}

function makeRoad(px, pz, w, d, angle) {
  const g = new THREE.PlaneGeometry(w, d, 8, 8);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, (Math.sin(x * 0.7 + z * 0.5) * 0.02 + Math.sin(x * 0.3 - z * 0.4) * 0.015) + 0.005);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  const aspSet = asphaltTex(3);
  const m = new THREE.Mesh(g, makeMat(aspSet, 0.9, 0.05));
  m.position.set(px, 0.015, pz);
  m.rotation.y = angle;
  m.receiveShadow = true;
  // Lane marking
  const lw = w * 0.03, ld = d * 0.08;
  for (let i = -Math.floor(d / (ld * 2.5)); i <= Math.floor(d / (ld * 2.5)); i++) {
    if (Math.random() > 0.3) {
      const mark = new THREE.Mesh(
        new THREE.PlaneGeometry(lw, ld * 0.6),
        new THREE.MeshBasicMaterial({ color: 0x888866, transparent: true, opacity: 0.08, depthWrite: false })
      );
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(0, 0.01, i * ld * 2.5);
      m.add(mark);
    }
  }
  // Edge lines
  for (let s of [-1, 1]) {
    const edge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.04, d * 0.9),
      new THREE.MeshBasicMaterial({ color: 0x888866, transparent: true, opacity: 0.06, depthWrite: false })
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(s * w * 0.42, 0.01, 0);
    m.add(edge);
  }
  return m;
}

function makeTree_(x, z, s) {
  const g = new THREE.Group();
  const barkSet = barkTex(1);
  const leafSet = leafTex(2);
  const trunkMat = makeMat(barkSet, 0.9, 0.0, 0x5a4030);
  const canopyMat = makeMat(leafSet, 0.85, 0.0);
  const canopyMat2 = makeMat(leafSet, 0.85, 0.0, 0x1a4a0a);
  const canopyMat3 = makeMat(leafSet, 0.85, 0.0, 0x1e3e0e);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.10 * s, 0.8 * s, 7), trunkMat);
  trunk.position.y = 0.4 * s; trunk.castShadow = true; g.add(trunk);

  const addCanopy = (rad, yOff, xOff, zOff, mat) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(rad * s, 7, 6), mat);
    m.position.set(xOff, yOff * s, zOff); m.castShadow = true; g.add(m);
  };
  addCanopy(0.55, 0.95 + Math.random() * 0.15, 0, 0, canopyMat);
  addCanopy(0.40, 1.10 + Math.random() * 0.1, 0.30 * s, 0.18 * s, canopyMat2);
  addCanopy(0.35, 1.0 + Math.random() * 0.1, -0.25 * s, -0.18 * s, canopyMat3);
  addCanopy(0.30, 0.90 + Math.random() * 0.1, 0.15 * s, -0.35 * s, canopyMat2);
  addCanopy(0.25, 0.75 + Math.random() * 0.1, -0.35 * s, 0.25 * s, canopyMat3);

  g.position.set(x, 0, z);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}

function makeBuilding_(p) {
  const g = new THREE.Group();
  const h = p.h * (p.story || 1);
  const concSet = concreteTex(1.5);
  const concMat = makeMat(concSet, 0.85, 0.05, p.color);
  const winEmissive = windowEmissiveTex();
  const winGlow = windowGlowTex();
  const winMat = new THREE.MeshStandardMaterial({
    map: winEmissive,
    emissive: 0x88bbff, emissiveIntensity: 0.03, emissiveMap: winGlow,
    transparent: true, opacity: 0.35 + Math.random() * 0.15,
    roughness: 0.05, metalness: 0.2,
  });

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(p.w, h, p.d), concMat);
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);

  // Parapet on roof
  const parapetMat = makeMat(concSet, 0.9, 0.05, p.color);
  for (let side of [{ dx: 0, dz: 1 }, { dx: 0, dz: -1 }, { dx: 1, dz: 0 }, { dx: -1, dz: 0 }]) {
    const len = side.dx !== 0 ? p.w : p.d;
    const pp = new THREE.Mesh(new THREE.BoxGeometry(
      side.dx !== 0 ? len : 0.08,
      0.12,
      side.dz !== 0 ? len : 0.08
    ), parapetMat);
    pp.position.set(
      side.dx * (p.w / 2 - 0.04 * side.dx),
      h + 0.06,
      side.dz * (p.d / 2 - 0.04 * side.dz)
    );
    g.add(pp);
  }

  // Roof
  const roofSet = roofTex(2);
  const roofMat = makeMat(roofSet, 0.9, 0.0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(p.w, p.d) * 0.5, h * 0.18 + 0.2, 4), roofMat);
  roof.position.y = h + 0.06; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);

  // Cornices at each story
  const corniceMat = makeMat(concSet, 0.85, 0.05, 0x7a7a82);
  for (let f = 1; f <= (p.story || 1); f++) {
    const yOff = f * p.h;
    const corn = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.2, 0.08, p.d + 0.2), corniceMat);
    corn.position.y = yOff; g.add(corn);
    // Horizontal band below cornice
    if (f < (p.story || 1)) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.05, 0.15, p.d + 0.05), corniceMat);
      band.position.y = yOff - 0.25; g.add(band);
    }
  }

  // Columns on front facade (if wide enough)
  if (p.w >= 4) {
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x9a9aa2, roughness: 0.7, metalness: 0.05,
      map: concSet.map, normalMap: concSet.normalMap,
    });
    for (let i = -1; i <= 1; i += 2) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, h, 6), colMat);
      col.position.set(i * p.w * 0.35, h / 2, p.d / 2 + 0.02);
      col.castShadow = true; g.add(col);
    }
  }

  // Windows
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a32, roughness: 0.7, metalness: 0.2 });
  const sillMat = new THREE.MeshStandardMaterial({ color: 0x6a6a72, roughness: 0.8 });
  const winPerSide = Math.floor(p.w * 1.8);
  for (let side of [-1, 1]) {
    for (let i = 0; i < winPerSide; i++) {
      const wx = (i / (winPerSide - 1 || 1) - 0.5) * p.w * 0.55;
      const wy = h * (0.4 + 0.35 * (i % 2));
      // Glass
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.5), winMat);
      win.position.set(wx, wy, side * (p.d / 2 + 0.01)); g.add(win);
      // Window sill
      if (i % 2 === 0) {
        const sill = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.06), sillMat);
        sill.position.set(wx, wy - 0.27, side * (p.d / 2 + 0.04)); g.add(sill);
      }
      // Frame top
      const ft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.02), frameMat);
      ft.position.set(wx, wy + 0.26, side * (p.d / 2 + 0.015)); g.add(ft);
      // Frame bottom
      const fb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.02), frameMat);
      fb.position.set(wx, wy - 0.26, side * (p.d / 2 + 0.015)); g.add(fb);
      // Frame left
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), frameMat);
      fl.position.set(wx - 0.19, wy, side * (p.d / 2 + 0.015)); g.add(fl);
      // Frame right
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), frameMat);
      fr.position.set(wx + 0.19, wy, side * (p.d / 2 + 0.015)); g.add(fr);
      // Mullion (center vertical split)
      if (i < winPerSide - 1) {
        const mv = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.48, 0.02), frameMat);
        mv.position.set(wx, wy, side * (p.d / 2 + 0.015)); g.add(mv);
      }
    }
  }

  // Storefront awning (some buildings)
  if (!p.broken && p.story >= 2 && Math.random() > 0.4) {
    const awningMat = new THREE.MeshStandardMaterial({
      color: 0x8a3a2a, roughness: 0.9, map: fabricTex(1).map,
    });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(p.w * 0.7, 0.06, 0.4), awningMat);
    awning.position.set(0, 0.15, p.d / 2 + 0.25); g.add(awning);
    const awningLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4), awningMat);
    awningLeg.position.set(-p.w * 0.3, 0.12, p.d / 2 + 0.25); g.add(awningLeg);
    const awningLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4), awningMat);
    awningLeg2.position.set(p.w * 0.3, 0.12, p.d / 2 + 0.25); g.add(awningLeg2);
  }

  // Door
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x1a0a00, roughness: 0.95, map: createPBRTextures(64, 128, 26, 10, 0, 8, 1, { scratchCount: 8, normalStrength: 2.0, contrast: 1.2, seed: 200 }).map,
  });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.7), doorMat);
  door.position.set(0, 0.35, p.d / 2 + 0.01); g.add(door);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.75, 0.03), frameMat);
  doorFrame.position.set(0, 0.375, p.d / 2 + 0.015); g.add(doorFrame);

  // Broken building debris
  if (p.broken) {
    const debSet = concreteTex(1);
    const debMat = makeMat(debSet, 0.9, 0.05, p.color);
    for (let i = 0; i < 6; i++) {
      const rub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.14, 0), debMat);
      rub.position.set(
        (Math.random() - 0.5) * p.w * 0.5,
        0.03 + Math.random() * 0.12,
        p.d / 2 + 0.1 + Math.random() * 0.4
      );
      rub.scale.set(1 + Math.random() * 0.5, 0.3 + Math.random() * 0.5, 1 + Math.random() * 0.5);
      rub.castShadow = true; g.add(rub);
    }
    // Structural beams exposed
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.9, metalness: 0.1 });
    for (let i = 0; i < 3; i++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15 + Math.random() * 0.2, 0.05), beamMat);
      beam.position.set(
        (Math.random() - 0.5) * p.w * 0.6,
        Math.random() * h * 0.7 + 0.05,
        (Math.random() - 0.5) * p.d * 0.4
      );
      beam.rotation.x = Math.random() * 0.5; beam.rotation.z = Math.random() * 0.5;
      g.add(beam);
    }
  }

  g.position.set(p.x, 0, p.z);
  return g;
}

function makeRock_(x, z, s) {
  const geo = new THREE.DodecahedronGeometry(0.15 * s, 1);
  const rockSet = createPBRTextures(64, 64, 85, 82, 88, 22, 2, { scratchCount: 10, normalStrength: 4.0, contrast: 1.5, seed: 300 + Math.floor(x * z) });
  const m = new THREE.Mesh(geo, makeMat(rockSet, 0.9, 0.05));
  m.position.set(x + (Math.random() - 0.5) * 0.2, 0.02 * s, z + (Math.random() - 0.5) * 0.2);
  m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  m.scale.y = 0.4 + Math.random() * 0.6; m.castShadow = true; m.receiveShadow = true;
  return m;
}

function makeBush(x, z, s) {
  const g = new THREE.Group();
  const leafSet = leafTex(2);
  const m = makeMat(leafSet, 0.85, 0.0, 0x1a3a0a + Math.floor(Math.random() * 0x002a00));
  for (let i = 0; i < 7; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.09 * s * (0.5 + Math.random() * 0.6), 5, 4), m);
    mesh.position.set((Math.random() - 0.5) * 0.35 * s, 0.05 * s, (Math.random() - 0.5) * 0.35 * s);
    mesh.castShadow = true; g.add(mesh);
  }
  g.position.set(x, 0.02, z);
  g.rotation.y = Math.random() * 6;
  return g;
}

function makeCar(x, z, angle) {
  const g = new THREE.Group();
  const bodySet = createPBRTextures(128, 128, 68, 17, 17, 12, 1, { scratchCount: 5, normalStrength: 1.5, contrast: 1.0, seed: 400 });
  const cabinSet = createPBRTextures(64, 64, 34, 34, 51, 10, 1, { scratchCount: 3, normalStrength: 1.0, contrast: 0.8, seed: 410 });
  const bodyMat = makeMat(bodySet, 0.4, 0.6);
  const cabinMat = makeMat(cabinSet, 0.2, 0.4);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffeedd, emissive: 0xffdd88, emissiveIntensity: 0.05 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 1.7), bodyMat);
  body.position.y = 0.22; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.75), cabinMat);
  cabin.position.set(0, 0.42, -0.18); g.add(cabin);
  // Windshield
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.8 });
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.18), glassMat);
  ws.position.set(0, 0.4, -0.5); g.add(ws);
  // Headlights
  for (let s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 5), lightMat);
    hl.position.set(s * 0.25, 0.15, 0.88); g.add(hl);
  }
  // Wheels (torus)
  for (let s of [-1, 1]) {
    for (let f of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 6, 8), wheelMat);
      w.position.set(s * 0.38, 0.1, f * 0.55);
      w.rotation.y = Math.PI / 2; w.castShadow = true; g.add(w);
    }
  }
  g.position.set(x, 0.05, z); g.rotation.y = angle;
  return g;
}

function makeCharacter_() {
  const g = new THREE.Group();
  const skinT = skinTex();
  const skinMat = makeMat(skinT, 0.5, 0.0);
  const pantsSet = fabricTex(1);
  const pantsMat = makeMat(pantsSet, 0.85, 0.05, 0x3a3a4a);
  const shirtSet = createPBRTextures(64, 64, 74, 90, 58, 10, 1, { scratchCount: 4, normalStrength: 1.0, contrast: 0.6, seed: 500 });
  const shirtMat = makeMat(shirtSet, 0.7, 0.02, 0x4a5a3a);
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x2a2a1a, roughness: 0.9 });
  const bagSet = createPBRTextures(64, 64, 90, 74, 58, 8, 1, { scratchCount: 6, normalStrength: 1.5, contrast: 0.8, seed: 510 });
  const bagMat = makeMat(bagSet, 0.85, 0.02, 0x5a4a3a);
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 14), skinMat);
  head.position.y = 1.55; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2.5), hairMat);
  hair.position.y = 1.63; g.add(hair);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.28), shirtMat);
  torso.position.y = 1.15; torso.castShadow = true; g.add(torso);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.08, 7), skinMat);
  neck.position.y = 1.38; g.add(neck);
  const bp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.18), bagMat);
  bp.position.set(0, 1.15, -0.22); g.add(bp);

  for (let s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.45, 7), shirtMat);
    arm.position.set(s * 0.32, 1.2, 0); arm.rotation.z = s * 0.15; arm.castShadow = true; g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skinMat);
    hand.position.set(s * 0.34, 0.97, 0); g.add(hand);
  }
  for (let s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.55, 7), pantsMat);
    leg.position.set(s * 0.13, 0.55, 0); leg.castShadow = true; g.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.14), bootMat);
    foot.position.set(s * 0.13, 0.025, 0.03); g.add(foot);
  }
  return g;
}

function makeSunGlow() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,240,200,0.6)");
  g.addColorStop(0.1, "rgba(255,220,160,0.3)");
  g.addColorStop(0.3, "rgba(200,180,140,0.1)");
  g.addColorStop(1, "rgba(200,180,140,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.6, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(25, 38, 18);
  sprite.scale.set(12, 12, 1);
  return sprite;
}

// ── LOADING ──
function Loading({ p, onStart }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { if (p >= 100) { const t = setTimeout(() => setReady(true), 300); return () => clearTimeout(t); } }, [p]);
  return (
    <div className="vsb-loading">
      <div className="vsb-loading-bg" />
      <div className="vsb-loading-box">
        <div className="vsb-loading-icon">☢️</div>
        <h1 className="vsb-loading-title">LAST CITY</h1>
        <p className="vsb-loading-sub">Sobrevivência Cinematográfica</p>
        <div className="vsb-loading-bar"><div className="vsb-loading-fill" style={{ width: `${p}%` }} /></div>
        <p className="vsb-loading-pct">{Math.floor(p)}%</p>
        {ready && <button className="vsb-loading-go" onClick={onStart}>▶ ENTRAR</button>}
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

  const container = useRef(null);
  const keys = useRef({});
  const charPos = useRef(new THREE.Vector3(0, 0, -2));
  const charRot = useRef(0);
  const camPos = useRef(new THREE.Vector3(0, 2.5, 5));
  const camLook = useRef(new THREE.Vector3(0, 1.2, 0));
  const walkT = useRef(0);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const targetFov = useRef(50);
  const shakeAmt = useRef(0);

  const notify = useCallback(m => setNotif(m), []);

  useEffect(() => {
    let p = 0;
    const int = setInterval(() => { p += 2 + Math.random() * 4; if (p > 100) p = 100; setLoadP(p); if (p >= 100) clearInterval(int); }, 120);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (phase !== "world") return;
    const el = container.current;
    if (!el) return;
    let dead = false;

    try {
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", stencil: false });
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.85;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x5588bb);

      const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 150);

      // ── Post-processing ──
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const ssaoPass = new SSAOPass(scene, camera, el.clientWidth, el.clientHeight);
      ssaoPass.kernelRadius = 0.5;
      ssaoPass.minDistance = 0.003;
      ssaoPass.maxDistance = 0.06;
      ssaoPass.renderToScreen = false;
      composer.addPass(ssaoPass);

      const bloom = new UnrealBloomPass(new THREE.Vector2(el.clientWidth, el.clientHeight), 0.10, 0.35, 0.85);
      bloom.renderToScreen = false;
      composer.addPass(bloom);
      composer.addPass(new OutputPass());

      // ── Sky dome ──
      const skyGeo = new THREE.SphereGeometry(110, 32, 24);
      const skyTex = skyGradientTex();
      skyTex.magFilter = THREE.LinearFilter;
      const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false });
      const sky = new THREE.Mesh(skyGeo, skyMat);
      sky.position.y = -5;
      scene.add(sky);

      // Atmosphere haze ring
      const hazeTex2 = hazeTex();
      const hazeMat = new THREE.MeshBasicMaterial({ map: hazeTex2, transparent: true, opacity: 0.03, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending });
      const hazeRing = new THREE.Mesh(new THREE.RingGeometry(40, 90, 32), hazeMat);
      hazeRing.rotation.x = -Math.PI / 2;
      hazeRing.position.y = 2;
      scene.add(hazeRing);

      // Sun glow
      scene.add(makeSunGlow());

      // ── Fog (atmospheric haze) ──
      scene.fog = new THREE.FogExp2(0x88aacc, 0.0025);

      // ── Lighting ──
      const ambient = new THREE.AmbientLight(0x88aacc, 0.15);
      scene.add(ambient);
      const hemi = new THREE.HemisphereLight(0x88bbdd, 0x554433, 0.3);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffddaa, 1.2);
      sun.position.set(25, 38, 18);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 70;
      sun.shadow.camera.left = -40;
      sun.shadow.camera.right = 40;
      sun.shadow.camera.top = 40;
      sun.shadow.camera.bottom = -40;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.02;
      scene.add(sun);

      const warmFill = new THREE.DirectionalLight(0xffcc88, 0.2);
      warmFill.position.set(-15, 12, -20);
      scene.add(warmFill);

      const rimBlue = new THREE.DirectionalLight(0x88bbff, 0.12);
      rimBlue.position.set(-25, 10, 30);
      scene.add(rimBlue);

      // ── World ──
      scene.add(makeGround());

      // Roads
      [
        [0, -10, 2.5, 18, 0],
        [0, 12, 2.5, 12, 0],
        [-14, 0, 12, 2.5, 0],
        [12, 0, 10, 2.5, 0],
        [-10, 8, 2.5, 10, Math.PI / 3],
        [8, -6, 2.5, 10, -Math.PI / 4],
      ].forEach(r => scene.add(makeRoad(...r)));

      // Buildings
      BUILDINGS.forEach(b => scene.add(makeBuilding_(b)));

      // Trees
      const treePositions = [];
      for (let i = 0; i < WORLD.treeCount; i++) {
        let x, z, ok, att = 0;
        do {
          x = (Math.random() - 0.5) * WORLD.size * 0.7;
          z = (Math.random() - 0.5) * WORLD.size * 0.7;
          ok = !BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 3) && !treePositions.some(t => Math.hypot(x - t.x, z - t.z) < 2);
          att++;
        } while (!ok && att < 20);
        if (ok) { scene.add(makeTree_(x, z, 0.5 + Math.random() * 0.7)); treePositions.push({ x, z }); }
      }

      // Bushes
      for (let i = 0; i < 70; i++) {
        const x = (Math.random() - 0.5) * WORLD.size * 0.65;
        const z = (Math.random() - 0.5) * WORLD.size * 0.65;
        if (!BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 2)) scene.add(makeBush(x, z, 0.4 + Math.random() * 0.6));
      }

      // Rocks
      for (let i = 0; i < WORLD.rockCount; i++) {
        const x = (Math.random() - 0.5) * WORLD.size * 0.7;
        const z = (Math.random() - 0.5) * WORLD.size * 0.7;
        scene.add(makeRock_(x, z, 0.3 + Math.random()));
      }

      // Cars
      const carsData = [[-8, -4, 0.2], [6, 5, -0.8], [-15, 12, 1.5], [10, -8, -0.3]];
      carsData.forEach(c => scene.add(makeCar(c[0], c[1], c[2])));

      const character = makeCharacter_();
      scene.add(character);

      // ── Interactives ──
      const interactiveMeshes = [];
      INTERACTIVES.forEach((item) => {
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 8, 8),
          new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.2 })
        );
        glow.position.set(item.x, 0.15, item.z);
        scene.add(glow);
        interactiveMeshes.push({ mesh: glow, item, collected: false });
      });

      // ── Atmosphere particles ──
      const pc = 600;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pc * 3);
      for (let i = 0; i < pc * 3; i++) pPos[i] = (Math.random() - 0.5) * 70;
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        color: 0xddeeff, size: 0.05, transparent: true, opacity: 0.04,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      particles.position.y = 5;
      scene.add(particles);

      // ── Ground dust ──
      const dc = 400;
      const dGeo = new THREE.BufferGeometry();
      const dPos = new Float32Array(dc * 3);
      for (let i = 0; i < dc * 3; i++) dPos[i] = (Math.random() - 0.5) * 60;
      dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
      const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
        color: 0xccddee, size: 0.02, transparent: true, opacity: 0.025,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      dust.position.y = 0.1;
      scene.add(dust);

      // ── Audio ──
      let audioCtx, audioSource, audioGain;
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        audioSource = audioCtx.createBufferSource();
        audioSource.buffer = buffer; audioSource.loop = true;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass"; filter.frequency.value = 120;
        audioGain = audioCtx.createGain();
        audioGain.gain.value = 0.04;
        audioSource.connect(filter); filter.connect(audioGain); audioGain.connect(audioCtx.destination);
        audioSource.start();
      } catch (e) { /* no audio */ }

      // ── Controls ──
      const onKey = (e, down) => {
        keys.current[e.key.toLowerCase()] = down;
        if (e.key.toLowerCase() === "i" && down && view === "world") setView("inventory");
        if (e.key.toLowerCase() === "escape" && down && document.pointerLockElement) document.exitPointerLock();
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

      // ── Game Loop ──
      const clock = new THREE.Clock();
      const MIDDAY = new THREE.Color(0x88aacc);

      const animate = () => {
        if (dead) return;
        const delta = Math.min(clock.getDelta(), 0.05);
        const t = clock.getElapsedTime();
        const k = keys.current;

        const fwd = k["w"] || k["arrowup"], bwd = k["s"] || k["arrowdown"];
        const lft = k["a"] || k["arrowleft"], rgt = k["d"] || k["arrowright"];
        const run = k["shift"];
        const speed = run ? 3.5 : 1.8;
        let mx = 0, mz = 0;
        if (fwd) mz -= 1; if (bwd) mz += 1; if (lft) mx -= 1; if (rgt) mx += 1;

        const moving = mx !== 0 || mz !== 0;
        if (moving) {
          const len = Math.hypot(mx, mz); mx /= len; mz /= len;
          const ta = Math.atan2(mx, mz);
          let diff = ta - charRot.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          charRot.current += diff * delta * 10;
          charPos.current.x += Math.sin(charRot.current) * speed * delta;
          charPos.current.z += Math.cos(charRot.current) * speed * delta;
          walkT.current += delta * (run ? 2.0 : 1.2);
          shakeAmt.current = run ? 0.015 : 0.005;
        } else { shakeAmt.current *= 0.95; }

        character.position.copy(charPos.current);
        character.rotation.y = charRot.current;

        if (moving) {
          character.position.y = Math.sin(walkT.current * 7) * 0.02;
          const swing = Math.sin(walkT.current * 7) * 0.3;
          const legSwing = Math.sin(walkT.current * 7) * 0.25;
          const c = character.children;
          if (c.length >= 6) { c[4].rotation.x = legSwing; c[5].rotation.x = -legSwing; c[2].rotation.x = -swing; c[3].rotation.x = swing; }
        } else {
          const c = character.children;
          if (c.length >= 6) { c[4].rotation.x *= 0.9; c[5].rotation.x *= 0.9; c[2].rotation.x *= 0.9; c[3].rotation.x *= 0.9; }
        }

        interactiveMeshes.forEach((obj) => {
          if (obj.collected) return;
          obj.mesh.material.opacity = 0.15 + Math.sin(t * 2 + obj.item.x) * 0.08;
          const dist = Math.hypot(charPos.current.x - obj.item.x, charPos.current.z - obj.item.z);
          if (dist < 1.5 && k["e"]) { obj.collected = true; scene.remove(obj.mesh); setFoundItem(obj.item); }
        });

        // Camera
        const dist = run ? 5.5 : 4.5;
        const angle = mouseX.current;
        const vert = Math.max(-0.35, Math.min(0.7, mouseY.current * 0.45));
        const targetPos = new THREE.Vector3(
          charPos.current.x + Math.sin(angle) * dist * Math.cos(vert),
          charPos.current.y + 1.5 + Math.sin(vert) * dist,
          charPos.current.z + Math.cos(angle) * dist * Math.cos(vert)
        );
        camPos.current.lerp(targetPos, delta * 8);
        const lookTarget = new THREE.Vector3(charPos.current.x, 1.0 + vert * 0.5, charPos.current.z);
        camLook.current.lerp(lookTarget, delta * 8);
        camera.position.copy(camPos.current);
        camera.lookAt(camLook.current);

        targetFov.current = run ? 58 : 48;
        camera.fov += (targetFov.current - camera.fov) * delta * 3;
        camera.updateProjectionMatrix();

        // Lock midday
        renderer.toneMappingExposure = 0.85;
        sun.intensity = 1.2;
        ambient.intensity = 0.15;
        hemi.intensity = 0.3;
        warmFill.intensity = 0.2;
        rimBlue.intensity = 0.12;
        scene.background.copy(MIDDAY);
        scene.fog.color.copy(MIDDAY);
        scene.fog.density = 0.0025;
        bloom.strength = 0.10;

        particles.rotation.y += delta * 0.008;
        dust.rotation.y += delta * 0.006;

        if (run && moving) setHud(h => ({ ...h, stamina: Math.max(0, h.stamina - 8 * delta) }));
        else if (!moving) setHud(h => ({ ...h, stamina: Math.min(100, h.stamina + 6 * delta) }));
        setHud(h => ({ ...h, hunger: Math.max(0, h.hunger - delta * 0.3), thirst: Math.max(0, h.thirst - delta * 0.4) }));

        composer.render();
        animRef.current = requestAnimationFrame(animate);
      };

      const animRef = { current: requestAnimationFrame(animate) };

      return () => {
        dead = true;
        cancelAnimationFrame(animRef.current);
        if (audioSource) try { audioSource.stop(); } catch (e) { }
        if (audioCtx) try { audioCtx.close(); } catch (e) { }
        document.removeEventListener("keydown", (e) => onKey(e, true));
        document.removeEventListener("mousemove", onMouse);
        if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
        window.removeEventListener("resize", onResize);
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer.dispose();
      };
    } catch (err) { console.error("[VSB Error]", err); }
  }, [phase]);

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
          <div className="vsb-hud-bar"><span>❤️</span><div className="vsb-hud-track"><div className="vsb-hud-fill health" style={{ width: `${hud.health}%` }} /></div></div>
          <div className="vsb-hud-bar"><span>⚡</span><div className="vsb-hud-track"><div className="vsb-hud-fill stamina" style={{ width: `${hud.stamina}%` }} /></div></div>
          <div className="vsb-hud-bar"><span>🍞</span><div className="vsb-hud-track"><div className="vsb-hud-fill hunger" style={{ width: `${hud.hunger}%` }} /></div></div>
          <div className="vsb-hud-bar"><span>💧</span><div className="vsb-hud-track"><div className="vsb-hud-fill thirst" style={{ width: `${hud.thirst}%` }} /></div></div>
        </div>
        <div className="vsb-hud-controls"><span>WASD</span><span>Shift correr</span><span>I inventário</span><span>Mouse olhar</span><span>E pegar</span></div>
        <div className="vsb-hud-location">ZONA ABANDONADA — SETOR 7</div>
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
