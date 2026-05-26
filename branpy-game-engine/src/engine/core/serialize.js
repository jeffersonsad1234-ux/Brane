export function serializeScene(scene) {
  return JSON.stringify({ version: "0.1", ...scene }, null, 2);
}

export function deserializeScene(json) {
  try {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    if (!data.objects || !Array.isArray(data.objects)) throw new Error("Invalid scene");
    return data;
  } catch {
    return null;
  }
}

export function sceneToGLTF(scene) {
  const meshes = scene.objects.filter((o) => ["cube", "sphere", "plane", "cylinder"].includes(o.type));
  const lights = scene.objects.filter((o) => o.type === "light");
  return { meshes, lights, environment: scene.environment };
}

export function objectToMeshData(obj) {
  const geoMap = { cube: "BoxGeometry", sphere: "SphereGeometry", plane: "PlaneGeometry", cylinder: "CylinderGeometry" };
  return {
    geometry: geoMap[obj.type] || "BoxGeometry",
    position: obj.position,
    rotation: obj.rotation,
    scale: obj.scale,
    color: obj.color,
    visible: obj.visible,
  };
}
