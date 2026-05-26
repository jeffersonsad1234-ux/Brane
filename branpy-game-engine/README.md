# BRANPY Game Engine

A lightweight, browser-based 3D game engine built with React, Three.js, and React Three Fiber.

## Quick Start

```bash
npm install
npm run dev      # Open http://localhost:5173
npm run build    # Production build → dist/
```

## Features

### 3D Editor
- Real-time viewport with OrbitControls
- Add/remove objects (cube, sphere, plane, cylinder)
- Add lights and cameras
- Move/rotate/scale with transform controls
- Object list with visibility toggle
- Properties panel with numeric inputs
- Color picker per object

### Scene Management
- Save scene as JSON (`.branpy-scene.json`)
- Import scene from JSON
- Reset to default scene
- Auto-generated IDs

### Play Mode
- Press **Play** to enter first-person preview
- WASD movement, mouse look, space to jump
- Exit with Esc

### Export
- **Export JSON** — download the scene file
- **Download Build** — standalone HTML file with embedded Three.js viewer
- Shareable, no build tools needed

### AI Scene Generation (Mock)
Prompt engine pre-structured for:
- `"horror house"` — dark room with table, vase, flickering light
- `"cyberpunk city"` — neon buildings and colored lights
- `"racing game"` — track with barriers

## Project Structure

```
branpy-game-engine/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── src/
│   ├── main.jsx          # React entry
│   ├── App.jsx           # Root (Editor/Play mode)
│   ├── index.css         # Tailwind + globals
│   ├── store/
│   │   └── editorStore.js   # Zustand state
│   ├── editor/
│   │   ├── Editor.jsx       # Main layout
│   │   ├── Viewport.jsx     # R3F Canvas + objects
│   │   ├── SidePanel.jsx    # Object list / Properties
│   │   ├── ObjectList.jsx   # Scene hierarchy
│   │   ├── Properties.jsx   # Transform controls
│   │   └── Toolbar.jsx      # Top toolbar + file menu
│   ├── engine/
│   │   ├── core/
│   │   │   └── serialize.js     # JSON/GLTF serialization
│   │   ├── ai/
│   │   │   ├── sceneGenerator.js  # Theme presets
│   │   │   └── promptToScene.js   # Prompt parser
│   │   └── export/
│   │       └── sceneExporter.js   # JSON + HTML build
│   ├── runtime/
│   │   ├── GameView.jsx
│   │   ├── Player.jsx          # FPS controller
│   │   └── PhysicsWorld.jsx    # Rapier physics
│   └── components/
│       ├── FileMenu.jsx
│       └── LoadingScreen.jsx
├── assets/demo/               # Demo scene files
├── docs/                      # Documentation
└── public/                    # Static files
```

## How to Create a Scene

1. Click **⬡** (cube), **⬤** (sphere), **▭** (plane), or **⬢** (cylinder) in the toolbar
2. Select an object in the viewport or from the Objects panel
3. Edit position, rotation, scale, and color in Properties
4. Add **☀** lights for illumination
5. Click **Export JSON** to save

## How to Export

**JSON Export:** File → Export JSON → downloads `.branpy-scene.json`

**HTML Build:** File → Download Build → generates a standalone HTML file with:
- Full Three.js viewer
- OrbitControls for navigation
- All objects, lights, and materials preserved
- Responsive design

## Next Steps

- [ ] Full Rapier physics integration in editor
- [ ] GLTF/GLB model import
- [ ] Texture import and PBR materials
- [ ] Animation timeline
- [ ] Audio engine
- [ ] AI prompt → full scene generation
- [ ] Mobile build optimization
- [ ] Multiplayer support
- [ ] Asset marketplace

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| Three.js | r170 | 3D rendering |
| R3F | 8 | React renderer for Three.js |
| Drei | 9 | R3F helpers |
| Zustand | 4 | State management |
| Rapier | 1 | Physics engine |
| Vite | 5 | Build tool |
| Tailwind | 3 | Styling |
