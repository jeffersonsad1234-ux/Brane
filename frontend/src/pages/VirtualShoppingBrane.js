import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import "../styles/virtualShopping.css";

// ── CONSTANTS ─────────────────────────────────────────
const WORLD = { size: 140, treeCount: 80, rockCount: 40 };

const BUILDINGS = [
  { x:-20,z:-18,w:6,h:5,d:5,color:0x4a4a52,story:2 },
  { x:-14,z:-20,w:5,h:4,d:4,color:0x52525a,story:2,broken:true },
  { x:-8,z:-16,w:4.5,h:3,d:4,color:0x484850,story:1 },
  { x:0,z:-22,w:8,h:6,d:5,color:0x4e4e56,story:2 },
  { x:8,z:-18,w:5,h:4,d:4.5,color:0x5a5a62,story:1 },
  { x:16,z:-20,w:4,h:3.5,d:3.5,color:0x4c4c54,story:1 },
  { x:-18,z:4,w:5.5,h:4.5,d:4,color:0x505058,story:2,broken:true },
  { x:-10,z:6,w:4,h:3,d:3.5,color:0x56565e,story:1 },
  { x:-2,z:3,w:6,h:5,d:5,color:0x484850,story:2 },
  { x:6,z:8,w:4.5,h:3.5,d:4,color:0x52525a,story:1,broken:true },
  { x:14,z:5,w:5,h:4,d:4.5,color:0x5e5e66,story:1 },
  { x:20,z:2,w:3.5,h:3,d:3,color:0x4a4a52,story:1 },
  { x:-22,z:18,w:4,h:3,d:3.5,color:0x54545c,story:1 },
  { x:-14,z:20,w:5.5,h:4.5,d:4,color:0x4e4e56,story:2 },
  { x:-6,z:16,w:4,h:3,d:3.5,color:0x585860,story:1,broken:true },
  { x:4,z:20,w:6,h:5,d:5,color:0x4c4c54,story:2 },
  { x:12,z:18,w:4.5,h:3.5,d:4,color:0x56565e,story:1 },
  { x:20,z:16,w:4,h:3,d:3.5,color:0x505058,story:1 },
];

const INTERACTIVES = [
  { name:"Kit Médico",emoji:"🩹",color:"#ff4444",desc:"Bandagens e antisséptico.",x:-12,z:-8 },
  { name:"Ração Militar",emoji:"🥫",color:"#cc8833",desc:"Alimento enlatado não perecível.",x:5,z:2 },
  { name:"Munição 9mm",emoji:"🔫",color:"#aaaacc",desc:"Caixa de munição calibre 9mm.",x:-4,z:-12 },
  { name:"Gasolina",emoji:"⛽",color:"#33cc33",desc:"Galão de gasolina 5L.",x:10,z:-4 },
  { name:"Faca Tática",emoji:"🔪",color:"#888888",desc:"Faca de combate tática.",x:-8,z:10 },
  { name:"Lampião",emoji:"💡",color:"#ffdd44",desc:"Lanterna de mão com pilhas.",x:2,z:14 },
];

// ── WORLD BUILDERS ──────────────────────────────────
function makeGround() {
  const geo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, 100, 100);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = Math.sin(x * 0.04 + z * 0.03) * 0.4 + Math.sin(x * 0.08 - z * 0.06) * 0.2 + Math.cos(x * 0.12 + z * 0.1) * 0.1;
    pos.setY(i, h);
    const g = 0.18 + 0.12 * Math.random() + Math.max(0, h * 0.05);
    const r = 0.15 + 0.08 * Math.random() + h * 0.03;
    const b = 0.1 + 0.05 * Math.random();
    colors[i * 3] = Math.min(1, r);
    colors[i * 3 + 1] = Math.min(1, g);
    colors[i * 3 + 2] = Math.min(1, b);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

function makeRoad(px, pz, w, d, angle) {
  const g = new THREE.PlaneGeometry(w, d, 4, 4);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, (Math.sin(x * 0.5 + z * 0.3) * 0.03 + Math.sin(x * 0.2 - z * 0.4) * 0.02));
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x2a2a34, roughness: 0.95, metalness: 0 }));
  m.position.set(px, 0.02, pz);
  m.rotation.y = angle;
  m.receiveShadow = true;
  return m;
}

