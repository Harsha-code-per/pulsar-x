/**
 * PULSAR-X: Store Domain
 * 3D Viewport, Camera Modes, Quality Settings, and Visual Feature Toggles.
 */

import { create } from "zustand";
import type { RenderQualityTier } from "../rendering/config/quality";
import type { VisualThemeMode, PostprocessingPreset } from "../rendering/config/lookdev";

export type CameraMode =
  | "FREE"
  | "SPACECRAFT_FOLLOW"
  | "PULSAR_FOCUS"
  | "SYSTEM_OVERVIEW"
  | "GEOMETRY_OVERVIEW";

export type UncertaintyMode = "NONE" | "1SIGMA" | "2SIGMA" | "3SIGMA";

export type ErrorMagnification = 1 | 10 | 100 | 1000;

export interface RenderStats {
  readonly fps: number;
  readonly drawCalls: number;
  readonly triangles: number;
}

interface VisualStoreState {
  qualityTier: RenderQualityTier;
  visualThemeMode: VisualThemeMode;
  postprocessingPreset: PostprocessingPreset;
  cameraMode: CameraMode;
  activeFocusPulsarId: string | null;
  uncertaintyMode: UncertaintyMode;
  errorMagnification: ErrorMagnification;
  showReferenceGrid: boolean;
  showSightlines: boolean;
  showTrajectories: boolean;
  showDeveloperOverlay: boolean;
  prefersReducedMotion: boolean;
  renderStats: RenderStats;

  // Actions
  setQualityTier: (tier: RenderQualityTier) => void;
  setVisualThemeMode: (mode: VisualThemeMode) => void;
  setPostprocessingPreset: (preset: PostprocessingPreset) => void;
  setCameraMode: (mode: CameraMode) => void;
  setActiveFocusPulsarId: (id: string | null) => void;
  setUncertaintyMode: (mode: UncertaintyMode) => void;
  setErrorMagnification: (mag: ErrorMagnification) => void;
  toggleReferenceGrid: () => void;
  toggleSightlines: () => void;
  toggleTrajectories: () => void;
  toggleDeveloperOverlay: () => void;
  setPrefersReducedMotion: (reduced: boolean) => void;
  setRenderStats: (stats: RenderStats) => void;
}

export const useVisualStore = create<VisualStoreState>((set) => ({
  qualityTier: "HIGH",
  visualThemeMode: "NOMINAL",
  postprocessingPreset: "CINEMATIC",
  cameraMode: "FREE",
  activeFocusPulsarId: null,
  uncertaintyMode: "3SIGMA",
  errorMagnification: 100, // Default 100x magnification so errors are perceptible on astronomical scales
  showReferenceGrid: false,
  showSightlines: true,
  showTrajectories: true,
  showDeveloperOverlay: false,
  prefersReducedMotion: false,
  renderStats: { fps: 60, drawCalls: 0, triangles: 0 },

  setQualityTier: (tier) => set({ qualityTier: tier }),
  setVisualThemeMode: (mode) => set({ visualThemeMode: mode }),
  setPostprocessingPreset: (preset) => set({ postprocessingPreset: preset }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setActiveFocusPulsarId: (id) => set({ activeFocusPulsarId: id }),
  setUncertaintyMode: (mode) => set({ uncertaintyMode: mode }),
  setErrorMagnification: (mag) => set({ errorMagnification: mag }),
  toggleReferenceGrid: () => set((s) => ({ showReferenceGrid: !s.showReferenceGrid })),
  toggleSightlines: () => set((s) => ({ showSightlines: !s.showSightlines })),
  toggleTrajectories: () => set((s) => ({ showTrajectories: !s.showTrajectories })),
  toggleDeveloperOverlay: () => set((s) => ({ showDeveloperOverlay: !s.showDeveloperOverlay })),
  setPrefersReducedMotion: (reduced) => set({ prefersReducedMotion: reduced }),
  setRenderStats: (stats) => set({ renderStats: stats }),
}));
