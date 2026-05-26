import { genId } from "@store/editorStore";

const horrorScene = {
  name: "Silent Hill - Ruas do Esquecimento",
  objects: [
    { id: genId(), type: "plane", name: "Ground", position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [30, 1, 30], color: "#151520", visible: true, roughness: 0.15, metalness: 0.05, wet: true },
    { id: genId(), type: "plane", name: "Asphalt Road", position: [0, -0.3, 0], rotation: [0, 0, 0], scale: [5.5, 1, 28], color: "#181825", visible: true, roughness: 0.2, metalness: 0.1, wet: true },

    { id: genId(), type: "cube", name: "Building L1", position: [-6, 1.5, -4], rotation: [0, 0.2, 0], scale: [3, 4, 3], color: "#1a1412", visible: true, roughness: 0.85, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building L2", position: [-6.5, 4, -3.5], rotation: [0, 0.15, 0], scale: [2.5, 2, 2.5], color: "#14100f", visible: true, roughness: 0.85, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building L3", position: [-7, 0.5, -10], rotation: [0, 0.1, 0], scale: [3.5, 2, 3.5], color: "#12100e", visible: true, roughness: 0.9, metalness: 0.0 },

    { id: genId(), type: "cube", name: "Building R1", position: [6, 1.5, -5], rotation: [0, -0.2, 0], scale: [3.5, 4.5, 3], color: "#1a1412", visible: true, roughness: 0.85, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building R2", position: [6.5, 4.5, -3], rotation: [0, -0.15, 0], scale: [2.8, 2.5, 2.2], color: "#14100f", visible: true, roughness: 0.85, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building R3", position: [7, 0.5, -11], rotation: [0, -0.1, 0], scale: [4, 2, 4], color: "#12100e", visible: true, roughness: 0.9, metalness: 0.0 },

    { id: genId(), type: "cube", name: "Wall L", position: [-4, 1, -8], rotation: [0, 0, 0], scale: [0.2, 2.5, 4], color: "#1a1412", visible: true, roughness: 0.8, metalness: 0.0, emissive: "#050302", emissiveIntensity: 0.1 },

    { id: genId(), type: "cylinder", name: "Lamppost L", position: [-2.8, 0.8, 0], rotation: [0, 0, 0], scale: [0.07, 1.8, 0.07], color: "#222233", visible: true, roughness: 0.4, metalness: 0.6 },
    { id: genId(), type: "cylinder", name: "Lamppost R", position: [2.8, 0.8, -3], rotation: [0, 0, 0], scale: [0.07, 1.8, 0.07], color: "#222233", visible: true, roughness: 0.4, metalness: 0.6 },
    { id: genId(), type: "cylinder", name: "Lamppost Far", position: [0, 0.8, -8], rotation: [0, 0, 0], scale: [0.07, 1.8, 0.07], color: "#222233", visible: true, roughness: 0.4, metalness: 0.6 },

    { id: genId(), type: "sphere", name: "Glow L", position: [-2.8, 2.6, 0], rotation: [0, 0, 0], scale: [0.08, 0.08, 0.08], color: "#ffdd44", visible: true, emissive: "#ffaa33", emissiveIntensity: 2, roughness: 0.2, metalness: 0.0 },
    { id: genId(), type: "sphere", name: "Glow R", position: [2.8, 2.6, -3], rotation: [0, 0, 0], scale: [0.08, 0.08, 0.08], color: "#ffdd44", visible: true, emissive: "#ffaa33", emissiveIntensity: 2, roughness: 0.2, metalness: 0.0 },
    { id: genId(), type: "sphere", name: "Glow Far", position: [0, 2.6, -8], rotation: [0, 0, 0], scale: [0.07, 0.07, 0.07], color: "#ffcc55", visible: true, emissive: "#ffaa33", emissiveIntensity: 1.5, roughness: 0.2, metalness: 0.0 },

    { id: genId(), type: "cube", name: "Debris 1", position: [1.5, -0.15, 4], rotation: [0.1, 0.5, 0.2], scale: [0.5, 0.18, 0.35], color: "#2a2422", visible: true, roughness: 0.9, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Debris 2", position: [-1.8, -0.1, 6], rotation: [0, 0.8, 0.1], scale: [0.6, 0.12, 0.3], color: "#2a2422", visible: true, roughness: 0.9, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Debris 3", position: [2.2, -0.1, -1.5], rotation: [0.2, 1.2, 0], scale: [0.35, 0.1, 0.2], color: "#302a28", visible: true, roughness: 0.85, metalness: 0.05 },

    { id: genId(), type: "cube", name: "Car Wreck", position: [0.5, 0, 7], rotation: [0, 0.3, 0.05], scale: [1.4, 0.35, 0.9], color: "#1c1816", visible: true, roughness: 0.6, metalness: 0.4, emissive: "#0a0505", emissiveIntensity: 0.1 },
    { id: genId(), type: "cube", name: "Car Roof", position: [0.5, 0.45, 7], rotation: [0, 0.3, 0], scale: [1.0, 0.2, 0.5], color: "#1a1614", visible: true, roughness: 0.5, metalness: 0.5 },
    { id: genId(), type: "sphere", name: "Car Light L", position: [1.0, 0.2, 7.5], rotation: [0, 0, 0], scale: [0.08, 0.06, 0.08], color: "#ff4422", visible: true, emissive: "#ff2211", emissiveIntensity: 1.5, roughness: 0.3, metalness: 0.0 },

    { id: genId(), type: "cube", name: "Trash Can 1", position: [-1, -0.1, 2.5], rotation: [0, 0.3, 0], scale: [0.25, 0.5, 0.25], color: "#2a2a2a", visible: true, roughness: 0.7, metalness: 0.2 },
    { id: genId(), type: "cube", name: "Trash Can 2", position: [0.8, -0.1, -0.5], rotation: [0, -0.4, 0.1], scale: [0.25, 0.5, 0.25], color: "#2a2a2a", visible: true, roughness: 0.7, metalness: 0.2 },
    { id: genId(), type: "cylinder", name: "Barrel", position: [-1.5, -0.2, -4], rotation: [0, 0, 0], scale: [0.2, 0.5, 0.2], color: "#221100", visible: true, roughness: 0.6, metalness: 0.3 },

    { id: genId(), type: "light", name: "Flicker Lamp L", position: [-2.8, 2.6, 0], rotation: [-0.8, 0, 0], intensity: 0.9, color: "#ffaa33", visible: true },
    { id: genId(), type: "light", name: "Flicker Lamp R", position: [2.8, 2.6, -3], rotation: [-0.8, 0, 0], intensity: 0.7, color: "#ffaa33", visible: true },
    { id: genId(), type: "light", name: "Flicker Lamp Far", position: [0, 2.6, -8], rotation: [-0.8, 0, 0], intensity: 0.5, color: "#ffaa33", visible: true },
    { id: genId(), type: "light", name: "Moonlight Key", position: [2, 20, -8], rotation: [-1.2, 0.3, 0], intensity: 0.6, color: "#445588", visible: true },
    { id: genId(), type: "light", name: "Fog Ambient", position: [0, 3, -15], rotation: [0, 0, 0], intensity: 0.25, color: "#667799", visible: true },
    { id: genId(), type: "light", name: "Car Fire", position: [1.0, 0.2, 7.5], rotation: [0, 0, 0], intensity: 0.6, color: "#ff4422", visible: true },
  ],
  environment: {
    background: "#030308",
    fog: { color: "#0a0a14", near: 3, far: 16 },
    shadows: true,
    bloom: true,
    ssao: true,
    colorGrading: true,
    volumetricFog: true,
    rain: true,
    vignette: true,
    bloomIntensity: 0.25,
    bloomThreshold: 0.08,
    exposure: 0.7,
    toneMapping: 3,
    shadowQuality: "low",
    pixelRatio: 1,
    qualityPreset: "balanced",
    flashlight: true,
    flickeringLights: true,
    wetGround: true,
    ambientSound: true,
  },
};

export default horrorScene;
