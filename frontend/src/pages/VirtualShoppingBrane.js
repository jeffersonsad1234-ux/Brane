import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import "../styles/virtualShopping.css";

const STORES = [
  { id: "fashion", name: "Fashion District", icon: "👗", color: "#FF6B9D", products: [
    { name: "Vestido Premium", price: "R$ 189,90", color: "#FF6B9D", shape: "cylinder" },
    { name: "Jaqueta Leather", price: "R$ 349,90", color: "#8B4513", shape: "box" },
    { name: "Tênis Sport", price: "R$ 259,90", color: "#FFFFFF", shape: "sphere" }
  ]},
  { id: "sneakers", name: "Sneaker Arena", icon: "👟", color: "#00D4AA", products: [
    { name: "Air Max 3000", price: "R$ 599,90", color: "#FF4500", shape: "sphere" },
    { name: "Runner Pro", price: "R$ 429,90", color: "#4A90D9", shape: "sphere" },
    { name: "Street Style", price: "R$ 349,90", color: "#2C2C2C", shape: "sphere" }
  ]},
  { id: "gamer", name: "Gamer Zone", icon: "🎮", color: "#8A2CFF", products: [
    { name: "Headset RGB", price: "R$ 299,90", color: "#8A2CFF", shape: "torus" },
    { name: "Mouse Pro", price: "R$ 199,90", color: "#00FF88", shape: "box" },
    { name: "Teclado Mecânico", price: "R$ 449,90", color: "#2C2C2C", shape: "box" }
  ]},
  { id: "perfumes", name: "Parfum Luxe", icon: "🧴", color: "#FFD700", products: [
    { name: "Essence Gold", price: "R$ 429,90", color: "#FFD700", shape: "cylinder" },
    { name: "Oud Prestige", price: "R$ 599,90", color: "#800020", shape: "cylinder" },
    { name: "Floral Dream", price: "R$ 299,90", color: "#FFB6C1", shape: "cylinder" }
  ]},
  { id: "cellphones", name: "Tech Hub", icon: "📱", color: "#00BFFF", products: [
    { name: "Phone X Ultra", price: "R$ 4.299,90", color: "#1A1A2E", shape: "box" },
    { name: "Tablet Pro 12", price: "R$ 2.899,90", color: "#C0C0C0", shape: "box" },
    { name: "SmartWatch 5", price: "R$ 1.299,90", color: "#FFD700", shape: "torus" }
  ]}
];

function createProductMesh(product, x, y, z) {
  const geometryMap = {
    box: new THREE.BoxGeometry(0.6, 0.6, 0.6),
    sphere: new THREE.SphereGeometry(0.35, 16, 16),
    cylinder: new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16),
    torus: new THREE.TorusGeometry(0.3, 0.12, 12, 20)
  };
  const geo = geometryMap[product.shape] || new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const mat = new THREE.MeshPhysicalMaterial({
    color: product.color,
    metalness: 0.3,
    roughness: 0.4,
    envMapIntensity: 0.6
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y + 0.4, z);
  mesh.userData = { type: "product", product, storeId: null };
  return mesh;
}

function createStoreBox(width, height, depth, color, x, z, name, icon) {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e,
    metalness: 0.2,
    roughness: 0.6,
    transparent: true,
    opacity: 0.92
  });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  wall.position.set(0, height / 2, 0);
  group.add(wall);

  const stripeMat = new THREE.MeshPhysicalMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.6
  });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, 0.08, 0.08), stripeMat);
  stripe.position.set(0, height + 0.3, 0);
  group.add(stripe);

  const glowMat = new THREE.MeshPhysicalMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.4
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.7, 0.5), glowMat);
  glow.position.set(0, height - 1.5, depth / 2 + 0.05);
  group.add(glow);

  const signMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.1
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.65, 0.35), signMat);
  sign.position.set(0, height - 1.5, depth / 2 + 0.06);
  group.add(sign);

  group.position.set(x, 0, z);
  group.userData = { type: "store", storeId: null, width, depth };
  return group;
}

function createFloor(width, depth) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0a14";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 32) {
    ctx.strokeStyle = "rgba(212, 162, 76, 0.03)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(width / 4, depth / 4);
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex,
    roughness: 0.7,
    metalness: 0.1,
    color: 0x0a0a14
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  return floor;
}

