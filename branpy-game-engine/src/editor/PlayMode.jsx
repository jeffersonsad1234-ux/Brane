import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CapsuleCollider } from "@react-three/rapier";
import { useEditorStore } from "@store/editorStore";
import * as THREE from "three";

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(150,200,255,0.6)");
  g.addColorStop(0.5, "rgba(50,100,255,0.15)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function ObjectGeo({ obj }) {
  const args = obj.scale || [1, 1, 1];
  switch (obj.type) {
    case "cube": return <boxGeometry args={args} />;
    case "sphere": return <sphereGeometry args={[args[0], 16, 12]} />;
    case "plane": return <planeGeometry args={[args[0], args[1]]} />;
    case "cylinder": return <cylinderGeometry args={[args[0], args[1] || args[0], args[2] || 1, 12]} />;
    case "capsule": return <capsuleGeometry args={[args[0] * 0.5, args[1] * 0.5, 4, 8]} />;
    default: return <boxGeometry args={[1, 1, 1]} />;
  }
}

function PhysicsObject({ obj }) {
  const pos = useMemo(() => new THREE.Vector3(...obj.position), [obj.position]);
  const rot = useMemo(() => new THREE.Euler(...obj.rotation), [obj.rotation]);
  const scl = useMemo(() => new THREE.Vector3(...obj.scale), [obj.scale]);
  return (
    <RigidBody type="fixed" position={pos} rotation={rot} colliders="cuboid">
      <mesh scale={scl} castShadow receiveShadow>
        <ObjectGeo obj={obj} />
        <meshStandardMaterial color={obj.color} roughness={obj.roughness ?? 0.6} metalness={obj.metalness ?? 0.1} />
      </mesh>
    </RigidBody>
  );
}

