"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Post-Processing Pipeline: Tone Mapping, Selective Bloom, Vignette, and Subtle Film Grain.
 */

import React from "react";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useVisualStore } from "../../store/visual-store";
import { getQualitySettings } from "../config/quality";

export function EffectsSystem(): React.JSX.Element {
  const qualityTier = useVisualStore((s) => s.qualityTier);
  const settings = getQualitySettings(qualityTier);

  // In LOW tier, post-processing is completely disabled for low-end devices
  if (qualityTier === "LOW" || !settings.bloomEnabled) {
    return <></>;
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* Selective Bloom for pulsar cores, synchrotron jets, and sun corona */}
      <Bloom
        luminanceThreshold={0.5}
        luminanceSmoothing={0.2}
        intensity={settings.bloomIntensity}
        blendFunction={BlendFunction.ADD}
      />

      {/* Subtle Cinematic Vignette */}
      {settings.vignetteEnabled && (
        <Vignette
          offset={0.3}
          darkness={0.65}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
    </EffectComposer>
  );
}