function createCart() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xD4A24C,
    metalness: 0.6,
    roughness: 0.3
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), bodyMat);
  body.position.y = 0.25;
  group.add(body);

  const wheelMat = new THREE.MeshPhysicalMaterial({
    color: 0x333333,
    roughness: 0.8
  });
  const positions = [[-0.25, 0.05, -0.15], [0.25, 0.05, -0.15], [-0.25, 0.05, 0.15], [0.25, 0.05, 0.15]];
  positions.forEach(pos => {
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), wheelMat);
    wheel.position.set(pos[0], pos[1], pos[2]);
    group.add(wheel);
  });

  const handleMat = new THREE.MeshPhysicalMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.4 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), handleMat);
  handle.rotation.x = Math.PI / 4;
  handle.position.set(0, 0.4, -0.25);
  group.add(handle);

  return group;
}

function createMallScene(stores) {
  const group = new THREE.Group();

  const floor = createFloor(28, 20);
  group.add(floor);

  const ceilingMat = new THREE.MeshPhysicalMaterial({
    color: 0x050510,
    roughness: 0.9,
    metalness: 0.05,
    transparent: true,
    opacity: 0.3
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(28, 20), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4;
  group.add(ceiling);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4, 20), new THREE.MeshPhysicalMaterial({ color: 0x0a0a18, roughness: 0.8 }));
  leftWall.position.set(-14, 2, 0);
  group.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4, 20), new THREE.MeshPhysicalMaterial({ color: 0x0a0a18, roughness: 0.8 }));
  rightWall.position.set(14, 2, 0);
  group.add(rightWall);

  const centerLineMat = new THREE.MeshPhysicalMaterial({
    color: 0xD4A24C,
    emissive: 0xD4A24C,
    emissiveIntensity: 0.05,
    transparent: true,
    opacity: 0.2
  });
  for (let i = -7; i <= 7; i += 3.5) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 1.5), centerLineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(i, 0.02, 0);
    group.add(line);
  }

  stores.forEach((store, idx) => {
    const side = idx % 2 === 0 ? -1 : 1;
    const zPos = -7 + Math.floor(idx / 2) * 3.5;
    const storeGroup = createStoreBox(2.8, 3.2, 2.8, store.color, side * 6.5, zPos, store.name, store.icon);
    storeGroup.userData.storeId = store.id;
    storeGroup.userData.storeData = store;
    storeGroup.userData.side = side;
    storeGroup.userData.width = 2.8;
    storeGroup.userData.depth = 2.8;

    const entranceMat = new THREE.MeshPhysicalMaterial({
      color: store.color,
      emissive: store.color,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.15
    });
    const entrance = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), entranceMat);
    entrance.position.set(side * 6.5, 1.6, zPos + (side === -1 ? 1.45 : -1.45));
    group.add(entrance);

    const frontLightMat = new THREE.MeshPhysicalMaterial({
      color: store.color,
      emissive: store.color,
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.3
    });
    const frontLight = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.06), frontLightMat);
    frontLight.position.set(side * 6.5, 3.3, zPos + (side === -1 ? 1.45 : -1.45));
    group.add(frontLight);

    group.add(storeGroup);
  });

  const centerColumnMat = new THREE.MeshPhysicalMaterial({
    color: 0xD4A24C,
    emissive: 0xD4A24C,
    emissiveIntensity: 0.05,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.15
  });
  for (let i = -2; i <= 2; i += 2) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 3.8, 8), centerColumnMat);
    col.position.set(i * 2.5, 1.9, 0);
    group.add(col);
  }

  const spotMat = new THREE.MeshPhysicalMaterial({
    color: 0xD4A24C,
    emissive: 0xD4A24C,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.25
  });
  for (let i = -8; i <= 8; i += 4) {
    for (let j = -6; j <= 6; j += 4) {
      if (Math.abs(j) < 2) continue;
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), spotMat);
      spot.position.set(i, 3.9, j);
      group.add(spot);
    }
  }

  return group;
}

