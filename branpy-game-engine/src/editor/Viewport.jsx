import React, { useRef, useMemo, Suspense, lazy, useEffect, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls, ContactShadows, Html, SoftShadows, PointerLockControls, Sky } from "@react-three/drei";
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
        <pointLight intensity={obj.intensity || 1} color={obj.color || "#ffffff"} distance={30} decay={1}
          castShadow shadow-mapSize={[256, 256]} />
        {selected && (
          <Html center>
            <div style={{ background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: 4, fontSize: 11, whiteSpace: "nowrap", color: "#e4e4e4" }}>{obj.name}</div>
          </Html>
        )}
      </group>
    );
  }

  if (obj.type === "spotlight") {
    const angle = obj.angle || 0.4;
    return (
      <group position={pos} rotation={rot}>
        <mesh onClick={(e) => { e.stopPropagation(); setSelected(obj.id); }}>
          <coneGeometry args={[0.15, 0.25, 8]} />
          <meshBasicMaterial color={obj.color || "#ffdd44"} />
        </mesh>
        <spotLight intensity={obj.intensity || 2} color={obj.color || "#ffdd44"}
          angle={angle} penumbra={obj.penumbra || 0.3} distance={obj.distance || 20} decay={1.5}
          castShadow shadow-mapSize={[256, 256]} target-position={[0, -1, 0]} />
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

  const getGeo = () => {
    if (obj.type === "capsule") {
      return <capsuleGeometry args={[0.5, 0.5, 4, 8]} />;
    }
    const geo = { cube: [1, 1, 1], sphere: [0.5, 16, 12], plane: [1, 1], cylinder: [0.5, 0.5, 1, 12] };
    const args = geo[obj.type] || geo.cube;
    if (obj.type === "cube") return <boxGeometry args={args} />;
    if (obj.type === "sphere") return <sphereGeometry args={args} />;
    if (obj.type === "plane") return <planeGeometry args={args} />;
    if (obj.type === "cylinder") return <cylinderGeometry args={args} />;
    return <boxGeometry args={args} />;
  };

  const getOutlineGeo = () => {
    const t = obj.type;
    if (t === "capsule") return <capsuleGeometry args={[0.5 * 1.05, 0.5 * 1.05, 4, 8]} />;
    const geo = { cube: [1, 1, 1], sphere: [0.5, 16, 12], plane: [1, 1], cylinder: [0.5, 0.5, 1, 12] };
    const args = geo[t] || geo.cube;
    if (t === "cube") return <boxGeometry args={[args[0] * 1.05, args[1] * 1.05, args[2] * 1.05]} />;
    if (t === "sphere") return <sphereGeometry args={[args[0] * 1.07, args[1], args[2]]} />;
    if (t === "plane") return <planeGeometry args={[args[0] * 1.07, args[1] * 1.07]} />;
    if (t === "cylinder") return <cylinderGeometry args={[args[0] * 1.07, args[1] * 1.07, args[2], args[3]]} />;
    return <boxGeometry args={[1.05, 1.05, 1.05]} />;
  };

  return (
    <group>
      <mesh ref={meshRef} position={pos} rotation={rot} scale={scl}
        onClick={(e) => { e.stopPropagation(); setSelected(obj.id); }}
        castShadow receiveShadow visible={obj.visible !== false} frustumCulled>
        {getGeo()}
        <PBRMaterial obj={obj} />
      </mesh>
      {selected && (
        <mesh position={pos} rotation={rot} scale={scl}>
          {getOutlineGeo()}
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
  if (!obj || obj.type === "light" || obj.type === "camera" || obj.type === "spotlight") return null;
  const isRotate = mode === "rotate";
  const snap = isRotate ? [THREE.MathUtils.degToRad(snapSize * 45)] : [snapSize, snapSize, snapSize];
  return (
    <TransformControls mode={mode} object={null} showX showY showZ
      snap={snapEnabled ? snap : null}
      space={mode === "scale" ? "local" : "world"} size={0.6}
      onChange={(e) => {
        if (e?.target?.object) {
          const m = e.target.object;
          updateObject(obj.id, { position: [m.position.x, m.position.y, m.position.z], rotation: [m.rotation.x, m.rotation.y, m.rotation.z], scale: [m.scale.x, m.scale.y, m.scale.z] });
        }
      }} />
  );
}

function FlickeringLightsWrapper() {
  const env = useEditorStore((s) => s.scene.environment);
  const objects = useEditorStore((s) => s.scene.objects);
  if (!env?.flickeringLights) return null;
  return objects.filter((o) => o.type === "light" && o.name?.toLowerCase().includes("flicker"))
    .map((o) => <FlickeringLight key={o.id} position={o.position || [0, 0, 0]} color={o.color || "#ffaa33"} baseIntensity={o.intensity || 0.8} radius={12} />);
}

function WetGroundWrapper() {
  const env = useEditorStore((s) => s.scene.environment);
  if (!env?.wetGround || !env?.rain) return null;
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

function ProceduralSkybox() {
  const env = useEditorStore((s) => s.scene.environment);
  const bg = env.background || "#0a0a12";
  const isDark = bg === "#030308" || bg === "#0a0a12" || bg === "#0a0a0a" || bg === "#000";
  if (isDark) {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[80, 16, 16]} />
          <meshBasicMaterial color="#050510" side={THREE.BackSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[78, 16, 16]} />
          <meshBasicMaterial color="#080818" side={THREE.BackSide} transparent opacity={0.3} />
        </mesh>
      </group>
    );
  }
  return <Sky distance={100} sunPosition={[10, 20, -10]} inclination={0.6} azimuth={0.25} turbidity={8} rayleigh={2} />;
}

function FpsCam() {
  const fpsCam = useEditorStore((s) => s.fpsCam);
  const { camera } = useThree();
  useEffect(() => { if (fpsCam) camera.position.set(0, 1.6, 5); }, [fpsCam]);
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
      const s = fpsState.current; s.frames++;
      const now = performance.now();
      if (now - s.last >= 1000) { setFps(s.frames); s.frames = 0; s.last = now; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const [orbitTarget] = useState(() => new THREE.Vector3(0, 0.5, 0));

  return (
    <div className="viewport" id="viewport-canvas">
      <Canvas shadows={env.shadows !== false}
        camera={{ position: [5, 4, 8], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: env.qualityPreset !== "performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: env.exposure ?? 0.7, outputColorSpace: THREE.SRGBColorSpace }}
        dpr={[pixelRatio, Math.min(pixelRatio * 1.5, 1.5)]}
        onPointerMissed={() => setSelected(null)}>
        <color attach="background" args={[env.background || "#030308"]} />
        <fog attach="fog" args={[env.fog?.color || "#0a0a14", env.fog?.near || 3, env.fog?.far || 16]} />

        <ProceduralSkybox />

        {env.shadows !== false && <SoftShadows samples={env.shadowQuality === "low" ? 4 : 6} />}

        <ambientLight intensity={0.15} />
        <directionalLight position={[8, 20, -5]} intensity={0.5} castShadow shadow-mapSize={[shadowRes, shadowRes]} shadow-bias={-0.002} shadow-camera-far={35} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-camera-left={-15} shadow-camera-right={15} />
        <directionalLight position={[-5, 8, -5]} intensity={0.1} color="#4466aa" />
        <hemisphereLight args={["#334466", "#0a0a15", 0.15]} />

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
          <Grid position={[0, -0.01, 0]} args={[30, 30]}
            cellSize={1} cellThickness={0.4} cellColor="rgba(255,255,255,0.03)"
            sectionSize={5} sectionThickness={0.8} sectionColor="rgba(255,255,255,0.06)"
            fadeDistance={30} fadeStrength={1.5} infiniteGrid />
        )}

        {env.shadows !== false && (
          <ContactShadows position={[0, -0.49, 0]} opacity={0.3} scale={25} blur={4} far={6} color="#000022" />
        )}

        <Effects />
        <SoundSystem />

        {fpsCam ? <FpsCam /> : (
          <OrbitControls makeDefault enableDamping dampingFactor={0.1}
            minDistance={0.5} maxDistance={60} rotateSpeed={0.5} zoomSpeed={1}
            minPolarAngle={0} maxPolarAngle={Math.PI / 2.05}
            target={orbitTarget} />
        )}
      </Canvas>

      <div className="viewport-toolbar">
        <button className="btn btn--sm" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)" }} title="Perspective">3D</button>
        <button className="btn btn--sm" style={{ opacity: 0.5 }} title="Top">Top</button>
        <span className="sep" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", marginLeft: 4 }}>{fpsCam ? "FPS" : "Orbit"}</span>
      </div>

      <div className="viewport-info">
        <span>{fps} FPS</span>
        <span>{objects.length} objs</span>
        <span>ACES</span>
      </div>

      {objects.length === 0 && (
        <div className="viewport-center-info">
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.2 }}>◇</div>
          <div>Empty scene — add objects from toolbar</div>
        </div>
      )}
    </div>
  );
}
