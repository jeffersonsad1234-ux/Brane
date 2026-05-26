import React from "react";
import { Physics, RigidBody } from "@react-three/rapier";

export default function PhysicsWorld({ children }) {
  return (
    <Physics gravity={[0, -9.81, 0]} debug={false}>
      {children}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </RigidBody>
    </Physics>
  );
}
