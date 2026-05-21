import * as THREE from "three";
import { fbm } from "./noise.js";
import { getHeight } from "./terrain.js";
import { W, rng } from "./constants.js";
import { makeWoodTex, makeStoneTex, makeRoofTex } from "./procgen.js";

// ─── AUDIO ──────────────────────────────────────────────
let audioCtx = null;
export function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
export function playMine() {
  if (!audioCtx) return; try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = "square";
    o.frequency.setValueAtTime(200, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.07);
    g.gain.setValueAtTime(0.06, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.07);
  } catch {}
}
export function playBreak() {
  if (!audioCtx) return; try {
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const n = audioCtx.createBufferSource(); n.buffer = buf;
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    n.connect(g); g.connect(audioCtx.destination); n.start();
  } catch {}
}
export function playCollect() {
  if (!audioCtx) return; try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = "sine";
    o.frequency.setValueAtTime(600, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.12);
    g.gain.setValueAtTime(0.05, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.15);
  } catch {}
}

// ─── MATERIALS ──────────────────────────────────────────
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 });
const trunkMat2 = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
const leafGreen = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.8, flatShading: true });
const leafDark = new THREE.MeshStandardMaterial({ color: 0x338833, roughness: 0.8, flatShading: true });
const leafLight = new THREE.MeshStandardMaterial({ color: 0x66cc66, roughness: 0.8, flatShading: true });
const leafAutumn = new THREE.MeshStandardMaterial({ color: 0x88aa33, roughness: 0.8, flatShading: true });
const leafMats = [leafGreen, leafDark, leafLight, leafAutumn];
const rockMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9, flatShading: true });
const rockMat2 = new THREE.MeshStandardMaterial({ color: 0x707070, roughness: 0.9, flatShading: true });
const bushMat = new THREE.MeshStandardMaterial({ color: 0x336633, roughness: 0.8, flatShading: true });

// ─── TREES (140) ───────────────────────────────────────
function buildTrees(scene) {
  const trees = [];
  for (let i = 0; i < 140; i++) {
    const tx = rng(-W/2+5, W/2-5), tz = rng(-W/2+5, W/2-5);
    const th = getHeight(tx, tz);
    if (th > 0.6 && th < 4 && fbm(tx*0.04+20, tz*0.04+20) > 0.3) {
      const trunkH = rng(1.5, 3.5);
      const trunkR = rng(0.07, 0.15);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkR*0.5, trunkR, trunkH, 6), i%3===0?trunkMat2:trunkMat);
      trunk.position.set(tx, th + trunkH/2, tz);
      scene.add(trunk); trees.push(trunk);
      for (let b = 0; b < 2; b++) {
        const ba = rng(0, Math.PI*2), bl = rng(0.2, 0.5);
        const br = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, bl, 4), trunkMat);
        br.position.set(tx + Math.cos(ba) * trunkR * 0.8, th + trunkH * (0.4 + b * 0.3), tz + Math.sin(ba) * trunkR * 0.8);
        br.rotation.z = rng(0.3, 0.8); br.rotation.y = ba; br.rotation.x = rng(-0.2, 0.2);
        scene.add(br);
      }
      for (let l = 0; l < 2; l++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(rng(0.3, 0.7), 6, 6), leafMats[(i+l)%4]);
        leaf.position.set(tx + rng(-0.5, 0.5), th + trunkH * 0.7 + rng(0.2, 0.8), tz + rng(-0.5, 0.5));
        leaf.scale.y = rng(0.7, 1.2);
        scene.add(leaf);
      }
    }
  }
  return trees;
}

// ─── PINE TREES (50) ───────────────────────────────────
function buildPines(scene) {
  const pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x225522, roughness: 0.8, flatShading: true });
  for (let i = 0; i < 50; i++) {
    const px = rng(-W/2+5, W/2-5), pz = rng(-W/2+5, W/2-5);
    const ph = getHeight(px, pz);
    if (ph > 1.5 && ph < 6 && fbm(px*0.03+80, pz*0.03+80) > 0.32) {
      const h = rng(1.5, 3.5);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, h, 5), pineTrunkMat);
      trunk.position.set(px, ph + h/2, pz);
      scene.add(trunk);
      for (let j = 0; j < 3; j++) {
        const r = rng(0.2, 0.5) * (1 - j * 0.2);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r, rng(0.4, 0.7), 5), pineLeafMat);
        cone.position.set(px, ph + h * 0.4 + j * h * 0.25, pz);
        scene.add(cone);
      }
    }
  }
}

