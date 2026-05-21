import * as THREE from "three";

function rng(min, max) {
  return min + Math.random() * (max - min);
}

// Simple pseudo-noise for terrain height
function hash(x, z) {
  let h = x * 374761393 + z * 668265263;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff;
}

function smoothNoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const v00 = hash(ix, iz), v10 = hash(ix + 1, iz);
  const v01 = hash(ix, iz + 1), v11 = hash(ix + 1, iz + 1);
  return v00 + (v10 - v00) * sx + ((v01 + (v11 - v01) * sx) - (v00 + (v10 - v00) * sx)) * sz;
}

function fbm(x, z, octaves) {
  let val = 0, amp = 1, freq = 1, maxAmp = 0;
  for (let i = 0; i < octaves; i++) {
    val += smoothNoise(x * freq, z * freq) * amp;
    maxAmp += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val / maxAmp;
}

function terrainHeight(x, z) {
  return (fbm(x * 0.04 + 5.3, z * 0.04 + 2.7, 4) - 0.5) * 0.8;
}

export default class World {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.grassMesh = null;
    this.ok = false;
    this.errorMsg = null;
  }

  init() {
    try {
      this._buildTerrain();
      this._buildBoundary();
      this._buildRoad();
      this._buildGrass();
      this._buildTrees();
      this._buildRocks();
      this._buildHouses();
      this._buildCars();
      this._buildDebris();
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

  getHeightAt(x, z) {
    return terrainHeight(x, z);
  }

  // ─── TERRAIN ──────────────────────────────────────────
  _buildTerrain() {
    const segs = 40;
    const size = 50;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);

      // Vertex color: dirt on road area, grass elsewhere
      const nearRoad = Math.abs(x) < 2.5;
      const hNorm = (h + 0.4) / 0.8;
      const grassG = 0.25 + hNorm * 0.2;
      const grassR = 0.15 + hNorm * 0.15;
      if (nearRoad) {
        // Dirt/mud near road
        colors[i * 3] = 0.25 + Math.random() * 0.08;
        colors[i * 3 + 1] = 0.18 + Math.random() * 0.06;
        colors[i * 3 + 2] = 0.12 + Math.random() * 0.05;
      } else {
        colors[i * 3] = grassR + Math.random() * 0.05;
        colors[i * 3 + 1] = grassG + Math.random() * 0.08;
        colors[i * 3 + 2] = 0.08 + Math.random() * 0.04;
      }
    }

    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const ground = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0,
      })
    );
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.objects.push(ground);
  }

  _buildBoundary() {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x080812,
      side: THREE.BackSide,
    });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(60, 6, 60), mat);
    wall.position.y = 3;
    this.scene.add(wall);
    this.objects.push(wall);
  }

  // ─── ROAD ─────────────────────────────────────────────
  _buildRoad() {
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a35,
      roughness: 0.95,
      metalness: 0.05,
    });

    for (let z = -25; z <= 25; z += 1.5) {
      const seg = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.5), roadMat);
      seg.rotation.x = -Math.PI / 2;
      const h = terrainHeight(0, z);
      seg.position.set(0, h + 0.02, z);
      this.scene.add(seg);
      this.objects.push(seg);
    }

    // Road cracks (small dark patches)
    const crackMat = new THREE.MeshBasicMaterial({
      color: 0x1a1a22,
      transparent: true,
      opacity: 0.4,
    });
    for (let i = 0; i < 12; i++) {
      const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(rng(0.05, 0.2), rng(0.3, 0.8)),
        crackMat
      );
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = rng(-0.3, 0.3);
      const cz = rng(-22, 22);
      const ch = terrainHeight(0, cz);
      crack.position.set(rng(-1.2, 1.2), ch + 0.03, cz);
      this.scene.add(crack);
      this.objects.push(crack);
    }
  }

  // ─── GRASS (InstancedMesh) ────────────────────────────
  _buildGrass() {
    const bladeGeo = new THREE.BufferGeometry();
    const w = 0.03, h = 0.25;
    const verts = new Float32Array([
      -w, 0, 0,  w, 0, 0,  w, h, 0,
      -w, 0, 0,  w, h, 0,  -w, h, 0,
    ]);
    bladeGeo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    bladeGeo.computeVertexNormals();

    const count = 400;
    const dummy = new THREE.Object3D();
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x44aa44,
      roughness: 0.8,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    const instanced = new THREE.InstancedMesh(bladeGeo, grassMat, count);
    instanced.castShadow = false;
    instanced.receiveShadow = false;

    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      let x, z;
      do {
        x = rng(-22, 22);
        z = rng(-22, 22);
      } while (Math.abs(x) < 2);

      const hgt = terrainHeight(x, z);
      dummy.position.set(x, hgt, z);
      dummy.scale.set(rng(0.7, 1.3), rng(0.7, 1.3), 1);
      dummy.rotation.y = rng(0, Math.PI * 2);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);

      const shade = 0.3 + Math.random() * 0.3;
      color.setRGB(0.15 + shade * 0.15, 0.25 + shade * 0.25, 0.08);
      instanced.setColorAt(i, color);
    }
    instanced.instanceMatrix.needsUpdate = true;
    instanced.instanceColor.needsUpdate = true;

    this.scene.add(instanced);
    this.objects.push(instanced);
    this.grassMesh = instanced;
  }

  // ─── TREES ────────────────────────────────────────────
  _buildTrees() {
    for (let i = 0; i < 20; i++) {
      try {
        let x, z;
        do {
          x = rng(-20, 20);
          z = rng(-20, 20);
        } while (Math.abs(x) < 3 && Math.abs(z) < 22);
        this._addTree(x, z, rng(0.8, 1.4));
      } catch {}
    }
  }

  _addTree(x, z, s) {
    const g = new THREE.Group();
    const hgt = terrainHeight(x, z);

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(rng(0.25, 0.35), rng(0.18, 0.25), rng(0.10, 0.15)),
      roughness: 0.9,
    });
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05 * s, 0.09 * s, 0.6 * s, 5),
      trunkMat
    );
    trunk.position.y = 0.3 * s;
    trunk.castShadow = true;
    g.add(trunk);

    // Foliage layers (darker at bottom, lighter at top)
    const colors = [
      new THREE.Color(0.08, 0.20, 0.06),
      new THREE.Color(0.10, 0.28, 0.08),
      new THREE.Color(0.14, 0.32, 0.10),
    ];
    for (let layer = 0; layer < 3; layer++) {
      const r = (0.35 - layer * 0.08) * s;
      const fh = (0.4 - layer * 0.08) * s;
      const fol = new THREE.Mesh(
        new THREE.ConeGeometry(r, fh, 6),
        new THREE.MeshStandardMaterial({
          color: colors[layer],
          roughness: 0.85,
        })
      );
      fol.position.y = (0.6 + layer * 0.35) * s;
      fol.castShadow = true;
      g.add(fol);
    }

    g.position.set(x, hgt, z);
    this.scene.add(g);
    this.objects.push(g);
  }

  // ─── ROCKS ────────────────────────────────────────────
  _buildRocks() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x555566,
      roughness: 0.9,
      metalness: 0.05,
    });

    for (let i = 0; i < 20; i++) {
      try {
        let x, z;
        do {
          x = rng(-22, 22);
          z = rng(-22, 22);
        } while (Math.abs(x) < 2.5 && Math.abs(z) < 22);

        const hgt = terrainHeight(x, z);
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(rng(0.12, 0.3), 0),
          rockMat
        );
        rock.position.set(x, hgt + rng(0.05, 0.15), z);
        rock.rotation.set(rng(-1, 1), rng(-1, 1), rng(-1, 1));
        rock.scale.y = rng(0.4, 0.7);
        rock.castShadow = true;
        this.scene.add(rock);
        this.objects.push(rock);
      } catch {}
    }
  }

  // ─── HOUSES ───────────────────────────────────────────
  _buildHouses() {
    const positions = [
      { x: -9, z: -13, r: 0.3 },
      { x: 11, z: -7, r: -0.5 },
      { x: -13, z: 11, r: 0.8 },
      { x: 11, z: 15, r: -0.2 },
    ];
    for (const p of positions) {
      try { this._addHouse(p.x, p.z, p.r); } catch {}
    }
  }

  _addHouse(x, z, rot) {
    const g = new THREE.Group();
    const hgt = terrainHeight(x, z);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x4a3a3a,
      roughness: 0.95,
    });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 2.8), wallMat);
    wall.position.y = 0.9;
    wall.castShadow = true;
    g.add(wall);

    // Roof (destroyed — tilted)
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x5a3020,
      roughness: 0.9,
    });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.8, 4), roofMat);
    roof.position.y = 1.8 + 0.4;
    roof.rotation.y = Math.PI / 4;
    roof.rotation.z = 0.15;
    roof.castShadow = true;
    g.add(roof);

    // Broken window (dark hole)
    const winMat = new THREE.MeshBasicMaterial({ color: 0x0a0a14 });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.25), winMat);
    win.position.set(-0.6, 0.9, 1.41);
    g.add(win);

    // Door
    const doorMat = new THREE.MeshBasicMaterial({ color: 0x1a1008 });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.6), doorMat);
    door.position.set(0.6, 0.3, 1.41);
    g.add(door);

    g.position.set(x, hgt, z);
    g.rotation.y = rot;
    this.scene.add(g);
    this.objects.push(g);
  }

  // ─── CARS ─────────────────────────────────────────────
  _buildCars() {
    const data = [
      { x: -1.5, z: -18, r: 0.1 },
      { x: 4, z: 16, r: -0.3 },
    ];
    for (const c of data) {
      try { this._addCar(c.x, c.z, c.r); } catch {}
    }
  }

  _addCar(x, z, rot) {
    const g = new THREE.Group();
    const hgt = terrainHeight(x, z);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x662222,
      roughness: 0.7,
      metalness: 0.2,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.8), bodyMat);
    body.position.y = 0.18;
    body.castShadow = true;
    g.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.18, 0.75),
      new THREE.MeshBasicMaterial({ color: 0x223355, transparent: true, opacity: 0.35 })
    );
    cabin.position.set(-0.08, 0.34, 0);
    g.add(cabin);

    for (const [wx, wz] of [[-0.45, -0.4], [-0.45, 0.4], [0.45, -0.4], [0.45, 0.4]]) {
      const w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.05, 6),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 })
      );
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.03, wz);
      g.add(w);
    }

    g.position.set(x, hgt, z);
    g.rotation.y = rot;
    this.scene.add(g);
    this.objects.push(g);
  }

  // ─── DEBRIS (scattered trash, leaves, small rocks) ────
  _buildDebris() {
    const debrisMat = new THREE.MeshStandardMaterial({
      color: 0x443322,
      roughness: 1,
    });

    for (let i = 0; i < 40; i++) {
      try {
        const x = rng(-22, 22);
        const z = rng(-22, 22);
        if (Math.abs(x) < 2.5 && Math.abs(z) < 22) continue;
        const hgt = terrainHeight(x, z);
        const piece = new THREE.Mesh(
          new THREE.BoxGeometry(rng(0.02, 0.08), rng(0.01, 0.03), rng(0.02, 0.08)),
          debrisMat
        );
        piece.position.set(x, hgt + 0.005, z);
        piece.rotation.set(rng(-0.5, 0.5), rng(-3, 3), rng(-0.5, 0.5));
        this.scene.add(piece);
        this.objects.push(piece);
      } catch {}
    }

    // Leaves (small colored planes)
    const leafMat = new THREE.MeshBasicMaterial({
      color: 0x663322,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 30; i++) {
      try {
        const x = rng(-22, 22);
        const z = rng(-22, 22);
        const hgt = terrainHeight(x, z);
        const leaf = new THREE.Mesh(
          new THREE.PlaneGeometry(rng(0.03, 0.08), rng(0.02, 0.05)),
          leafMat
        );
        leaf.position.set(x, hgt + 0.003, z);
        leaf.rotation.set(rng(-0.5, 0.5), rng(-3, 3), rng(-0.5, 0.5));
        this.scene.add(leaf);
        this.objects.push(leaf);
      } catch {}
    }
  }

  // ─── DISPOSE ──────────────────────────────────────────
  dispose() {
    for (const obj of this.objects) {
      try {
        this.scene.remove(obj);
        if (obj.isInstancedMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        } else {
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
        }
      } catch {}
    }
    this.objects = [];
    this.grassMesh = null;
  }
}
