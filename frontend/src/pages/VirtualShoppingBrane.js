import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Text, Environment, Stars, Sky, Html, ContactShadows, useCursor } from "@react-three/drei";
import * as THREE from "three";
import "../styles/virtualShopping.css";

// ── DATA ─────────────────────────────────────────────
const STORE_DATA = [
  { id:"fashion", name:"Fashion District", icon:"👗", color:"#FF6B9D", desc:"Roupas e acessórios premium",
    products:[
      { name:"Vestido Premium", price:"R$ 189,90", color:"#FF6B9D", shape:"cylinder", size:[0.4,0.6,0.4] },
      { name:"Jaqueta Leather", price:"R$ 349,90", color:"#8B4513", shape:"box", size:[0.5,0.3,0.2] },
      { name:"Bolsa Elegance", price:"R$ 259,90", color:"#D4A24C", shape:"torus", size:[0.35,0.12,16,20] },
    ]},
  { id:"gamer", name:"Gamer Zone", icon:"🎮", color:"#8A2CFF", desc:"Equipamentos gamers",
    products:[
      { name:"Headset RGB", price:"R$ 299,90", color:"#8A2CFF", shape:"torus", size:[0.35,0.15,12,20] },
      { name:"Mouse Pro X", price:"R$ 199,90", color:"#00FF88", shape:"box", size:[0.35,0.15,0.2] },
      { name:"Teclado Mecânico", price:"R$ 449,90", color:"#2C2C2C", shape:"box", size:[0.5,0.08,0.3] },
    ]},
  { id:"sneakers", name:"Sneaker Arena", icon:"👟", color:"#00D4AA", desc:"Os melhores tênis",
    products:[
      { name:"Air Max 3000", price:"R$ 599,90", color:"#FF4500", shape:"sphere", size:[0.3,16,16] },
      { name:"Runner Pro", price:"R$ 429,90", color:"#4A90D9", shape:"sphere", size:[0.3,16,16] },
      { name:"Street Style", price:"R$ 349,90", color:"#1A1A1A", shape:"sphere", size:[0.3,16,16] },
    ]},
  { id:"perfumes", name:"Parfum Luxe", icon:"🧴", color:"#FFD700", desc:"Perfumes importados",
    products:[
      { name:"Essence Gold", price:"R$ 429,90", color:"#FFD700", shape:"cylinder", size:[0.2,0.6,0.2] },
      { name:"Oud Prestige", price:"R$ 599,90", color:"#800020", shape:"cylinder", size:[0.2,0.55,0.2] },
      { name:"Floral Dream", price:"R$ 299,90", color:"#FFB6C1", shape:"cylinder", size:[0.2,0.5,0.2] },
    ]},
  { id:"eletronics", name:"Tech Hub", icon:"📱", color:"#00BFFF", desc:"Tecnologia e inovação",
    products:[
      { name:"Phone X Ultra", price:"R$ 4.299,90", color:"#1A1A2E", shape:"box", size:[0.35,0.07,0.15] },
      { name:"Tablet Pro 12", price:"R$ 2.899,90", color:"#C0C0C0", shape:"box", size:[0.4,0.06,0.28] },
      { name:"SmartWatch 5", price:"R$ 1.299,90", color:"#FFD700", shape:"torus", size:[0.25,0.08,12,20] },
    ]},
  { id:"accessories", name:"Access World", icon:"⌚", color:"#FF8C00", desc:"Acessórios e relógios",
    products:[
      { name:"Relógio Classic", price:"R$ 799,90", color:"#D4A24C", shape:"torus", size:[0.3,0.08,16,24] },
      { name:"Óculos Premium", price:"R$ 349,90", color:"#1A1A1A", shape:"box", size:[0.4,0.1,0.15] },
      { name:"Carteira Slim", price:"R$ 189,90", color:"#8B4513", shape:"box", size:[0.3,0.05,0.15] },
    ]},
  { id:"sports", name:"Sports Club", icon:"⚽", color:"#32CD32", desc:"Artigos esportivos",
    products:[
      { name:"Bola Oficial", price:"R$ 129,90", color:"#FFFFFF", shape:"sphere", size:[0.28,20,20] },
      { name:"Mochila Sport", price:"R$ 199,90", color:"#1A1A1A", shape:"box", size:[0.4,0.5,0.25] },
      { name:"Garrafa Térmica", price:"R$ 89,90", color:"#32CD32", shape:"cylinder", size:[0.15,0.45,0.15] },
    ]},
];

