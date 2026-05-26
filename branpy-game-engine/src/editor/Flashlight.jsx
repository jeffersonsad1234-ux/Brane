import React, { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Flashlight({ intensity = 1.5, angle = 0.35, distance = 20, color = "#ffeedd" }) {
  const lightRef = useRef();
  const targetRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (!lightRef.current) return;
    const pos = new THREE.Vector3();
    camera.getWorldPosition(pos);
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    lightRef.current.position.copy(pos).add(fwd.clone().multiplyScalar(0.2));
    targetRef.current.position.copy(pos).add(fwd.clone().multiplyScalar(5));
    lightRef.current.target.updateMatrixWorld();
  });

  if (typeof document !== "undefined") {
    window.__flashlightPos = null;
  }

  return (
    <group>
      <spotLight
        ref={lightRef}
        args={[color, intensity, distance, angle, 0.4, 1.5]}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.002}
        target-position={[0, 0, -5]}
      />
      <mesh ref={targetRef} visible={false} />
    </group>
  );
}
