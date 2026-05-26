import { create } from "zustand";

let idCounter = 0;
export const genId = () => `obj_${++idCounter}_${Date.now().toString(36)}`;

const defaultScene = {
  name: "Untitled Scene",
  objects: [
    { id: genId(), type: "plane", name: "Ground", position: [0, -0.5, 0], rotation: [0, 0, 0], scale: [10, 1, 10], color: "#2a2a3a", visible: true },
    { id: genId(), type: "cube", name: "Cube", position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1], color: "#6366f1", visible: true },
    { id: genId(), type: "light", name: "Sun", position: [5, 10, 5], rotation: [-0.6, 0.8, 0], intensity: 1.5, color: "#ffffff", visible: true },
  ],
  environment: {
    background: "#0a0a0a",
    fog: { color: "#0a0a0a", near: 20, far: 60 },
    shadows: true,
    bloom: false,
  },
};

export const useEditorStore = create((set, get) => ({
  mode: "edit",
  scene: JSON.parse(JSON.stringify(defaultScene)),
  selectedId: null,
  isPlaying: false,
  isLoading: false,
  importQueue: [],

  setMode: (mode) => set({ mode }),
  setSelected: (id) => set({ selectedId: id }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setIsLoading: (v) => set({ isLoading: v }),

  getSelected: () => {
    const { scene, selectedId } = get();
    return scene.objects.find((o) => o.id === selectedId) || null;
  },

  addObject: (type) => {
    const colors = { cube: "#6366f1", sphere: "#ec4899", plane: "#2a2a3a", cylinder: "#f59e0b", light: "#ffffff", camera: "#10b981" };
    const names = { cube: "Cube", sphere: "Sphere", plane: "Plane", cylinder: "Cylinder", light: "Light", camera: "Camera" };
    const obj = {
      id: genId(), type, name: names[type] || type,
      position: [0, type === "plane" ? -0.5 : 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: colors[type] || "#888888",
      visible: true,
      ...(type === "light" ? { intensity: 1.5 } : {}),
      ...(type === "camera" ? { fov: 60 } : {}),
    };
    set((s) => ({ scene: { ...s.scene, objects: [...s.scene.objects, obj] } }));
    return obj.id;
  },

  removeObject: (id) => {
    set((s) => ({ scene: { ...s.scene, objects: s.scene.objects.filter((o) => o.id !== id) }, selectedId: s.selectedId === id ? null : s.selectedId }));
  },

  updateObject: (id, props) => {
    set((s) => ({
      scene: {
        ...s.scene,
        objects: s.scene.objects.map((o) => (o.id === id ? { ...o, ...props } : o)),
      },
    }));
  },

  setScene: (scene) => set({ scene, selectedId: null }),

  resetScene: () => set({ scene: JSON.parse(JSON.stringify(defaultScene)), selectedId: null }),

  exportScene: () => {
    const { scene } = get();
    const json = JSON.stringify({ version: "0.1", ...scene }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scene.name.replace(/\s+/g, "_")}.branpy-scene.json`;
    a.click();
    URL.revokeObjectURL(url);
    return json;
  },

  importScene: (json) => {
    try {
      const data = typeof json === "string" ? JSON.parse(json) : json;
      if (!data.objects || !Array.isArray(data.objects)) throw new Error("Invalid scene format");
      set({ scene: data, selectedId: null });
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      return false;
    }
  },
}));
