import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, SoftShadows, ContactShadows } from "@react-three/drei";
import { Physics, RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import { EffectComposer, Bloom, SSAO, Vignette, ChromaticAberration, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import RainSystem from "./RainSystem";
import Collectibles from "./Collectibles";
import { createAudioSystem } from "./AudioSystem";

const COLORS = {
  ground: "#0a0a12", road: "#0d0d18",
  building1: "#0f0f1a", building2: "#12121e", building3: "#0c0c16",
  neonPink: "#ff00aa", neonCyan: "#00ddff", neonAmber: "#ff8800", neonBlue: "#0044ff",
  window: "#ffdd44", windowOff: "#1a1a2a",
};

const BUILDINGS = [
  { pos: [-12, 2.5, -2], scale: [2.5, 6, 2.5], color: COLORS.building1, windows: true },
  { pos: [0, 3.5, -5], scale: [3, 8, 3], color: COLORS.building2, windows: true },
  { pos: [10, 2, -3], scale: [2, 5, 2], color: COLORS.building3, windows: true },
  { pos: [-8, 4, -10], scale: [2, 9, 2], color: COLORS.building2, windows: true },
  { pos: [5, 3, -12], scale: [2.5, 7, 2.5], color: COLORS.building1, windows: true },
  { pos: [-5, 2, -15], scale: [2, 5, 2], color: COLORS.building3, windows: true },
  { pos: [12, 4.5, -8], scale: [2, 10, 2], color: COLORS.building1, windows: true },
  { pos: [-15, 2, -5], scale: [2, 5, 2], color: COLORS.building2, windows: true },
  { pos: [15, 3, -10], scale: [2, 7, 2.5], color: COLORS.building3, windows: true },
  { pos: [-10, 1.5, -20], scale: [3, 4, 3], color: COLORS.building1, windows: true },
  { pos: [8, 5, -18], scale: [2, 11, 2], color: COLORS.building2, windows: true },
  { pos: [0, 2.5, -25], scale: [3, 6, 3], color: COLORS.building3, windows: true },
  { pos: [-6, 1.5, -8], scale: [3.5, 4, 3.5], color: COLORS.building1, windows: false },
  { pos: [14, 2, -15], scale: [1.5, 5, 1.5], color: COLORS.building2, windows: true },
  { pos: [-18, 3, -12], scale: [2, 7, 2], color: "#0e0e1a", windows: true },
  { pos: [20, 5, -6], scale: [2, 12, 2], color: COLORS.building1, windows: true },
  { pos: [-20, 2, -18], scale: [2.5, 5, 2.5], color: COLORS.building2, windows: true },
  { pos: [18, 2.5, -20], scale: [2.5, 6, 2.5], color: COLORS.building3, windows: true },
  { pos: [0, 1.5, 5], scale: [4, 4, 4], color: COLORS.building1, windows: true },
  { pos: [-14, 1, -25], scale: [2, 3, 2], color: COLORS.building2, windows: false },
  { pos: [6, 3.5, 2], scale: [2, 8, 2], color: COLORS.building3, windows: true },
  { pos: [-6, 2, 3], scale: [3, 5, 3], color: COLORS.building1, windows: true },
  { pos: [10, 2.5, 0], scale: [1.5, 6, 1.5], color: COLORS.building2, windows: true },
  { pos: [-3, 1, -30], scale: [4, 3, 4], color: COLORS.building3, windows: true },
];

const NEON_SIGNS = [
  { pos: [-12, 5.2, -2], color: COLORS.neonPink, width: 0.8, label: "NEON" },
  { pos: [0, 6.8, -5], color: COLORS.neonCyan, width: 1.2, label: "CYBER" },
  { pos: [10, 4.5, -3], color: COLORS.neonAmber, width: 0.6, label: "BAR" },
  { pos: [-8, 7.2, -10], color: COLORS.neonBlue, width: 0.8, label: "NIGHT" },
  { pos: [5, 6.2, -12], color: COLORS.neonPink, width: 0.7, label: "CLUB" },
  { pos: [0, 5.8, -25], color: COLORS.neonCyan, width: 1.0, label: "DREAM" },
  { pos: [8, 8.2, -18], color: COLORS.neonAmber, width: 0.9, label: "HOTEL" },
  { pos: [-6, 4.8, 3], color: COLORS.neonPink, width: 0.8, label: "LOVE" },
  { pos: [6, 6.8, 2], color: COLORS.neonCyan, width: 0.7, label: "TECH" },
  { pos: [20, 8.2, -6], color: COLORS.neonBlue, width: 1.0, label: "TOWER" },
  { pos: [-18, 6.2, -12], color: COLORS.neonPink, width: 0.6, label: "BAR" },
  { pos: [-14, 4.2, -25], color: COLORS.neonAmber, width: 0.7, label: "24H" },
  { pos: [14, 5.2, -15], color: COLORS.neonCyan, width: 0.6, label: "RAM" },
  { pos: [-10, 4.2, -20], color: COLORS.neonPink, width: 0.8, label: "NOIR" },
  { pos: [0, 5, 5], color: COLORS.neonAmber, width: 0.7, label: "MALL" },
  { pos: [10, 5.8, 0], color: COLORS.neonCyan, width: 0.6, label: "BYTE" },
  { pos: [15, 7.2, -10], color: COLORS.neonBlue, width: 0.7, label: "VIEW" },
];

const LAMP_POSTS = [
  [-8, 0, -3], [8, 0, -3], [-4, 0, -8], [6, 0, -7],
  [-10, 0, -12], [4, 0, -14], [-6, 0, -18], [12, 0, -10],
  [-14, 0, -6], [16, 0, -8], [0, 0, -22], [-12, 0, -16],
  [0, 0, 2], [-5, 0, 0], [7, 0, -2], [-16, 0, -14],
  [18, 0, -12], [10, 0, -20], [-8, 0, -22], [20, 0, -8],
];

const GROUND_FIXTURES = [
  { pos: [0, -0.5, -5], scale: [25, 1, 30] },
  { pos: [12, -0.5, -5], scale: [30, 1, 30] },
  { pos: [-12, -0.5, -5], scale: [30, 1, 30] },
  { pos: [0, -0.5, -25], scale: [25, 1, 30] },
  { pos: [0, -0.5, 3], scale: [30, 1, 30] },
];

function NeonSign({ pos, color, width }) {
  return (
    <group position={pos}>
      <mesh>
        <planeGeometry args={[width, 0.3]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <planeGeometry args={[width * 0.9, 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function Building({ pos, scale: s, color, windows }) {
  const [w, h, d] = s;
  const windowRows = Math.floor(h * 1.5);
  const windowCols = Math.floor(w * 1.2);
  return (
    <group position={pos}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
      </mesh>
      {windows && Array.from({ length: windowRows }).map((_, ri) =>
        Array.from({ length: windowCols }).map((_, ci) => {
          const on = Math.random() > 0.35;
          return (
            <mesh key={`w${ri}_${ci}`} position={[
              -w / 2 + (ci + 0.5) * (w / (windowCols + 1)),
              -h / 2 + (ri + 0.5) * (h / (windowRows + 1)),
              d / 2 + 0.01,
            ]}>
              <planeGeometry args={[0.12, 0.15]} />
              <meshBasicMaterial color={on ? COLORS.window : COLORS.windowOff} transparent opacity={on ? 0.9 : 0.3} />
            </mesh>
          );
        })
      )}
    </group>
  );
}

function LampPost({ pos }) {
  return (
    <group position={pos}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 3, 6]} />
        <meshStandardMaterial color="#222233" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffdd88" />
      </mesh>
      <pointLight position={[0, 3.2, 0]} intensity={0.6} distance={6} color="#ffcc66" />
    </group>
  );
}

function Road() {
  return (
    <group>
      <mesh position={[0, -0.48, -10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 35]} />
        <meshStandardMaterial color={COLORS.road} roughness={1} metalness={0} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[0, -0.45, -15 + i * 3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 1.5]} />
          <meshBasicMaterial color="#222240" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Sidewalk() {
  return (
    <mesh position={[0, -0.48, -10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 35]} />
      <meshStandardMaterial color={COLORS.ground} roughness={1} metalness={0} />
    </mesh>
  );
}

function ProceduralCity() {
  return (
    <group>
      <Sidewalk />
      <Road />
      {BUILDINGS.map((b, i) => <Building key={i} {...b} />)}
      {NEON_SIGNS.map((n, i) => <NeonSign key={i} {...n} />)}
      {LAMP_POSTS.map((l, i) => <LampPost key={i} pos={l} />)}
    </group>
  );
}

function PhysicsGround() {
  return (
    <>
      {GROUND_FIXTURES.map((g, i) => (
        <RigidBody key={i} type="fixed" position={g.pos} colliders="cuboid">
          <mesh>
            <boxGeometry args={g.scale} />
            <meshStandardMaterial transparent opacity={0} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}

function PlayerController({ setHealth, setStamina, playerPosRef, audioRef }) {
  const ref = useRef();
  const { camera } = useThree();
  const keys = useRef({ forward: false, backward: false, left: false, right: false, jump: false, sprint: false });
  const canJump = useRef(true);
  const isSprinting = useRef(false);
  const footstepTimer = useRef(0);

  useEffect(() => {
    const down = (e) => {
      switch (e.code) {
        case "KeyW": keys.current.forward = true; break;
        case "KeyS": keys.current.backward = true; break;
        case "KeyA": keys.current.left = true; break;
        case "KeyD": keys.current.right = true; break;
        case "Space": if (canJump.current) { keys.current.jump = true; canJump.current = false; } break;
        case "ShiftLeft": case "ShiftRight": keys.current.sprint = true; break;
      }
    };
    const up = (e) => {
      switch (e.code) {
        case "KeyW": keys.current.forward = false; break;
        case "KeyS": keys.current.backward = false; break;
        case "KeyA": keys.current.left = false; break;
        case "KeyD": keys.current.right = false; break;
        case "Space": keys.current.jump = false; canJump.current = true; break;
        case "ShiftLeft": case "ShiftRight": keys.current.sprint = false; break;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const body = ref.current;
    const k = keys.current;
    const speed = k.sprint && stamina > 0 ? 6 : 3.5;
    const dir = new THREE.Vector3();

    if (k.forward) dir.z -= 1;
    if (k.backward) dir.z += 1;
    if (k.left) dir.x -= 1;
    if (k.right) dir.x += 1;

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const forward = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const vel = body.linvel();
    vel.x = forward.x * dir.z + right.x * dir.x;
    vel.z = forward.z * dir.z + right.z * dir.x;

    if (k.jump && canJump.current) {
      vel.y = 4;
      canJump.current = false;
    }
    body.setLinvel(vel, true);

    if (k.sprint && stamina > 0) {
      isSprinting.current = true;
      setStamina((s) => Math.max(0, s - 15 * delta));
    } else {
      isSprinting.current = false;
      setStamina((s) => Math.min(100, s + 10 * delta));
    }

    const p = body.translation();
    playerPosRef.current.set(p.x, p.y, p.z);
    const ideal = new THREE.Vector3(p.x, p.y + 1.6, p.z + 4);
    camera.position.lerp(ideal, 5 * delta);
    camera.lookAt(p.x, p.y + 1.2, p.z);

    const isMoving = k.forward || k.backward || k.left || k.right;
    const onGround = canJump.current && Math.abs(vel.y) < 0.1;
    if (isMoving && onGround) {
      footstepTimer.current += delta;
      const interval = isSprinting.current ? 0.28 : 0.45;
      if (footstepTimer.current >= interval) {
        footstepTimer.current = 0;
        audioRef.current?.playFootstep();
      }
    } else {
      footstepTimer.current = 0.3;
    }
  });

  return (
    <>
      <RigidBody ref={ref} position={[0, 2, 0]} colliders={false} enabledRotations={[false, false, false]} mass={1} friction={0}>
        <CapsuleCollider args={[0.3, 0.5]} position={[0, 0.8, 0]} />
        <group>
          <mesh position={[0, 1.1, 0]} castShadow>
            <capsuleGeometry args={[0.25, 0.35, 8, 8]} />
            <meshStandardMaterial color="#4488ff" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.7, 0]} castShadow>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#ffccaa" />
          </mesh>
          <mesh position={[0.15, 1.65, 0.15]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color="#222" />
          </mesh>
          <mesh position={[-0.15, 1.65, 0.15]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color="#222" />
          </mesh>
        </group>
      </RigidBody>
    </>
  );
}

function Atmosphere() {
  return (
    <>
      <fog attach="fog" args={["#050510", 5, 22]} />
      <Sky distance={80} sunPosition={[1, 0.5, -2]} inclination={0.2} azimuth={0.25} turbidity={15} rayleigh={6} mieCoefficient={0.1} mieDirectionalG={0.8} />
    </>
  );
}

function SmokeParticles() {
  const count = 600;
  const meshRef = useRef();
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 40;
      p[i * 3 + 1] = Math.random() * 15;
      p[i * 3 + 2] = -(Math.random() * 30);
    }
    return p;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += delta * (0.2 + Math.random() * 0.1);
      pos[i * 3] += delta * (Math.random() - 0.5) * 0.05;
      if (pos[i * 3 + 1] > 15) pos[i * 3 + 1] = 0;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#444488" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function DemoEffects() {
  return (
    <EffectComposer multisampling={2} autoClear={false}>
      <Bloom intensity={0.6} luminanceThreshold={0.05} luminanceSmoothing={0.08} mipmapBlur />
      <SSAO samples={8} radius={0.3} intensity={1.2} luminanceInfluence={0.4} color="rgba(0,0,0,0.9)" blendFunction={BlendFunction.MULTIPLY} />
      <ChromaticAberration offset={[0.002, 0.001]} radialModulation={false} blendFunction={BlendFunction.NORMAL} />
      <Vignette offset={0.3} darkness={0.6} eskil={false} blendFunction={BlendFunction.NORMAL} />
      <ToneMapping blendFunction={BlendFunction.NORMAL} opacity={0.5} />
      <Noise opacity={0.015} blendFunction={BlendFunction.SCREEN} />
    </EffectComposer>
  );
}

function DemoHUD({ health, stamina, fps, collectedCount, totalCollectibles, muted, showComplete, onToggleMute }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
      fontFamily: "'Courier New', monospace", zIndex: 100,
    }}>
      <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 20, background: "rgba(0,0,0,0.5)", padding: "6px 14px", borderRadius: 8, backdropFilter: "blur(4px)", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
        <span>WASD — Move</span>
        <span>SPACE — Jump</span>
        <span>SHIFT — Sprint</span>
        <span>M — Som</span>
      </div>

      <div style={{ position: "absolute", bottom: 80, left: 20, width: 180 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>HEALTH</div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${health}%`, height: "100%", background: "#44ff88", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 100, left: 20, width: 180 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>STAMINA</div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${stamina}%`, height: "100%", background: "#ffdd44", borderRadius: 2, transition: "width 0.2s" }} />
        </div>
      </div>

      <div style={{ position: "absolute", top: 12, right: 16, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
        {fps} FPS
      </div>

      <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        BRANPY ENGINE v0.3 — Tech Demo
      </div>

      <div style={{ position: "absolute", top: 42, left: "50%", transform: "translateX(-50%)", fontSize: 12, color: "rgba(0,200,255,0.7)", letterSpacing: "0.05em", textAlign: "center", transition: "all 0.5s" }}>
        {showComplete ? (
          <div style={{ color: "#00ff88", fontSize: 16, fontWeight: "bold", textShadow: "0 0 20px rgba(0,255,136,0.5)" }}>
            AREA SINCRONIZADA
          </div>
        ) : (
          <div>
            <div>SINCRONIZE A AREA</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              Colete artefatos de dados: {collectedCount}/{totalCollectibles}
            </div>
          </div>
        )}
      </div>

      <div
        onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }}
        style={{ position: "absolute", top: 12, left: 16, pointerEvents: "auto", cursor: "pointer", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: muted ? "rgba(255,100,100,0.7)" : "rgba(100,255,100,0.7)", padding: "3px 8px", borderRadius: 4, fontSize: 10, fontFamily: "monospace", backdropFilter: "blur(4px)", userSelect: "none" }}>
        SOM: {muted ? "OFF" : "ON"}
      </div>
    </div>
  );
}

export default function TechDemo() {
  const [health, setHealth] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [fps, setFps] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [muted, setMuted] = useState(false);
  const [rainIntensity, setRainIntensity] = useState(1);
  const fpsRef = useRef({ frames: 0, last: performance.now() });
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const audioRef = useRef(null);

  useEffect(() => {
    const initAudio = () => {
      if (!audioRef.current) {
        const audio = createAudioSystem();
        audio.init();
        audioRef.current = audio;
      }
    };
    window.addEventListener("click", initAudio, { once: true });
    window.addEventListener("keydown", initAudio, { once: true });
    return () => {
      window.removeEventListener("click", initAudio);
      window.removeEventListener("keydown", initAudio);
      audioRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "KeyM") {
        if (audioRef.current) {
          const nowMuted = audioRef.current.toggleMute();
          setMuted(nowMuted);
        }
      }
      if (e.code === "Minus") {
        setRainIntensity((r) => Math.max(0.2, +(r - 0.2).toFixed(1)));
      }
      if (e.code === "Equal") {
        setRainIntensity((r) => Math.min(2, +(r + 0.2).toFixed(1)));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      const s = fpsRef.current; s.frames++;
      const now = performance.now();
      if (now - s.last >= 1000) { setFps(s.frames); s.frames = 0; s.last = now; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleCollect = useCallback(() => {
    setCollectedCount((prev) => {
      const next = prev + 1;
      if (next >= 5) setTimeout(() => setShowComplete(true), 600);
      return next;
    });
    audioRef.current?.playCollect();
  }, []);

  const handleToggleMute = useCallback(() => {
    if (audioRef.current) {
      const nowMuted = audioRef.current.toggleMute();
      setMuted(nowMuted);
    }
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", background: "#000" }}>
      <Canvas shadows camera={{ position: [0, 3, 8], fov: 55, near: 0.1, far: 60 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.8, outputColorSpace: THREE.SRGBColorSpace }}
        dpr={[1, 1.2]}>
        <Physics gravity={[0, -20, 0]}>
          <PhysicsGround />
          <ProceduralCity />
          <PlayerController setHealth={setHealth} setStamina={setStamina} playerPosRef={playerPosRef} audioRef={audioRef} />
          <Collectibles playerPosRef={playerPosRef} onCollect={handleCollect} />
        </Physics>
        <Atmosphere />
        <RainSystem intensity={rainIntensity} />
        <SmokeParticles />
        <SoftShadows samples={6} />
        <DemoEffects />
        <ContactShadows position={[0, -0.49, 0]} opacity={0.4} scale={50} blur={3} far={8} color="#000022" />
        <ambientLight intensity={0.08} color="#222244" />
      </Canvas>
      <DemoHUD
        health={health} stamina={stamina} fps={fps}
        collectedCount={collectedCount} totalCollectibles={5}
        muted={muted} showComplete={showComplete}
        onToggleMute={handleToggleMute}
      />
    </div>
  );
}
