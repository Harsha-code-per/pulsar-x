/**
 * PULSAR-X: Cinematic Domain
 * Scene 15: DEGRADATION — Covariance Growth under Dead Reckoning.
 */

import type { SceneDefinition } from "./types";

export const scene15Degradation: SceneDefinition = {
  id: 15,
  key: "SCENE_15_DEGRADATION",
  name: "Navigation Degradation",
  duration_s: 8.0,
  description: "With primary beacon lost, covariance uncertainty stretches into an elongated needle along lost axis.",
  phase: "IV_CONVERGENCE",
  visualTheme: "DEGRADED",
  cameraPreset: "UNCERTAINTY_CLOSE",
  shots: [
    {
      id: "s15_shot01",
      name: "Elongated Covariance Growth",
      start_s: 0.0,
      duration_s: 8.0,
      camera: {
        preset: "UNCERTAINTY_CLOSE",
        fovStart: 38,
        fovEnd: 46,
        easing: "linear",
      },
      caption: "NAV STATUS: DEGRADED [SIMULATION_OUTPUT]. Estimated position drift accumulating (+450 m/min).",
      visualEmphasis: "Amber/red uncertainty ellipsoid stretching into an elongated needle along the unconstrained sightline axis.",
      transition: "WHIP_PAN",
    },
  ],
  hud: {
    title: "SCENE 15 / 18",
    subtitle: "UNCONSTRAINED AXIS DRIFT",
    alert: "NAV STATUS: DEGRADED — COVARIANCE GROWTH",
    captions: [
      "NAV STATUS: DEGRADED [SIMULATION_OUTPUT]. Estimated position drift accumulating (+450 m/min).",
      "Remaining 3 beacons insufficient for 4D fix; RK4 dead reckoning propagates state with growing uncertainty [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "NAV STATUS",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "DEGRADED",
      },
      {
        label: "POSITION ERROR",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${(t.positionError_m / 1000).toFixed(2)} km` : "12.80 km"),
      },
      {
        label: "ACTIVE BEACONS",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "3 / 5",
      },
      {
        label: "ESTIMATED DRIFT",
        classification: "SCENARIO_TARGET",
        getValue: () => "+450 m/min",
      },
    ],
  },
  triggers: [
    {
      id: "trig_15_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 8.0,
      description: "Advance to Scene 16 Signal Recovery.",
    },
  ],
};
