import * as THREE from "three";

export function makePlayer(scene) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.5, flatShading: true });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.6, 8), bodyMat);
  body.position.y = 0.8; g.add(body);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, roughness: 0.3, flatShading: true });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), headMat);
  head.position.y = 1.3; head.scale.set(1, 0.9, 0.85); g.add(head);
  const eMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eMat);
  e1.position.set(-0.08, 1.33, -0.18); g.add(e1);
  const e2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eMat);
  e2.position.set(0.08, 1.33, -0.18); g.add(e2);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xaa66ff, roughness: 0.3, flatShading: true });
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 8), hatMat);
  hat.position.y = 1.52; g.add(hat);
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.03, 8), hatMat);
  hatBrim.position.y = 1.44; g.add(hatBrim);
  const armMat = new THREE.MeshStandardMaterial({ color: 0xffcc88, roughness: 0.4, flatShading: true });
  const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 6), armMat);
  lArm.position.set(-0.3, 0.8, 0); lArm.rotation.z = 0.15; g.add(lArm);
  const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.45, 6), armMat);
  rArm.position.set(0.3, 0.8, 0); rArm.rotation.z = -0.15; g.add(rArm);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x3355aa, roughness: 0.5, flatShading: true });
  const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.4, 6), legMat);
  lLeg.position.set(-0.1, 0.25, 0); g.add(lLeg);
  const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.4, 6), legMat);
  rLeg.position.set(0.1, 0.25, 0); g.add(rLeg);
  g.position.set(0, 0, 0);
  scene.add(g);
  return { group: g, body, head, lArm, rArm, lLeg, rLeg };
}

export function makeShadow() {
  const c = document.createElement("canvas"); c.width = 32; c.height = 32;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0,"rgba(0,0,0,0.35)"); g.addColorStop(0.5,"rgba(0,0,0,0.12)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  s.scale.set(1.2, 1.2, 1);
  return s;
}