function makeTree_(x, z, s) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.1 * s, 0.7 * s, 5),
    new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.9 }));
  trunk.position.y = 0.35 * s; trunk.castShadow = true; g.add(trunk);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.5 * s, 6, 5),
    new THREE.MeshStandardMaterial({ color: 0x1a3a0a + Math.floor(Math.random() * 0x002a00), roughness: 0.85 }));
  c1.position.y = 0.9 * s + Math.random() * 0.2; c1.castShadow = true; g.add(c1);
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.35 * s, 6, 5),
    new THREE.MeshStandardMaterial({ color: 0x1e3e0e + Math.floor(Math.random() * 0x002200), roughness: 0.85 }));
  c2.position.set(0.3 * s, 1.1 * s, 0.2 * s); c2.castShadow = true; g.add(c2);
  const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.3 * s, 6, 5),
    new THREE.MeshStandardMaterial({ color: 0x1a3a0a + Math.floor(Math.random() * 0x002a00), roughness: 0.85 }));
  c3.position.set(-0.25 * s, 1.0 * s, -0.2 * s); c3.castShadow = true; g.add(c3);
  g.position.set(x, 0, z);
  return g;
}

function makeBuilding_(p) {
  const g = new THREE.Group();
  const h = p.h * (p.story || 1);
  const body = new THREE.Mesh(new THREE.BoxGeometry(p.w, h, p.d),
    new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.85, metalness: 0.05 }));
  body.position.y = h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
  // Roof
  const rh = h * 0.2 + 0.3;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(p.w, p.d) * 0.55, rh, 4),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 }));
  roof.position.y = h + rh / 2; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
  // Windows
  const winMat = new THREE.MeshStandardMaterial({ color: 0x6688aa, emissive: 0x6688aa, emissiveIntensity: 0.03, transparent: true, opacity: 0.25 + Math.random() * 0.2 });
  const winCount = Math.floor(p.w * 2);
  for (let i = 0; i < winCount; i++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), winMat);
    w.position.set((i / (winCount - 1) - 0.5) * p.w * 0.65, h * 0.65, p.d / 2 + 0.01);
    g.add(w);
  }
  // Door hole
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.95 }));
  door.position.set(0, 0.35, p.d / 2 + 0.01); g.add(door);
  // Broken feature
  if (p.broken) {
    const rub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.9 }));
    rub.position.set((Math.random() - 0.5) * p.w * 0.5, 0.1, p.d / 2 + 0.3);
    rub.scale.set(1 + Math.random(), 0.3 + Math.random() * 0.5, 1 + Math.random());
    g.add(rub);
  }
  g.position.set(p.x, 0, p.z);
  return g;
}

function makeRock_(x, z, s) {
  const g = new THREE.DodecahedronGeometry(0.12 * s, 0);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x555555 + Math.floor(Math.random() * 0x333333), roughness: 0.9 }));
  m.position.set(x + (Math.random() - 0.5) * 0.2, 0.02 * s, z + (Math.random() - 0.5) * 0.2);
  m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  m.scale.y = 0.4 + Math.random() * 0.6; m.castShadow = true; m.receiveShadow = true;
  return m;
}

function makeBush(x, z, s) {
  const g = new THREE.Group();
  const c = 0x1a3a0a + Math.floor(Math.random() * 0x002a00);
  const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 });
  for (let i = 0; i < 4; i++) {
    const s2 = new THREE.SphereGeometry(0.12 * s * (0.5 + Math.random() * 0.5), 5, 4);
    const mesh = new THREE.Mesh(s2, m);
    mesh.position.set((Math.random() - 0.5) * 0.3 * s, 0.08 * s, (Math.random() - 0.5) * 0.3 * s);
    mesh.castShadow = true; g.add(mesh);
  }
  g.position.set(x, 0.02, z);
  return g;
}

function makeCar(x, z, angle) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x441111, roughness: 0.6, metalness: 0.3 }));
  body.position.y = 0.2; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.4, metalness: 0.5 }));
  cabin.position.set(0, 0.4, -0.15); g.add(cabin);
  for (let side of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    w.position.set(side * 0.35, 0.1, 0.5); w.rotation.y = Math.PI / 2; g.add(w);
    const w2 = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
    w2.position.set(side * 0.35, 0.1, -0.5); w2.rotation.y = Math.PI / 2; g.add(w2);
  }
  g.position.set(x, 0.05, z); g.rotation.y = angle;
  return g;
}

