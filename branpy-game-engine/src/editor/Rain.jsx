import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Rain({ count = 3000, area = 28, height = 14, wind = 0.15 }) {
  const meshRef = useRef();
  const splashRef = useRef();
  const speed = useRef(0.35 + Math.random() * 0.12);

  const [positions, velocities, offsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    const off = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area;
      pos[i * 3 + 1] = Math.random() * height;
      pos[i * 3 + 2] = (Math.random() - 0.5) * area;
      vel[i] = 0.12 + Math.random() * 0.08;
      off[i] = Math.random() * Math.PI * 2;
    }
    return [pos, vel, off];
  }, [count, area, height]);

  const splashCount = 800;
  const [splashPos, splashVel] = useMemo(() => {
    const pos = new Float32Array(splashCount * 3);
    const vel = new Float32Array(splashCount * 3);
    for (let i = 0; i < splashCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * area;
      pos[i * 3 + 1] = -0.45 + Math.random() * 0.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * area;
      vel[i * 3] = (Math.random() - 0.5) * 0.15;
      vel[i * 3 + 1] = 0.02 + Math.random() * 0.04;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    return [pos, vel];
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    const p = meshRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3 + 1] -= velocities[i] * speed.current;
      p[i * 3] += wind * 0.002;
      if (p[i * 3 + 1] < -1.5) {
        p[i * 3 + 1] = height;
        p[i * 3] = (Math.random() - 0.5) * area;
        p[i * 3 + 2] = (Math.random() - 0.5) * area;
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;

    if (splashRef.current) {
      const sp = splashRef.current.geometry.attributes.position.array;
      const sv = splashRef.current.geometry.attributes.velocity?.array;
      for (let i = 0; i < splashCount; i++) {
        if (sv) {
          sp[i * 3] += sv[i * 3];
          sp[i * 3 + 1] += sv[i * 3 + 1];
          sp[i * 3 + 2] += sv[i * 3 + 2];
          sv[i * 3 + 1] -= 0.003;
          if (sp[i * 3 + 1] < -0.5 || Math.abs(sp[i * 3]) > area / 2) {
            sp[i * 3] = (Math.random() - 0.5) * area;
            sp[i * 3 + 1] = -0.45;
            sp[i * 3 + 2] = (Math.random() - 0.5) * area;
            sv[i * 3] = (Math.random() - 0.5) * 0.15;
            sv[i * 3 + 1] = 0.02 + Math.random() * 0.04;
            sv[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
          }
        }
      }
      splashRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <points ref={meshRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          color="#7799bb"
          size={0.07}
          transparent
          opacity={0.45}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <points ref={splashRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={splashCount} array={splashPos} itemSize={3} />
          <bufferAttribute attach="attributes-velocity" count={splashCount} array={splashVel} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          color="#8899bb"
          size={0.025}
          transparent
          opacity={0.3}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
