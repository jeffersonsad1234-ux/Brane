import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import "../styles/virtualShopping.css";

// ── CONSTANTS ─────────────────────────────────────────
const WORLD = { size: 140, treeCount: 80, rockCount: 40 };

const BUILDINGS = [
  { x:-20,z:-18,w:6,h:5,d:5,color:0x8a8a92,story:2 },
  { x:-14,z:-20,w:5,h:4.5,d:4,color:0x92929a,story:2,broken:true },
  { x:-8,z:-16,w:4.5,h:3.2,d:4,color:0x888890,story:1 },
  { x:0,z:-22,w:8,h:6.5,d:5.5,color:0x8e8e96,story:2 },
  { x:8,z:-18,w:5,h:4.2,d:4.5,color:0x9a9aa2,story:1 },
  { x:16,z:-20,w:4,h:3.8,d:3.5,color:0x8c8c94,story:1 },
  { x:-18,z:4,w:5.5,h:5,d:4,color:0x909098,story:2,broken:true },
  { x:-10,z:6,w:4,h:3.2,d:3.5,color:0x96969e,story:1 },
  { x:-2,z:3,w:6,h:5.5,d:5,color:0x888890,story:2 },
  { x:6,z:8,w:4.5,h:3.8,d:4,color:0x92929a,story:1,broken:true },
  { x:14,z:5,w:5,h:4.2,d:4.5,color:0x9e9ea6,story:1 },
  { x:20,z:2,w:3.5,h:3,d:3,color:0x8a8a92,story:1 },
  { x:-22,z:18,w:4,h:3.2,d:3.5,color:0x94949c,story:1 },
  { x:-14,z:20,w:5.5,h:5,d:4,color:0x8e8e96,story:2 },
  { x:-6,z:16,w:4,h:3.2,d:3.5,color:0x9898a0,story:1,broken:true },
  { x:4,z:20,w:6,h:5.5,d:5,color:0x8c8c94,story:2 },
  { x:12,z:18,w:4.5,h:3.8,d:4,color:0x96969e,story:1 },
  { x:20,z:16,w:4,h:3.2,d:3.5,color:0x909098,story:1 },
];

const INTERACTIVES = [
  { name:"Kit Médico",emoji:"🩹",color:"#ff4444",desc:"Bandagens e antisséptico.",x:-12,z:-8 },
  { name:"Ração Militar",emoji:"🥫",color:"#cc8833",desc:"Alimento enlatado não perecível.",x:5,z:2 },
  { name:"Munição 9mm",emoji:"🔫",color:"#aaaacc",desc:"Caixa de munição calibre 9mm.",x:-4,z:-12 },
  { name:"Gasolina",emoji:"⛽",color:"#33cc33",desc:"Galão de gasolina 5L.",x:10,z:-4 },
  { name:"Faca Tática",emoji:"🔪",color:"#888888",desc:"Faca de combate tática.",x:-8,z:10 },
  { name:"Lampião",emoji:"💡",color:"#ffdd44",desc:"Lanterna de mão com pilhas.",x:2,z:14 },
];

