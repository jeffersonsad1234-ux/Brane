import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import GameHUD from "./GameHUD";
import Rain from "../editor/Rain";

const BUILDINGS = [
  { pos: [-4.5, 1.0, -3], scale: [2, 3, 2], color: "#1a1412" },
  { pos: [-4.0, 2.5, -8], scale: [3, 5, 2.5], color: "#14100f" },
  { pos: [-5.0, 1.0, -14], scale: [2.5, 3, 2.5], color: "#12100e" },
  { pos: [-4.5, 0.8, -19], scale: [2, 2.5, 2], color: "#1a1412" },
  { pos: [4.5, 1.0, -5], scale: [2.5, 3, 2], color: "#14100f" },
  { pos: [4.0, 2.5, -10], scale: [3, 6, 2.5], color: "#12100e" },
  { pos: [5.0, 1.0, -15], scale: [2, 3, 3], color: "#1a1412" },
  { pos: [4.5, 0.8, -20], scale: [2, 2.5, 2], color: "#14100f" },
];

const LAMPPOSTS = [
  { pos: [-2.5, 0, -2], color: "#ffdd44" },
  { pos: [2.5, 0, -7], color: "#ffdd44" },
  { pos: [-2.5, 0, -12], color: "#ffdd44" },
  { pos: [2.5, 0, -17], color: "#ffdd44" },
];

const SYMBOLS = [
  { id: 1, pos: [-2, 0.6, -6], type: "tetrahedron", color: "#44ddff" },
  { id: 2, pos: [3, 0.6, -13], type: "octahedron", color: "#ff44ee" },
  { id: 3, pos: [-1.5, 0.6, -21], type: "icosahedron", color: "#ffaa44" },
];

function Building({ pos, scale, color }) {
  return (
    <mesh position={pos} scale={scale} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
    </mesh>
  );
}

function Debris() {
  const items = useMemo(() => [
    { pos: [1.5, -0.15, 4], rot: [0.1, 0.5, 0.2], scale: [0.5, 0.18, 0.35] },
    { pos: [-1.8, -0.1, 6], rot: [0, 0.8, 0.1], scale: [0.6, 0.12, 0.3] },
    { pos: [2.2, -0.1, -1.5], rot: [0.2, 1.2, 0], scale: [0.35, 0.1, 0.2] },
    { pos: [0.5, 0, 7], rot: [0, 0.3, 0.05], scale: [1.4, 0.35, 0.9] },
    { pos: [-1, -0.1, 2.5], rot: [0, 0.3, 0], scale: [0.25, 0.5, 0.25] },
    { pos: [0.8, -0.1, -0.5], rot: [0, -0.4, 0.1], scale: [0.25, 0.5, 0.25] },
    { pos: [-1.5, -0.2, -4], rot: [0, 0, 0], scale: [0.2, 0.5, 0.2] },
  ], []);
  return items.map((d, i) => (
    <mesh key={i} position={d.pos} rotation={d.rot} scale={d.scale} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#2a2422" roughness={0.85} metalness={0} />
    </mesh>
  ));
}

function FlickeringLight({ pos, color = "#ffaa33", baseIntensity = 0.6 }) {
  const ref = useRef();
  const t = useRef(Math.random() * 100);
  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta * (2 + Math.random() * 3);
    const f = Math.sin(t.current * 5) * 0.15 + Math.sin(t.current * 13.7) * 0.1 + Math.sin(t.current * 23.1) * 0.05;
    const spike = Math.random() < 0.02 ? -0.4 : 0;
    ref.current.intensity = baseIntensity * (0.65 + f + spike);
  });
  return <pointLight ref={ref} position={pos} color={color} intensity={baseIntensity} distance={12} decay={1.5} />;
}

function Lamppost({ position, color }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 2.0, 6]} />
        <meshStandardMaterial color="#222233" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0.3, 1.9, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.02, 0.03, 0.6, 4]} />
        <meshStandardMaterial color="#222233" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0.55, 1.9, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <FlickeringLight pos={[0.55, 1.9, 0]} color="#ffaa33" baseIntensity={0.6} />
    </group>
  );
}

