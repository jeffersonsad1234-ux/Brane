import React from "react";
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import { useEditorStore } from "@store/editorStore";
import { BlendFunction } from "postprocessing";

export default function Effects() {
  const env = useEditorStore((s) => s.scene.environment);
  if (!env) return null;

  const { bloom, chromaticAberration, vignette, bloomIntensity, bloomThreshold } = env;

  return (
    <EffectComposer multisampling={0}>
      {bloom && (
        <Bloom intensity={bloomIntensity ?? 0.3} luminanceThreshold={bloomThreshold ?? 0.1}
          luminanceSmoothing={0.08} mipmapBlur />
      )}

      {chromaticAberration && (
        <ChromaticAberration offset={[0.002, 0.001]} blendFunction={BlendFunction.NORMAL} />
      )}

      {vignette && (
        <Vignette offset={0.3} darkness={0.5} eskil={false} blendFunction={BlendFunction.NORMAL} />
      )}

      <Noise opacity={0.01} blendFunction={BlendFunction.SCREEN} />
    </EffectComposer>
  );
}