function createStoreInterior(store) {
  const group = new THREE.Group();

  const wallMat = new THREE.MeshPhysicalMaterial({
    color: 0x12121e,
    roughness: 0.6,
    metalness: 0.1
  });
  const floorMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e,
    roughness: 0.4,
    metalness: 0.2
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  group.add(floor);

  const walls = [
    { pos: [0, 1.5, -2.5], size: [5, 3, 0.1] },
    { pos: [0, 1.5, 2.5], size: [5, 3, 0.1] },
    { pos: [-2.5, 1.5, 0], size: [0.1, 3, 5] },
    { pos: [2.5, 1.5, 0], size: [0.1, 3, 5] }
  ];
  walls.forEach(w => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
    wall.position.set(...w.pos);
    group.add(wall);
  });

  const shelfMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a2a3e,
    metalness: 0.4,
    roughness: 0.3
  });
  for (let i = 0; i < 3; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.8), shelfMat);
    shelf.position.set(-1.2, 0.4 + i * 0.7, -1.8);
    group.add(shelf);
  }
  for (let i = 0; i < 3; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.8), shelfMat);
    shelf.position.set(1.2, 0.4 + i * 0.7, -1.8);
    group.add(shelf);
  }

  const shelfLeg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.04), shelfMat);
  shelfLeg.position.set(-2.4, 0.38, -1.4);
  group.add(shelfLeg);

  store.products.forEach((product, i) => {
    const angle = (i / store.products.length) * Math.PI * 2;
    const radius = 1.0;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius + 0.3;
    const productMesh = createProductMesh(product, x, 0.5, z);
    productMesh.userData.storeId = store.id;
    productMesh.userData.product = product;
    group.add(productMesh);
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: store.color,
    emissive: store.color,
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.3
  });
  const accent = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 0.06), accentMat);
  accent.position.set(0, 2.8, -2.45);
  group.add(accent);

  const lightMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.05
  });
  for (let x = -1.5; x <= 1.5; x += 1.5) {
    for (let z = -1.5; z <= 1.5; z += 1.5) {
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), lightMat);
      light.position.set(x, 2.9, z);
      group.add(light);
    }
  }

  const exitMat = new THREE.MeshPhysicalMaterial({
    color: 0xFF4444,
    emissive: 0xFF4444,
    emissiveIntensity: 0.1,
    transparent: true,
    opacity: 0.4
  });
  const exit = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), exitMat);
  exit.position.set(0, 0.3, 2.48);
  group.add(exit);

  return group;
}

