/**
 * PULSAR-X: Cinematic Domain
 * Scene 08: FIRST PULSAR — Periodic Cosmic Signal Discovery.
 */

import type { SceneDefinition } from "./types";

export const scene08FirstPulsar: SceneDefinition = {
  id: 8,
  key: "SCENE_08_FIRST_PULSAR",
  name: "First Pulsar Discovery",
  duration_s: 9.0,
  description: "Rapid hyper-zoom toward PSR B1937+21 revealing the spinning neutron star and relativistic beams.",
  phase: "III_BEACONS",
  visualTheme: "CINEMATIC",
  cameraPreset: "PULSAR_REVEAL",
  shots: [
    {
      id: "s08_shot01",
      name: "Hyper-Zoom Pulsar Reveal",
      start_s: 0.0,
      duration_s: 9.0,
      camera: {
        preset: "PULSAR_REVEAL",
        fovStart: 38,
        fovEnd: 28,
        easing: "easeInOutCubic",
      },
      caption: "Source Detected: PSR B1937+21 [REAL_INPUT]. Spin frequency ν = 641.928 Hz, period P = 1.5578 ms [REAL_INPUT].",
      visualEmphasis: "Relativistic synchrotron emission cones sweeping across celestial coordinates in precise sync with simulated spin.",
      transition: "ZOOM_TRANSITION",
    },
  ],
  hud: {
    title: "SCENE 08 / 18",
    subtitle: "PERIODIC X-RAY SOURCE ACQUIRED",
    captions: [
      "Source Detected: PSR B1937+21 [REAL_INPUT]. Spin frequency ν = 641.928 Hz, period P = 1.5578 ms [REAL_INPUT].",
      "Distance: ~10,400 light-years [REAL_INPUT]. Clock stability: 10⁻¹² [REAL_INPUT]. Nature provides an eternal clock.",
    ],
    badges: [
      {
        label: "PULSAR ID",
        classification: "REAL_INPUT",
        getValue: () => "PSR B1937+21",
      },
      {
        label: "SPIN FREQUENCY (ν)",
        classification: "REAL_INPUT",
        getValue: () => "641.928 Hz",
      },
      {
        label: "PERIOD (P)",
        classification: "REAL_INPUT",
        getValue: () => "1.5578 ms",
      },
      {
        label: "CLOCK STABILITY",
        classification: "REAL_INPUT",
        getValue: () => "1.0e-12",
      },
    ],
  },
  triggers: [
    {
      id: "trig_08_pulsar_acq",
      type: "EVENT_TRIGGER",
      eventType: "PULSAR_ACQUIRED",
      priority: 100,
      description: "Trigger reveal upon first pulsar acquisition.",
    },
    {
      id: "trig_08_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 9.0,
      description: "Advance to Scene 09 Pulsar Network.",
    },
  ],
};
