import React from "react";
import { EffectComposer, Bloom, SSAO, BrightnessContrast, HueSaturation, Vignette, Noise, ToneMapping, ChromaticAberration } from "@react-three/postprocessing";
import { useEditorStore } from "@store/editorStore";
import { BlendFunction } from "postprocessing";

export default function Effects() {
  const env = useEditorStore((s) => s.scene.environment);
  if (!env) return null;

  const { bloom, ssao, colorGrading, vignette, chromaticAberration, bloomIntensity, bloomThreshold } = env;

  return (
    <EffectComposer multisampling={4} autoClear={false}>
      {bloom && (
        <Bloom intensity={bloomIntensity ?? 0.3} luminanceThreshold={bloomThreshold ?? 0.1}
          luminanceSmoothing={0.08} mipmapBlur />
      )}

      {ssao && (
        <SSAO samples={12} radius={0.35} intensity={1.5} luminanceInfluence={0.4}
          color="rgba(0,0,0,0.8)" blendFunction={BlendFunction.MULTIPLY} />
      )}

      {colorGrading && (
        <>
          <BrightnessContrast brightness={0} contrast={0.1} />
          <HueSaturation hue={0} saturation={-0.05} />
          <ToneMapping blendFunction={BlendFunction.NORMAL} opacity={0.6} />
        </>
      )}

      {chromaticAberration && (
        <ChromaticAberration offset={[0.003, 0.001]} radialModulation={false} blendFunction={BlendFunction.NORMAL} />
      )}

      {vignette && (
        <Vignette offset={0.3} darkness={0.5} eskil={false} blendFunction={BlendFunction.NORMAL} />
      )}

      <Noise opacity={0.012} blendFunction={BlendFunction.SCREEN} />
    </EffectComposer>
  );
}
