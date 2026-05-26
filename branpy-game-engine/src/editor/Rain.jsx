import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Rain({ count = 2500, area = 25, height = 12 }) {
  const meshRef = useRef();
  const speed = useRef(0.4 + Math.random() * 0.15);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area;
      pos[i * 3 + 1] = Math.random() * height;
      pos[i * 3 + 2] = (Math.random() - 0.5) * area;
      vel[i] = 0.15 + Math.random() * 0.1;
    }
    return [pos, vel];
  }, [count, area, height]);

  useFrame(() => {
    if (!meshRef.current) return;
    const p = meshRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3 + 1] -= velocities[i];
      if (p[i * 3 + 1] < -2) {
        p[i * 3 + 1] = height;
        p[i * 3] = (Math.random() - 0.5) * area;
        p[i * 3 + 2] = (Math.random() - 0.5) * area;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8899bb"
        size={0.06}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
