/**
 * PULSAR-X: 3D Rendering Domain
 * Centralized Look-Development & Visual Theme Configuration System.
 *
 * Establishes a restrained, serious aerospace & scientific cinema visual language:
 * - Near black / deep navy cosmic voids with cool neutral whites.
 * - Controlled cyan/white for nominal navigation.
 * - Amber for degraded geometry / warning states.
 * - Restrained red for critical alerts / beacon loss.
 * - Physically plausible warm solar tones and cool blue-white/violet pulsar emissions.
 * - Zero neon cyberpunk aesthetics; no decorative noise.
 */

import type { NavigationStatus } from "../../types/navigation";

export type VisualThemeMode = "NOMINAL" | "DEGRADED" | "CRITICAL" | "LOCKED" | "CINEMATIC";

export type PostprocessingPreset = "SCIENTIFIC" | "CINEMATIC" | "MINIMAL";

export type ToneMappingType = "ACESFilmic" | "AgX" | "Linear" | "Reinhard";

export interface VisualThemeConfig {
  readonly mode: VisualThemeMode;
  /** Scene exposure multiplier */
  readonly exposure: number;
  /** Tone mapping algorithm */
  readonly toneMapping: ToneMappingType;
  /** Additive bloom luminance threshold */
  readonly bloomThreshold: number;
  /** Bloom knee smoothing factor */
  readonly bloomSmoothing: number;
  /** Bloom intensity multiplier */
  readonly bloomIntensity: number;
  /** Vignette edge darkness [0, 1] */
  readonly vignetteDarkness: number;
  /** Vignette radial offset [0, 1] */
  readonly vignetteOffset: number;
  /** Film grain noise intensity [0, 1] */
  readonly filmGrainIntensity: number;
  /** Chromatic aberration offset in degraded/critical states */
  readonly chromaticAberration: number;
  /** Contrast adjustment multiplier */
  readonly contrast: number;
  /** Color saturation adjustment multiplier */
  readonly saturation: number;
  /** Earth atmospheric Fresnel rim intensity */
  readonly atmosphericIntensity: number;
  /** Starfield brightness multiplier */
  readonly starBrightness: number;
  /** Pulsar core and synchrotron beam emission intensity */
  readonly pulsarIntensity: number;
  /** Sightline ray and traveling photon packet opacity */
  readonly signalIntensity: number;
  /** Primary HUD telemetry accent color (hex) */
  readonly hudAccentColor: string;
  /** HUD warning alert pulsing intensity [0, 1] */
  readonly hudAlertIntensity: number;
  /** Covariance uncertainty translucent inner shell opacity */
  readonly uncertaintyShellOpacity: number;
  /** Covariance uncertainty outer wireframe cage opacity */
  readonly uncertaintyWireOpacity: number;
}

export const LOOKDEV_THEMES: Record<VisualThemeMode, VisualThemeConfig> = {
  NOMINAL: {
    mode: "NOMINAL",
    exposure: 1.0,
    toneMapping: "ACESFilmic",
    bloomThreshold: 0.55,
    bloomSmoothing: 0.25,
    bloomIntensity: 0.45,
    vignetteDarkness: 0.50,
    vignetteOffset: 0.35,
    filmGrainIntensity: 0.0,
    chromaticAberration: 0.0,
    contrast: 1.0,
    saturation: 1.0,
    atmosphericIntensity: 1.0,
    starBrightness: 1.0,
    pulsarIntensity: 1.0,
    signalIntensity: 0.35,
    hudAccentColor: "#00f5ff", // Controlled cyan
    hudAlertIntensity: 0.0,
    uncertaintyShellOpacity: 0.12,
    uncertaintyWireOpacity: 0.40,
  },

  LOCKED: {
    mode: "LOCKED",
    exposure: 1.05,
    toneMapping: "ACESFilmic",
    bloomThreshold: 0.50,
    bloomSmoothing: 0.25,
    bloomIntensity: 0.50,
    vignetteDarkness: 0.45,
    vignetteOffset: 0.35,
    filmGrainIntensity: 0.0,
    chromaticAberration: 0.0,
    contrast: 1.05,
    saturation: 1.02,
    atmosphericIntensity: 1.0,
    starBrightness: 1.0,
    pulsarIntensity: 1.1,
    signalIntensity: 0.40,
    hudAccentColor: "#00f5ff", // Crisp deep cyan / emerald lock
    hudAlertIntensity: 0.0,
    uncertaintyShellOpacity: 0.15,
    uncertaintyWireOpacity: 0.50,
  },

  DEGRADED: {
    mode: "DEGRADED",
    exposure: 0.95,
    toneMapping: "ACESFilmic",
    bloomThreshold: 0.50,
    bloomSmoothing: 0.30,
    bloomIntensity: 0.60,
    vignetteDarkness: 0.60,
    vignetteOffset: 0.30,
    filmGrainIntensity: 0.015,
    chromaticAberration: 0.003, // Subtle optical tension
    contrast: 1.10,
    saturation: 0.95,
    atmosphericIntensity: 0.9,
    starBrightness: 0.95,
    pulsarIntensity: 0.85,
    signalIntensity: 0.25,
    hudAccentColor: "#ffb703", // Amber warning
    hudAlertIntensity: 0.5,
    uncertaintyShellOpacity: 0.22,
    uncertaintyWireOpacity: 0.65,
  },

  CRITICAL: {
    mode: "CRITICAL",
    exposure: 0.90,
    toneMapping: "ACESFilmic",
    bloomThreshold: 0.45,
    bloomSmoothing: 0.35,
    bloomIntensity: 0.75,
    vignetteDarkness: 0.70,
    vignetteOffset: 0.25,
    filmGrainIntensity: 0.025,
    chromaticAberration: 0.008, // Noticeable lens stress on critical fault
    contrast: 1.15,
    saturation: 0.90,
    atmosphericIntensity: 0.8,
    starBrightness: 0.90,
    pulsarIntensity: 0.70,
    signalIntensity: 0.15,
    hudAccentColor: "#ff3366", // Restrained red alert
    hudAlertIntensity: 1.0,
    uncertaintyShellOpacity: 0.30,
    uncertaintyWireOpacity: 0.85,
  },

  CINEMATIC: {
    mode: "CINEMATIC",
    exposure: 1.10,
    toneMapping: "ACESFilmic",
    bloomThreshold: 0.48,
    bloomSmoothing: 0.28,
    bloomIntensity: 0.65,
    vignetteDarkness: 0.65,
    vignetteOffset: 0.30,
    filmGrainIntensity: 0.020,
    chromaticAberration: 0.001,
    contrast: 1.12,
    saturation: 1.05,
    atmosphericIntensity: 1.2,
    starBrightness: 1.1,
    pulsarIntensity: 1.25,
    signalIntensity: 0.45,
    hudAccentColor: "#00f5ff",
    hudAlertIntensity: 0.0,
    uncertaintyShellOpacity: 0.15,
    uncertaintyWireOpacity: 0.45,
  },
};

