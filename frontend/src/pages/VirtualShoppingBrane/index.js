import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import "./VirtualShoppingBrane.css";

// ─── NOISE ──────────────────────────────────────────────
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return (h ^ (h >> 16)) / 4294967296; }
function smooth(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return (hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx) +
    ((hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * sx) - (hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx)) * sy;
}
function fbm(x, y, o = 5) {
  let v = 0, a = 1, f = 1, m = 0;
  for (let i = 0; i < o; i++) { v += smooth(x * f, y * f) * a; m += a; a *= 0.5; f *= 2; }
  return v / m;
}

// ─── HELPERS ────────────────────────────────────────────
const W = 140, BLOCK = 1.4, WH = 10;
function rng(m, M) { return m + Math.random() * (M - m); }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

const SKIN = "survival_data";
const BLOCK_TYPES = {
  dirt: { color: 0x8B6914, name: "Terra", roughness: 0.9 },
  wood: { color: 0x6a4a2a, name: "Madeira", roughness: 0.8 },
  stone: { color: 0x808080, name: "Pedra", roughness: 0.7 },
  plank: { color: 0xc4a46a, name: "Tábua", roughness: 0.6 },
  brick: { color: 0xaa5533, name: "Tijolo", roughness: 0.7 },
};

// ─── WORLD ──────────────────────────────────────────────
function buildWorld(scene) {
  const seg = W / BLOCK;
  const geo = new THREE.BufferGeometry();
  const verts = [], colors = [], idxs = [];
  const hMap = [];

  for (let iz = 0; iz <= seg; iz++) {
    for (let ix = 0; ix <= seg; ix++) {
      const x = ix * BLOCK - W / 2, z = iz * BLOCK - W / 2;
      const h = fbm(x * 0.018, z * 0.018) * WH - 3;
      // Ridge for mountains
      const ridge = 1 - Math.abs(fbm(x * 0.01 + 5, z * 0.01 + 5) * 2 - 1);
      const finalH = h + ridge * fbm(x * 0.025 + 10, z * 0.025 + 10) * 6;
      const vy = Math.floor(finalH * 2) / 2;
      hMap.push(vy);
      verts.push(x - BLOCK / 2, vy, z - BLOCK / 2);
      verts.push(x + BLOCK / 2, vy, z - BLOCK / 2);
      verts.push(x + BLOCK / 2, vy, z + BLOCK / 2);
      verts.push(x - BLOCK / 2, vy, z + BLOCK / 2);
      // Color by height
      const isDeepWater = vy < -1.5;
      const isShallow = vy >= -1.5 && vy < -0.3;
      const isSand = vy >= -0.3 && vy < 0.5;
      const isGrass = vy >= 0.5 && vy < 3;
      const isForest = vy >= 3 && vy < 5;
      const isRock = vy >= 5 && vy < 7;
      const isSnow = vy >= 7;
      let r, g, b;
      if (isSnow) { r = 0.95; g = 0.95; b = 1; }
      else if (isRock) { const t = fbm(x * 0.05, z * 0.05); r = 0.35 + t * 0.25; g = 0.33 + t * 0.22; b = 0.30 + t * 0.2; }
      else if (isForest) { const t = fbm(x * 0.08, z * 0.08); r = 0.1 + t * 0.15; g = 0.35 + t * 0.2; b = 0.08 + t * 0.08; }
      else if (isGrass) { const t = fbm(x * 0.08, z * 0.08); r = 0.2 + t * 0.15; g = 0.5 + t * 0.25; b = 0.1 + t * 0.08; }
      else if (isSand) { r = 0.82; g = 0.76; b = 0.52; }
      else if (isShallow) { r = 0.2; g = 0.55; b = 0.7; }
      else { r = 0.1; g = 0.2; b = 0.4; }
      for (let i = 0; i < 4; i++) { colors.push(r, g, b); }
      const base = ((iz * (seg + 1) + ix) * 4) / 3 | 0;
      if (ix < seg && iz < seg) {
        const a = base, b2 = base + 4, c = base + 4 * (seg + 1), d = base + 4 * (seg + 1) + 4;
        idxs.push(a, b2, c, a, c, d);
      }
    }
  }

  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(idxs);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.8, metalness: 0.02, flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true; mesh.castShadow = true;
  scene.add(mesh);

  // Water
  const wMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a6a9a, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.55,
    clearcoat: 0.1, envMapIntensity: 0.3,
  });
  const wGeo = new THREE.PlaneGeometry(W + 10, W + 10, 30, 30);
  const wMesh = new THREE.Mesh(wGeo, wMat);
  wMesh.rotation.x = -Math.PI / 2;
  wMesh.position.y = -0.3;
  wMesh.receiveShadow = true;
  scene.add(wMesh);

  // Trees
  const treePos = [];
  for (let i = 0; i < 250; i++) {
    const tx = rng(-W / 2 + 4, W / 2 - 4), tz = rng(-W / 2 + 4, W / 2 - 4);
    const th = fbm(tx * 0.018, tz * 0.018) * WH - 3 +
      (1 - Math.abs(fbm(tx * 0.01 + 5, tz * 0.01 + 5) * 2 - 1)) * fbm(tx * 0.025 + 10, tz * 0.025 + 10) * 6;
    if (th > 0.8 && th < 5 && fbm(tx * 0.05 + 20, tz * 0.05 + 20) > 0.35) {
      const trunkH = rng(1.2, 2.8);
      const trunkR = rng(0.12, 0.22);
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(trunkR * 0.6, trunkR, trunkH, 6),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(0.28 + rng(0, 0.1), 0.15 + rng(0, 0.05), 0.05 + rng(0, 0.03)), roughness: 0.9 })
      );
      trunk.position.set(tx, th + trunkH / 2, tz);
      trunk.castShadow = true;
      scene.add(trunk);

      // Canopy: 3-5 spheres
      const hue = rng(0.22, 0.35);
      const sat = rng(0.5, 0.7);
      const light = rng(0.25, 0.4);
      const col = new THREE.Color().setHSL(hue, sat, light);
      const col2 = new THREE.Color().setHSL(hue + rng(-0.03, 0.03), sat, light + rng(0.05, 0.12));
      const canopyCount = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < canopyCount; j++) {
        const cr = rng(0.4, 0.9);
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(cr, 5, 5),
          new THREE.MeshStandardMaterial({ color: j % 2 === 0 ? col : col2, roughness: 0.8, flatShading: true })
        );
        leaf.position.set(
          tx + rng(-0.5, 0.5),
          th + trunkH + rng(0, 0.6) + rng(-0.3, 0.3),
          tz + rng(-0.5, 0.5)
        );
        leaf.scale.y = rng(0.8, 1.1);
        leaf.castShadow = true;
        scene.add(leaf);
      }
      treePos.push({ x: tx, z: tz, h: th + trunkH + 0.8 });
    }
  }

  // Rocks with moss
  for (let i = 0; i < 100; i++) {
    const rx = rng(-W / 2 + 3, W / 2 - 3), rz = rng(-W / 2 + 3, W / 2 - 3);
    const rh = fbm(rx * 0.018, rz * 0.018) * WH - 3 +
      (1 - Math.abs(fbm(rx * 0.01 + 5, rz * 0.01 + 5) * 2 - 1)) * fbm(rx * 0.025 + 10, rz * 0.025 + 10) * 6;
    if (rh > 0.3 && rh < 6) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rng(0.2, 0.7), 0),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(0.35 + rng(0, 0.1), 0.32 + rng(0, 0.08), 0.28 + rng(0, 0.05)), roughness: 0.9, flatShading: true })
      );
      rock.position.set(rx, rh + rng(0, 0.2), rz);
      rock.scale.set(1, rng(0.3, 0.5), 1);
      rock.rotation.set(rng(0, 6), rng(0, 6), rng(0, 6));
      rock.castShadow = true;
      scene.add(rock);
    }
  }

  // Flowers
  for (let i = 0; i < 200; i++) {
    const fx = rng(-W / 2 + 3, W / 2 - 3), fz = rng(-W / 2 + 3, W / 2 - 3);
    const fh = fbm(fx * 0.018, fz * 0.018) * WH - 3 +
      (1 - Math.abs(fbm(fx * 0.01 + 5, fz * 0.01 + 5) * 2 - 1)) * fbm(fx * 0.025 + 10, fz * 0.025 + 10) * 6;
    if (fh > 0.5 && fh < 3.5) {
      const hue2 = rng(0.4, 1);
      const fcol = new THREE.Color().setHSL(hue2, 0.8, 0.5 + rng(0, 0.2));
      const f = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 4, 4),
        new THREE.MeshStandardMaterial({ color: fcol })
      );
      f.position.set(fx, fh + 0.06, fz);
      scene.add(f);
    }
  }

  // Villages — small huts
  for (let v = 0; v < 3; v++) {
    const vx = rng(-W / 2 + 15, W / 2 - 15), vz = rng(-W / 2 + 15, W / 2 - 15);
    const vh = fbm(vx * 0.018, vz * 0.018) * WH - 3 +
      (1 - Math.abs(fbm(vx * 0.01 + 5, vz * 0.01 + 5) * 2 - 1)) * fbm(vx * 0.025 + 10, vz * 0.025 + 10) * 6;
    if (vh > 0.5 && vh < 4) {
      const hutMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: 0.8 });
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xd4a46a, roughness: 0.85 });
      // Walls
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.9), wallMat);
      wall.position.set(vx, vh + 0.35, vz);
      wall.castShadow = true; wall.receiveShadow = true;
      scene.add(wall);
      // Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.5, 4), roofMat);
      roof.position.set(vx, vh + 0.9, vz);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      scene.add(roof);
      // Door
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a2a1a });
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.03), doorMat);
      door.position.set(vx + 0.5, vh + 0.25, vz);
      door.position.x = vx;
      door.position.z = vz + 0.46;
      scene.add(door);
      // Lantern glow
      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff8844 })
      );
      lantern.position.set(vx, vh + 1.1, vz);
      scene.add(lantern);
      const lLight = new THREE.PointLight(0xff8844, 0.3, 2);
      lLight.position.copy(lantern.position);
      scene.add(lLight);
    }
  }

  // Glowing crystals in caves (on surface for visibility)
  const oreColors = [0xff4488, 0x44aaff, 0x44ff88, 0xffaa00, 0x8844ff];
  for (let i = 0; i < 40; i++) {
    const ox = rng(-W / 2 + 6, W / 2 - 6), oz = rng(-W / 2 + 6, W / 2 - 6);
    const oh = fbm(ox * 0.018, oz * 0.018) * WH - 3 +
      (1 - Math.abs(fbm(ox * 0.01 + 5, oz * 0.01 + 5) * 2 - 1)) * fbm(ox * 0.025 + 10, oz * 0.025 + 10) * 6;
    if (oh > 0.5 && oh < 5) {
      const col = oreColors[Math.floor(Math.random() * oreColors.length)];
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(rng(0.12, 0.3), 0),
        new THREE.MeshStandardMaterial({
          color: col, roughness: 0.2, metalness: 0.5,
          emissive: col, emissiveIntensity: 0.2,
        })
      );
      crystal.position.set(ox, oh + 0.1, oz);
      crystal.castShadow = true;
      crystal.userData = { hp: 3, value: 5 + Math.floor(Math.random() * 10), isOre: true, color: col };
      scene.add(crystal);
    }
  }

  return { hMap, ground: mesh, water: wMesh, treePos };
}

