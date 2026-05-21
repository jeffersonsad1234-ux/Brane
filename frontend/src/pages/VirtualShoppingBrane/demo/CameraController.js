import * as THREE from "three";

export default class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3();
    this.offset = new THREE.Vector3(6, 4, 6);
    this.lookOffset = new THREE.Vector3(0, 1, 0);
    this.smoothSpeed = 4;
    this.angle = Math.PI / 4;
    this.distance = 8;
    this.height = 4;
    this.ok = true;
  }

  follow(position) {
    this.target.copy(position);
  }

  update(dt) {
    if (!this.ok) return;

    const idealPos = new THREE.Vector3(
      this.target.x + Math.sin(this.angle) * this.distance,
      this.target.y + this.height,
      this.target.z + Math.cos(this.angle) * this.distance
    );

    this.camera.position.lerp(idealPos, Math.min(1, this.smoothSpeed * dt));
    this.camera.lookAt(
      this.target.x + this.lookOffset.x,
      this.target.y + this.lookOffset.y,
      this.target.z + this.lookOffset.z
    );
  }

  dispose() {
    this.ok = false;
  }
}