/**
 * Modifiers applied by user-selected post-processing presets.
 */
export const POSTPROCESSING_PRESETS: Record<PostprocessingPreset, Partial<VisualThemeConfig>> = {
  SCIENTIFIC: {
    bloomIntensity: 0.35,
    vignetteDarkness: 0.35,
    filmGrainIntensity: 0.0,
    chromaticAberration: 0.0,
  },
  CINEMATIC: {
    bloomIntensity: 0.65,
    vignetteDarkness: 0.60,
    filmGrainIntensity: 0.02,
  },
  MINIMAL: {
    bloomIntensity: 0.0,
    vignetteDarkness: 0.0,
    filmGrainIntensity: 0.0,
    chromaticAberration: 0.0,
  },
};

/**
 * Resolves the complete visual theme combining active mode and optional postprocessing preset.
 */
export function resolveVisualTheme(
  mode: VisualThemeMode,
  preset: PostprocessingPreset = "CINEMATIC"
): VisualThemeConfig {
  const base = LOOKDEV_THEMES[mode] ?? LOOKDEV_THEMES.NOMINAL;
  const modifier = POSTPROCESSING_PRESETS[preset] ?? {};
  return {
    ...base,
    ...modifier,
  };
}

/**
 * Maps raw simulation navigation status into authoritative visual mode.
 */
export function mapNavigationStatusToVisualMode(status: NavigationStatus): VisualThemeMode {
  switch (status) {
    case "LOCKED":
      return "LOCKED";
    case "CONVERGING":
    case "UNINITIALIZED":
      return "NOMINAL";
    case "DEGRADED":
    case "SINGULAR_GEOMETRY":
      return "DEGRADED";
    case "BLACKOUT":
      return "CRITICAL";
    default:
      return "NOMINAL";
  }
}

/**
 * Smooth numerical interpolation between two visual theme configurations.
 */
export function lerpVisualThemes(
  a: VisualThemeConfig,
  b: VisualThemeConfig,
  t: number
): VisualThemeConfig {
  const clampT = Math.max(0.0, Math.min(1.0, t));
  const lerp = (v0: number, v1: number) => v0 + (v1 - v0) * clampT;

  return {
    mode: clampT < 0.5 ? a.mode : b.mode,
    exposure: lerp(a.exposure, b.exposure),
    toneMapping: clampT < 0.5 ? a.toneMapping : b.toneMapping,
    bloomThreshold: lerp(a.bloomThreshold, b.bloomThreshold),
    bloomSmoothing: lerp(a.bloomSmoothing, b.bloomSmoothing),
    bloomIntensity: lerp(a.bloomIntensity, b.bloomIntensity),
    vignetteDarkness: lerp(a.vignetteDarkness, b.vignetteDarkness),
    vignetteOffset: lerp(a.vignetteOffset, b.vignetteOffset),
    filmGrainIntensity: lerp(a.filmGrainIntensity, b.filmGrainIntensity),
    chromaticAberration: lerp(a.chromaticAberration, b.chromaticAberration),
    contrast: lerp(a.contrast, b.contrast),
    saturation: lerp(a.saturation, b.saturation),
    atmosphericIntensity: lerp(a.atmosphericIntensity, b.atmosphericIntensity),
    starBrightness: lerp(a.starBrightness, b.starBrightness),
    pulsarIntensity: lerp(a.pulsarIntensity, b.pulsarIntensity),
    signalIntensity: lerp(a.signalIntensity, b.signalIntensity),
    hudAccentColor: clampT < 0.5 ? a.hudAccentColor : b.hudAccentColor,
    hudAlertIntensity: lerp(a.hudAlertIntensity, b.hudAlertIntensity),
    uncertaintyShellOpacity: lerp(a.uncertaintyShellOpacity, b.uncertaintyShellOpacity),
    uncertaintyWireOpacity: lerp(a.uncertaintyWireOpacity, b.uncertaintyWireOpacity),
  };
}
