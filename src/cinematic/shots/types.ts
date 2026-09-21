/**
 * PULSAR-X: Cinematic Domain
 * Shot Definition and Camera Choreography Model.
 */

import type { CinematicPresetId, CameraContext } from "../../rendering/cameras/presets";
import type { CinematicTransitionType } from "../transitions/types";

export interface ShotCameraConfig {
  readonly preset?: CinematicPresetId;
  readonly position?: [number, number, number] | ((ctx: CameraContext) => [number, number, number]);
  readonly target?: [number, number, number] | ((ctx: CameraContext) => [number, number, number]);
  readonly fovStart?: number;
  readonly fovEnd?: number;
  readonly easing?: "easeInOutCubic" | "linear" | "easeOutQuad" | "easeInQuad";
}

export interface ShotDefinition {
  readonly id: string;
  readonly name: string;
  readonly start_s: number;
  readonly duration_s: number;
  readonly camera: ShotCameraConfig;
  readonly caption?: string;
  readonly visualEmphasis?: string;
  readonly transition?: CinematicTransitionType;
}