// ── PROCEDURAL TEXTURES ──────────────────────────────
function noiseTexture(w, h, baseR, baseG, baseB, intensity, repeat) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const id = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const n = (Math.random() - 0.5) * intensity;
    id.data[i] = baseR + n;
    id.data[i+1] = baseG + n;
    id.data[i+2] = baseB + n;
    id.data[i+3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  // Horizontal scratch/crack
  for (let i = 0; i < 20; i++) {
    const y = Math.random() * h;
    ctx.fillStyle = `rgba(${baseR-30},${baseG-30},${baseB-30},0.15)`;
    ctx.fillRect(0, y, w, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (repeat) tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  return tex;
}

function concreteTex() { return noiseTexture(256, 256, 145, 145, 150, 25, 2); }
function asphaltTex() { return noiseTexture(256, 256, 55, 55, 62, 15, 4); }
function plasterTex() { return noiseTexture(256, 256, 170, 165, 155, 20, 1.5); }

function skyGradientTex() {
  const c = document.createElement("canvas");
  c.width = 1; c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#5588bb");
  g.addColorStop(0.3, "#6a9ccc");
  g.addColorStop(0.55, "#88aacc");
  g.addColorStop(0.75, "#aabbcc");
  g.addColorStop(0.9, "#ccdde8");
  g.addColorStop(1, "#eef4f8");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

function windowEmissiveTex() {
  const c = document.createElement("canvas");
  c.width = 32; c.height = 64;
  const ctx = c.getContext("2d");
  // Frame
  ctx.fillStyle = "#1a1a2a";
  ctx.fillRect(0, 0, 32, 64);
  // Glass with slight color variation
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 32, y = Math.random() * 64;
    const v = 100 + Math.random() * 80;
    ctx.fillStyle = `rgba(${v-50},${v},${v+30},0.06)`;
    ctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  // Horizontal frame bars
  ctx.fillStyle = "rgba(10,10,20,0.3)";
  ctx.fillRect(0, 20, 32, 2);
  ctx.fillRect(0, 42, 32, 2);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// ── WORLD BUILDERS ──────────────────────────────────
function makeGround() {
  const geo = new THREE.PlaneGeometry(WORLD.size, WORLD.size, 120, 120);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = Math.sin(x * 0.035 + z * 0.028) * 0.5
      + Math.sin(x * 0.07 - z * 0.055 + 1.2) * 0.25
      + Math.cos(x * 0.11 + z * 0.09 + 0.7) * 0.12;
    pos.setY(i, h);
    const g = 0.14 + 0.15 * Math.random() + Math.max(0, h * 0.06);
    const r = 0.12 + 0.1 * Math.random() + h * 0.04;
    const b = 0.08 + 0.06 * Math.random() + Math.max(0, h * 0.02);
    colors[i*3] = Math.min(0.6, r);
    colors[i*3+1] = Math.min(0.7, g);
    colors[i*3+2] = Math.min(0.5, b);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  // Detail texture overlay
  const detailTex = noiseTexture(128, 128, 50, 80, 30, 20, 20);
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.85, metalness: 0,
    map: detailTex, blending: THREE.MultiplyBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

function makeRoad(px, pz, w, d, angle) {
  const g = new THREE.PlaneGeometry(w, d, 6, 6);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, (Math.sin(x*0.5+z*0.3)*0.03 + Math.sin(x*0.2-z*0.4)*0.02));
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
    color: 0x555566, roughness: 0.92, metalness: 0,
    map: asphaltTex(),
  }));
  m.position.set(px, 0.015, pz);
  m.rotation.y = angle;
  m.receiveShadow = true;
  return m;
}

function makeTree_(x, z, s) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9, map: noiseTexture(64, 64, 74, 53, 32, 10, 1) });
  const canopyMat1 = new THREE.MeshStandardMaterial({ color: 0x1a3a0a + Math.floor(Math.random()*0x002a00), roughness: 0.85, map: noiseTexture(64, 64, 40, 80, 20, 15, 2) });
  const canopyMat2 = new THREE.MeshStandardMaterial({ color: 0x1e3e0e + Math.floor(Math.random()*0x002200), roughness: 0.85, map: noiseTexture(64, 64, 45, 85, 25, 15, 2) });
  const canopyMat3 = new THREE.MeshStandardMaterial({ color: 0x1a3a0a + Math.floor(Math.random()*0x002a00), roughness: 0.85, map: noiseTexture(64, 64, 40, 80, 20, 15, 2) });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05*s, 0.09*s, 0.7*s, 6), trunkMat);
  trunk.position.y = 0.35*s; trunk.castShadow = true; g.add(trunk);

  const addCanopy = (rad, yOff, xOff, zOff, mat) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(rad*s, 6, 5), mat);
    m.position.set(xOff, yOff*s, zOff); m.castShadow = true; g.add(m);
  };
  addCanopy(0.5, 0.9 + Math.random()*0.15, 0, 0, canopyMat1);
  addCanopy(0.35, 1.05 + Math.random()*0.1, 0.25*s, 0.15*s, canopyMat2);
  addCanopy(0.3, 0.95 + Math.random()*0.1, -0.2*s, -0.15*s, canopyMat3);
  addCanopy(0.25, 0.85 + Math.random()*0.1, 0.1*s, -0.3*s, canopyMat2);

  g.position.set(x, 0, z);
  g.rotation.y = Math.random() * Math.PI * 2;
  return g;
}

