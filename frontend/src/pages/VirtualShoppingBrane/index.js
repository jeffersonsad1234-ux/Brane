import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import "./VirtualShoppingBrane.css";

// ─── NOISE ──────────────────────────────────────────────
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return (h ^ (h >> 16)) / 4294967296; }
function smooth(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const v00 = hash(ix, iy), v10 = hash(ix + 1, iy), v01 = hash(ix, iy + 1), v11 = hash(ix + 1, iy + 1);
  return (v00 + (v10 - v00) * sx) + ((v01 + (v11 - v01) * sx) - (v00 + (v10 - v00) * sx)) * sy;
}
function fbm(x, y, o = 4) {
  let v = 0, a = 1, f = 1, m = 0;
  for (let i = 0; i < o; i++) { v += smooth(x * f, y * f) * a; m += a; a *= 0.5; f *= 2; }
  return v / m;
}

const W = 120, BLOCK = 1.2;
const WORLD_H = 8;
const STORAGE = "sandbox_data";

function rng(min, max) { return min + Math.random() * (max - min); }

// ─── WORLD GEN ──────────────────────────────────────────
function generateWorld(scene) {
  const group = new THREE.Group();
  const seg = W / BLOCK;
  const geo = new THREE.BufferGeometry();
  const verts = [], colors = [], uvs = [], idxs = [];

  for (let iz = 0; iz < seg; iz++) {
    for (let ix = 0; ix < seg; ix++) {
      const x = ix * BLOCK - W / 2, z = iz * BLOCK - W / 2;
      const h = fbm(x * 0.02, z * 0.02) * WORLD_H - 2;
      const h2 = fbm(x * 0.02 + 50, z * 0.02 + 50) * WORLD_H - 2;
      const y0 = Math.floor(Math.min(h, h2));
      const y1 = Math.floor(Math.max(h, h2)) + 1;
      const isWater = y0 < 0.5 && y1 < 1;
      const topH = isWater ? 0.5 : y1;

      // Only render top surface for simplicity
      const base = verts.length / 3;
      verts.push(x - BLOCK / 2, topH, z - BLOCK / 2);
      verts.push(x + BLOCK / 2, topH, z - BLOCK / 2);
      verts.push(x + BLOCK / 2, topH, z + BLOCK / 2);
      verts.push(x - BLOCK / 2, topH, z + BLOCK / 2);

      const isDeep = topH < 0.8;
      const isGrass = topH > 1.5 && !isDeep;
      const isSand = topH <= 0.8 || (topH < 0.1);
      const isStone = topH > 3.5;
      const isSnow = topH > 5.5;

      let r, g, b;
      if (isSnow) { r = 0.95; g = 0.95; b = 1; }
      else if (isStone) { r = 0.4; g = 0.38; b = 0.35; }
      else if (isSand) { r = 0.85; g = 0.78; b = 0.55; }
      else if (isDeep) { r = 0.5; g = 0.35; b = 0.2; }
      else { r = 0.3 + fbm(x * 0.1 + 10, z * 0.1 + 10) * 0.3; g = 0.5 + fbm(x * 0.1, z * 0.1) * 0.3; b = 0.15; }

      for (let i = 0; i < 4; i++) { colors.push(r, g, b); uvs.push(i < 2 ? 0 : 1, i % 2 === 0 ? 0 : 1); }
      idxs.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(idxs);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.8, metalness: 0.05,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true; mesh.castShadow = true;
  group.add(mesh);

  // Water
  const wMat = new THREE.MeshStandardMaterial({
    color: 0x2288cc, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.3,
  });
  const wMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, W), wMat);
  wMesh.rotation.x = -Math.PI / 2;
  wMesh.position.y = 0.4;
  wMesh.receiveShadow = true;
  group.add(wMesh);

  // Trees
  const treeData = [];
  for (let i = 0; i < 180; i++) {
    const tx = rng(-W / 2 + 3, W / 2 - 3), tz = rng(-W / 2 + 3, W / 2 - 3);
    const th = fbm(tx * 0.02, tz * 0.02) * WORLD_H - 2;
    if (th > 1 && th < 5) {
      const trunkH = rng(1.2, 2.5);
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, trunkH, 5),
        new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 })
      );
      trunk.position.set(tx, th + trunkH / 2, tz);
      trunk.castShadow = true;
      group.add(trunk);
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(rng(0.6, 1.0), 6, 5),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(rng(0.25, 0.35), 0.7, 0.35 + rng(0, 0.15)) })
      );
      crown.position.set(tx + rng(-0.3, 0.3), th + trunkH + rng(0.1, 0.4), tz + rng(-0.3, 0.3));
      crown.scale.y = rng(0.8, 1.2);
      crown.castShadow = true;
      group.add(crown);
      treeData.push({ x: tx, z: tz, h: th + trunkH + 0.5 });

      // Also place some colored "fruit" blocks
      if (Math.random() > 0.7) {
        const fruit = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 4, 4),
          new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(rng(0, 0.1), 0.8, 0.5) })
        );
        fruit.position.set(tx + rng(-0.4, 0.4), th + trunkH + rng(0, 0.8), tz + rng(-0.4, 0.4));
        group.add(fruit);
      }
    }
  }

  // Rocks
  for (let i = 0; i < 80; i++) {
    const rx = rng(-W / 2 + 2, W / 2 - 2), rz = rng(-W / 2 + 2, W / 2 - 2);
    const rh = fbm(rx * 0.02, rz * 0.02) * WORLD_H - 2;
    if (rh > 0.5) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rng(0.2, 0.6), 0),
        new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9, flatShading: true })
      );
      rock.position.set(rx, rh + rng(0, 0.3), rz);
      rock.scale.set(1, rng(0.3, 0.6), 1);
      rock.rotation.set(rng(0, 6), rng(0, 6), rng(0, 6));
      rock.castShadow = true;
      group.add(rock);
    }
  }

  // Colored ore crystals
  const oreColors = [0xff4488, 0x44aaff, 0x44ff88, 0xffaa00, 0x8844ff];
  for (let i = 0; i < 50; i++) {
    const ox = rng(-W / 2 + 5, W / 2 - 5), oz = rng(-W / 2 + 5, W / 2 - 5);
    const oh = fbm(ox * 0.02, oz * 0.02) * WORLD_H - 2;
    if (oh > 0.5) {
      const col = oreColors[Math.floor(Math.random() * oreColors.length)];
      const ore = new THREE.Mesh(
        new THREE.OctahedronGeometry(rng(0.15, 0.35), 0),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.3, metalness: 0.6, emissive: col, emissiveIntensity: 0.15 })
      );
      ore.position.set(ox, oh + 0.1, oz);
      ore.castShadow = true;
      ore.userData = { isOre: true, color: col, hp: 3 };
      group.add(ore);
    }
  }

  // Flowers
  for (let i = 0; i < 120; i++) {
    const fx2 = rng(-W / 2 + 2, W / 2 - 2), fz2 = rng(-W / 2 + 2, W / 2 - 2);
    const fh2 = fbm(fx2 * 0.02, fz2 * 0.02) * WORLD_H - 2;
    if (fh2 > 0.5 && fh2 < 4) {
      const fCol = new THREE.Color().setHSL(rng(0.5, 1), 0.8, 0.5);
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 4, 4),
        new THREE.MeshStandardMaterial({ color: fCol })
      );
      flower.position.set(fx2, fh2 + 0.08, fz2);
      group.add(flower);
    }
  }

  scene.add(group);
  return { treeData, groundMesh: mesh, waterMesh: wMesh };
}

