# BRANPY Game Engine — Documentation

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Editor    │────▶│  Engine Core │────▶│   Runtime  │
│ (React UI)  │     │ (Scene/Data) │     │ (Play/Phys)│
└──────┬──────┘     └──────┬───────┘     └─────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                  Three.js / R3F                       │
└─────────────────────────────────────────────────────┘
```

## State Flow

```
useEditorStore (Zustand)
  ├── scene: { objects[], environment }
  ├── selectedId: string | null
  ├── mode: "edit" | "play"
  ├── addObject(type) → id
  ├── removeObject(id)
  ├── updateObject(id, props)
  ├── exportScene() → JSON download
  └── importScene(json) → boolean
```

## AI Integration

The `engine/ai/` directory is pre-structured for future AI-powered scene generation:

- **sceneGenerator.js** — Contains preset themes (horror, cyberpunk, racing). Extend with LLM API calls.
- **promptToScene.js** — Parser that maps natural language → scene objects. Mock returns presets.

To connect to an LLM:
```js
// sceneGenerator.js
export async function generateFromPrompt(prompt) {
  const response = await fetch("/api/generate-scene", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
  return response.json();
}
```

## Export System

### Scene JSON
Full scene state serialized as JSON. Contains all objects, transforms, materials, and environment settings.

### HTML Build
Standalone `.html` file with:
- Three.js loaded from CDN (importmap)
- OrbitControls
- All scene objects rendered
- No build tools required

## Performance Notes

- DPR limited to 2 for mobile optimization
- Shadow map size: 1024
- MeshStandardMaterial with low complexity
- Fog for distance culling
- Lazy loading via React Suspense ready

## Adding New Object Types

In `editorStore.js`, add to `addObject()`:
```js
if (type === "custom") {
  // define default props
}
```

In `Viewport.jsx`, add the geometry:
```jsx
{obj.type === "custom" && <customGeometry args={...} />}
```