// ─── PLAYER CHARACTER ───────────────────────────────────
function makePlayer(scene) {
  const g = new THREE.Group();
  // Body
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.5, flatShading: true });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), bodyMat);
  body.position.y = 0.85; body.castShadow = true; g.add(body);
  // Head
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, roughness: 0.4, flatShading: true });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), headMat);
  head.position.y = 1.35; head.castShadow = true; g.add(head);
  // Eyes
  const eMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eMat);
  e1.position.set(-0.1, 1.38, -0.18); g.add(e1);
  const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eMat);
  e2.position.set(0.1, 1.38, -0.18); g.add(e2);
  // Hat
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x44aaff, roughness: 0.3 });
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.15, 6), hatMat);
  hat.position.y = 1.55; g.add(hat);
  // Arms
  const armMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, roughness: 0.5 });
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), armMat);
  lArm.position.set(-0.3, 0.85, 0); g.add(lArm);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), armMat);
  rArm.position.set(0.3, 0.85, 0); g.add(rArm);
  // Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x3355aa, roughness: 0.6 });
  const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.14), legMat);
  lLeg.position.set(-0.13, 0.25, 0); g.add(lLeg);
  const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.14), legMat);
  rLeg.position.set(0.13, 0.25, 0); g.add(rLeg);

  g.position.set(0, 0, 0);
  scene.add(g);

  // Third person camera offset
  const camOffset = new THREE.Vector3(0, 2.5, 5);

  return { group: g, body, head, lArm, rArm, lLeg, rLeg, camOffset };
}

