import * as THREE from "three";

const ZOMBIE_SPEED = 2.5;
const CHASE_RANGE = 30;
const ATTACK_RANGE = 1.8;
const DAMAGE_PER_SEC = 5;

function rng(min, max) {
  return min + Math.random() * (max - min);
}

function createZombieMesh() {
  const g = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x667744,
    roughness: 0.8,
  });
  const clothMat = new THREE.MeshStandardMaterial({
    color: 0x442222,
    roughness: 0.9,
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.22), clothMat);
  torso.position.y = 0.5;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), skinMat);
  head.position.y = 0.85;
  head.castShadow = true;
  g.add(head);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xff3300 })
    );
    eye.position.set(side * 0.06, 0.87, 0.11);
    g.add(eye);
  }

  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.035, 0.3, 4),
      skinMat
    );
    arm.position.set(side * 0.25, 0.55, 0);
    arm.rotation.z = side * 0.3;
    g.add(arm);
  }

  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.04, 0.25, 4),
      clothMat
    );
    leg.position.set(side * 0.08, 0.18, 0);
    g.add(leg);
  }

  return g;
}

export default class EnemyManager {
  constructor(scene, playerGetter, getHeight) {
    this.scene = scene;
    this.getPlayerPos = playerGetter;
    this.getHeight = getHeight || (() => 0);
    this.enemies = [];
    this.ok = false;
    this.errorMsg = null;
  }

  init(count = 5) {
    try {
      for (let i = 0; i < count; i++) {
        const mesh = createZombieMesh();

        let x, z, h;
        let attempts = 0;
        do {
          const angle = Math.random() * Math.PI * 2;
          const dist = rng(10, 20);
          x = Math.cos(angle) * dist;
          z = Math.sin(angle) * dist;
          h = this.getHeight(x, z);
          attempts++;
        } while (attempts < 20 && Math.abs(x) < 4 && Math.abs(z) < 4);

        mesh.position.set(x, h, z);
        mesh.castShadow = true;
        this.scene.add(mesh);

        this.enemies.push({
          mesh,
          x,
          z,
          y: h,
          hp: 100,
          alive: true,
          animTime: Math.random() * 10,
          bobOffset: Math.random() * 3,
          speed: rng(2.0, 3.0),
        });
      }
      this.ok = true;
    } catch (e) {
      this.errorMsg = "Falha ao criar zumbis: " + e.message;
    }
    return this.ok;
  }

  update(dt) {
    if (!this.ok) return;

    const playerPos = this.getPlayerPos();
    let damage = 0;

    for (const z of this.enemies) {
      if (!z.alive) continue;
      z.animTime += dt;

      const dx = playerPos.x - z.x;
      const dz = playerPos.z - z.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < CHASE_RANGE) {
        const moveDir = dist > 0.1 ? 1 / dist : 0;
        const speed = dist < 5 ? z.speed * 1.2 : z.speed;

        z.x += dx * moveDir * speed * dt;
        z.z += dz * moveDir * speed * dt;

        const terrainY = this.getHeight(z.x, z.z);
        z.y = terrainY;

        const targetAngle = Math.atan2(dx, dz);
        z.mesh.rotation.y = -targetAngle + Math.PI;
      }

      // Bob
      const bob = Math.sin(z.animTime * 5 + z.bobOffset) * 0.035;
      z.mesh.position.set(z.x, z.y + bob, z.z);

      // Arm swing
      z.mesh.children.forEach((child) => {
        if (child.geometry && child.geometry.type === "CylinderGeometry" && child.position.y > 0.4 && child.position.y < 0.7) {
          child.rotation.x = Math.sin(z.animTime * 6 + z.bobOffset) * 0.4;
        }
      });

      // Damage
      if (dist < ATTACK_RANGE) {
        damage += DAMAGE_PER_SEC * dt;
      }
    }

    return damage;
  }

  getAliveCount() {
    return this.enemies.filter((z) => z.alive).length;
  }

  dispose() {
    for (const z of this.enemies) {
      try {
        this.scene.remove(z.mesh);
        z.mesh.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      } catch {}
    }
    this.enemies = [];
    this.ok = false;
  }
}