// ── COLORS ────────────────────────────────────────────
const FLOOR_COLOR = "#0A0A18";
const WALL_COLOR = "#0E0E20";
const CEILING_COLOR = "#08081A";
const GOLD = "#D4A24C";

// ── SHAPE COMPONENTS ──────────────────────────────────
function ProductShape({ product, onClick, isHighlighted }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.008;
      ref.current.position.y = (product.shape === "box" ? 0.3 : 0.4) + Math.sin(state.clock.elapsedTime * 1.5 + (product.name.length)) * 0.04;
    }
  });

  const baseY = product.shape === "box" ? 0.3 : 0.4;
  const scale = isHighlighted ? 1.15 : 1;

  const meshProps = {
    ref,
    onClick: (e) => { e.stopPropagation(); onClick?.(e); },
    onPointerEnter: () => setHovered(true),
    onPointerLeave: () => setHovered(false),
    position: [0, baseY, 0],
    scale: [scale, scale, scale],
  };

  return (
    <group>
      <mesh {...meshProps} castShadow>
        {product.shape === "box" && <boxGeometry args={product.size} />}
        {product.shape === "sphere" && <sphereGeometry args={product.size} />}
        {product.shape === "cylinder" && <cylinderGeometry args={product.size} />}
        {product.shape === "torus" && <torusGeometry args={product.size} />}
        <meshPhysicalMaterial
          color={product.color}
          metalness={0.3}
          roughness={0.35}
          envMapIntensity={0.6}
          clearcoat={0.15}
        />
      </mesh>
      {/* Reflection glow */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial color={product.color} transparent opacity={hovered ? 0.15 : 0.06} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── PEDESTAL ──────────────────────────────────────────
function Pedestal({ position, children }) {
  return (
    <group position={position}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.06, 12]} />
        <meshPhysicalMaterial color="#1A1A2E" metalness={0.5} roughness={0.3} />
      </mesh>
      {children}
    </group>
  );
}

