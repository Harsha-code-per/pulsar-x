/**
 * PULSAR-X: Cinematic Domain
 * Scene 12: CONVERGENCE — Relativistic TOA Corrections & WLS Inversion.
 */

import type { SceneDefinition } from "./types";

export const scene12Convergence: SceneDefinition = {
  id: 12,
  key: "SCENE_12_CONVERGENCE",
  name: "Navigation Solution Convergence",
  duration_s: 9.0,
  description: "Relativistic Rømer, Einstein, and Shapiro corrections applied; WLS solver collapses error ellipsoid.",
  phase: "IV_CONVERGENCE",
  visualTheme: "NOMINAL",
  cameraPreset: "UNCERTAINTY_CLOSE",
  shots: [
    {
      id: "s12_shot01",
      name: "Ellipsoid Collapse",
      start_s: 0.0,
      duration_s: 9.0,
      camera: {
        preset: "UNCERTAINTY_CLOSE",
        fovStart: 44,
        fovEnd: 36,
        easing: "easeInOutCubic",
      },
      caption: "Convergence in Progress: Relativistic Rømer delay ~492 s applied [SIMULATION_OUTPUT]. Normal matrix inversion converges.",
      visualEmphasis: "Covariance uncertainty ellipsoid shrinks inward toward probe hull as observations accumulate.",
      transition: "DISSOLVE",
    },
  ],
  hud: {
    title: "SCENE 12 / 18",
    subtitle: "ITERATIVE BATCH WLS CONVERGENCE",
    captions: [
      "Convergence in Progress: Relativistic Rømer delay ~492 s applied [SIMULATION_OUTPUT]. Normal matrix inversion converges.",
      "Iterative Batch Weighted Least Squares resolves position and receiver clock bias simultaneously [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "POSITION ERROR",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${(t.positionError_m / 1000).toFixed(2)} km` : "2.40 km"),
      },
      {
        label: "RØMER DELAY",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "492.128 s",
      },
      {
        label: "SOLVER ITERATIONS",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${t.solverStatus.iterations} iters` : "3 iters"),
      },
      {
        label: "NAV STATUS",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? t.navigationStatus : "CONVERGING"),
      },
    ],
  },
  triggers: [
    {
      id: "trig_12_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 9.0,
      description: "Advance to Scene 13 Position Lock.",
    },
  ],
};
