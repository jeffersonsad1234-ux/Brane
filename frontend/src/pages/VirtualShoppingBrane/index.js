import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import "./VirtualShoppingBrane.css";

// ─── CONSTANTS ──────────────────────────────────────────
const TW = 2.8, TD = 1.4, BR = 0.032, PR = 0.075;
const FRICTION = 0.988, MIN_V = 0.002, MAX_PWR = 4.5;
const HALF = { x: TW / 2 - 0.025, z: TD / 2 - 0.025 };
const BALL_COLORS = [
  0xffffff, 0xffcc00, 0x0044ff, 0xff2200, 0x7b2d8e,
  0xff6600, 0x006600, 0x8b0000, 0x111111,
  0xffcc00, 0x0044ff, 0xff2200, 0x7b2d8e,
  0xff6600, 0x006600, 0x8b0000,
];
const POCKETS = [[-1,-1],[0,-1],[1,-1],[-1,1],[0,1],[1,1]];
const SALAS = [
  { name: "Buteco", minBet: 100, icon: "🍺" },
  { name: "Boteco VIP", minBet: 1000, icon: "🥃" },
  { name: "Sinuca Premium", minBet: 10000, icon: "💎" },
  { name: "High Roller", minBet: 100000, icon: "👑" },
];
const AVATARS = ["🎱","🦜","🐊","🥥","🌴","🔥","💀","🍻","🏆","👑"];
const EMOTES = ["🔥","😂","💪","😎","👀","😤","🤡","🙏","😈","💀","🎯","🤌"];
const PROVOKES = [
  "Só isso? 😏","Minha vó joga melhor","Tá com medo?",
  "Aposta pouca 🤡","Vai perder feio","Bora logo 🔥",
  "Pau que bate em Chico...","Famoso fi de rachão",
  "Olha o mico","Tá fria aí? 🥶"
];
const NICKNAMES = [
  "Mandrake","Zé_Do_Botequim","Ronaldinho_Sinuca","Fera_Do_Bilhar",
  "Tio_Do_Churras","DaQuebrada","Malvadeza","O_Dono_Da_Mesa",
  "Pilantra_Jobs","Mestre_Dos_Table","Bateu_Levou","Taca_Seca",
];
const BC_STORAGE = "sinuca_brcoins"; const LVL_STORAGE = "sinuca_level"; const XP_STORAGE = "sinuca_xp";
function randNick() { return NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]; }
function randAvatar() { return AVATARS[Math.floor(Math.random() * AVATARS.length)]; }

// ─── PHYSICS ────────────────────────────────────────────
function col(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
  if (d >= BR * 2 || d < 1e-8) return;
  const nx = dx / d, nz = dz / d, dvn = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
  if (dvn <= 0) return;
  a.vx -= dvn * nx; a.vz -= dvn * nz;
  b.vx += dvn * nx; b.vz += dvn * nz;
  const ov = BR * 2 - d;
  a.x -= nx * ov / 2; a.z -= nz * ov / 2;
  b.x += nx * ov / 2; b.z += nz * ov / 2;
}
function wall(b) {
  if (b.x < -HALF.x) { b.x = -HALF.x; b.vx *= -0.75; }
  if (b.x > HALF.x) { b.x = HALF.x; b.vx *= -0.75; }
  if (b.z < -HALF.z) { b.z = -HALF.z; b.vz *= -0.75; }
  if (b.z > HALF.z) { b.z = HALF.z; b.vz *= -0.75; }
}
function inPocket(x, z) {
  for (const [px, pz] of POCKETS)
    if (Math.hypot(x - px * TW * 0.42, z - pz * TD * 0.42) < PR) return true;
  return false;
}
function aiDir(balls, cue) {
  const vis = balls.filter(b => !b.p && b.id !== 0);
  if (!vis.length) return { dx: 1, dz: 0, pwr: 2 };
  const t = vis.reduce((a, b) => Math.hypot(a.x - cue.x, a.z - cue.z) < Math.hypot(b.x - cue.x, b.z - cue.z) ? a : b);
  const dx = t.x - cue.x, dz = t.z - cue.z, d = Math.hypot(dx, dz) || 1;
  const j = (Math.random() - 0.5) * 0.18;
  return { dx: dx / d + j * dz / d, dz: dz / d - j * dx / d, pwr: 1.5 + Math.random() * 2 };
}

// ─── SOUND ENGINE (Web Audio) ───────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  return audioCtx;
}
function playCue() {
  const ctx = getAudio(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "triangle"; o.frequency.setValueAtTime(800, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
  g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.12);
}
function playHit() {
  const ctx = getAudio(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(1200, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
  g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.06);
}
function playPocket() {
  const ctx = getAudio(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(200, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
  g.gain.setValueAtTime(0.2, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.2);
}
function playWin() {
  const ctx = getAudio(); if (!ctx) return;
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, ctx.currentTime + i * 0.12); g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
    o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.3);
  });
}
function playLose() {
  const ctx = getAudio(); if (!ctx) return;
  const notes = [400, 350, 300, 200];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sawtooth"; o.frequency.value = f;
    g.gain.setValueAtTime(0, ctx.currentTime + i * 0.15); g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.15 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
    o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + i * 0.15); o.stop(ctx.currentTime + i * 0.15 + 0.3);
  });
}

