/**
 * PULSAR-X: Cinematic Domain
 * Scene 03: EARTH RECEDES — Psychological & Physical Isolation.
 */

import type { SceneDefinition } from "./types";

export const scene03EarthRecedes: SceneDefinition = {
  id: 3,
  key: "SCENE_03_EARTH_RECEDES",
  name: "Earth Recedes",
  duration_s: 7.0,
  description: "Earth recedes into a distant blue crescent as the spacecraft crosses cislunar space.",
  phase: "I_TERRESTRIAL",
  visualTheme: "NOMINAL",
  cameraPreset: "EARTH_ORBIT",
  shots: [
    {
      id: "s03_shot01",
      name: "Distant Pale Blue Crescent",
      start_s: 0.0,
      duration_s: 7.0,
      camera: {
        preset: "EARTH_ORBIT",
        fovStart: 45,
        fovEnd: 35,
        easing: "linear",
      },
      caption: "Range: 120,000 km [SIMULATION_OUTPUT]. Round-trip light time 0.80 seconds [SIMULATION_OUTPUT].",
      visualEmphasis: "Wide composition framing the fragile blue marble suspended against the deep starfield.",
      transition: "DISSOLVE",
    },
  ],
  hud: {
    title: "SCENE 03 / 18",
    subtitle: "CISLUNAR TRANSIT",
    captions: [
      "Range: 120,000 km [SIMULATION_OUTPUT]. Round-trip light time 0.80 seconds [SIMULATION_OUTPUT].",
      "Earth transitions from an overarching world to a solitary sphere in the void.",
    ],
    badges: [
      {
        label: "TERRESTRIAL RANGE",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "120,400 km",
      },
      {
        label: "ROUND-TRIP LIGHT TIME",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "0.80 s",
      },
    ],
  },
  triggers: [
    {
      id: "trig_03_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 7.0,
      description: "Advance to Scene 04 Deep Space upon completion.",
    },
  ],
};
