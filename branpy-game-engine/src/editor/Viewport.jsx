import React, { useRef, useMemo, Suspense, lazy, useEffect, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls, ContactShadows, Html, SoftShadows, PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useEditorStore } from "@store/editorStore";
import Effects from "./Effects";
import PBRMaterial from "./PBRMaterial";
import SoundSystem from "../engine/systems/SoundSystem";

const Flashlight = lazy(() => import("./Flashlight"));
const FlickeringLight = lazy(() => import("./FlickeringLight"));
const WetGround = lazy(() => import("./WetGround"));
const Rain = lazy(() => import("./Rain"));

function SceneObject({ obj }) {
  const selected = useEditorStore((s) => s.selectedId === obj.id);
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
          distance={30} decay={1}
          castShadow shadow-mapSize={[256, 256]}
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
    <group>
      <mesh
        ref={meshRef}
        position={pos}
        rotation={rot}
        scale={scl}
        onClick={(e) => { e.stopPropagation(); setSelected(obj.id); }}
        castShadow receiveShadow
        visible={obj.visible !== false}
        frustumCulled
      >
        {obj.type === "cube" && <boxGeometry args={args} />}
        {obj.type === "sphere" && <sphereGeometry args={args} />}
        {obj.type === "plane" && <planeGeometry args={args} />}
        {obj.type === "cylinder" && <cylinderGeometry args={args} />}
        <PBRMaterial obj={obj} />
      </mesh>
      {/* Selection outline glow */}
      {selected && (
        <mesh position={pos} rotation={rot} scale={scl}>
          {obj.type === "cube" && <boxGeometry args={[args[0] * 1.05, args[1] * 1.05, args[2] * 1.05]} />}
          {obj.type === "sphere" && <sphereGeometry args={[args[0] * 1.07, args[1], args[2]]} />}
          {obj.type === "plane" && <planeGeometry args={[args[0] * 1.07, args[1] * 1.07]} />}
          {obj.type === "cylinder" && <cylinderGeometry args={[args[0] * 1.07, args[1] * 1.07, args[2], args[3]]} />}
          <meshBasicMaterial color="#818cf8" wireframe transparent opacity={0.3} depthWrite={false} />
        </mesh>
      )}
    </group>
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
  const snapEnabled = useEditorStore((s) => s.snapEnabled);
  const snapSize = useEditorStore((s) => s.snapSize);

  if (!obj || obj.type === "light" || obj.type === "camera") return null;

  const isRotate = mode === "rotate";
  const snap = isRotate
    ? [THREE.MathUtils.degToRad(snapSize * 45)]
    : [snapSize, snapSize, snapSize];

  return (
    <TransformControls
      mode={mode}
      object={null}
      showX showY showZ
      snap={snapEnabled ? snap : null}
      space={mode === "scale" ? "local" : "world"}
      size={0.6}
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

function FlickeringLightsWrapper() {
  const env = useEditorStore((s) => s.scene.environment);
  const objects = useEditorStore((s) => s.scene.objects);
  if (!env?.flickeringLights) return null;
  return objects
    .filter((o) => o.type === "light" && o.name?.toLowerCase().includes("flicker"))
    .map((o) => (
      <FlickeringLight key={o.id} position={o.position || [0, 0, 0]}
        color={o.color || "#ffaa33"} baseIntensity={o.intensity || 0.8} radius={12} />
    ));
}

function WetGroundWrapper() {
  const env = useEditorStore((s) => s.scene.environment);
  if (!env?.wetGround) return null;
  return <WetGround width={30} depth={30} color="#151520" />;
}

function RainWrapper() {
  const env = useEditorStore((s) => s.scene.environment);
  if (!env?.rain) return null;
  return <Rain count={3000} area={28} height={14} />;
}

function FlashlightWrapper() {
  const env = useEditorStore((s) => s.scene.environment);
  if (!env?.flashlight) return null;
  return <Flashlight intensity={1.8} angle={0.3} distance={18} color="#ffeedd" />;
}

function VolumetricFogLayer() {
  const env = useEditorStore((s) => s.scene.environment);
  if (!env?.volumetricFog) return null;
  const fogColor = env.fog?.color || "#0a0a14";
  return (
    <>
      <mesh position={[0, 0.5, -15]} rotation={[0, 0, 0]}>
        <planeGeometry args={[40, 15]} />
        <meshBasicMaterial color={fogColor} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.3, -8]} rotation={[0, 0, 0]}>
        <planeGeometry args={[25, 4]} />
        <meshBasicMaterial color="#111122" transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </>
  );
}

