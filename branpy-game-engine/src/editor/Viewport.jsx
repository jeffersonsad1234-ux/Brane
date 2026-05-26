import React, { useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls, ContactShadows, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { useEditorStore } from "@store/editorStore";

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
  const Comp = obj.type === "plane" ? "mesh" : "mesh";
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
        roughness={0.6}
        metalness={obj.type === "sphere" ? 0.3 : 0.1}
        transparent={false}
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

  return (
    <div className="flex-1 relative">
      <Canvas
        shadows={scene.environment?.shadows !== false}
        camera={{ position: [5, 4, 8], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.2 }}
        dpr={[1, 2]}
        onPointerMissed={() => setSelected(null)}
      >
        <color attach="background" args={[scene.environment?.background || "#0a0a0a"]} />
        <fog attach="fog" args={[scene.environment?.fog?.color || "#0a0a0a", scene.environment?.fog?.near || 20, scene.environment?.fog?.far || 60]} />

        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 4, -3]} intensity={0.3} />

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

        {scene.environment?.shadows !== false && (
          <ContactShadows position={[0, -0.49, 0]} opacity={0.3} scale={20} blur={2.5} far={5} />
        )}

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
