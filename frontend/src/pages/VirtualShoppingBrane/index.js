import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import "./VirtualShoppingBrane.css";

// ─── CONSTANTS ───
const TW = 2.8, TD = 1.4;
const BR = 0.032, PR = 0.075;
const FRICTION = 0.988, MIN_V = 0.002, CUSH = 0.025;
const MAX_POWER = 4.5;
const COIN_STORAGE_KEY = "vsb_saldo";
const DEFAULT_SALDO = 1000;

const BALL_COLORS = [
  0xffffff,
  0xffcc00, 0x0044ff, 0xff2200, 0x7b2d8e,
  0xff6600, 0x006600, 0x8b0000, 0x111111,
  0xffcc00, 0x0044ff, 0xff2200, 0x7b2d8e,
  0xff6600, 0x006600, 0x8b0000,
];
const STRIPE_MASK = 0xffffffff;

const POCKETS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 1], [0, 1], [1, 1],
];

const HALF = { x: TW / 2 - CUSH, z: TD / 2 - CUSH };

// ─── PHYSICS ───
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

function pocketed(x, z) {
  for (const [px, pz] of POCKETS) {
    if (Math.hypot(x - px * TW * 0.42, z - pz * TD * 0.42) < PR) return true;
  }
  return false;
}

// ─── AI ───
function aiShot(balls, cue) {
  const visible = balls.filter(b => !b.p && b.id !== 0);
  if (!visible.length) return { dx: 1, dz: 0, power: 2 };
  const target = visible.reduce((a, b) =>
    Math.hypot(a.x - cue.x, a.z - cue.z) < Math.hypot(b.x - cue.x, b.z - cue.z) ? a : b
  );
  const dx = target.x - cue.x, dz = target.z - cue.z;
  const d = Math.hypot(dx, dz) || 1;
  const jitter = (Math.random() - 0.5) * 0.15;
  return {
    dx: dx / d + jitter * dz / d,
    dz: dz / d - jitter * dx / d,
    power: 1.5 + Math.random() * 1.5,
  };
}

// ─── THREE.JS SCENE ───
function makeScene(mount) {
  const w = mount.clientWidth, h = mount.clientHeight;
  const cam = new THREE.PerspectiveCamera(35, w / h, 0.01, 20);
  cam.position.set(0, 3.2, 2.8);
  cam.lookAt(0, 0, 0);
  const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  ren.setSize(w, h); ren.setPixelRatio(Math.min(devicePixelRatio, 2));
  ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap;
  ren.toneMapping = THREE.ACESFilmicToneMapping;
  ren.toneMappingExposure = 0.9;
  mount.appendChild(ren.domElement);

  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0x1a1a2e);

  const amb = new THREE.AmbientLight(0xffffff, 0.5);
  sc.add(amb);
  const dir = new THREE.DirectionalLight(0xffeedd, 1.8);
  dir.position.set(3, 6, 4);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.near = 0.1; dir.shadow.camera.far = 12;
  dir.shadow.camera.left = -4; dir.shadow.camera.right = 4;
  dir.shadow.camera.top = 4; dir.shadow.camera.bottom = -4;
  sc.add(dir);
  const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
  fill.position.set(-2, 3, -3);
  sc.add(fill);

  // Floor
  const fl = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshStandardMaterial({ color: 0x0a0a18, roughness: 1 })
  );
  fl.rotation.x = -Math.PI / 2;
  fl.position.y = -0.05;
  fl.receiveShadow = true;
  sc.add(fl);

  // Table base
  const tbMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.8 });
  const tb = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.2, 0.08, TD + 0.2), tbMat);
  tb.position.y = 0.02; tb.receiveShadow = true; tb.castShadow = true;
  sc.add(tb);

  // Felt surface
  const feltMat = new THREE.MeshStandardMaterial({
    color: 0x0a7a3a, roughness: 0.7, metalness: 0.0,
  });
  const felt = new THREE.Mesh(new THREE.PlaneGeometry(TW, TD), feltMat);
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = 0.07;
  felt.receiveShadow = true;
  sc.add(felt);

  // Cushions
  const cMat = new THREE.MeshStandardMaterial({ color: 0x2d6b1e, roughness: 0.6 });
  const cw = 0.03, ch = 0.015;
  const cushions = [
    { x: 0, z: -TD / 2 + cw / 2, sx: TW - PR * 2, sz: cw },
    { x: 0, z: TD / 2 - cw / 2, sx: TW - PR * 2, sz: cw },
    { x: -TW / 2 + cw / 2, z: 0, sx: cw, sz: TD - PR * 2 },
    { x: TW / 2 - cw / 2, z: 0, sx: cw, sz: TD - PR * 2 },
  ];
  for (const c of cushions) {
    const cm = new THREE.Mesh(new THREE.BoxGeometry(c.sx, ch, c.sz), cMat);
    cm.position.set(c.x, 0.08, c.z);
    sc.add(cm);
  }

  // Pockets
  const pMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
  for (const [px, pz] of POCKETS) {
    const pm = new THREE.Mesh(new THREE.CircleGeometry(PR * 0.7, 16), pMat);
    pm.rotation.x = -Math.PI / 2;
    pm.position.set(px * TW * 0.42, 0.065, pz * TD * 0.42);
    sc.add(pm);
    // Rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(PR * 0.7, 0.005, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5, metalness: 0.3 })
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(px * TW * 0.42, 0.073, pz * TD * 0.42);
    sc.add(rim);
  }

  // Decorative diamonds on rails
  const diamMat = new THREE.MeshStandardMaterial({ color: 0xccaa88, roughness: 0.3, metalness: 0.2 });
  for (let i = 1; i < 4; i++) {
    for (const [sign, axis] of [[-1, 'z'], [1, 'z'], [-1, 'x'], [1, 'x']]) {
      const pos = { x: 0, z: 0 };
      if (axis === 'z') { pos.z = sign * (TD / 2 + 0.02); pos.x = (i / 4 - 0.5) * TW * 0.85; }
      else { pos.x = sign * (TW / 2 + 0.02); pos.z = (i / 4 - 0.5) * TD * 0.85; }
      const dm = new THREE.Mesh(new THREE.CircleGeometry(0.008, 4), diamMat);
      dm.rotation.x = -Math.PI / 2;
      dm.position.set(pos.x, 0.085, pos.z);
      sc.add(dm);
    }
  }

  // Balls
  const ballGroup = new THREE.Group();
  sc.add(ballGroup);
  const ballMesh = (i) => {
    const c = BALL_COLORS[i];
    const mat = new THREE.MeshStandardMaterial({
      color: c, roughness: 0.15, metalness: 0.05,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(BR, 20, 20), mat);
    m.castShadow = true;
    return m;
  };

  return { sc, ren, cam, ballGroup, ballMesh };
}

