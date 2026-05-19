import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import "../styles/virtualShopping.css";

// ── WORLD DATA ────────────────────────────────────────
const WORLD = {
  size: 120,
  treeCount: 50,
  buildingCount: 6,
  rockCount: 20,
  fencePostCount: 30,
};

const BUILDING_PLANS = [
  { x: -12, z: -10, w: 3.5, h: 2.8, d: 3, color: 0x5a5a5a, name: "Mercado" },
  { x: 8, z: -14, w: 4, h: 2.5, d: 3.2, color: 0x4a4a4a, name: "Farmácia" },
  { x: 0, z: 12, w: 5, h: 3, d: 4, color: 0x555555, name: "Escola" },
  { x: -15, z: 8, w: 3, h: 2.2, d: 3, color: 0x606060, name: "Casa" },
  { x: 14, z: 6, w: 3.2, h: 2.4, d: 3, color: 0x585858, name: "Garagem" },
  { x: -5, z: -18, w: 4.5, h: 3.5, d: 4, color: 0x4e4e4e, name: "Hospital" },
];

// ── THREE.JS HELPERS ──────────────────────────────────
function makeTree(x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.8 * scale, 6),
    new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 })
  );
  trunk.position.y = 0.4 * scale;
  trunk.castShadow = true;
  g.add(trunk);
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.6 * scale, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0x2d5a1e + Math.floor(Math.random() * 0x002200), roughness: 0.8 })
  );
  canopy.position.y = 1.1 * scale + Math.random() * 0.2;
  canopy.castShadow = true;
  g.add(canopy);
  g.position.set(x, 0, z);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}

function makeBuilding(plan) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(plan.w, plan.h, plan.d),
    new THREE.MeshStandardMaterial({ color: plan.color, roughness: 0.85, metalness: 0.05 })
  );
  body.position.y = plan.h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  // Roof
  const roofH = plan.h * 0.3;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(plan.w, plan.d) * 0.65, roofH, 4),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 })
  );
  roof.position.y = plan.h + roofH / 2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
  // Windows (small emissive squares)
  for (let i = 0; i < 3; i++) {
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.45),
      new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        emissive: 0x88ccff,
        emissiveIntensity: 0.05,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.2,
      })
    );
    win.position.set(
      (Math.random() - 0.5) * plan.w * 0.6,
      plan.h * 0.6,
      plan.d / 2 + 0.01
    );
    g.add(win);
  }
  // Door
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 })
  );
  door.position.set(0, 0.4, plan.d / 2 + 0.01);
  g.add(door);
  g.position.set(plan.x, 0, plan.z);
  return g;
}

function makeRock(x, z, s = 1) {
  const geo = new THREE.DodecahedronGeometry(0.15 * s, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x666666 + Math.floor(Math.random() * 0x222222), roughness: 0.9 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x + (Math.random() - 0.5) * 0.3, 0.05 * s, z + (Math.random() - 0.5) * 0.3);
  m.rotation.set(Math.random(), Math.random(), Math.random());
  m.scale.y = 0.5 + Math.random() * 0.5;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function makeFence(x, z, angle, count = 5) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.6, 5),
      new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 })
    );
    post.position.set(i * 0.5, 0.3, 0);
    post.castShadow = true;
    g.add(post);
    if (i < count - 1) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.04, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.9 })
      );
      rail.position.set(i * 0.5 + 0.25, 0.4, 0);
      g.add(rail);
    }
  }
  g.position.set(x, 0, z);
  g.rotation.y = angle;
  return g;
}

function makeBarrel(x, z) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.17, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: 0.9 })
  );
  m.position.set(x, 0.15, z);
  m.castShadow = true;
  return m;
}

function makeCrate(x, z) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 })
  );
  m.position.set(x + (Math.random() - 0.5) * 0.2, 0.15, z + (Math.random() - 0.5) * 0.2);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function makeCampfire(x, z) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 0.08, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 1 })
  );
  base.position.y = 0.04;
  g.add(base);
  for (let i = 0; i < 6; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.2, 4),
      new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 })
    );
    log.position.set(Math.cos(i * 1.047) * 0.08, 0.04, Math.sin(i * 1.047) * 0.08);
    log.rotation.z = Math.random() * 0.3;
    log.rotation.x = Math.random() * 0.3;
    g.add(log);
  }
  g.position.set(x, 0, z);
  return g;
}

