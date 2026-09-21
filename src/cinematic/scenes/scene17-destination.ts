/**
 * PULSAR-X: Cinematic Domain
 * Scene 17: DESTINATION — Waypoint Arrival & Mission Triumph.
 */

import type { SceneDefinition } from "./types";

export const scene17Destination: SceneDefinition = {
  id: 17,
  key: "SCENE_17_DESTINATION",
  name: "Deep Space Target Arrival",
  duration_s: 9.0,
  description: "Spacecraft completes simulated waypoint arrival criteria at 5.2 AU; autonomous insertion nominal.",
  phase: "V_TRANSCENDENCE",
  visualTheme: "CINEMATIC",
  cameraPreset: "DESTINATION_APPROACH",
  shots: [
    {
      id: "s17_shot01",
      name: "Waypoint Arrival Flyby",
      start_s: 0.0,
      duration_s: 9.0,
      camera: {
        preset: "DESTINATION_APPROACH",
        fovStart: 42,
        fovEnd: 36,
        easing: "easeInOutCubic",
      },
      caption: "Mission Objective Achieved: Autonomous trajectory insertion nominal [SCENARIO_TARGET]. Total time without GPS: 412 days [SCENARIO_TARGET].",
      visualEmphasis: "Cinematic flyby dolly shot skimming along the spacecraft's orbital insertion trajectory.",
      transition: "DISSOLVE",
    },
  ],
  hud: {
    title: "SCENE 17 / 18",
    subtitle: "AUTONOMOUS WAYPOINT INSERTION",
    alert: "MISSION OBJECTIVE ACHIEVED — INSERTION NOMINAL",
    captions: [
      "Mission Objective Achieved: Autonomous trajectory insertion nominal [SCENARIO_TARGET]. Total time without GPS: 412 days [SCENARIO_TARGET].",
      "Simulated trajectory error: < 400 m [SIMULATION_OUTPUT, SCENARIO_TARGET]. Heliocentric distance: 5.2 AU (~7.78e8 km) [REAL_INPUT].",
    ],
    badges: [
      {
        label: "TARGET INSERTION",
        classification: "SCENARIO_TARGET",
        getValue: () => "NOMINAL (< 400 m)",
      },
      {
        label: "CRUISE DURATION",
        classification: "SCENARIO_TARGET",
        getValue: () => "412 DAYS WITHOUT GPS",
      },
      {
        label: "ONE-WAY LIGHT TIME",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "43.2 min to Earth",
      },
      {
        label: "HELIOCENTRIC RANGE",
        classification: "REAL_INPUT",
        getValue: () => "5.2 AU",
      },
    ],
  },
  triggers: [
    {
      id: "trig_17_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 9.0,
      description: "Advance to Scene 18 Final Reveal.",
    },
  ],
};
