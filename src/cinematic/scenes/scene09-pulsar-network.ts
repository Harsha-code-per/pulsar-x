/**
 * PULSAR-X: Cinematic Domain
 * Scene 09: PULSAR NETWORK — 3D Triangulation Constellation.
 */

import type { SceneDefinition } from "./types";

export const scene09PulsarNetwork: SceneDefinition = {
  id: 9,
  key: "SCENE_09_PULSAR_NETWORK",
  name: "Pulsar Navigation Network",
  duration_s: 9.0,
  description: "Wide celestial perspective revealing the 4-pulsar non-coplanar tetrahedral sightline network.",
  phase: "III_BEACONS",
  visualTheme: "CINEMATIC",
  cameraPreset: "NETWORK_OVERVIEW",
  shots: [
    {
      id: "s09_shot01",
      name: "Tetrahedral Constellation Mesh",
      start_s: 0.0,
      duration_s: 9.0,
      camera: {
        preset: "NETWORK_OVERVIEW",
        fovStart: 52,
        fovEnd: 48,
        easing: "easeInOutCubic",
      },
      caption: "XPNAV Constellation: 4 non-coplanar pulsars locked [REAL_INPUT]. Geometric Dilution of Precision (GDOP) ~ 2.1 [SIMULATION_OUTPUT].",
      visualEmphasis: "Four luminous sightline vectors converging on the spacecraft, framing a rigid 3D spatial tetrahedron.",
      transition: "FADE",
    },
  ],
  hud: {
    title: "SCENE 09 / 18",
    subtitle: "3D NAVIGATION CONSTELLATION",
    captions: [
      "XPNAV Constellation: 4 non-coplanar pulsars locked [REAL_INPUT]. Geometric Dilution of Precision (GDOP) ~ 2.1 [SIMULATION_OUTPUT].",
      "Non-coplanar geometry ensures full 4D state observability (3D position + receiver clock offset) [SIMULATION_OUTPUT].",
    ],
    badges: [
      {
        label: "ACTIVE BEACONS",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? `${t.activePulsarMask.toString(2).split("1").length - 1} / 5` : "4 / 4"),
      },
      {
        label: "GEOMETRY GDOP",
        classification: "SIMULATION_OUTPUT",
        getValue: (t) => (t ? t.gdop.toFixed(2) : "2.14"),
      },
      {
        label: "MATRIX RANK",
        classification: "SIMULATION_OUTPUT",
        getValue: () => "RANK 4 (FULL OBSERVABILITY)",
      },
    ],
  },
  triggers: [
    {
      id: "trig_09_complete",
      type: "PLAYHEAD_TRIGGER",
      priority: 10,
      condition: (ctx) => ctx.sceneElapsed_s >= 9.0,
      description: "Advance to Scene 10 Signal Observations.",
    },
  ],
};