function PlayerController({ startPos, audioRef, playerPosRef }) {
  const ref = useRef();
  const { camera } = useThree();
  const keys = useRef({ forward: false, backward: false, left: false, right: false, jump: false, sprint: false });
  const canJump = useRef(true);
  const [stamina, setStamina] = useState(100);
  const footstepTimer = useRef(0);

  useEffect(() => {
    const down = (e) => {
      switch (e.code) {
        case "KeyW": keys.current.forward = true; break;
        case "KeyS": keys.current.backward = true; break;
        case "KeyA": keys.current.left = true; break;
        case "KeyD": keys.current.right = true; break;
        case "Space": if (canJump.current) { keys.current.jump = true; canJump.current = false; } break;
        case "ShiftLeft": case "ShiftRight": keys.current.sprint = true; break;
      }
    };
    const up = (e) => {
      switch (e.code) {
        case "KeyW": keys.current.forward = false; break;
        case "KeyS": keys.current.backward = false; break;
        case "KeyA": keys.current.left = false; break;
        case "KeyD": keys.current.right = false; break;
        case "Space": keys.current.jump = false; canJump.current = true; break;
        case "ShiftLeft": case "ShiftRight": keys.current.sprint = false; break;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const body = ref.current;
    const k = keys.current;
    const speed = k.sprint && stamina > 0 ? 6 : 3.5;
    const dir = new THREE.Vector3();
    if (k.forward) dir.z -= 1;
    if (k.backward) dir.z += 1;
    if (k.left) dir.x -= 1;
    if (k.right) dir.x += 1;

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const forward = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const vel = body.linvel();
    vel.x = forward.x * dir.z + right.x * dir.x;
    vel.z = forward.z * dir.z + right.z * dir.x;

    if (k.jump && canJump.current) {
      vel.y = 4;
      canJump.current = false;
    }
    body.setLinvel(vel, true);

    if (k.sprint && stamina > 0) {
      setStamina((s) => Math.max(0, s - 15 * delta));
    } else {
      setStamina((s) => Math.min(100, s + 10 * delta));
    }

    const p = body.translation();
    if (playerPosRef?.current) playerPosRef.current.set(p.x, p.y, p.z);
    const ideal = new THREE.Vector3(p.x, p.y + 1.6, p.z + 4);
    camera.position.lerp(ideal, 5 * delta);
    camera.lookAt(p.x, p.y + 1.2, p.z);

    const isMoving = k.forward || k.backward || k.left || k.right;
    const onGround = canJump.current && Math.abs(vel.y) < 0.1;
    if (isMoving && onGround) {
      footstepTimer.current += delta;
      if (footstepTimer.current >= (k.sprint ? 0.28 : 0.45)) {
        footstepTimer.current = 0;
      }
    } else {
      footstepTimer.current = 0.3;
    }
  });

  return (
    <RigidBody ref={ref} position={startPos} colliders={false} enabledRotations={[false, false, false]} mass={1} friction={0}>
      <CapsuleCollider args={[0.3, 0.5]} position={[0, 0.8, 0]} />
      <group>
        <mesh position={[0, 1.1, 0]} castShadow>
          <capsuleGeometry args={[0.25, 0.35, 8, 8]} />
          <meshStandardMaterial color="#4488ff" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.7, 0]} castShadow>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#ffccaa" />
        </mesh>
        <mesh position={[0.15, 1.65, 0.15]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#222" />
        </mesh>
        <mesh position={[-0.15, 1.65, 0.15]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#222" />
        </mesh>
      </group>
    </RigidBody>
  );
}

function CollectibleItem({ data, playerPosRef, onCollect }) {
  const ref = useRef();
  const glowRef = useRef();
  const collectedRef = useRef(false);
  const glowTex = useMemo(() => createGlowTexture(), []);

  useFrame(({ clock }) => {
    if (collectedRef.current) {
      if (ref.current) ref.current.visible = false;
      if (glowRef.current) glowRef.current.visible = false;
      return;
    }
    if (ref.current) {
      ref.current.visible = true;
      ref.current.rotation.y = clock.elapsedTime * 0.8;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.5) * 0.3;
      const pulse = 1 + 0.15 * Math.sin(clock.elapsedTime * 2);
      ref.current.scale.setScalar(pulse);
    }
    if (glowRef.current) {
      glowRef.current.visible = true;
      glowRef.current.material.opacity = 0.3 + 0.15 * Math.sin(clock.elapsedTime * 2);
    }
    if (playerPosRef?.current) {
      const pp = playerPosRef.current;
      const dx = pp.x - data.pos[0];
      const dz = pp.z - data.pos[2];
      if (Math.sqrt(dx * dx + dz * dz) < 1.8 && !collectedRef.current) {
        collectedRef.current = true;
        onCollect();
      }
    }
  });

  return (
    <group ref={ref} position={data.pos}>
      <mesh castShadow>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={2} roughness={0.2} metalness={0.8} />
      </mesh>
      <sprite ref={glowRef} scale={[1, 1, 1]}>
        <spriteMaterial map={glowTex} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

export default function PlayMode({ onCollect }) {
  const scene = useEditorStore((s) => s.scene);
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 0));

  const physicalObjects = useMemo(() =>
    scene.objects.filter((o) => ["cube", "sphere", "plane", "cylinder"].includes(o.type) && !o.collectible && !o.player),
  [scene.objects]);

  const collectibles = useMemo(() =>
    scene.objects.filter((o) => o.collectible),
  [scene.objects]);

  const playerObj = useMemo(() =>
    scene.objects.find((o) => o.player),
  [scene.objects]);

  const lights = useMemo(() =>
    scene.objects.filter((o) => o.type === "light" || o.type === "spotlight"),
  [scene.objects]);

  const playerStart = playerObj ? playerObj.position : [0, 0.8, 0];

  const handleCollect = useCallback(() => {
    onCollect?.();
  }, [onCollect]);

  return (
    <>
      <ambientLight intensity={0.08} color="#222244" />
      <hemisphereLight args={["#334466", "#0a0a15", 0.15]} />
      <Physics gravity={[0, -20, 0]}>
        {physicalObjects.map((obj) => (
          <PhysicsObject key={obj.id} obj={obj} />
        ))}

        {collectibles.map((c, i) => (
          <CollectibleItem
            key={c.id || i}
            data={{ pos: c.position, color: c.emissive || c.color }}
            playerPosRef={playerPosRef}
            onCollect={handleCollect}
          />
        ))}

        <PlayerController startPos={playerStart} audioRef={null} playerPosRef={playerPosRef} />
      </Physics>

      {lights.map((l) => (
        l.type === "spotlight" ? (
          <spotLight
            key={l.id}
            position={l.position}
            rotation={l.rotation || [0, 0, 0]}
            intensity={l.intensity || 2}
            color={l.color || "#ffffff"}
            angle={l.angle || 0.4}
            penumbra={l.penumbra || 0.3}
            distance={l.distance || 20}
            castShadow
          />
        ) : (
          <pointLight
            key={l.id}
            position={l.position}
            intensity={l.intensity || 1}
            color={l.color || "#ffffff"}
            distance={30}
          />
        )
      ))}
    </>
  );
}