function makeBuilding_(p) {
  const g = new THREE.Group();
  const h = p.h * (p.story || 1);
  const concTex = concreteTex();

  // Main walls
  const wallMat = new THREE.MeshStandardMaterial({ map: concTex, roughness: 0.85, metalness: 0.05, color: p.color });
  const body = new THREE.Mesh(new THREE.BoxGeometry(p.w, h, p.d), wallMat);
  body.position.y = h/2; body.castShadow = true; body.receiveShadow = true; g.add(body);

  // Roof
  const rh = h*0.18 + 0.25;
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9, map: noiseTexture(128, 128, 60, 60, 60, 10, 2) });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(p.w, p.d)*0.52, rh, 4), roofMat);
  roof.position.y = h + rh/2; roof.rotation.y = Math.PI/4; roof.castShadow = true; g.add(roof);

  // Floor ledge
  const ledgeMat = new THREE.MeshStandardMaterial({ color: 0x6a6a72, roughness: 0.9 });
  for (let f = 1; f <= (p.story || 1); f++) {
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.1, 0.06, p.d + 0.1), ledgeMat);
    ledge.position.y = f * p.h - 0.05; g.add(ledge);
  }

  // Windows with frames
  const winEmissive = windowEmissiveTex();
  const winMat = new THREE.MeshStandardMaterial({
    map: winEmissive, emissive: 0x88bbff, emissiveIntensity: 0.04, emissiveMap: winEmissive,
    transparent: true, opacity: 0.4 + Math.random()*0.2, roughness: 0.1, metalness: 0.3,
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a32, roughness: 0.7, metalness: 0.2 });
  const winCount = Math.floor(p.w * 1.8);

  for (let side of [-1, 1]) {
    for (let i = 0; i < winCount; i++) {
      const wx = (i/(winCount-1) - 0.5) * p.w * 0.6;
      const wy = h * (0.4 + 0.35 * (i % 2));
      // Glass
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.45), winMat);
      win.position.set(wx, wy, side * (p.d/2 + 0.01)); g.add(win);
      // Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.02), frameMat);
      frame.position.set(wx, wy - 0.22, side * (p.d/2 + 0.015)); g.add(frame);
      const frame2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.02), frameMat);
      frame2.position.set(wx, wy + 0.22, side * (p.d/2 + 0.015)); g.add(frame2);
      // Vertical frame
      const frameV = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.46, 0.02), frameMat);
      frameV.position.set(wx - 0.18, wy, side * (p.d/2 + 0.015)); g.add(frameV);
      const frameV2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.46, 0.02), frameMat);
      frameV2.position.set(wx + 0.18, wy, side * (p.d/2 + 0.015)); g.add(frameV2);
    }
  }

  // Door
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.95, map: noiseTexture(64, 128, 26, 10, 0, 8, 1) });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.75), doorMat);
  door.position.set(0, 0.38, p.d/2 + 0.01); g.add(door);

  // Broken feature
  if (p.broken) {
    const debMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.9, map: concTex });
    for (let i = 0; i < 3; i++) {
      const rub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + Math.random()*0.12, 0), debMat);
      rub.position.set((Math.random()-0.5)*p.w*0.4, 0.05 + Math.random()*0.1, p.d/2 + 0.2 + Math.random()*0.3);
      rub.scale.set(1+Math.random(), 0.3+Math.random()*0.5, 1+Math.random());
      rub.castShadow = true; g.add(rub);
    }
  }

  g.position.set(p.x, 0, p.z);
  return g;
}

function makeRock_(x, z, s) {
  const geo = new THREE.DodecahedronGeometry(0.12*s, 0);
  const tex = noiseTexture(64, 64, 80, 80, 85, 20, 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.92, map: tex }));
  m.position.set(x+(Math.random()-0.5)*0.2, 0.02*s, z+(Math.random()-0.5)*0.2);
  m.rotation.set(Math.random()*3, Math.random()*3, Math.random()*3);
  m.scale.y = 0.4 + Math.random()*0.6; m.castShadow = true; m.receiveShadow = true;
  return m;
}

