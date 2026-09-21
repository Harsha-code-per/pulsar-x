/**
 * PULSAR-X: 3D Rendering Domain
 * Centralized Render Quality Configurations & Feature Tiers.
 */

export type RenderQualityTier = "LOW" | "MEDIUM" | "HIGH" | "CINEMATIC";

export interface RenderQualitySettings {
  readonly tier: RenderQualityTier;
  /** Total procedural stars generated in the skybox starfield */
  readonly starCount: number;
  /** Max device pixel ratio clamp */
  readonly maxDpr: number;
  /** Post-processing bloom intensity */
  readonly bloomEnabled: boolean;
  readonly bloomIntensity: number;
  /** Procedural Earth atmospheric sphere segment resolution */
  readonly sphereSegments: number;
  /** Whether pulsar volumetric emission cones are enabled */
  readonly pulsarBeamsEnabled: boolean;
  /** Beam radial segment complexity */
  readonly pulsarBeamSegments: number;
  /** Film grain effect enabled */
  readonly filmGrainEnabled: boolean;
  readonly filmGrainIntensity: number;
  /** Vignette effect enabled */
  readonly vignetteEnabled: boolean;
  /** Antialiasing enabled */
  readonly antialias: boolean;
}

export const QUALITY_TIERS: Record<RenderQualityTier, RenderQualitySettings> = {
  LOW: {
    tier: "LOW",
    starCount: 6000,
    maxDpr: 1.0,
    bloomEnabled: false,
    bloomIntensity: 0.0,
    sphereSegments: 32,
    pulsarBeamsEnabled: false,
    pulsarBeamSegments: 8,
    filmGrainEnabled: false,
    filmGrainIntensity: 0.0,
    vignetteEnabled: true,
    antialias: false,
  },
  MEDIUM: {
    tier: "MEDIUM",
    starCount: 14000,
    maxDpr: 1.5,
    bloomEnabled: true,
    bloomIntensity: 0.5,
    sphereSegments: 48,
    pulsarBeamsEnabled: true,
    pulsarBeamSegments: 12,
    filmGrainEnabled: false,
    filmGrainIntensity: 0.0,
    vignetteEnabled: true,
    antialias: true,
  },
  HIGH: {
    tier: "HIGH",
    starCount: 25000,
    maxDpr: 2.0,
    bloomEnabled: true,
    bloomIntensity: 0.8,
    sphereSegments: 64,
    pulsarBeamsEnabled: true,
    pulsarBeamSegments: 16,
    filmGrainEnabled: true,
    filmGrainIntensity: 0.03,
    vignetteEnabled: true,
    antialias: true,
  },
  CINEMATIC: {
    tier: "CINEMATIC",
    starCount: 35000,
    maxDpr: 2.0,
    bloomEnabled: true,
    bloomIntensity: 1.1,
    sphereSegments: 96,
    pulsarBeamsEnabled: true,
    pulsarBeamSegments: 24,
    filmGrainEnabled: true,
    filmGrainIntensity: 0.05,
    vignetteEnabled: true,
    antialias: true,
  },
};

export function getQualitySettings(tier: RenderQualityTier): RenderQualitySettings {
  return QUALITY_TIERS[tier] ?? QUALITY_TIERS.HIGH;
}
