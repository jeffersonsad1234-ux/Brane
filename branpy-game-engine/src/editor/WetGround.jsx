import React, { useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createProceduralEnvMap, makeWetNormalMap } from "../utils/proceduralAssets";

let sharedWetEnvMap = null;

function getWetEnvMap(gl) {
  if (sharedWetEnvMap) return sharedWetEnvMap;
  sharedWetEnvMap = createProceduralEnvMap(gl, new THREE.Scene());
  return sharedWetEnvMap;
}

export default function WetGround({ width = 30, depth = 30, color = "#151520" }) {
  const { gl } = useThree();
  const envMap = useMemo(() => getWetEnvMap(gl), [gl]);
  const normalMap = useMemo(() => makeWetNormalMap(256), []);

  const ref = useRef();

  return (
    <mesh
      ref={ref}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
    >
      <planeGeometry args={[width, depth]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.15}
        metalness={0.05}
        envMap={envMap}
        envMapIntensity={1.2}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.5, 0.5)}
        clearcoat={0.6}
        clearcoatRoughness={0.1}
        reflectivity={0.8}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}
