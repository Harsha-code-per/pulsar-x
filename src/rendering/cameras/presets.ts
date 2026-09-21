/**
 * PULSAR-X: 3D Rendering Domain
 * Reusable Cinematic Camera Compositions & Presets.
 *
 * Prepared for the future Cinematic Director:
 * Provides deterministic, mathematically framed camera viewpoints
 * across spacecraft, planetary, and solar-system scales.
 */

import { INITIAL_PULSAR_CATALOG } from "../../simulation/pulsars/catalog";
import { pulsarDirectionToHorizonPosition } from "../coordinates/scaling";

export type CinematicPresetId =
  | "EARTH_ORBIT"
  | "EARTH_DEPARTURE"
  | "SPACECRAFT_HERO"
  | "PULSAR_REVEAL"
  | "NETWORK_OVERVIEW"
  | "UNCERTAINTY_CLOSE"
  | "SOLAR_INTERFERENCE"
  | "DESTINATION_APPROACH";

export interface CameraContext {
  /** Spacecraft true position in render coordinates [x, y, z] */
  readonly spacecraftPosRender: [number, number, number];
  /** Spacecraft estimated position in render coordinates [x, y, z] */
  readonly estimatedPosRender: [number, number, number];
  /** Spacecraft velocity vector in render coordinates [vx, vy, vz] */
  readonly velocityRender: [number, number, number];
  /** Earth position in render coordinates [x, y, z] */
  readonly earthPosRender?: [number, number, number];
  /** Active focus pulsar ID if selected */
  readonly activePulsarId?: string | null;
}

export interface CinematicPresetDefinition {
  readonly id: CinematicPresetId;
  readonly name: string;
  readonly description: string;
  readonly fov: number;
  readonly near: number;
  readonly far: number;
  readonly transitionDuration_s: number;
  /** Resolves absolute camera position and lookAt target from scene context */
  readonly resolve: (context: CameraContext) => {
    position: [number, number, number];
    target: [number, number, number];
  };
}

