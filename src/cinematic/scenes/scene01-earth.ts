/**
 * PULSAR-X: Cinematic Domain
 * Scene 01: EARTH — The Terrestrial Umbilical Baseline.
 */

import type { SceneDefinition } from "./types";

export const scene01Earth: SceneDefinition = {
  id: 1,
  key: "SCENE_01_EARTH",
  name: "Earth Orbit Baseline",
  duration_s: 8.0,
  description: "Low Earth Orbit baseline: terrestrial GNSS navigation is effortless, locked, and ubiquitous.",
  phase: "I_TERRESTRIAL",
  visualTheme: "NOMINAL",
  cameraPreset: "EARTH_ORBIT",
  shots: [
    {
      id: "s01_shot01",
      name: "LEO Dawn Terminator",
      start_s: 0.0,
      duration_s: 8.0,
      camera: {
        preset: "EARTH_ORBIT",
        fovStart: 45,
        fovEnd: 45,
        easing: "easeInOutCubic",
      },
      caption: "Low Earth Orbit (400 km) [SCENARIO_TARGET]. Terrestrial navigation is effortless.",
      visualEmphasis: "Sunlit Earth dawn terminator with gold MLI spacecraft bus in foreground.",
      transition: "FADE",
    },
  ],
  hud: {
    title: "SCENE 01 / 18",
    subtitle: "LOW EARTH ORBIT BASELINE",
    captions: [
      "Low Earth Orbit (400 km) [SCENARIO_TARGET]. Terrestrial navigation is effortless.",
      "GPS constellation locked: 12 satellites tracked [SIMULATION_OUTPUT]. Position accuracy ±1.2 m [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "GNSS CARRIER",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "LOCKED (12 SVs)",
      },
      {
        label: "TIME SYNC",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${(t.clockBias_s * 1e9).toFixed(1)} ns` : "< 2.0 ns"),
      },
      {
        label: "ORBITAL VELOCITY",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${(t.velocityError_mps + 7660).toFixed(0)} m/s` : "7,660 m/s"),
      },
    ],
  },
  triggers: [
    {
      id: "trig_01_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 8.0,
      description: "Advance to Scene 02 Departure upon shot duration completion.",
    },
  ],
};
