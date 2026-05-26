import React, { useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls, ContactShadows, Environment, Html, SoftShadows } from "@react-three/drei";
import * as THREE from "three";
import { useEditorStore } from "@store/editorStore";
import Effects from "./Effects";
import Rain from "./Rain";

function SceneObject({ obj }) {
  const selected = useEditorStore((s) => s.selectedId === obj.id);
  const updateObject = useEditorStore((s) => s.updateObject);
  const setSelected = useEditorStore((s) => s.setSelected);
  const meshRef = useRef();

  const pos = useMemo(() => new THREE.Vector3(...(obj.position || [0, 0, 0])), [obj.position]);
  const rot = useMemo(() => new THREE.Euler(...(obj.rotation || [0, 0, 0])), [obj.rotation]);
  const scl = useMemo(() => new THREE.Vector3(...(obj.scale || [1, 1, 1])), [obj.scale]);

  if (obj.type === "light") {
    return (
      <group position={pos}>
        <mesh onClick={(e) => { e.stopPropagation(); setSelected(obj.id); }}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color={obj.color || "#ffffff"} />
        </mesh>
        <pointLight
          intensity={obj.intensity || 1}
          color={obj.color || "#ffffff"}
          distance={30}
          decay={1}
          castShadow
          shadow-mapSize={[512, 512]}
        />
        {selected && (
          <Html center>
            <div style={{ background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: 4, fontSize: 11, whiteSpace: "nowrap", color: "#e4e4e4" }}>{obj.name}</div>
          </Html>
        )}
      </group>
    );
  }

  if (obj.type === "camera") {
    return (
      <group position={pos} rotation={rot}>
        <mesh onClick={(e) => { e.stopPropagation(); setSelected(obj.id); }}>
          <boxGeometry args={[0.2, 0.2, 0.3]} />
          <meshBasicMaterial color={obj.color || "#10b981"} wireframe />
        </mesh>
        <mesh rotation={[0, 0, 0]} position={[0, 0, 0.2]}>
          <circleGeometry args={[0.12, 8]} />
          <meshBasicMaterial color={obj.color || "#10b981"} transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }

  const geo = { cube: [1, 1, 1], sphere: [0.5, 16, 12], plane: [1, 1], cylinder: [0.5, 0.5, 1, 12] };
  const args = geo[obj.type] || geo.cube;

  return (
    <mesh
      ref={meshRef}
      position={pos}
      rotation={rot}
      scale={scl}
      onClick={(e) => { e.stopPropagation(); setSelected(obj.id); }}
      castShadow
      receiveShadow
      visible={obj.visible !== false}
    >
      {obj.type === "cube" && <boxGeometry args={args} />}
      {obj.type === "sphere" && <sphereGeometry args={args} />}
      {obj.type === "plane" && <planeGeometry args={args} />}
      {obj.type === "cylinder" && <cylinderGeometry args={args} />}
      <meshStandardMaterial
        color={obj.color || "#888888"}
        roughness={obj.roughness ?? 0.6}
        metalness={obj.metalness ?? (obj.type === "sphere" ? 0.3 : 0.1)}
        emissive={obj.emissive || "#000000"}
        emissiveIntensity={obj.emissiveIntensity || 0}
        envMapIntensity={0.4}
      />
    </mesh>
  );
}

function SceneObjects() {
  const objects = useEditorStore((s) => s.scene.objects);
  return objects.map((obj) => <SceneObject key={obj.id} obj={obj} />);
}

function TransformControlsWrapper() {
  const selectedId = useEditorStore((s) => s.selectedId);
  const updateObject = useEditorStore((s) => s.updateObject);
  const obj = useEditorStore((s) => s.scene.objects.find((o) => o.id === s.selectedId));
  const mode = useEditorStore((s) => s.transformMode || "translate");

  if (!obj || obj.type === "light" || obj.type === "camera") return null;

  return (
    <TransformControls
      mode={mode}
      object={null}
      onObjectChange={() => {}}
      onChange={(e) => {
        if (e?.target?.object) {
          const m = e.target.object;
          updateObject(obj.id, {
            position: [m.position.x, m.position.y, m.position.z],
            rotation: [m.rotation.x, m.rotation.y, m.rotation.z],
            scale: [m.scale.x, m.scale.y, m.scale.z],
          });
        }
      }}
    />
  );
}

export default function Viewport() {
  const scene = useEditorStore((s) => s.scene);
  const setSelected = useEditorStore((s) => s.setSelected);
  const mode = useEditorStore((s) => s.mode);
  const env = scene.environment || {};

  const shadowRes = env.shadowQuality === "low" ? 512 : env.shadowQuality === "medium" ? 1024 : 2048;
  const pixelRatio = env.pixelRatio ?? (env.qualityPreset === "performance" ? 0.75 : env.qualityPreset === "ultra" ? 2 : 1);

  return (
    <div className="flex-1 relative">
      <Canvas
        shadows={env.shadows !== false}
        camera={{ position: [5, 4, 8], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMapping: env.toneMapping ?? 3, toneMappingExposure: env.exposure ?? 1.2 }}
        dpr={[pixelRatio, Math.min(pixelRatio * 1.5, 2)]}
        onPointerMissed={() => setSelected(null)}
      >
        <color attach="background" args={[env.background || "#0a0a0a"]} />
        <fog attach="fog" args={[env.fog?.color || "#0a0a0a", env.fog?.near || 20, env.fog?.far || 60]} />

        {env.shadows !== false && <SoftShadows samples={env.shadowQuality === "low" ? 4 : 8} />}

        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 12, 5]} intensity={0.6} castShadow shadow-mapSize={[shadowRes, shadowRes]} shadow-bias={-0.001} shadow-camera-far={30} />
        <directionalLight position={[-3, 6, -3]} intensity={0.2} />
        <hemisphereLight args={["#4466aa", "#111122", 0.3]} />

        <SceneObjects />
        <TransformControlsWrapper />

        <Grid
          position={[0, -0.01, 0]}
          args={[30, 30]}
          cellSize={1}
          cellThickness={0.6}
          cellColor="rgba(255,255,255,0.04)"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="rgba(255,255,255,0.08)"
          fadeDistance={40}
        />

        {env.volumetricFog && (
          <mesh position={[0, -1, -20]} rotation={[0, 0, 0]}>
            <planeGeometry args={[80, 40]} />
            <meshBasicMaterial color={env.fog?.color || "#0a0a12"} transparent opacity={0.6} depthWrite={false} />
          </mesh>
        )}

        {env.rain && <Rain count={3000} area={28} height={14} />}

        {env.shadows !== false && (
          <ContactShadows position={[0, -0.49, 0]} opacity={0.25} scale={25} blur={3} far={6} />
        )}

        <Effects />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={1}
          maxDistance={50}
        />
      </Canvas>

      {mode === "play" && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-2xl mb-2 opacity-30">🎮</div>
            <div className="text-sm opacity-40">Play mode · WASD move · Mouse look</div>
            <div className="text-xs opacity-30 mt-1">Press Esc to exit</div>
          </div>
        </div>
      )}
    </div>
  );
}
