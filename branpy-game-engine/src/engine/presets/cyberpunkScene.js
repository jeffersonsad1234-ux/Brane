/* Local ID generator to avoid circular dependency with editorStore */
let _idCounter = 0;
function id() { return `obj_${++_idCounter}_${Date.now().toString(36)}`; }
function cube(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "cube", name, position: pos, rotation: extra.rot || [0, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.7, metalness: extra.metalness ?? 0.2, emissive: extra.emissive || "#000000", emissiveIntensity: extra.emissiveIntensity || 0, ...extra };
}
function light(name, pos, color, intensity = 1, extra = {}) {
  return { id: id(), type: "light", name, position: pos, rotation: [0, 0, 0], intensity, color, visible: true, ...extra };
}
function sphere(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "sphere", name, position: pos, rotation: [0, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.3, metalness: extra.metalness ?? 0.3, emissive: extra.emissive || "#000000", emissiveIntensity: extra.emissiveIntensity || 0, ...extra };
}
function capsule(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "capsule", name, position: pos, rotation: extra.rot || [0, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.5, metalness: extra.metalness ?? 0.3, emissive: extra.emissive || "#000000", emissiveIntensity: extra.emissiveIntensity || 0, ...extra };
}
function cylinder(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "cylinder", name, position: pos, rotation: extra.rot || [0, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.4, metalness: extra.metalness ?? 0.6, emissive: extra.emissive || "#000000", emissiveIntensity: extra.emissiveIntensity || 0, ...extra };
}
function plane(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "plane", name, position: pos, rotation: extra.rot || [-Math.PI / 2, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.8, metalness: extra.metalness ?? 0, ...extra };
}

const BUILDINGS_DATA = [
  { pos: [-12, 2.5, -2], scale: [2.5, 5, 2.5], color: "#0f0f1a" },
  { pos: [0, 3.5, -5], scale: [3, 7, 3], color: "#12121e" },
  { pos: [10, 2, -3], scale: [2, 4, 2], color: "#0c0c16" },
  { pos: [-8, 4, -10], scale: [2, 8, 2], color: "#0e0e1a" },
  { pos: [5, 3, -12], scale: [2.5, 6, 2.5], color: "#0f0f1a" },
  { pos: [-5, 2, -15], scale: [2, 4, 2], color: "#0c0c16" },
  { pos: [12, 4.5, -8], scale: [2, 9, 2], color: "#0f0f1a" },
  { pos: [-15, 2, -5], scale: [2, 4, 2], color: "#12121e" },
  { pos: [15, 3, -10], scale: [2, 6, 2.5], color: "#0c0c16" },
  { pos: [-10, 1.5, -20], scale: [3, 3, 3], color: "#0f0f1a" },
  { pos: [8, 5, -18], scale: [2, 10, 2], color: "#0e0e1a" },
  { pos: [0, 2.5, -25], scale: [3, 5, 3], color: "#0c0c16" },
  { pos: [-6, 1.5, -8], scale: [3.5, 3, 3.5], color: "#0f0f1a" },
  { pos: [14, 2, -15], scale: [1.5, 4, 1.5], color: "#12121e" },
  { pos: [-18, 3, -12], scale: [2, 6, 2], color: "#0e0e1a" },
  { pos: [20, 5, -6], scale: [2, 10, 2], color: "#0f0f1a" },
  { pos: [-20, 2, -18], scale: [2.5, 4, 2.5], color: "#12121e" },
  { pos: [18, 2.5, -20], scale: [2.5, 5, 2.5], color: "#0c0c16" },
  { pos: [0, 1.5, 5], scale: [4, 3, 4], color: "#0f0f1a" },
  { pos: [-14, 1, -25], scale: [2, 2, 2], color: "#12121e" },
  { pos: [6, 3.5, 2], scale: [2, 7, 2], color: "#0e0e1a" },
  { pos: [-6, 2, 3], scale: [3, 4, 3], color: "#0f0f1a" },
  { pos: [10, 2.5, 0], scale: [1.5, 5, 1.5], color: "#12121e" },
  { pos: [-3, 1, -30], scale: [4, 2, 4], color: "#0c0c16" },
];

