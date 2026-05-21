import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

// ─── CONSTANTS ───────────────────────────────────────────
const GRAVITY = -22;
const PLAYER_HEIGHT = 1.6;
const PLAYER_SPEED = 5;
const SPRINT_SPEED = 8.5;
const JUMP_FORCE = 6.5;
const SLIDE_DURATION = 0.35;
const STAMINA_MAX = 100;
const STAMINA_DRAIN = 18;
const STAMINA_REGEN = 9;
const ZOMBIE_SPEED = 2.8;
const ZOMBIE_DAMAGE = 6;
const ZOMBIE_ATTACK_RANGE = 1.8;
const SURVIVE_TIME = 180;
const MAP_SIZE = 50;

// ─── HELPERS ─────────────────────────────────────────────
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ─── SCENE BUILDER ───────────────────────────────────────
function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a0a0a);
  scene.fog = new THREE.FogExp2(0x1a0a0a, 0.008);

  const amb = new THREE.AmbientLight(0x443366, 0.4);
  scene.add(amb);

  const hemi = new THREE.HemisphereLight(0xff8844, 0x442222, 0.35);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xff8833, 1.6);
  sun.position.set(-15, 25, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x4488ff, 0.3);
  fill.position.set(10, 10, -10);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xff6644, 0.4);
  rim.position.set(0, 5, -20);
  scene.add(rim);

  // Sun glow
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff8833, transparent: true, opacity: 0.15 })
  );
  sunGlow.position.set(-30, 35, 20);
  scene.add(sunGlow);

  return scene;
}

function buildGround(scene) {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_SIZE * 2, MAP_SIZE * 2),
    new THREE.MeshStandardMaterial({
      color: 0x2a3a1a,
      roughness: 0.9,
      metalness: 0.0,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Dirt patches
  for (let i = 0; i < 30; i++) {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(randomRange(0.5, 2), 6),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(randomRange(-MAP_SIZE, MAP_SIZE), 0.01, randomRange(-MAP_SIZE, MAP_SIZE));
    scene.add(patch);
  }
}

function buildRoad(scene) {
  // Main road
  for (let z = -MAP_SIZE; z <= MAP_SIZE; z += 2) {
    const seg = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 1 })
    );
    seg.rotation.x = -Math.PI / 2;
    seg.position.set(0, 0.02, z);
    seg.receiveShadow = true;
    scene.add(seg);
  }

  // Road markings (center dashed line)
  for (let z = -MAP_SIZE; z <= MAP_SIZE; z += 4) {
    if ((z + MAP_SIZE) % 8 < 4) continue;
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 1.5),
      new THREE.MeshBasicMaterial({ color: 0x888855, transparent: true, opacity: 0.5 })
    );
    mark.rotation.x = -Math.PI / 2;
    mark.position.set(0, 0.03, z);
    scene.add(mark);
  }
}

function createTree(x, z, s) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 0.7 * s, 5),
    new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 })
  );
  trunk.position.y = 0.35 * s;
  trunk.castShadow = true;
  g.add(trunk);

  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(0.5 * s, 0.7 * s, 6),
    new THREE.MeshStandardMaterial({ color: 0x226622, roughness: 0.8 })
  );
  foliage.position.y = 0.7 * s + 0.35 * s;
  foliage.castShadow = true;
  g.add(foliage);

  const fol2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.35 * s, 0.5 * s, 6),
    new THREE.MeshStandardMaterial({ color: 0x338833, roughness: 0.8 })
  );
  fol2.position.y = 0.7 * s + 0.7 * s;
  fol2.castShadow = true;
  g.add(fol2);

  g.position.set(x, 0, z);
  return g;
}

function buildTrees(scene) {
  for (let i = 0; i < 50; i++) {
    const x = randomRange(-MAP_SIZE + 5, MAP_SIZE - 5);
    const z = randomRange(-MAP_SIZE + 5, MAP_SIZE - 5);
    if (Math.abs(x) < 3 && Math.abs(z) < 60) continue;
    const s = randomRange(0.7, 1.5);
    const tree = createTree(x, z, s);
    scene.add(tree);
  }
}

