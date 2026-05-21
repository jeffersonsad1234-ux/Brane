import * as THREE from "three";

export default class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    this.idealPosition = new THREE.Vector3();

    this.distance = 7;
    this.height = 3.5;
    this.lookHeight = 1.2;

    // Spring parameters
    this.vel = new THREE.Vector3();
    this.springStiffness = 6;
    this.springDamping = 4;

    this.angle = 0.3;
    this.ok = true;
  }

  follow(position, velocity) {
    this.target.copy(position);
    // Look-ahead: shift target slightly in movement direction
    if (velocity && velocity.length() > 0.1) {
      const lookAhead = velocity.clone().normalize().multiplyScalar(1.5);
      this.lookTarget.copy(position).add(lookAhead);
    } else {
      this.lookTarget.copy(position);
    }
    this.lookTarget.y += this.lookHeight;
  }

  update(dt) {
    if (!this.ok) return;

    // Calculate ideal camera position
    this.idealPosition.set(
      this.target.x + Math.sin(this.angle) * this.distance,
      this.target.y + this.height,
      this.target.z + Math.cos(this.angle) * this.distance
    );

    // Spring-damper toward ideal position
    const disp = new THREE.Vector3().copy(this.idealPosition).sub(this.camera.position);
    this.vel.add(disp.clone().multiplyScalar(this.springStiffness * dt));
    this.vel.multiplyScalar(1 / (1 + this.springDamping * dt));
    this.camera.position.add(this.vel.clone().multiplyScalar(dt));

    // Look at target (with look-ahead)
    this.camera.lookAt(this.lookTarget);
  }

  dispose() {
    this.ok = false;
  }
}
