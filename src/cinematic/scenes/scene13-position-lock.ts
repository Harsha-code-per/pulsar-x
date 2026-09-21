/**
 * PULSAR-X: Cinematic Domain
 * Scene 13: POSITION LOCK — Triumph of Autonomous Celestial Navigation.
 */

import type { SceneDefinition } from "./types";

export const scene13PositionLock: SceneDefinition = {
  id: 13,
  key: "SCENE_13_POSITION_LOCK",
  name: "Autonomous Position Lock",
  duration_s: 9.0,
  description: "Spacecraft confirms autonomous celestial position lock; triumph of deep-space XNAV.",
  phase: "IV_CONVERGENCE",
  visualTheme: "LOCKED",
  cameraPreset: "SPACECRAFT_HERO",
  shots: [
    {
      id: "s13_shot01",
      name: "Hero Spacecraft Orbit",
      start_s: 0.0,
      duration_s: 9.0,
      camera: {
        preset: "SPACECRAFT_HERO",
        fovStart: 38,
        fovEnd: 42,
        easing: "linear",
      },
      caption: "Autonomous Celestial Lock Confirmed [SIMULATION_OUTPUT]. Position error <= 1.8 km [SCENARIO_TARGET].",
      visualEmphasis: "Hero 3/4 angle catching crisp sunlight reflecting off gold MLI and solar arrays; solid cyan/green status.",
      transition: "FADE",
    },
  ],
  hud: {
    title: "SCENE 13 / 18",
    subtitle: "AUTONOMOUS CELESTIAL POSITION LOCK",
    alert: "AUTONOMOUS CELESTIAL POSITION LOCK ACQUIRED",
    captions: [
      "Autonomous Celestial Lock Confirmed [SIMULATION_OUTPUT]. Position error <= 1.8 km [SCENARIO_TARGET].",
      "Solar System Barycentric coordinates resolved without any terrestrial telemetry or Earth intervention [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "AUTONOMOUS LOCK",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "CONFIRMED (LOCKED)",
      },
      {
        label: "POSITION ERROR",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${(t.positionError_m / 1000).toFixed(2)} km` : "1.42 km"),
      },
      {
        label: "VELOCITY ACCURACY",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `±${t.velocityError_mps.toFixed(3)} m/s` : "±0.040 m/s"),
      },
      {
        label: "CLOCK OFFSET",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${(t.clockBias_s * 1e9).toFixed(1)} ns` : "-12.4 ns"),
      },
    ],
  },
  triggers: [
    {
      id: "trig_13_locked",
      type: "EVENT_TRIGGER",
      eventType: "NAVIGATION_LOCKED",
      priority: 100,
      description: "Trigger celebratory lock sequence when NAVIGATION_LOCKED event fires.",
    },
    {
      id: "trig_13_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 9.0,
      description: "Advance to Scene 14 Signal Failure.",
    },
  ],
};