function createRock(x, z, s) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(s * 0.3, 0),
    new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.9, metalness: 0.1 })
  );
  rock.position.set(x, s * 0.15, z);
  rock.rotation.set(randomRange(-1, 1), randomRange(-1, 1), randomRange(-1, 1));
  rock.scale.y = randomRange(0.5, 0.8);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

function buildRocks(scene) {
  for (let i = 0; i < 25; i++) {
    const x = randomRange(-MAP_SIZE + 3, MAP_SIZE - 3);
    const z = randomRange(-MAP_SIZE + 3, MAP_SIZE - 3);
    if (Math.abs(x) < 3 && Math.abs(z) < 60) continue;
    const rock = createRock(x, z, randomRange(0.5, 1.2));
    scene.add(rock);
  }
}

function createHouse(x, z, rotation) {
  const g = new THREE.Group();

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x554444, roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.2, 3.5), wallMat);
  wall.position.y = 1.1;
  wall.castShadow = true;
  wall.receiveShadow = true;
  g.add(wall);

  // Roof
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.6, 1.2, 4),
    new THREE.MeshStandardMaterial({ color: 0x663322, roughness: 0.9 })
  );
  roof.position.y = 2.2 + 0.6;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // Door opening (dark panel)
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.8),
    new THREE.MeshBasicMaterial({ color: 0x222211 })
  );
  door.position.set(0, 0.4, 1.76);
  g.add(door);

  // Broken window
  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.3),
    new THREE.MeshBasicMaterial({ color: 0x446688, transparent: true, opacity: 0.3 })
  );
  win.position.set(-0.8, 1.2, 1.76);
  g.add(win);

  // Damage cracks (random debris nearby)
  for (let i = 0; i < 4; i++) {
    const debris = new THREE.Mesh(
      new THREE.BoxGeometry(randomRange(0.05, 0.15), randomRange(0.02, 0.06), randomRange(0.05, 0.15)),
      new THREE.MeshStandardMaterial({ color: 0x665544, roughness: 1 })
    );
    debris.position.set(randomRange(-0.8, 0.8), 0.03, randomRange(-1.2, -0.5));
    debris.rotation.set(randomRange(-0.5, 0.5), 0, randomRange(-0.5, 0.5));
    g.add(debris);
  }

  g.position.set(x, 0, z);
  g.rotation.y = rotation;
  return g;
}

function buildHouses(scene) {
  const positions = [
    { x: -12, z: -18, r: 0.3 },
    { x: 15, z: -10, r: -0.5 },
    { x: -18, z: 14, r: 0.8 },
    { x: 14, z: 20, r: -0.2 },
  ];
  for (const p of positions) {
    const house = createHouse(p.x, p.z, p.r);
    scene.add(house);
    // Rubble piles
    for (let i = 0; i < 5; i++) {
      const rubble = new THREE.Mesh(
        new THREE.BoxGeometry(randomRange(0.1, 0.3), randomRange(0.05, 0.15), randomRange(0.1, 0.3)),
        new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 1 })
      );
      rubble.position.set(
        p.x + randomRange(-1, 1),
        0.05,
        p.z + randomRange(-1, 1)
      );
      rubble.rotation.set(randomRange(-1, 1), randomRange(-1, 1), randomRange(-1, 1));
      scene.add(rubble);
    }
  }
}

function createCar(x, z, rotation) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x883333, roughness: 0.6, metalness: 0.3 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.9), bodyMat);
  body.position.y = 0.25;
  body.castShadow = true;
  g.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.25, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.5 })
  );
  cabin.position.set(-0.1, 0.45, 0);
  g.add(cabin);

  // Wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 });
  for (const [wx, wz] of [[-0.6, -0.5], [-0.6, 0.5], [0.6, -0.5], [0.6, 0.5]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6), wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.08, wz);
    g.add(wheel);
  }

  g.position.set(x, 0, z);
  g.rotation.y = rotation;
  return g;
}

function buildCars(scene) {
  const carData = [
    { x: -3, z: -30, r: 0.1 },
    { x: 4, z: 22, r: -0.3 },
    { x: -20, z: 0, r: 1.2 },
  ];
  for (const c of carData) {
    const car = createCar(c.x, c.z, c.r);
    scene.add(car);
  }
}