// ── STORE SIGN ────────────────────────────────────────
function StoreSign({ title, color }) {
  return (
    <group>
      <mesh position={[0, 1.2, 0]}>
        <planeGeometry args={[1.8, 0.35]} />
        <meshBasicMaterial color="#000" transparent opacity={0.4} />
      </mesh>
      <Text
        position={[0, 1.2, 0.01]}
        fontSize={0.18}
        color={color}
        font="/Inter-Bold.woff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {title}
      </Text>
      {/* Neon glow */}
      <mesh position={[0, 1.2, -0.05]}>
        <planeGeometry args={[2.0, 0.45]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

// ── STORE FRONT ───────────────────────────────────────
function StoreFront({ store, side, zPos, onEnter }) {
  const dir = side === "left" ? 1 : -1;
  const xPos = dir * 6.8;
  const w = 3.0;
  const h = 3.0;
  const d = 2.8;

  return (
    <group>
      {/* Store box */}
      <mesh position={[xPos, h / 2, zPos]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial color={WALL_COLOR} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Front face with glass effect */}
      <mesh position={[xPos + dir * (d / 2 + 0.01), 1.5, zPos]}>
        <planeGeometry args={[w * 0.85, h * 0.75]} />
        <meshPhysicalMaterial
          color={store.color}
          transparent
          opacity={0.08}
          roughness={0.05}
          metalness={0.1}
          envMapIntensity={0.3}
        />
      </mesh>
      {/* Frame */}
      <mesh position={[xPos + dir * (d / 2 + 0.02), 1.55, zPos]}>
        <planeGeometry args={[w * 0.87, h * 0.77]} />
        <meshBasicMaterial color={store.color} transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      {/* Top accent light */}
      <mesh position={[xPos, h + 0.05, zPos]}>
        <boxGeometry args={[w + 0.2, 0.06, 0.15]} />
        <meshBasicMaterial color={store.color} transparent opacity={0.25} />
      </mesh>
      {/* Sign */}
      <StoreSign title={store.name} color={store.color} />
      {/* Floor glow */}
      <mesh position={[xPos, 0.01, zPos]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.6, 0.3]} />
        <meshBasicMaterial color={store.color} transparent opacity={0.08} />
      </mesh>
      {/* Clickable entrance */}
      <mesh
        position={[xPos + dir * (d / 2 + 0.03), 1.45, zPos]}
        onClick={(e) => { e.stopPropagation(); onEnter(store); }}
        visible={false}
      >
        <planeGeometry args={[w * 0.7, h * 0.6]} />
      </mesh>
    </group>
  );
}

// ── MALL LIGHTING ────────────────────────────────────
function MallLighting() {
  return (
    <>
      <ambientLight intensity={0.2} color="#222244" />
      <hemisphereLight args={["#4444aa", "#111122", 0.3]} />
      <directionalLight
        position={[0, 6, 2]}
        intensity={0.5}
        color="#FFEECC"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 4, -4]} intensity={0.15} color="#8888FF" />
      <pointLight position={[0, 4, 0]} intensity={0.4} color={GOLD} distance={12} />
      {/* Ceiling lights */}
      {[-6, -3, 0, 3, 6].map((x) =>
        [-4, 0, 4].map((z) => (
          <pointLight key={`${x}-${z}`} position={[x, 3.8, z]} intensity={0.15} color="#FFFFFF" distance={3} />
        ))
      )}
    </>
  );
}

// ── MALL FLOOR ────────────────────────────────────────
function MallFloor() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = FLOOR_COLOR;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 512; i += 32) {
      ctx.strokeStyle = "rgba(212, 162, 76, 0.025)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 6);
    return tex;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[18, 14]} />
      <meshPhysicalMaterial map={texture} roughness={0.3} metalness={0.15} color="#0E0E20" />
    </mesh>
  );
}

