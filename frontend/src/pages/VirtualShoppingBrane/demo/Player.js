import * as THREE from "three";

const GRAVITY = -20;
const MOVE_SPEED = 5;
const SPRINT_SPEED = 9;
const JUMP_FORCE = 7;
const FRICTION = 8;
const EYE_HEIGHT = 1.4;

export default class Player {
  constructor(scene, getHeight) {
    this.scene = scene;
    this.getHeight = getHeight || (() => 0);
    this.mesh = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.grounded = false;
    this.sprinting = false;
    this.groundY = 0;
    this.walkTime = 0;
    this.ok = false;
    this.errorMsg = null;
  }

  init() {
    try {
      this.groundY = this.getHeight(0, 0);
      this.position.set(0, this.groundY, 0);

      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x4477cc,
        roughness: 0.4,
        metalness: 0.15,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.22), bodyMat);
      body.position.y = 0.55;
      body.castShadow = true;
      this.mesh.add(body);

      const headMat = new THREE.MeshStandardMaterial({
        color: 0xffccaa,
        roughness: 0.5,
      });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), headMat);
      head.position.y = 0.9;
      head.castShadow = true;
      this.mesh.add(head);

      // Arms
      const armMat = new THREE.MeshStandardMaterial({ color: 0x4477cc, roughness: 0.4 });
      for (const side of [-1, 1]) {
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.035, 0.3, 5),
          armMat
        );
        arm.position.set(side * 0.3, 0.6, 0);
        arm.rotation.z = side * 0.15;
        arm.castShadow = true;
        this.mesh.add(arm);
      }

      // Legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x223355, roughness: 0.6 });
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.04, 0.3, 5),
          legMat
        );
        leg.position.set(side * 0.1, 0.2, 0);
        leg.castShadow = true;
        this.mesh.add(leg);
      }

      this.mesh.position.copy(this.position);
      this.scene.add(this.mesh);
      this.ok = true;
    } catch (e) {
      this.errorMsg = "Falha ao criar jogador: " + e.message;
    }
    return this.ok;
  }

  update(dt, input, cameraYaw) {
    if (!this.ok) return;

    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    if (cameraYaw !== undefined) {
      forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
      right.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
    }

    this.sprinting = (input.isDown("ShiftLeft") || input.isDown("ShiftRight")) && this.grounded;
    const speed = this.sprinting ? SPRINT_SPEED : MOVE_SPEED;

    const moveVec = new THREE.Vector3();
    if (input.isDown("KeyW")) moveVec.add(forward);
    if (input.isDown("KeyS")) moveVec.sub(forward);
    if (input.isDown("KeyD")) moveVec.add(right);
    if (input.isDown("KeyA")) moveVec.sub(right);
    const moving = moveVec.length() > 0;
    if (moving) moveVec.normalize();

    const targetX = moveVec.x * speed;
    const targetZ = moveVec.z * speed;
    this.velocity.x += (targetX - this.velocity.x) * Math.min(1, FRICTION * dt);
    this.velocity.z += (targetZ - this.velocity.z) * Math.min(1, FRICTION * dt);

    if (input.justPressed("Space") && this.grounded) {
      this.velocity.y = JUMP_FORCE;
      this.grounded = false;
    }

    this.velocity.y += GRAVITY * dt;

    const newX = this.position.x + this.velocity.x * dt;
    const newZ = this.position.z + this.velocity.z * dt;
    const terrainY = this.getHeight(newX, newZ);
    const newY = this.position.y + this.velocity.y * dt;

    if (newY <= terrainY) {
      this.position.y = terrainY;
      this.velocity.y = 0;
      this.grounded = true;
    } else {
      this.position.y = newY;
      this.grounded = false;
    }

    this.position.x = newX;
    this.position.z = newZ;
    this.groundY = terrainY;

    // Walk animation
    if (this.grounded && moving) {
      this.walkTime += dt * (this.sprinting ? 8 : 5);
      const bob = Math.sin(this.walkTime) * 0.04;
      this.mesh.position.y = this.position.y + bob;
    } else {
      this.walkTime = 0;
      this.mesh.position.y = this.position.y;
    }

    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;
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
