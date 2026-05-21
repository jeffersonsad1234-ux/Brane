import * as THREE from "three";

const GRAVITY = -20;
const MOVE_SPEED = 5;
const SPRINT_SPEED = 9;
const JUMP_FORCE = 7;
const FRICTION = 8;

export default class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.position = new THREE.Vector3(0, 1, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.grounded = false;
    this.sprinting = false;
    this.ok = false;
    this.errorMsg = null;
  }

  init() {
    try {
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.3, metalness: 0.2 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), bodyMat);
      body.position.y = 0.3;
      this.mesh.add(body);

      const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), headMat);
      head.position.y = 0.7;
      this.mesh.add(head);

      this.mesh.position.copy(this.position);
      this.scene.add(this.mesh);
      this.ok = true;
    } catch (e) {
      this.errorMsg = "Falha ao criar jogador: " + e.message;
    }
    return this.ok;
  }

  update(dt, input) {
    if (!this.ok) return;

    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    this.sprinting = input.isDown("ShiftLeft") || input.isDown("ShiftRight");
    const speed = this.sprinting ? SPRINT_SPEED : MOVE_SPEED;

    const moveVec = new THREE.Vector3();
    if (input.isDown("KeyW")) moveVec.add(forward);
    if (input.isDown("KeyS")) moveVec.sub(forward);
    if (input.isDown("KeyD")) moveVec.add(right);
    if (input.isDown("KeyA")) moveVec.sub(right);
    if (moveVec.length() > 0) moveVec.normalize();

    const targetX = moveVec.x * speed;
    const targetZ = moveVec.z * speed;
    this.velocity.x += (targetX - this.velocity.x) * Math.min(1, FRICTION * dt);
    this.velocity.z += (targetZ - this.velocity.z) * Math.min(1, FRICTION * dt);

    if (input.justPressed("Space") && this.grounded) {
      this.velocity.y = JUMP_FORCE;
      this.grounded = false;
    }

    this.velocity.y += GRAVITY * dt;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    if (this.position.y <= 1) {
      this.position.y = 1;
      this.velocity.y = 0;
      this.grounded = true;
    }

    this.mesh.position.copy(this.position);
  }

  dispose() {
    try {
      this.scene.remove(this.mesh);
      this.mesh.traverse((child) => {
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
    this.ok = false;
  }
}