export const CINEMATIC_CAMERA_PRESETS: Record<CinematicPresetId, CinematicPresetDefinition> = {
  EARTH_ORBIT: {
    id: "EARTH_ORBIT",
    name: "Low Earth Orbit Baseline",
    description: "30-degree oblique angle looking past the spacecraft toward the sunlit Earth dawn terminator.",
    fov: 45,
    near: 0.1,
    far: 1200,
    transitionDuration_s: 2.5,
    resolve: (ctx) => {
      const ePos = ctx.earthPosRender ?? [92, 0, -18];
      // Frame Earth in background with spacecraft in foreground
      return {
        position: [ctx.spacecraftPosRender[0] - 8.0, ctx.spacecraftPosRender[1] + 3.5, ctx.spacecraftPosRender[2] + 6.0],
        target: [ePos[0], ePos[1], ePos[2]],
      };
    },
  },

  EARTH_DEPARTURE: {
    id: "EARTH_DEPARTURE",
    name: "Translunar / Escape Departure",
    description: "Chase camera behind main propulsion bell looking forward along hyperbolic escape vector.",
    fov: 55,
    near: 0.2,
    far: 1200,
    transitionDuration_s: 2.0,
    resolve: (ctx) => {
      const sc = ctx.spacecraftPosRender;
      // Position behind spacecraft relative to velocity
      const vx = ctx.velocityRender[0];
      const vz = ctx.velocityRender[2];
      const vNorm = Math.hypot(vx, vz) || 1.0;
      const backX = -(vx / vNorm) * 6.5;
      const backZ = -(vz / vNorm) * 6.5;
      return {
        position: [sc[0] + backX, sc[1] + 2.0, sc[2] + backZ],
        target: [sc[0] + (vx / vNorm) * 15.0, sc[1], sc[2] + (vz / vNorm) * 15.0],
      };
    },
  },

  SPACECRAFT_HERO: {
    id: "SPACECRAFT_HERO",
    name: "Hero Spacecraft Beauty Shot",
    description: "3/4 isometric beauty angle catching directional sunlight reflecting off gold MLI bus and solar wings.",
    fov: 40,
    near: 0.2,
    far: 1200,
    transitionDuration_s: 1.8,
    resolve: (ctx) => {
      const sc = ctx.spacecraftPosRender;
      return {
        position: [sc[0] - 5.0, sc[1] + 2.2, sc[2] + 4.2],
        target: [sc[0], sc[1], sc[2]],
      };
    },
  },

  PULSAR_REVEAL: {
    id: "PULSAR_REVEAL",
    name: "Pulsar Beacon Reveal",
    description: "Telephoto framing looking past spacecraft toward active millisecond pulsar on celestial horizon.",
    fov: 32,
    near: 0.5,
    far: 1500,
    transitionDuration_s: 2.2,
    resolve: (ctx) => {
      const pulsar =
        INITIAL_PULSAR_CATALOG.find((p) => p.id === ctx.activePulsarId) ?? INITIAL_PULSAR_CATALOG[0];
      const pPos = pulsarDirectionToHorizonPosition(pulsar.directionVector);
      const sc = ctx.spacecraftPosRender;
      return {
        position: [sc[0] + 3.0, sc[1] + 1.8, sc[2] + 3.8],
        target: [pPos[0], pPos[1], pPos[2]],
      };
    },
  },

  NETWORK_OVERVIEW: {
    id: "NETWORK_OVERVIEW",
    name: "3D Navigational Constellation",
    description: "Wide celestial perspective displaying non-coplanar tetrahedral sightline network.",
    fov: 50,
    near: 0.5,
    far: 1500,
    transitionDuration_s: 3.0,
    resolve: (ctx) => {
      const sc = ctx.spacecraftPosRender;
      return {
        position: [sc[0] + 35.0, sc[1] + 28.0, sc[2] + 50.0],
        target: [sc[0], sc[1], sc[2]],
      };
    },
  },

  UNCERTAINTY_CLOSE: {
    id: "UNCERTAINTY_CLOSE",
    name: "Covariance Ellipsoid Inspection",
    description: "Close inspection framing focused directly on the covariance uncertainty ellipsoid and true probe.",
    fov: 38,
    near: 0.1,
    far: 1000,
    transitionDuration_s: 1.5,
    resolve: (ctx) => {
      const est = ctx.estimatedPosRender;
      return {
        position: [est[0] - 2.8, est[1] + 1.5, est[2] + 3.2],
        target: [est[0], est[1], est[2]],
      };
    },
  },

  SOLAR_INTERFERENCE: {
    id: "SOLAR_INTERFERENCE",
    name: "Solar Glare & Occultation",
    description: "Dramatic low-angle view looking directly toward the Sun, framing solar blinding across the line of sight.",
    fov: 48,
    near: 0.5,
    far: 1200,
    transitionDuration_s: 2.0,
    resolve: (ctx) => {
      const sc = ctx.spacecraftPosRender;
      // Position camera so spacecraft is silhouetted against the Sun at (0,0,0)
      const sunDir = [sc[0] * 1.08, sc[1] + 1.2, sc[2] * 1.08] as [number, number, number];
      return {
        position: sunDir,
        target: [0, 0, 0],
      };
    },
  },

  DESTINATION_APPROACH: {
    id: "DESTINATION_APPROACH",
    name: "Deep Space Waypoint Arrival",
    description: "Cinematic flyby skimming spacecraft trajectory toward outer solar system arrival.",
    fov: 42,
    near: 0.5,
    far: 1500,
    transitionDuration_s: 2.5,
    resolve: (ctx) => {
      const sc = ctx.spacecraftPosRender;
      return {
        position: [sc[0] + 12.0, sc[1] + 8.0, sc[2] + 18.0],
        target: [sc[0], sc[1], sc[2]],
      };
    },
  },
};