function makeBush(x, z, s) {
  const g = new THREE.Group();
  const c = 0x1a3a0a + Math.floor(Math.random()*0x002a00);
  const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, map: noiseTexture(64, 64, 30, 60, 15, 10, 2) });
  for (let i = 0; i < 5; i++) {
    const s2 = new THREE.SphereGeometry(0.1*s*(0.5+Math.random()*0.6), 5, 4);
    const mesh = new THREE.Mesh(s2, m);
    mesh.position.set((Math.random()-0.5)*0.35*s, 0.06*s, (Math.random()-0.5)*0.35*s);
    mesh.castShadow = true; g.add(mesh);
  }
  g.position.set(x, 0.02, z);
  return g;
}

function makeCar(x, z, angle) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x441111, roughness: 0.5, metalness: 0.4, map: noiseTexture(128, 128, 68, 17, 17, 12, 1) });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.3, metalness: 0.6, map: noiseTexture(64, 64, 34, 34, 51, 10, 1) });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.6), bodyMat);
  body.position.y = 0.2; body.castShadow = true; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), cabinMat);
  cabin.position.set(0, 0.4, -0.15); g.add(cabin);
  for (let s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 5, 6), wheelMat);
    w.position.set(s*0.35, 0.1, 0.5); w.rotation.y = Math.PI/2; w.castShadow = true; g.add(w);
    const w2 = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 5, 6), wheelMat);
    w2.position.set(s*0.35, 0.1, -0.5); w2.rotation.y = Math.PI/2; w2.castShadow = true; g.add(w2);
  }
  g.position.set(x, 0.05, z); g.rotation.y = angle;
  return g;
}

function makeCharacter_() {
  const g = new THREE.Group();
  const skin = 0xd4a57a;
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.5 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.8, map: noiseTexture(64, 64, 58, 58, 74, 8, 1) });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.7, map: noiseTexture(64, 64, 74, 90, 58, 8, 1) });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x2a2a1a, roughness: 0.9 });
  const bagMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.85, map: noiseTexture(64, 64, 90, 74, 58, 8, 1) });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), skinMat);
  head.position.y = 1.55; head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI*2, 0, Math.PI/2.5), hairMat);
  hair.position.y = 1.63; g.add(hair);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.28), shirtMat);
  torso.position.y = 1.15; torso.castShadow = true; g.add(torso);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.08, 6), skinMat);
  neck.position.y = 1.38; g.add(neck);
  const bp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.18), bagMat);
  bp.position.set(0, 1.15, -0.22); g.add(bp);

  for (let s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.45, 7), shirtMat);
    arm.position.set(s*0.32, 1.2, 0); arm.rotation.z = s*0.15; arm.castShadow = true; g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), skinMat);
    hand.position.set(s*0.34, 0.97, 0); g.add(hand);
  }
  for (let s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.55, 7), pantsMat);
    leg.position.set(s*0.13, 0.55, 0); leg.castShadow = true; g.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.14), bootMat);
    foot.position.set(s*0.13, 0.025, 0.03); g.add(foot);
  }
  return g;
}

// ── LOADING ──────────────────────────────────────────
function Loading({ p, onStart }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { if (p>=100) { const t=setTimeout(()=>setReady(true),300); return ()=>clearTimeout(t); } }, [p]);
  return (
    <div className="vsb-loading">
      <div className="vsb-loading-bg" />
      <div className="vsb-loading-box">
        <div className="vsb-loading-icon">☢️</div>
        <h1 className="vsb-loading-title">LAST CITY</h1>
        <p className="vsb-loading-sub">Sobrevivência Cinematográfica</p>
        <div className="vsb-loading-bar"><div className="vsb-loading-fill" style={{width:`${p}%`}}/></div>
        <p className="vsb-loading-pct">{Math.floor(p)}%</p>
        {ready && <button className="vsb-loading-go" onClick={onStart}>▶ ENTRAR</button>}
      </div>
    </div>
  );
}

function ItemModal({ item, onClose, onTake }) {
  return (
    <div className="vsb-modal-overlay" onClick={onClose}>
      <div className="vsb-modal-card" onClick={e=>e.stopPropagation()}>
        <button className="vsb-modal-x" onClick={onClose}>✕</button>
        <div className="vsb-modal-img" style={{background:`radial-gradient(circle,${item.color}22,transparent)`}}>
          <span className="vsb-modal-img-emoji">{item.emoji}</span>
        </div>
        <div className="vsb-modal-info">
          <h2>{item.name}</h2>
          <p>{item.desc}</p>
          <button className="vsb-modal-take" onClick={()=>{onTake(item);onClose();}}>Pegar item</button>
        </div>
      </div>
    </div>
  );
}