export default function VirtualShoppingBrane() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animFrameRef = useRef(null);
  const targetPosRef = useRef(new THREE.Vector3(0, 2.2, 6));
  const currentPosRef = useRef(new THREE.Vector3(0, 2.2, 6));
  const targetLookRef = useRef(new THREE.Vector3(0, 1.2, 0));
  const currentLookRef = useRef(new THREE.Vector3(0, 1.2, 0));
  const cartRef = useRef(null);
  const productsRef = useRef([]);
  const storeGroupsRef = useRef([]);
  const entranceGroupsRef = useRef([]);

  const [view, setView] = useState("entrance");
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const [productRotate, setProductRotate] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const notify = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  }, []);

  useEffect(() => {
    if (view !== "mall") return;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 10, 25);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 50);
    camera.position.set(0, 2.2, 6);
    camera.lookAt(0, 1.2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x222244, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xFFEECC, 0.6);
    mainLight.position.set(5, 8, 3);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x8888FF, 0.2);
    fillLight.position.set(-3, 4, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xD4A24C, 0.15);
    rimLight.position.set(0, -2, -5);
    scene.add(rimLight);

    const mallGroup = createMallScene(STORES);
    scene.add(mallGroup);

    const cartGroup = createCart();
    cartGroup.position.set(0, 0, 3);
    cartRef.current = cartGroup;
    scene.add(cartGroup);

    productsRef.current = [];
    storeGroupsRef.current = [];
    entranceGroupsRef.current = [];

    mallGroup.children.forEach(child => {
      if (child.userData.type === "store") {
        storeGroupsRef.current.push(child);
      }
    });

    const animate = () => {
      const currentPos = currentPosRef.current;
      const targetPos = targetPosRef.current;
      const currentLook = currentLookRef.current;
      const targetLook = targetLookRef.current;

      currentPos.lerp(targetPos, 0.06);
      currentLook.lerp(targetLook, 0.06);

      if (cartRef.current) {
        cartRef.current.position.x = currentPos.x;
        cartRef.current.position.z = currentPos.z - 2;
        cartRef.current.position.y = 0;
        cartRef.current.rotation.y = Math.atan2(
          currentPos.x - cartRef.current.position.x,
          currentPos.z - cartRef.current.position.z
        );
      }

      camera.position.copy(currentPos);
      camera.lookAt(currentLook);
      productsRef.current.forEach(p => {
        if (p.userData.product) {
          p.rotation.y += 0.005;
        }
      });

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const allObjects = [];
      scene.traverse(obj => {
        if (obj.isMesh || obj.isGroup) allObjects.push(obj);
      });
      const intersects = raycasterRef.current.intersectObjects(allObjects, false);

      let hitFloor = false;
      let hitStore = false;
      let hitProduct = false;

      for (const intersect of intersects) {
        const obj = intersect.object;
        if (obj.userData.type === "product") {
          hitProduct = true;
          const product = obj.userData.product;
          setSelectedProduct(product);
          setProductRotate(0);
          setShowProductDetail(true);
          break;
        }
        if (obj.parent?.userData?.type === "store" || obj.userData?.type === "store") {
          hitStore = true;
          const storeGroup = obj.parent?.userData?.type === "store" ? obj.parent : obj;
          const storeData = storeGroup.userData.storeData || STORES.find(s => s.id === storeGroup.userData.storeId);
          if (storeData) {
            setSelectedStore(storeData);
            setView("store");
          }
          break;
        }
      }

      if (!hitProduct && !hitStore) {
        for (const intersect of intersects) {
          const obj = intersect.object;
          if (obj.geometry?.type === "PlaneGeometry" && obj.material?.color) {
            const colorHex = obj.material.color.getHex();
            if (colorHex === 0x0a0a14 || colorHex === 0x0a0a0a) {
              const point = intersect.point;
              targetPosRef.current.set(point.x, 2.2, point.z + 2);
              targetLookRef.current.set(point.x, 1.2, point.z);
              hitFloor = true;
              break;
            }
          }
        }
      }
    };

    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      handleClick({ clientX: touch.clientX, clientY: touch.clientY });
    });

    const handleResize3D = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize3D);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize3D);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [view, notify]);

  useEffect(() => {
    if (view !== "store" || !selectedStore) return;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08081a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 20);
    camera.position.set(0, 1.8, 3.5);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
    scene.add(ambientLight);

    const storeLight = new THREE.DirectionalLight(0xFFEECC, 0.4);
    storeLight.position.set(2, 4, 1);
    scene.add(storeLight);

    const accentLight = new THREE.PointLight(selectedStore.color, 0.3, 5);
    accentLight.position.set(0, 2.5, 0);
    scene.add(accentLight);

    const interior = createStoreInterior(selectedStore);
    scene.add(interior);

    const cartGroup = createCart();
    cartGroup.position.set(-1.8, 0, 1.5);
    cartGroup.scale.set(0.8, 0.8, 0.8);
    cartRef.current = cartGroup;
    scene.add(cartGroup);

    const animate = () => {
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const allObjects = [];
      scene.traverse(obj => {
        if (obj.isMesh) allObjects.push(obj);
      });
      const intersects = raycasterRef.current.intersectObjects(allObjects, false);
      for (const intersect of intersects) {
        const obj = intersect.object;
        if (obj.userData.type === "product" && obj.userData.product) {
          setSelectedProduct(obj.userData.product);
          setProductRotate(0);
          setShowProductDetail(true);
          break;
        }
      }
    };

    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      handleClick({ clientX: touch.clientX, clientY: touch.clientY });
    });

    const handleResize3D = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize3D);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize3D);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [view, selectedStore, notify]);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.name === product.name);
      if (existing) {
        return prev.map(item =>
          item.name === product.name ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setShowProductDetail(false);
    notify(`${product.name} adicionado ao carrinho!`);
  }, [notify]);

  const removeFromCart = useCallback((name) => {
    setCart(prev => prev.filter(item => item.name !== name));
  }, []);

  const cartTotal = cart.reduce((sum, item) => {
    const priceNum = parseFloat(item.price.replace(/[^\d,]/g, "").replace(",", "."));
    return sum + (isNaN(priceNum) ? 0 : priceNum * item.qty);
  }, 0);

  const formatPrice = (val) => {
    return "R$ " + val.toFixed(2).replace(".", ",");
  };

  if (view === "entrance") {
    return (
      <div className="vsb-entrance">
        <div className="vsb-entrance-bg" />
        <div className="vsb-entrance-content">
          <div className="vsb-logo-icon">🛍️</div>
          <h1 className="vsb-title">Virtual Shopping <span className="vsb-title-accent">Brane</span></h1>
          <p className="vsb-subtitle">Um shopping virtual imersivo direto do seu navegador</p>
          <div className="vsb-features">
            <div className="vsb-feature">Ande pelo shopping clicando na tela</div>
            <div className="vsb-feature">Entre nas lojas e veja produtos em 3D</div>
            <div className="vsb-feature">Gire, zoom, adicione ao carrinho</div>
          </div>
          <button className="vsb-enter-btn" onClick={() => { setView("mall"); }}>
            Entrar no shopping
          </button>
        </div>
      </div>
    );
  }

  if (view === "checkout") {
    return (
      <div className="vsb-checkout-overlay">
        <div className="vsb-checkout-modal">
          <button className="vsb-close-btn" onClick={() => setView("mall")}>✕</button>
          <h2 className="vsb-checkout-title">🛒 Finalizar Compra</h2>
          {cart.length === 0 ? (
            <div className="vsb-empty-cart">
              <p>Seu carrinho está vazio</p>
              <button className="vsb-back-btn" onClick={() => setView("mall")}>Voltar ao shopping</button>
            </div>
          ) : (
            <div className="vsb-checkout-items">
              {cart.map((item, i) => (
                <div key={i} className="vsb-checkout-item">
                  <div className="vsb-checkout-item-info">
                    <span className="vsb-checkout-item-name">{item.name}</span>
                    <span className="vsb-checkout-item-qty">Qtd: {item.qty}</span>
                  </div>
                  <div className="vsb-checkout-item-actions">
                    <span className="vsb-checkout-item-price">{item.price}</span>
                    <button className="vsb-remove-btn" onClick={() => removeFromCart(item.name)}>✕</button>
                  </div>
                </div>
              ))}
              <div className="vsb-checkout-total">
                <span>Total</span>
                <span className="vsb-total-value">{formatPrice(cartTotal)}</span>
              </div>
              <div className="vsb-checkout-note">
                Simulação — lojas físicas em breve
              </div>
              <button className="vsb-back-btn" onClick={() => setView("mall")}>Voltar ao shopping</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "store" && selectedStore) {
    return (
      <div className="vsb-mall-view">
        <div ref={containerRef} className="vsb-canvas" />
        <div className="vsb-store-header">
          <button className="vsb-back-btn vsb-back-btn-sm" onClick={() => { setView("mall"); setSelectedStore(null); }}>
            ← Sair da loja
          </button>
          <h2 className="vsb-store-name">{selectedStore.icon} {selectedStore.name}</h2>
        </div>
        <button className="vsb-cart-btn" onClick={() => setShowCartPopup(!showCartPopup)}>
          🛒 {cart.length > 0 && <span className="vsb-cart-badge">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
        </button>
        {showCartPopup && (
          <div className="vsb-cart-popup">
            {cart.length === 0 ? (
              <p className="vsb-cart-empty-text">Carrinho vazio</p>
            ) : (
              cart.map((item, i) => (
                <div key={i} className="vsb-cart-item">
                  <span>{item.name} x{item.qty}</span>
                  <button onClick={() => removeFromCart(item.name)} className="vsb-remove-btn-sm">✕</button>
                </div>
              ))
            )}
            {cart.length > 0 && (
              <div className="vsb-cart-popup-total">
                Total: {formatPrice(cartTotal)}
                <button className="vsb-checkout-btn" onClick={() => setView("checkout")}>Ir para o caixa</button>
              </div>
            )}
          </div>
        )}
        {showProductDetail && selectedProduct && (
          <div className="vsb-product-detail-overlay" onClick={() => setShowProductDetail(false)}>
            <div className="vsb-product-detail-modal" onClick={e => e.stopPropagation()}>
              <button className="vsb-close-btn" onClick={() => setShowProductDetail(false)}>✕</button>
              <div className="vsb-product-detail-3d">
                <div className="vsb-product-3d-viewer">
                  <div className="vsb-product-3d-icon" style={{ background: `radial-gradient(circle, ${selectedProduct.color}40 0%, transparent 70%)`, transform: `rotate(${productRotate}deg)` }}>
                    {selectedProduct.shape === "box" && <div className="vsb-3d-box" style={{ background: selectedProduct.color }} />}
                    {selectedProduct.shape === "sphere" && <div className="vsb-3d-sphere" style={{ background: `radial-gradient(circle at 35% 35%, #fff, ${selectedProduct.color})` }} />}
                    {selectedProduct.shape === "cylinder" && <div className="vsb-3d-cylinder" style={{ background: `linear-gradient(135deg, ${selectedProduct.color}, ${selectedProduct.color}88)` }} />}
                    {selectedProduct.shape === "torus" && <div className="vsb-3d-torus" style={{ borderColor: selectedProduct.color }} />}
                  </div>
                </div>
              </div>
              <div className="vsb-product-detail-info">
                <h3 className="vsb-product-detail-name">{selectedProduct.name}</h3>
                <p className="vsb-product-detail-price">{selectedProduct.price}</p>
                <div className="vsb-product-controls">
                  <button className="vsb-rotate-btn" onMouseDown={() => {
                    const interval = setInterval(() => setProductRotate(p => p + 2), 30);
                    const cleanup = () => { clearInterval(interval); };
                    window.addEventListener("mouseup", cleanup, { once: true });
                    window.addEventListener("touchend", cleanup, { once: true });
                  }}>⟳ Girar</button>
                  <button className="vsb-add-cart-btn" onClick={() => addToCart(selectedProduct)}>
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {notification && <div className="vsb-notification">{notification}</div>}
      </div>
    );
  }

  return (
    <div className="vsb-mall-view">
      <div ref={containerRef} className="vsb-canvas" />
      <div className="vsb-mall-hud">
        <div className="vsb-hud-top">
          <h2 className="vsb-lobby-title">🛍️ Virtual Shopping Brane</h2>
        </div>
        <div className="vsb-hud-hint">
          Clique no chão para andar • Clique nas lojas para entrar
        </div>
      </div>
      <button className="vsb-cart-btn" onClick={() => setShowCartPopup(!showCartPopup)}>
        🛒 {cart.length > 0 && <span className="vsb-cart-badge">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
      </button>
      {showCartPopup && (
        <div className="vsb-cart-popup">
          {cart.length === 0 ? (
            <p className="vsb-cart-empty-text">Carrinho vazio</p>
          ) : (
            cart.map((item, i) => (
              <div key={i} className="vsb-cart-item">
                <span>{item.name} x{item.qty}</span>
                <button onClick={() => removeFromCart(item.name)} className="vsb-remove-btn-sm">✕</button>
              </div>
            ))
          )}
          {cart.length > 0 && (
            <div className="vsb-cart-popup-total">
              Total: {formatPrice(cartTotal)}
              <button className="vsb-checkout-btn" onClick={() => setView("checkout")}>Ir para o caixa</button>
            </div>
          )}
        </div>
      )}
      {showProductDetail && selectedProduct && (
        <div className="vsb-product-detail-overlay" onClick={() => setShowProductDetail(false)}>
          <div className="vsb-product-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="vsb-close-btn" onClick={() => setShowProductDetail(false)}>✕</button>
            <div className="vsb-product-detail-3d">
                <div className="vsb-product-3d-viewer">
                  <div className="vsb-product-3d-icon" style={{ background: `radial-gradient(circle, ${selectedProduct.color}40 0%, transparent 70%)`, transform: `rotate(${productRotate}deg)` }}>
                  {selectedProduct.shape === "box" && <div className="vsb-3d-box" style={{ background: selectedProduct.color }} />}
                  {selectedProduct.shape === "sphere" && <div className="vsb-3d-sphere" style={{ background: `radial-gradient(circle at 35% 35%, #fff, ${selectedProduct.color})` }} />}
                  {selectedProduct.shape === "cylinder" && <div className="vsb-3d-cylinder" style={{ background: `linear-gradient(135deg, ${selectedProduct.color}, ${selectedProduct.color}88)` }} />}
                  {selectedProduct.shape === "torus" && <div className="vsb-3d-torus" style={{ borderColor: selectedProduct.color }} />}
                </div>
              </div>
            </div>
            <div className="vsb-product-detail-info">
              <h3 className="vsb-product-detail-name">{selectedProduct.name}</h3>
              <p className="vsb-product-detail-price">{selectedProduct.price}</p>
              <div className="vsb-product-controls">
                <button className="vsb-rotate-btn" onMouseDown={() => {
                  const interval = setInterval(() => setProductRotate(p => p + 2), 30);
                  const cleanup = () => { clearInterval(interval); };
                  window.addEventListener("mouseup", cleanup, { once: true });
                  window.addEventListener("touchend", cleanup, { once: true });
                }}>⟳ Girar</button>
                <button className="vsb-add-cart-btn" onClick={() => addToCart(selectedProduct)}>
                  Adicionar ao carrinho
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {notification && <div className="vsb-notification">{notification}</div>}
    </div>
  );
}
