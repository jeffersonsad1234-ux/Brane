/* Local ID generator to avoid circular dependency with editorStore */
let _idCounter = 0;
function id() { return `obj_${++_idCounter}_${Date.now().toString(36)}`; }
function cube(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "cube", name, position: pos, rotation: extra.rot || [0, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.7, metalness: extra.metalness ?? 0.2, emissive: extra.emissive || "#000000", emissiveIntensity: extra.emissiveIntensity || 0, ...extra };
}
function light(name, pos, color, intensity = 1, extra = {}) {
  return { id: id(), type: "light", name, position: pos, rotation: [0, 0, 0], intensity, color, visible: true, ...extra };
}
function sphere(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "sphere", name, position: pos, rotation: [0, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.3, metalness: extra.metalness ?? 0.3, emissive: extra.emissive || "#000000", emissiveIntensity: extra.emissiveIntensity || 0, ...extra };
}
function capsule(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "capsule", name, position: pos, rotation: extra.rot || [0, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.5, metalness: extra.metalness ?? 0.3, emissive: extra.emissive || "#000000", emissiveIntensity: extra.emissiveIntensity || 0, ...extra };
}
function cylinder(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "cylinder", name, position: pos, rotation: extra.rot || [0, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.4, metalness: extra.metalness ?? 0.6, emissive: extra.emissive || "#000000", emissiveIntensity: extra.emissiveIntensity || 0, ...extra };
}
function plane(name, pos, scale, color, extra = {}) {
  return { id: id(), type: "plane", name, position: pos, rotation: extra.rot || [-Math.PI / 2, 0, 0], scale, color, visible: true, roughness: extra.roughness ?? 0.8, metalness: extra.metalness ?? 0, ...extra };
}

/* Helper to create emissive rectangles for windows/neon details */
function emissiveRect(name, pos, scale, color, intensity = 2, extra = {}) {
  return {
    id: id(),
    type: "cube",
    name,
    position: pos,
    rotation: extra.rot || [0, 0, 0],
    scale,
    color: "#000000", // base black, emissive provides the color
    visible: true,
    roughness: 0.1,
    metalness: 0.3,
    emissive: color,
    emissiveIntensity: intensity,
    ...extra
  };
}

const BUILDINGS_DATA = [
  // Main street buildings with detailed facades
  { pos: [-15, 3, -5], scale: [4, 6, 3], color: "#1a1a2e", windows: true },
  { pos: [-8, 4, -5], scale: [3, 8, 2.5], color: "#16213e", windows: true },
  { pos: [0, 3.5, -5], scale: [4, 7, 3], color: "#0f3460", windows: true },
  { pos: [8, 4, -5], scale: [3.5, 8, 3], color: "#533483", windows: true },
  { pos: [16, 3.5, -5], scale: [4, 7, 3], color: "#112a46", windows: true },
  
  // Side street buildings
  { pos: [-18, 2.5, -12], scale: [3.5, 5, 2.5], color: "#0f0f1a", windows: true },
  { pos: [-10, 3, -12], scale: [2.5, 6, 2], color: "#16213e", windows: true },
  { pos: [2, 2.8, -12], scale: [3, 5.5, 2.5], color: "#0f3460", windows: true },
  { pos: [12, 3, -12], scale: [2.8, 6, 2.2], color: "#533483", windows: true },
  { pos: [-14, 1.8, -20], scale: [3, 3.5, 2.8], color: "#112a46", windows: true },
  { pos: [-4, 2.2, -20], scale: [2.5, 4, 2], color: "#1a1a2e", windows: true },
  { pos: [6, 2.5, -20], scale: [3, 4.5, 2.5], color: "#16213e", windows: true },
  { pos: [16, 2, -20], scale: [2.5, 3.5, 2], color: "#0f3460", windows: true },
  
  // Background skyline
  { pos: [-22, 5, -8], scale: [3, 10, 2.5], color: "#0c0c16" },
  { pos: [-16, 6, -8], scale: [2.5, 12, 2], color: "#1a1a2e" },
  { pos: [-8, 7, -8], scale: [2, 14, 1.8], color: "#16213e" },
  { pos: [2, 6.5, -8], scale: [3, 13, 2.2], color: "#0f3460" },
  { pos: [10, 5.5, -8], scale: [2.5, 11, 2], color: "#533483" },
  { pos: [18, 4.5, -8], scale: [2, 9, 1.8], color: "#112a46" },
  
  // Corner buildings with height variation
  { pos: [-20, 3.5, -18], scale: [2.5, 7, 2], color: "#0f0f1a", windows: true },
  { pos: [-12, 4, -18], scale: [3, 8, 2.5], color: "#16213e", windows: true },
  { pos: [0, 5, -18], scale: [3.5, 10, 3], color: "#0f3460", windows: true },
  { pos: [12, 4.5, -18], scale: [2.8, 9, 2.2], color: "#533483", windows: true },
  { pos: [20, 3.5, -18], scale: [2.5, 7, 2], color: "#112a46", windows: true },
];

