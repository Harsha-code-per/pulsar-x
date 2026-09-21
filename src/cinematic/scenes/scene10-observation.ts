/**
 * PULSAR-X: Cinematic Domain
 * Scene 10: OBSERVATION — Photon Accumulation & Epoch Folding.
 */

import type { SceneDefinition } from "./types";

export const scene10Observation: SceneDefinition = {
  id: 10,
  key: "SCENE_10_OBSERVATION",
  name: "Photon Event Folding",
  duration_s: 9.0,
  description: "Sparse X-ray photons accumulate on the detector and fold into a high-SNR timing profile.",
  phase: "III_BEACONS",
  visualTheme: "NOMINAL",
  cameraPreset: "SPACECRAFT_HERO",
  shots: [
    {
      id: "s10_shot01",
      name: "XTI Detector Arrival Flashes",
      start_s: 0.0,
      duration_s: 9.0,
      camera: {
        preset: "SPACECRAFT_HERO",
        fovStart: 38,
        fovEnd: 35,
        easing: "easeInOutCubic",
      },
      caption: "Photon Arrivals: Effective area 2,000 cm² [SCENARIO_TARGET]. Epoch folding builds timing profile from sparse photons.",
      visualEmphasis: "Localized detector flashes at the collimator aperture as photon packets arrive along active sightlines.",
      transition: "MATCH_CUT",
    },
  ],
  hud: {
    title: "SCENE 10 / 18",
    subtitle: "PULSE PROFILE EXTRACTION",
    captions: [
      "Photon Arrivals: Effective area 2,000 cm² [SCENARIO_TARGET]. Epoch folding builds timing profile from sparse photons.",
      "Cross-correlation extracts Time-of-Arrival (TOA) with sub-microsecond precision [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "PHOTON COUNT",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? t.photonCount.toLocaleString() : "1,440"),
      },
      {
        label: "CROSS-CORR SNR",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "14.8 dB",
      },
      {
        label: "TOA RESIDUAL RMS",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${t.solverStatus.rmsResidual_m.toFixed(1)} m` : "42.5 m"),
      },
    ],
  },
  triggers: [
    {
      id: "trig_10_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 9.0,
      description: "Advance to Scene 11 Position Uncertainty.",
    },
  ],
};
