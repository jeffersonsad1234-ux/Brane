import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DATA_POSITIONS = [
  { pos: [-6, 1.2, -7], color: "#00ddff" },
  { pos: [5, 1.5, -14], color: "#ff00aa" },
  { pos: [-12, 1.8, -20], color: "#00ff88" },
  { pos: [14, 1, -24], color: "#ff8800" },
  { pos: [3, 1.3, -4], color: "#aa44ff" },
];

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(150,200,255,0.6)");
  g.addColorStop(0.5, "rgba(50,100,255,0.15)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function DataArtifact({ data, playerPosRef, onCollect }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const collectedRef = useRef(false);
  const glowTex = useMemo(() => createGlowTexture(), []);

  useFrame(({ clock }) => {
    if (collectedRef.current) {
      if (meshRef.current) meshRef.current.visible = false;
      if (glowRef.current) glowRef.current.visible = false;
      return;
    }
    if (meshRef.current) {
      meshRef.current.visible = true;
      meshRef.current.rotation.y = clock.elapsedTime * 0.8;
      meshRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.3;
      const pulse = 1 + 0.15 * Math.sin(clock.elapsedTime * 2);
      meshRef.current.scale.setScalar(pulse);
      meshRef.current.position.y =
        data.pos[1] + 0.15 * Math.sin(clock.elapsedTime * 1.5);
    }
    if (glowRef.current) {
      glowRef.current.visible = true;
      glowRef.current.material.opacity =
        0.3 + 0.15 * Math.sin(clock.elapsedTime * 2);
    }
    if (playerPosRef?.current) {
      const pp = playerPosRef.current;
      const dx = pp.x - data.pos[0];
      const dz = pp.z - data.pos[2];
      if (Math.sqrt(dx * dx + dz * dz) < 1.8 && !collectedRef.current) {
        collectedRef.current = true;
        onCollect();
      }
    }
  });

  return (
    <group ref={meshRef} position={data.pos}>
      <mesh castShadow>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <sprite ref={glowRef} scale={[1.2, 1.2, 1]}>
        <spriteMaterial
          map={glowTex}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  );
}

export default function Collectibles({ playerPosRef, onCollect }) {
  return (
    <group>
      {DATA_POSITIONS.map((d, i) => (
        <DataArtifact
          key={i}
          data={d}
          playerPosRef={playerPosRef}
          onCollect={onCollect}
        />
      ))}
    </group>
  );
}