// ── MALL CEILING ──────────────────────────────────────
function MallCeiling() {
  return (
    <group>
      <mesh position={[0, 3.6, 0]}>
        <planeGeometry args={[18, 14]} />
        <meshBasicMaterial color={CEILING_COLOR} transparent opacity={0.5} side={THREE.BackSide} />
      </mesh>
      {/* Grid ceiling lights */}
      {[-6, -2, 2, 6].map((x) =>
        [-4, 0, 4].map((z) => (
          <group key={`${x}-${z}`} position={[x, 3.55, z]}>
            <mesh>
              <planeGeometry args={[0.8, 0.3]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.15} />
            </mesh>
            <mesh position={[0, -0.02, 0]}>
              <planeGeometry args={[0.7, 0.2]} />
              <meshBasicMaterial color="#FFEECC" transparent opacity={0.06} />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}

// ── MALL DECORATIONS ──────────────────────────────────
function MallDecorations() {
  return (
    <group>
      {/* Center pillars */}
      {[-2, 2].map((x) =>
        <mesh key={x} position={[x, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.6, 8]} />
          <meshPhysicalMaterial color="#1A1A2E" metalness={0.6} roughness={0.2} />
        </mesh>
      )}
      {/* Golden strip down the middle */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.03, 10]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.12} />
      </mesh>
      {/* Side pillars */}
      {[-6, 6].map((x) =>
        [-4, 4].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.5, z]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 3, 6]} />
            <meshPhysicalMaterial color="#15152A" metalness={0.4} roughness={0.3} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ── PRODUCT SHELF (inside store) ──────────────────────
function ProductShelf({ products, onSelect }) {
  return (
    <group>
      {/* Shelf body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[2.2, 0.06, 0.5]} />
        <meshPhysicalMaterial color="#15152A" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Shelf legs */}
      <mesh position={[-1.05, 0.2, 0]}>
        <boxGeometry args={[0.03, 0.4, 0.03]} />
        <meshPhysicalMaterial color="#222" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[1.05, 0.2, 0]}>
        <boxGeometry args={[0.03, 0.4, 0.03]} />
        <meshPhysicalMaterial color="#222" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Products on shelf */}
      {products.map((product, i) => (
        <group key={product.name} position={[-0.7 + i * 0.7, 0.45, 0]}>
          <ProductShape product={product} onClick={() => onSelect(product)} />
        </group>
      ))}
    </group>
  );
}

// ── STORE INTERIOR ────────────────────────────────────
function StoreInterior({ store, onBack, onSelectProduct }) {
  return (
    <group>
      {/* Walls */}
      <mesh position={[0, 1.5, -2.5]}><boxGeometry args={[5, 3, 0.1]} /><meshPhysicalMaterial color="#0E0E20" roughness={0.5} /></mesh>
      <mesh position={[0, 1.5, 2.5]}><boxGeometry args={[5, 3, 0.1]} /><meshPhysicalMaterial color="#0E0E20" roughness={0.5} /></mesh>
      <mesh position={[-2.5, 1.5, 0]}><boxGeometry args={[0.1, 3, 5]} /><meshPhysicalMaterial color="#0E0E20" roughness={0.5} /></mesh>
      <mesh position={[2.5, 1.5, 0]}><boxGeometry args={[0.1, 3, 5]} /><meshPhysicalMaterial color="#0E0E20" roughness={0.5} /></mesh>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshPhysicalMaterial color="#12122A" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Accent wall */}
      <mesh position={[0, 1.5, -2.48]}>
        <planeGeometry args={[4, 2.5]} />
        <meshBasicMaterial color={store.color} transparent opacity={0.06} />
      </mesh>
      {/* Top light band */}
      <mesh position={[0, 2.8, -2.45]}>
        <planeGeometry args={[4.2, 0.08]} />
        <meshBasicMaterial color={store.color} transparent opacity={0.2} />
      </mesh>
      {/* Shelves */}
      <group position={[-1.6, 0, -1.4]}>
        <ProductShelf products={store.products.slice(0, 2)} onSelect={onSelectProduct} />
      </group>
      <group position={[1.6, 0, -1.4]}>
        <ProductShelf products={store.products.slice(2)} onSelect={onSelectProduct} />
      </group>
      {/* Ceiling lights */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <pointLight key={`${x}-${z}`} position={[x, 2.8, z]} intensity={0.2} color="#FFFFFF" distance={2.5} />
        ))
      )}
      {/* Exit sign */}
      <group position={[0, 2.5, 2.45]}>
        <mesh><planeGeometry args={[0.6, 0.2]} /><meshBasicMaterial color="#FF4444" transparent opacity={0.3} /></mesh>
        <mesh position={[0, 0, 0.01]}><planeGeometry args={[0.4, 0.12]} /><meshBasicMaterial color="#FFFFFF" transparent opacity={0.1} /></mesh>
      </group>
      {/* Ambient light */}
      <ambientLight intensity={0.3} color={store.color} />
      <pointLight position={[0, 2, 0]} intensity={0.3} color={store.color} distance={4} />
    </group>
  );
}

// ── CART 3D ───────────────────────────────────────────
function Cart3D({ position, itemCount }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      const target = position.current;
      ref.current.position.x += (target.x - ref.current.position.x) * 0.08;
      ref.current.position.z += (target.z - ref.current.position.z) * 0.08;
    }
  });

  return (
    <group ref={ref} position={[0, 0, -2]}>
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.35]} />
        <meshPhysicalMaterial color={GOLD} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Inner */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.42, 0.28, 0.28]} />
        <meshBasicMaterial color="#0A0A1A" />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0.38, -0.18]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
        <meshPhysicalMaterial color="#888" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Wheels */}
      {[[-0.18, 0.04, -0.12], [0.18, 0.04, -0.12], [-0.18, 0.04, 0.12], [0.18, 0.04, 0.12]].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshPhysicalMaterial color="#333" roughness={0.8} />
        </mesh>
      ))}
      {/* Item indicator */}
      {itemCount > 0 && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={GOLD} />
        </mesh>
      )}
    </group>
  );
}