function SymbolItem({ pos, color }) {
  const meshRef = useRef();
  const geom = useMemo(() => new THREE.OctahedronGeometry(0.2), []);
  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.02;
    meshRef.current.position.y = pos[1] + Math.sin(performance.now() * 0.003) * 0.08;
  });
  return (
    <group>
      <mesh ref={meshRef} position={pos} castShadow>
        <primitive object={geom} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} roughness={0.2} metalness={0.1} />
      </mesh>
      <pointLight position={pos} color={color} intensity={0.3} distance={3} />
    </group>
  );
}

function ExitDoor({ unlocked }) {
  return (
    <group position={[0, 0.05, -23.5]}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1.6, 2.5, 0.1]} />
        <meshStandardMaterial
          color={unlocked ? "#44ff88" : "#441111"}
          emissive={unlocked ? "#22ff66" : "#ff2200"}
          emissiveIntensity={unlocked ? 0.8 : 0.3}
          roughness={0.3} metalness={0.6}
        />
      </mesh>
      <mesh position={[0, 2.0, 0.15]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial color={unlocked ? "#ffffff" : "#442222"} transparent opacity={0.5} />
      </mesh>
      <pointLight position={[0, 1.2, -0.5]} color={unlocked ? "#44ff88" : "#ff2200"} intensity={unlocked ? 1.0 : 0.3} distance={unlocked ? 10 : 3} />
    </group>
  );
}

function GamePlayer({ onCollect, onWin, collected, gameState }) {
  const { camera, gl } = useThree();
  const keys = useRef({});
  const vel = useRef(new THREE.Vector3());
  const pitch = useRef(0);
  const yaw = useRef(-Math.PI);
  const locked = useRef(false);
  const HEIGHT = 1.6;
  const RADIUS = 0.25;
  const stateRef = useRef({ onCollect, onWin, collected, gameState });
  stateRef.current = { onCollect, onWin, collected, gameState };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && document.pointerLockElement) {
        document.exitPointerLock();
        e.preventDefault();
      }
      keys.current[e.key.toLowerCase()] = e.type === "keydown";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); };
  }, []);

  useEffect(() => {
    const onMouse = (e) => {
      if (document.pointerLockElement === gl.domElement) {
        yaw.current -= e.movementX * 0.002;
        pitch.current -= e.movementY * 0.002;
        pitch.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch.current));
      }
    };
    document.addEventListener("mousemove", onMouse);
    return () => document.removeEventListener("mousemove", onMouse);
  }, [gl]);

  useEffect(() => {
    const onLock = () => { locked.current = document.pointerLockElement === gl.domElement; };
    document.addEventListener("pointerlockchange", onLock);
    return () => document.removeEventListener("pointerlockchange", onLock);
  }, [gl]);

  useEffect(() => {
    const el = gl.domElement;
    const onClick = () => { if (!locked.current) el.requestPointerLock(); };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [gl]);

  camera.position.set(0, HEIGHT, 8);

  const checkCollision = (x, z) => {
    for (const b of BUILDINGS) {
      const [bx, , bz] = b.pos;
      const [sx, , sz] = b.scale;
      const hx = sx / 2 + RADIUS;
      const hz = sz / 2 + RADIUS;
      if (Math.abs(x - bx) < hx && Math.abs(z - bz) < hz) {
        const dx = x - bx;
        const dz = z - bz;
        if (Math.abs(dx / hx) > Math.abs(dz / hz)) {
          return { x: bx + hx * Math.sign(dx), z };
        }
        return { x, z: bz + hz * Math.sign(dz) };
      }
    }
    return { x, z };
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (!locked.current || stateRef.current.gameState !== "playing") {
      if (camera.position.y > HEIGHT) {
        vel.current.y -= 9.8 * dt;
        camera.position.y += vel.current.y;
        if (camera.position.y < HEIGHT) { camera.position.y = HEIGHT; vel.current.y = 0; }
      }
      camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, "YXZ"));
      return;
    }

    const speed = keys.current["shift"] ? 7 : 4;
    const fwd = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
    const dir = new THREE.Vector3();
    if (keys.current["w"]) dir.add(fwd);
    if (keys.current["s"]) dir.sub(fwd);
    if (keys.current["a"]) dir.sub(right);
    if (keys.current["d"]) dir.add(right);
    if (dir.length() > 0) dir.normalize().multiplyScalar(speed * dt);

    vel.current.x = vel.current.x * 0.88 + dir.x;
    vel.current.z = vel.current.z * 0.88 + dir.z;

    let nx = camera.position.x + vel.current.x;
    let nz = camera.position.z + vel.current.z;
    nx = Math.max(-7, Math.min(7, nx));
    nz = Math.max(-26, Math.min(10, nz));
    const col = checkCollision(nx, nz);
    nx = col.x; nz = col.z;

    if (keys.current[" "] && camera.position.y <= HEIGHT + 0.01) vel.current.y = 3;
    vel.current.y -= 9.8 * dt;
    let ny = camera.position.y + vel.current.y;
    if (ny < HEIGHT) { ny = HEIGHT; vel.current.y = 0; }

    camera.position.set(nx, ny, nz);
    camera.quaternion.setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, "YXZ"));

    const st = stateRef.current;
    if (st.gameState !== "playing") return;
    for (const s of SYMBOLS) {
      if (st.collected.has(s.id)) continue;
      if (camera.position.distanceTo(new THREE.Vector3(s.pos[0], s.pos[1], s.pos[2])) < 1.5) {
        st.onCollect(s.id);
        break;
      }
    }
    if (st.collected.size === SYMBOLS.length) {
      if (camera.position.distanceTo(new THREE.Vector3(0, 1.2, -23.5)) < 2.5) {
        st.onWin();
      }
    }
  });

  return (
    <spotLight position={[0, 0, 0]} target-position={[0, 0, -5]}
      color="#ffeedd" intensity={2.5} distance={22} angle={0.25} penumbra={0.4} decay={1.5} />
  );
}

