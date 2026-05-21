import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

function rng(min, max) { return min + Math.random() * (max - min); }

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ─── RING TEXTURE ──────────────────────────────────────
function createRingTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 64;
  const ctx = c.getContext("2d");
  const grd = ctx.createLinearGradient(0, 0, c.width, 0);
  grd.addColorStop(0, "rgba(0,0,0,0)");
  grd.addColorStop(0.05, "rgba(180,160,140,0.7)");
  grd.addColorStop(0.15, "rgba(200,180,160,0.9)");
  grd.addColorStop(0.25, "rgba(0,0,0,0)");
  grd.addColorStop(0.35, "rgba(160,150,140,0.6)");
  grd.addColorStop(0.5, "rgba(180,170,150,0.8)");
  grd.addColorStop(0.65, "rgba(0,0,0,0)");
  grd.addColorStop(0.75, "rgba(140,130,120,0.5)");
  grd.addColorStop(0.9, "rgba(100,90,80,0.2)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * c.width, y = Math.random() * c.height;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ─── PLANET TEXTURE ────────────────────────────────────
function createPlanetTexture(hue, sat, lightnessVariation) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 128;
  const ctx = c.getContext("2d");
  for (let y = 0; y < c.height; y++) {
    const v = Math.sin(y * 0.05) * 0.5 + 0.5;
    const n = (Math.random() - 0.5) * lightnessVariation;
    const l = 30 + v * 40 + n;
    ctx.fillStyle = `hsl(${hue + Math.sin(y * 0.1) * 15}, ${sat}%, ${clamp(l, 15, 85)}%)`;
    ctx.fillRect(0, y, c.width, 1);
    for (let x = 0; x < c.width; x++) {
      if (Math.random() < 0.01) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
        ctx.fillRect(x, y, 2 + Math.random() * 4, 1);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export default class SpaceDemo {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.state = { speed: 0, cruising: false };
    this.keys = {};
    this.running = false;
    this.clock = new THREE.Clock();
    this.objects = [];
    this.postMesh = null;
  }

  init() {
    try {
      this._setupRenderer();
      this._setupScene();
      this._setupPostProcessing();
      this._createStarfield();
      this._createNebulae();
      this._createGalaxy();
      this._createPlanets();
      this._createCockpit();
      this._createSpeedParticles();
      this._setupPlayer();
      this._setupInput();
      this._startLoop();
      return true;
    } catch (e) {
      console.error("[SpaceDemo] Init error:", e);
      return false;
    }
  }

  // ─── RENDERER ────────────────────────────────────────
  _setupRenderer() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this._onResize = () => {
      const cw = this.container.clientWidth, ch = this.container.clientHeight;
      this.camera.aspect = cw / ch;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(cw, ch);
      if (this.composer) this.composer.setSize(cw, ch);
    };
    window.addEventListener("resize", this._onResize);
  }

  // ─── SCENE ───────────────────────────────────────────
  _setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000005);
  }

  // ─── POST-PROCESSING ─────────────────────────────────
  _setupPostProcessing() {
    try {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      const bloom = new UnrealBloomPass(
        new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
        0.4, 0.3, 0.05
      );
      this.composer.addPass(bloom);

      this.composer.addPass(new OutputPass());
    } catch (e) {
      console.warn("[SpaceDemo] Post-processing unavailable:", e.message);
      this.composer = null;
    }
  }

  // ─── STARFIELD ───────────────────────────────────────
  _createStarfield() {
    const count = 12000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 300 + Math.random() * 700;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.cos(phi);
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const rnd = Math.random();
      if (rnd < 0.05) {
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
      } else if (rnd < 0.1) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 0.5;
      } else if (rnd < 0.13) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.6;
      } else {
        const v = 0.6 + Math.random() * 0.4;
        colors[i * 3] = v; colors[i * 3 + 1] = v; colors[i * 3 + 2] = v + 0.05;
      }
      sizes[i] = 0.5 + Math.random() * 2.5;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const stars = new THREE.Points(geo, mat);
    this.scene.add(stars);
    this.objects.push(stars);
    this.starField = stars;
  }

  // ─── NEBULAE ─────────────────────────────────────────
  _createNebulae() {
    const nebulaConfigs = [
      { pos: [120, 40, -200], color: [0.4, 0.1, 0.6], radius: 80, count: 800 },
      { pos: [-180, -30, -150], color: [0.1, 0.3, 0.7], radius: 60, count: 600 },
      { pos: [60, -50, -300], color: [0.6, 0.1, 0.3], radius: 70, count: 600 },
      { pos: [-100, 60, -250], color: [0.0, 0.5, 0.5], radius: 50, count: 400 },
    ];

    for (const cfg of nebulaConfigs) {
      const count = cfg.count;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = Math.random() * cfg.radius;
        pos[i * 3] = cfg.pos[0] + r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = cfg.pos[1] + r * Math.cos(phi) * 0.4;
        pos[i * 3 + 2] = cfg.pos[2] + r * Math.sin(phi) * Math.sin(theta);
        const density = 1 - (r / cfg.radius);
        colors[i * 3] = cfg.color[0] * density * (0.5 + Math.random() * 0.5);
        colors[i * 3 + 1] = cfg.color[1] * density * (0.5 + Math.random() * 0.5);
        colors[i * 3 + 2] = cfg.color[2] * density * (0.5 + Math.random() * 0.5);
      }

      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const mat = new THREE.PointsMaterial({
        size: 2.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });

      const nebula = new THREE.Points(geo, mat);
      this.scene.add(nebula);
      this.objects.push(nebula);
    }
  }

  // ─── GALAXY ──────────────────────────────────────────
  _createGalaxy() {
    const count = 3000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const arm = Math.floor(Math.random() * 3);
      const angleOffset = arm * Math.PI * 2 / 3;
      const radius = 2 + Math.random() * 4;
      const angle = angleOffset + radius * 0.8 + (Math.random() - 0.5) * 0.3;
      const spread = (Math.random() - 0.5) * 0.05 * radius * 2;
      pos[i * 3] = 400 + Math.cos(angle) * radius * 15 + spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 2] = -500 + Math.sin(angle) * radius * 15 + spread;

      const brightness = Math.max(0, 1 - radius / 6) * 0.8 + 0.2;
      colors[i * 3] = brightness * 0.8;
      colors[i * 3 + 1] = brightness * 0.6 + 0.1;
      colors[i * 3 + 2] = brightness;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const galaxy = new THREE.Points(geo, mat);
    this.scene.add(galaxy);
    this.objects.push(galaxy);
  }

  // ─── PLANETS ─────────────────────────────────────────
  _createPlanets() {
    const ringTex = createRingTexture();

    const planetDefs = [
      { radius: 8, hue: 25, sat: 60, pos: [150, 0, -250], ring: false, glow: 0x442200 },
      { radius: 12, hue: 210, sat: 40, pos: [-200, 20, -180], ring: true, ringColor: 0x88aadd, glow: 0x004488 },
      { radius: 5, hue: 350, sat: 30, pos: [80, -40, -350], ring: false, glow: 0x440022 },
      { radius: 3, hue: 40, sat: 20, pos: [-60, 15, -300], ring: false, glow: 0x443300 },
      { radius: 15, hue: 180, sat: 50, pos: [250, 50, -200], ring: true, ringColor: 0x88ddcc, glow: 0x004488 },
    ];

    for (const def of planetDefs) {
      const tex = createPlanetTexture(def.hue, def.sat, 15);
      const geo = new THREE.SphereGeometry(def.radius, 48, 48);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.5,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(def.pos[0], def.pos[1], def.pos[2]);
      mesh.castShadow = true;
      this.scene.add(mesh);
      this.objects.push(mesh);

      // Atmosphere glow
      const glowMat = new THREE.MeshBasicMaterial({
        color: def.glow,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      });
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(def.radius * 1.3, 32, 32),
        glowMat
      );
      glow.position.copy(mesh.position);
      this.scene.add(glow);
      this.objects.push(glow);

      // Rings
      if (def.ring) {
        const rGeo = new THREE.RingGeometry(def.radius * 1.5, def.radius * 3.5, 64);
        const rMat = new THREE.MeshBasicMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        });
        const ring = new THREE.Mesh(rGeo, rMat);
        ring.position.copy(mesh.position);
        ring.rotation.x = Math.PI / 3.5;
        ring.rotation.z = 0.2;
        this.scene.add(ring);
        this.objects.push(ring);

        // Thin inner ring
        const r2Geo = new THREE.RingGeometry(def.radius * 1.2, def.radius * 1.4, 64);
        const r2Mat = new THREE.MeshBasicMaterial({
          color: 0x88ccff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        });
        const r2 = new THREE.Mesh(r2Geo, r2Mat);
        r2.position.copy(mesh.position);
        r2.rotation.x = Math.PI / 3.5;
        r2.rotation.z = 0.2;
        this.scene.add(r2);
        this.objects.push(r2);
      }

      // Store for animation
      mesh.userData = { spinSpeed: 0.1 + Math.random() * 0.2, def };
    }
  }

  // ─── COCKPIT ─────────────────────────────────────────
  _createCockpit() {
    this.cockpitGroup = new THREE.Group();
    this.scene.add(this.cockpitGroup);
    this.objects.push(this.cockpitGroup);

    const darkMetal = { color: 0x12121e, roughness: 0.4, metalness: 0.85 };
    const darkTrim = { color: 0x1a1a2e, roughness: 0.3, metalness: 0.9 };
    const neonCyan = { color: 0x00ddff, emissive: 0x00ddff, emissiveIntensity: 0.6 };
    const neonBlue = { color: 0x0066ff, emissive: 0x0066ff, emissiveIntensity: 0.4 };
    const neonAmber = { color: 0xff8800, emissive: 0xff8800, emissiveIntensity: 0.3 };
    const holoMat = new THREE.MeshStandardMaterial({
      color: 0x00aaff, emissive: 0x0088ff, emissiveIntensity: 0.2,
      transparent: true, opacity: 0.2, side: THREE.DoubleSide,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x08081a, roughness: 0.1, metalness: 0.95,
      transparent: true, opacity: 0.25,
    });

    const dm = (opt) => new THREE.MeshStandardMaterial(opt);
    const db = (g, m) => { const o = new THREE.Mesh(g, dm(m)); return o; };

    // Floor
    const floor = db(new THREE.PlaneGeometry(2.8, 1.6), { ...darkMetal, side: THREE.DoubleSide });
    floor.position.set(0, -0.85, -1.4);
    floor.rotation.x = -0.25;
    this.cockpitGroup.add(floor);

    // Dashboard main panel
    const dash = db(new THREE.BoxGeometry(2.2, 0.12, 0.5), darkMetal);
    dash.position.set(0, -0.55, -1.85);
    this.cockpitGroup.add(dash);

    // Dashboard slope (angled screen area)
    const dashSlope = db(new THREE.BoxGeometry(1.8, 0.02, 0.3), darkTrim);
    dashSlope.position.set(0, -0.46, -1.95);
    dashSlope.rotation.x = 0.3;
    this.cockpitGroup.add(dashSlope);

    // Holographic main display
    const holo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), holoMat);
    holo.position.set(0, -0.3, -2.0);
    this.cockpitGroup.add(holo);

    // Holographic border glow
    const holoBorder = new THREE.Line(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.95, 0.6)),
      new THREE.LineBasicMaterial({ color: 0x00ddff, transparent: true, opacity: 0.5 })
    );
    holoBorder.position.set(0, -0.3, -1.99);
    this.cockpitGroup.add(holoBorder);

    // Holographic inner grid lines
    for (let i = -2; i <= 2; i++) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(i * 0.12, -0.55, -1.99),
          new THREE.Vector3(i * 0.12, -0.05, -1.99),
        ]),
        new THREE.LineBasicMaterial({ color: 0x0044aa, transparent: true, opacity: 0.15 })
      );
      this.cockpitGroup.add(line);
    }
    for (let i = -2; i <= 2; i++) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.45, -0.3 + i * 0.06, -1.99),
          new THREE.Vector3(0.45, -0.3 + i * 0.06, -1.99),
        ]),
        new THREE.LineBasicMaterial({ color: 0x0044aa, transparent: true, opacity: 0.15 })
      );
      this.cockpitGroup.add(line);
    }

    // Side panels
    for (const side of [-1, 1]) {
      const panel = db(new THREE.BoxGeometry(0.25, 0.65, 0.9), darkMetal);
      panel.position.set(side * 1.25, -0.3, -1.5);
      this.cockpitGroup.add(panel);

      // Neon accent strip
      const strip = db(new THREE.BoxGeometry(0.02, 0.01, 0.8), { ...neonCyan, emissiveIntensity: 0.4 });
      strip.position.set(side * 1.38, -0.3, -1.5);
      this.cockpitGroup.add(strip);

      // Control buttons
      for (let i = 0; i < 4; i++) {
        const colors = [0x00ff44, 0xffaa00, 0xff3344, 0x00ccff];
        const btn = new THREE.Mesh(
          new THREE.CircleGeometry(0.025, 8),
          new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
        );
        btn.position.set(side * 1.25, -0.1 + i * 0.1, -1.1);
        this.cockpitGroup.add(btn);
      }

      // Small screen on side panel
      const screen = db(new THREE.PlaneGeometry(0.12, 0.08), {
        color: 0x002244, emissive: 0x004488, emissiveIntensity: 0.3,
      });
      screen.position.set(side * 1.25, 0.1, -1.85);
      this.cockpitGroup.add(screen);
    }

    // Cockpit window frame
    const frameMat = dm(darkMetal);
    const corners = [
      { x: -0.7, y: 0.65, z: -1.8 },
      { x: 0.7, y: 0.65, z: -1.8 },
      { x: -0.7, y: -0.45, z: -1.8 },
      { x: 0.7, y: -0.45, z: -1.8 },
    ];
    for (const c of corners) {
      const pillar = db(new THREE.BoxGeometry(0.06, 0.06, 0.15), darkMetal);
      pillar.position.set(c.x, c.y, c.z);
      this.cockpitGroup.add(pillar);
    }

    // Top frame bar
    const topBar = db(new THREE.BoxGeometry(1.5, 0.04, 0.06), darkMetal);
    topBar.position.set(0, 0.68, -1.8);
    this.cockpitGroup.add(topBar);

    // Bottom frame bar
    const botBar = db(new THREE.BoxGeometry(1.5, 0.04, 0.06), darkMetal);
    botBar.position.set(0, -0.48, -1.8);
    this.cockpitGroup.add(botBar);

    // Canopy glass
    const canopy = db(new THREE.BoxGeometry(1.7, 0.9, 0.3), glassMat);
    canopy.position.set(0, 0.2, -1.9);
    this.cockpitGroup.add(canopy);

    // Center joystick
    const jMat = dm({ color: 0x22223a, roughness: 0.4, metalness: 0.8 });
    const jBase = db(new THREE.CylinderGeometry(0.06, 0.1, 0.12, 8), jMat);
    jBase.position.set(0, -0.7, -1.3);
    this.cockpitGroup.add(jBase);

    const jStick = db(new THREE.CylinderGeometry(0.018, 0.025, 0.35, 6), jMat);
    jStick.position.set(0, -0.5, -1.3);
    jStick.rotation.x = 0.3;
    this.cockpitGroup.add(jStick);

    // Joystick grip
    const grip = db(new THREE.SphereGeometry(0.035, 6, 6),
      dm({ color: 0x33334a, roughness: 0.6, metalness: 0.3 }));
    grip.position.set(0, -0.32, -1.33);
    this.cockpitGroup.add(grip);

    // Neon ambient strips (along floor edges)
    for (const side of [-1, 1]) {
      const glow = db(new THREE.BoxGeometry(0.015, 0.005, 1.4),
        { ...neonCyan, emissiveIntensity: 0.2 });
      glow.position.set(side * 1.1, -0.83, -1.2);
      this.cockpitGroup.add(glow);
    }

    // Dashboard neon accent
    const dashGlow = db(new THREE.BoxGeometry(1.6, 0.01, 0.02),
      { ...neonBlue, emissiveIntensity: 0.3 });
    dashGlow.position.set(0, -0.48, -2.07);
    this.cockpitGroup.add(dashGlow);

    // Lighting
    const cockpitLight = new THREE.PointLight(0x00ccff, 0.4, 4);
    cockpitLight.position.set(0, -0.1, -1.5);
    this.cockpitGroup.add(cockpitLight);

    const dashLight = new THREE.PointLight(0x0066ff, 0.2, 2);
    dashLight.position.set(0, -0.3, -1.8);
    this.cockpitGroup.add(dashLight);

    // Holographic rotating element
    const ringGeo = new THREE.TorusGeometry(0.12, 0.01, 8, 20);
    const ringMat = dm({ ...neonCyan, emissiveIntensity: 0.5 });
    const holoRing = new THREE.Mesh(ringGeo, ringMat);
    holoRing.position.set(0, -0.2, -1.99);
    this.cockpitGroup.add(holoRing);
    this.holoRing = holoRing;

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.005, 8, 20),
      dm({ ...neonAmber, emissiveIntensity: 0.3 }));
    ring2.position.set(0, -0.2, -1.99);
    ring2.rotation.x = Math.PI / 3;
    this.cockpitGroup.add(ring2);
    this.holoRing2 = ring2;
  }

  // ─── SPEED PARTICLES ─────────────────────────────────
  _createSpeedParticles() {
    this.spGroup = new THREE.Group();
    this.scene.add(this.spGroup);
    this.objects.push(this.spGroup);

    const count = 2000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    this.spData = [];

    for (let i = 0; i < count; i++) {
      const x = rng(-60, 60);
      const y = rng(-25, 25);
      const z = rng(-80, 20);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      alphas[i] = Math.random();
      this.spData.push({ x, y, z, life: Math.random() });
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x8888cc,
      size: 0.1,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.spPoints = new THREE.Points(geo, mat);
    this.spGroup.add(this.spPoints);
    this.spPos = pos;
  }

  // ─── PLAYER ──────────────────────────────────────────
  _setupPlayer() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000);
    this.shipPos = new THREE.Vector3(0, 0, 0);
    this.shipVel = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.camera.position.set(0, 0, 0);

    this.thrustPower = 0;
    this.maxSpeed = 40;
    this.acceleration = 25;
    this.deceleration = 15;
    this.boostMultiplier = 2.5;
  }

  // ─── INPUT ───────────────────────────────────────────
  _setupInput() {
    this._onKeyDown = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if ([' ', 'control'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    this._onKeyUp = (e) => { this.keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);

    this._onMouseMove = (e) => {
      if (document.pointerLockElement !== this.container) return;
      this.yaw -= e.movementX * 0.002;
      this.pitch -= e.movementY * 0.002;
      this.pitch = clamp(this.pitch, -Math.PI / 3, Math.PI / 3);
    };
    document.addEventListener("mousemove", this._onMouseMove);

    this._onPointerLockChange = () => {
      this.container.style.cursor =
        document.pointerLockElement === this.container ? 'default' : 'pointer';
    };
    document.addEventListener("pointerlockchange", this._onPointerLockChange);

    this._onClick = () => {
      if (document.pointerLockElement !== this.container) {
        this.container.requestPointerLock();
      }
    };
    this.container.addEventListener("click", this._onClick);
  }

  // ─── LOOP ────────────────────────────────────────────
  _startLoop() {
    this.running = true;
    this.clock.start();
    const loop = () => {
      if (!this.running) return;
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this._update(dt);
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    };
    loop();
  }

  _update(dt) {
    this._updateMovement(dt);
    this._updateCockpit(dt);
    this._updateSpeedParticles(dt);
    this._updatePlanets(dt);
  }

  _updateMovement(dt) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));

    // Throttle with W/S
    if (this.keys['w']) {
      this.thrustPower = Math.min(1, this.thrustPower + dt * 1.5);
    } else if (this.keys['s']) {
      this.thrustPower = Math.max(-0.5, this.thrustPower - dt * 1.5);
    } else {
      this.thrustPower *= 0.95;
    }

    const boost = this.keys['shift'] ? this.boostMultiplier : 1;
    const targetSpeed = this.thrustPower * this.maxSpeed * boost;

    // Smooth speed transition
    const currentSpeed = this.shipVel.length();
    const fwdSpeed = this.shipVel.dot(forward);
    const accel = fwdSpeed < targetSpeed ? this.acceleration : this.deceleration;
    const newFwdSpeed = fwdSpeed + Math.sign(targetSpeed - fwdSpeed) * accel * dt;
    const clampedSpeed = Math.abs(newFwdSpeed) < 0.05 ? 0 : newFwdSpeed;

    this.shipVel.copy(forward).multiplyScalar(clampedSpeed);

    // Lateral movement (A/D)
    if (this.keys['a'] || this.keys['d']) {
      const right = new THREE.Vector3(forward.z, 0, -forward.x);
      const lateralDir = this.keys['a'] ? -1 : 1;
      const lateral = right.clone().multiplyScalar(lateralDir * 8 * dt);
      this.shipVel.add(lateral);
    }

    // Apply velocity
    this.shipPos.x += this.shipVel.x * dt;
    this.shipPos.y += this.shipVel.y * dt;
    this.shipPos.z += this.shipVel.z * dt;

    // Pitch affects vertical velocity slightly
    if (Math.abs(this.pitch) > 0.1 && clampedSpeed > 1) {
      this.shipPos.y -= this.pitch * 0.5 * dt * (clampedSpeed / this.maxSpeed);
    }

    // Camera follows ship
    this.camera.position.copy(this.shipPos);
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);

    // Cockpit follows ship (does NOT rotate with camera)
    this.cockpitGroup.position.copy(this.shipPos);

    // Speed particles follow ship
    this.spGroup.position.copy(this.shipPos);

    // State
    this.state.speed = Math.round(Math.abs(clampedSpeed));
    this.state.cruising = clampedSpeed > 1;
    this.callbacks.onStateChange?.({ ...this.state });
  }

  _updateCockpit(dt) {
    // Holographic ring animation
    if (this.holoRing) {
      this.holoRing.rotation.x += dt * 1.5;
      this.holoRing.rotation.y += dt * 0.8;
    }
    if (this.holoRing2) {
      this.holoRing2.rotation.z += dt * 2;
    }

    // Subtle cockpit vibration based on speed
    const speed = this.shipVel.length();
    const shake = Math.min(speed, 20) * 0.0003;
    this.cockpitGroup.position.x = this.shipPos.x + Math.sin(Date.now() * 0.01) * shake;
    this.cockpitGroup.position.y = this.shipPos.y + Math.cos(Date.now() * 0.007) * shake;
    this.cockpitGroup.position.z = this.shipPos.z + Math.sin(Date.now() * 0.012) * shake;
  }

  _updateSpeedParticles(dt) {
    const speed = this.shipVel.length();
    if (speed < 0.5) return;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const moveAmount = speed * 2.5 * dt;
    const pos = this.spPos;
    const count = pos.length / 3;

    for (let i = 0; i < count; i++) {
      pos[i * 3] -= forward.x * moveAmount;
      pos[i * 3 + 1] += (Math.random() - 0.5) * 0.02;
      pos[i * 3 + 2] -= forward.z * moveAmount;

      const dist = Math.sqrt(
        pos[i * 3] ** 2 + pos[i * 3 + 1] ** 2 + pos[i * 3 + 2] ** 2
      );
      if (dist > 70) {
        const angle = Math.random() * Math.PI * 2;
        const spread = 5 + Math.random() * 25;
        pos[i * 3] = Math.cos(angle) * spread + (Math.random() - 0.5) * 10;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 2] = -(30 + Math.random() * 40);
      }
    }
    this.spPoints.geometry.attributes.position.needsUpdate = true;
  }

  _updatePlanets(dt) {
    // Slow rotation of planets
    this.scene.children.forEach(child => {
      if (child.isMesh && child.geometry.type === 'SphereGeometry' && child.userData?.spinSpeed) {
        child.rotation.y += dt * child.userData.spinSpeed;
      }
    });
  }

  // ─── DISPOSE ─────────────────────────────────────────
  dispose() {
    this.running = false;
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    this.container.removeEventListener("click", this._onClick);
    window.removeEventListener("resize", this._onResize);

    if (document.pointerLockElement === this.container) {
      document.exitPointerLock();
    }

    for (const obj of this.objects) {
      try {
        this.scene.remove(obj);
        if (obj.isMesh || obj.isPoints) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material?.dispose();
          }
        } else if (obj.isGroup) {
          obj.traverse(child => {
            if (child.isMesh || child.isPoints) {
              child.geometry?.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material?.dispose();
              }
            }
          });
        }
      } catch {}
    }

    if (this.composer) {
      this.composer.dispose();
    }
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
