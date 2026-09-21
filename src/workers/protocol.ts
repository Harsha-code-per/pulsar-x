/**
 * PULSAR-X: Web Worker Domain
 * Strict Discriminated Union Command Protocol and Lifecycle States.
 */

import type { SimulationConfig, SpacecraftState, ClockState } from "../types/simulation";

/**
 * Worker Lifecycle States.
 * Strict state machine: No implicit transitions allowed.
 */
export type WorkerLifecycleState =
  | "UNINITIALIZED"
  | "INITIALIZING"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "ERROR"
  | "STOPPED";

/**
 * Structured Error Categories for Worker Diagnostics.
 */
export type WorkerErrorCategory =
  | "INVALID_COMMAND"
  | "INVALID_CONFIGURATION"
  | "SIMULATION_NUMERICAL_ERROR"
  | "SOLVER_ERROR"
  | "WORKER_INTERNAL_ERROR"
  | "UNSUPPORTED_OPERATION";

/**
 * Structured Fault Injection Definitions.
 * Faults must affect the genuine physical simulation, not just UI overlays.
 */
export type SimulationFault =
  | {
      readonly type: "PULSAR_DROPOUT";
      /** Target pulsar identifier to suppress */
      readonly pulsarId: string;
      /** Optional duration in simulation seconds. If undefined, persists until explicitly cleared */
      readonly duration_s?: number;
    }
  | {
      readonly type: "SOLAR_OCCULTATION";
      /** Target pulsar identifier blinded by solar limb proximity */
      readonly pulsarId: string;
      /** Optional duration in simulation seconds */
      readonly duration_s?: number;
    }
  | {
      readonly type: "TIMING_NOISE_SPIKE";
      /** Multiplier applied to TOA measurement standard deviation (e.g. 5.0 = 5x noise) */
      readonly multiplier: number;
      /** Optional duration in simulation seconds */
      readonly duration_s?: number;
    }
  | {
      readonly type: "CLOCK_DRIFT";
      /** Additional fractional frequency offset added to clock drift rate [s/s] */
      readonly addedDrift_rate: number;
      /** Optional duration in simulation seconds */
      readonly duration_s?: number;
    }
  | {
      readonly type: "SENSOR_DEGRADATION";
      /** Multiplier applied to photon collection efficiency (e.g. 0.2 = 80% loss) */
      readonly efficiencyMultiplier: number;
      /** Optional duration in simulation seconds */
      readonly duration_s?: number;
    }
  | {
      readonly type: "CLEAR_FAULT";
      /** Optional fault type to clear. If omitted, clears all active faults */
      readonly targetFaultType?: string;
      /** Optional target pulsar to clear fault for */
      readonly pulsarId?: string;
    };

/**
 * Parameter update payload for SIM_UPDATE_PARAMS.
 */
export interface ParameterUpdatePayload {
  /** Playback multiplier (e.g. 0.25, 0.5, 1, 2, 5, 10, 50). Applied immediately */
  readonly playbackMultiplier?: number;
  /** Additive timing jitter standard deviation in seconds [s]. Applied next observation */
  readonly timingJitter_s?: number;
  /** Detector effective collecting area in cm^2. Applied next observation */
  readonly detectorArea_cm2?: number;
  /** TOA observation accumulation duration in seconds [s]. Applied next observation */
  readonly observationDuration_s?: number;
  /** Diffuse background rate in ph/s. Applied next observation */
  readonly backgroundRate_phps?: number;
  /** Bitmask indicating active pulsars. Applied immediately */
  readonly activePulsarMask?: number;
  /** Clock drift rate in s/s. Applied next clock integration step */
  readonly clockDrift_rate?: number;
  /** Process noise scaling factor for dead-reckoning covariance growth. Applied next step */
  readonly processNoiseScale?: number;
  /** Scenario ID to switch to. Note: Switching scenario requires re-initialization / reset */
  readonly scenarioId?: string;
}

/**
 * Initialization Payload for SIM_INIT.
 */
export interface SimulationInitPayload {
  /** Deterministic PRNG seed */
  readonly seed?: number;
  /** Optional custom simulation configuration overrides */
  readonly config?: Partial<SimulationConfig>;
  /** Optional scenario ID to load initial conditions from (e.g. "scenario-a") */
  readonly scenarioId?: string;
  /** Optional initial spacecraft kinematic state */
  readonly initialSpacecraftState?: SpacecraftState;
  /** Optional initial clock state */
  readonly initialClockState?: ClockState;
  /** Initial playback multiplier (default 1.0) */
  readonly playbackMultiplier?: number;
  /** High-frequency telemetry broadcast interval in milliseconds (default 50ms = 20Hz) */
  readonly telemetryInterval_ms?: number;
  /** Lower-frequency analytical telemetry broadcast interval in milliseconds (default 1000ms = 1Hz) */
  readonly analyticalInterval_ms?: number;
}

/**
 * Step payload for SIM_STEP.
 */
export interface SimulationStepPayload {
  /** Number of discrete scientific integration steps to advance (default 1) */
  readonly stepCount?: number;
}

/**
 * Reset payload for SIM_RESET.
 */
export interface SimulationResetPayload {
  /** If true, preserves the original seed; if false or undefined, resets with original seed */
  readonly preserveSeed?: boolean;
}

/**
 * Discriminated Union of all Main-to-Worker Commands.
 */
export type WorkerCommand =
  | { readonly type: "SIM_INIT"; readonly payload?: SimulationInitPayload; readonly commandId?: string }
  | { readonly type: "SIM_START"; readonly commandId?: string }
  | { readonly type: "SIM_PAUSE"; readonly commandId?: string }
  | { readonly type: "SIM_RESUME"; readonly commandId?: string }
  | { readonly type: "SIM_STEP"; readonly payload?: SimulationStepPayload; readonly commandId?: string }
  | { readonly type: "SIM_SET_PLAYBACK"; readonly payload: { readonly playbackMultiplier: number }; readonly commandId?: string }
  | { readonly type: "SIM_UPDATE_PARAMS"; readonly payload: ParameterUpdatePayload; readonly commandId?: string }
  | { readonly type: "SIM_INJECT_FAULT"; readonly payload: SimulationFault; readonly commandId?: string }
  | { readonly type: "SIM_RESET"; readonly payload?: SimulationResetPayload; readonly commandId?: string }
  | { readonly type: "SIM_STOP"; readonly commandId?: string };

export type WorkerCommandType = WorkerCommand["type"];

/**
 * Validates whether a command has the required structure and supported command type.
 */
export function isValidWorkerCommand(msg: unknown): msg is WorkerCommand {
  if (typeof msg !== "object" || msg === null) return false;
  const candidate = msg as { type?: unknown };
  if (typeof candidate.type !== "string") return false;

  const validTypes: readonly WorkerCommandType[] = [
    "SIM_INIT",
    "SIM_START",
    "SIM_PAUSE",
    "SIM_RESUME",
    "SIM_STEP",
    "SIM_SET_PLAYBACK",
    "SIM_UPDATE_PARAMS",
    "SIM_INJECT_FAULT",
    "SIM_RESET",
    "SIM_STOP",
  ];

  return validTypes.includes(candidate.type as WorkerCommandType);
}