// ── CAMERA CONTROLLER ─────────────────────────────────
function CameraController({ targetPos, interiorCamera }) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 2.8, 7));
  const currentLook = useRef(new THREE.Vector3(0, 1.2, 0));

  useFrame(() => {
    if (interiorCamera) {
      // Smooth transition to interior view
      const target = new THREE.Vector3(0, 1.8, 4);
      const lookTarget = new THREE.Vector3(0, 1, 0);
      currentPos.current.lerp(target, 0.04);
      currentLook.current.lerp(lookTarget, 0.04);
    } else if (targetPos.current) {
      const target = targetPos.current;
      const camTarget = new THREE.Vector3(target.x, 2.8, target.z + 2);
      const lookTarget = new THREE.Vector3(target.x, 1.2, target.z);
      currentPos.current.lerp(camTarget, 0.04);
      currentLook.current.lerp(lookTarget, 0.04);
    }
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLook.current);
  });

  return null;
}

// ── FLOOR CLICK HANDLER ───────────────────────────────
function FloorClick({ onFloorClick, enabled }) {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    if (!enabled) return;
    const handleClick = (e) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.01);
      const point = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(plane, point);
      if (point) {
        onFloorClick(point);
      }
    };
    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [camera, gl, onFloorClick, enabled]);

  return null;
}

// ── MALL SCENE ────────────────────────────────────────
function MallScene({ onEnterStore, onFloorClick, onSelectProduct, targetPos, interiorCamera }) {
  const stores = useMemo(() => {
    const positions = [];
    const sides = ["left", "right"];
    let idx = 0;
    for (const store of STORE_DATA) {
      const side = sides[idx % 2];
      const row = Math.floor(idx / 2);
      positions.push({ store, side, zPos: -5 + row * 3.2 });
      idx++;
    }
    return positions;
  }, []);

  return (
    <>
      <MallLighting />
      <MallFloor />
      <MallCeiling />
      <MallDecorations />
      {stores.map(({ store, side, zPos }) => (
        <StoreFront key={store.id} store={store} side={side} zPos={zPos} onEnter={onEnterStore} />
      ))}
      {!interiorCamera && (
        <FloorClick onFloorClick={onFloorClick} enabled={true} />
      )}
      <CameraController targetPos={targetPos} interiorCamera={interiorCamera} />
      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={16} blur={2} far={5} />
    </>
  );
}

// ── STORE INTERIOR SCENE ──────────────────────────────
function StoreScene({ store, onBack, onSelectProduct, targetPos }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[0, 3, 2]} intensity={0.4} />
      <StoreInterior store={store} onBack={onBack} onSelectProduct={onSelectProduct} />
      <CameraController targetPos={targetPos} interiorCamera={true} />
      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={5} blur={1.5} far={3} />
    </>
  );
}