function Notif({ msg, onHide }) {
  useEffect(()=>{const t=setTimeout(onHide,3000);return ()=>clearTimeout(t);},[msg,onHide]);
  return <div className="vsb-notif" onClick={onHide}>{msg}</div>;
}

// ── MAIN ──────────────────────────────────────────────
export default function VirtualShoppingBrane() {
  const [phase, setPhase] = useState("loading");
  const [loadP, setLoadP] = useState(0);
  const [hud, setHud] = useState({ health: 100, stamina: 100, hunger: 70, thirst: 60 });
  const [inv, setInv] = useState([]);
  const [foundItem, setFoundItem] = useState(null);
  const [notif, setNotif] = useState("");
  const [view, setView] = useState("world");

  const container = useRef(null);
  const keys = useRef({});
  const charPos = useRef(new THREE.Vector3(0, 0, -2));
  const charRot = useRef(0);
  const camPos = useRef(new THREE.Vector3(0, 2.5, 5));
  const camLook = useRef(new THREE.Vector3(0, 1.2, 0));
  const walkT = useRef(0);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const targetFov = useRef(50);
  const shakeAmt = useRef(0);

  const notify = useCallback(m => setNotif(m), []);

  useEffect(() => {
    let p = 0;
    const int = setInterval(() => { p+=2+Math.random()*4; if(p>100) p=100; setLoadP(p); if(p>=100) clearInterval(int); }, 120);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (phase !== "world") return;
    const el = container.current;
    if (!el) return;
    let dead = false;

    try {
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.9;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x88aacc);
      scene.fog = new THREE.FogExp2(0x88aacc, 0.004);

      const camera = new THREE.PerspectiveCamera(50, el.clientWidth/el.clientHeight, 0.1, 120);

      // ── Post-processing ──
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const ssaoPass = new SSAOPass(scene, camera, el.clientWidth, el.clientHeight);
      ssaoPass.kernelRadius = 0.6;
      ssaoPass.minDistance = 0.005;
      ssaoPass.maxDistance = 0.08;
      ssaoPass.renderToScreen = false;
      composer.addPass(ssaoPass);

      const bloom = new UnrealBloomPass(new THREE.Vector2(el.clientWidth, el.clientHeight), 0.12, 0.4, 0.85);
      bloom.renderToScreen = false;
      composer.addPass(bloom);
      composer.addPass(new OutputPass());

      // ── Sky dome ──
      (() => {
        const skyGeo = new THREE.SphereGeometry(85, 24, 20);
        const skyTex = skyGradientTex();
        const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false });
        const sky = new THREE.Mesh(skyGeo, skyMat);
        sky.position.y = -2;
        scene.add(sky);
      })();

      // ── Lighting ──
      const ambient = new THREE.AmbientLight(0x88aacc, 0.2);
      scene.add(ambient);
      const hemi = new THREE.HemisphereLight(0x88bbdd, 0x554433, 0.35);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xffddaa, 1.3);
      sun.position.set(25, 38, 18);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 65;
      sun.shadow.camera.left = -35;
      sun.shadow.camera.right = 35;
      sun.shadow.camera.top = 35;
      sun.shadow.camera.bottom = -35;
      sun.shadow.bias = -0.0005;
      sun.shadow.normalBias = 0.02;
      scene.add(sun);

      const warmFill = new THREE.DirectionalLight(0xffcc88, 0.25);
      warmFill.position.set(-15, 12, -20);
      scene.add(warmFill);

      const rimBlue = new THREE.DirectionalLight(0x88bbff, 0.15);
      rimBlue.position.set(-25, 10, 30);
      scene.add(rimBlue);

      // ── Ground ──
      scene.add(makeGround());

      // ── Roads ──
      [[0,-10,2,18,0],[0,12,2,12,0],[-14,0,12,2,0],[12,0,10,2,0],[-10,8,2,10,Math.PI/3],[8,-6,2,10,-Math.PI/4]].forEach(r => scene.add(makeRoad(...r)));

      // ── Buildings ──
      BUILDINGS.forEach(b => scene.add(makeBuilding_(b)));

      // ── Trees ──
      const treePositions = [];
      for (let i = 0; i < WORLD.treeCount; i++) {
        let x, z, ok, att = 0;
        do {
          x = (Math.random()-0.5)*WORLD.size*0.7;
          z = (Math.random()-0.5)*WORLD.size*0.7;
          ok = !BUILDINGS.some(b => Math.hypot(x-b.x, z-b.z) < 3) && !treePositions.some(t => Math.hypot(x-t.x, z-t.z) < 2);
          att++;
        } while (!ok && att < 20);
        if (ok) { scene.add(makeTree_(x, z, 0.5+Math.random()*0.7)); treePositions.push({x,z}); }
      }

      for (let i = 0; i < 60; i++) {
        const x = (Math.random()-0.5)*WORLD.size*0.65;
        const z = (Math.random()-0.5)*WORLD.size*0.65;
        if (!BUILDINGS.some(b => Math.hypot(x-b.x, z-b.z) < 2)) scene.add(makeBush(x, z, 0.4+Math.random()*0.6));
      }

      for (let i = 0; i < WORLD.rockCount; i++) {
        const x = (Math.random()-0.5)*WORLD.size*0.7;
        const z = (Math.random()-0.5)*WORLD.size*0.7;
        scene.add(makeRock_(x, z, 0.3+Math.random()));
      }

      const carsData = [[-8,-4,0.2],[6,5,-0.8],[-15,12,1.5],[10,-8,-0.3]];
      carsData.forEach(c => scene.add(makeCar(c[0], c[1], c[2])));

      const character = makeCharacter_();
      scene.add(character);

      // ── Interactives ──
      const interactiveMeshes = [];
      INTERACTIVES.forEach((item) => {
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.2 }));
        glow.position.set(item.x, 0.15, item.z);
        scene.add(glow);
        interactiveMeshes.push({ mesh: glow, item, collected: false });
      });

      // ── Rain (hidden, locked daytime) ──
      const rc = 2000;
      const rGeo = new THREE.BufferGeometry();
      const rPos = new Float32Array(rc*3);
      for (let i = 0; i < rc*3; i++) rPos[i] = (Math.random()-0.5)*80;
      rGeo.setAttribute("position", new THREE.BufferAttribute(rPos, 3));
      const rain = new THREE.Points(rGeo, new THREE.PointsMaterial({ color: 0x88bbff, size: 0.035, transparent: true, opacity: 0.15, depthWrite: false }));
      rain.visible = false;
      scene.add(rain);

      // ── Atmosphere particles ──
      const pc = 500;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pc*3);
      for (let i = 0; i < pc*3; i++) pPos[i] = (Math.random()-0.5)*60;
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xddeeff, size: 0.04, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }));
      particles.position.y = 3;
      scene.add(particles);

      // ── Dust near ground ──
      const dc = 300;
      const dGeo = new THREE.BufferGeometry();
      const dPos = new Float32Array(dc*3);
      for (let i = 0; i < dc*3; i++) dPos[i] = (Math.random()-0.5)*50;
      dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
      const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xccddee, size: 0.025, transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending, depthWrite: false }));
      dust.position.y = 0.15;
      scene.add(dust);

      // ── Audio ──
      let audioCtx, audioSource, audioGain;
      try {
        audioCtx = new (window.AudioContext||window.webkitAudioContext)();
        const bufSize = audioCtx.sampleRate*2;
        const buffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random()*2-1;
        audioSource = audioCtx.createBufferSource();
        audioSource.buffer = buffer; audioSource.loop = true;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "lowpass"; filter.frequency.value = 150;
        audioGain = audioCtx.createGain();
        audioGain.gain.value = 0.06;
        audioSource.connect(filter); filter.connect(audioGain); audioGain.connect(audioCtx.destination);
        audioSource.start();
      } catch (e) {}

      // ── Controls ──
      const onKey = (e, down) => {
        keys.current[e.key.toLowerCase()] = down;
        if (e.key.toLowerCase() === "i" && down && view === "world") setView("inventory");
      };
      document.addEventListener("keydown", (e) => onKey(e, true));
      document.addEventListener("keyup", (e) => onKey(e, false));

      const onMouse = (e) => {
        if (document.pointerLockElement === renderer.domElement) {
          mouseX.current += e.movementX * 0.002;
          mouseY.current = Math.max(-1, Math.min(1, mouseY.current - e.movementY * 0.002));
        }
      };
      renderer.domElement.addEventListener("click", () => renderer.domElement.requestPointerLock());
      document.addEventListener("mousemove", onMouse);

      const onResize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        camera.aspect = w/h; camera.updateProjectionMatrix();
        renderer.setSize(w, h); composer.setSize(w, h);
        ssaoPass.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      // ── Game Loop ──
      const clock = new THREE.Clock();
      const MIDDAY = new THREE.Color(0x88aacc);

      const animate = () => {
        if (dead) return;
        const delta = Math.min(clock.getDelta(), 0.05);
        const t = clock.getElapsedTime();
        const k = keys.current;

        const fwd = k["w"]||k["arrowup"], bwd = k["s"]||k["arrowdown"];
        const lft = k["a"]||k["arrowleft"], rgt = k["d"]||k["arrowright"];
        const run = k["shift"];
        const speed = run ? 3.5 : 1.8;
        let mx = 0, mz = 0;
        if (fwd) mz -= 1; if (bwd) mz += 1; if (lft) mx -= 1; if (rgt) mx += 1;

        const moving = mx !== 0 || mz !== 0;
        if (moving) {
          const len = Math.hypot(mx, mz); mx /= len; mz /= len;
          const ta = Math.atan2(mx, mz);
          let diff = ta - charRot.current;
          while (diff > Math.PI) diff -= Math.PI*2;
          while (diff < -Math.PI) diff += Math.PI*2;
          charRot.current += diff * delta * 10;
          charPos.current.x += Math.sin(charRot.current) * speed * delta;
          charPos.current.z += Math.cos(charRot.current) * speed * delta;
          walkT.current += delta * (run ? 2.0 : 1.2);
          shakeAmt.current = run ? 0.015 : 0.005;
        } else { shakeAmt.current *= 0.95; }

        character.position.copy(charPos.current);
        character.rotation.y = charRot.current;

        if (moving) {
          character.position.y = Math.sin(walkT.current*7)*0.02;
          const swing = Math.sin(walkT.current*7)*0.3;
          const legSwing = Math.sin(walkT.current*7)*0.25;
          const c = character.children;
          if (c.length>=6) { c[4].rotation.x=legSwing; c[5].rotation.x=-legSwing; c[2].rotation.x=-swing; c[3].rotation.x=swing; }
        } else {
          const c = character.children;
          if (c.length>=6) { c[4].rotation.x*=0.9; c[5].rotation.x*=0.9; c[2].rotation.x*=0.9; c[3].rotation.x*=0.9; }
        }

        interactiveMeshes.forEach((obj) => {
          if (obj.collected) return;
          obj.mesh.material.opacity = 0.15 + Math.sin(t*2 + obj.item.x)*0.08;
          const dist = Math.hypot(charPos.current.x-obj.item.x, charPos.current.z-obj.item.z);
          if (dist < 1.5 && k["e"]) { obj.collected = true; scene.remove(obj.mesh); setFoundItem(obj.item); }
        });

        // Camera — true 360° orbit
        const dist = run ? 5.5 : 4.5;
        const angle = mouseX.current;
        const vert = Math.max(-0.35, Math.min(0.7, mouseY.current*0.45));
        const targetPos = new THREE.Vector3(
          charPos.current.x + Math.sin(angle)*dist*Math.cos(vert),
          charPos.current.y + 1.5 + Math.sin(vert)*dist,
          charPos.current.z + Math.cos(angle)*dist*Math.cos(vert)
        );
        camPos.current.lerp(targetPos, delta*8);
        const lookTarget = new THREE.Vector3(charPos.current.x, 1.0+vert*0.5, charPos.current.z);
        camLook.current.lerp(lookTarget, delta*8);
        camera.position.copy(camPos.current);
        camera.lookAt(camLook.current);

        targetFov.current = run ? 60 : 50;
        camera.fov += (targetFov.current - camera.fov) * delta * 3;
        camera.updateProjectionMatrix();

        // Fixed midday — no time progression, no auto-exposure
        renderer.toneMappingExposure = 0.9;
        sun.intensity = 1.3;
        ambient.intensity = 0.2;
        hemi.intensity = 0.35;
        warmFill.intensity = 0.25;
        rimBlue.intensity = 0.15;
        scene.background.copy(MIDDAY);
        scene.fog.color.copy(MIDDAY);
        scene.fog.density = 0.004;
        bloom.strength = 0.12;

        particles.rotation.y += delta * 0.01;
        dust.rotation.y += delta * 0.008;

        // HUD
        if (run && moving) setHud(h => ({...h, stamina:Math.max(0, h.stamina-8*delta)}));
        else if (!moving) setHud(h => ({...h, stamina:Math.min(100, h.stamina+6*delta)}));
        setHud(h => ({...h, hunger:Math.max(0, h.hunger-delta*0.3), thirst:Math.max(0, h.thirst-delta*0.4)}));

        composer.render();
        animRef.current = requestAnimationFrame(animate);
      };

      const animRef = { current: requestAnimationFrame(animate) };

      return () => {
        dead = true;
        cancelAnimationFrame(animRef.current);
        if (audioSource) try { audioSource.stop(); } catch (e) {}
        if (audioCtx) try { audioCtx.close(); } catch (e) {}
        document.removeEventListener("keydown", (e) => onKey(e, true));
        document.removeEventListener("mousemove", onMouse);
        if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
        window.removeEventListener("resize", onResize);
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer.dispose();
      };
    } catch (err) { console.error("[VSB Error]", err); }
  }, [phase]);

  if (phase === "loading") return <Loading p={loadP} onStart={() => setPhase("world")} />;

  if (view === "inventory") {
    return (
      <div className="vsb-inventory">
        <div className="vsb-inv-top"><h2>🎒 INVENTÁRIO</h2><button className="vsb-back-btn" onClick={() => setView("world")}>Fechar</button></div>
        <div className="vsb-inv-grid">
          {inv.length === 0 ? <p className="vsb-inv-none">Nenhum item encontrado. Explore o mundo.</p> :
            inv.map((item, i) => (
              <div key={i} className="vsb-inv-slot">
                <span className="vsb-inv-emoji">{item.emoji}</span>
                <span className="vsb-inv-name">{item.name}</span>
                <span className="vsb-inv-qty">x{item.qty||1}</span>
              </div>
            ))
          }
        </div>
        <div className="vsb-inv-stats">
          <span>❤️ {Math.floor(hud.health)}</span><span>⚡ {Math.floor(hud.stamina)}</span>
          <span>🍞 {Math.floor(hud.hunger)}</span><span>💧 {Math.floor(hud.thirst)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vsb-world">
      <div ref={container} className="vsb-canvas" />
      <div className="vsb-letterbox-t" /><div className="vsb-letterbox-b" />
      <div className="vsb-vignette" />
      <div className="vsb-hud">
        <div className="vsb-hud-bars">
          <div className="vsb-hud-bar"><span>❤️</span><div className="vsb-hud-track"><div className="vsb-hud-fill health" style={{width:`${hud.health}%`}}/></div></div>
          <div className="vsb-hud-bar"><span>⚡</span><div className="vsb-hud-track"><div className="vsb-hud-fill stamina" style={{width:`${hud.stamina}%`}}/></div></div>
          <div className="vsb-hud-bar"><span>🍞</span><div className="vsb-hud-track"><div className="vsb-hud-fill hunger" style={{width:`${hud.hunger}%`}}/></div></div>
          <div className="vsb-hud-bar"><span>💧</span><div className="vsb-hud-track"><div className="vsb-hud-fill thirst" style={{width:`${hud.thirst}%`}}/></div></div>
        </div>
        <div className="vsb-hud-controls"><span>WASD</span><span>Shift correr</span><span>I inventário</span><span>Mouse olhar</span><span>E pegar</span></div>
        <div className="vsb-hud-location">ZONA ABANDONADA — SETOR 7</div>
        <button className="vsb-hud-inv" onClick={() => setView("inventory")}>🎒<span className="vsb-hud-count">{inv.length}</span></button>
        <div className="vsb-hud-interact">Pressione E para interagir</div>
      </div>
      {foundItem && <ItemModal item={foundItem} onClose={() => setFoundItem(null)} onTake={(item) => {
        setInv(p => { const e = p.find(i => i.name === item.name); return e ? p.map(i => i.name === item.name ? {...i, qty:(i.qty||1)+1} : i) : [...p, {...item, qty:1}]; });
        notify(`${item.name} coletado!`);
      }} />}
      {notif && <Notif msg={notif} onHide={() => setNotif("")} />}
    </div>
  );
}