// ─── NPCs ───────────────────────────────────────────────
function createNPCs(scene, count) {
  const npcs = [];
  const names = ["Nina","Bia","Léo","Max","Luna","Teco","Kai","Aru","Jade","Pipoca","Neguinho","Jefinho","Binha","Zé","Tata"];
  const skinColors = [0xffcc88, 0xdbaa77, 0xc4956a, 0xffddbb, 0x8a6a4a];

  for (let i = 0; i < count; i++) {
    const g = new THREE.Group();
    const h = 1.2;
    // Body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, h, 0.3),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.15 + 0.5, 0.7, 0.5),
        flatShading: true,
      })
    );
    body.position.y = h / 2;
    body.castShadow = true;
    g.add(body);
    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: skinColors[i % skinColors.length], flatShading: true })
    );
    head.position.y = h + 0.15;
    g.add(head);
    // Eyes
    const eMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eMat);
    e1.position.set(-0.08, h + 0.18, -0.16);
    g.add(e1);
    const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eMat);
    e2.position.set(0.08, h + 0.18, -0.16);
    g.add(e2);
    // Hat (some have party hats)
    if (Math.random() > 0.5) {
      const hat = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.2, 4),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5) })
      );
      hat.position.y = h + 0.33;
      g.add(hat);
    }

    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 30;
    g.position.set(Math.cos(angle) * dist, 0.01, Math.sin(angle) * dist);
    g.rotation.y = Math.random() * 6;
    scene.add(g);

    npcs.push({
      group: g, body, head,
      x: g.position.x, z: g.position.z,
      targetX: g.position.x, targetZ: g.position.z,
      speed: 0.5 + Math.random() * 0.5,
      timer: 0,
      name: names[i % names.length],
      chatTimer: 0,
      chatMsg: "",
      mining: false,
    });
  }
  return npcs;
}

