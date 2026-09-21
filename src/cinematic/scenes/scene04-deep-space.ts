/**
 * PULSAR-X: Cinematic Domain
 * Scene 04: DEEP SPACE — Interplanetary Medium & Silence.
 */

import type { SceneDefinition } from "./types";

export const scene04DeepSpace: SceneDefinition = {
  id: 4,
  key: "SCENE_04_DEEP_SPACE",
  name: "Deep Space Void",
  duration_s: 7.0,
  description: "Extreme long shot in the interplanetary medium; absolute stillness and quiet distance.",
  phase: "I_TERRESTRIAL",
  visualTheme: "NOMINAL",
  cameraPreset: "SPACECRAFT_HERO",
  shots: [
    {
      id: "s04_shot01",
      name: "Interplanetary Solitude",
      start_s: 0.0,
      duration_s: 7.0,
      camera: {
        preset: "SPACECRAFT_HERO",
        fovStart: 40,
        fovEnd: 42,
        easing: "linear",
      },
      caption: "Heliocentric distance: 0.98 AU [SIMULATION_OUTPUT]. Ambient particle density < 5 protons/cm³ [ARTISTIC_APPROXIMATION].",
      visualEmphasis: "Harsh directional sunlight with high contrast shadows across the isolated probe chassis.",
      transition: "CUT",
    },
  ],
  hud: {
    title: "SCENE 04 / 18",
    subtitle: "INTERPLANETARY CRUISE",
    captions: [
      "Heliocentric distance: 0.98 AU [SIMULATION_OUTPUT]. Ambient particle density < 5 protons/cm³ [ARTISTIC_APPROXIMATION].",
      "The spacecraft drifts silently into the interplanetary void, far outside the terrestrial umbrella.",
    ],
    badges: [
      {
        label: "HELIOCENTRIC DISTANCE",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => {
          if (!t) return "0.98 AU";
          const r_m = Math.hypot(t.spacecraftPosition_m.x, t.spacecraftPosition_m.z);
          return `${(r_m / 1.495978707e11).toFixed(2)} AU`;
        },
      },
      {
        label: "ATTITUDE CONTROL",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "NOMINAL (3-AXIS STABILIZED)",
      },
    ],
  },
  triggers: [
    {
      id: "trig_04_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 7.0,
      description: "Advance to Scene 05 GPS Lost upon completion.",
    },
  ],
};