const NEON_DATA = [
  { pos: [-12, 4.5, -2], color: "#ff00aa", w: 0.8 },
  { pos: [0, 6.2, -5], color: "#00ddff", w: 1.2 },
  { pos: [10, 3.8, -3], color: "#ff8800", w: 0.6 },
  { pos: [-8, 6.5, -10], color: "#0044ff", w: 0.8 },
  { pos: [5, 5.5, -12], color: "#ff00aa", w: 0.7 },
  { pos: [0, 5, -25], color: "#00ddff", w: 1.0 },
  { pos: [8, 7.5, -18], color: "#ff8800", w: 0.9 },
  { pos: [-6, 4.2, 3], color: "#ff00aa", w: 0.8 },
  { pos: [6, 6.2, 2], color: "#00ddff", w: 0.7 },
  { pos: [20, 7.5, -6], color: "#0044ff", w: 1.0 },
  { pos: [-18, 5.5, -12], color: "#ff00aa", w: 0.6 },
  { pos: [-14, 3.5, -25], color: "#ff8800", w: 0.7 },
  { pos: [14, 4.5, -15], color: "#00ddff", w: 0.6 },
  { pos: [-10, 3.5, -20], color: "#ff00aa", w: 0.8 },
  { pos: [0, 4.3, 5], color: "#ff8800", w: 0.7 },
  { pos: [10, 5.2, 0], color: "#00ddff", w: 0.6 },
  { pos: [15, 6.5, -10], color: "#0044ff", w: 0.7 },
];

const LAMP_DATA = [
  [-8, -3], [8, -3], [-4, -8], [6, -7],
  [-10, -12], [4, -14], [-6, -18], [12, -10],
  [-14, -6], [16, -8], [0, -22], [-12, -16],
  [0, 2], [-5, 0], [7, -2], [-16, -14],
  [18, -12], [10, -20], [-8, -22], [20, -8],
];

const COLLECTIBLE_DATA = [
  { pos: [-6, 1.2, -7], color: "#00ddff" },
  { pos: [5, 1.5, -14], color: "#ff00aa" },
  { pos: [-12, 1.8, -20], color: "#00ff88" },
  { pos: [14, 1, -24], color: "#ff8800" },
  { pos: [3, 1.3, -4], color: "#aa44ff" },
];

const scene = {
  name: "Cyberpunk — Neon District",
  objects: [
    /* Ground and road */
    plane("Sidewalk", [0, -0.5, -10], [30, 35, 1], "#0a0a12", { roughness: 0.9, metalness: 0 }),
    plane("Road", [0, -0.48, -10], [8, 35, 1], "#0d0d18", { roughness: 1, metalness: 0 }),

    /* Buildings */
    ...BUILDINGS_DATA.map((b, i) => cube(`Building ${i + 1}`, b.pos, b.scale, b.color)),

    /* Neon signs — thin emissive planes */
    ...NEON_DATA.map((n, i) =>
      cube(`Neon ${i + 1}`, n.pos, [n.w, 0.25, 0.05], n.color, {
        emissive: n.color,
        emissiveIntensity: 3,
        roughness: 0.1,
        metalness: 0,
      })
    ),

    /* Lamp posts */
    ...LAMP_DATA.flatMap(([x, z], i) => [
      cylinder(`Lamp Pole ${i + 1}`, [x, 1.5, z], [0.04, 3, 0.04], "#222233", { metalness: 0.8, roughness: 0.3 }),
      sphere(`Lamp Bulb ${i + 1}`, [x, 3.2, z], [0.08, 0.08, 0.08], "#ffdd88", { emissive: "#ffdd88", emissiveIntensity: 1 }),
      light(`Lamp Light ${i + 1}`, [x, 3.2, z], "#ffcc66", 0.6),
    ]),

    /* Collectibles */
    ...COLLECTIBLE_DATA.map((c, i) =>
      sphere(`Data Artifact ${i + 1}`, c.pos, [0.3, 0.3, 0.3], c.color, {
        emissive: c.color,
        emissiveIntensity: 2,
        roughness: 0.2,
        metalness: 0.8,
        collectible: true,
      })
    ),

    /* Player start */
    capsule("Player", [0, 0.8, 0], [0.5, 0.7, 0.5], "#4488ff", {
      roughness: 0.5,
      metalness: 0.3,
      player: true,
    }),

    /* Ambient lights */
    light("Moon Light", [5, 15, -10], "#4466aa", 0.3),
    light("Back Light", [-5, 8, -15], "#6644aa", 0.2),
    light("Street Glow", [0, 2, -10], "#ff8844", 0.4),
  ],
  environment: {
    background: "#050510",
    fog: { color: "#050510", near: 5, far: 22 },
    shadows: true,
    bloom: true,
    bloomIntensity: 0.6,
    bloomThreshold: 0.05,
    ssao: true,
    colorGrading: true,
    chromaticAberration: true,
    volumetricFog: false,
    rain: true,
    wetGround: true,
    flashlight: false,
    flickeringLights: false,
    ambientSound: false,
    vignette: true,
    exposure: 0.8,
    toneMapping: 3,
    shadowQuality: "medium",
    pixelRatio: 1,
    qualityPreset: "balanced",
  },
};

export default scene;