// ── PRODUCT MODAL (HTML overlay) ──────────────────────
function ProductModal({ product, onClose, onAddToCart, cart }) {
  const [rotate, setRotate] = useState(0);
  const rotateRef = useRef(null);
  const [scale, setScale] = useState(1);

  const handleRotateStart = () => {
    rotateRef.current = setInterval(() => setRotate(p => p + 3), 30);
  };
  const handleRotateEnd = () => {
    if (rotateRef.current) clearInterval(rotateRef.current);
  };

  return (
    <div className="vsb-product-modal-overlay" onClick={onClose}>
      <div className="vsb-product-modal" onClick={e => e.stopPropagation()}>
        <button className="vsb-modal-close" onClick={onClose}>✕</button>
        <div className="vsb-modal-3d">
          <div
            className="vsb-modal-3d-shape"
            style={{
              transform: `rotateY(${rotate}deg) scale(${scale})`,
              background: `radial-gradient(circle at 35% 30%, ${product.color}33, transparent 70%)`
            }}
            onWheel={(e) => setScale(s => Math.max(0.5, Math.min(2, s - e.deltaY * 0.001)))}
          >
            {product.shape === "box" && <div className="vsb-shape-box" style={{ background: product.color, boxShadow: `0 0 30px ${product.color}44` }} />}
            {product.shape === "sphere" && <div className="vsb-shape-sphere" style={{ background: `radial-gradient(circle at 35% 35%, #fff, ${product.color})`, boxShadow: `0 0 30px ${product.color}44` }} />}
            {product.shape === "cylinder" && <div className="vsb-shape-cylinder" style={{ background: `linear-gradient(135deg, ${product.color}, ${product.color}aa)`, boxShadow: `0 0 30px ${product.color}44` }} />}
            {product.shape === "torus" && <div className="vsb-shape-torus" style={{ borderColor: product.color, boxShadow: `0 0 30px ${product.color}44` }} />}
          </div>
          <div className="vsb-modal-zoom-hint">Rolar para zoom</div>
        </div>
        <div className="vsb-modal-info">
          <h2 className="vsb-modal-name">{product.name}</h2>
          <p className="vsb-modal-price">{product.price}</p>
          <div className="vsb-modal-actions">
            <button
              className="vsb-rotate-action"
              onMouseDown={handleRotateStart}
              onMouseUp={handleRotateEnd}
              onMouseLeave={handleRotateEnd}
              onTouchStart={handleRotateStart}
              onTouchEnd={handleRotateEnd}
            >
              ⟳ Girar
            </button>
            <button className="vsb-cart-action" onClick={() => onAddToCart(product)}>
              🛒 Adicionar ao carrinho
            </button>
          </div>
          <p className="vsb-modal-shipping">Frete simulado • Consulte prazos</p>
        </div>
      </div>
    </div>
  );
}

// ── LOADING SCREEN ───────────────────────────────────
function LoadingScreen({ onLoaded }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setTimeout(onLoaded, 300); return 100; }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <div className="vsb-loading">
      <div className="vsb-loading-content">
        <div className="vsb-loading-icon">🛍️</div>
        <h2 className="vsb-loading-title">Virtual Shopping Brane</h2>
        <div className="vsb-loading-bar-track">
          <div className="vsb-loading-bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <p className="vsb-loading-text">Preparando sua experiência...</p>
      </div>
    </div>
  );
}

// ── CART POPUP ────────────────────────────────────────
function CartPopup({ cart, onRemove, onCheckout, onClose }) {
  const total = cart.reduce((sum, item) => {
    const num = parseFloat(item.price.replace(/[^\d,]/g, "").replace(",", "."));
    return sum + (isNaN(num) ? 0 : num * item.qty);
  }, 0);

  return (
    <div className="vsb-cart-overlay" onClick={onClose}>
      <div className="vsb-cart-modal" onClick={e => e.stopPropagation()}>
        <div className="vsb-cart-header">
          <h3>🛒 Carrinho</h3>
          <button className="vsb-modal-close" onClick={onClose}>✕</button>
        </div>
        {cart.length === 0 ? (
          <p className="vsb-cart-empty">Seu carrinho está vazio</p>
        ) : (
          <div className="vsb-cart-list">
            {cart.map((item, i) => (
              <div key={i} className="vsb-cart-row">
                <div className="vsb-cart-row-info">
                  <span className="vsb-cart-row-name">{item.name}</span>
                  <span className="vsb-cart-row-qty">Qtd: {item.qty}</span>
                </div>
                <div className="vsb-cart-row-right">
                  <span className="vsb-cart-row-price">{item.price}</span>
                  <button className="vsb-cart-remove" onClick={() => onRemove(item.name)}>✕</button>
                </div>
              </div>
            ))}
            <div className="vsb-cart-total">
              <span>Total</span>
              <span className="vsb-cart-total-value">R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
        )}
        {cart.length > 0 && (
          <button className="vsb-cart-checkout" onClick={onCheckout}>Ir para o caixa</button>
        )}
        <p className="vsb-cart-simulate">Simulação • Lojas físicas em breve</p>
      </div>
    </div>
  );
}

