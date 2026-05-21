import * as THREE from "three";

export default class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
    this.idealPosition = new THREE.Vector3();

    this.distance = 8;
    this.height = 3.5;
    this.lookHeight = 1.2;

    this.vel = new THREE.Vector3();
    this.springStiffness = 5;
    this.springDamping = 3.5;

    this.angle = 0.25;
    this.ok = true;
  }

  follow(position, velocity) {
    this.target.copy(position);
    if (velocity && velocity.length() > 0.5) {
      const lookAhead = velocity.clone().normalize().multiplyScalar(1.2);
      this.lookTarget.copy(position).add(lookAhead);
    } else {
      this.lookTarget.copy(position);
    }
    this.lookTarget.y += this.lookHeight;
  }

  update(dt) {
    if (!this.ok) return;

    const targetY = this.target.y + this.height;
    const minY = this.target.y + 1.5;

    this.idealPosition.set(
      this.target.x + Math.sin(this.angle) * this.distance,
      Math.max(targetY, minY),
      this.target.z + Math.cos(this.angle) * this.distance
    );

    const disp = new THREE.Vector3().copy(this.idealPosition).sub(this.camera.position);
    this.vel.add(disp.clone().multiplyScalar(this.springStiffness * dt));
    this.vel.multiplyScalar(1 / (1 + this.springDamping * dt));
    this.camera.position.add(this.vel.clone().multiplyScalar(dt));

    this.camera.lookAt(this.lookTarget);
  }

  dispose() {
    this.ok = false;
  }
}
