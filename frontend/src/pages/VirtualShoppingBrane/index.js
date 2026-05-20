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
const WORLD = { size: 200 };

const SALAS = [
  { name: "Buteco", minBet: 100, icon: "🍺" },
  { name: "Boteco VIP", minBet: 1000, icon: "🥃" },
  { name: "Sinuca Premium", minBet: 10000, icon: "💎" },
  { name: "High Roller", minBet: 100000, icon: "👑" },
];

const AVATARS = ["🎱","🦜","🐊","🥥","🌴","🔫","💀","🍻","🏆","🔥"];
const EMOTES = ["🔥","😂","💪","😎","👀","😤","🤡","🙏","😈","💀","🎯","🤌"];
const PROVOKES = [
  "Só isso? 😏", "Minha vó joga melhor", "Tá com medo?",
  "Aposta pouca 🤡", "Vai perder feio", "Bora logo 🔥",
  "Pau que bate em Chico...", "Famoso fi de rachão",
  "Olha o mico", "Tá fria aí? 🥶"
];
const NICKNAMES = [
  "Mandrake", "Zé_Do_Botequim", "Ronaldinho_Sinuca",
  "Fera_Do_Bilhar", "Tio_Do_Churras", "DaQuebrada",
  "Malvadeza", "O_Dono_Da_Mesa", "Pilantra_Jobs",
  "Mestre_Dos_Table", "Bateu_Levou", "Taca_Seca",
];

const BC_STORAGE = "sinuca_brcoins";
const LVL_STORAGE = "sinuca_level";
const XP_STORAGE = "sinuca_xp";

function randNick() { return NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)]; }
function randAvatar() { return AVATARS[Math.floor(Math.random() * AVATARS.length)]; }

