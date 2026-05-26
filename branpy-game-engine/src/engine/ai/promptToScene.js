import { generateFromPrompt } from "./sceneGenerator";

export function promptToScene(prompt) {
  const scene = generateFromPrompt(prompt);
  if (scene) {
    return {
      success: true,
      scene,
      message: `Generated "${scene.name}" from your prompt.`,
    };
  }
  return {
    success: false,
    scene: null,
    message: `Could not generate scene from: "${prompt}". Try: "horror house", "cyberpunk city", or "racing game".`,
  };
}

export function getSupportedPrompts() {
  return ["horror house", "cyberpunk city", "racing game"];
}