// ─── FALLEN LOGS (30) ──────────────────────────────────
function buildLogs(scene) {
  const logMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 });
  for (let i = 0; i < 30; i++) {
    const lx = rng(-W/2+5, W/2-5), lz = rng(-W/2+5, W/2-5);
    const lh = getHeight(lx, lz);
    if (lh > 0.3 && lh < 4 && fbm(lx*0.04+140, lz*0.04+140) > 0.35) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, rng(0.5, 1.2), 5), logMat);
      log.position.set(lx, lh + 0.04, lz);
      log.rotation.x = Math.PI / 2 + rng(-0.3, 0.3);
      log.rotation.z = rng(0, Math.PI * 2);
      scene.add(log);
    }
  }
}

// ─── RESOURCE NODES (crystals 25, gold 20) ────────────
function buildResources(scene) {
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0xff66ff, roughness: 0.15, metalness: 0.5, emissive: 0xff44ff, emissiveIntensity: 0.2 });
  for (let i = 0; i < 25; i++) {
    const cx = rng(-W/2+8, W/2-8), cz = rng(-W/2+8, W/2-8);
    const ch = getHeight(cx, cz);
    if (ch > 0.5 && ch < 5 && fbm(cx*0.05+300, cz*0.05+300) > 0.4) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(rng(0.08, 0.25), 0), crystalMat);
      c.position.set(cx, ch + rng(0, 0.1), cz);
      c.rotation.set(rng(0,6), rng(0,6), rng(0,6));
      scene.add(c);
      if (i % 3 === 0) { const gl = new THREE.PointLight(0xff44ff, 0.12, 1.5); gl.position.set(cx, ch+0.2, cz); scene.add(gl); }
    }
  }
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.3, metalness: 0.8, emissive: 0xff8800, emissiveIntensity: 0.15 });
  for (let i = 0; i < 20; i++) {
    const gx = rng(-W/2+8, W/2-8), gz = rng(-W/2+8, W/2-8);
    const gh = getHeight(gx, gz);
    if (gh > 0.3 && gh < 4.5 && fbm(gx*0.04+400, gz*0.04+400) > 0.35) {
      const g = new THREE.Mesh(new THREE.DodecahedronGeometry(rng(0.06, 0.18), 0), goldMat);
      g.position.set(gx, gh, gz);
      g.rotation.set(rng(0,6), rng(0,6), rng(0,6));
      scene.add(g);
    }
  }
}

// ─── BUSHES (80) ───────────────────────────────────────
function buildBushes(scene) {
  for (let i = 0; i < 80; i++) {
    const bx = rng(-W/2+5, W/2-5), bz = rng(-W/2+5, W/2-5);
    const bh = getHeight(bx, bz);
    if (bh > 0.8 && bh < 3 && fbm(bx*0.06+50, bz*0.06+50) > 0.4) {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(rng(0.15, 0.3), 5, 5), bushMat);
      bush.position.set(bx, bh + rng(0.1, 0.25), bz);
      bush.scale.y = rng(0.5, 0.8);
      scene.add(bush);
    }
  }
}

// ─── ROCKS (80) ────────────────────────────────────────
function buildRocks(scene) {
  for (let i = 0; i < 80; i++) {
    const rx = rng(-W/2+5, W/2-5), rz = rng(-W/2+5, W/2-5);
    const rh = getHeight(rx, rz);
    if (rh > 0.2 && rh < 6) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rng(0.15, 0.7), 0), i%3===0?rockMat2:rockMat);
      rock.position.set(rx, rh + rng(0, 0.15), rz);
      rock.scale.y = rng(0.25, 0.55);
      rock.rotation.set(rng(0,6), rng(0,6), rng(0,6));
      scene.add(rock);
    }
  }
}

// ─── FLOWERS (200) ─────────────────────────────────────
function buildFlowers(scene) {
  for (let i = 0; i < 200; i++) {
    const fx = rng(-W/2+5, W/2-5), fz = rng(-W/2+5, W/2-5);
    const fh = getHeight(fx, fz);
    if (fh > 0.5 && fh < 3.5 && fbm(fx*0.07+80, fz*0.07+80) > 0.35) {
      const fm = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(rng(0.4, 1), 0.75, 0.5+rng(0,0.15)), roughness: 0.5 });
      const f = new THREE.Mesh(new THREE.SphereGeometry(rng(0.04, 0.07), 4, 4), fm);
      f.position.set(fx, fh + rng(0.04, 0.12), fz);
      scene.add(f);
    }
  }
}

