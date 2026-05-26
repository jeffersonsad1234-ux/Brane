import { genId } from "@store/editorStore";

const horrorScene = {
  name: "Silent Hill - Ruas do Esquecimento",
  objects: [
    { id: genId(), type: "plane", name: "Ground", position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [30, 1, 30], color: "#1a1a1a", visible: true, roughness: 0.9, metalness: 0.0 },
    { id: genId(), type: "plane", name: "Asphalt Road", position: [0, -0.3, 0], rotation: [0, 0, 0], scale: [6, 1, 28], color: "#1e1e1e", visible: true, roughness: 0.95, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building L1", position: [-6, 1, -4], rotation: [0, 0.2, 0], scale: [3, 4, 3], color: "#1a1412", visible: true, roughness: 0.8, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building L2", position: [-7, 4, -3], rotation: [0, 0.15, 0], scale: [2.8, 2, 2.5], color: "#1a1412", visible: true, roughness: 0.8, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building R1", position: [6, 1, -5], rotation: [0, -0.2, 0], scale: [3.5, 4.5, 3], color: "#1a1412", visible: true, roughness: 0.85, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building R2", position: [6.5, 4, -2], rotation: [0, -0.1, 0], scale: [3, 2.5, 2], color: "#1a1412", visible: true, roughness: 0.85, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building Far L", position: [-8, 0.5, -10], rotation: [0, 0.1, 0], scale: [4, 2, 4], color: "#14100f", visible: true, roughness: 0.9, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Building Far R", position: [8, 0.5, -12], rotation: [0, -0.1, 0], scale: [4, 2, 4], color: "#14100f", visible: true, roughness: 0.9, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Wall L", position: [-4, 0.5, -8], rotation: [0, 0, 0], scale: [0.2, 2, 4], color: "#1a1412", visible: true, roughness: 0.8, metalness: 0.0 },
    { id: genId(), type: "cylinder", name: "Lamppost L", position: [-2.5, 0.8, 0], rotation: [0, 0, 0], scale: [0.08, 1.8, 0.08], color: "#2a2a2a", visible: true, roughness: 0.6, metalness: 0.4 },
    { id: genId(), type: "cylinder", name: "Lamppost R", position: [2.5, 0.8, -2], rotation: [0, 0, 0], scale: [0.08, 1.8, 0.08], color: "#2a2a2a", visible: true, roughness: 0.6, metalness: 0.4 },
    { id: genId(), type: "sphere", name: "Flicker Light L", position: [-2.5, 2.6, 0], rotation: [0, 0, 0], scale: [0.06, 0.06, 0.06], color: "#ffdd44", visible: true, emissive: "#ffdd44", emissiveIntensity: 2 },
    { id: genId(), type: "sphere", name: "Flicker Light R", position: [2.5, 2.6, -2], rotation: [0, 0, 0], scale: [0.06, 0.06, 0.06], color: "#ffdd44", visible: true, emissive: "#ffdd44", emissiveIntensity: 2 },
    { id: genId(), type: "cube", name: "Debris 1", position: [1.2, -0.2, 3], rotation: [0.1, 0.5, 0.2], scale: [0.4, 0.2, 0.3], color: "#2a2422", visible: true, roughness: 0.9, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Debris 2", position: [-1.5, -0.15, 5], rotation: [0, 0.8, 0.1], scale: [0.5, 0.15, 0.25], color: "#2a2422", visible: true, roughness: 0.9, metalness: 0.0 },
    { id: genId(), type: "cube", name: "Car Wreck", position: [0.5, 0, 7], rotation: [0, 0.3, 0.05], scale: [1.2, 0.4, 0.8], color: "#1c1816", visible: true, roughness: 0.7, metalness: 0.3 },
    { id: genId(), type: "light", name: "Street Lamp L", position: [-2.5, 2.8, 0], rotation: [-0.8, 0, 0], intensity: 0.8, color: "#ffaa33", visible: true },
    { id: genId(), type: "light", name: "Street Lamp R", position: [2.5, 2.8, -2], rotation: [-0.8, 0, 0], intensity: 0.6, color: "#ffaa33", visible: true },
    { id: genId(), type: "light", name: "Moonlight", position: [0, 15, -10], rotation: [-1, 0, 0], intensity: 0.8, color: "#4466aa", visible: true },
    { id: genId(), type: "light", name: "Fog Glow", position: [0, 3, -12], rotation: [0, 0, 0], intensity: 0.3, color: "#8899bb", visible: true },
  ],
  environment: {
    background: "#050505",
    fog: { color: "#0a0a12", near: 4, far: 18 },
    shadows: true,
    bloom: true,
    ssao: true,
    colorGrading: true,
    volumetricFog: true,
    rain: true,
    vignette: true,
    bloomIntensity: 0.3,
    bloomThreshold: 0.1,
    exposure: 0.8,
    toneMapping: 3,
  },
};

export default horrorScene;