function GameScene({ collected, onCollect, onWin, gameState }) {
  return (
    <>
      <color attach="background" args={["#030308"]} />
      <fog attach="fog" args={["#0a0a14", 3, 18]} />
      <ambientLight intensity={0.06} />
      <directionalLight position={[5, 15, -10]} intensity={0.12} color="#4466aa" castShadow shadow-mapSize={[256, 256]} shadow-bias={-0.002} shadow-camera-far={25} />
      <hemisphereLight args={["#334466", "#0a0a15", 0.1]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#151520" roughness={0.12} metalness={0.08} />
      </mesh>
      <mesh position={[0, -0.45, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 30]} />
        <meshStandardMaterial color="#181825" roughness={0.3} metalness={0.1} />
      </mesh>

      {BUILDINGS.map((b, i) => <Building key={i} {...b} />)}
      {LAMPPOSTS.map((l, i) => <Lamppost key={i} {...l} />)}
      <Debris />
      <Rain count={2000} area={28} height={12} />
      {SYMBOLS.filter(s => !collected.has(s.id)).map(s => <SymbolItem key={s.id} {...s} />)}
      <ExitDoor unlocked={collected.size === SYMBOLS.length} />

      <GamePlayer onCollect={onCollect} onWin={onWin} collected={collected} gameState={gameState} />
    </>
  );
}

export default function HollowCity({ onStop }) {
  const [collected, setCollected] = useState(new Set());
  const [gameState, setGameState] = useState("playing");

  const handleCollect = useCallback((id) => {
    setCollected(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      if (next.size === SYMBOLS.length) {
        setGameState("jumpscare");
        setTimeout(() => setGameState("won"), 2500);
      }
      return next;
    });
  }, []);

  const handleWin = useCallback(() => {
    setGameState("won");
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: "#000" }}>
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center px-3 py-1.5 bg-black/70 backdrop-blur-sm border-b border-white/5">
        <span className="text-xs text-[#D4A24C] font-semibold tracking-wider uppercase">Hollow City — Prototype 0.1</span>
        <div className="flex-1" />
        <button onClick={onStop}
          className="px-3 py-1 text-xs text-red-400 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 rounded transition-colors">
          ◼ Stop
        </button>
      </div>

      <Canvas shadows camera={{ position: [0, 1.6, 8], fov: 65, near: 0.1, far: 30 }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.6, outputColorSpace: THREE.SRGBColorSpace, antialias: true }}
        dpr={[0.75, 1.5]} style={{ width: "100%", height: "100%" }}>
        <GameScene collected={collected} onCollect={handleCollect} onWin={handleWin} gameState={gameState} />
      </Canvas>

      <GameHUD collected={collected.size} total={SYMBOLS.length} gameState={gameState} />
    </div>
  );
}
