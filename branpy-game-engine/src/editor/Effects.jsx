import React from "react";
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration, SSAO } from "@react-three/postprocessing";
import { useEditorStore } from "@store/editorStore";
import { BlendFunction } from "postprocessing";

export default function Effects() {
  const env = useEditorStore((s) => s.scene.environment);
  if (!env) return null;

  const { 
    bloom, 
    chromaticAberration, 
    vignette, 
    ssao, 
    colorGrading,
    bloomIntensity, 
    bloomThreshold 
  } = env;

  return (
    <EffectComposer multisampling={0}>
       {ssao && (
         <SSAO 
           scale={1.6} 
           intensity={0.35} 
           radialBlurIterations={4} 
           radius={0.45} 
           blur
           blurRadius={0.75}
           blendFunction={BlendFunction.MULTIPLY}
           kernelSize={16}
           minDistance={0.005}
           maxDistance={0.1}
         />
       )}

      {bloom && (
        <Bloom intensity={bloomIntensity ?? 0.4} luminanceThreshold={bloomThreshold ?? 0.03}
          luminanceSmoothing={0.08} mipmapBlur />
      )}

      {chromaticAberration && (
        <ChromaticAberration offset={[0.002, 0.001]} blendFunction={BlendFunction.NORMAL} />
      )}

      {/* ColorGrading effect would go here if available in postprocessing */}
      {/* For now, we rely on the renderer's tone mapping and environment settings */}

      {vignette && (
        <Vignette offset={0.3} darkness={0.4} eskil={false} blendFunction={BlendFunction.NORMAL} />
      )}

      <Noise opacity={0.008} blendFunction={BlendFunction.SCREEN} />
    </EffectComposer>
  );
}
