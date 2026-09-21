/**
 * PULSAR-X: Cinematic Domain
 * Scene 07: SEARCH — Autonomous Celestial Survey.
 */

import type { SceneDefinition } from "./types";

export const scene07Search: SceneDefinition = {
  id: 7,
  key: "SCENE_07_SEARCH",
  name: "Celestial Sky Survey",
  duration_s: 8.0,
  description: "Spacecraft slews X-ray timing collimator across equatorial coordinates, searching for periodic pulsars.",
  phase: "II_ISOLATION",
  visualTheme: "NOMINAL",
  cameraPreset: "SPACECRAFT_HERO",
  shots: [
    {
      id: "s07_shot01",
      name: "Sensor Bay Sweep",
      start_s: 0.0,
      duration_s: 8.0,
      camera: {
        preset: "SPACECRAFT_HERO",
        fovStart: 42,
        fovEnd: 36,
        easing: "easeInOutCubic",
      },
      caption: "Autonomous Sky Survey: X-ray energy band 0.5–10 keV active [REAL_INPUT]. Scanning equatorial grid (α, δ).",
      visualEmphasis: "Collimator aperture gimbal slewing across the cosmic horizon in search of millisecond periodic signals.",
      transition: "LIGHT_FLASH",
    },
  ],
  hud: {
    title: "SCENE 07 / 18",
    subtitle: "AUTONOMOUS SKY SURVEY",
    captions: [
      "Autonomous Sky Survey: X-ray energy band 0.5–10 keV active [REAL_INPUT]. Scanning equatorial grid (α, δ).",
      "Searching catalog targets for periodic millisecond timing signals [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "DETECTOR BAND",
        classification: "REAL_INPUT",
        getValue: () => "0.5 - 10.0 keV",
      },
      {
        label: "SURVEY MODE",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "PERIODICITY SCAN",
      },
      {
        label: "GUIDE STARS",
        classification: "ARTISTIC_APPROXIMATION",
        getValue: () => "35 MATCHED",
      },
    ],
  },
  triggers: [
    {
      id: "trig_07_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 8.0,
      description: "Advance to Scene 08 First Pulsar upon acquisition chime.",
    },
  ],
};