// ─── GRASS POINTS ──────────────────────────────────────
function buildGrass(scene) {
  let gp = [];
  for (let i = 0; i < 800; i++) {
    const gx = rng(-W/2+5, W/2-5), gz = rng(-W/2+5, W/2-5);
    const gh = getHeight(gx, gz);
    if (gh > 0.5 && gh < 3.5 && fbm(gx*0.05+120, gz*0.05+120) > 0.3) {
      gp.push(gx, gh, gz);
    }
  }
  if (gp.length > 0) {
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute("position", new THREE.Float32BufferAttribute(gp, 3));
    const gMat = new THREE.PointsMaterial({ color: 0x55cc55, size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.7 });
    const gMesh = new THREE.Points(gGeo, gMat);
    scene.add(gMesh);
  }
}

// ─── BUILD WORLD ───────────────────────────────────────
export function buildVegetation(scene) {
  console.log("[WORLD] Building vegetation...");
  const trees = buildTrees(scene);
  buildPines(scene);
  buildRocks(scene);
  buildBushes(scene);
  buildFlowers(scene);
  buildGrass(scene);
  buildLogs(scene);
  buildResources(scene);
  console.log("[WORLD] Vegetation done");
  return { trees };
}

// ─── STRUCTURES ─────────────────────────────────────────
export function buildStructures(scene) {
  console.log("[WORLD] Building structures...");
  const woodTex = makeWoodTex(); woodTex.repeat.set(2,2);
  const stoneTex = makeStoneTex(); stoneTex.repeat.set(2,2);
  const roofTex = makeRoofTex(); roofTex.repeat.set(2,2);
  const wallMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.8 });
  const roofMat2 = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.8, color: 0x6a2a1a });
  const logMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.9, color: 0x606060 });
  const plankMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7, color: 0xbb9955 });
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.95 });
  const fenceMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 });
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xff8844 });

  function hut(vx, vz, rotY) {
    const vh = getHeight(vx, vz);
    if (vh < 0.3 || vh > 3) return;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.2), wallMat);
    wall.position.set(vx, vh+0.4, vz); scene.add(wall);
    const beamMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 });
    for (let b = 0; b < 3; b++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.22), beamMat);
      beam.position.set(vx - 0.5 + b * 0.5, vh + 0.08 + b * 0.3, vz);
      scene.add(beam);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 4), rotY > 0 ? roofMat2 : roofMat);
    roof.position.set(vx, vh+1.05, vz);
    roof.rotation.y = rotY + Math.PI/4; scene.add(roof);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.15), stoneMat);
    chim.position.set(vx + 0.4, vh + 0.95, vz - 0.3);
    chim.scale.x = 0.8; scene.add(chim);
    const chimTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), stoneMat);
    chimTop.position.set(vx + 0.4, vh + 1.15, vz - 0.3);
    scene.add(chimTop);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.05), new THREE.MeshStandardMaterial({ color: 0x5a3a1a, map: woodTex }));
    door.position.set(vx, vh+0.3, vz+0.6); scene.add(door);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0x88ccff }));
    win.position.set(vx+0.5, vh+0.5, vz); scene.add(win);
    const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0x88ccff }));
    win2.position.set(vx-0.5, vh+0.5, vz); scene.add(win2);
  }

  hut(8, 0, 0);
  hut(10.5, 2, 0.5);
  hut(6, 3, -0.3);
  hut(4, -2, 0.8);
  hut(12, -1, -0.2);

  const wwx = 8.5, wwz = 1, wwh = getHeight(wwx, wwz);
  if (wwh > 0) {
    const wellMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 });
    const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.15, 8), wellMat);
    wellBase.position.set(wwx, wwh + 0.07, wwz); scene.add(wellBase);
    for (let i = 0; i < 4; i++) {
      const a = (i/4)*Math.PI*2 + Math.PI/4;
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), wellMat);
      p.position.set(wwx + Math.cos(a)*0.2, wwh+0.25, wwz + Math.sin(a)*0.2);
      scene.add(p);
    }
    const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.08, 4), new THREE.MeshStandardMaterial({ color: 0x8a3a1a, roughness: 0.8 }));
    wellRoof.position.set(wwx, wwh+0.45, wwz); wellRoof.rotation.y = Math.PI/4; scene.add(wellRoof);
  }

  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.9 });
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 });
  for (let i = 0; i < 6; i++) {
    const bv = [[7,0],[10,2.5],[5.5,3.5],[11.5,-0.5],[4.5,-1.5],[12.5,1.5]];
    const [bx, bz] = bv[i];
    const bh = getHeight(bx, bz);
    if (bh > 0) {
      const isB = i % 2 === 0;
      const m = isB ? new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.14, 7), barrelMat) : new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), crateMat);
      m.position.set(bx, bh + (isB ? 0.07 : 0.06), bz);
      if (!isB) m.rotation.y = rng(0, Math.PI);
      scene.add(m);
    }
  }

  const stoneMat2 = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.9 });
  for (let i = 0; i < 20; i++) {
    const spx = 7 + rng(-2, 4), spz = -1 + rng(-1.5, 3.5);
    const sph = getHeight(spx, spz);
    if (sph > 0) {
      const st = new THREE.Mesh(new THREE.CircleGeometry(rng(0.04, 0.1), 5), stoneMat2);
      st.position.set(spx, sph, spz);
      st.rotation.x = -Math.PI / 2;
      scene.add(st);
    }
  }

  const fencePositions = [[7, -1.5], [11, -1.5], [12.5, 1], [12.5, 3], [11, 4.5], [7, 4.5], [5.5, 3], [5.5, 1]];
  for (const [fx, fz] of fencePositions) {
    const fh = getHeight(fx, fz);
    if (fh > 0) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.5, 4), fenceMat);
      post.position.set(fx, fh + 0.25, fz);
      scene.add(post);
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), lanternMat);
      lantern.position.set(fx, fh + 0.55, fz);
      scene.add(lantern);
    }
  }

  const cfx = 8, cfz = 1.5, cfh = getHeight(cfx, cfz);
  if (cfh > 0) {
    for (let i = 0; i < 6; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.25, 5), logMat);
      log.position.set(cfx + rng(-0.15, 0.15), cfh + 0.05, cfz + rng(-0.15, 0.15));
      log.rotation.set(rng(0, 1), 0, rng(0, 1)); scene.add(log);
    }
    const fireLight = new THREE.PointLight(0xff6622, 0.8, 4);
    fireLight.position.set(cfx, cfh + 0.5, cfz); scene.add(fireLight);
  }

  for (let i = -5; i <= 12; i++) {
    const rx = i * 0.3, rz = Math.sin(i * 0.3) * 0.5 + 1;
    const rh = getHeight(rx, rz);
    if (rh > -0.5) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), roadMat);
      seg.position.set(rx, rh - 0.01, rz);
      scene.add(seg);
    }
  }

  const twx = 4, twz = -6, twh = getHeight(twx, twz);
  if (twh > 0.5 && twh < 5) {
    for (let i = 0; i < 3; i++) {
      const tw = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), stoneMat);
      tw.position.set(twx, twh + i * 0.7 + 0.35, twz);
      scene.add(tw);
    }
    const troof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.3, 4), roofMat);
    troof.position.set(twx, twh + 2.6, twz);
    troof.rotation.y = Math.PI / 4; scene.add(troof);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.2, 0.12), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
    flag.position.set(twx + 0.4, twh + 2.8, twz);
    scene.add(flag);
  }

  const rux = -14, ruz = -8, ruh = getHeight(rux, ruz);
  if (ruh > 0) {
    for (let i = 0; i < 8; i++) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(rng(0.25, 0.6), rng(0.15, 0.5), rng(0.15, 0.25)), stoneMat);
      sw.position.set(rux + rng(-1.2, 1.2), ruh + rng(0.05, 0.4), ruz + rng(-1.2, 1.2));
      sw.rotation.set(rng(-0.3, 0.3), rng(0, 6), rng(-0.3, 0.3));
      scene.add(sw);
    }
    const ivy = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.02), new THREE.MeshBasicMaterial({ color: 0x336633 }));
    ivy.position.set(rux + 0.8, ruh + 0.3, ruz + 0.7);
    ivy.rotation.z = 0.2; scene.add(ivy);
  }

  const bStart = 5, bEnd = 12;
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const bx = bStart + t * (bEnd - bStart);
    const bz = Math.sin(bx * 0.15) * 3;
    const bh = getHeight(bx, bz);
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.15), plankMat);
    plank.position.set(bx, bh + 0.05, bz);
    plank.rotation.y = Math.atan2(Math.cos(bx * 0.15) * 3 * 0.15, 1) * 0.5;
    scene.add(plank);
  }
  console.log("[WORLD] Structures done");
}

