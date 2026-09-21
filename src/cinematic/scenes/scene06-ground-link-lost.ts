/**
 * PULSAR-X: Cinematic Domain
 * Scene 06: GROUND LINK LOST — Total Terrestrial Blackout.
 */

import type { SceneDefinition } from "./types";

export const scene06GroundLinkLost: SceneDefinition = {
  id: 6,
  key: "SCENE_06_GROUND_LINK_LOST",
  name: "Ground Link Blackout",
  duration_s: 8.0,
  description: "Deep Space Network uplink drops to 0 bps; spacecraft switches to 100% autonomous navigation.",
  phase: "II_ISOLATION",
  visualTheme: "DEGRADED",
  cameraPreset: "SPACECRAFT_HERO",
  shots: [
    {
      id: "s06_shot01",
      name: "High-Gain Antenna Slew",
      start_s: 0.0,
      duration_s: 8.0,
      camera: {
        preset: "SPACECRAFT_HERO",
        fovStart: 38,
        fovEnd: 42,
        easing: "easeInOutCubic",
      },
      caption: "DSN X-band Uplink: 0.0 bps (BLACKOUT) [SCENARIO_TARGET]. One-way light time > 12 minutes [SIMULATION_OUTPUT].",
      visualEmphasis: "High-gain parabolic dish slewing into empty space searching for the terrestrial carrier.",
      transition: "FADE",
    },
  ],
  hud: {
    title: "SCENE 06 / 18",
    subtitle: "DEEP SPACE COMMUNICATIONS BLACKOUT",
    alert: "COMM LINK STATUS: BLACKOUT",
    captions: [
      "DSN X-band Uplink: 0.0 bps (BLACKOUT) [SCENARIO_TARGET]. One-way light time > 12 minutes [SIMULATION_OUTPUT].",
      "External guidance unavailable. Autonomous navigation suite engaged [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "DSN UPLINK RATE",
        classification: "SCENARIO_TARGET",
        getValue: () => "0.0 bps (LOST)",
      },
      {
        label: "ONE-WAY LIGHT TIME",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "> 12.4 min",
      },
      {
        label: "GUIDANCE MODE",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "AUTONOMOUS REQUIRED",
      },
    ],
  },
  triggers: [
    {
      id: "trig_06_ground_lost",
      type: "EVENT_TRIGGER",
      eventType: "GROUND_LINK_LOST",
      priority: 100,
      description: "Trigger autonomous suite switch upon ground link loss.",
    },
    {
      id: "trig_06_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 8.0,
      description: "Advance to Scene 07 Search.",
    },
  ],
};
