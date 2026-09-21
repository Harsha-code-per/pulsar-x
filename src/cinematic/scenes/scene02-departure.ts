/**
 * PULSAR-X: Cinematic Domain
 * Scene 02: DEPARTURE — Translunar / Interplanetary Injection.
 */

import type { SceneDefinition } from "./types";

export const scene02Departure: SceneDefinition = {
  id: 2,
  key: "SCENE_02_DEPARTURE",
  name: "Translunar Injection Burn",
  duration_s: 8.0,
  description: "Main engine ignition and hyperbolic escape burn breaking free of Earth orbit.",
  phase: "I_TERRESTRIAL",
  visualTheme: "NOMINAL",
  cameraPreset: "EARTH_DEPARTURE",
  shots: [
    {
      id: "s02_shot01",
      name: "Chase Propulsion Bell",
      start_s: 0.0,
      duration_s: 8.0,
      camera: {
        preset: "EARTH_DEPARTURE",
        fovStart: 50,
        fovEnd: 60,
        easing: "easeOutQuad",
      },
      caption: "Translunar Injection: ΔV +3,150 m/s [SCENARIO_TARGET]. Entering hyperbolic escape trajectory.",
      visualEmphasis: "Chase camera behind main thruster plume pulling back as acceleration pushes probe forward.",
      transition: "WHIP_PAN",
    },
  ],
  hud: {
    title: "SCENE 02 / 18",
    subtitle: "ESCAPE TRAJECTORY INJECTION",
    captions: [
      "Translunar Injection: ΔV +3,150 m/s [SCENARIO_TARGET]. Entering hyperbolic escape trajectory.",
      "G-load: 1.8 G [SIMULATION_OUTPUT]. Earth terminator falling away into the cosmic dark.",
    ],
    badges: [
      {
        label: "ESCAPE VELOCITY",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${(Math.hypot(t.spacecraftVelocity_mps.x, t.spacecraftVelocity_mps.z) / 1000).toFixed(2)} km/s` : "10.82 km/s"),
      },
      {
        label: "EARTH RANGE",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${(t.positionError_m / 1000 + 12000).toFixed(0)} km` : "12,400 km"),
      },
      {
        label: "TRAJECTORY ENERGY",
        classification: "SCENARIO_TARGET",
        getValue: () => "HYPERBOLIC (E > 0)",
      },
    ],
  },
  triggers: [
    {
      id: "trig_02_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 8.0,
      description: "Advance to Scene 03 Earth Recedes upon shot completion.",
    },
  ],
};
