import React from "react";
import { EffectComposer, Bloom, SSAO, BrightnessContrast, HueSaturation, Vignette, Noise, ToneMapping } from "@react-three/postprocessing";
import { useEditorStore } from "@store/editorStore";
import { BlendFunction } from "postprocessing";

export default function Effects() {
  const env = useEditorStore((s) => s.scene.environment);
  if (!env) return null;

  const { bloom, ssao, colorGrading, vignette, bloomIntensity, bloomThreshold } = env;

  return (
    <EffectComposer multisampling={4} autoClear={false}>
      {bloom && (
        <Bloom
          intensity={bloomIntensity ?? 0.5}
          luminanceThreshold={bloomThreshold ?? 0.2}
          luminanceSmoothing={0.08}
          mipmapBlur
        />
      )}

      {ssao && (
        <SSAO
          samples={12}
          radius={0.35}
          intensity={1.5}
          luminanceInfluence={0.4}
          color="rgba(0,0,0,0.8)"
          blendFunction={BlendFunction.MULTIPLY}
        />
      )}

      {colorGrading && (
        <>
          <BrightnessContrast brightness={0} contrast={0.12} />
          <HueSaturation hue={0} saturation={-0.08} />
          <ToneMapping
            blendFunction={BlendFunction.NORMAL}
            opacity={0.8}
          />
        </>
      )}

      {vignette && (
        <Vignette
          offset={0.35}
          darkness={0.6}
          eskil={false}
          blendFunction={BlendFunction.NORMAL}
        />
      )}

      <Noise
        opacity={0.015}
        blendFunction={BlendFunction.SCREEN}
      />
    </EffectComposer>
  );
}
