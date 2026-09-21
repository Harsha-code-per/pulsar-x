"use client";

/**
 * PULSAR-X: 3D Rendering Domain
 * Post-Processing Pipeline: Tone Mapping, Selective Bloom, Vignette, and Subtle Film Grain.
 */

import React, { useMemo } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useVisualStore } from "../../store/visual-store";
import { getQualitySettings } from "../config/quality";
import { resolveVisualTheme } from "../config/lookdev";

export function EffectsSystem(): React.JSX.Element {
  const qualityTier = useVisualStore((s) => s.qualityTier);
  const visualThemeMode = useVisualStore((s) => s.visualThemeMode);
  const postprocessingPreset = useVisualStore((s) => s.postprocessingPreset);

  const settings = getQualitySettings(qualityTier);
  const theme = resolveVisualTheme(visualThemeMode, postprocessingPreset);

  const caOffset = useMemo(
    () => new THREE.Vector2(theme.chromaticAberration, theme.chromaticAberration),
    [theme.chromaticAberration]
  );

  // In LOW tier or MINIMAL preset, post-processing is completely disabled for performance
  if (qualityTier === "LOW" || postprocessingPreset === "MINIMAL" || !settings.bloomEnabled) {
    return <></>;
  }

  // Calculate scaled bloom intensity based on both theme and hardware quality settings
  const effectiveBloomIntensity = theme.bloomIntensity * (settings.bloomIntensity / 0.5);

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* Selective Bloom for pulsar cores, synchrotron jets, and solar corona */}
      {effectiveBloomIntensity > 0.01 && (
        <Bloom
          luminanceThreshold={theme.bloomThreshold}
          luminanceSmoothing={theme.bloomSmoothing}
          intensity={effectiveBloomIntensity}
          blendFunction={BlendFunction.ADD}
        />
      )}

      {/* Subtle Optical Vignette */}
      {settings.vignetteEnabled && theme.vignetteDarkness > 0.05 && (
        <Vignette
          offset={theme.vignetteOffset}
          darkness={theme.vignetteDarkness}
          blendFunction={BlendFunction.NORMAL}
        />
      )}

      {/* Optical Chromatic Aberration in degraded/critical fault conditions */}
      {settings.vignetteEnabled && theme.chromaticAberration > 0.0005 && (
        <ChromaticAberration
          offset={caOffset}
          radialModulation={true}
          modulationOffset={0.15}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
    </EffectComposer>
  );
}