// ─── THREE.JS PREMIUM SCENE ─────────────────────────────
function makeTable(mount) {
  const w = mount.clientWidth, h = mount.clientHeight;
  const cam = new THREE.PerspectiveCamera(28, w / h, 0.01, 20);
  cam.position.set(0, 3.5, 3.2); cam.lookAt(0, 0, 0);
  const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  ren.setSize(w, h); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
  ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap;
  ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = 1.0;
  ren.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(ren.domElement);

  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x08081a);

  // ─── Environment map (procedural) for reflections ───
  const pmrem = new THREE.PMREMGenerator(ren);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x1a1a3a);
  const envTex = pmrem.fromScene(envScene, 0, 0.1, 100).texture;
  pmrem.dispose();

  // ─── Dramatic lighting ───
  const amb = new THREE.AmbientLight(0x222244, 0.25); sc.add(amb);
  // Main overhead spot
  const mainLight = new THREE.SpotLight(0xffeedd, 2.5, 8, Math.PI / 4, 0.4, 1.5);
  mainLight.position.set(0, 3.5, 0); mainLight.target.position.set(0, 0, 0);
  mainLight.castShadow = true; mainLight.shadow.mapSize.set(1024, 1024);
  sc.add(mainLight); sc.add(mainLight.target);
  // Colored accent lights
  const accents = [
    { color: 0x8844ff, pos: [-2.0, 1.8, 1.8] },
    { color: 0xff4488, pos: [2.0, 1.8, -1.8] },
    { color: 0x44aaff, pos: [-1.5, 1.5, -2.0] },
    { color: 0xff8844, pos: [1.5, 1.5, 2.0] },
  ];
  const accentLights = accents.map(a => {
    const l = new THREE.PointLight(a.color, 0.6, 5);
    l.position.set(a.pos[0], a.pos[1], a.pos[2]); sc.add(l);
    // Light glow helper
    const g = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: a.color, transparent: true, opacity: 0.3 })
    );
    g.position.copy(l.position); sc.add(g);
    return { light: l, mesh: g, basePos: a.pos };
  });

  // ─── Floor (reflective dark) ───
  const flMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a1a, roughness: 0.15, metalness: 0.4, envMap: envTex, envMapIntensity: 0.5,
  });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), flMat);
  fl.rotation.x = -Math.PI / 2; fl.position.y = -0.02; fl.receiveShadow = true; sc.add(fl);

  // ─── Floor neon reflection rings ───
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x8844ff, transparent: true, opacity: 0.04, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 2.8, 48), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; sc.add(ring);

  // ─── Table body ───
  const tbMat = new THREE.MeshStandardMaterial({
    color: 0x1a0a04, roughness: 0.6, metalness: 0.15, envMap: envTex, envMapIntensity: 0.3,
  });
  const tb = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.3, 0.12, TD + 0.3), tbMat);
  tb.position.y = 0.03; tb.receiveShadow = true; tb.castShadow = true; sc.add(tb);

  // ─── Neon edge strip (animated) ───
  const neMat = new THREE.MeshBasicMaterial({ color: 0x8844ff });
  const neSt = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.35, 0.004, 0.012), neMat.clone());
  neSt.position.set(0, 0.065, 0); sc.add(neSt);
  const neSt2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, TD + 0.35), neMat.clone());
  neSt2.position.set(0, 0.065, 0); sc.add(neSt2);

  // ─── Felt ───
  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x0a7a3a, roughness: 0.55, metalness: 0.02,
    envMap: envTex, envMapIntensity: 0.1,
  });
  const felt = new THREE.Mesh(new THREE.PlaneGeometry(TW, TD), feltMat);
  felt.rotation.x = -Math.PI / 2; felt.position.y = 0.068; felt.receiveShadow = true; sc.add(felt);

  // ─── Cushions ───
  const cMat = new THREE.MeshStandardMaterial({
    color: 0x1a6a1a, roughness: 0.4, metalness: 0.1,
    envMap: envTex, envMapIntensity: 0.2,
  });
  const cData = [
    { x: 0, z: -TD / 2 + 0.015, sx: TW - PR * 2, sz: 0.035 },
    { x: 0, z: TD / 2 - 0.015, sx: TW - PR * 2, sz: 0.035 },
    { x: -TW / 2 + 0.015, z: 0, sx: 0.035, sz: TD - PR * 2 },
    { x: TW / 2 - 0.015, z: 0, sx: 0.035, sz: TD - PR * 2 },
  ];
  for (const c of cData) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(c.sx, 0.018, c.sz), cMat);
    m.position.set(c.x, 0.078, c.z); sc.add(m);
  }

  // ─── Pockets with glow ───
  const pMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, metalness: 0.5 });
  for (const [px, pz] of POCKETS) {
    const pm = new THREE.Mesh(new THREE.CircleGeometry(PR * 0.7, 20), pMat);
    pm.rotation.x = -Math.PI / 2; pm.position.set(px * TW * 0.42, 0.065, pz * TD * 0.42); sc.add(pm);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(PR * 0.72, 0.006, 10, 20),
      new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.2, metalness: 0.6, envMap: envTex }));
    rim.rotation.x = -Math.PI / 2; rim.position.set(px * TW * 0.42, 0.073, pz * TD * 0.42); sc.add(rim);
    // Pocket glow
    const pg = new THREE.Mesh(new THREE.CircleGeometry(PR * 0.4, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }));
    pg.rotation.x = -Math.PI / 2; pg.position.set(px * TW * 0.42, 0.064, pz * TD * 0.42); sc.add(pg);
  }

  // ─── Decorative diamonds on rails ───
  const diamMat = new THREE.MeshStandardMaterial({
    color: 0xccaa88, roughness: 0.2, metalness: 0.4, envMap: envTex, envMapIntensity: 0.5,
  });
  for (let i = 1; i < 4; i++) {
    for (const s of [-1, 1]) {
      const dm1 = new THREE.Mesh(new THREE.CircleGeometry(0.009, 4), diamMat);
      dm1.rotation.x = -Math.PI / 2; dm1.position.set((i / 4 - 0.5) * TW * 0.85, 0.088, s * (TD / 2 + 0.025)); sc.add(dm1);
      const dm2 = new THREE.Mesh(new THREE.CircleGeometry(0.009, 4), diamMat);
      dm2.rotation.x = -Math.PI / 2; dm2.position.set(s * (TW / 2 + 0.025), 0.088, (i / 4 - 0.5) * TD * 0.85); sc.add(dm2);
    }
  }

  // ─── Ball group ───
  const ballGroup = new THREE.Group(); sc.add(ballGroup);

  // ─── Smoke / ambient particles ───
  const pc = 400; const pgBuff = new THREE.BufferGeometry();
  const pp = new Float32Array(pc * 3); const po = new Float32Array(pc); const pv = new Float32Array(pc);
  for (let i = 0; i < pc; i++) {
    pp[i * 3] = (Math.random() - 0.5) * 6;
    pp[i * 3 + 1] = Math.random() * 2.2;
    pp[i * 3 + 2] = (Math.random() - 0.5) * 4;
    po[i] = 0.04 + Math.random() * 0.06;
    pv[i] = 0.002 + Math.random() * 0.005;
  }
  pgBuff.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  pgBuff.setAttribute("opacity", new THREE.BufferAttribute(po, 1));
  const ptMat = new THREE.PointsMaterial({
    color: 0x8866cc, size: 0.04, transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const smokePts = new THREE.Points(pgBuff, ptMat); sc.add(smokePts);

  // ─── Floating sparkle particles ───
  const spc = 150; const spg = new THREE.BufferGeometry();
  const spp = new Float32Array(spc * 3);
  for (let i = 0; i < spc; i++) {
    spp[i * 3] = (Math.random() - 0.5) * 5;
    spp[i * 3 + 1] = 0.1 + Math.random() * 1.5;
    spp[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
  }
  spg.setAttribute("position", new THREE.BufferAttribute(spp, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.008, transparent: true, opacity: 0.2,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const sparkPts = new THREE.Points(spg, sparkMat); sc.add(sparkPts);

  // ─── Neon "SINUCA" sign ───
  const signMat = new THREE.SpriteMaterial({
    map: (() => {
      const c = document.createElement("canvas"); c.width = 512; c.height = 128;
      const ctx = c.getContext("2d");
      ctx.shadowColor = "#8844ff"; ctx.shadowBlur = 40;
      ctx.fillStyle = "#ff44aa"; ctx.font = "bold 80px Inter, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🎱 SINUCA", 256, 64);
      ctx.shadowBlur = 60; ctx.fillText("🎱 SINUCA", 256, 64);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const sign = new THREE.Sprite(signMat);
  sign.position.set(0, 2.4, -1.6); sign.scale.set(2.0, 0.5, 1); sc.add(sign);

  // ─── Secondary neon signs ───
  const barSignMat = new THREE.SpriteMaterial({
    map: (() => {
      const c = document.createElement("canvas"); c.width = 256; c.height = 64;
      const ctx = c.getContext("2d");
      ctx.shadowColor = "#ff4488"; ctx.shadowBlur = 20;
      ctx.fillStyle = "#ff4488"; ctx.font = "bold 28px Inter, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🍺 BAR BRASIL", 128, 32);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4,
  });
  const barSign = new THREE.Sprite(barSignMat);
  barSign.position.set(-1.2, 2.0, -1.8); barSign.scale.set(0.8, 0.2, 1); sc.add(barSign);

  // Cue line
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(1, 0.12, 0)
  ]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
    color: 0xffdd44, transparent: true, opacity: 0.4, linewidth: 1,
  }));
  line.visible = false; sc.add(line);

  return {
    sc, ren, cam, ballGroup, envTex, line,
    accentLights, smPos: pp, smVel: pv, smokePts, sparkPts, neMat,
  };
}

function makeBallMesh(id, envTex) {
  const c = BALL_COLORS[id];
  const mat = new THREE.MeshStandardMaterial({
    color: c, roughness: 0.08, metalness: 0.1,
    envMap: envTex, envMapIntensity: 0.4,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(BR, 24, 24), mat);
  m.castShadow = true;
  if (id >= 9) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(BR * 0.85, BR * 0.25, 10, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.05, envMap: envTex })
    );
    band.rotation.x = Math.PI / 2; m.add(band);
  }
  return m;
}

// ◀═══ REACT COMPONENT ═══▶
export default function VirtualShoppingBrane() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const ballsRef = useRef([]);
  const meshesRef = useRef([]);
  const cueLineRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ down: false, sx: 0, sy: 0 });

  // ─── STATE ───
  const [screen, setScreen] = useState("menu");
  const [brcoins, setBrcoins] = useState(() => {
    try { return parseInt(localStorage.getItem(BC_STORAGE)) || 500; } catch { return 500; }
  });
  const [level, setLevel] = useState(() => {
    try { return parseInt(localStorage.getItem(LVL_STORAGE)) || 1; } catch { return 1; }
  });
  const [xp, setXp] = useState(() => {
    try { return parseInt(localStorage.getItem(XP_STORAGE)) || 0; } catch { return 0; }
  });
  const [bet, setBet] = useState(100);
  const [salaIdx, setSalaIdx] = useState(0);
  const [score, setScore] = useState({ p: 0, a: 0 });
  const [turn, setTurn] = useState("player");
  const [message, setMessage] = useState("Bem-vindo à Sinuca!");
  const [oponent, setOponent] = useState({ nick: randNick(), avatar: randAvatar(), level: Math.floor(Math.random() * 15) + 1 });
  const [playerNick] = useState("Você");
  const [playerAvatar] = useState("🎱");
  const [emoteMsg, setEmoteMsg] = useState(null);
  const [powerGauge, setPowerGauge] = useState(0);
  const [streak, setStreak] = useState(0);
  const [matches, setMatches] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sinuca_matches")) || []; } catch { return []; }
  });
  const [onlineCount, setOnlineCount] = useState(128 + Math.floor(Math.random() * 200));
  const [bgMusicOn, setBgMusicOn] = useState(false);
  const bgMusicRef = useRef(null);

  const XP_PER_LEVEL = 200;
  useEffect(() => { localStorage.setItem(BC_STORAGE, String(brcoins)); }, [brcoins]);
  useEffect(() => { localStorage.setItem(LVL_STORAGE, String(level)); }, [level]);
  useEffect(() => { localStorage.setItem(XP_STORAGE, String(xp)); }, [xp]);

  const addXp = useCallback((amt) => {
    setXp(p => { const n = p + amt; if (n >= XP_PER_LEVEL) { setLevel(L => L + 1); return n - XP_PER_LEVEL; } return n; });
  }, []);

  // Simulate online count fluctuation
  useEffect(() => {
    const iv = setInterval(() => setOnlineCount(128 + Math.floor(Math.random() * 250)), 5000 + Math.random() * 10000);
    return () => clearInterval(iv);
  }, []);

  // Background ambient
  useEffect(() => {
    if (!bgMusicOn) {
      if (bgMusicRef.current) { bgMusicRef.current.disconnect(); bgMusicRef.current = null; }
      return;
    }
    const ctx = getAudio();
    if (!ctx) return;
    const bufSize = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / ctx.sampleRate;
      d[i] = Math.sin(t * 55 + Math.sin(t * 0.5) * 2) * 0.02 +
             Math.sin(t * 82 + Math.sin(t * 0.3) * 1.5) * 0.01 +
             (Math.random() - 0.5) * 0.005;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const flt = ctx.createBiquadFilter(); flt.type = "lowpass"; flt.frequency.value = 150;
    const gain = ctx.createGain(); gain.gain.value = 0.025;
    src.connect(flt); flt.connect(gain); gain.connect(ctx.destination);
    src.start(); bgMusicRef.current = { src, gain, flt };
    return () => { try { src.stop(); } catch {} };
  }, [bgMusicOn]);

  // ─── THREE.JS INIT ───
  const resetBalls = useCallback(() => {
    const balls = [{ id: 0, x: -TW * 0.28, z: 0, vx: 0, vz: 0, p: false, _c: false }];
    const sp = BR * 2.1; let idx = 1;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c <= r; c++)
        balls.push({ id: idx++, x: TW * 0.26 + r * sp * Math.cos(Math.PI / 6), z: (c - r / 2) * sp, vx: 0, vz: 0, p: false, _c: false });
    const ids = [1,2,3,4,5,6,7,9,10,11,12,13,14,15];
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    ids.splice(7, 0, 8);
    for (let i = 1; i <= 15; i++) balls[i].id = ids[i - 1];
    ballsRef.current = balls;
  }, []);

  const updateSceneBalls = useCallback(() => {
    if (!sceneRef.current) return;
    const { ballGroup, envTex } = sceneRef.current;
    while (ballGroup.children.length) ballGroup.remove(ballGroup.children[0]);
    meshesRef.current = [];
    for (const b of ballsRef.current) {
      if (b.p) continue;
      const m = makeBallMesh(b.id, envTex);
      m.position.set(b.x, BR + 0.07, b.z);
      ballGroup.add(m);
      meshesRef.current.push({ mesh: m, ball: b });
    }
  }, []);

  const initScene = useCallback(() => {
    if (!mountRef.current || sceneRef.current) return;
    const s = makeTable(mountRef.current);
    sceneRef.current = s;
    cueLineRef.current = s.line;

    // Animate scene
    let t = 0;
    const animLoop = () => {
      t += 0.008;
      // Animate accent lights
      if (s.accentLights) {
        s.accentLights.forEach((a, i) => {
          const offset = i * Math.PI / 2;
          a.light.position.x = a.basePos[0] + Math.sin(t * 0.3 + offset) * 0.15;
          a.light.position.z = a.basePos[2] + Math.cos(t * 0.4 + offset) * 0.15;
          a.light.intensity = 0.5 + Math.sin(t * 0.5 + offset) * 0.15;
          a.mesh.position.copy(a.light.position);
        });
      }
      // Smoke animation
      if (s.smPos) {
        for (let i = 0; i < s.smPos.length / 3; i++) {
          s.smPos[i * 3 + 1] += s.smVel[i];
          s.smPos[i * 3] += Math.sin(t + i) * 0.0003;
          if (s.smPos[i * 3 + 1] > 2.2) { s.smPos[i * 3 + 1] = 0; s.smPos[i * 3] = (Math.random() - 0.5) * 6; s.smPos[i * 3 + 2] = (Math.random() - 0.5) * 4; }
        }
        s.smokePts.geometry.attributes.position.needsUpdate = true;
      }
      // Sparkle twinkle
      if (s.sparkPts) {
        s.sparkPts.material.opacity = 0.1 + Math.sin(t * 2) * 0.08;
      }
      // Neon pulse
      if (s.neMat) {
        const pulse = 0.5 + Math.sin(t * 2) * 0.5;
        s.neMat.color.setHSL(0.75, 0.8, 0.3 + pulse * 0.15);
      }
      s.ren.render(s.sc, s.cam);
      animRef.current = requestAnimationFrame(animLoop);
    };
    animRef.current = requestAnimationFrame(animLoop);

    const onResize = () => {
      if (!mountRef.current || !sceneRef.current) return;
      const { cam, ren } = sceneRef.current;
      const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight;
      cam.aspect = w / h; cam.updateProjectionMatrix();
      ren.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    sceneRef.current._resize = onResize;
  }, []);

  useEffect(() => {
    initScene();
    resetBalls();
    updateSceneBalls();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (sceneRef.current) {
        window.removeEventListener("resize", sceneRef.current._resize);
        sceneRef.current.ren.dispose();
      }
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── PHYSICS ───
  const physicsStep = useCallback(() => {
    const balls = ballsRef.current;
    for (const b of balls) {
      if (b.p) continue;
      b.vx *= FRICTION; b.vz *= FRICTION;
      if (Math.abs(b.vx) < MIN_V) b.vx = 0;
      if (Math.abs(b.vz) < MIN_V) b.vz = 0;
      b.x += b.vx * 0.016 * 60;
      b.z += b.vz * 0.016 * 60;
      wall(b);
      if (inPocket(b.x, b.z)) { b.p = true; b.vx = 0; b.vz = 0; playPocket(); }
    }
    for (let i = 0; i < balls.length; i++)
      for (let j = i + 1; j < balls.length; j++)
        if (!balls[i].p && !balls[j].p) { col(balls[i], balls[j]); if (Math.hypot(balls[i].vx - balls[j].vx, balls[i].vz - balls[j].vz) > 0.01) playHit(); }
  }, []);

  const allStopped = useCallback(() => ballsRef.current.every(b => b.p || (Math.abs(b.vx) < MIN_V && Math.abs(b.vz) < MIN_V)), []);
  const shoot = useCallback((dx, dz, pwr) => {
    const cue = ballsRef.current[0]; if (cue.p) return;
    const d = Math.hypot(dx, dz) || 1;
    cue.vx = (dx / d) * pwr * 0.15; cue.vz = (dz / d) * pwr * 0.15;
    setTurn("waiting"); playCue();
    if (cueLineRef.current) cueLineRef.current.visible = false;
  }, []);

  const handlePlayerShot = useCallback((dx, dz, pwr) => {
    shoot(dx, dz, pwr);
    const check = setInterval(() => {
      physicsStep(); updateSceneBalls();
      if (allStopped()) {
        clearInterval(check);
        const jp = ballsRef.current.filter(b => b.p && !b._c && b.id !== 0);
        const cueP = ballsRef.current[0].p;
        jp.forEach(b => b._c = true);
        if (cueP) {
          ballsRef.current[0].p = false; ballsRef.current[0].x = -TW * 0.28; ballsRef.current[0].z = 0;
          ballsRef.current[0].vx = 0; ballsRef.current[0].vz = 0; updateSceneBalls();
          setMessage("⚠️ Tacada! Passou a vez 🤖"); setTurn("ai");
        } else if (jp.length > 0) {
          setScore(s => ({ ...s, p: s.p + jp.length }));
          setMessage(`✅ ${jp.length} bola(s)! De novo! 🔥`); setTurn("player");
        } else {
          setMessage("❌ Errou! Vez do oponente 🤖"); setTurn("ai");
        }
      }
    }, 30);
  }, [shoot, physicsStep, updateSceneBalls, allStopped]);

  // AI turn
  useEffect(() => {
    if (turn !== "ai") return;
    const t = setTimeout(() => {
      if (!allStopped()) return;
      const cue = ballsRef.current[0];
      if (cue.p) { cue.p = false; cue.x = -TW * 0.28; cue.z = 0; cue.vx = 0; cue.vz = 0; updateSceneBalls(); }
      const { dx, dz, pwr } = aiDir(ballsRef.current, cue);
      setTimeout(() => {
        shoot(dx, dz, pwr);
        const check = setInterval(() => {
          physicsStep(); updateSceneBalls();
          if (allStopped()) {
            clearInterval(check);
            const jp = ballsRef.current.filter(b => b.p && !b._c && b.id !== 0);
            jp.forEach(b => b._c = true);
            if (jp.length > 0) { setScore(s => ({ ...s, a: s.a + jp.length })); setTurn("ai"); }
            else { setTurn("player"); }
          }
        }, 30);
      }, 300 + Math.random() * 500);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn]);

  useEffect(() => {
    if (screen !== "game") return;
    let running = true;
    const loop = () => { if (!running) return; physicsStep(); updateSceneBalls(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return () => { running = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // End game
  useEffect(() => {
    if (screen !== "game") return;
    const allP = ballsRef.current.filter(b => b.id !== 0 && b.p).length;
    if (allP >= 15) {
      const win = score.p > score.a;
      const prize = win ? bet * 2 : 0;
      setBrcoins(c => c + prize); addXp(win ? 30 : 10);
      setStreak(s => win ? s + 1 : 0);
      setMatches(p => { const n = [{ result: win ? "win" : "lose", score: `${score.p}-${score.a}`, bet, prize, date: new Date().toISOString(), oponent: oponent.nick }, ...p].slice(0, 50); localStorage.setItem("sinuca_matches", JSON.stringify(n)); return n; });
      win ? playWin() : playLose();
      setScreen("resultado");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, screen]);

  const startMatch = useCallback((idx) => {
    const room = SALAS[idx];
    if (brcoins < room.minBet) { setMessage(`Saldo insuficiente! Precisa de ${room.minBet} BRCoins`); return; }
    setSalaIdx(idx); setBet(room.minBet); setScore({ p: 0, a: 0 });
    setOponent({ nick: randNick(), avatar: randAvatar(), level: Math.floor(Math.random() * 15) + 1 });
    setTurn("player"); setMessage(`🎱 ${room.icon} ${room.name}`);
    resetBalls(); ballsRef.current.forEach(b => b._c = false); updateSceneBalls();
    setScreen("game");
  }, [brcoins, resetBalls, updateSceneBalls]);

  const quickPlay = useCallback(() => {
    for (const [i, r] of SALAS.entries()) { if (brcoins >= r.minBet) { startMatch(i); return; } }
    setMessage("Saldo insuficiente!");
  }, [brcoins, startMatch]);

  // Mouse/touch handlers
  const handleMd = useCallback((e) => {
    if (turn !== "player" || screen !== "game") return;
    mouseRef.current = { down: true, sx: e.clientX, sy: e.clientY };
  }, [turn, screen]);
  const handleMm = useCallback((e) => {
    if (!mouseRef.current.down || turn !== "player" || !sceneRef.current) return;
    const cue = ballsRef.current[0]; if (!cue || cue.p) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const tx = mx * TW * 0.45, tz = my * TD * 0.45;
    const dx = tx - cue.x, dz = tz - cue.z, d = Math.hypot(dx, dz) || 1;
    if (cueLineRef.current) {
      cueLineRef.current.visible = true;
      const len = Math.min(d, 2);
      const pts = [new THREE.Vector3(cue.x, 0.12, cue.z), new THREE.Vector3(cue.x + (dx / d) * len, 0.12, cue.z + (dz / d) * len)];
      cueLineRef.current.geometry.dispose();
      cueLineRef.current.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    }
    setPowerGauge(Math.min(1, Math.hypot(e.clientX - mouseRef.current.sx, e.clientY - mouseRef.current.sy) / 200));
  }, [turn, screen]);
  const handleMu = useCallback((e) => {
    if (!mouseRef.current.down || turn !== "player") return;
    mouseRef.current.down = false; const cue = ballsRef.current[0]; if (!cue || cue.p) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const tx = mx * TW * 0.45, tz = my * TD * 0.45;
    const dx = tx - cue.x, dz = tz - cue.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return;
    const pwr = Math.min(MAX_PWR, Math.max(0.5, Math.hypot(e.clientX - mouseRef.current.sx, e.clientY - mouseRef.current.sy) / 200 * 3));
    setPowerGauge(0); handlePlayerShot(dx, dz, pwr);
  }, [turn, handlePlayerShot]);

  // ─── RENDER HELPERS ───
  const renderHeader = (title, back = "menu") => (
    <div className="br-header"><button className="br-btn-icon" onClick={() => setScreen(back)}>‹</button><span className="br-header-title">{title}</span><div className="br-coins-display">🪙 {brcoins.toLocaleString()}</div></div>
  );

  // ─── SCREENS ───
  if (screen === "menu") return (
    <div className="br-root">
      <div className="br-bg-neon" />
      <div className="br-menu">
        <div className="br-menu-top">
          <div className="br-menu-online">🟢 {onlineCount} online</div>
          <div className="br-logo"><span>SINUCA</span><span className="br-logo-sub">BR</span></div>
          <div className="br-menu-sub">🇧🇷 Sinuca de Bar • Apostas • Online</div>
          <div className="br-player-card-menu">
            <div className="br-pcm-left">
              <span className="br-avatar-big">{playerAvatar}</span>
              <div className="br-pcm-info">
                <span className="br-pcm-nick">{playerNick}</span>
                <span className="br-pcm-lvl">Nv.{level}</span>
                <div className="br-xp-bar"><div className="br-xp-fill" style={{ width: `${(xp / XP_PER_LEVEL) * 100}%` }} /></div>
              </div>
            </div>
            <div className="br-coins-hero">
              <span className="br-coin-icon">🪙</span>
              <span className="br-coin-val">{brcoins.toLocaleString()}</span>
              <span className="br-coin-label">BRCoins</span>
            </div>
          </div>
        </div>
        <div className="br-menu-buttons">
          <button className="br-btn-play-giant" onClick={quickPlay}>
            <span className="br-btn-play-icon">🎱</span>
            <span className="br-btn-play-text">JOGAR AGORA</span>
            <span className="br-btn-play-sub">Matchmaking rápido 🔥</span>
          </button>
          <div className="br-salas-label">🏆 SALAS DE APOSTA</div>
          <div className="br-salas">
            {SALAS.map((s, i) => (
              <button key={i} className={`br-sala-btn ${brcoins < s.minBet ? "br-locked" : ""}`} onClick={() => startMatch(i)}>
                <span className="br-sala-icon">{s.icon}</span>
                <div className="br-sala-info">
                  <span className="br-sala-name">{s.name}</span>
                  <span className="br-sala-desc">Aposta: {s.minBet.toLocaleString()} 🪙</span>
                </div>
                {brcoins >= s.minBet ? <span className="br-sala-go">▶</span> : <span className="br-sala-lock">🔒</span>}
              </button>
            ))}
          </div>
          <div className="br-menu-grid">
            <button className="br-menu-item" onClick={() => setScreen("ranking")}><span className="br-mi-icon">🏆</span> Ranking</button>
            <button className="br-menu-item" onClick={() => setScreen("loja")}><span className="br-mi-icon">🛒</span> Loja</button>
            <button className="br-menu-item" onClick={() => setScreen("perfil")}><span className="br-mi-icon">👤</span> Perfil</button>
            <button className="br-menu-item" onClick={() => setScreen("amigos")}><span className="br-mi-icon">👥</span> Amigos</button>
            <button className="br-menu-item" onClick={() => setScreen("clans")}><span className="br-mi-icon">⚔️</span> Clãs</button>
            <button className="br-menu-item" onClick={() => setScreen("inventario")}><span className="br-mi-icon">🎒</span> Inventário</button>
          </div>
          <div className="br-menu-extra">
            <button className={`br-menu-xtra-btn ${bgMusicOn ? "active" : ""}`} onClick={() => setBgMusicOn(!bgMusicOn)}>🎵 {bgMusicOn ? "ON" : "OFF"}</button>
            <span className="br-streak">{streak > 0 && `🔥 Streak: ${streak}`}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (screen === "game") return (
    <div className="br-root br-root-game"
      onMouseDown={handleMd} onMouseMove={handleMm} onMouseUp={handleMu}
      onTouchStart={e => { const t = e.touches[0]; handleMd({ clientX: t.clientX, clientY: t.clientY }); }}
      onTouchMove={e => { const t = e.touches[0]; handleMm({ clientX: t.clientX, clientY: t.clientY }); }}
      onTouchEnd={e => { handleMu({ clientX: mouseRef.current.sx, clientY: mouseRef.current.sy }); }}
    >
      {/* Table canvas (fullscreen) */}
      <div className="br-canvas" ref={mountRef} />

      {/* Top HUD */}
      <div className="br-game-hud">
        <div className="br-hud-player br-hud-left">
          <span className="br-hud-avatar">{playerAvatar}</span>
          <div className="br-hud-info">
            <div className="br-hud-nick">{playerNick}</div>
            <div className="br-hud-lvl">Nv.{level}</div>
          </div>
          <div className="br-hud-points">{score.p}</div>
        </div>
        <div className="br-hud-center">
          <div className="br-hud-bet">🪙 {bet.toLocaleString()}</div>
          <div className="br-hud-turn-indicator">
            <div className={`br-hud-dot ${turn === "player" ? "active" : ""}`} />
            <span className="br-hud-turn-label">
              {turn === "player" ? "SUA VEZ" : turn === "ai" ? "OPONENTE" : "ROLANDO..."}
            </span>
            <div className={`br-hud-dot ${turn === "ai" ? "active" : ""}`} />
          </div>
          <div className="br-hud-online">🟢 {onlineCount} online</div>
        </div>
        <div className="br-hud-player br-hud-right">
          <div className="br-hud-points">{score.a}</div>
          <div className="br-hud-info">
            <div className="br-hud-nick">{oponent.nick}</div>
            <div className="br-hud-lvl">Nv.{oponent.level}</div>
          </div>
          <span className="br-hud-avatar">{oponent.avatar}</span>
        </div>
      </div>

      {/* Power gauge */}
      {turn === "player" && powerGauge > 0 && (
        <div className="br-power-bar">
          <div className="br-power-track">
            <div className="br-power-fill" style={{
              width: `${powerGauge * 100}%`,
              background: powerGauge < 0.4 ? "linear-gradient(90deg,#22cc66,#44dd88)" :
                powerGauge < 0.7 ? "linear-gradient(90deg,#ffaa00,#ffcc22)" :
                "linear-gradient(90deg,#ff3344,#ff5566)"
            }} />
          </div>
          <span className="br-power-label">{Math.round(powerGauge * 100)}%</span>
        </div>
      )}

      {/* Emote bubble */}
      {emoteMsg && <div className="br-emote-popup">{emoteMsg}</div>}

      {/* Game message */}
      {message && <div className="br-game-msg">{message}</div>}

      {/* Bottom actions */}
      <div className="br-bottom-bar">
        <div className="br-bottom-left">
          {EMOTES.slice(0, 4).map((e, i) => (
            <button key={i} className="br-emote-btn" onClick={() => { setEmoteMsg(`${playerAvatar} ${e}`); setTimeout(() => setEmoteMsg(null), 2000); }}>{e}</button>
          ))}
          <button className="br-emote-btn br-provoke-btn"
            onClick={() => { const p = PROVOKES[Math.floor(Math.random() * PROVOKES.length)]; setEmoteMsg(`${playerAvatar} ${p}`); setTimeout(() => setEmoteMsg(null), 2500); }}>
            💬
          </button>
        </div>
        <div className="br-bottom-center">
          {turn === "player" && <span className="br-aim-hint">🎯 Arraste para mirar</span>}
        </div>
        <div className="br-bottom-right">
          <button className="br-menu-btn" onClick={() => setScreen("menu")}>⏹</button>
        </div>
      </div>
    </div>
  );

  if (screen === "resultado") {
    const won = score.p > score.a;
    return (
      <div className="br-root">
        <div className="br-bg-neon" />
        <div className="br-resultado">
          <div className={`br-result-icon ${won ? "br-win" : "br-lose"}`}>{won ? "🏆" : "😞"}</div>
          <div className="br-result-title">{won ? "VITÓRIA!" : "DERROTA"}</div>
          <div className="br-result-score">{score.p} - {score.a}</div>
          <div className="br-result-oponent">{oponent.avatar} {oponent.nick} • Nv.{oponent.level}</div>
          <div className="br-result-prize">{won ? `+${bet * 2}` : `-${bet}`} 🪙</div>
          {won && streak > 0 && <div className="br-result-streak">🔥 Streak: {streak}</div>}
          <div className="br-result-xp">+{won ? 30 : 10} XP</div>
          <button className="br-btn-play-giant" onClick={() => startMatch(salaIdx)} style={{ marginTop: ".5rem" }}>🔄 REVANCHE</button>
          <button className="br-btn-secondary" onClick={() => setScreen("menu")}>🏠 Menu</button>
        </div>
      </div>
    );
  }

  if (screen === "loja") return (
    <div className="br-root"><div className="br-bg-neon" />
      <div className="br-screen">{renderHeader("🛒 Loja")}
        <div className="br-shop-grid">
          {[{ id:"taco_bronze",name:"Taco Bronze",price:0,rarity:"comum",icon:"🏏",color:"#8B6914" },
            { id:"taco_prata",name:"Taco Prata",price:1500,rarity:"raro",icon:"🏏",color:"#C0C0C0" },
            { id:"taco_neon",name:"Taco Neon",price:3000,rarity:"épico",icon:"💜",color:"#8844ff" },
            { id:"taco_ouro",name:"Taco Ouro",price:8000,rarity:"lendário",icon:"🏆",color:"#FFD700" },
            { id:"taco_cristal",name:"Taco Cristal",price:15000,rarity:"lendário",icon:"💎",color:"#00ffff" },
            { id:"taco_fogo",name:"Taco Fogo",price:25000,rarity:"mítico",icon:"🔥",color:"#ff4400" },
            { id:"skin_classic",name:"Mesa Clássica",price:0,rarity:"comum",icon:"🎱",color:"#0a7a3a" },
            { id:"skin_azul",name:"Mesa Azul",price:2000,rarity:"raro",icon:"🎱",color:"#004488" },
            { id:"skin_ruby",name:"Mesa Rubi",price:5000,rarity:"épico",icon:"🎱",color:"#880022" },
            { id:"skin_neon",name:"Mesa Neon",price:10000,rarity:"lendário",icon:"🎱",color:"#220044" },
          ].map((item,i) => (
            <div key={i} className="br-shop-card" style={{borderColor:item.rarity==="lendário"?"#FFD700":item.rarity==="épico"?"#8844ff":item.rarity==="raro"?"#C0C0C0":"#333"}}>
              <div className="br-shop-item" style={{color:item.color}}>{item.icon}</div>
              <div className="br-shop-name">{item.name}</div>
              <div className="br-shop-rarity">{item.rarity}</div>
              <div className="br-shop-price">{item.price>0?`${item.price.toLocaleString()}🪙`:"Grátis"}</div>
              <button className="br-btn-sm" disabled={brcoins<item.price||item.price===0}
                onClick={()=>{if(brcoins>=item.price){setBrcoins(c=>c-item.price);setMessage(`${item.name} adquirido! 🎉`)}}}>{item.price===0?"Grátis":"Comprar"}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === "ranking") return (
    <div className="br-root"><div className="br-bg-neon" />
      <div className="br-screen">{renderHeader("🏆 Ranking Global")}
        <div className="br-ranking-list">
          {[...Array(10)].map((_,i)=>(
            <div key={i} className={`br-rank-item ${i===0?"br-gold":i<3?"br-top":""}`}>
              <span className="br-rank-pos">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</span>
              <span className="br-rank-avatar">{i===0?"👑":i===1?"🔥":i===2?"💎":"🎱"}</span>
              <span className="br-rank-name">{i===0?playerNick:NICKNAMES[i%NICKNAMES.length]}</span>
              <span className="br-rank-lvl">Nv.{Math.max(level,25-i*2)}</span>
              <span className="br-rank-coins">{(200000-i*18000).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === "perfil") return (
    <div className="br-root"><div className="br-bg-neon" />
      <div className="br-screen">{renderHeader("👤 Perfil")}
        <div className="br-profile-card">
          <div className="br-profile-avatar">{playerAvatar}</div>
          <div className="br-profile-name">{playerNick}</div>
          <div className="br-profile-level">Nível {level} • {xp}/{XP_PER_LEVEL} XP</div>
          <div className="br-xp-bar big"><div className="br-xp-fill" style={{width:`${(xp/XP_PER_LEVEL)*100}%`}}/></div>
          <div className="br-profile-stats">
            <div className="br-stat"><span>Partidas</span><strong>{matches.length}</strong></div>
            <div className="br-stat"><span>Vitórias</span><strong>{matches.filter(m=>m.result==="win").length}</strong></div>
            <div className="br-stat"><span>BRCoins</span><strong>{brcoins.toLocaleString()}</strong></div>
            <div className="br-stat"><span>Streak</span><strong>{streak}🔥</strong></div>
          </div>
          <div className="br-hist-title">📋 Últimas partidas</div>
          <div className="br-hist-list">
            {matches.slice(0,8).map((m,i)=>(
              <div key={i} className={`br-hist-item ${m.result==="win"?"br-win":"br-lose"}`}>
                <span>vs {m.oponent}</span><span>{m.score}</span>
                <span>{m.result==="win"?`+${m.prize}`:`-${m.bet}`}🪙</span>
              </div>
            ))}
            {matches.length===0&&<div className="br-empty">Nenhuma partida ainda</div>}
          </div>
        </div>
      </div>
    </div>
  );

  if (screen === "amigos") return (
    <div className="br-root"><div className="br-bg-neon" />
      <div className="br-screen">{renderHeader("👥 Amigos")}
        <div className="br-empty" style={{padding:"3rem 2rem",textAlign:"center"}}>
          <div style={{fontSize:"4rem",marginBottom:".5rem"}}>👥</div>
          <p style={{color:"#aaa",fontSize:".85rem",fontWeight:600}}>Convide seus amigos!</p>
          <p style={{color:"#666",fontSize:.65,margin:".3rem 0 1rem"}}>Compartilhe o link e desafie seus parças 🔥</p>
          <button className="br-btn-play-giant" onClick={()=>{navigator.clipboard?.writeText(window.location.href);setMessage("Link copiado! 📋")}}>🔗 CONVIDAR</button>
        </div>
      </div>
    </div>
  );

  if (screen === "clans") return (
    <div className="br-root"><div className="br-bg-neon" />
      <div className="br-screen">{renderHeader("⚔️ Clãs")}
        <div className="br-empty" style={{padding:"3rem 2rem",textAlign:"center"}}>
          <div style={{fontSize:"4rem",marginBottom:".5rem"}}>⚔️</div>
          <p style={{color:"#aaa",fontSize:".85rem",fontWeight:600}}>Clãs em breve!</p>
          <p style={{color:"#666",fontSize:".65rem"}}>Monte seu time e domine o ranking.</p>
        </div>
      </div>
    </div>
  );

  if (screen === "inventario") return (
    <div className="br-root"><div className="br-bg-neon" />
      <div className="br-screen">{renderHeader("🎒 Inventário")}
        <div className="br-empty" style={{padding:"3rem 2rem",textAlign:"center"}}>
          <div style={{fontSize:"3rem",marginBottom:".5rem"}}>🎒</div>
          <p style={{color:"#888"}}>Seus itens aparecerão aqui.</p>
        </div>
      </div>
    </div>
  );

  return null;
}
