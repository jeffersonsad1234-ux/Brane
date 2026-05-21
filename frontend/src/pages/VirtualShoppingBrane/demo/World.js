import * as THREE from "three";

function rng(min, max) {
  return min + Math.random() * (max - min);
}

export default class World {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.ok = false;
    this.errorMsg = null;
  }

  init() {
    try {
      this._buildGround();
      this._buildBoundary();
      this._buildTrees();
      this._buildRocks();
      this._buildHouses();
      this._buildCars();
      this._buildRoad();
      this.ok = true;
    } catch (e) {
      this.errorMsg = "Falha ao construir mundo: " + e.message;
      this._fallback();
    }
    return this.ok;
  }

  _fallback() {
    try {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({ color: 0x445533, roughness: 1 })
      );
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = -0.01;
      this.scene.add(plane);
      this.objects.push(plane);
      this.ok = true;
    } catch {}
  }

  _buildGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x2a4a1a, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.objects.push(ground);
  }

  _buildBoundary() {
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x222244, transparent: true, opacity: 0.3, side: THREE.BackSide });
    const size = 30;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(size * 2, 5, size * 2), wallMat);
    wall.position.y = 2.5;
    this.scene.add(wall);
    this.objects.push(wall);
  }

  _buildRoad() {
    for (let z = -30; z <= 30; z += 1.5) {
      const seg = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 1 })
      );
      seg.rotation.x = -Math.PI / 2;
      seg.position.set(0, 0.01, z);
      this.scene.add(seg);
      this.objects.push(seg);
    }
  }

  _buildTrees() {
    for (let i = 0; i < 25; i++) {
      try {
        const x = rng(-25, 25);
        const z = rng(-25, 25);
        if (Math.abs(x) < 3 && Math.abs(z) < 25) continue;
        this._addTree(x, z, rng(0.7, 1.3));
      } catch {}
    }
  }

  _addTree(x, z, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * s, 0.1 * s, 0.6 * s, 5),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 })
    );
    trunk.position.y = 0.3 * s;
    g.add(trunk);

    const fol = new THREE.Mesh(
      new THREE.ConeGeometry(0.4 * s, 0.6 * s, 6),
      new THREE.MeshStandardMaterial({ color: 0x226622, roughness: 0.8 })
    );
    fol.position.y = 0.6 * s + 0.3 * s;
    g.add(fol);

    const fol2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.3 * s, 0.4 * s, 6),
      new THREE.MeshStandardMaterial({ color: 0x338833, roughness: 0.8 })
    );
    fol2.position.y = 0.6 * s + 0.6 * s;
    g.add(fol2);

    g.position.set(x, 0, z);
    this.scene.add(g);
    this.objects.push(g);
  }

  _buildRocks() {
    for (let i = 0; i < 15; i++) {
      try {
        const x = rng(-25, 25);
        const z = rng(-25, 25);
        if (Math.abs(x) < 3 && Math.abs(z) < 25) continue;
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(rng(0.15, 0.35), 0),
          new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.9 })
        );
        rock.position.set(x, rng(0.1, 0.2), z);
        rock.rotation.set(rng(-1, 1), rng(-1, 1), rng(-1, 1));
        this.scene.add(rock);
        this.objects.push(rock);
      } catch {}
    }
  }

  _buildHouses() {
    const positions = [
      { x: -10, z: -14, r: 0.3 },
      { x: 12, z: -8, r: -0.5 },
      { x: -14, z: 12, r: 0.8 },
      { x: 12, z: 16, r: -0.2 },
    ];
    for (const p of positions) {
      try { this._addHouse(p.x, p.z, p.r); } catch {}
    }
  }

  _addHouse(x, z, rot) {
    const g = new THREE.Group();
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 3),
      new THREE.MeshStandardMaterial({ color: 0x554444, roughness: 0.95 })
    );
    wall.position.y = 1;
    g.add(wall);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.2, 1, 4),
      new THREE.MeshStandardMaterial({ color: 0x663322, roughness: 0.9 })
    );
    roof.position.y = 2 + 0.5;
    roof.rotation.y = Math.PI / 4;
    g.add(roof);

    g.position.set(x, 0, z);
    g.rotation.y = rot;
    this.scene.add(g);
    this.objects.push(g);
  }

  _buildCars() {
    const data = [
      { x: -2, z: -20, r: 0.1 },
      { x: 5, z: 18, r: -0.3 },
    ];
    for (const c of data) {
      try { this._addCar(c.x, c.z, c.r); } catch {}
    }
  }

  _addCar(x, z, rot) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.35, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x883333, roughness: 0.6, metalness: 0.2 })
    );
    body.position.y = 0.2;
    g.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.2, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.4 })
    );
    cabin.position.set(-0.1, 0.38, 0);
    g.add(cabin);

    for (const [wx, wz] of [[-0.5, -0.45], [-0.5, 0.45], [0.5, -0.45], [0.5, 0.45]]) {
      const w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.06, 6),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 })
      );
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.04, wz);
      g.add(w);
    }

    g.position.set(x, 0, z);
    g.rotation.y = rot;
    this.scene.add(g);
    this.objects.push(g);
  }

  dispose() {
    for (const obj of this.objects) {
      try {
        this.scene.remove(obj);
        obj.traverse((child) => {
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
    this.objects = [];
  }
}