// ─── ANIMALS ────────────────────────────────────────────
export function spawnAnimals(scene) {
  const animals = [];
  for (let i = 0; i < 20; i++) {
    const ax = rng(-W / 2 + 10, W / 2 - 10), az = rng(-W / 2 + 10, W / 2 - 10);
    const ah = getHeight(ax, az);
    if (ah > 0.5 && ah < 4) {
      const bodyCol = new THREE.Color().setHSL(rng(0.05, 0.15), rng(0.2, 0.5), rng(0.3, 0.6));
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.8 }));
      body.scale.set(1, 0.7, 1.2); body.position.y = 0.25; group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.8 }));
      head.position.set(0, 0.2, 0.3); group.add(head);
      group.position.set(ax, ah, az);
      group.rotation.y = rng(0, Math.PI * 2);
      scene.add(group);
      animals.push({ group, ax, az, ah, phase: rng(0, Math.PI * 2), speed: rng(0.3, 0.8), wanderTarget: null });
    }
  }
  return animals;
}

// ─── CLOUDS ─────────────────────────────────────────────
export function makeClouds(scene) {
  const clouds = [];
  const cloudMat = new THREE.SpriteMaterial({
    map: (() => {
      const c = document.createElement("canvas"); c.width = 64; c.height = 64;
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,0.6)"); g.addColorStop(0.4, "rgba(255,255,255,0.3)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5,
  });
  for (let i = 0; i < 60; i++) {
    const cloud = new THREE.Sprite(cloudMat);
    const s = rng(4, 12);
    cloud.scale.set(s, s * 0.4, 1);
    cloud.position.set(rng(-W, W), rng(12, 20), rng(-W, W));
    scene.add(cloud);
    clouds.push({ sprite: cloud, speed: rng(0.1, 0.3), dx: rng(-1, 1) });
  }
  return clouds;
}

// ─── BIRDS ──────────────────────────────────────────────
export function makeBirds(scene) {
  const birds = [];
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true, side: THREE.DoubleSide });
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.25), wingMat);
    body.position.y = 0; g.add(body);
    const lWing = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.08), wingMat);
    lWing.position.set(-0.15, 0.04, 0);
    lWing.rotation.z = 0.3; lWing.name = "lw";
    g.add(lWing);
    const rWing = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.08), wingMat);
    rWing.position.set(0.15, 0.04, 0);
    rWing.rotation.z = -0.3; rWing.name = "rw";
    g.add(rWing);
    g.position.set(rng(-W/2, W/2), rng(8, 15), rng(-W/2, W/2));
    g.rotation.y = rng(0, Math.PI*2);
    scene.add(g);
    birds.push({ g, lWing, rWing, phase: rng(0, Math.PI*2), speed: rng(0.3, 0.7), cx: g.position.x, cy: g.position.y, cz: g.position.z });
  }
  return birds;
}

