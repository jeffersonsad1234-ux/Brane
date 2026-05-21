import * as THREE from "three";
import { fbm } from "./noise.js";

export function makeTex(w, h, fn) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); const d = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b] = fn(x / w, y / h);
    const i = (y * w + x) * 4;
    d.data[i] = Math.floor(r * 255); d.data[i+1] = Math.floor(g * 255);
    d.data[i+2] = Math.floor(b * 255); d.data[i+3] = 255;
  }
  ctx.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function makeGrassTex() { return makeTex(64,64,(x,y)=>{const n=fbm(x*8+100,y*8+100,3);return[0.1+n*0.15,0.32+n*0.25,0.04+n*0.08]}); }
export function makeStoneTex() { return makeTex(64,64,(x,y)=>{const n=fbm(x*6+200,y*6+200,4);return[0.35+n*0.15,0.3+n*0.12,0.25+n*0.1]}); }
export function makeWoodTex() { return makeTex(64,64,(x,y)=>{const g=fbm(x*20,y*2+300,3)*0.12;return[0.35+g,0.2+g,0.08+g]}); }
export function makeSandTex() { return makeTex(64,64,(x,y)=>{const n=fbm(x*10+400,y*10+400,3);return[0.7+n*0.1,0.6+n*0.08,0.35+n*0.06]}); }
export function makeRoofTex() { return makeTex(64,64,(x,y)=>{const n=fbm(x*12+500,y*12+500,3);return[0.45+n*0.12,0.22+n*0.08,0.1+n*0.05]}); }

export function makeEnvMap() {
  const size = 16; const data = [];
  for (let i = 0; i < 6; i++) {
    const c = document.createElement("canvas"); c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0,0,0,size);
    g.addColorStop(0,"#87CEEB"); g.addColorStop(0.4,"#87CEEB"); g.addColorStop(1,"#8B7355");
    ctx.fillStyle = g; ctx.fillRect(0,0,size,size);
    data.push(c);
  }
  const ct = new THREE.CubeTexture(data); ct.needsUpdate = true;
  return ct;
}
