export function exportSceneJSON(scene, filename = "scene") {
  const data = JSON.stringify({ version: "0.1.0", exportedAt: new Date().toISOString(), ...scene }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.branpy-scene.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildPlayableHTML(scene) {
  const objectCount = scene.objects?.length || 0;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${scene.name || "BRANPY Game"}</title>
  <style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#0a0a0a;color:white;font-family:system-ui,sans-serif}
  #info{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);font-size:13px;opacity:0.4;pointer-events:none}
  </style>
</head>
<body>
  <div id="info">${scene.name || "BRANPY Game"} · ${objectCount} objects · WASD move · Mouse look</div>
  <script type="importmap">
  {"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"}}
  </script>
  <script type="module">
  import * as THREE from "three";
  import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("${scene.environment?.background || "#0a0a0a"}");
  const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
  camera.position.set(5,4,8);
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled = ${scene.environment?.shadows !== false};
  document.body.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0,0,0);
  controls.update();
  const geoMap = {cube:new THREE.BoxGeometry(1,1,1),sphere:new THREE.SphereGeometry(0.5,16,12),plane:new THREE.PlaneGeometry(1,1),cylinder:new THREE.CylinderGeometry(0.5,0.5,1,12)};
  const objects = ${JSON.stringify(scene.objects || [])};
  const meshes = [];
  objects.forEach(o => {
    if(o.type==="light"){
      const l = new THREE.DirectionalLight(o.color||"#ffffff",o.intensity||1);
      l.position.set(...(o.position||[0,5,0]));
      l.castShadow=true;
      if(scene.environment?.shadows!==false){l.shadow.mapSize.width=1024;l.shadow.mapSize.height=1024}
      scene.add(l);
      const h = new THREE.AmbientLight(0x444466, 0.2);
      scene.add(h);
      return;
    }
    const g = geoMap[o.type]||geoMap.cube;
    const m = new THREE.MeshStandardMaterial({color:o.color||"#888888",roughness:0.6,metalness:0.1});
    const mesh = new THREE.Mesh(g,m);
    mesh.position.set(...(o.position||[0,0,0]));
    mesh.rotation.set(...(o.rotation||[0,0,0]));
    mesh.scale.set(...(o.scale||[1,1,1]));
    mesh.castShadow=true;
    mesh.receiveShadow=true;
    mesh.visible=o.visible!==false;
    scene.add(mesh);
    meshes.push(mesh);
  });
  window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
  function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}
  animate();
  </script>
</body>
</html>`;
}

export function downloadBuildHTML(scene) {
  const html = buildPlayableHTML(scene);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(scene.name || "game").replace(/\s+/g, "_")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