function makeCharacter_() {
  const g = new THREE.Group();
  const skin = 0xc49a6c, pants = 0x3a3a4a, shirt = 0x4a5a3a, boots = 0x2a2a1a, bag = 0x5a4a3a;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), new THREE.MeshStandardMaterial({ color: skin, roughness: 0.5 }));
  head.position.y = 1.55; head.castShadow = true; g.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2.5),
    new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9 }));
  hair.position.y = 1.63; g.add(hair);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.28), new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.7 }));
  torso.position.y = 1.15; torso.castShadow = true; g.add(torso);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.08, 6), new THREE.MeshStandardMaterial({ color: skin, roughness: 0.6 }));
  neck.position.y = 1.38; g.add(neck);

  // Backpack
  const bp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.18), new THREE.MeshStandardMaterial({ color: bag, roughness: 0.85 }));
  bp.position.set(0, 1.15, -0.22); g.add(bp);

  for (let s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.45, 6), new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.7 }));
    arm.position.set(s * 0.32, 1.2, 0); arm.rotation.z = s * 0.15; arm.castShadow = true; g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), new THREE.MeshStandardMaterial({ color: skin, roughness: 0.6 }));
    hand.position.set(s * 0.34, 0.97, 0); g.add(hand);
  }

  for (let s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.55, 6), new THREE.MeshStandardMaterial({ color: pants, roughness: 0.8 }));
    leg.position.set(s * 0.13, 0.55, 0); leg.castShadow = true; g.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.14), new THREE.MeshStandardMaterial({ color: boots, roughness: 0.9 }));
    foot.position.set(s * 0.13, 0.025, 0.03); g.add(foot);
  }

  return g;
}

// ── LOADING ──────────────────────────────────────────
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
        <div className="vsb-loading-bar"><div className="vsb-loading-fill" style={{width:`${p}%`}}/></div>
        <p className="vsb-loading-pct">{Math.floor(p)}%</p>
        {ready && <button className="vsb-loading-go" onClick={onStart}>▶ ENTRAR</button>}
      </div>
    </div>
  );
}

// ── ITEM MODAL ────────────────────────────────────────
function ItemModal({ item, onClose, onTake }) {
  return (
    <div className="vsb-modal-overlay" onClick={onClose}>
      <div className="vsb-modal-card" onClick={e => e.stopPropagation()}>
        <button className="vsb-modal-x" onClick={onClose}>✕</button>
        <div className="vsb-modal-img" style={{background:`radial-gradient(circle,${item.color}22,transparent)`}}>
          <span className="vsb-modal-img-emoji">{item.emoji}</span>
        </div>
        <div className="vsb-modal-info">
          <h2>{item.name}</h2>
          <p>{item.desc}</p>
          <button className="vsb-modal-take" onClick={()=>{onTake(item);onClose();}}>Pegar item</button>
        </div>
      </div>
    </div>
  );
}

function Notif({ msg, onHide }) {
  useEffect(()=>{const t=setTimeout(onHide,3000);return ()=>clearTimeout(t);},[msg,onHide]);
  return <div className="vsb-notif" onClick={onHide}>{msg}</div>;
}

