const themePresets = {
  "horror house": {
    name: "Horror House",
    objects: [
      { type: "plane", name: "Floor", position: [0, -0.5, 0], scale: [8, 1, 8], color: "#1a1a1a" },
      { type: "cube", name: "Walls", position: [0, 1.5, -1.5], scale: [6, 3, 0.2], color: "#2a1a1a" },
      { type: "cube", name: "Left Wall", position: [-2.5, 1.5, 2], scale: [0.2, 3, 4], color: "#2a1a1a" },
      { type: "cube", name: "Right Wall", position: [2.5, 1.5, 2], scale: [0.2, 3, 4], color: "#2a1a1a" },
      { type: "cube", name: "Table", position: [0, 0.3, 1], scale: [1.5, 0.2, 1], color: "#3a2a1a" },
      { type: "cube", name: "Vase", position: [0, 0.8, 1], scale: [0.2, 0.5, 0.2], color: "#4a3a2a" },
      { type: "light", name: "Flicker Light", position: [0, 3.5, 0], intensity: 0.4, color: "#ff4422" },
    ],
  },
  "cyberpunk city": {
    name: "Cyberpunk City",
    objects: [
      { type: "plane", name: "Ground", position: [0, -0.5, 0], scale: [20, 1, 20], color: "#0a0a1a" },
      { type: "cube", name: "Building 1", position: [-3, 1, -2], scale: [1.5, 3, 1.5], color: "#1a1a3a" },
      { type: "cube", name: "Building 2", position: [2, 1.5, -3], scale: [1, 4, 1], color: "#2a1a4a" },
      { type: "cube", name: "Building 3", position: [0, 2, -5], scale: [2, 5, 2], color: "#1a2a4a" },
      { type: "cube", name: "Neon Sign 1", position: [-3, 3.5, -1.2], scale: [0.8, 0.1, 0.1], color: "#ff00ff" },
      { type: "cube", name: "Neon Sign 2", position: [2, 4, -2.2], scale: [0.8, 0.1, 0.1], color: "#00ffff" },
      { type: "light", name: "Neon Purple", position: [-3, 3, -2], intensity: 0.8, color: "#a855f7" },
      { type: "light", name: "Neon Cyan", position: [2, 4, -3], intensity: 0.8, color: "#06b6d4" },
    ],
  },
  "racing game": {
    name: "Racing Track",
    objects: [
      { type: "plane", name: "Track", position: [0, -0.5, 0], scale: [20, 1, 20], color: "#1a1a1a" },
      { type: "plane", name: "Road Stripe", position: [0, -0.45, 0], scale: [2, 1, 16], color: "#333333" },
      { type: "cube", name: "Barrier 1", position: [-1.5, 0.3, -5], scale: [0.2, 0.5, 3], color: "#dc2626" },
      { type: "cube", name: "Barrier 2", position: [1.5, 0.3, 0], scale: [0.2, 0.5, 3], color: "#dc2626" },
      { type: "cube", name: "Barrier 3", position: [-1.5, 0.3, 5], scale: [0.2, 0.5, 3], color: "#dc2626" },
      { type: "light", name: "Track Light", position: [0, 8, 0], intensity: 1.2, color: "#ffffff" },
    ],
  },
};

export function generateFromPrompt(prompt) {
  const lower = prompt.toLowerCase();
  for (const [key, preset] of Object.entries(themePresets)) {
    if (lower.includes(key)) {
      return { ...preset, environment: { background: "#0a0a0a", fog: { color: "#0a0a0a", near: 15, far: 40 }, shadows: true, bloom: true } };
    }
  }
  return null;
}

export const THEMES = Object.keys(themePresets);
