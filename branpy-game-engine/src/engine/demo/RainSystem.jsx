import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 2500;
const SPREAD = 45;

function RainDrops({ intensity }) {
  const meshRef = useRef();
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD;
      pos[i * 3 + 1] = Math.random() * 16;
      pos[i * 3 + 2] = -(Math.random() * 38) + 1;
      vel[i] = 10 + Math.random() * 8;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array;
    const wind = 0.3;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] += delta * (Math.sin(i * 0.3) * 0.15 + wind);
      pos[i * 3 + 1] -= delta * velocities[i] * intensity;
      pos[i * 3 + 2] += delta * Math.cos(i * 0.7) * 0.1;
      if (pos[i * 3 + 1] < -0.5) {
        pos[i * 3] = (Math.random() - 0.5) * SPREAD;
        pos[i * 3 + 1] = 14 + Math.random() * 3;
        pos[i * 3 + 2] = -(Math.random() * 38) + 1;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#8899cc"
        transparent
        opacity={Math.min(0.35 * intensity, 0.6)}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function WetGroundReflection({ intensity }) {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.material.opacity =
      0.12 * intensity + 0.04 * Math.sin(clock.elapsedTime * 0.4);
  });
  return (
    <mesh
      ref={meshRef}
      position={[0, -0.46, -10]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[40, 45]} />
      <meshStandardMaterial
        color="#0a0a18"
        roughness={0.05}
        metalness={0.15}
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

export default function RainSystem({ intensity = 1 }) {
  return (
    <group>
      <RainDrops intensity={intensity} />
      <WetGroundReflection intensity={intensity} />
    </group>
  );
}