// ─── REACT COMPONENT ───
export default function VirtualShoppingBrane() {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState("bet"); // bet | playing | ended
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [turn, setTurn] = useState("player"); // player | ai | waiting
  const [saldo, setSaldo] = useState(() => {
    try { return parseFloat(localStorage.getItem(COIN_STORAGE_KEY)) || DEFAULT_SALDO; }
    catch { return DEFAULT_SALDO; }
  });
  const [bet, setBet] = useState(50);
  const [message, setMessage] = useState("Faça sua aposta!");
  const [pocketedBalls, setPocketedBalls] = useState([]);
  const [lastShot, setLastShot] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const sceneRef = useRef(null);
  const ballsRef = useRef([]);
  const meshesRef = useRef([]);
  const cueLineRef = useRef(null);
  const animRef = useRef(null);

  // Saldo persistence
  useEffect(() => {
    localStorage.setItem(COIN_STORAGE_KEY, String(saldo));
  }, [saldo]);

  const resetBalls = useCallback(() => {
    const balls = [{ id: 0, x: -TW * 0.28, z: 0, vx: 0, vz: 0, p: false }];
    const startX = TW * 0.26;
    const sp = BR * 2.1;
    let idx = 1;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c <= r; c++) {
        const x = startX + r * sp * Math.cos(Math.PI / 6);
        const z = (c - r / 2) * sp;
        balls.push({ id: idx++, x, z, vx: 0, vz: 0, p: false });
      }
    }
    // Shuffle assignments (except cue and 8-ball)
    const ids = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    ids.splice(7, 0, 8);
    for (let i = 1; i <= 15; i++) balls[i].id = ids[i - 1];

    ballsRef.current = balls;
    return balls;
  }, []);

  const initScene = useCallback(() => {
    if (!mountRef.current || sceneRef.current) return;
    const { sc, ren, cam, ballGroup, ballMesh } = makeScene(mountRef.current);
    sceneRef.current = { sc, ren, cam, ballGroup, ballMesh };

    // Cue line
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0.6 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(1, 0.1, 0)
    ]);
    const line = new THREE.Line(lineGeo, lineMat);
    line.visible = false;
    sc.add(line);
    cueLineRef.current = line;

    // Resize
    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight;
      cam.aspect = w / h; cam.updateProjectionMatrix();
      ren.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    sceneRef.current._resize = onResize;
  }, []);

  const updateBalls = useCallback(() => {
    const { ballGroup, ballMesh } = sceneRef.current;
    while (ballGroup.children.length) ballGroup.remove(ballGroup.children[0]);
    meshesRef.current = [];
    for (const b of ballsRef.current) {
      if (b.p) continue;
      const m = ballMesh(b.id);
      m.position.set(b.x, BR + 0.07, b.z);
      // Stripe: add a white band for balls 9-15
      if (b.id >= 9) {
        const band = new THREE.Mesh(
          new THREE.TorusGeometry(BR * 0.8, BR * 0.3, 8, 16),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
        );
        band.rotation.x = Math.PI / 2;
        band.position.y = 0;
        m.add(band);
      }
      // Number label (decal-like small circle on top)
      if (b.id > 0) {
        const numMat = new THREE.MeshStandardMaterial({
          color: b.id === 8 ? 0xffffff : 0xffffff,
          roughness: 0.1,
        });
        const num = new THREE.Mesh(new THREE.CircleGeometry(BR * 0.3, 8), numMat);
        num.rotation.x = -Math.PI / 2;
        num.position.y = BR * 0.98;
        m.add(num);
      }
      ballGroup.add(m);
      meshesRef.current.push({ mesh: m, ball: b });
    }
  }, []);

  const physicsStep = useCallback((dt) => {
    const balls = ballsRef.current;
    for (const b of balls) {
      if (b.p) continue;
      b.vx *= FRICTION; b.vz *= FRICTION;
      if (Math.abs(b.vx) < MIN_V) b.vx = 0;
      if (Math.abs(b.vz) < MIN_V) b.vz = 0;
      b.x += b.vx * dt * 60;
      b.z += b.vz * dt * 60;
      wall(b);
      if (pocketed(b.x, b.z)) {
        b.p = true;
        b.vx = 0; b.vz = 0;
      }
    }
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        if (!balls[i].p && !balls[j].p) col(balls[i], balls[j]);
      }
    }
  }, []);

  const allStopped = useCallback(() => {
    return ballsRef.current.every(b => b.p || (Math.abs(b.vx) < MIN_V && Math.abs(b.vz) < MIN_V));
  }, []);

  useEffect(() => {
    initScene();
    const b = resetBalls();
    updateBalls();

    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      for (const m of meshesRef.current) {
        if (!m.ball.p) {
          m.mesh.position.set(m.ball.x, BR + 0.07, m.ball.z);
        } else {
          m.mesh.visible = false;
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (sceneRef.current) {
        const { ren } = sceneRef.current;
        ren.dispose();
        window.removeEventListener("resize", sceneRef.current._resize);
      }
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shoot
  const shoot = useCallback((dx, dz, power) => {
    const cue = ballsRef.current[0];
    if (cue.p) return;
    const d = Math.hypot(dx, dz) || 1;
    cue.vx = (dx / d) * power * 0.15;
    cue.vz = (dz / d) * power * 0.15;
    setTurn("waiting");
    setMessage("Bolas em movimento...");
    cueLineRef.current.visible = false;
  }, []);

  // AI turn
  useEffect(() => {
    if (turn !== "ai") return;
    const t = setTimeout(() => {
      if (!allStopped()) return;
      const cue = ballsRef.current[0];
      if (cue.p) {
        // Spot cue ball
        cue.p = false; cue.x = -TW * 0.28; cue.z = 0;
        cue.vx = 0; cue.vz = 0;
        updateBalls();
      }
      const { dx, dz, power } = aiShot(ballsRef.current, cue);
      shoot(dx, dz, power);
      setMessage("🤖 AI está jogando...");
      // Wait for physics to settle then check result
      const check = setInterval(() => {
        physicsStep(0.016);
        updateBalls();
        if (allStopped()) {
          clearInterval(check);
          const justPocketed = ballsRef.current.filter(b => b.p && b.lastPocketed !== true);
          for (const b of justPocketed) b.lastPocketed = true;
          const aiScore = justPocketed.filter(b => b.id !== 0).length;
          if (aiScore > 0) {
            setScore(s => ({ ...s, ai: s.ai + aiScore }));
            setMessage(`🤖 AI embolsou ${aiScore} bola(s)!`);
          } else {
            setMessage("🤖 AI errou! Sua vez.");
          }
          setTurn("player");
        }
      }, 50);
      return () => clearInterval(check);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn]);

  // Player turn simulation (called from shooting)
  const handlePlayerShot = useCallback((dx, dz, power) => {
    shoot(dx, dz, power);
    setMessage("Sua vez!");
    const check = setInterval(() => {
      physicsStep(0.016);
      updateBalls();
      if (allStopped()) {
        clearInterval(check);
        const justPocketed = ballsRef.current.filter(b => b.p && b.id !== 0 && !b._counted);
        const cuePocketed = ballsRef.current[0].p;
        for (const b of justPocketed) b._counted = true;
        if (cuePocketed) {
          // Scratch!
          ballsRef.current[0].p = false;
          ballsRef.current[0].x = -TW * 0.28;
          ballsRef.current[0].z = 0;
          ballsRef.current[0].vx = 0; ballsRef.current[0].vz = 0;
          updateBalls();
          setMessage("⚠️ TACADA! Cue ball embolsada. Passa a vez.");
          setTurn("ai");
        } else if (justPocketed.length > 0) {
          setScore(s => ({ ...s, player: s.player + justPocketed.length }));
          setMessage(`✅ Você embolsou ${justPocketed.length} bola(s)! Jogue novamente.`);
          setTurn("player");
        } else {
          setMessage("❌ Você errou. Vez do AI.");
          setTurn("ai");
        }
      }
    }, 50);
  }, [shoot, physicsStep, updateBalls, allStopped]);

  // Mouse handling
  const mouseRef = useRef({ x: 0, y: 0, down: false, startX: 0, startY: 0 });
  const handleMouseDown = useCallback((e) => {
    if (turn !== "player" || gameState !== "playing") return;
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.down = true;
    mouseRef.current.startX = e.clientX;
    mouseRef.current.startY = e.clientY;
  }, [turn, gameState]);

  const handleMouseMove = useCallback((e) => {
    if (!mouseRef.current.down || turn !== "player") return;
    const cue = ballsRef.current[0];
    if (!cue || cue.p) return;
    const dx = e.clientX - mouseRef.current.startX;
    const dy = mouseRef.current.startY - e.clientY;
    const power = Math.min(1, Math.hypot(dx, dy) / 200);
    // Convert screen delta to 3D direction
    const rect = mountRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    // Simple mapping from screen to table coords
    const tx = mx * TW * 0.45, tz = my * TD * 0.45;
    const dirX = tx - cue.x, dirZ = tz - cue.z;
    const d = Math.hypot(dirX, dirZ) || 1;
    if (cueLineRef.current) {
      cueLineRef.current.visible = true;
      const len = Math.min(d, 1.5);
      const pts = [
        new THREE.Vector3(cue.x, 0.1, cue.z),
        new THREE.Vector3(cue.x + (dirX / d) * len, 0.1, cue.z + (dirZ / d) * len),
      ];
      cueLineRef.current.geometry.dispose();
      cueLineRef.current.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    }
    return { dx: dirX, dz: dirZ, power };
  }, [turn]);

  const handleMouseUp = useCallback((e) => {
    if (!mouseRef.current.down || turn !== "player") return;
    mouseRef.current.down = false;
    const rect = mountRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const cue = ballsRef.current[0];
    if (!cue || cue.p) return;
    const tx = mx * TW * 0.45, tz = my * TD * 0.45;
    const dx = tx - cue.x, dz = tz - cue.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) return;
    const rawPower = Math.hypot(e.clientX - mouseRef.current.startX, e.clientY - mouseRef.current.startY) / 200;
    const power = Math.min(MAX_POWER, Math.max(1, rawPower * 3));
    handlePlayerShot(dx, dz, power);
  }, [turn, handlePlayerShot]);

  // Start game (after betting)
  const startGame = useCallback(() => {
    if (bet > saldo) { setMessage("Saldo insuficiente!"); return; }
    setSaldo(s => s - bet);
    setScore({ player: 0, ai: 0 });
    setPocketedBalls([]);
    setMessage("🎱 Quebre! Clique e arraste para mirar.");
    resetBalls();
    ballsRef.current.forEach(b => b._counted = false);
    updateBalls();
    setGameState("playing");
    setTurn("player");
  }, [bet, saldo, resetBalls, updateBalls]);

  // End game
  useEffect(() => {
    if (gameState !== "playing") return;
    const allPocketed = ballsRef.current.filter(b => b.id !== 0 && b.p).length;
    if (allPocketed >= 15) {
      const { player, ai } = score;
      const winner = player > ai ? "player" : ai > player ? "ai" : "draw";
      let msg;
      if (winner === "player") {
        const prize = bet * 2;
        setSaldo(s => s + prize);
        msg = `🏆 Você venceu! +${prize} BRC`;
      } else if (winner === "ai") {
        msg = `😞 AI venceu! Perdeu ${bet} BRC`;
      } else {
        setSaldo(s => s + bet);
        msg = "🤝 Empate! Aposta devolvida.";
      }
      setMessage(msg);
      setGameState("ended");
    }
  }, [score, gameState, bet]);

  const restartGame = useCallback(() => {
    setGameState("bet");
    setTurn("player");
    setMessage("Faça sua aposta!");
    resetBalls();
    ballsRef.current.forEach(b => { b.p = false; b._counted = false; });
    updateBalls();
  }, [resetBalls, updateBalls]);

  // Render loop for physics (separate from animation loop)
  useEffect(() => {
    if (gameState !== "playing") return;
    let running = true;
    const step = () => {
      if (!running) return;
      physicsStep(0.016);
      updateBalls();
      requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => { running = false; cancelAnimationFrame(id); };
  }, [gameState, physicsStep, updateBalls]);

  return (
    <div className="vsb-root"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Bar */}
      <div className="vsb-topbar">
        <div className="vsb-title">🎱 Sinuca Real</div>
        <div className="vsb-wallet">
          <span className="vsb-coin">🪙</span>
          <span className="vsb-balance">{saldo.toFixed(0)}</span>
          <span className="vsb-label">BRC</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="vsb-canvas" ref={mountRef} />

      {/* Overlay UI */}
      <div className="vsb-overlay">
        {/* Message */}
        <div className={`vsb-msg ${gameState === "playing" ? "vsb-msg-active" : ""}`}>
          {message}
        </div>

        {/* Score */}
        <div className="vsb-scoreboard">
          <div className={`vsb-score-item ${turn === "player" ? "vsb-active" : ""}`}>
            <div className="vsb-score-label">Você</div>
            <div className="vsb-score-val">{score.player}</div>
          </div>
          <div className="vsb-score-vs">VS</div>
          <div className={`vsb-score-item ${turn === "ai" ? "vsb-active" : ""}`}>
            <div className="vsb-score-label">AI</div>
            <div className="vsb-score-val">{score.ai}</div>
          </div>
        </div>

        {/* Bet panel */}
        {gameState === "bet" && (
          <div className="vsb-bet-panel">
            <div className="vsb-bet-title">💰 Aposta</div>
            <div className="vsb-bet-row">
              <button className="vsb-bet-btn" onClick={() => setBet(Math.max(10, bet - 25))}>-25</button>
              <div className="vsb-bet-amount">{bet}</div>
              <button className="vsb-bet-btn" onClick={() => setBet(Math.min(saldo, bet + 25))}>+25</button>
            </div>
            <input
              type="range" min={10} max={saldo} step={10}
              value={bet}
              onChange={e => setBet(Number(e.target.value))}
              className="vsb-bet-slider"
            />
            <div className="vsb-bet-info">Vencedor leva <strong>{bet * 2}</strong> BRC</div>
            <div className="vsb-bet-actions">
              <button className="vsb-btn vsb-btn-primary" onClick={startGame}>
                🎱 Começar Partida
              </button>
              <button className="vsb-btn vsb-btn-rules" onClick={() => setShowRules(!showRules)}>
                📖 Regras
              </button>
            </div>
            {showRules && (
              <div className="vsb-rules">
                <p><strong>🎱 Regras:</strong></p>
                <p>• Clique e arraste para mirar</p>
                <p>• Quanto mais longe arrastar, mais forte</p>
                <p>• Cada bola embolsada = 1 ponto</p>
                <p>• Cue ball na caçapa = perde a vez</p>
                <p>• Quem fizer mais pontos vence</p>
                <p>• Vencedor leva o dobro da aposta!</p>
              </div>
            )}
          </div>
        )}

        {/* End panel */}
        {gameState === "ended" && (
          <div className="vsb-end-panel">
            <div className="vsb-end-title">
              {score.player > score.ai ? "🏆 Vitória!" : score.player < score.ai ? "😞 Derrota" : "🤝 Empate"}
            </div>
            <div className="vsb-end-score">
              {score.player} - {score.ai}
            </div>
            <button className="vsb-btn vsb-btn-primary" onClick={restartGame}>
              🔄 Nova Partida
            </button>
          </div>
        )}
      </div>

      {/* Instructions hint during play */}
      {gameState === "playing" && turn === "player" && (
        <div className="vsb-hint">Arraste para mirar. Solte para tacar.</div>
      )}
    </div>
  );
}