// ─── REACT COMPONENT ────────────────────────────────────
export default function VirtualShoppingBrane() {
  const mountRef = useRef(null);
  const [screen, setScreen] = useState("menu"); // menu | game | shop | inventory | dead
  const [health, setHealth] = useState(100);
  const [hunger, setHunger] = useState(100);
  const [coins, setCoins] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem(STORAGE)); return d?.coins || 0; }
    catch { return 0; }
  });
  const [level, setLevel] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem(STORAGE)); return d?.level || 1; }
    catch { return 1; }
  });
  const [xp, setXp] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem(STORAGE)); return d?.xp || 0; }
    catch { return 0; }
  });
  const [inventory, setInventory] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem(STORAGE)); return d?.inv || [
      { id: "dirt", name: "Terra", icon: "🟫", count: 10 },
      { id: "stone", name: "Pedra", icon: "🪨", count: 5 },
      { id: "wood", name: "Madeira", icon: "🪵", count: 3 },
    ]; }
    catch { return [{ id: "dirt", name: "Terra", icon: "🟫", count: 10 },{ id: "stone", name: "Pedra", icon: "🪨", count: 5 },{ id: "wood", name: "Madeira", icon: "🪵", count: 3 }]; }
  });
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [chat, setChat] = useState([]);
  const [time, setTime] = useState(0.3); // 0-1 day cycle
  const [skin, setSkin] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem(STORAGE)); return d?.skin || "default"; }
    catch { return "default"; }
  });
  const [message, setMessage] = useState("");
  const [showShop, setShowShop] = useState(false);
  const npcsRef = useRef([]);
  const sceneRef = useRef(null);
  const animRef = useRef(null);
  const keysRef = useRef({});
  const playerRef = useRef({ x: 0, y: 0.5, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0 });
  const cameraRef = useRef(null);
  const worldRef = useRef(null);
  const interactablesRef = useRef([]);
  const crosshairRef = useRef(null);
  const coinsRef = useRef(coins);
  const healthRef = useRef(health);
  const hungerRef = useRef(hunger);
  const inventoryRef = useRef(inventory);
  const xpRef = useRef(xp);
  const levelRef = useRef(level);

  coinsRef.current = coins;
  healthRef.current = health;
  hungerRef.current = hunger;
  inventoryRef.current = inventory;
  xpRef.current = xp;
  levelRef.current = level;

  const save = useCallback(() => {
    const d = { coins, level, xp, inv: inventory, skin };
    localStorage.setItem(STORAGE, JSON.stringify(d));
  }, [coins, level, xp, inventory, skin]);

  useEffect(() => { save(); }, [save]);

  const addCoins = useCallback((n) => setCoins(c => c + n), []);
  const addXp = useCallback((n) => {
    setXp(prev => { const t = prev + n; if (t >= 50) { setLevel(l => l + 1); return t - 50; } return t; });
  }, []);
  const addItem = useCallback((id, name, icon, count = 1) => {
    setInventory(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) { existing.count += count; return [...prev]; }
      return [...prev, { id, name, icon, count }];
    });
  }, []);

  // ─── THREE.JS INIT ───
  useEffect(() => {
    if (!mountRef.current || sceneRef.current) return;
    const mount = mountRef.current;
    const w = mount.clientWidth, h = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 40, 70);

    const camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 100);
    camera.position.set(0, 2, 5);
    cameraRef.current = camera;

    // Sun
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
    sun.position.set(30, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    scene.add(sun);

    const amb = new THREE.AmbientLight(0x6688cc, 0.4);
    scene.add(amb);

    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x3a2a1a, 0.3);
    scene.add(hemi);

    // Sky sphere
    const skyG = new THREE.SphereGeometry(80, 20, 20);
    const skyM = new THREE.MeshBasicMaterial({
      color: 0x87CEEB, side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyG, skyM);
    scene.add(sky);

    // Generate world
    const world = generateWorld(scene);
    worldRef.current = world;

    // NPCs
    const npcs = createNPCs(scene, 8);
    npcsRef.current = npcs;

    // Collect interactables (ores, rocks, etc.)
    scene.children.forEach(child => {
      if (child.type === "Group") {
        child.children.forEach(c => {
          if (c.userData?.isOre) interactablesRef.current.push(c);
        });
      }
    });

    // Crosshair
    const ch = document.createElement("div");
    ch.className = "sb-crosshair";
    ch.innerHTML = "+";
    mount.appendChild(ch);
    crosshairRef.current = ch;

    // Resize
    const onResize = () => {
      if (!mount) return;
      const mw = mount.clientWidth, mh = mount.clientHeight;
      camera.aspect = mw / mh;
      camera.updateProjectionMatrix();
      renderer.setSize(mw, mh);
    };
    window.addEventListener("resize", onResize);

    // Pointer lock
    const onCanvasClick = () => {
      if (screen === "game") {
        try { mount.requestPointerLock?.(); } catch {}
      }
    };
    const onPointerLockChange = () => {
      document.body.style.cursor = document.pointerLockElement ? "none" : "default";
    };
    document.addEventListener("pointerlockchange", onPointerLockChange);
    mount.addEventListener("click", onCanvasClick);

    // Mouse look
    const onMouseMove = (e) => {
      if (!document.pointerLockElement) return;
      const p = playerRef.current;
      p.yaw -= e.movementX * 0.003;
      p.pitch -= e.movementY * 0.003;
      p.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, p.pitch));
    };
    document.addEventListener("mousemove", onMouseMove);

    // Click to mine
    const onMouseDown = (e) => {
      if (e.button !== 0 || !document.pointerLockElement) return;
      // Raycast for interactables
      const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(playerRef.current.pitch, playerRef.current.yaw, 0, "YXZ"));
      const origin = camera.position.clone();
      const raycaster = new THREE.Raycaster(origin, dir, 0, 5);
      const objs = interactablesRef.current.filter(o => o.parent);
      const hits = raycaster.intersectObjects(objs);
      if (hits.length > 0) {
        const hit = hits[0].object;
        if (hit.userData?.isOre) {
          hit.userData.hp = (hit.userData.hp || 3) - 1;
          if (hit.userData.hp <= 0) {
            const color = hit.userData.color;
            hit.parent?.remove(hit);
            interactablesRef.current = interactablesRef.current.filter(o => o !== hit);
            addCoins(5 + Math.floor(Math.random() * 10));
            addXp(10);
            addItem(`gem_${color.toString(16)}`, "Gema", "💎", 1);
            setMessage(`+${5 + Math.floor(Math.random() * 10)} moedas! 💎`);
          } else {
            // Flash white
            hit.material.emissiveIntensity = 0.8;
            setTimeout(() => { if (hit.material) hit.material.emissiveIntensity = 0.15; }, 100);
            setMessage(`⛏️ ${hit.userData.hp} golpes restantes`);
          }
        }
      }
    };
    document.addEventListener("mousedown", onMouseDown);

    sceneRef.current = { scene, renderer, camera, sun, amb, sky, onResize, mount, playerPos: { x: 0, z: 0 } };

    // Game loop
    let lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const ts = time;
      setTime(t => (t + dt * 0.02) % 1);

      // Camera follow player
      const p = playerRef.current;
      camera.position.set(p.x, p.y + 1.6, p.z);
      const euler = new THREE.Euler(p.pitch, p.yaw, 0, "YXZ");
      camera.quaternion.setFromEuler(euler);

      // Movement
      const fwd = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
      const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
      const speed = (keysRef.current["ShiftLeft"] || keysRef.current["Shift"]) ? 5 : 2.5;
      const move = new THREE.Vector3();
      if (keysRef.current["KeyW"] || keysRef.current["ArrowUp"]) move.add(fwd);
      if (keysRef.current["KeyS"] || keysRef.current["ArrowDown"]) move.sub(fwd);
      if (keysRef.current["KeyA"] || keysRef.current["ArrowLeft"]) move.sub(right);
      if (keysRef.current["KeyD"] || keysRef.current["ArrowRight"]) move.add(right);
      if (move.length() > 0) { move.normalize().multiplyScalar(speed * dt); p.x += move.x; p.z += move.z; }

      // Gravity
      p.vy -= 12 * dt;
      p.y += p.vy * dt;
      // Ground collision
      const th = fbm(p.x * 0.02, p.z * 0.02) * WORLD_H - 2;
      const groundLevel = Math.floor(th) + 0.8;
      if (p.y < groundLevel) { p.y = groundLevel; p.vy = 0; }

      // Jump
      if ((keysRef.current["Space"]) && p.y <= groundLevel + 0.01 && p.vy <= 0) { p.vy = 4.5; }

      // Hunger/health drain
      if (Math.random() < dt * 0.02) {
        setHunger(h => Math.max(0, h - 0.5));
      }
      if (hunger <= 0) { setHealth(h => Math.max(0, h - dt * 2)); }

      // Move NPCs
      npcs.forEach(npc => {
        npc.timer -= dt;
        if (npc.timer <= 0) {
          npc.targetX = npc.x + rng(-8, 8);
          npc.targetZ = npc.z + rng(-8, 8);
          npc.timer = 2 + Math.random() * 4;
          npc.mining = Math.random() > 0.7;
        }
        const dx = npc.targetX - npc.x, dz = npc.targetZ - npc.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.3) {
          npc.x += (dx / dist) * npc.speed * dt;
          npc.z += (dz / dist) * npc.speed * dt;
          npc.group.position.x = npc.x;
          npc.group.position.z = npc.z;
          npc.group.rotation.y = Math.atan2(dx, dz);

          // Bob animation
          npc.body.position.y = 0.6 + Math.sin(now * 0.005) * 0.05;
        }
        // Chat messages
        npc.chatTimer -= dt;
        if (npc.chatTimer <= 0 && Math.random() < dt * 0.5) {
          const msgs = ["E aí! 🎮","Vamos construir!","Minha vez! ⛏️","Olha essa pedra!","Preciso de madeira","Que dia lindo! 🌞","Bora minerar!","Tô pegando nível","Esse jogo é top!","Vambora! 🔥"];
          npc.chatMsg = msgs[Math.floor(Math.random() * msgs.length)];
          npc.chatTimer = 5 + Math.random() * 10;
          setChat(prev => {
            const next = [...prev, { name: npc.name, msg: npc.chatMsg }];
            return next.slice(-20);
          });
        }
        // NPC mining animation
        if (npc.mining && dist < 0.5) {
          npc.head.rotation.x = Math.sin(now * 0.008) * 0.3;
        } else {
          npc.head.rotation.x *= 0.95;
        }
      });

      // Day/night sky
      const dayVal = (Math.sin(ts * Math.PI * 2) + 1) / 2;
      const skyColor = new THREE.Color().lerpColors(
        new THREE.Color(0x0a0a2e), new THREE.Color(0x87CEEB), dayVal
      );
      scene.background = skyColor;
      sky.material.color = skyColor;
      scene.fog.color = skyColor;

      sun.position.y = Math.sin(ts * Math.PI * 2) * 40;
      sun.position.z = Math.cos(ts * Math.PI * 2) * 40;
      sun.intensity = 0.3 + dayVal * 1.0;
      amb.intensity = 0.15 + dayVal * 0.35;

      renderer.render(scene, camera);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousedown", onMouseDown);
      mount.removeEventListener("click", onCanvasClick);
      if (crosshairRef.current) mount.removeChild(crosshairRef.current);
      renderer.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── KEYBOARD ───
  useEffect(() => {
    const onKeyDown = (e) => {
      keysRef.current[e.code] = true;
      if (e.code === "Digit1") setSelectedSlot(0);
      if (e.code === "Digit2") setSelectedSlot(1);
      if (e.code === "Digit3") setSelectedSlot(2);
      if (e.code === "Digit4") setSelectedSlot(3);
      if (e.code === "Digit5") setSelectedSlot(4);
      if (e.code === "KeyE") setShowShop(s => !s);
    };
    const onKeyUp = (e) => { keysRef.current[e.code] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, []);

  const startGame = useCallback(() => {
    setScreen("game");
    setTimeout(() => {
      if (mountRef.current) mountRef.current.requestPointerLock?.();
    }, 500);
  }, []);

  const shopItems = [
    { id: "pickaxe", name: "Picareta de Ferro", icon: "⛏️", price: 50, desc: "Mina 2x mais rápido" },
    { id: "torch", name: "Tocha", icon: "🔥", price: 10, desc: "Ilumina a noite" },
    { id: "health_pot", name: "Poção de Vida", icon: "❤️", price: 30, desc: "Cura 30 de vida" },
    { id: "cake", name: "Bolo", icon: "🍰", price: 15, desc: "Recupera 25 de fome" },
    { id: "skin_blue", name: "Skin Azul", icon: "🔵", price: 100, desc: "Mude sua cor" },
    { id: "skin_gold", name: "Skin Dourada", icon: "🌟", price: 200, desc: "Estilo premium" },
  ];

  return (
    <div className="sb-root" style={{ cursor: document.pointerLockElement ? "none" : "default" }}>
      {/* Menu screen */}
      {screen === "menu" && (
        <div className="sb-menu">
          <div className="sb-menu-bg" />
          <div className="sb-menu-content">
            <div className="sb-logo">
              <span className="sb-logo-icon">⛏️</span>
              <span className="sb-logo-text">BLOX</span>
              <span className="sb-logo-sub">SAND</span>
            </div>
            <p className="sb-menu-subtitle">Mundo aberto • Construção • Aventura</p>
            <div className="sb-menu-stats">
              <span>⭐ Nv.{level}</span>
              <span>🪙 {coins}</span>
              <span>🎮 {inventory.reduce((a, i) => a + i.count, 0)} itens</span>
            </div>
            <button className="sb-btn sb-btn-play" onClick={startGame}>▶ ENTRAR NO MUNDO</button>
            <div className="sb-menu-grid">
              <button className="sb-btn-secondary" onClick={() => setShowShop(true)}>🛒 Loja</button>
              <button className="sb-btn-secondary" onClick={() => {
                const d = JSON.parse(localStorage.getItem(STORAGE));
                if (d?.inv) setInventory(d.inv);
                if (d?.coins) setCoins(d.coins);
                setMessage("Progresso carregado!");
              }}>📂 Carregar</button>
            </div>
            <div className="sb-menu-info">
              <span>🌞 Clima dinâmico</span>
              <span>👥 {npcsRef.current.length} NPCs online</span>
              <span>🏗️ Mundo procedural</span>
            </div>
          </div>
        </div>
      )}

      {/* Game screen */}
      {screen === "game" && (
        <div className="sb-game">
          <div className="sb-canvas" ref={mountRef} />

          {/* HUD */}
          <div className="sb-hud">
            <div className="sb-hud-top">
              <div className="sb-hud-stats">
                <div className="sb-stat-bar"><span className="sb-stat-icon">❤️</span><div className="sb-stat-track"><div className="sb-stat-fill" style={{ width: `${health}%`, background: health > 50 ? "#22cc66" : health > 25 ? "#ffaa00" : "#ff3344" }} /></div></div>
                <div className="sb-stat-bar"><span className="sb-stat-icon">🍖</span><div className="sb-stat-track"><div className="sb-stat-fill" style={{ width: `${hunger}%`, background: "#cc8833" }} /></div></div>
                <span className="sb-coins">🪙 {coins}</span>
                <span className="sb-level">⭐ {level}</span>
              </div>
              <button className="sb-btn-icon" onClick={() => setShowShop(true)}>🛒</button>
            </div>

            {/* Hotbar */}
            <div className="sb-hotbar">
              {[...Array(5)].map((_, i) => {
                const item = inventory[i];
                return (
                  <div key={i} className={`sb-hotbar-slot ${selectedSlot === i ? "active" : ""}`}
                    onClick={() => setSelectedSlot(i)}>
                    {item ? <><span className="sb-hotbar-icon">{item.icon}</span><span className="sb-hotbar-count">{item.count}</span></> : null}
                  </div>
                );
              })}
            </div>

            {/* Chat */}
            <div className="sb-chat">
              {chat.slice(-5).map((c, i) => (
                <div key={i} className="sb-chat-msg"><strong>{c.name}:</strong> {c.msg}</div>
              ))}
            </div>

            {/* Message popup */}
            {message && <div className="sb-msg">{message}</div>}

            {/* Mobile controls */}
            <div className="sb-mobile-controls" id="sb-mobile">
              <div className="sb-move-area" onTouchStart={e => {
                const t = e.touches[0];
                const rect = e.target.getBoundingClientRect();
                const cx = t.clientX - rect.left, cy = t.clientY - rect.top;
                if (cx < rect.width / 2) { keysRef.current["KeyW"] = true; }
                if (cy > rect.height * 0.7) { keysRef.current["ShiftLeft"] = true; }
              }} onTouchEnd={() => { keysRef.current["KeyW"] = false; keysRef.current["ShiftLeft"] = false; }}>
                <div className="sb-joystick-area">
                  <span className="sb-jl">⬆️</span>
                </div>
              </div>
              <div className="sb-action-area">
                <button className="sb-action-btn" onTouchStart={() => keysRef.current["Space"] = true} onTouchEnd={() => keysRef.current["Space"] = false}>⬆️</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop modal */}
      {showShop && (
        <div className="sb-shop-overlay" onClick={() => setShowShop(false)}>
          <div className="sb-shop" onClick={e => e.stopPropagation()}>
            <div className="sb-shop-header">
              <h3>🛒 Loja</h3>
              <span className="sb-shop-coins">🪙 {coins}</span>
              <button className="sb-btn-icon" onClick={() => setShowShop(false)}>✕</button>
            </div>
            <div className="sb-shop-grid">
              {shopItems.map((item, i) => (
                <div key={i} className="sb-shop-item">
                  <span className="sb-si-icon">{item.icon}</span>
                  <span className="sb-si-name">{item.name}</span>
                  <span className="sb-si-desc">{item.desc}</span>
                  <span className="sb-si-price">🪙 {item.price}</span>
                  <button className="sb-btn-sm" disabled={coins < item.price}
                    onClick={() => {
                      if (coins < item.price) return;
                      setCoins(c => c - item.price);
                      if (item.id === "health_pot") setHealth(h => Math.min(100, h + 30));
                      if (item.id === "cake") setHunger(h => Math.min(100, h + 25));
                      if (item.id === "pickaxe") addItem("pickaxe", "Picareta de Ferro", "⛏️");
                      if (item.id === "torch") addItem("torch", "Tocha", "🔥");
                      if (item.id === "skin_blue" || item.id === "skin_gold") setSkin(item.id);
                      setMessage(`${item.name} comprado! ✅`);
                      setShowShop(false);
                    }}>
                    {item.id.includes("skin") ? (skin === item.id ? "✓ Equipado" : "Comprar") : "Comprar"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