function buildGrass(scene) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x44aa44,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 200; i++) {
    const x = randomRange(-MAP_SIZE + 2, MAP_SIZE - 2);
    const z = randomRange(-MAP_SIZE + 2, MAP_SIZE - 2);
    if (Math.abs(x) < 3 && Math.abs(z) < 60) continue;
    const blade = new THREE.Mesh(
      new THREE.PlaneGeometry(0.04, randomRange(0.1, 0.3)),
      mat
    );
    blade.position.set(x, 0.05, z);
    blade.rotation.set(randomRange(-0.2, 0.2), randomRange(-3, 3), randomRange(-0.2, 0.2));
    scene.add(blade);
  }
}

// ─── ZOMBIE ──────────────────────────────────────────────
function createZombieMesh() {
  const g = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x556644, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x667755, roughness: 0.7 });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), bodyMat);
  torso.position.y = 0.6;
  torso.castShadow = true;
  g.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), skinMat);
  head.position.y = 0.95;
  head.castShadow = true;
  g.add(head);

  // Eyes (red glow)
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    eye.position.set(side * 0.08, 0.97, 0.12);
    g.add(eye);
  }

  // Arms
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.35, 4),
      bodyMat
    );
    arm.position.set(side * 0.3, 0.65, 0);
    arm.rotation.z = side * 0.3;
    g.add(arm);
  }

  // Legs
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.35, 4),
      bodyMat
    );
    leg.position.set(side * 0.1, 0.25, 0);
    g.add(leg);
  }

  // Blood stain
  const blood = new THREE.Mesh(
    new THREE.PlaneGeometry(0.15, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x661111, transparent: true, opacity: 0.6 })
  );
  blood.position.set(0, 0.7, 0.14);
  g.add(blood);

  return g;
}