function makeMotorcycle(x, z) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.25, 1.2),
    new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.3, metalness: 0.4 })
  );
  body.position.y = 0.3;
  body.castShadow = true;
  g.add(body);
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.08, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 })
  );
  seat.position.set(0, 0.45, -0.15);
  g.add(seat);
  const tank = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.15, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.3, metalness: 0.5 })
  );
  tank.position.set(0, 0.4, 0.2);
  g.add(tank);
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 })
  );
  handle.position.set(0, 0.55, 0.45);
  handle.rotation.x = Math.PI / 3;
  g.add(handle);
  // Wheels
  const wheelGeo = new THREE.TorusGeometry(0.2, 0.05, 6, 8);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const fw = new THREE.Mesh(wheelGeo, wheelMat);
  fw.position.set(0, 0.18, 0.5);
  fw.rotation.y = Math.PI / 2;
  g.add(fw);
  const rw = new THREE.Mesh(wheelGeo, wheelMat);
  rw.position.set(0, 0.18, -0.5);
  rw.rotation.y = Math.PI / 2;
  g.add(rw);
  g.position.set(x, 0.1, z);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}

function makeCharacter() {
  const g = new THREE.Group();
  const skinColor = 0xd4a574;
  const pantsColor = 0x3a3a4a;
  const shirtColor = 0x4a5a3a;
  const bootColor = 0x2a2a2a;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 }));
  head.position.y = 1.55;
  head.castShadow = true;
  g.add(head);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.28), new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 }));
  torso.position.y = 1.15;
  torso.castShadow = true;
  g.add(torso);

  const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 6), new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 }));
  lArm.position.set(-0.32, 1.2, 0);
  lArm.rotation.z = 0.2;
  lArm.castShadow = true;
  g.add(lArm);

  const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.45, 6), new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 }));
  rArm.position.set(0.32, 1.2, 0);
  rArm.rotation.z = -0.2;
  rArm.castShadow = true;
  g.add(rArm);

  const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.55, 6), new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 }));
  lLeg.position.set(-0.13, 0.55, 0);
  lLeg.castShadow = true;
  g.add(lLeg);

  const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.55, 6), new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 }));
  rLeg.position.set(0.13, 0.55, 0);
  rLeg.castShadow = true;
  g.add(rLeg);

  const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.15), new THREE.MeshStandardMaterial({ color: bootColor, roughness: 0.9 }));
  lFoot.position.set(-0.13, 0.03, 0.04);
  g.add(lFoot);

  const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.15), new THREE.MeshStandardMaterial({ color: bootColor, roughness: 0.9 }));
  rFoot.position.set(0.13, 0.03, 0.04);
  g.add(rFoot);

  return g;
}

// ── LOADING SCREEN ────────────────────────────────────
function LoadingScreen({ progress, onStart }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => setReady(true), 400);
      return () => clearTimeout(t);
    }
  }, [progress]);
  return (
    <div className="vsb-loading-screen">
      <div className="vsb-loading-bg" />
      <div className="vsb-loading-content">
        <div className="vsb-loading-icon">☢️</div>
        <h1 className="vsb-loading-title">MUNDO ABERTO</h1>
        <p className="vsb-loading-sub">Sobrevivência Cinematográfica</p>
        <div className="vsb-loading-bar-track">
          <div className="vsb-loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="vsb-loading-pct">{Math.floor(progress)}%</p>
        {ready && (
          <button className="vsb-loading-start" onClick={onStart}>
            ENTRAR NO MUNDO
          </button>
        )}
      </div>
    </div>
  );
}

// ── PRODUCT MODAL ──────────────────────────────────────
function ItemModal({ item, onClose, onTake }) {
  return (
    <div className="vsb-modal-wrap" onClick={onClose}>
      <div className="vsb-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="vsb-modal-x" onClick={onClose}>✕</button>
        <div className="vsb-modal-visual" style={{ background: `radial-gradient(circle,${item.color || '#888'}22,transparent)` }}>
          <span className="vsb-modal-emoji">{item.emoji}</span>
        </div>
        <div className="vsb-modal-body">
          <h2 className="vsb-modal-name">{item.name}</h2>
          <p className="vsb-modal-desc" style={{ color: '#aaa', fontSize: '0.75rem', marginBottom: '0.8rem' }}>
            {item.desc || "Item de sobrevivência encontrado no mundo."}
          </p>
          <button className="vsb-modal-buy" onClick={() => { onTake(item); onClose(); }}>
            Pegar item
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NOTIFICATION ──────────────────────────────────────
function Notif({ msg, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 3000); return () => clearTimeout(t); }, [msg, onHide]);
  return <div className="vsb-notif" onClick={onHide}>{msg}</div>;
}

