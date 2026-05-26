import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FlickeringLight({ position, color = "#ffaa33", baseIntensity = 0.8, radius = 10 }) {
  const ref = useRef();
  const time = useRef(Math.random() * 100);
  const speed = useMemo(() => 2 + Math.random() * 3, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    time.current += delta * speed;
    const flicker = Math.sin(time.current * 5) * 0.15 +
      Math.sin(time.current * 13.7) * 0.1 +
      Math.sin(time.current * 23.1) * 0.05;
    const spike = Math.random() < 0.03 ? 0 : 1;
    ref.current.intensity = baseIntensity * (0.6 + flicker + (spike === 0 ? -0.5 : 0));
  });

  return (
    <group position={position}>
      <pointLight
        ref={ref}
        color={color}
        intensity={baseIntensity}
        distance={radius}
        decay={1.5}
        castShadow
        shadow-mapSize={[256, 256]}
      />
    </group>
  );
}
