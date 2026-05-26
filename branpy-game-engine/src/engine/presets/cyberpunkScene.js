import { genId } from "@store/editorStore";

const cyberpunkScene = {
  name: "Cyberpunk — Neon District",
  objects: [
    { id: genId(), type: "plane", name: "Ground", position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [20, 1, 20], color: "#0a0a18", visible: true, roughness: 0.1, metalness: 0.3 },
    { id: genId(), type: "plane", name: "Grid Road", position: [0, -0.45, 0], rotation: [0, 0, 0], scale: [5, 1, 20], color: "#0d0d20", visible: true, roughness: 0.2, metalness: 0.2 },

    { id: genId(), type: "cube", name: "Tower L1", position: [-4, 2, -2], rotation: [0, 0, 0], scale: [2, 5, 2], color: "#0f0f1a", visible: true, roughness: 0.6, metalness: 0.2 },
    { id: genId(), type: "cube", name: "Tower L2", position: [-5, 1.5, -7], rotation: [0, 0.2, 0], scale: [2.5, 4, 2.5], color: "#0a0a18", visible: true, roughness: 0.6, metalness: 0.2 },
    { id: genId(), type: "cube", name: "Tower L3", position: [-4, 1, -12], rotation: [0, -0.1, 0], scale: [2, 3, 2], color: "#0f0f1a", visible: true, roughness: 0.6, metalness: 0.2 },
    { id: genId(), type: "cube", name: "Tower R1", position: [4, 2, -4], rotation: [0, 0, 0], scale: [2, 5, 2], color: "#0f0f1a", visible: true, roughness: 0.6, metalness: 0.2 },
    { id: genId(), type: "cube", name: "Tower R2", position: [5, 1.5, -9], rotation: [0, -0.2, 0], scale: [2.5, 4, 2.5], color: "#0a0a18", visible: true, roughness: 0.6, metalness: 0.2 },
    { id: genId(), type: "cube", name: "Tower R3", position: [4, 1, -14], rotation: [0, 0.1, 0], scale: [2, 3, 2], color: "#0f0f1a", visible: true, roughness: 0.6, metalness: 0.2 },

    { id: genId(), type: "cube", name: "Sign Cyan", position: [-4.2, 3.5, -2], rotation: [0, 0, 0], scale: [0.05, 1, 0.3], color: "#00ffff", visible: true, roughness: 0.1, metalness: 0.1, emissive: "#00ffff", emissiveIntensity: 3 },
    { id: genId(), type: "cube", name: "Sign Pink", position: [4.2, 3.5, -4], rotation: [0, 0, 0], scale: [0.05, 1, 0.3], color: "#ff00ff", visible: true, roughness: 0.1, metalness: 0.1, emissive: "#ff00ff", emissiveIntensity: 3 },
    { id: genId(), type: "cube", name: "Sign Amber", position: [-4.2, 3, -7], rotation: [0, 0.5, 0], scale: [0.05, 0.8, 0.3], color: "#ffaa00", visible: true, roughness: 0.1, metalness: 0.1, emissive: "#ffaa00", emissiveIntensity: 2.5 },

    { id: genId(), type: "sphere", name: "Glow Cyan", position: [-2.5, 0.6, -1], rotation: [0, 0, 0], scale: [0.12, 0.12, 0.12], color: "#00ffff", visible: true, emissive: "#00ffff", emissiveIntensity: 2, roughness: 0.1, metalness: 0.0 },
    { id: genId(), type: "sphere", name: "Glow Pink", position: [2.5, 0.6, -5], rotation: [0, 0, 0], scale: [0.12, 0.12, 0.12], color: "#ff00ff", visible: true, emissive: "#ff00ff", emissiveIntensity: 2, roughness: 0.1, metalness: 0.0 },
    { id: genId(), type: "sphere", name: "Glow Amber", position: [0, 0.6, -8], rotation: [0, 0, 0], scale: [0.15, 0.15, 0.15], color: "#ffaa00", visible: true, emissive: "#ffaa00", emissiveIntensity: 2.5, roughness: 0.1, metalness: 0.0 },

    { id: genId(), type: "cylinder", name: "Neon Pillar L", position: [-2.5, 0.3, -1], rotation: [0, 0, 0], scale: [0.06, 0.8, 0.06], color: "#222244", visible: true, roughness: 0.3, metalness: 0.7 },
    { id: genId(), type: "cylinder", name: "Neon Pillar R", position: [2.5, 0.3, -5], rotation: [0, 0, 0], scale: [0.06, 0.8, 0.06], color: "#222244", visible: true, roughness: 0.3, metalness: 0.7 },
    { id: genId(), type: "cylinder", name: "Neon Pillar Mid", position: [0, 0.3, -8], rotation: [0, 0, 0], scale: [0.06, 0.8, 0.06], color: "#222244", visible: true, roughness: 0.3, metalness: 0.7 },

    { id: genId(), type: "capsule", name: "Sculpture", position: [0, 0.3, 3], rotation: [0, 0, 1.2], scale: [0.15, 0.3, 0.15], color: "#ff66aa", visible: true, roughness: 0.2, metalness: 0.6, emissive: "#ff44aa", emissiveIntensity: 0.5 },

    { id: genId(), type: "cube", name: "Arch L", position: [-1.2, 0.8, -4], rotation: [0, 0, 0], scale: [0.1, 1.8, 0.1], color: "#222244", visible: true, roughness: 0.3, metalness: 0.7 },
    { id: genId(), type: "cube", name: "Arch R", position: [1.2, 0.8, -4], rotation: [0, 0, 0], scale: [0.1, 1.8, 0.1], color: "#222244", visible: true, roughness: 0.3, metalness: 0.7 },
    { id: genId(), type: "cube", name: "Arch Top", position: [0, 1.8, -4], rotation: [0, 0, 0], scale: [2.6, 0.1, 0.1], color: "#222244", visible: true, roughness: 0.3, metalness: 0.7 },

    { id: genId(), type: "light", name: "Neon Cyan", position: [-2.5, 0.6, -1], rotation: [0, 0, 0], intensity: 1.5, color: "#00ffff", visible: true },
    { id: genId(), type: "light", name: "Neon Pink", position: [2.5, 0.6, -5], rotation: [0, 0, 0], intensity: 1.5, color: "#ff00ff", visible: true },
    { id: genId(), type: "light", name: "Neon Amber", position: [0, 0.6, -8], rotation: [0, 0, 0], intensity: 2, color: "#ffaa00", visible: true },

    { id: genId(), type: "spotlight", name: "Dramatic Light", position: [0, 6, -3], rotation: [1.2, 0, 0], intensity: 3, color: "#ff88ff", angle: 0.6, penumbra: 0.4, distance: 15, visible: true },

    { id: genId(), type: "light", name: "Ambient Fill", position: [-3, 2, -10], rotation: [0, 0, 0], intensity: 0.3, color: "#4466aa", visible: true },

    { id: genId(), type: "cube", name: "Floor Tile 1", position: [-1, -0.48, -2], rotation: [0, 0, 0], scale: [0.8, 0.02, 0.8], color: "#111133", visible: true, roughness: 0.05, metalness: 0.4, emissive: "#0022ff", emissiveIntensity: 0.1 },
    { id: genId(), type: "cube", name: "Floor Tile 2", position: [1, -0.48, -2], rotation: [0, 0, 0], scale: [0.8, 0.02, 0.8], color: "#111133", visible: true, roughness: 0.05, metalness: 0.4, emissive: "#ff0066", emissiveIntensity: 0.1 },
  ],
  environment: {
    background: "#050510",
    fog: { color: "#0a0a18", near: 4, far: 18 },
    shadows: true,
    bloom: true,
    bloomIntensity: 0.4,
    bloomThreshold: 0.05,
    ssao: true,
    colorGrading: true,
    chromaticAberration: true,
    volumetricFog: false,
    rain: false,
    wetGround: false,
    flashlight: false,
    flickeringLights: false,
    ambientSound: false,
    vignette: true,
    exposure: 0.9,
    toneMapping: 3,
    shadowQuality: "medium",
    pixelRatio: 1,
    qualityPreset: "balanced",
  },
};

export default cyberpunkScene;