// ─── SKY ─────────────────────────────────────────────────
export function makeSky(scene) {
  console.log("[WORLD] Creating sky dome...");
  const c = document.createElement("canvas"); c.width = 1; c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#0a1428"); g.addColorStop(0.15, "#1a3050");
  g.addColorStop(0.35, "#4a7abb"); g.addColorStop(0.55, "#87CEEB");
  g.addColorStop(0.72, "#FFCC88"); g.addColorStop(0.85, "#FFEECC");
  g.addColorStop(1, "#FFEECC");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 256);
  const tex = new THREE.CanvasTexture(c);
  const geo = new THREE.SphereGeometry(190, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
  const sky = new THREE.Mesh(geo, mat); scene.add(sky);
  return sky;
}

// ─── SUN ─────────────────────────────────────────────────
export function makeSun(scene) {
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFEEAA });
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), sunMat);
  sunMesh.position.set(50, 60, 30);
  scene.add(sunMesh);
  const glowMat = new THREE.SpriteMaterial({
    map: (() => { const c = document.createElement("canvas"); c.width = 64; c.height = 64;
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0,"rgba(255,238,170,0.8)"); g.addColorStop(0.3,"rgba(255,238,170,0.3)");
      g.addColorStop(1,"rgba(255,238,170,0)");
      ctx.fillStyle = g; ctx.fillRect(0,0,64,64);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(20,20,1);
  glow.position.copy(sunMesh.position);
  scene.add(glow);
  return sunMesh;
}

// ─── PARTICLES ──────────────────────────────────────────
const particleSystems = [];
export function spawnParticles(scene, pos, color, count = 15) {
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.15;
    positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.15;
    positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.15;
    velocities.push({ x: (Math.random() - 0.5) * 3, y: Math.random() * 2.5 + 0.5, z: (Math.random() - 0.5) * 3 });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color, size: 0.1, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  particleSystems.push({ points, velocities, life: 1 });
}
export function updateParticles(dt) {
  for (let i = particleSystems.length - 1; i >= 0; i--) {
    const sys = particleSystems[i];
    if (!sys.points.parent) { particleSystems.splice(i, 1); continue; }
    const pos = sys.points.geometry.attributes.position.array;
    for (let j = 0; j < pos.length / 3; j++) {
      pos[j * 3] += sys.velocities[j].x * dt;
      pos[j * 3 + 1] += sys.velocities[j].y * dt;
      pos[j * 3 + 2] += sys.velocities[j].z * dt;
      sys.velocities[j].y -= 4 * dt;
    }
    sys.points.geometry.attributes.position.needsUpdate = true;
    sys.life -= dt * 1.8;
    sys.points.material.opacity = Math.max(0, sys.life);
    if (sys.life <= 0) {
      sys.points.geometry.dispose(); sys.points.material.dispose();
      sys.points.parent?.remove(sys.points);
      particleSystems.splice(i, 1);
    }
  }
}

// ─── ITEM DROPS ─────────────────────────────────────────
const DROP_ICONS = { wood: { color: 0x6a4a2a }, stone: { color: 0x808080 }, crystal: { color: 0xff66ff }, coal: { color: 0x444444 } };
const itemDrops = [];
export function spawnItemDrop(scene, pos, itemId, count) {
  const info = DROP_ICONS[itemId] || { color: 0xffffff };
  const drop = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 0.15),
    new THREE.MeshStandardMaterial({ color: info.color, emissive: info.color, emissiveIntensity: 0.3, roughness: 0.5 })
  );
  drop.position.copy(pos); drop.position.y += 0.4;
  drop.castShadow = true; scene.add(drop);
  const glow = new THREE.PointLight(info.color, 0.3, 1.5);
  glow.position.copy(drop.position); scene.add(glow);
  itemDrops.push({ mesh: drop, light: glow, itemId, count, yBase: drop.position.y, phase: Math.random() * Math.PI * 2, life: 30 });
}
export function updateDrops(playerPos, dt, onCollect) {
  for (let i = itemDrops.length - 1; i >= 0; i--) {
    const d = itemDrops[i];
    d.life -= dt;
    const bob = Math.sin(performance.now() * 0.002 + d.phase) * 0.1;
    d.mesh.position.y = d.yBase + bob;
    const scene = d.mesh.parent;
    if (!scene) { itemDrops.splice(i, 1); continue; }
    const dx = d.mesh.position.x - playerPos.x, dz = d.mesh.position.z - playerPos.z, dy = d.mesh.position.y - playerPos.y;
    if (dx * dx + dz * dz + dy * dy < 3.2) {
      scene.remove(d.mesh); scene.remove(d.light);
      d.mesh.geometry.dispose(); d.mesh.material.dispose();
      onCollect(d.itemId, d.count);
      itemDrops.splice(i, 1);
    } else if (d.life <= 0) {
      scene.remove(d.mesh); scene.remove(d.light);
      d.mesh.geometry.dispose(); d.mesh.material.dispose();
      itemDrops.splice(i, 1);
    }
  }
}

// ─── DAMAGE BAR ─────────────────────────────────────────
export function makeDamageBar(scene) {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 8;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0, 0, 64, 8);
  ctx.fillStyle = "#44aaff"; ctx.fillRect(1, 1, 62, 6);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.5, 0.06, 1); sprite.visible = false;
  scene.add(sprite);
  return { sprite, canvas: c, ctx, tex };
}
export function updateDamageBar(dmgBar, target, hp, maxHp) {
  if (!dmgBar || !target) return;
  const pct = Math.max(0, hp / maxHp);
  dmgBar.ctx.clearRect(0, 0, 64, 8);
  dmgBar.ctx.fillStyle = "rgba(0,0,0,0.6)"; dmgBar.ctx.fillRect(0, 0, 64, 8);
  dmgBar.ctx.fillStyle = "#44aaff"; dmgBar.ctx.fillRect(1, 1, 62 * pct, 6);
  dmgBar.tex.needsUpdate = true;
  dmgBar.sprite.visible = true;
  if (target) { dmgBar.sprite.position.copy(target); dmgBar.sprite.position.y += 1.2; }
}
