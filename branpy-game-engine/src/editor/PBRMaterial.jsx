import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makeNormalMap, makeRoughnessMap, createProceduralEnvMap } from "../utils/proceduralAssets";

let sharedEnvMap = null;
let envMapPromise = null;

function getOrCreateEnvMap(gl) {
  if (sharedEnvMap) return sharedEnvMap;
  if (envMapPromise) return null;
  envMapPromise = new Promise((resolve) => {
    setTimeout(() => {
      sharedEnvMap = createProceduralEnvMap(gl, new THREE.Scene());
      resolve(sharedEnvMap);
    }, 0);
  });
  return null;
}

const normalMapCache = {};
const roughnessCache = {};

function getNormalMap(seed, size = 128) {
  const key = `${seed}_${size}`;
  if (!normalMapCache[key]) normalMapCache[key] = makeNormalMap(size, seed);
  return normalMapCache[key];
}

function getRoughnessMap(roughness) {
  const key = roughness.toFixed(2);
  if (!roughnessCache[key]) roughnessCache[key] = makeRoughnessMap(64, roughness);
  return roughnessCache[key];
}

export default function PBRMaterial({ obj }) {
  const { gl } = useThree();
  const envMap = useMemo(() => getOrCreateEnvMap(gl), [gl]);

  const normalMap = useMemo(() => {
    if (!obj) return null;
    if (obj.type === "plane") return getNormalMap(1, 128);
    if (obj.name?.toLowerCase().includes("ground") || obj.name?.toLowerCase().includes("road")) return getNormalMap(5, 128);
    if (obj.name?.toLowerCase().includes("building") || obj.name?.toLowerCase().includes("tower")) return getNormalMap(3, 64);
    return getNormalMap(2, 64);
  }, [obj?.type, obj?.name]);

  const roughnessMap = useMemo(() => {
    if (!obj) return null;
    return getRoughnessMap(obj.roughness ?? 0.6);
  }, [obj?.roughness]);

  const isMetallic = (obj?.metalness ?? 0.1) > 0.3;
  const name = obj?.name?.toLowerCase() || "";

  return (
    <meshPhysicalMaterial
      color={obj?.color || "#888888"}
      roughness={obj?.roughness ?? 0.6}
      metalness={obj?.metalness ?? (obj?.type === "sphere" ? 0.3 : 0.1)}
      emissive={obj?.emissive || "#000000"}
      emissiveIntensity={obj?.emissiveIntensity || 0}
      envMap={envMap}
      envMapIntensity={isMetallic ? 0.6 : 0.25}
      normalMap={normalMap}
      normalScale={new THREE.Vector2(0.5, 0.5)}
      roughnessMap={roughnessMap}
      clearcoat={name.includes("glass") || name.includes("gloss") ? 0.5 : 0}
      clearcoatRoughness={0.2}
      side={THREE.FrontSide}
    />
  );
}
