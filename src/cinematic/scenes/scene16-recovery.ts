/**
 * PULSAR-X: Cinematic Domain
 * Scene 16: RECOVERY — Autonomous Slew & Backup Pulsar Lock.
 */

import type { SceneDefinition } from "./types";

export const scene16Recovery: SceneDefinition = {
  id: 16,
  key: "SCENE_16_RECOVERY",
  name: "Autonomous Signal Recovery",
  duration_s: 9.0,
  description: "Autonomous guidance computer slews to acquire backup millisecond pulsar, restoring non-coplanar lock.",
  phase: "IV_CONVERGENCE",
  visualTheme: "NOMINAL",
  cameraPreset: "NETWORK_OVERVIEW",
  shots: [
    {
      id: "s16_shot01",
      name: "Backup Pulsar Lock",
      start_s: 0.0,
      duration_s: 9.0,
      camera: {
        preset: "NETWORK_OVERVIEW",
        fovStart: 48,
        fovEnd: 52,
        easing: "easeInOutCubic",
      },
      caption: "Backup Beacon Acquired: PSR J0218+4232 (ν = 430.46 Hz) [REAL_INPUT]. Geometric singularity resolved; GDOP ~ 1.95.",
      visualEmphasis: "Clean purple-violet sightline ray pierces the cosmic dark; covariance volume collapses back down.",
      transition: "DISSOLVE",
    },
  ],
  hud: {
    title: "SCENE 16 / 18",
    subtitle: "AUTONOMOUS RE-CONVERGENCE",
    alert: "BACKUP BEACON LOCKED — RE-CONVERGENCE COMPLETE",
    captions: [
      "Backup Beacon Acquired: PSR J0218+4232 (ν = 430.46 Hz) [REAL_INPUT]. Geometric singularity resolved; GDOP ~ 1.95.",
      "Aerospace resilience: autonomous constellation handover re-establishes full 4D state observability [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "BACKUP BEACON",
        classification: "REAL_INPUT",
        getValue: () => "PSR J0218+4232",
      },
      {
        label: "RESTORED GDOP",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "1.95",
      },
      {
        label: "COVARIANCE VOLUME",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "< 2.0 km³",
      },
    ],
  },
  simulationActions: async (ctx) => {
    if (ctx.client) {
      await ctx.client.injectFault({
        type: "CLEAR_FAULT",
      });
    }
  },
  triggers: [
    {
      id: "trig_16_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 9.0,
      description: "Advance to Scene 17 Destination.",
    },
  ],
};