// ── MAIN ──────────────────────────────────────────────
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

  // ── THREE.JS ──
  useEffect(() => {
    if (phase !== "world") return;
    const el = container.current;
    if (!el) return;
    let dead = false;

    try {
      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x141420);
      scene.fog = new THREE.FogExp2(0x141420, 0.006);

      // Camera
      const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 120);

      // Post-processing
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloom = new UnrealBloomPass(
        new THREE.Vector2(el.clientWidth, el.clientHeight),
        0.3, 0.5, 0.85
      );
      composer.addPass(bloom);
      composer.addPass(new OutputPass());

      // ── Lighting ──
      const ambient = new THREE.AmbientLight(0x335577, 0.15);
      scene.add(ambient);
      const hemi = new THREE.HemisphereLight(0x6688aa, 0x332211, 0.3);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffcc88, 1.1);
      sun.position.set(25, 35, 15);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 60;
      sun.shadow.camera.left = -35;
      sun.shadow.camera.right = 35;
      sun.shadow.camera.top = 35;
      sun.shadow.camera.bottom = -35;
      sun.shadow.bias = -0.001;
      scene.add(sun);

      const rim = new THREE.DirectionalLight(0x8888ff, 0.2);
      rim.position.set(-20, 15, -30);
      scene.add(rim);

      // ── Ground ──
      const ground = makeGround();
      scene.add(ground);

      // ── Roads ──
      const roads = [
        makeRoad(0, -10, 2, 18, 0), makeRoad(0, 12, 2, 12, 0),
        makeRoad(-14, 0, 12, 2, 0), makeRoad(12, 0, 10, 2, 0),
        makeRoad(-10, 8, 2, 10, Math.PI / 3), makeRoad(8, -6, 2, 10, -Math.PI / 4),
      ];
      roads.forEach(r => scene.add(r));

      // ── Buildings ──
      BUILDINGS.forEach(b => scene.add(makeBuilding_(b)));

      // ── Trees ──
      const treePositions = [];
      for (let i = 0; i < WORLD.treeCount; i++) {
        let x, z, ok;
        let att = 0;
        do {
          x = (Math.random() - 0.5) * WORLD.size * 0.7;
          z = (Math.random() - 0.5) * WORLD.size * 0.7;
          ok = !BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 3) && !treePositions.some(t => Math.hypot(x - t.x, z - t.z) < 2);
          att++;
        } while (!ok && att < 20);
        if (ok) { scene.add(makeTree_(x, z, 0.5 + Math.random() * 0.7)); treePositions.push({ x, z }); }
      }

      // ── Bushes ──
      for (let i = 0; i < 60; i++) {
        const x = (Math.random() - 0.5) * WORLD.size * 0.65;
        const z = (Math.random() - 0.5) * WORLD.size * 0.65;
        if (!BUILDINGS.some(b => Math.hypot(x - b.x, z - b.z) < 2)) scene.add(makeBush(x, z, 0.4 + Math.random() * 0.6));
      }

      // ── Rocks ──
      for (let i = 0; i < WORLD.rockCount; i++) {
        const x = (Math.random() - 0.5) * WORLD.size * 0.7;
        const z = (Math.random() - 0.5) * WORLD.size * 0.7;
        scene.add(makeRock_(x, z, 0.3 + Math.random()));
      }

      // ── Cars ──
      const cars = [
        makeCar(-8, -4, 0.2), makeCar(6, 5, -0.8), makeCar(-15, 12, 1.5), makeCar(10, -8, -0.3),
      ];
      cars.forEach(c => scene.add(c));

      // ── Character ──
      const character = makeCharacter_();
      scene.add(character);

      // ── Interactives ──
      const interactiveMeshes = [];
      INTERACTIVES.forEach((item, idx) => {
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 6, 6),
          new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.2 })
        );
        glow.position.set(item.x, 0.15, item.z);
        scene.add(glow);
        interactiveMeshes.push({ mesh: glow, item, collected: false });
      });

      // ── Rain ──
      const rc = 2000;
      const rGeo = new THREE.BufferGeometry();
      const rPos = new Float32Array(rc * 3);
      const rVel = new Float32Array(rc);
      for (let i = 0; i < rc; i++) {
        rPos[i * 3] = (Math.random() - 0.5) * 80;
        rPos[i * 3 + 1] = Math.random() * 20;
        rPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        rVel[i] = 4 + Math.random() * 3;
      }
      rGeo.setAttribute("position", new THREE.BufferAttribute(rPos, 3));
      const rMat = new THREE.PointsMaterial({ color: 0x88bbff, size: 0.035, transparent: true, opacity: 0.15, depthWrite: false });
      const rain = new THREE.Points(rGeo, rMat);
      scene.add(rain);

      // ── Atmosphere particles ──
      const pc = 500;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pc * 3);
      for (let i = 0; i < pc * 3; i++) pPos[i] = (Math.random() - 0.5) * 60;
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0xaabbcc, size: 0.03, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false });
      const particles = new THREE.Points(pGeo, pMat);
      particles.position.y = 3;
      scene.add(particles);

      // ── Audio ──
      let audioCtx, audioSource, audioGain;
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufSize = audioCtx.sampleRate * 2;
        const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        audioSource = audioCtx.createBufferSource();
        audioSource.buffer = buffer;
        audioSource.loop = true;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 150;
        audioGain = audioCtx.createGain();
        audioGain.gain.value = 0.06;
        audioSource.connect(filter);
        filter.connect(audioGain);
        audioGain.connect(audioCtx.destination);
        audioSource.start();
      } catch (e) { /* audio not available */ }

      // ── Controls ──
      const onKey = (e, down) => {
        keys.current[e.key.toLowerCase()] = down;
        if (e.key.toLowerCase() === "i" && down && view === "world") setView("inventory");
      };
      document.addEventListener("keydown", (e) => onKey(e, true));
      document.addEventListener("keyup", (e) => onKey(e, false));

      // Mouse look
      const onMouse = (e) => {
        if (document.pointerLockElement === renderer.domElement) {
          mouseX.current += e.movementX * 0.002;
          mouseY.current = Math.max(-1, Math.min(1, mouseY.current - e.movementY * 0.002));
        }
      };
      renderer.domElement.addEventListener("click", () => renderer.domElement.requestPointerLock());
      document.addEventListener("mousemove", onMouse);

      // Resize
      const onResize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        composer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      // ── Game Loop ──
      const clock = new THREE.Clock();
      const animate = () => {
        if (dead) return;
        const delta = Math.min(clock.getDelta(), 0.05);
        const t = clock.getElapsedTime();
        const k = keys.current;

        // Movement
        const fwd = k["w"]||k["arrowup"], bwd = k["s"]||k["arrowdown"];
        const lft = k["a"]||k["arrowleft"], rgt = k["d"]||k["arrowright"];
        const run = k["shift"];
        const speed = run ? 3.5 : 1.8;
        let mx = 0, mz = 0;
        if (fwd) mz -= 1;
        if (bwd) mz += 1;
        if (lft) mx -= 1;
        if (rgt) mx += 1;

        const moving = mx !== 0 || mz !== 0;
        if (moving) {
          const len = Math.hypot(mx, mz);
          mx /= len; mz /= len;
          const ta = Math.atan2(mx, mz);
          let diff = ta - charRot.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          charRot.current += diff * delta * 10;
          charPos.current.x += Math.sin(charRot.current) * speed * delta;
          charPos.current.z += Math.cos(charRot.current) * speed * delta;
          walkT.current += delta * (run ? 2.0 : 1.2);
          shakeAmt.current = run ? 0.015 : 0.005;
        } else {
          shakeAmt.current *= 0.95;
        }

        // Position character
        character.position.copy(charPos.current);
        character.rotation.y = charRot.current;

        // Walk animation
        if (moving) {
          const b = Math.sin(walkT.current * 7) * 0.02;
          character.position.y = b;
          const swing = Math.sin(walkT.current * 7) * 0.3;
          const legSwing = Math.sin(walkT.current * 7) * 0.25;
          const children = character.children;
          if (children.length >= 6) {
            children[4].rotation.x = legSwing;  // left leg index
            children[5].rotation.x = -legSwing; // right leg
            children[2].rotation.x = -swing;    // left arm
            children[3].rotation.x = swing;     // right arm
          }
        } else {
          const children = character.children;
          if (children.length >= 6) {
            children[4].rotation.x *= 0.9; children[5].rotation.x *= 0.9;
            children[2].rotation.x *= 0.9; children[3].rotation.x *= 0.9;
          }
        }

        // Interactivity - glow pulse & proximity
        interactiveMeshes.forEach((obj) => {
          if (obj.collected) return;
          obj.mesh.material.opacity = 0.15 + Math.sin(t * 2 + obj.item.x) * 0.08;
          const dist = Math.hypot(charPos.current.x - obj.item.x, charPos.current.z - obj.item.z);
          if (dist < 1.5 && k["e"]) {
            obj.collected = true;
            scene.remove(obj.mesh);
            setFoundItem(obj.item);
          }
        });

        // Camera — true 360° third-person orbit via pointer lock
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

        // FOV
        targetFov.current = run ? 60 : 50;
        camera.fov += (targetFov.current - camera.fov) * delta * 3;
        camera.updateProjectionMatrix();

        // Fixed midday lighting — no day/night cycle
        sun.intensity = 1.25;
        ambient.intensity = 0.25;
        hemi.intensity = 0.35;
        const sky = new THREE.Color(0x88aacc);
        scene.background.copy(sky);
        scene.fog.color.copy(sky);
        scene.fog.density = 0.004;
        bloom.strength = 0.15;
        rain.visible = false;

        // Rain update
        const rp = rain.geometry.attributes.position.array;
        for (let i = 0; i < rc; i++) {
          rp[i * 3 + 1] -= rVel[i] * delta;
          rp[i * 3] += Math.sin(t + i) * 0.5 * delta;
          if (rp[i * 3 + 1] < -1) {
            rp[i * 3 + 1] = 12 + Math.random() * 8;
            rp[i * 3] = (Math.random() - 0.5) * 70;
            rp[i * 3 + 2] = (Math.random() - 0.5) * 70;
          }
        }
        rain.geometry.attributes.position.needsUpdate = true;

        // Particles
        particles.rotation.y += delta * 0.015;

        // HUD update
        if (run && moving) setHud(h => ({ ...h, stamina: Math.max(0, h.stamina - 8 * delta) }));
        else if (!moving) setHud(h => ({ ...h, stamina: Math.min(100, h.stamina + 6 * delta) }));
        setHud(h => ({ ...h, hunger: Math.max(0, h.hunger - delta * 0.3), thirst: Math.max(0, h.thirst - delta * 0.4) }));

        // Render
        composer.render();
        animRef.current = requestAnimationFrame(animate);
      };

      const animRef = { current: requestAnimationFrame(animate) };

      return () => {
        dead = true;
        cancelAnimationFrame(animRef.current);
        if (audioSource) try { audioSource.stop(); } catch (e) {}
        if (audioCtx) try { audioCtx.close(); } catch (e) {}
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("mousemove", onMouse);
        if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
        window.removeEventListener("resize", onResize);
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer.dispose();
      };
    } catch (err) {
      console.error("[VSB Error]", err);
    }
  }, [phase]);

  if (phase === "loading") return <Loading p={loadP} onStart={() => setPhase("world")} />;

  // ── INVENTORY ──
  if (view === "inventory") {
    return (
      <div className="vsb-inventory">
        <div className="vsb-inv-top">
          <h2>🎒 INVENTÁRIO</h2>
          <button className="vsb-back-btn" onClick={() => setView("world")}>Fechar</button>
        </div>
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

  // ── WORLD ──
  return (
    <div className="vsb-world">
      <div ref={container} className="vsb-canvas" />
      <div className="vsb-letterbox-t" />
      <div className="vsb-letterbox-b" />
      <div className="vsb-vignette" />
      <div className="vsb-hud">
        <div className="vsb-hud-bars">
          <div className="vsb-hud-bar"><span>❤️</span><div className="vsb-hud-track"><div className="vsb-hud-fill health" style={{width:`${hud.health}%`}}/></div></div>
          <div className="vsb-hud-bar"><span>⚡</span><div className="vsb-hud-track"><div className="vsb-hud-fill stamina" style={{width:`${hud.stamina}%`}}/></div></div>
          <div className="vsb-hud-bar"><span>🍞</span><div className="vsb-hud-track"><div className="vsb-hud-fill hunger" style={{width:`${hud.hunger}%`}}/></div></div>
          <div className="vsb-hud-bar"><span>💧</span><div className="vsb-hud-track"><div className="vsb-hud-fill thirst" style={{width:`${hud.thirst}%`}}/></div></div>
        </div>
        <div className="vsb-hud-controls">
          <span>WASD andar</span><span>Shift correr</span><span>I inventário</span><span>Mouse olhar</span><span>E pegar</span>
        </div>
        <div className="vsb-hud-location">ZONA ABANDONADA — SETOR 7</div>
        <button className="vsb-hud-inv" onClick={() => setView("inventory")}>
          🎒<span className="vsb-hud-count">{inv.length}</span>
        </button>
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