const NEON_DATA = [
  { pos: [-12, 4.5, -2], color: "#ff00aa", w: 0.8 },
  { pos: [0, 6.2, -5], color: "#00ddff", w: 1.2 },
  { pos: [10, 3.8, -3], color: "#ff8800", w: 0.6 },
  { pos: [-8, 6.5, -10], color: "#0044ff", w: 0.8 },
  { pos: [5, 5.5, -12], color: "#ff00aa", w: 0.7 },
  { pos: [0, 5, -25], color: "#00ddff", w: 1.0 },
  { pos: [8, 7.5, -18], color: "#ff8800", w: 0.9 },
  { pos: [-6, 4.2, 3], color: "#ff00aa", w: 0.8 },
  { pos: [6, 6.2, 2], color: "#00ddff", w: 0.7 },
  { pos: [20, 7.5, -6], color: "#0044ff", w: 1.0 },
  { pos: [-18, 5.5, -12], color: "#ff00aa", w: 0.6 },
  { pos: [-14, 3.5, -25], color: "#ff8800", w: 0.7 },
  { pos: [14, 4.5, -15], color: "#00ddff", w: 0.6 },
  { pos: [-10, 3.5, -20], color: "#ff00aa", w: 0.8 },
  { pos: [0, 4.3, 5], color: "#ff8800", w: 0.7 },
  { pos: [10, 5.2, 0], color: "#00ddff", w: 0.6 },
  { pos: [15, 6.5, -10], color: "#0044ff", w: 0.7 },
];

const LAMP_DATA = [
  [-8, -3], [8, -3], [-4, -8], [6, -7],
  [-10, -12], [4, -14], [-6, -18], [12, -10],
  [-14, -6], [16, -8], [0, -22], [-12, -16],
  [0, 2], [-5, 0], [7, -2], [-16, -14],
  [18, -12], [10, -20], [-8, -22], [20, -8],
];

const COLLECTIBLE_DATA = [
  { pos: [-6, 1.2, -7], color: "#00ddff" },
  { pos: [5, 1.5, -14], color: "#ff00aa" },
  { pos: [-12, 1.8, -20], color: "#00ff88" },
  { pos: [14, 1, -24], color: "#ff8800" },
  { pos: [3, 1.3, -4], color: "#aa44ff" },
];

