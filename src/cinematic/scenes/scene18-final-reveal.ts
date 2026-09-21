/**
 * PULSAR-X: Cinematic Domain
 * Scene 18: FINAL REVEAL — The Universe as an Eternal Clock.
 */

import type { SceneDefinition } from "./types";

export const scene18FinalReveal: SceneDefinition = {
  id: 18,
  key: "SCENE_18_FINAL_REVEAL",
  name: "The Eternal Cosmic Clock",
  duration_s: 12.0,
  description: "Exponential pullback from spacecraft scale to galactic scale; the cosmic pulsar grid revealed.",
  phase: "V_TRANSCENDENCE",
  visualTheme: "CINEMATIC",
  cameraPreset: "NETWORK_OVERVIEW",
  shots: [
    {
      id: "s18_shot01",
      name: "Galactic Pullback & Cosmic Climax",
      start_s: 0.0,
      duration_s: 12.0,
      camera: {
        preset: "NETWORK_OVERVIEW",
        fovStart: 45,
        fovEnd: 65,
        easing: "easeOutQuad",
      },
      caption: "Humanity no longer needs terrestrial lighthouses. The stars have always kept time.",
      visualEmphasis: "Continuous exponential pull-back into deep space; pulsar timing rays blanketing the cosmos.",
      transition: "FADE",
    },
  ],
  hud: {
    title: "SCENE 18 / 18",
    subtitle: "THE STARS CAN BE THE GPS",
    captions: [
      "Humanity no longer needs terrestrial lighthouses. The stars have always kept time.",
      "PULSAR-X: DEEP SPACE NAVIGATION WITHOUT GPS.",
    ],
    badges: [
      {
        label: "PULSAR LIFESPAN",
        classification: "REAL_INPUT",
        getValue: () => "10⁸ - 10⁹ YEARS",
      },
      {
        label: "GALACTIC SCALE",
        classification: "REAL_INPUT",
        getValue: () => "30 kpc (~100,000 ly)",
      },
      {
        label: "SYSTEM STATUS",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "MISSION COMPLETE",
      },
    ],
  },
  triggers: [
    {
      id: "trig_18_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 12.0,
      description: "Trigger cinematic completion.",
    },
  ],
};