// ── MAIN ──────────────────────────────────────────────
export default function VirtualShoppingBrane() {
  const [phase, setPhase] = useState("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [view, setView] = useState("world"); // world | inventory
  const [hud, setHud] = useState({ health: 85, stamina: 100, hunger: 60, thirst: 45 });
  const [inventory, setInventory] = useState([]);
  const [foundItem, setFoundItem] = useState(null);
  const [notif, setNotif] = useState("");
  const [time, setTime] = useState(14); // hour 0-24

  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef({ forward: false, backward: false, left: false, right: false, running: false });
  const charRef = useRef(null);
  const camPos = useRef(new THREE.Vector3(0, 2, 4));
  const camTarget = useRef(new THREE.Vector3(0, 0, 0));
  const charPos = useRef(new THREE.Vector3(0, 0, 0));
  const charRot = useRef(0);
  const walkTime = useRef(0);
  const keysRef = useRef({});

  const notify = useCallback((m) => setNotif(m), []);

  // ── LOADING SIMULATION ──
  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += 2 + Math.random() * 5;
      if (p > 100) p = 100;
      setLoadProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // ── THREE.JS SCENE ──
  useEffect(() => {
    if (phase !== "world") return;
    const container = containerRef.current;
    if (!container) return;

    let destroyed = false;

    try {
      // ── Renderer ──
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);

      // ── Scene ──
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);
      sceneRef.current = scene;

      const clock = new THREE.Clock();

      // ── Camera ──
      const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(0, 2.5, 5);

      // ── Lighting ──
      const ambient = new THREE.AmbientLight(0x446688, 0.25);
      scene.add(ambient);

      const hemi = new THREE.HemisphereLight(0x88aacc, 0x443322, 0.4);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffdd99, 1.0);
      sun.position.set(30, 40, 20);
      sun.castShadow = true;
      sun.shadow.mapSize.width = 1024;
      sun.shadow.mapSize.height = 1024;
      sun.shadow.camera.near = 0.5;
      sun.shadow.camera.far = 60;
      sun.shadow.camera.left = -30;
      sun.shadow.camera.right = 30;
      sun.shadow.camera.top = 30;
      sun.shadow.camera.bottom = -30;
      scene.add(sun);

      const fill = new THREE.DirectionalLight(0x8888ff, 0.15);
      fill.position.set(-20, 10, -20);
      scene.add(fill);

      // ── Ground ──
      const groundGeo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, 1, 1);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x3a5a2a,
        roughness: 0.9,
        metalness: 0.0,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Grass patches
      for (let i = 0; i < 200; i++) {
        const patch = new THREE.Mesh(
          new THREE.CircleGeometry(0.3 + Math.random() * 0.5, 5),
          new THREE.MeshStandardMaterial({
            color: 0x2a4a1a + Math.floor(Math.random() * 0x003300),
            roughness: 1,
            transparent: true,
            opacity: 0.6 + Math.random() * 0.4,
          })
        );
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(
          (Math.random() - 0.5) * WORLD.size * 0.8,
          0.01,
          (Math.random() - 0.5) * WORLD.size * 0.8
        );
        scene.add(patch);
      }

      // ── Trees ──
      const trees = [];
      for (let i = 0; i < WORLD.treeCount; i++) {
        let x, z, tooClose;
        let attempts = 0;
        do {
          x = (Math.random() - 0.5) * WORLD.size * 0.7;
          z = (Math.random() - 0.5) * WORLD.size * 0.7;
          tooClose = BUILDING_PLANS.some(b => Math.hypot(x - b.x, z - b.z) < 2.5) || trees.some(t => Math.hypot(x - t.x, z - t.z) < 1.5);
          attempts++;
        } while (tooClose && attempts < 10);
        const t = makeTree(x, z, 0.6 + Math.random() * 0.6);
        scene.add(t);
        trees.push({ x, z });
      }

      // ── Rocks ──
      for (let i = 0; i < WORLD.rockCount; i++) {
        const x = (Math.random() - 0.5) * WORLD.size * 0.75;
        const z = (Math.random() - 0.5) * WORLD.size * 0.75;
        const rock = makeRock(x, z, 0.5 + Math.random());
        scene.add(rock);
      }

      // ── Buildings ──
      for (const plan of BUILDING_PLANS) {
        const b = makeBuilding(plan);
        scene.add(b);
      }

      // ── Roads ──
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.95 });
      const roadSegments = [
        { x: 0, z: -20, w: 1.5, d: 15, angle: 0 },
        { x: 0, z: 15, w: 1.5, d: 10, angle: 0 },
        { x: -15, z: 0, w: 10, d: 1.5, angle: 0 },
        { x: 12, z: 0, w: 8, d: 1.5, angle: 0 },
      ];
      for (const r of roadSegments) {
        const road = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(r.x, 0.005, r.z);
        road.receiveShadow = true;
        scene.add(road);
      }

      // ── Fences ──
      const fences = [
        { x: -8, z: -6, angle: Math.PI / 3, count: 6 },
        { x: 6, z: -8, angle: -Math.PI / 4, count: 5 },
        { x: -6, z: 6, angle: Math.PI / 2, count: 4 },
      ];
      for (const f of fences) {
        scene.add(makeFence(f.x, f.z, f.angle, f.count));
      }

      // ── Barrels & Crates ──
      for (let i = 0; i < 8; i++) {
        const x = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 20;
        if (Math.hypot(x, z) > 2) {
          scene.add(Math.random() > 0.5 ? makeBarrel(x, z) : makeCrate(x, z));
        }
      }

      // ── Campfire ──
      scene.add(makeCampfire(2, -3));

      // ── Motorcycle ──
      const bike = makeMotorcycle(-7, -4);
      scene.add(bike);

      // ── Character ──
      const character = makeCharacter();
      character.position.set(0, 0, 0);
      scene.add(character);
      charRef.current = character;

      // ── Particles ──
      const particleCount = 300;
      const particleGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i++) positions[i] = (Math.random() - 0.5) * 40;
      particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x88aacc,
        size: 0.04,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const particles = new THREE.Points(particleGeo, particleMat);
      particles.position.y = 2;
      scene.add(particles);

      // ── Rain particles ──
      const rainCount = 1500;
      const rainGeo = new THREE.BufferGeometry();
      const rainPos = new Float32Array(rainCount * 3);
      const rainVel = new Float32Array(rainCount);
      for (let i = 0; i < rainCount; i++) {
        rainPos[i * 3] = (Math.random() - 0.5) * 50;
        rainPos[i * 3 + 1] = Math.random() * 15;
        rainPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        rainVel[i] = 3 + Math.random() * 2;
      }
      rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
      const rainMat = new THREE.PointsMaterial({
        color: 0xaaccff,
        size: 0.04,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      });
      const rain = new THREE.Points(rainGeo, rainMat);
      scene.add(rain);

      // ── Vignette (post-process via fullscreen quad) ──
      // Not using post-processing for performance, using CSS overlay instead

      // ── Keyboard ──
      const onKeyDown = (e) => {
        keysRef.current[e.key.toLowerCase()] = true;
        controlsRef.current.forward = keysRef.current["w"];
        controlsRef.current.backward = keysRef.current["s"];
        controlsRef.current.left = keysRef.current["a"];
        controlsRef.current.right = keysRef.current["d"];
        controlsRef.current.running = keysRef.current["shift"];
      };
      const onKeyUp = (e) => {
        keysRef.current[e.key.toLowerCase()] = false;
        controlsRef.current.forward = keysRef.current["w"];
        controlsRef.current.backward = keysRef.current["s"];
        controlsRef.current.left = keysRef.current["a"];
        controlsRef.current.right = keysRef.current["d"];
        controlsRef.current.running = keysRef.current["shift"];
      };
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);

      // ── Resize ──
      const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      // ── Game Loop ──
      const animate = () => {
        if (destroyed) return;
        const delta = clock.getDelta();
        const time_ = clock.getElapsedTime();

        // Update time of day
        setTime((t) => (t + delta * 0.5) % 24);

        // Character movement
        const ctrl = controlsRef.current;
        const speed = ctrl.running ? 3.0 : 1.5;
        const rotSpeed = 2.5;
        let moveX = 0;
        let moveZ = 0;

        if (ctrl.forward) moveZ -= 1;
        if (ctrl.backward) moveZ += 1;
        if (ctrl.left) moveX -= 1;
        if (ctrl.right) moveX += 1;

        const moving = moveX !== 0 || moveZ !== 0;

        if (moving) {
          const len = Math.hypot(moveX, moveZ);
          moveX /= len;
          moveZ /= len;
          const targetAngle = Math.atan2(moveX, moveZ);
          let diff = targetAngle - charRot.current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          charRot.current += diff * delta * 8;

          charPos.current.x += Math.sin(charRot.current) * speed * delta;
          charPos.current.z += Math.cos(charRot.current) * speed * delta;

          walkTime.current += delta * (ctrl.running ? 1.8 : 1.0);
        }

        // Update character mesh
        character.position.copy(charPos.current);
        character.rotation.y = charRot.current;

        // Walk animation
        if (moving) {
          const bob = Math.sin(walkTime.current * 6) * 0.02;
          character.position.y = bob;
          // Legs swing
          const swing = Math.sin(walkTime.current * 6) * 0.3;
          const legSwing = Math.sin(walkTime.current * 6) * 0.2;
          const children = character.children;
          // Find legs (indices 4,5 are legs)
          if (children.length >= 6) {
            children[4].rotation.x = legSwing;
            children[5].rotation.x = -legSwing;
            children[2].rotation.x = -swing;
            children[3].rotation.x = swing;
          }
        } else {
          const children = character.children;
          if (children.length >= 6) {
            children[4].rotation.x *= 0.9;
            children[5].rotation.x *= 0.9;
            children[2].rotation.x *= 0.9;
            children[3].rotation.x *= 0.9;
          }
        }

        // Third-person camera
        const camDist = 4.5;
        const camHeight = 2.2;
        const targetPos = new THREE.Vector3(
          charPos.current.x + Math.sin(charRot.current) * 0,
          camHeight,
          charPos.current.z + camDist
        );
        camPos.current.lerp(targetPos, delta * 4);

        const lookTarget = new THREE.Vector3(
          charPos.current.x,
          1.2,
          charPos.current.z
        );
        camTarget.current.lerp(lookTarget, delta * 4);

        camera.position.copy(camPos.current);
        camera.lookAt(camTarget.current);

        // Update lighting based on time
        const hour = (time_ * 0.5) % 24;
        const dayFactor = Math.sin((hour - 6) * Math.PI / 12);
        const dayClamp = Math.max(0.05, Math.min(1, dayFactor));
        sun.intensity = dayClamp * 1.2 + 0.1;
        ambient.intensity = dayClamp * 0.25 + 0.05;
        hemi.intensity = dayClamp * 0.4 + 0.05;

        const dayColor = new THREE.Color(0xffdd99);
        const nightColor = new THREE.Color(0x223355);
        const skyColor = dayColor.clone().lerp(nightColor, 1 - dayClamp);
        scene.background.copy(skyColor);
        scene.fog.color.copy(skyColor);

        // Rain particles
        const rainPositions = rain.geometry.attributes.position.array;
        for (let i = 0; i < rainCount; i++) {
          rainPositions[i * 3 + 1] -= rainVel[i] * delta;
          rainPositions[i * 3] += Math.sin(time_ + i) * 0.3 * delta;
          if (rainPositions[i * 3 + 1] < -1) {
            rainPositions[i * 3 + 1] = 8 + Math.random() * 7;
            rainPositions[i * 3] = (Math.random() - 0.5) * 40;
            rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
          }
        }
        rain.geometry.attributes.position.needsUpdate = true;
        rain.visible = dayClamp < 0.7;

        // Atmosphere particles
        particles.rotation.y += delta * 0.02;

        // Diminish health/stamina when running
        if (ctrl.running && moving) {
          setHud(h => ({ ...h, stamina: Math.max(0, h.stamina - 3 * delta), health: h.health }));
        } else if (!moving) {
          setHud(h => ({ ...h, stamina: Math.min(100, h.stamina + 5 * delta) }));
        }

        renderer.render(scene, camera);
        animFrameRef.current = requestAnimationFrame(animate);
      };

      const animFrameRef = { current: requestAnimationFrame(animate) };

      return () => {
        destroyed = true;
        cancelAnimationFrame(animFrameRef.current);
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("resize", onResize);
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer.dispose();
        sceneRef.current = null;
      };
    } catch (err) {
      console.error("[VSB 3D Error]", err);
    }
  }, [phase]);

  if (phase === "loading") {
    return <LoadingScreen progress={loadProgress} onStart={() => setPhase("world")} />;
  }

  // ── INVENTORY ──
  if (view === "inventory") {
    return (
      <div className="vsb-inventory">
        <div className="vsb-inv-header">
          <h2>🎒 Inventário</h2>
          <button className="vsb-back-btn" onClick={() => setView("world")}>Fechar</button>
        </div>
        <div className="vsb-inv-grid">
          {inventory.length === 0 ? (
            <p className="vsb-inv-empty">Nenhum item encontrado. Explore o mundo!</p>
          ) : (
            inventory.map((item, i) => (
              <div key={i} className="vsb-inv-item">
                <span className="vsb-inv-emoji">{item.emoji}</span>
                <span className="vsb-inv-name">{item.name}</span>
                <span className="vsb-inv-qty">x{item.qty || 1}</span>
              </div>
            ))
          )}
        </div>
        <div className="vsb-inv-stats">
          <div className="vsb-inv-stat"><span>❤️</span><span>{Math.floor(hud.health)}</span></div>
          <div className="vsb-inv-stat"><span>⚡</span><span>{Math.floor(hud.stamina)}</span></div>
          <div className="vsb-inv-stat"><span>🍞</span><span>{Math.floor(hud.hunger)}</span></div>
          <div className="vsb-inv-stat"><span>💧</span><span>{Math.floor(hud.thirst)}</span></div>
        </div>
      </div>
    );
  }

  // ── WORLD VIEW ──
  return (
    <div className="vsb-world-container">
      {/* Three.js canvas */}
      <div ref={containerRef} className="vsb-canvas" />

      {/* Cinematic letterbox */}
      <div className="vsb-letterbox vsb-letterbox-top" />
      <div className="vsb-letterbox vsb-letterbox-bottom" />

      {/* Vignette */}
      <div className="vsb-vignette" />

      {/* HUD */}
      <div className="vsb-hud-overlay">
        {/* Top bar */}
        <div className="vsb-hud-top">
          <div className="vsb-hud-bars">
            <div className="vsb-bar vsb-bar-health">
              <span className="vsb-bar-label">❤️</span>
              <div className="vsb-bar-track">
                <div className="vsb-bar-fill" style={{ width: `${hud.health}%` }} />
              </div>
            </div>
            <div className="vsb-bar vsb-bar-stamina">
              <span className="vsb-bar-label">⚡</span>
              <div className="vsb-bar-track">
                <div className="vsb-bar-fill" style={{ width: `${hud.stamina}%` }} />
              </div>
            </div>
            <div className="vsb-bar vsb-bar-hunger">
              <span className="vsb-bar-label">🍞</span>
              <div className="vsb-bar-track">
                <div className="vsb-bar-fill" style={{ width: `${hud.hunger}%` }} />
              </div>
            </div>
            <div className="vsb-bar vsb-bar-thirst">
              <span className="vsb-bar-label">💧</span>
              <div className="vsb-bar-track">
                <div className="vsb-bar-fill" style={{ width: `${hud.thirst}%` }} />
              </div>
            </div>
          </div>
          <div className="vsb-hud-time">
            {Math.floor(time).toString().padStart(2, "0")}:00
          </div>
        </div>

        {/* Controls hint */}
        <div className="vsb-hud-controls">
          <span>WASD — Andar</span>
          <span>Shift — Correr</span>
          <span>I — Inventário</span>
        </div>

        {/* Center message */}
        <div className="vsb-hud-center">
          <div className="vsb-hud-location">Zona Abandonada — Setor 7</div>
        </div>

        {/* Inventory button */}
        <button className="vsb-hud-inv-btn" onClick={() => setView("inventory")}>
          🎒 <span className="vsb-hud-inv-count">{inventory.length}</span>
        </button>

        {/* Interaction hint */}
        <div className="vsb-hud-interact">
          Pressione E para interagir
        </div>
      </div>

      {foundItem && <ItemModal item={foundItem} onClose={() => setFoundItem(null)} onTake={(item) => {
        setInventory(prev => {
          const existing = prev.find(i => i.name === item.name);
          if (existing) return prev.map(i => i.name === item.name ? { ...i, qty: (i.qty || 1) + 1 } : i);
          return [...prev, { ...item, qty: 1 }];
        });
        notify(`${item.name} coletado!`);
      }} />}
      {notif && <Notif msg={notif} onHide={() => setNotif("")} />}
    </div>
  );
}
