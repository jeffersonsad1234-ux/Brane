import { create } from "zustand";
import cyberpunkScene from "@engine/presets/cyberpunkScene";

let idCounter = 0;
export const genId = () => `obj_${++idCounter}_${Date.now().toString(36)}`;

const defaultScene = JSON.parse(JSON.stringify(cyberpunkScene));

export const useEditorStore = create((set, get) => ({
  mode: "edit",
  scene: JSON.parse(JSON.stringify(defaultScene)),
  selectedId: null,
  isPlaying: false,
  isLoading: false,
  importQueue: [],
  transformMode: "translate",
  snapEnabled: false,
  snapSize: 0.5,
  fpsCam: false,
  showGrid: true,

  setMode: (mode) => set({ mode }),
  setSelected: (id) => set({ selectedId: id }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setIsLoading: (v) => set({ isLoading: v }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setSnapEnabled: (v) => set({ snapEnabled: v }),
  setSnapSize: (v) => set({ snapSize: v }),
  setFpsCam: (v) => set({ fpsCam: v }),
  setShowGrid: (v) => set({ showGrid: v }),

  getSelected: () => {
    const { scene, selectedId } = get();
    return scene.objects.find((o) => o.id === selectedId) || null;
  },

  duplicateObject: (id) => {
    const { scene } = get();
    const obj = scene.objects.find((o) => o.id === id);
    if (!obj) return null;
    const dup = {
      ...JSON.parse(JSON.stringify(obj)),
      id: genId(),
      name: obj.name + " (copy)",
      position: obj.position.map((v, i) => v + (i === 0 ? 0.5 : i === 2 ? 0.5 : 0)),
    };
    set((s) => ({ scene: { ...s.scene, objects: [...s.scene.objects, dup] }, selectedId: dup.id }));
    return dup.id;
  },

  addObject: (type) => {
    const colors = {
      cube: "#6366f1", sphere: "#ec4899", capsule: "#22c55e",
      plane: "#2a2a3a", cylinder: "#f59e0b",
      light: "#ffffff", spotlight: "#ffdd44", camera: "#10b981",
    };
    const names = {
      cube: "Cube", sphere: "Sphere", capsule: "Capsule",
      plane: "Plane", cylinder: "Cylinder",
      light: "Point Light", spotlight: "Spotlight", camera: "Camera",
    };
    const obj = {
      id: genId(), type, name: names[type] || type,
      position: [0, type === "plane" ? -0.5 : 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: colors[type] || "#888888",
      visible: true,
      ...(type === "light" ? { intensity: 1.5 } : {}),
      ...(type === "spotlight" ? { intensity: 2, angle: 0.4, penumbra: 0.3, distance: 20 } : {}),
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

  setScene: (scene) => {
    if (scene.environment) {
      scene.environment = {
        background: "#0a0a12",
        fog: { color: "#0a0a12", near: 15, far: 50 },
        shadows: true,
        bloom: false,
        bloomIntensity: 0.3,
        bloomThreshold: 0.1,
        ssao: false,
        colorGrading: false,
        chromaticAberration: false,
        volumetricFog: false,
        rain: false,
        wetGround: false,
        flashlight: false,
        flickeringLights: false,
        ambientSound: false,
        vignette: true,
        exposure: 1.0,
        toneMapping: 3,
        shadowQuality: "medium",
        pixelRatio: 1,
        maxLights: 8,
        useLOD: true,
        qualityPreset: "balanced",
        ...scene.environment,
      };
    }
    set({ scene, selectedId: null });
  },

  updateEnvironment: (props) => {
    set((s) => ({
      scene: {
        ...s.scene,
        environment: { ...s.scene.environment, ...props },
      },
    }));
  },

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