const scene = {
  name: "Cyberpunk — Neon District",
  objects: [
     /* Ground and road */
     plane("Ground", [0, -0.5, -10], [50, 50, 1], "#080812", { roughness: 0.95, metalness: 0.05 }),
     plane("Road", [0, -0.49, -10], [10, 50, 1], "#0a0a1a", { roughness: 0.9, metalness: 0.1 }),
     
     /* Road markings */
     ...Array.from({length: 10}, (_, i) => 
       plane(`RoadStripe_${i + 1}`, [-0.01, -0.48, -10 + i * 10], [0.2, 0.1, 0.01], "#ff0", { roughness: 0.1, metalness: 0.2 })
     ),
     
     /* Sidewalk details */
     ...Array.from({length: 20}, (_, i) => 
       plane(`SidewalkCrack_${i + 1}`, 
         [-15 + Math.random() * 30, -0.495, -5 + Math.random() * 40], 
         [0.1 + Math.random() * 0.3, 0.02, 0.1 + Math.random() * 0.3], 
         "#1a1a2e", { roughness: 0.8, metalness: 0 })
     ),
     
     /* Urban debris and details */
     ...Array.from({length: 15}, (_, i) => 
       cube(`Debris_${i + 1}`, 
         [-12 + Math.random() * 24, -0.4, -8 + Math.random() * 24], 
         [0.2 + Math.random() * 0.4, 0.1 + Math.random() * 0.2, 0.15 + Math.random() * 0.3], 
         "#1a1a2e", { roughness: 0.9, metalness: 0.1 })
     ),

     /* Buildings */
     ...BUILDINGS_DATA.flatMap((b, i) => {
       const base = cube(`Building ${i + 1}_Base`, b.pos, b.scale, b.color, { 
         roughness: 0.8, 
         metalness: 0.1 
       });
       
       // Add window details for buildings with windows flag
       if (b.windows) {
         const windows = [];
         const floors = Math.floor(b.scale[1] / 3);
         const widthTiles = Math.floor(b.scale[0] / 1.2);
         const depthTiles = Math.floor(b.scale[2] / 1.2);
         
         // Create window grid on all facades
         for (let floor = 0; floor < floors; floor++) {
           const y = -b.scale[1]/2 + 1.5 + floor * 2.5;
           
           // Front facade
           for (let w = 0; w < widthTiles; w++) {
             const x = -b.scale[0]/2 + 0.6 + w * 1.2;
             windows.push(
               emissiveRect(`Building ${i + 1}_Window_Front_${floor}_${w}`, 
                 [x, y, b.scale[2]/2 - 0.01], 
                 [0.8, 1.5, 0.02], 
                 b.color.replace(/^#/, '#') === '#0f3460' ? '#00ffff' : 
                 b.color.replace(/^#/, '#') === '#16213e' ? '#ff00ff' :
                 b.color.replace(/^#/, '#') === '#533483' ? '#ffff00' :
                 b.color.replace(/^#/, '#') === '#112a46' ? '#ff8800' :
                 '#00ffff', 
                 1.5
               )
             );
           }
           
           // Back facade
           for (let w = 0; w < widthTiles; w++) {
             const x = -b.scale[0]/2 + 0.6 + w * 1.2;
             windows.push(
               emissiveRect(`Building ${i + 1}_Window_Back_${floor}_${w}`, 
                 [x, y, -b.scale[2]/2 + 0.01], 
                 [0.8, 1.5, 0.02], 
                 b.color.replace(/^#/, '#') === '#0f3460' ? '#00ffff' : 
                 b.color.replace(/^#/, '#') === '#16213e' ? '#ff00ff' :
                 b.color.replace(/^#/, '#') === '#533483' ? '#ffff00' :
                 b.color.replace(/^#/, '#') === '#112a46' ? '#ff8800' :
                 '#00ffff', 
                 1.5
               )
             );
           }
           
           // Side facades
           for (let d = 0; d < depthTiles; d++) {
             const z = -b.scale[2]/2 + 0.6 + d * 1.2;
             
             // Left side
             windows.push(
               emissiveRect(`Building ${i + 1}_Window_Left_${floor}_${d}`, 
                 [-b.scale[0]/2 + 0.01, y, z], 
                 [0.02, 1.5, 0.8], 
                 b.color.replace(/^#/, '#') === '#0f3460' ? '#00ffff' : 
                 b.color.replace(/^#/, '#') === '#16213e' ? '#ff00ff' :
                 b.color.replace(/^#/, '#') === '#533483' ? '#ffff00' :
                 b.color.replace(/^#/, '#') === '#112a46' ? '#ff8800' :
                 '#00ffff', 
                 1.5
               )
             );
             
             // Right side
             windows.push(
               emissiveRect(`Building ${i + 1}_Window_Right_${floor}_${d}`, 
                 [b.scale[0]/2 - 0.01, y, z], 
                 [0.02, 1.5, 0.8], 
                 b.color.replace(/^#/, '#') === '#0f3460' ? '#00ffff' : 
                 b.color.replace(/^#/, '#') === '#16213e' ? '#ff00ff' :
                 b.color.replace(/^#/, '#') === '#533483' ? '#ffff00' :
                 b.color.replace(/^#/, '#') === '#112a46' ? '#ff8800' :
                 '#00ffff', 
                 1.5
               )
             );
           }
         }
         
         return [base, ...windows];
       }
       
       return [base];
     }),

     /* Neon signs — detailed emissive panels */
     ...NEON_DATA.flatMap((n, i) => [
       // Main neon panel
       cube(`Neon_Panel_${i + 1}_Main`, n.pos, [n.w, 0.3, 0.1], "#000000", {
         emissive: n.color,
         emissiveIntensity: 4,
         roughness: 0.05,
         metalness: 0.2,
       }),
       // Neon border
       cube(`Neon_Panel_${i + 1}_Border`, n.pos, [n.w + 0.1, 0.4, 0.12], "#000000", {
         emissive: n.color,
         emissiveIntensity: 1.5,
         roughness: 0.1,
         metalness: 0.1,
       }),
       // Neon glow plane (behind)
       cube(`Neon_Glow_${i + 1}`, [n.pos[0], n.pos[1], n.pos[2] - 0.06], [n.w + 0.2, 0.35, 0.02], n.color, {
         emissive: n.color,
         emissiveIntensity: 2,
         roughness: 0.1,
         metalness: 0,
         transparent: true,
         opacity: 0.3,
       })
     ]),

     /* Lamp posts */
     ...LAMP_DATA.flatMap(([x, z], i) => [
       cylinder(`Lamp Pole ${i + 1}`, [x, 1.5, z], [0.04, 3.2, 0.04], "#1a1a2e", { metalness: 0.9, roughness: 0.2 }),
       cylinder(`Lamp Arm ${i + 1}`, [x, 3.2, z + 0.5], [0.06, 0.8, 0.06], "#2c2c3c", { metalness: 0.7, roughness: 0.3 }),
       sphere(`Lamp Bulb ${i + 1}`, [x, 3.2, z + 1.5], [0.12, 0.12, 0.12], "#ffdd88", { emissive: "#ffdd88", emissiveIntensity: 2, roughness: 0.1, metalness: 0.1 }),
       light(`Lamp Light ${i + 1}`, [x, 3.2, z + 1.5], "#ffdd88", 0.8, { 
         distance: 8, 
         decay: 2 
       }),
     ]),

     /* Collectibles - detailed data artifacts */
     ...COLLECTIBLE_DATA.map((c, i) => [
       // Core
       sphere(`DataCore_${i + 1}`, c.pos, [0.25, 0.25, 0.25], c.color, {
         emissive: c.color,
         emissiveIntensity: 3,
         roughness: 0.1,
         metalness: 0.9,
         collectible: true,
       }),
       // Outer shell
       sphere(`DataShell_${i + 1}`, c.pos, [0.35, 0.35, 0.35], "#1a1a2e", {
         roughness: 0.3,
         metalness: 0.8,
         collectible: true,
       }),
        // Detail rings
        ...Array.from({length: 3}, (_, ringIndex) => 
          cylinder(`DataRing_${i + 1}_${ringIndex + 1}`, 
            [c.pos[0], c.pos[1] + 0.1 * (ringIndex + 1), c.pos[2]], 
            [0.28, 0.02, 0.28], 
            c.color, 
            {
              emissive: c.color,
              emissiveIntensity: 2,
              roughness: 0.1,
              metalness: 0.9,
              collectible: true,
            }
          )
        )
      ]),

    /* Player start */
    capsule("Player", [0, 0.8, 0], [0.5, 0.7, 0.5], "#4488ff", {
      roughness: 0.5,
      metalness: 0.3,
      player: true,
    }),

     /* Enhanced atmospheric and directional lighting */
     /* Main directional light (moon) */
     light("Directional_Moon", [12, 20, -15], "#6688ff", 0.8, { 
       castShadow: true, 
       shadowBias: -0.0005,
       shadowMapSize: 1024 
     }),
     
     /* Fill light from opposite direction */
     light("Fill_Light", [-15, 12, 20], "#442266", 0.3),
     
     /* Rim/edge light for silhouette */
     light("Rim_Light", [0, 25, 0], "#8800ff", 0.4),
     
     /* Street level ambient lights */
     light("Street_Glow_Center", [0, 2, -10], "#ff8844", 0.6, { distance: 15, decay: 2 }),
     light("Street_Glow_Left", [-8, 2, -10], "#ff0088", 0.4, { distance: 12, decay: 2 }),
     light("Street_Glow_Right", [8, 2, -10], "#00ffff", 0.4, { distance: 12, decay: 2 }),
     
     /* Neon ambient glow from signs */
     ...NEON_DATA.map((n, i) => 
       light(`Neon_Ambient_${i + 1}`, [n.pos[0], n.pos[1] + 0.2, n.pos[2]], n.color, 0.3, { 
         distance: 6, 
         decay: 2 
       })
     ),
     
     /* Additional atmospheric points */
     light("Atmospheric_1", [-12, 8, -5], "#ff00ff", 0.2),
     light("Atmospheric_2", [12, 6, -18], "#00ffff", 0.2),
     light("Atmospheric_3", [-6, 10, 5], "#ff8800", 0.15),
  ],
   environment: {
     background: "#03000d",
     fog: { color: "#05001a", near: 8, far: 28 },
     shadows: true,
     bloom: true,
     bloomIntensity: 0.4,
     bloomThreshold: 0.03,
     ssao: true, // Re-enabled with proper setup
     colorGrading: true,
     chromaticAberration: true,
     volumetricFog: true,
     rain: true,
     wetGround: true,
     flashlight: false,
     flickeringLights: true,
     ambientSound: true,
     vignette: true,
     exposure: 0.9,
     toneMapping: 3, // ACESFilmic
     shadowQuality: "high",
     pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
     qualityPreset: "balanced",
   },
};

export default scene;
