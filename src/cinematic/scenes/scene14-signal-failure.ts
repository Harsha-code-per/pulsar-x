/**
 * PULSAR-X: Cinematic Domain
 * Scene 14: SIGNAL FAILURE — Solar Flare & Primary Beacon Occultation.
 */

import type { SceneDefinition } from "./types";

export const scene14SignalFailure: SceneDefinition = {
  id: 14,
  key: "SCENE_14_SIGNAL_FAILURE",
  name: "Solar Interference & Beacon Loss",
  duration_s: 8.0,
  description: "Coronal mass ejection and solar glare along line of sight blinds primary timing beacon PSR B1937+21.",
  phase: "IV_CONVERGENCE",
  visualTheme: "CRITICAL",
  cameraPreset: "SOLAR_INTERFERENCE",
  shots: [
    {
      id: "s14_shot01",
      name: "Solar Glare Blinding",
      start_s: 0.0,
      duration_s: 8.0,
      camera: {
        preset: "SOLAR_INTERFERENCE",
        fovStart: 46,
        fovEnd: 52,
        easing: "easeOutQuad",
      },
      caption: "WARNING: Solar Interference Detected [SCENARIO_TARGET]. Primary beacon PSR B1937+21 occulted; SNR drops to 0 dB.",
      visualEmphasis: "Intense solar glare silhouette; primary sightline ray turns red and shatters.",
      transition: "SIGNAL_GLITCH",
    },
  ],
  hud: {
    title: "SCENE 14 / 18",
    subtitle: "BEACON OCCULTATION ANOMALY",
    alert: "WARNING: SOLAR OCCULTATION — PRIMARY BEACON LOST",
    captions: [
      "WARNING: Solar Interference Detected [SCENARIO_TARGET]. Primary beacon PSR B1937+21 occulted; SNR drops to 0 dB.",
      "Active beacons drop 4 -> 3 [SIMULATION_OUTPUT]. GDOP degrades from 2.1 to 18.4 [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "SOLAR X-RAY FLUX",
        classification: "SCENARIO_TARGET",
        getValue: () => "1.0e4x SATURATION",
      },
      {
        label: "PRIMARY BEACON SNR",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "0.0 dB (BLINDED)",
      },
      {
        label: "GEOMETRY GDOP",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? t.gdop.toFixed(1) : "18.4"),
      },
    ],
  },
  simulationActions: async (ctx) => {
    if (ctx.client) {
      await ctx.client.injectFault({
        type: "PULSAR_DROPOUT",
        pulsarId: "PSR_B1937+21",
      });
    }
  },
  triggers: [
    {
      id: "trig_14_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 8.0,
      description: "Advance to Scene 15 Navigation Degradation.",
    },
  ],
};