function FpsCam() {
  const fpsCam = useEditorStore((s) => s.fpsCam);
  const { camera } = useThree();

  useEffect(() => {
    if (!fpsCam) return;
    camera.position.set(0, 1.6, 5);
  }, [fpsCam]);

  if (!fpsCam) return null;
  return <PointerLockControls selector="#viewport-canvas" />;
}

export default function Viewport() {
  const scene = useEditorStore((s) => s.scene);
  const setSelected = useEditorStore((s) => s.setSelected);
  const fpsCam = useEditorStore((s) => s.fpsCam);
  const showGrid = useEditorStore((s) => s.showGrid);
  const env = scene.environment || {};
  const objects = scene.objects;

  const shadowRes = env.shadowQuality === "low" ? 256 : env.shadowQuality === "medium" ? 512 : 1024;
  const pixelRatio = env.pixelRatio ?? (env.qualityPreset === "performance" ? 0.75 : env.qualityPreset === "ultra" ? 1.5 : 1);

  const [fps, setFps] = useState(0);
  const fpsState = useRef({ frames: 0, last: performance.now() });

  useEffect(() => {
    let raf;
    const tick = () => {
      const s = fpsState.current;
      s.frames++;
      const now = performance.now();
      if (now - s.last >= 1000) {
        setFps(s.frames);
        s.frames = 0;
        s.last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="viewport" id="viewport-canvas">
      <Canvas
        shadows={env.shadows !== false}
        camera={{ position: [5, 4, 8], fov: 50, near: 0.1, far: 100 }}
        gl={{
          antialias: env.qualityPreset !== "performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: env.exposure ?? 0.7,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[pixelRatio, Math.min(pixelRatio * 1.5, 1.5)]}
        onPointerMissed={() => setSelected(null)}
      >
        <color attach="background" args={[env.background || "#030308"]} />
        <fog attach="fog" args={[env.fog?.color || "#0a0a14", env.fog?.near || 3, env.fog?.far || 16]} />

        {env.shadows !== false && <SoftShadows samples={env.shadowQuality === "low" ? 4 : 6} />}

        <ambientLight intensity={0.12} />
        <directionalLight position={[2, 20, -8]} intensity={0.4} castShadow shadow-mapSize={[shadowRes, shadowRes]} shadow-bias={-0.002} shadow-camera-far={35} />
        <directionalLight position={[-3, 6, -3]} intensity={0.08} />
        <hemisphereLight args={["#334466", "#0a0a15", 0.2]} />

        <SceneObjects />
        <TransformControlsWrapper />

        <Suspense fallback={null}>
          <WetGroundWrapper />
          <RainWrapper />
          <FlickeringLightsWrapper />
          <FlashlightWrapper />
        </Suspense>

        <VolumetricFogLayer />

        {showGrid && (
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
        )}

        {env.shadows !== false && (
          <ContactShadows position={[0, -0.49, 0]} opacity={0.35} scale={25} blur={3.5} far={6} color="#000022" />
        )}

        <Effects />
        <SoundSystem />

        {fpsCam ? <FpsCam /> : (
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={1}
            maxDistance={50}
            rotateSpeed={0.6}
            zoomSpeed={0.8}
            target={[0, 0.5, 0]}
          />
        )}
      </Canvas>

      {/* Viewport Toolbar Overlay */}
      <div className="viewport-toolbar">
        <button className="btn btn--sm" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)" }}
          title="Perspective">3D</button>
        <button className="btn btn--sm" style={{ opacity: 0.5 }} title="Top">Top</button>
        <button className="btn btn--sm" style={{ opacity: 0.5 }} title="Front">Front</button>
        <button className="btn btn--sm" style={{ opacity: 0.5 }} title="Right">Right</button>
        <div className="sep" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", marginLeft: 4 }}>{fpsCam ? "FPS" : "Orbit"}</span>
      </div>

      {/* Viewport Info Overlay */}
      <div className="viewport-info">
        <span>{fps} FPS</span>
        <span>{objects.length} objects</span>
        <span>ACES</span>
      </div>

      {/* Empty state hint */}
      {objects.length === 0 && (
        <div className="viewport-center-info">
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.2 }}>◇</div>
          <div>Empty scene — add objects from toolbar</div>
        </div>
      )}
    </div>
  );
}