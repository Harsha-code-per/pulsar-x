/**
 * PULSAR-X: Cinematic Domain
 * Scene 05: GPS LOST — The Foundational Crisis of Deep Space.
 */

import type { SceneDefinition } from "./types";

export const scene05GpsLost: SceneDefinition = {
  id: 5,
  key: "SCENE_05_GPS_LOST",
  name: "GPS Carrier Lock Lost",
  duration_s: 8.0,
  description: "Terrestrial GNSS signals fade into unobservable background noise; carrier lock drops.",
  phase: "II_ISOLATION",
  visualTheme: "DEGRADED",
  cameraPreset: "SPACECRAFT_HERO",
  shots: [
    {
      id: "s05_shot01",
      name: "Macro Antenna Lock Failure",
      start_s: 0.0,
      duration_s: 8.0,
      camera: {
        preset: "SPACECRAFT_HERO",
        fovStart: 35,
        fovEnd: 42,
        easing: "easeOutQuad",
      },
      caption: "CRITICAL: GNSS Carrier Lock Lost [SIMULATION_OUTPUT]. C/N₀ drops below tracking threshold (< 15 dB-Hz).",
      visualEmphasis: "Amber warning indicators pulsing on spacecraft bus; subtle optical chromatic tension.",
      transition: "SIGNAL_GLITCH",
    },
  ],
  hud: {
    title: "SCENE 05 / 18",
    subtitle: "TERRESTRIAL NAVIGATION FAILURE",
    alert: "CRITICAL: GNSS CARRIER LOCK LOST",
    captions: [
      "CRITICAL: GNSS Carrier Lock Lost [SIMULATION_OUTPUT]. Visible satellites drop: 12 -> 4 -> 0 [SIMULATION_OUTPUT].",
      "Instantaneous GDOP is undefined (-> ∞). The craft enters unconstrained dead reckoning.",
    ],
    badges: [
      {
        label: "GNSS CARRIER",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "LOST (0 SVs)",
      },
      {
        label: "CARRIER-TO-NOISE (C/N₀)",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "< 12.0 dB-Hz",
      },
      {
        label: "DILUTION OF PRECISION",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "SINGULAR (∞)",
      },
    ],
  },
  triggers: [
    {
      id: "trig_05_gps_lost",
      type: "EVENT_TRIGGER",
      eventType: "GNSS_LOST",
      priority: 100,
      description: "Trigger dramatic HUD alarm when GNSS_LOST event occurs.",
    },
    {
      id: "trig_05_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 8.0,
      description: "Advance to Scene 06 Ground Link Lost.",
    },
  ],
};
