/**
 * PULSAR-X: Cinematic Domain
 * Scene Definition, HUD Configuration, and Storyboard Contract.
 */

import type { VisualThemeMode } from "../../rendering/config/lookdev";
import type { CinematicPresetId } from "../../rendering/cameras/presets";
import type { ShotDefinition } from "../shots/types";
import type { CinematicTrigger } from "../triggers/types";
import type { SimulationClient } from "../../workers/simulation-client";
import type { WorkerTelemetryFrame } from "../../workers/telemetry";

export type NarrativePhase =
  | "I_TERRESTRIAL"
  | "II_ISOLATION"
  | "III_BEACONS"
  | "IV_CONVERGENCE"
  | "V_TRANSCENDENCE";

export type NumericClassification =
  | "REAL_INPUT"
  | "SIMULATION_OUTPUT"
  | "SCENARIO_TARGET"
  | "DISPLAY_SCALE"
  | "ARTISTIC_APPROXIMATION";

export interface TelemetryBadgeConfig {
  readonly label: string;
  readonly classification: NumericClassification;
  /** Evaluates displayed string from live telemetry frame */
  readonly getValue: (telemetry: WorkerTelemetryFrame | null) => string;
}

export interface SceneHUDConfig {
  readonly title: string;
  readonly subtitle: string;
  readonly captions: readonly string[];
  readonly alert?: string;
  readonly badges?: readonly TelemetryBadgeConfig[];
}

export interface SceneSimulationContext {
  readonly client: SimulationClient | null;
  readonly setPlaybackMultiplier: (multiplier: number) => Promise<void>;
}

export interface SceneRuntimeContext {
  readonly sceneIndex: number;
  readonly playhead_s: number;
  readonly telemetry: WorkerTelemetryFrame | null;
}

export interface SceneDefinition {
  readonly id: number; // 1 to 18
  readonly key: string;
  readonly name: string;
  readonly duration_s: number;
  readonly description: string;
  readonly phase: NarrativePhase;
  readonly shots: readonly ShotDefinition[];
  readonly visualTheme: VisualThemeMode;
  readonly cameraPreset: CinematicPresetId;
  readonly hud: SceneHUDConfig;
  readonly triggers: readonly CinematicTrigger[];
  readonly simulationActions?: (context: SceneSimulationContext) => Promise<void>;
  readonly onEnter?: (context: SceneRuntimeContext) => void;
  readonly onExit?: (context: SceneRuntimeContext) => void;
}
