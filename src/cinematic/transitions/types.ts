/**
 * PULSAR-X: Cinematic Domain
 * Reusable Cinematic Transition Types.
 */

export type CinematicTransitionType =
  | "CUT"
  | "FADE"
  | "DISSOLVE"
  | "MATCH_CUT"
  | "WHIP_PAN"
  | "FOCUS_PULL"
  | "ZOOM_TRANSITION"
  | "SIGNAL_GLITCH"
  | "LIGHT_FLASH";

export interface TransitionConfig {
  readonly type: CinematicTransitionType;
  readonly duration_s: number;
  readonly color?: string;
  readonly easing?: string;
}