// ─── SURVIVAL DEMO COMPONENT ────────────────────────────
export default function SurvivalDemo({ onClose }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    phase: "loading",
    health: 100,
    stamina: STAMINA_MAX,
    timeLeft: SURVIVE_TIME,
    zombiesAlive: ZOMBIE_COUNT,
    gameOver: false,
    victory: false,
    started: false,
  });
  const [hud, setHud] = useState({
    health: 100,
    stamina: STAMINA_MAX,
    timeLeft: SURVIVE_TIME,
    zombiesAlive: ZOMBIE_COUNT,
    phase: "loading",
    gameOver: false,
    victory: false,
  });

  const updateHud = useCallback(() => {
    const s = stateRef.current;
    setHud({
      health: Math.max(0, Math.round(s.health)),
      stamina: Math.max(0, Math.round(s.stamina)),
      timeLeft: Math.max(0, Math.ceil(s.timeLeft)),
      zombiesAlive: s.zombiesAlive,
      phase: s.phase,
      gameOver: s.gameOver,
      victory: s.victory,
    });
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let disposed = false;
    let animId = null;
    let controls = null;

    try {
      // ── Renderer ──
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.8;
      container.appendChild(renderer.domElement);

      // ── Scene ──
      const scene = buildScene();
      buildGround(scene);
      buildRoad(scene);
      buildTrees(scene);
      buildRocks(scene);
      buildHouses(scene);
      buildCars(scene);
      buildGrass(scene);

      // ── Camera ──
      const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(0, PLAYER_HEIGHT, 0);

      const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);

      // ── Controls ──
      controls = new PointerLockControls(camera, renderer.domElement);

      // ── Player state ──
      const player = {
        position: new THREE.Vector3(0, PLAYER_HEIGHT, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        yaw: 0,
        pitch: 0,
        grounded: false,
        sprinting: false,
        sliding: false,
        slideTimer: 0,
        stamina: STAMINA_MAX,
        health: 100,
        crouching: false,
      };

      // ── Keys ──
      const keys = { w: false, a: false, s: false, d: false, shift: false, space: false, ctrl: false };

      const onKeyDown = (e) => {
        if (disposed) return;
        switch (e.code) {
          case "KeyW": keys.w = true; break;
          case "KeyA": keys.a = true; break;
          case "KeyS": keys.s = true; break;
          case "KeyD": keys.d = true; break;
          case "ShiftLeft": case "ShiftRight": keys.shift = true; break;
          case "Space": keys.space = true; if (!disposed && controls && !controls.isLocked) e.preventDefault(); break;
          case "ControlLeft": case "ControlRight": keys.ctrl = true; break;
        }
      };
      const onKeyUp = (e) => {
        switch (e.code) {
          case "KeyW": keys.w = false; break;
          case "KeyA": keys.a = false; break;
          case "KeyS": keys.s = false; break;
          case "KeyD": keys.d = false; break;
          case "ShiftLeft": case "ShiftRight": keys.shift = false; break;
          case "Space": keys.space = false; break;
          case "ControlLeft": case "ControlRight": keys.ctrl = false; break;
        }
      };
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);

      // Click to lock pointer
      const onClick = () => {
        if (controls && !controls.isLocked && !stateRef.current.gameOver && !stateRef.current.victory) {
          controls.lock();
        }
      };
      container.addEventListener("click", onClick);

      // ── Zombies ──
      const zombies = [];
      for (let i = 0; i < ZOMBIE_COUNT; i++) {
        const mesh = createZombieMesh();
        let angle, dist;
        do {
          angle = Math.random() * Math.PI * 2;
          dist = randomRange(12, 22);
        } while (dist < 10);
        const zx = Math.cos(angle) * dist;
        const zz = Math.sin(angle) * dist;
        mesh.position.set(zx, 0, zz);
        scene.add(mesh);

        zombies.push({
          mesh,
          position: new THREE.Vector3(zx, 0, zz),
          velocity: new THREE.Vector3(),
          hp: 100,
          alive: true,
          animTime: Math.random() * 10,
          bobOffset: Math.random() * 3,
        });
      }

      // ── Physics ──
      const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 2);

      function checkGround(pos) {
        raycaster.ray.origin.copy(pos);
        raycaster.ray.origin.y += 0.1;
        const hits = raycaster.intersectObjects(scene.children, true);
        for (const hit of hits) {
          if (hit.distance > 0.05 && hit.distance < 1.8) {
            return { grounded: true, y: hit.point.y + PLAYER_HEIGHT };
          }
        }
        return { grounded: false, y: pos.y };
      }

      // ── Game loop ──
      let lastTime = performance.now();
      let gameTimer = 0;

      const animate = (now) => {
        if (disposed) return;
        animId = requestAnimationFrame(animate);

        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        const s = stateRef.current;
        const locked = controls && controls.isLocked;

        if (s.phase === "loading") {
          s.phase = "playing";
          updateHud();
        }

        if (s.phase === "playing" && !s.gameOver && !s.victory) {
          gameTimer += dt;
          s.timeLeft = SURVIVE_TIME - gameTimer;

          if (s.timeLeft <= 0) {
            s.victory = true;
            s.phase = "victory";
            if (controls) controls.unlock();
            updateHud();
          }

          // ── Player input ──
          player.sprinting = keys.shift && (keys.w || keys.s) && player.stamina > 0 && player.grounded && !player.sliding;
          if (player.sprinting) {
            player.stamina = Math.max(0, player.stamina - STAMINA_DRAIN * dt);
          } else if (player.stamina < STAMINA_MAX) {
            player.stamina = Math.min(STAMINA_MAX, player.stamina + STAMINA_REGEN * dt);
          }
          s.stamina = player.stamina;

          // Slide
          if (keys.ctrl && player.grounded && player.sprinting && !player.sliding) {
            player.sliding = true;
            player.slideTimer = 0;
          }
          if (player.sliding) {
            player.slideTimer += dt;
            if (player.slideTimer > SLIDE_DURATION) player.sliding = false;
          }

          // Movement direction
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          forward.y = 0;
          forward.normalize();
          const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          right.y = 0;
          right.normalize();

          const speed = player.sprinting ? SPRINT_SPEED : player.sliding ? SPRINT_SPEED * 0.8 : PLAYER_SPEED;

          const moveVec = new THREE.Vector3();
          if (keys.w) moveVec.add(forward);
          if (keys.s) moveVec.sub(forward);
          if (keys.d) moveVec.add(right);
          if (keys.a) moveVec.sub(right);
          if (moveVec.length() > 0) moveVec.normalize();

          // Apply movement
          const targetVelX = moveVec.x * speed;
          const targetVelZ = moveVec.z * speed;
          player.velocity.x = lerp(player.velocity.x, targetVelX, 10 * dt);
          player.velocity.z = lerp(player.velocity.z, targetVelZ, 10 * dt);

          // Jump
          if (keys.space && player.grounded && !player.sliding) {
            player.velocity.y = JUMP_FORCE;
            player.grounded = false;
          }

          // Gravity
          player.velocity.y += GRAVITY * dt;

          // Apply
          player.position.x += player.velocity.x * dt;
          player.position.y += player.velocity.y * dt;
          player.position.z += player.velocity.z * dt;

          // Ground check
          const gc = checkGround(player.position);
          if (gc.grounded && player.velocity.y < 0) {
            player.position.y = gc.y;
            player.velocity.y = 0;
            player.grounded = true;
          } else {
            player.grounded = false;
          }

          // Keep in bounds
          const boundary = MAP_SIZE - 2;
          player.position.x = Math.max(-boundary, Math.min(boundary, player.position.x));
          player.position.z = Math.max(-boundary, Math.min(boundary, player.position.z));

          // Update camera
          camera.position.copy(player.position);

          // Speed FOV effect
          const currentSpeed = Math.sqrt(player.velocity.x ** 2 + player.velocity.z ** 2);
          const targetFov = 70 + (currentSpeed / SPRINT_SPEED) * 8;
          camera.fov = lerp(camera.fov, targetFov, 4 * dt);
          camera.updateProjectionMatrix();

          // ── Zombies ──
          for (const z of zombies) {
            if (!z.alive) continue;
            z.animTime += dt;

            const dx = player.position.x - z.position.x;
            const dz = player.position.z - z.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 30) {
              // Chase
              const targetAngle = Math.atan2(dx, dz);
              const moveSpeed = dist < 5 ? ZOMBIE_SPEED * 1.3 : ZOMBIE_SPEED;
              z.velocity.x += Math.sin(targetAngle) * moveSpeed * dt * 2;
              z.velocity.z += Math.cos(targetAngle) * moveSpeed * dt * 2;
              z.velocity.x *= 0.95;
              z.velocity.z *= 0.95;

              z.position.x += z.velocity.x * dt;
              z.position.z += z.velocity.z * dt;

              // Rotate towards player
              z.mesh.rotation.y = -targetAngle + Math.PI;

              // Damage player on contact
              if (dist < ZOMBIE_ATTACK_RANGE) {
                player.health -= ZOMBIE_DAMAGE * dt;
                s.health = player.health;
                if (player.health <= 0) {
                  player.health = 0;
                  s.health = 0;
                  s.gameOver = true;
                  s.phase = "gameover";
                  if (controls) controls.unlock();
                  updateHud();
                }
              }
            }

            // Zombie bob animation
            const bob = Math.sin(z.animTime * 4 + z.bobOffset) * 0.04;
            z.mesh.position.x = z.position.x;
            z.mesh.position.y = bob;
            z.mesh.position.z = z.position.z;

            // Arm swing
            const arms = z.mesh.children.filter(c => c.geometry.type === "CylinderGeometry" && c.position.y > 0.5 && c.position.y < 0.8);
            for (const arm of arms) {
              const swing = Math.sin(z.animTime * 6 + z.bobOffset) * 0.3;
              arm.rotation.x = swing;
            }
          }

          // Count alive zombies
          s.zombiesAlive = zombies.filter(z => z.alive).length;
          updateHud();
        }

        // ── Render ──
        renderer.render(scene, camera);
      };

      // Start
      stateRef.current.phase = "loading";
      updateHud();
      animId = requestAnimationFrame(animate);

      // ── Cleanup ──
      return () => {
        disposed = true;
        if (animId) cancelAnimationFrame(animId);
        if (controls) controls.unlock();
        document.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("keyup", onKeyUp);
        container.removeEventListener("click", onClick);
        window.removeEventListener("resize", onResize);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
        scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });
      };
    } catch (err) {
      console.error("[SurvivalDemo] Init failed:", err);
      stateRef.current.phase = "error";
      updateHud();
      return () => { disposed = true; };
    }
  }, [updateHud]);

  const handleRestart = () => {
    window.location.reload();
  };

  const handleStart = () => {
    const container = mountRef.current;
    if (container) container.click();
  };

  return (
    <div className="sd-root">
      <div ref={mountRef} className="sd-canvas" />

      {/* HUD */}
      {hud.phase === "playing" && !hud.gameOver && !hud.victory && (
        <div className="sd-hud">
          <div className="sd-hud-top">
            <div className="sd-hud-item">
              <div className="sd-hud-label">❤️ VIDA</div>
              <div className="sd-hud-bar"><div className="sd-hud-fill health" style={{ width: `${hud.health}%` }} /></div>
              <div className="sd-hud-value">{hud.health}</div>
            </div>
            <div className="sd-hud-item">
              <div className="sd-hud-label">⚡ STAMINA</div>
              <div className="sd-hud-bar"><div className="sd-hud-fill stamina" style={{ width: `${hud.stamina}%` }} /></div>
              <div className="sd-hud-value">{hud.stamina}</div>
            </div>
          </div>
          <div className="sd-hud-center">
            <div className="sd-crosshair">+</div>
          </div>
          <div className="sd-hud-bottom">
            <div className="sd-hud-objective">
              <span>🧟 {hud.zombiesAlive} zumbis</span>
              <span className="sd-hud-sep">|</span>
              <span>⏱ {Math.floor(hud.timeLeft / 60)}:{(hud.timeLeft % 60).toString().padStart(2, "0")}</span>
              <span className="sd-hud-sep">|</span>
              <span>Sobreviva 3 minutos</span>
            </div>
          </div>
        </div>
      )}

      {/* Click to play overlay */}
      {hud.phase === "loading" && (
        <div className="sd-loading">
          <div className="sd-loading-spinner" />
          <p>Iniciando sobrevivência...</p>
        </div>
      )}

      {hud.phase === "error" && (
        <div className="sd-loading">
          <p style={{ color: "#ee4455", fontSize: "1.1rem" }}>❌ Erro ao iniciar a demo.</p>
          <p style={{ color: "#888", fontSize: ".85rem", marginTop: 8 }}>WebGL pode não estar disponível.</p>
          <button className="bs-btn bs-btn-primary" onClick={onClose} style={{ marginTop: 16 }}>Voltar</button>
        </div>
      )}

      {/* Game Over */}
      {hud.gameOver && (
        <div className="sd-overlay">
          <div className="sd-overlay-content">
            <div className="sd-overlay-icon">💀</div>
            <h2>GAME OVER</h2>
            <p>Os zumbis te pegaram.</p>
            <div className="sd-overlay-buttons">
              <button className="bs-btn bs-btn-primary" onClick={handleRestart}>🔄 Reiniciar</button>
              <button className="bs-btn bs-btn-secondary" onClick={onClose}>✕ Fechar Demo</button>
            </div>
          </div>
        </div>
      )}

      {/* Victory */}
      {hud.victory && (
        <div className="sd-overlay">
          <div className="sd-overlay-content">
            <div className="sd-overlay-icon victory">🏆</div>
            <h2 style={{ color: "#44cc88" }}>VITÓRIA!</h2>
            <p>Você sobreviveu 3 minutos no apocalipse!</p>
            <div className="sd-overlay-buttons">
              <button className="bs-btn bs-btn-primary" onClick={handleRestart}>🔄 Jogar Novamente</button>
              <button className="bs-btn bs-btn-secondary" onClick={onClose}>✕ Fechar Demo</button>
            </div>
          </div>
        </div>
      )}

      {/* Close button (always visible) */}
      <button className="sd-close-btn" onClick={onClose}>✕ Fechar Demo</button>
    </div>
  );
}