// ── CHECKOUT ──────────────────────────────────────────
function CheckoutScreen({ cart, onRemove, onBack }) {
  const total = cart.reduce((sum, item) => {
    const num = parseFloat(item.price.replace(/[^\d,]/g, "").replace(",", "."));
    return sum + (isNaN(num) ? 0 : num * item.qty);
  }, 0);

  return (
    <div className="vsb-checkout-screen">
      <div className="vsb-checkout-card">
        <div className="vsb-checkout-top">
          <button className="vsb-back-arrow" onClick={onBack}>← Voltar</button>
          <h2 className="vsb-checkout-title">🧾 Finalizar Compra</h2>
        </div>
        {cart.length === 0 ? (
          <div className="vsb-checkout-empty">
            <p>Carrinho vazio</p>
            <button className="vsb-back-btn" onClick={onBack}>Voltar ao shopping</button>
          </div>
        ) : (
          <>
            <div className="vsb-checkout-items">
              {cart.map((item, i) => (
                <div key={i} className="vsb-checkout-row">
                  <div className="vsb-checkout-row-left">
                    <div className="vsb-checkout-row-dot" style={{ background: item.color }} />
                    <div>
                      <span className="vsb-checkout-row-name">{item.name}</span>
                      <span className="vsb-checkout-row-qty">Qtd: {item.qty}</span>
                    </div>
                  </div>
                  <div className="vsb-checkout-row-right">
                    <span className="vsb-checkout-row-price">{item.price}</span>
                    <button className="vsb-cart-remove" onClick={() => onRemove(item.name)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="vsb-checkout-summary">
              <div className="vsb-checkout-line">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="vsb-checkout-line">
                <span>Frete</span>
                <span>Grátis</span>
              </div>
              <div className="vsb-checkout-line vsb-checkout-total-line">
                <span>Total</span>
                <span className="vsb-checkout-total-amount">R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
            <button className="vsb-checkout-pay">Simular Pagamento</button>
            <p className="vsb-checkout-note">Ambiente de demonstração • Nenhuma cobrança real</p>
            <button className="vsb-checkout-back" onClick={onBack}>Continuar comprando</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── NOTIFICATION ──────────────────────────────────────
function Notification({ message, onHide }) {
  useEffect(() => {
    const t = setTimeout(onHide, 2500);
    return () => clearTimeout(t);
  }, [message, onHide]);

  return <div className="vsb-notification" onClick={onHide}>{message}</div>;
}

// ── ENTRANCE SCREEN ───────────────────────────────────
function EntranceScreen({ onEnter }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setAnimate(true); }, []);

  return (
    <div className={`vsb-entrance ${animate ? "vsb-entrance-in" : ""}`}>
      <div className="vsb-entrance-glow" />
      <div className="vsb-entrance-content">
        <div className="vsb-entrance-icon-wrap">
          <span className="vsb-entrance-icon">🛍️</span>
        </div>
        <h1 className="vsb-entrance-title">
          Virtual Shopping <span className="vsb-entrance-accent">Brane</span>
        </h1>
        <p className="vsb-entrance-sub">
          Um shopping virtual imersivo direto do seu navegador
        </p>
        <div className="vsb-entrance-features">
          <span>📍 Ande clicando na tela</span>
          <span>🏪 Entre nas lojas</span>
          <span>🛒 Carrinho interativo</span>
        </div>
        <button className="vsb-entrance-btn" onClick={onEnter}>
          Entrar no shopping
        </button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────
export default function VirtualShoppingBrane() {
  const [view, setView] = useState("loading");
  const [productDetail, setProductDetail] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [notif, setNotif] = useState("");
  const [currentStore, setCurrentStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inStore, setInStore] = useState(false);

  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const cartTarget = useRef(new THREE.Vector3(0, 0, 0));

  const notify = useCallback((msg) => {
    setNotif(msg);
  }, []);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const exist = prev.find(item => item.name === product.name);
      if (exist) return prev.map(item => item.name === product.name ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setProductDetail(null);
    setSelectedProduct(null);
    notify(`${product.name} adicionado ao carrinho!`);
  }, [notify]);

  const removeFromCart = useCallback((name) => {
    setCart(prev => prev.filter(item => item.name !== name));
  }, []);

  const handleEnterStore = useCallback((store) => {
    setCurrentStore(store);
    setInStore(true);
  }, []);

  const handleExitStore = useCallback(() => {
    setCurrentStore(null);
    setInStore(false);
  }, []);

  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setProductDetail(product);
  }, []);

  const handleFloorClick = useCallback((point) => {
    targetPos.current.set(point.x, 0, point.z);
    cartTarget.current.set(point.x, 0, point.z);
  }, []);

  if (view === "loading") {
    return <LoadingScreen onLoaded={() => setView("entrance")} />;
  }

  if (view === "entrance") {
    return <EntranceScreen onEnter={() => setView("mall")} />;
  }

  if (view === "checkout") {
    return (
      <CheckoutScreen
        cart={cart}
        onRemove={removeFromCart}
        onBack={() => setView("mall")}
      />
    );
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Store interior view (no 3D scene, just HTML)
  if (inStore && currentStore) {
    return (
      <div className="vsb-store-view">
        {/* 3D Background Canvas */}
        <Canvas shadows camera={{ position: [0, 1.8, 4], fov: 50 }} dpr={[1, 1.5]}>
          <StoreScene
            store={currentStore}
            onBack={handleExitStore}
            onSelectProduct={handleSelectProduct}
            targetPos={targetPos}
          />
        </Canvas>
        {/* UI Overlay */}
        <div className="vsb-store-ui">
          <button className="vsb-back-btn" onClick={handleExitStore}>← Sair</button>
          <h2 className="vsb-store-title">{currentStore.icon} {currentStore.name}</h2>
          <p className="vsb-store-desc">{currentStore.desc}</p>
        </div>
        {/* Cart button */}
        <button className="vsb-cart-fab" onClick={() => setShowCart(true)}>
          🛒{cartCount > 0 && <span className="vsb-cart-badge">{cartCount}</span>}
        </button>
        {/* Product detail modal */}
        {productDetail && (
          <ProductModal
            product={productDetail}
            onClose={() => setProductDetail(null)}
            onAddToCart={addToCart}
            cart={cart}
          />
        )}
        {/* Cart popup */}
        {showCart && (
          <CartPopup
            cart={cart}
            onRemove={removeFromCart}
            onCheckout={() => { setShowCart(false); setView("checkout"); }}
            onClose={() => setShowCart(false)}
          />
        )}
        {notif && <Notification message={notif} onHide={() => setNotif("")} />}
      </div>
    );
  }

  // Mall view
  return (
    <div className="vsb-mall-view">
      <Canvas shadows camera={{ position: [0, 2.8, 7], fov: 50 }} dpr={[1, 1.5]}>
        <MallScene
          onEnterStore={handleEnterStore}
          onFloorClick={handleFloorClick}
          onSelectProduct={handleSelectProduct}
          targetPos={targetPos}
          interiorCamera={false}
        />
      </Canvas>
      {/* HUD */}
      <div className="vsb-hud">
        <div className="vsb-hud-top">
          <span className="vsb-hud-logo">🛍️ Virtual Shopping Brane</span>
        </div>
        <div className="vsb-hud-hint">
          Clique no chão para andar • Clique nas vitrines para entrar
        </div>
      </div>
      {/* Cart FAB */}
      <button className="vsb-cart-fab" onClick={() => setShowCart(true)}>
        🛒{cartCount > 0 && <span className="vsb-cart-badge">{cartCount}</span>}
      </button>
      {/* Product detail modal */}
      {productDetail && (
        <ProductModal
          product={productDetail}
          onClose={() => setProductDetail(null)}
          onAddToCart={addToCart}
          cart={cart}
        />
      )}
      {/* Cart popup */}
      {showCart && (
        <CartPopup
          cart={cart}
          onRemove={removeFromCart}
          onCheckout={() => { setShowCart(false); setView("checkout"); }}
          onClose={() => setShowCart(false)}
        />
      )}
      {notif && <Notification message={notif} onHide={() => setNotif("")} />}
    </div>
  );
}