// ─── REACT ──────────────────────────────────────────────
export default function VirtualShoppingBrane() {
  const mountRef = useRef(null);
  const [screen, setScreen] = useState("menu");
  const [health, setHealth] = useState(100);
  const [hunger, setHunger] = useState(100);
  const [coins, setCoins] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SKIN))?.coins || 50; } catch { return 50; }
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
    try { return JSON.parse(localStorage.getItem(SKIN))?.items || [{ id: "dirt", n: "Terra", i: "🟫", c: 10 }, { id: "wood", n: "Madeira", i: "🪵", c: 5 }, { id: "stone", n: "Pedra", i: "🪨", c: 3 }]; }
    catch { return [{ id: "dirt", n: "Terra", i: "🟫", c: 10 }, { id: "wood", n: "Madeira", i: "🪵", c: 5 }, { id: "stone", n: "Pedra", i: "🪨", c: 3 }]; }
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

  // ─── THREE INIT ───
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;
    const mount = mountRef.current;
    const w = mount.clientWidth, h = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a3e);
    scene.fog = new THREE.FogExp2(0x1a1a3e, 0.006);

    // ─── POST PROCESSING ───
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, null);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.3, 0.2, 0.05);
    composer.addPass(bloomPass);
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    // ─── CAMERA ───
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 120);
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 1, 0);

    // ─── LIGHTING ───
    const sun = new THREE.DirectionalLight(0xffcc88, 1.4);
    sun.position.set(30, 35, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50; sun.shadow.camera.bottom = -50;
    scene.add(sun);

    const amb = new THREE.AmbientLight(0x4488cc, 0.35);
    scene.add(amb);

    const hemi = new THREE.HemisphereLight(0x88ccff, 0x443322, 0.4);
    scene.add(hemi);

    // ─── SKY ───
    const skyG = new THREE.SphereGeometry(90, 24, 24);
    const skyM = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    const sky = new THREE.Mesh(skyG, skyM);
    scene.add(sky);

    // ─── SUN SPRITE ───
    const sunCanvas = document.createElement("canvas");
    sunCanvas.width = 64; sunCanvas.height = 64;
    const sctx = sunCanvas.getContext("2d");
    const sgrd = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sgrd.addColorStop(0, "rgba(255,220,180,1)");
    sgrd.addColorStop(0.2, "rgba(255,200,150,0.6)");
    sgrd.addColorStop(0.5, "rgba(255,180,100,0.2)");
    sgrd.addColorStop(1, "rgba(255,180,100,0)");
    sctx.fillStyle = sgrd; sctx.fillRect(0, 0, 64, 64);
    const sunTex = new THREE.CanvasTexture(sunCanvas);
    const sunMat = new THREE.SpriteMaterial({ map: sunTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 1 });
    const sunSprite = new THREE.Sprite(sunMat);
    sunSprite.scale.set(12, 12, 1);
    scene.add(sunSprite);

    // ─── MOON SPRITE ───
    const moonCanvas = document.createElement("canvas");
    moonCanvas.width = 64; moonCanvas.height = 64;
    const mctx = moonCanvas.getContext("2d");
    const mgrd = mctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    mgrd.addColorStop(0, "rgba(200,220,255,0.8)");
    mgrd.addColorStop(0.3, "rgba(180,200,255,0.3)");
    mgrd.addColorStop(0.6, "rgba(180,200,255,0.08)");
    mgrd.addColorStop(1, "rgba(180,200,255,0)");
    mctx.fillStyle = mgrd; mctx.fillRect(0, 0, 64, 64);
    const moonTex = new THREE.CanvasTexture(moonCanvas);
    const moonMat = new THREE.SpriteMaterial({ map: moonTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    const moonSprite = new THREE.Sprite(moonMat);
    moonSprite.scale.set(8, 8, 1);
    scene.add(moonSprite);

    // ─── STARS ───
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r2 = 70 + Math.random() * 10;
      starPos[i * 3] = r2 * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r2 * Math.cos(phi));
      starPos[i * 3 + 2] = r2 * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
    const starMat2 = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0, sizeAttenuation: true });
    const stars = new THREE.Points(starGeo, starMat2);
    scene.add(stars);

    // ─── FIREFLIES ───
    const ffCount = 60;
    const ffGeo = new THREE.BufferGeometry();
    const ffPos = new Float32Array(ffCount * 3);
    const ffVel = new Float32Array(ffCount * 3);
    const ffPhase = new Float32Array(ffCount);
    for (let i = 0; i < ffCount; i++) {
      ffPos[i * 3] = rng(-W / 2 + 5, W / 2 - 5);
      ffPos[i * 3 + 1] = rng(0.3, 2);
      ffPos[i * 3 + 2] = rng(-W / 2 + 5, W / 2 - 5);
      ffVel[i * 3] = rng(-0.3, 0.3);
      ffVel[i * 3 + 1] = rng(-0.1, 0.1);
      ffVel[i * 3 + 2] = rng(-0.3, 0.3);
      ffPhase[i] = rng(0, Math.PI * 2);
    }
    ffGeo.setAttribute("position", new THREE.Float32BufferAttribute(ffPos, 3));
    const ffMat = new THREE.PointsMaterial({
      color: 0xffee88, size: 0.08, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const fireflies = new THREE.Points(ffGeo, ffMat);
    scene.add(fireflies);

    // ─── WORLD ───
    const world = buildWorld(scene);

    // ─── PLAYER ───
    const player = makePlayer(scene);
    playerRef.current = player;

    // ─── RESIZE ───
    const onResize = () => {
      const mw = mount.clientWidth, mh = mount.clientHeight;
      camera.aspect = mw / mh; camera.updateProjectionMatrix();
      renderer.setSize(mw, mh); composer.setSize(mw, mh);
    };
    window.addEventListener("resize", onResize);

    sceneRef.current = {
      scene, renderer, camera, sun, amb, hemi, sky, skyM, sunSprite, moonSprite,
      stars, starMat: starMat2, fireflies, ffMat, ffPos, ffVel, ffPhase,
      composer, world, player, sunMat, raycaster: new THREE.Raycaster(),
      playerPos: { x: 0, z: 0 },
    };

    // ─── GAME LOOP ───
    let lastTime = performance.now();
    let gameTime = 0.25;
    const keys = keysRef;

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      gameTime = (gameTime + dt * 0.015) % 1;
      setTime(gameTime);

      // ─── DAY/NIGHT ───
      const dayVal = (Math.sin(gameTime * Math.PI * 2) + 1) / 2;
      const nightVal = 1 - dayVal;
      const isNight = gameTime > 0.55 && gameTime < 0.95;

      // Sky color
      const skyColor = new THREE.Color();
      if (gameTime > 0.2 && gameTime < 0.35) {
        // Sunrise
        skyColor.lerpColors(new THREE.Color(0x2a1a4a), new THREE.Color(0xff8844), (gameTime - 0.2) / 0.15);
      } else if (gameTime > 0.35 && gameTime < 0.5) {
        skyColor.lerpColors(new THREE.Color(0xff8844), new THREE.Color(0x87CEEB), (gameTime - 0.35) / 0.15);
      } else if (gameTime > 0.7 && gameTime < 0.82) {
        // Sunset
        skyColor.lerpColors(new THREE.Color(0x87CEEB), new THREE.Color(0xff6633), (gameTime - 0.7) / 0.12);
      } else if (gameTime > 0.82 && gameTime < 0.95) {
        skyColor.lerpColors(new THREE.Color(0xff6633), new THREE.Color(0x0a0a2e), (gameTime - 0.82) / 0.13);
      } else if (isNight) {
        skyColor.setHSL(0.7, 0.3, 0.06 + nightVal * 0.08);
      } else {
        skyColor.setHSL(0.58, 0.3, 0.5 + dayVal * 0.3);
      }
      scene.background = skyColor;
      skyM.color = skyColor;
      scene.fog.color = skyColor;

      // Sun position
      const sunAngle = gameTime * Math.PI * 2;
      sun.position.set(Math.sin(sunAngle) * 40, Math.cos(sunAngle) * 35 + 5, Math.cos(sunAngle) * 30);
      sunSprite.position.copy(sun.position);
      sunSprite.position.y += 2;
      sunMat.opacity = dayVal > 0.2 ? 1 : dayVal * 5;

      // Moon
      const moonAngle = (gameTime + 0.5) * Math.PI * 2;
      moonSprite.position.set(Math.sin(moonAngle) * 40, Math.cos(moonAngle) * 35 + 5, Math.cos(moonAngle) * 30);
      moonMat.opacity = isNight ? 0.8 : nightVal * 2;

      // Stars
      starMat2.opacity = isNight ? 0.6 + Math.random() * 0.1 : nightVal * 0.6;

      // Fireflies
      ffMat.opacity = isNight ? 0.4 : 0;
      const ffPos2 = fireflies.geometry.attributes.position.array;
      for (let i = 0; i < ffCount; i++) {
        ffPos2[i * 3] += ffVel[i * 3] * dt;
        ffPos2[i * 3 + 1] += Math.sin(now * 0.001 + ffPhase[i]) * 0.002;
        ffPos2[i * 3 + 2] += ffVel[i * 3 + 2] * dt;
        if (Math.abs(ffPos2[i * 3]) > W / 2) ffVel[i * 3] *= -1;
        if (Math.abs(ffPos2[i * 3 + 2]) > W / 2) ffVel[i * 3 + 2] *= -1;
      }
      fireflies.geometry.attributes.position.needsUpdate = true;

      // Sun intensity
      sun.intensity = 0.3 + dayVal * 1.2;
      const sunColor = new THREE.Color().lerpColors(
        new THREE.Color(0xff8844), new THREE.Color(0xffeecc), dayVal
      );
      sun.color = sunColor;
      amb.intensity = 0.1 + dayVal * 0.3;
      hemi.intensity = 0.15 + dayVal * 0.3;

      // ─── PLAYER MOVEMENT ───
      const p = player.group;
      const speed = (keys.current["ShiftLeft"] || keys.current["Shift"]) ? 3.5 : 1.8;
      const fwd = new THREE.Vector3(-Math.sin(cameraRef?.yaw || 0), 0, -Math.cos(cameraRef?.yaw || 0));
      const right2 = new THREE.Vector3(fwd.z, 0, -fwd.x);
      const move = new THREE.Vector3();
      if (keys.current["KeyW"] || keys.current["ArrowUp"]) move.add(fwd);
      if (keys.current["KeyS"] || keys.current["ArrowDown"]) move.sub(fwd);
      if (keys.current["KeyA"] || keys.current["ArrowLeft"]) move.sub(right2);
      if (keys.current["KeyD"] || keys.current["ArrowRight"]) move.add(right2);

      if (move.length() > 0) {
        move.normalize();
        p.position.x += move.x * speed * dt;
        p.position.z += move.z * speed * dt;
        // Face movement direction
        const targetAngle = Math.atan2(move.x, move.z);
        p.rotation.y += (targetAngle - p.rotation.y) * 0.1;
        // Walk animation
        const walkCycle = Math.sin(now * 0.008);
        player.lArm.rotation.x = walkCycle * 0.5;
        player.rArm.rotation.x = -walkCycle * 0.5;
        player.lLeg.rotation.x = -walkCycle * 0.3;
        player.rLeg.rotation.x = walkCycle * 0.3;
        player.body.position.y = 0.85 + Math.abs(walkCycle) * 0.03;
      } else {
        // Idle
        player.lArm.rotation.x *= 0.9;
        player.rArm.rotation.x *= 0.9;
        player.lLeg.rotation.x *= 0.9;
        player.rLeg.rotation.x *= 0.9;
        player.body.position.y = 0.85 + Math.sin(now * 0.002) * 0.01;
      }

      // Ground clamp
      const px = p.position.x, pz = p.position.z;
      if (Math.abs(px) < W / 2 - 1 && Math.abs(pz) < W / 2 - 1) {
        const gh = fbm(px * 0.018, pz * 0.018) * WH - 3 +
          (1 - Math.abs(fbm(px * 0.01 + 5, pz * 0.01 + 5) * 2 - 1)) * fbm(px * 0.025 + 10, pz * 0.025 + 10) * 6;
        p.position.y = Math.floor(gh * 2) / 2;
      }

      // ─── CAMERA ───
      const camTarget = new THREE.Vector3(
        p.position.x,
        p.position.y + 2.5,
        p.position.z + 5
      );
      camera.position.lerp(camTarget, dt * 3);
      camera.lookAt(p.position.x, p.position.y + 1.2, p.position.z);

      // ─── HUNGER ───
      if (Math.random() < dt * 0.015) {
        // Use refs for perf
      }

      // ─── WATER ANIMATION ───
      if (world.water) {
        const wPos = world.water.geometry.attributes.position;
        if (wPos) {
          for (let i = 0; i < wPos.count; i++) {
            const wx = wPos.getX(i), wz = wPos.getZ(i);
            wPos.setY(i, Math.sin(wx * 0.2 + now * 0.0008) * 0.04 + Math.sin(wz * 0.15 + now * 0.0006) * 0.03);
          }
          wPos.needsUpdate = true;
          world.water.geometry.computeVertexNormals();
        }
      }

      // ─── RENDER ───
      composer.render();
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── KEYBOARD + MOUSE ───
  const cameraRef = useRef({ yaw: 0 });

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

    const onClick = (e) => {
      if (screen !== "game") return;
      if (!document.pointerLockElement) {
        mountRef.current?.requestPointerLock?.();
        return;
      }
      // Place block
      const ref = sceneRef.current;
      if (!ref?.world?.ground) return;
      const { raycaster, camera, scene, world } = ref;
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const targets = [world.ground, ...placedBlocksRef.current.map(b => b.mesh)];
      const intersects = raycaster.intersectObjects(targets);
      if (intersects.length === 0) return;
      const hit = intersects[0];
      const normal = hit.face.normal.clone();
      const pos = hit.point.clone().add(normal.multiplyScalar(BLOCK * 0.5 + 0.01));
      const snapX = Math.round(pos.x / BLOCK) * BLOCK;
      const snapY = Math.round(pos.y / BLOCK) * BLOCK;
      const snapZ = Math.round(pos.z / BLOCK) * BLOCK;
      if (placedBlocksRef.current.some(b => Math.abs(b.x - snapX) < 0.01 && Math.abs(b.y - snapY) < 0.01 && Math.abs(b.z - snapZ) < 0.01)) return;
      const item = itemsRef.current[selectedSlotRef.current];
      if (!item || !BLOCK_TYPES[item.id]) return;
      const bt = BLOCK_TYPES[item.id];
      const blockMat = new THREE.MeshStandardMaterial({ color: bt.color, roughness: bt.roughness, flatShading: true });
      const block = new THREE.Mesh(new THREE.BoxGeometry(BLOCK * 0.95, BLOCK * 0.95, BLOCK * 0.95), blockMat);
      block.position.set(snapX, snapY, snapZ);
      block.castShadow = true; block.receiveShadow = true;
      scene.add(block);
      placedBlocksRef.current.push({ x: snapX, y: snapY, z: snapZ, type: item.id, mesh: block });
      const newItems = itemsRef.current.map((it, idx) => idx === selectedSlotRef.current ? { ...it, c: it.c - 1 } : it);
      if (newItems[selectedSlotRef.current].c <= 0) newItems.splice(selectedSlotRef.current, 1);
      setItems(newItems);
      showMsg(`${bt.name} colocada`);
    };
    mountRef.current?.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
      mountRef.current?.removeEventListener("click", onClick);
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
      {/* Menu */}
      {screen === "menu" && (
        <div className="sb-menu">
          <div className="sb-menu-sky" />
          <div className="sb-menu-content">
            <div className="sb-logo">
              <span className="sb-l-icon">🌄</span>
              <span className="sb-l-t">WILD</span>
              <span className="sb-l-s">CRAFT</span>
            </div>
            <p className="sb-m-sub">Sobrevivência • Exploração • Construção</p>
            <div className="sb-m-stats">
              <span>⭐ Nv.{level}</span><span>🪙 {coins}</span><span>🏆 {xp}XP</span>
            </div>
            <button className="sb-btn sb-btn-play" onClick={startGame}>▶ ENTRAR NO MUNDO</button>
            <div className="sb-m-hint">WASD mover • Mouse olhar • Clique para interagir</div>
            <div className="sb-m-info">
              <span>🌲 250 árvores</span><span>🏘️ Vilarejos</span><span>💎 Cristais</span>
              <span>🌙 Ciclo dia/noite</span><span>✨ Efeitos bloom</span>
            </div>
          </div>
        </div>
      )}

      {/* Game */}
      {screen === "game" && (
        <div className="sb-game">
          <div className="sb-canvas" ref={mountRef} />

          {/* HUD */}
          <div className="sb-hud">
            <div className="sb-hud-top">
              <div className="sb-hud-stats">
                <div className="sb-stat"><span className="sb-si">❤️</span><div className="sb-st"><div className="sb-sf" style={{ width: `${health}%`, background: `linear-gradient(90deg,#ff3344,#ff6688)` }} /></div></div>
                <div className="sb-stat"><span className="sb-si">🍖</span><div className="sb-st"><div className="sb-sf" style={{ width: `${hunger}%`, background: `linear-gradient(90deg,#cc8833,#eeaa44)` }} /></div></div>
                <div className="sb-hud-coin">🪙 {coins}</div>
                <div className="sb-hud-lvl">⭐ {level}</div>
              </div>
              <div className="sb-hud-time">🕐 {hour.toString().padStart(2, "0")}:{min.toString().padStart(2, "0")}</div>
            </div>

            {/* Crosshair */}
            <div className="sb-crosshair">+</div>

            {/* Hotbar */}
            <div className="sb-hotbar">
              {[...Array(5)].map((_, i) => {
                const item = items[i];
                const isActive = i === selectedSlot;
                return (
                  <div key={i} className={`sb-hotbar-slot${isActive ? ' active' : ''}`} onClick={() => setSelectedSlot(i)}>
                    {item ? <><span className="sb-hotbar-icon">{item.i}</span><span className="sb-hotbar-count">{item.c}</span></> : null}
                  </div>
                );
              })}
            </div>

            {/* Message */}
            {message && <div className="sb-msg">{message}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
