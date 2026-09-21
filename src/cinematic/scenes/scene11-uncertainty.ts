/**
 * PULSAR-X: Cinematic Domain
 * Scene 11: POSITION UNCERTAINTY — The Massive Error Cloud.
 */

import type { SceneDefinition } from "./types";

export const scene11Uncertainty: SceneDefinition = {
  id: 11,
  key: "SCENE_11_UNCERTAINTY",
  name: "Position Uncertainty Cloud",
  duration_s: 8.0,
  description: "The spacecraft floats inside an expanded 3D covariance uncertainty ellipsoid spanning kilometers.",
  phase: "IV_CONVERGENCE",
  visualTheme: "DEGRADED",
  cameraPreset: "UNCERTAINTY_CLOSE",
  shots: [
    {
      id: "s11_shot01",
      name: "Covariance Ellipsoid Inspection",
      start_s: 0.0,
      duration_s: 8.0,
      camera: {
        preset: "UNCERTAINTY_CLOSE",
        fovStart: 38,
        fovEnd: 44,
        easing: "easeInOutCubic",
      },
      caption: "Unconstrained Drift: 3σ position error ±42.5 km [SIMULATION_OUTPUT]. Covariance expands along unconstrained axes.",
      visualEmphasis: "Amber/red wireframe cage and translucent inner shell enclosing the spacecraft.",
      transition: "FADE",
    },
  ],
  hud: {
    title: "SCENE 11 / 18",
    subtitle: "COVARIANCE UNCERTAINTY INSPECTION",
    captions: [
      "Unconstrained Drift: 3σ position error ±42.5 km [SIMULATION_OUTPUT]. Covariance expands along unconstrained axes.",
      "Dead reckoning without measurement updates leads to unbounded positional dispersion [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "ESTIMATOR STATE",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "CONVERGING (UNCONSTRAINED)",
      },
      {
        label: "3σ POSITION ERROR",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `±${(t.positionError_m / 1000).toFixed(1)} km` : "±42.5 km"),
      },
      {
        label: "NAV SOLVER",
        classification: "REAL_INPUT",
        getValue: () => "BATCH WLS + RK4 DR",
      },
    ],
  },
  triggers: [
    {
      id: "trig_11_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 8.0,
      description: "Advance to Scene 12 Navigation Convergence.",
    },
  ],
};