// ─── PHYSICS ────────────────────────────────────────────
function col(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
  if (d >= BR * 2 || d < 1e-8) return;
  const nx = dx / d, nz = dz / d;
  const dvn = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
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

// ─── THREE.JS ───────────────────────────────────────────
function makeTable(mount) {
  const w = mount.clientWidth, h = mount.clientHeight;
  const cam = new THREE.PerspectiveCamera(32, w / h, 0.01, 20);
  cam.position.set(0, 3.0, 2.6); cam.lookAt(0, 0, 0);
  const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  ren.setSize(w, h); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
  ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap;
  ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = 0.95;
  mount.appendChild(ren.domElement);

  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x0a0a18);
  sc.fog = new THREE.Fog(0x0a0a18, 5, 10);

  // Ambient + neon lights
  const amb = new THREE.AmbientLight(0x222244, 0.3); sc.add(amb);
  const neon = new THREE.PointLight(0x8844ff, 1.2, 6);
  neon.position.set(0, 2.2, 0); sc.add(neon);
  const neon2 = new THREE.PointLight(0xff4488, 0.6, 4);
  neon2.position.set(-1.2, 1.5, 1.2); sc.add(neon2);
  const neon3 = new THREE.PointLight(0x44aaff, 0.6, 4);
  neon3.position.set(1.2, 1.5, -1.2); sc.add(neon3);

  const dir = new THREE.DirectionalLight(0xffeedd, 1.5);
  dir.position.set(2, 5, 3); dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  sc.add(dir);

  // Floor with neon reflections
  const fl = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ color: 0x0a0a18, roughness: 0.2, metalness: 0.3 })
  );
  fl.rotation.x = -Math.PI / 2; fl.position.y = -0.02; fl.receiveShadow = true; sc.add(fl);

  // Light glow rings on floor
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x8844ff, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
  const glow = new THREE.Mesh(new THREE.RingGeometry(0.5, 2.5, 32), glowMat);
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.001; sc.add(glow);

  // Table base - dark wood
  const tbMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7, metalness: 0.1 });
  const tb = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.25, 0.1, TD + 0.25), tbMat);
  tb.position.y = 0.02; tb.receiveShadow = true; tb.castShadow = true; sc.add(tb);

  // Neon edge strip
  const neMat = new THREE.MeshBasicMaterial({ color: 0x8844ff });
  const neSt = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.3, 0.005, 0.015), neMat);
  neSt.position.set(0, 0.06, 0); sc.add(neSt);
  const neSt2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.005, TD + 0.3), neMat);
  neSt2.position.set(0, 0.06, 0); sc.add(neSt2);

  // Felt
  const feltMat = new THREE.MeshStandardMaterial({ color: 0x0a7a3a, roughness: 0.6, metalness: 0.0 });
  const felt = new THREE.Mesh(new THREE.PlaneGeometry(TW, TD), feltMat);
  felt.rotation.x = -Math.PI / 2; felt.position.y = 0.065; felt.receiveShadow = true; sc.add(felt);

  // Cushions
  const cMat = new THREE.MeshStandardMaterial({ color: 0x1a5a1a, roughness: 0.5 });
  const cData = [
    { x: 0, z: -TD / 2 + 0.015, sx: TW - PR * 2, sz: 0.03 },
    { x: 0, z: TD / 2 - 0.015, sx: TW - PR * 2, sz: 0.03 },
    { x: -TW / 2 + 0.015, z: 0, sx: 0.03, sz: TD - PR * 2 },
    { x: TW / 2 - 0.015, z: 0, sx: 0.03, sz: TD - PR * 2 },
  ];
  for (const c of cData) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(c.sx, 0.015, c.sz), cMat);
    m.position.set(c.x, 0.075, c.z); sc.add(m);
  }

  // Pockets
  const pMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, metalness: 0.3 });
  for (const [px, pz] of POCKETS) {
    const pm = new THREE.Mesh(new THREE.CircleGeometry(PR * 0.7, 16), pMat);
    pm.rotation.x = -Math.PI / 2; pm.position.set(px * TW * 0.42, 0.062, pz * TD * 0.42); sc.add(pm);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(PR * 0.7, 0.005, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.5 }));
    rim.rotation.x = -Math.PI / 2; rim.position.set(px * TW * 0.42, 0.07, pz * TD * 0.42); sc.add(rim);
  }

  // Ball group
  const bg = new THREE.Group(); sc.add(bg);

  // Ambient particles
  const pc = 300; const pg = new THREE.BufferGeometry();
  const pp = new Float32Array(pc * 3); const po = new Float32Array(pc);
  for (let i = 0; i < pc; i++) {
    pp[i * 3] = (Math.random() - 0.5) * 6;
    pp[i * 3 + 1] = Math.random() * 2.5;
    pp[i * 3 + 2] = (Math.random() - 0.5) * 4;
    po[i] = 0.2 + Math.random() * 0.3;
  }
  pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
  pg.setAttribute("opacity", new THREE.BufferAttribute(po, 1));
  const ptMat = new THREE.PointsMaterial({
    color: 0x8844ff, size: 0.015, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const pts = new THREE.Points(pg, ptMat); sc.add(pts);

  // Neon sign "SINUCA"
  const sinucaGroup = new THREE.Group();
  const txtMat = new THREE.SpriteMaterial({
    map: (() => {
      const c = document.createElement("canvas"); c.width = 512; c.height = 128;
      const ctx = c.getContext("2d");
      ctx.shadowColor = "#8844ff"; ctx.shadowBlur = 30;
      ctx.fillStyle = "#ff44aa"; ctx.font = "bold 72px Inter, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🎱 SINUCA", 256, 64);
      ctx.shadowBlur = 50; ctx.fillText("🎱 SINUCA", 256, 64);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const txtSprite = new THREE.Sprite(txtMat);
  txtSprite.position.set(0, 2.6, -1.8); txtSprite.scale.set(1.8, 0.45, 1);
  sinucaGroup.add(txtSprite);
  sc.add(sinucaGroup);

  return { sc, ren, cam, ballGroup: bg, particles: pts, sinucaSign: sinucaGroup };
}

function makeBallMesh(id) {
  const c = BALL_COLORS[id];
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.12, metalness: 0.05 });
  const m = new THREE.Mesh(new THREE.SphereGeometry(BR, 20, 20), mat);
  m.castShadow = true;
  // Stripe band
  if (id >= 9) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(BR * 0.85, BR * 0.25, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
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
  const [screen, setScreen] = useState("menu"); // menu | sala | game | resultado | loja | perfil | ranking | amigos | clans | inventario
  const [brcoins, setBrcoins] = useState(() => {
    try { return parseInt(localStorage.getItem(BC_STORAGE)) || 500; }
    catch { return 500; }
  });
  const [level, setLevel] = useState(() => {
    try { return parseInt(localStorage.getItem(LVL_STORAGE)) || 1; }
    catch { return 1; }
  });
  const [xp, setXp] = useState(() => {
    try { return parseInt(localStorage.getItem(XP_STORAGE)) || 0; }
    catch { return 0; }
  });
  const [bet, setBet] = useState(100);
  const [salaIdx, setSalaIdx] = useState(0);
  const [score, setScore] = useState({ p: 0, a: 0 });
  const [turn, setTurn] = useState("player"); // player | ai | waiting
  const [message, setMessage] = useState("Bem-vindo à Sinuca!");
  const [oponent, setOponent] = useState({ nick: randNick(), avatar: randAvatar() });
  const [playerNick] = useState(() => "Você");
  const [playerAvatar] = useState("🎱");
  const [emoteMsg, setEmoteMsg] = useState(null);
  const [showProvoke, setShowProvoke] = useState(false);
  const [powerGauge, setPowerGauge] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [quickMsg, setQuickMsg] = useState("");
  const [streak, setStreak] = useState(0);
  const [matches, setMatches] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sinuca_matches")) || []; }
    catch { return []; }
  });
  const [selectedSala, setSelectedSala] = useState(null);
  const [activeTab, setActiveTab] = useState("home"); // home | perfil | ranking | loja | amigos | clans
  const [showInventory, setShowInventory] = useState(false);
  const [inventory, setInventory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sinuca_inv")) || { tacos: ["classico"], skins: [], emotes: ["🔥", "😂"] }; }
    catch { return { tacos: ["classico"], skins: [], emotes: ["🔥", "😂"] }; }
  });
  const [equipped, setEquipped] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sinuca_equip")) || { taco: "classico", skin: null, emote: "🔥" }; }
    catch { return { taco: "classico", skin: null, emote: "🔥" }; }
  });
  const [shopTab, setShopTab] = useState("tacos");
  const shopItems = useMemo(() => ({
    tacos: [
      { id: "classico", name: "Taco Clássico", price: 0, rarity: "comum", color: "#8B6914" },
      { id: "premium", name: "Taco Premium", price: 1500, rarity: "raro", color: "#C0C0C0" },
      { id: "neon", name: "Taco Neon Roxo", price: 3000, rarity: "épico", color: "#8844ff" },
      { id: "ouro", name: "Taco Dourado", price: 8000, rarity: "lendário", color: "#FFD700" },
      { id: "cristal", name: "Taco Cristal", price: 15000, rarity: "lendário", color: "#00ffff" },
      { id: "chamas", name: "Taco Em Chamas", price: 25000, rarity: "mítico", color: "#ff4400" },
    ],
    skins: [
      { id: "classic", name: "Mesa Clássica", price: 0, color: "#0a7a3a" },
      { id: "azul", name: "Mesa Azul Real", price: 2000, color: "#004488" },
      { id: "ruby", name: "Mesa Rubi", price: 5000, color: "#880022" },
      { id: "neon", name: "Mesa Neon", price: 10000, color: "#220044" },
      { id: "ouro", name: "Mesa Dourada", price: 20000, color: "#443300" },
    ],
    passes: [
      { id: "bronze", name: "Passe Bronze", price: 2000, rewards: "5 partidas VIP" },
      { id: "prata", name: "Passe Prata", price: 5000, rewards: "20 partidas + skin" },
      { id: "ouro", name: "Passe Ouro", price: 12000, rewards: "50 partidas + skin + taco" },
    ],
  }), []);

  const XP_PER_LEVEL = 200;

  // Persist
  useEffect(() => { localStorage.setItem(BC_STORAGE, String(brcoins)); }, [brcoins]);
  useEffect(() => { localStorage.setItem(LVL_STORAGE, String(level)); }, [level]);
  useEffect(() => { localStorage.setItem(XP_STORAGE, String(xp)); }, [xp]);

  const addXp = useCallback((amt) => {
    setXp(prev => {
      const n = prev + amt;
      if (n >= XP_PER_LEVEL) {
        setLevel(L => L + 1);
        return n - XP_PER_LEVEL;
      }
      return n;
    });
  }, []);

  // ─── THREE.JS SCENE SETUP ───
  const resetBalls = useCallback(() => {
    const balls = [{ id: 0, x: -TW * 0.28, z: 0, vx: 0, vz: 0, p: false, _c: false }];
    const sp = BR * 2.1;
    let idx = 1;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c <= r; c++)
        balls.push({ id: idx++, x: TW * 0.26 + r * sp * Math.cos(Math.PI / 6), z: (c - r / 2) * sp, vx: 0, vz: 0, p: false, _c: false });
    const ids = [1,2,3,4,5,6,7,9,10,11,12,13,14,15];
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    ids.splice(7, 0, 8);
    for (let i = 1; i <= 15; i++) balls[i].id = ids[i - 1];
    ballsRef.current = balls;
    return balls;
  }, []);

  const updateSceneBalls = useCallback(() => {
    if (!sceneRef.current) return;
    const { ballGroup, ballMesh: _ } = sceneRef.current;
    while (ballGroup.children.length) ballGroup.remove(ballGroup.children[0]);
    meshesRef.current = [];
    for (const b of ballsRef.current) {
      if (b.p) continue;
      const m = makeBallMesh(b.id);
      m.position.set(b.x, BR + 0.07, b.z);
      ballGroup.add(m);
      meshesRef.current.push({ mesh: m, ball: b });
    }
  }, []);

  const initScene = useCallback(() => {
    if (!mountRef.current || sceneRef.current) return;
    const s = makeTable(mountRef.current);
    sceneRef.current = s;

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(1, 0.1, 0)
    ]);
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
      color: 0xffdd44, transparent: true, opacity: 0.5, linewidth: 2
    }));
    line.visible = false;
    s.sc.add(line);
    cueLineRef.current = line;

    const onResize = () => {
      if (!mountRef.current || !sceneRef.current) return;
      const { cam, ren } = sceneRef.current;
      const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight;
      cam.aspect = w / h; cam.updateProjectionMatrix();
      ren.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Animate particles
    let t = 0;
    const animLoop = () => {
      t += 0.005;
      if (s.particles) {
        const pos = s.particles.geometry.attributes.position.array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3 + 1] += Math.sin(t + i) * 0.001;
        }
        s.particles.geometry.attributes.position.needsUpdate = true;
      }
      s.ren.render(s.sc, s.cam);
      animRef.current = requestAnimationFrame(animLoop);
    };
    animRef.current = requestAnimationFrame(animLoop);
    sceneRef.current._resize = onResize;
  }, []);

  useEffect(() => {
    initScene();
    const b = resetBalls();
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
      if (inPocket(b.x, b.z)) { b.p = true; b.vx = 0; b.vz = 0; }
    }
    for (let i = 0; i < balls.length; i++)
      for (let j = i + 1; j < balls.length; j++)
        if (!balls[i].p && !balls[j].p) col(balls[i], balls[j]);
  }, []);

  const allStopped = useCallback(() =>
    ballsRef.current.every(b => b.p || (Math.abs(b.vx) < MIN_V && Math.abs(b.vz) < MIN_V)),
  []);

  const shoot = useCallback((dx, dz, pwr) => {
    const cue = ballsRef.current[0];
    if (cue.p) return;
    const d = Math.hypot(dx, dz) || 1;
    cue.vx = (dx / d) * pwr * 0.15;
    cue.vz = (dz / d) * pwr * 0.15;
    setTurn("waiting");
    setMessage("Bolas rolando... 🎱");
    if (cueLineRef.current) cueLineRef.current.visible = false;
  }, []);

  const handlePlayerShot = useCallback((dx, dz, pwr) => {
    shoot(dx, dz, pwr);
    const check = setInterval(() => {
      physicsStep();
      updateSceneBalls();
      if (allStopped()) {
        clearInterval(check);
        const jp = ballsRef.current.filter(b => b.p && !b._c && b.id !== 0);
        const cueP = ballsRef.current[0].p;
        jp.forEach(b => b._c = true);
        if (cueP) {
          ballsRef.current[0].p = false;
          ballsRef.current[0].x = -TW * 0.28; ballsRef.current[0].z = 0;
          ballsRef.current[0].vx = 0; ballsRef.current[0].vz = 0;
          updateSceneBalls();
          setMessage("⚠️ Tacada! Passou a vez 🤖");
          setTurn("ai");
        } else if (jp.length > 0) {
          setScore(s => ({ ...s, p: s.p + jp.length }));
          setMessage(`✅ ${jp.length} bola(s)! De novo! 🔥`);
          setTurn("player");
        } else {
          setMessage("❌ Errou! Vez do oponente 🤖");
          setTurn("ai");
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
        setMessage(`🤖 ${oponent.nick} jogou...`);
        const check = setInterval(() => {
          physicsStep(); updateSceneBalls();
          if (allStopped()) {
            clearInterval(check);
            const jp = ballsRef.current.filter(b => b.p && !b._c && b.id !== 0);
            jp.forEach(b => b._c = true);
            if (jp.length > 0) {
              setScore(s => ({ ...s, a: s.a + jp.length }));
              setMessage(`🤖 ${oponent.nick} fez ${jp.length} ponto(s)!`);
              setTurn("ai");
            } else {
              setMessage("🎯 Sua vez! 👤");
              setTurn("player");
            }
          }
        }, 30);
      }, 400 + Math.random() * 600);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn]);

  // Physics loop
  useEffect(() => {
    if (screen !== "game") return;
    let running = true;
    const loop = () => { if (!running) return; physicsStep(); updateSceneBalls(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return () => { running = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // End game check
  useEffect(() => {
    if (screen !== "game") return;
    const allP = ballsRef.current.filter(b => b.id !== 0 && b.p).length;
    if (allP >= 15) {
      const { p, a } = score;
      const win = p > a;
      const prize = win ? bet * 2 : 0;
      setBrcoins(c => c + prize);
      addXp(10 + (win ? 20 : 0));
      setStreak(s => win ? s + 1 : 0);
      const record = { result: win ? "win" : "lose", score: `${p}-${a}`, bet, prize, date: new Date().toISOString(), oponent: oponent.nick };
      setMatches(prev => {
        const n = [record, ...prev].slice(0, 50);
        localStorage.setItem("sinuca_matches", JSON.stringify(n));
        return n;
      });
      setMessage(win ? `🏆 Vitória! +${prize} BRCoins!` : `😞 Derrota! -${bet} BRCoins`);
      setScreen("resultado");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, screen]);

  // Mouse handlers
  const handleMd = useCallback((e) => {
    if (turn !== "player" || screen !== "game") return;
    mouseRef.current = { down: true, sx: e.clientX, sy: e.clientY };
  }, [turn, screen]);

  const handleMm = useCallback((e) => {
    if (!mouseRef.current.down || turn !== "player" || !sceneRef.current) return;
    const cue = ballsRef.current[0];
    if (!cue || cue.p) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const tx = mx * TW * 0.45, tz = my * TD * 0.45;
    const dx = tx - cue.x, dz = tz - cue.z, d = Math.hypot(dx, dz) || 1;
    if (cueLineRef.current) {
      cueLineRef.current.visible = true;
      const len = Math.min(d, 2);
      const pts = [new THREE.Vector3(cue.x, 0.1, cue.z), new THREE.Vector3(cue.x + (dx / d) * len, 0.1, cue.z + (dz / d) * len)];
      cueLineRef.current.geometry.dispose();
      cueLineRef.current.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    }
    const rawPwr = Math.hypot(e.clientX - mouseRef.current.sx, e.clientY - mouseRef.current.sy) / 200;
    setPowerGauge(Math.min(1, rawPwr));
  }, [turn, screen]);

  const handleMu = useCallback((e) => {
    if (!mouseRef.current.down || turn !== "player") return;
    mouseRef.current.down = false;
    const cue = ballsRef.current[0];
    if (!cue || cue.p) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const tx = mx * TW * 0.45, tz = my * TD * 0.45;
    const dx = tx - cue.x, dz = tz - cue.x, d = Math.hypot(dx, dz);
    if (d < 0.05) return;
    const rp = Math.hypot(e.clientX - mouseRef.current.sx, e.clientY - mouseRef.current.sy) / 200;
    const pwr = Math.min(MAX_PWR, Math.max(0.5, rp * 3));
    setPowerGauge(0);
    handlePlayerShot(dx, dz, pwr);
  }, [turn, handlePlayerShot]);

  // ─── GAME ACTIONS ───
  const startMatch = useCallback((idx) => {
    const room = SALAS[idx];
    if (brcoins < room.minBet) { setMessage(`Saldo insuficiente! Precisa de ${room.minBet} BRCoins`); return; }
    setSalaIdx(idx);
    setBet(room.minBet);
    setScore({ p: 0, a: 0 });
    setOponent({ nick: randNick(), avatar: randAvatar() });
    setTurn("player");
    setMessage(`🎱 ${room.icon} ${room.name} — ${room.minBet} BRCoins`);
    resetBalls();
    ballsRef.current.forEach(b => b._c = false);
    updateSceneBalls();
    setScreen("game");
  }, [brcoins, resetBalls, updateSceneBalls]);

  const quickPlay = useCallback(() => {
    // Find best available room
    for (const [i, r] of SALAS.entries()) {
      if (brcoins >= r.minBet) { startMatch(i); return; }
    }
    setMessage("Saldo insuficiente para qualquer sala!");
  }, [brcoins, startMatch]);

  const sendEmote = useCallback((e) => {
    setEmoteMsg(`${oponent.avatar} ${e}`);
    setTimeout(() => setEmoteMsg(null), 2000);
  }, [oponent]);

  const sendProvoke = useCallback(() => {
    const p = PROVOKES[Math.floor(Math.random() * PROVOKES.length)];
    setEmoteMsg(`${oponent.avatar} ${p}`);
    setTimeout(() => setEmoteMsg(null), 2500);
  }, [oponent]);

  // AI responds to emotes
  const aiEmote = useCallback(() => {
    const idx = Math.floor(Math.random() * EMOTES.length);
    setTimeout(() => {
      setEmoteMsg(`${EMOTES[idx]} ${oponent.nick}`);
      setTimeout(() => setEmoteMsg(null), 2000);
    }, 800 + Math.random() * 1500);
  }, [oponent]);

  const buyItem = useCallback((cat, item) => {
    if (brcoins < item.price) { setMessage("BRCoins insuficientes!"); return; }
    setBrcoins(c => c - item.price);
    setInventory(prev => {
      const n = { ...prev, [cat]: [...(prev[cat] || []), item.id] };
      localStorage.setItem("sinuca_inv", JSON.stringify(n));
      return n;
    });
    setMessage(`${item.name} adquirido! 🎉`);
  }, [brcoins]);

  const equipItem = useCallback((cat, id) => {
    setEquipped(prev => {
      const n = { ...prev, [cat]: id };
      localStorage.setItem("sinuca_equip", JSON.stringify(n));
      return n;
    });
  }, []);

  // ─── RENDER ───
  const renderHeader = (title, back = "menu") => (
    <div className="br-header">
      <button className="br-btn-icon" onClick={() => setScreen(back)}>‹</button>
      <span className="br-header-title">{title}</span>
      <div className="br-coins-display">🪙 {brcoins.toLocaleString()}</div>
    </div>
  );

  // ─── SCREENS ───
  if (screen === "menu") return (
    <div className="br-root">
      <div className="br-bg-neon" />
      <div className="br-menu">
        <div className="br-menu-top">
          <div className="br-logo">🎱<span>SINUCA</span></div>
          <div className="br-menu-sub">Brasileira • Apostas • Online</div>
          <div className="br-player-info">
            <span className="br-avatar-big">{playerAvatar}</span>
            <span className="br-nick">{playerNick}</span>
            <span className="br-level">Nv.{level}</span>
            <div className="br-xp-bar"><div className="br-xp-fill" style={{ width: `${(xp / XP_PER_LEVEL) * 100}%` }} /></div>
          </div>
          <div className="br-coins-hero">🪙 {brcoins.toLocaleString()} <span className="br-label">BRCoins</span></div>
        </div>
        <div className="br-menu-buttons">
          <button className="br-btn br-btn-play" onClick={quickPlay}>🎯 Jogar Agora</button>
          <div className="br-salas">
            {SALAS.map((s, i) => (
              <button key={i} className={`br-sala-btn ${brcoins < s.minBet ? "br-locked" : ""}`}
                onClick={() => startMatch(i)}>
                <span className="br-sala-icon">{s.icon}</span>
                <span className="br-sala-name">{s.name}</span>
                <span className="br-sala-bet">{s.minBet.toLocaleString()} 🪙</span>
              </button>
            ))}
          </div>
          <div className="br-menu-grid">
            <button className="br-menu-item" onClick={() => setScreen("ranking")}>🏆 Ranking</button>
            <button className="br-menu-item" onClick={() => setScreen("loja")}>🛒 Loja</button>
            <button className="br-menu-item" onClick={() => setScreen("amigos")}>👥 Amigos</button>
            <button className="br-menu-item" onClick={() => setScreen("clans")}>⚔️ Clãs</button>
            <button className="br-menu-item" onClick={() => { setScreen("perfil"); setShowInventory(false); }}>👤 Perfil</button>
            <button className="br-menu-item" onClick={() => { setScreen("inventario"); }}>🎒 Inventário</button>
          </div>
        </div>
        <div className="br-streak">{streak > 0 && `🔥 Streak: ${streak} vitórias`}</div>
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
      {/* Top HUD */}
      <div className="br-game-hud">
        <div className="br-hud-left">
          <span className="br-hud-avatar">{playerAvatar}</span>
          <div>
            <div className="br-hud-nick">{playerNick}</div>
            <div className="br-hud-score">{score.p}</div>
          </div>
        </div>
        <div className="br-hud-center">
          <div className="br-hud-bet">{bet} 🪙</div>
          <div className="br-hud-turn">{turn === "player" ? "🎯 Sua vez" : turn === "ai" ? "🤖 Oponente" : "⏳ Rolando..."}</div>
          {turn === "player" && <div className="br-hud-hint">Arraste para mirar • Solte para tacar</div>}
        </div>
        <div className="br-hud-right">
          <span className="br-hud-avatar">{oponent.avatar}</span>
          <div>
            <div className="br-hud-nick">{oponent.nick}</div>
            <div className="br-hud-score">{score.a}</div>
          </div>
        </div>
      </div>

      {/* Power gauge */}
      {turn === "player" && powerGauge > 0 && (
        <div className="br-power-bar">
          <div className="br-power-fill" style={{ width: `${powerGauge * 100}%`, background: powerGauge < 0.5 ? "#22cc66" : powerGauge < 0.8 ? "#ffaa00" : "#ff3344" }} />
        </div>
      )}

      {/* Emote/provoke overlay */}
      {emoteMsg && <div className="br-emote-popup">{emoteMsg}</div>}

      {/* Message */}
      <div className="br-game-msg">{message}</div>

      {/* Social bar */}
      <div className="br-social-bar">
        {EMOTES.slice(0, 6).map((e, i) => (
          <button key={i} className="br-emote-btn" onClick={() => { sendEmote(e); aiEmote(); }}>{e}</button>
        ))}
        <button className="br-emote-btn br-provoke-btn" onClick={() => { sendProvoke(); aiEmote(); }}>💬</button>
        <button className="br-emote-btn" onClick={() => setScreen("menu")}>🚪</button>
      </div>

      {/* Canvas */}
      <div className="br-canvas" ref={mountRef} />
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
          <div className="br-result-oponent">{oponent.avatar} {oponent.nick}</div>
          <div className="br-result-prize">{won ? `+${bet * 2}` : `-${bet}`} 🪙</div>
          {won && streak > 0 && <div className="br-result-streak">🔥 Streak: {streak}</div>}
          <div className="br-result-xp">+{won ? 30 : 10} XP</div>
          <button className="br-btn br-btn-play" onClick={() => startMatch(salaIdx)}>🔄 Revanche</button>
          <button className="br-btn br-btn-secondary" onClick={() => setScreen("menu")}>🏠 Menu</button>
        </div>
      </div>
    );
  }

  if (screen === "loja") return (
    <div className="br-root">
      <div className="br-bg-neon" />
      <div className="br-screen">
        {renderHeader("🛒 Loja")}
        <div className="br-shop-tabs">
          {["tacos", "skins", "passes"].map(t => (
            <button key={t} className={`br-shop-tab ${shopTab === t ? "active" : ""}`} onClick={() => setShopTab(t)}>
              {t === "tacos" ? "🏏 Tacos" : t === "skins" ? "🎨 Mesas" : "🎫 Passes"}
            </button>
          ))}
        </div>
        <div className="br-shop-grid">
          {shopItems[shopTab].map((item, i) => {
            const owned = inventory[shopTab === "passes" ? "passes" : shopTab]?.includes(item.id);
            const isEquipped = equipped[shopTab === "passes" ? "passes" : shopTab === "tacos" ? "taco" : "skin"] === item.id;
            return (
              <div key={i} className="br-shop-card" style={{ borderColor: item.rarity === "lendário" ? "#FFD700" : item.rarity === "épico" ? "#8844ff" : item.rarity === "raro" ? "#C0C0C0" : "#333" }}>
                <div className="br-shop-item" style={{ color: item.color || "#fff" }}>{item.id === "classico" ? "🏏" : item.id === "ouro" ? "🏆" : item.id === "neon" ? "💜" : item.id === "cristal" ? "💎" : item.id === "chamas" ? "🔥" : "🎱"}</div>
                <div className="br-shop-name">{item.name}</div>
                {item.rarity && <div className="br-shop-rarity">{item.rarity}</div>}
                <div className="br-shop-price">{item.price > 0 ? `${item.price.toLocaleString()} 🪙` : "Grátis"}</div>
                {owned ? (
                  isEquipped ? <span className="br-badge-equipped">✓ Equipado</span> :
                    <button className="br-btn-sm" onClick={() => equipItem(shopTab === "passes" ? "passes" : shopTab === "tacos" ? "taco" : "skin", item.id)}>Equipar</button>
                ) : (
                  <button className="br-btn-sm" disabled={brcoins < item.price || item.price === 0} onClick={() => buyItem(shopTab === "passes" ? "passes" : shopTab, item)}>
                    {item.price === 0 ? "Grátis" : "Comprar"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (screen === "perfil") return (
    <div className="br-root">
      <div className="br-bg-neon" />
      <div className="br-screen">
        {renderHeader("👤 Perfil")}
        <div className="br-profile-card">
          <div className="br-profile-avatar">{playerAvatar}</div>
          <div className="br-profile-name">{playerNick}</div>
          <div className="br-profile-level">Nível {level}</div>
          <div className="br-xp-bar big"><div className="br-xp-fill" style={{ width: `${(xp / XP_PER_LEVEL) * 100}%` }} /></div>
          <div className="br-profile-stats">
            <div className="br-stat"><span>Partidas</span><strong>{matches.length}</strong></div>
            <div className="br-stat"><span>Vitórias</span><strong>{matches.filter(m => m.result === "win").length}</strong></div>
            <div className="br-stat"><span>BRCoins</span><strong>{brcoins.toLocaleString()}</strong></div>
            <div className="br-stat"><span>Streak</span><strong>{streak}🔥</strong></div>
          </div>
          <div className="br-equipped-info">
            <p>🏏 Taco: {shopItems.tacos.find(t => t.id === equipped.taco)?.name || "Clássico"}</p>
            <p>🎨 Mesa: {shopItems.skins.find(s => s.id === equipped.skin)?.name || "Clássica"}</p>
          </div>
          <div className="br-hist-title">📋 Histórico</div>
          <div className="br-hist-list">
            {matches.slice(0, 10).map((m, i) => (
              <div key={i} className={`br-hist-item ${m.result === "win" ? "br-win" : "br-lose"}`}>
                <span>vs {m.oponent}</span>
                <span>{m.score}</span>
                <span>{m.result === "win" ? `+${m.prize}` : `-${m.bet}`} 🪙</span>
              </div>
            ))}
            {matches.length === 0 && <div className="br-empty">Nenhuma partida ainda</div>}
          </div>
        </div>
      </div>
    </div>
  );

  if (screen === "ranking") return (
    <div className="br-root">
      <div className="br-bg-neon" />
      <div className="br-screen">
        {renderHeader("🏆 Ranking Global")}
        <div className="br-ranking-list">
          {[...Array(10)].map((_, i) => (
            <div key={i} className={`br-rank-item ${i === 0 ? "br-gold" : i < 3 ? "br-top" : ""}`}>
              <span className="br-rank-pos">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
              <span className="br-rank-avatar">{i === 0 ? "👑" : i === 1 ? "🔥" : i === 2 ? "💎" : "🎱"}</span>
              <span className="br-rank-name">{i === 0 ? playerNick : NICKNAMES[i % NICKNAMES.length]}</span>
              <span className="br-rank-level">Nv.{Math.max(level, 15 - i)}</span>
              <span className="br-rank-coins">{(100000 - i * 8500).toLocaleString()} 🪙</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === "amigos") return (
    <div className="br-root">
      <div className="br-bg-neon" />
      <div className="br-screen">
        {renderHeader("👥 Amigos")}
        <div className="br-empty" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: ".5rem" }}>👥</div>
          <p style={{ color: "#888" }}>Convide amigos para jogar!</p>
          <p style={{ color: "#555", fontSize: ".7rem" }}>Compartilhe o link e desafie seus parças 🔥</p>
          <button className="br-btn br-btn-play" style={{ marginTop: "1rem" }}
            onClick={() => { navigator.clipboard?.writeText(window.location.href); setMessage("Link copiado! 📋"); }}>
            🔗 Convidar Amigos
          </button>
        </div>
      </div>
    </div>
  );

  if (screen === "clans") return (
    <div className="br-root">
      <div className="br-bg-neon" />
      <div className="br-screen">
        {renderHeader("⚔️ Clãs")}
        <div className="br-empty" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: ".5rem" }}>⚔️</div>
          <p style={{ color: "#888" }}>Clãs em breve!</p>
          <p style={{ color: "#555", fontSize: ".7rem" }}>Monte seu time e domine o ranking.</p>
        </div>
      </div>
    </div>
  );

  if (screen === "inventario") return (
    <div className="br-root">
      <div className="br-bg-neon" />
      <div className="br-screen">
        {renderHeader("🎒 Inventário")}
        <div className="br-shop-tabs">
          <button className={`br-shop-tab active`}>🏏 Tacos</button>
        </div>
        <div className="br-shop-grid">
          {shopItems.tacos.filter(t => inventory.tacos?.includes(t.id)).map((item, i) => (
            <div key={i} className="br-shop-card" style={{ borderColor: equipped.taco === item.id ? "#8844ff" : "#333" }}>
              <div className="br-shop-item" style={{ color: item.color }}>{item.id === "classico" ? "🏏" : item.id === "ouro" ? "🏆" : "💎"}</div>
              <div className="br-shop-name">{item.name}</div>
              <div className="br-shop-rarity">{item.rarity}</div>
              {equipped.taco === item.id ? <span className="br-badge-equipped">✓ Equipado</span> :
                <button className="br-btn-sm" onClick={() => equipItem("taco", item.id)}>Equipar</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}
