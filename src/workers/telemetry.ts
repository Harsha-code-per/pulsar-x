/**
 * PULSAR-X: Web Worker Domain
 * Strict Worker -> Main Telemetry, Event, and Binary Memory Layout Protocols.
 */

import type { Vector3Like } from "../types/simulation";
import type { NavigationStatus } from "../types/navigation";
import type { WorkerLifecycleState, WorkerErrorCategory, WorkerCommandType } from "./protocol";

/**
 * High-Frequency Numerical Telemetry Frame.
 * Broadcast at controlled cadences (e.g. 20 Hz / 50ms) to drive 3D rendering and real-time HUDs.
 */
export interface WorkerTelemetryFrame {
  readonly type: "TELEMETRY_FRAME";
  /** Simulation coordinate time in seconds [s] */
  readonly simulationTime_s: number;
  /** True physical spacecraft position in meters [m] */
  readonly spacecraftPosition_m: Vector3Like;
  /** True physical spacecraft velocity in meters per second [m/s] */
  readonly spacecraftVelocity_mps: Vector3Like;
  /** Estimated position from navigation filter in meters [m] */
  readonly estimatedPosition_m: Vector3Like;
  /** Estimated velocity from navigation filter in meters per second [m/s] */
  readonly estimatedVelocity_mps: Vector3Like;
  /** True Euclidean position error ||r_true - r_est|| in meters [m] */
  readonly positionError_m: number;
  /** True Euclidean velocity error ||v_true - v_est|| in meters per second [m/s] */
  readonly velocityError_mps: number;
  /** True spacecraft clock bias in seconds [s] */
  readonly clockBias_s: number;
  /** Estimated spacecraft clock drift rate [s/s] */
  readonly clockDrift_rate: number;
  /** Clock bias estimation error in seconds [s] */
  readonly clockBiasError_s: number;
  /** Instantaneous Geometric Dilution of Precision (4D) */
  readonly gdop: number;
  /** Instantaneous Position Dilution of Precision (3D) */
  readonly pdop: number;
  /** Instantaneous Time Dilution of Precision (clock only) */
  readonly tdop: number;
  /** Filter operational state */
  readonly navigationStatus: NavigationStatus;
  /** Bitmask representing currently locked / tracking pulsars */
  readonly activePulsarMask: number;
  /** Total valid TOA observations incorporated since initialization */
  readonly observationCount: number;
  /** Total X-ray photons registered since initialization */
  readonly photonCount: number;
  /** 1-sigma semi-major axes lengths in meters [m] */
  readonly uncertaintyAxes1Sigma_m: Vector3Like;
  /** 2-sigma semi-major axes lengths in meters [m] */
  readonly uncertaintyAxes2Sigma_m: Vector3Like;
  /** 3-sigma semi-major axes lengths in meters [m] */
  readonly uncertaintyAxes3Sigma_m: Vector3Like;
  /** Position covariance eigenvalues (lambda_1 >= lambda_2 >= lambda_3) in m^2 */
  readonly eigenvalues_m2: readonly [number, number, number];
  /** Principal orthonormal eigenvectors corresponding to eigenvalues */
  readonly eigenvectors?: readonly [Vector3Like, Vector3Like, Vector3Like];
  /** Status summary of the most recent batch or filter solver update */
  readonly solverStatus: {
    readonly converged: boolean;
    readonly iterations: number;
    readonly rmsResidual_m: number;
  };
  /** Ratio of simulated seconds advanced per wall-clock second */
  readonly simulationRate: number;
  /** Active playback multiplier (e.g. 1.0, 5.0, 50.0) */
  readonly playbackMultiplier: number;
  /** Diagnostic-only wall-clock timestamp (never fed to scientific calculations) */
  readonly wallClockTimestamp: number;
}

/**
 * Lower-Frequency Analytical Telemetry Snapshot.
 * Broadcast at lower cadences (e.g. 1 Hz / 1000ms) for Science Lab charting and deep diagnostics.
 */
export interface WorkerAnalyticalTelemetry {
  readonly type: "ANALYTICAL_TELEMETRY";
  /** Simulation coordinate time in seconds [s] */
  readonly simulationTime_s: number;
  /** Timing residual statistical summary in meters [m] */
  readonly toaResidualStatistics: {
    readonly mean_m: number;
    readonly stdDev_m: number;
    readonly min_m: number;
    readonly max_m: number;
    readonly count: number;
  };
  /** Folded profile histogram summaries for active pulsars */
  readonly pulseProfileStatistics: readonly {
    readonly pulsarId: string;
    readonly bins: readonly number[];
    readonly snr_db: number;
    readonly photonCount: number;
  }[];
  /** Bounded ring-buffered historical trends for Science Lab charting */
  readonly history: {
    readonly simulationTime_s: readonly number[];
    readonly positionError_m: readonly number[];
    readonly gdop: readonly number[];
    readonly rmsResidual_m: readonly number[];
  };
  /** List of currently active injected faults */
  readonly activeFaults: readonly {
    readonly type: string;
    readonly details: string;
    readonly remainingDuration_s?: number;
  }[];
}

/**
 * Discrete Scientific Event Notification.
 * Emitted strictly when genuine physical state transitions occur.
 */
export interface WorkerEventMessage {
  readonly type: "WORKER_EVENT";
  readonly event:
    | "PULSAR_ACQUIRED"
    | "PULSAR_LOST"
    | "OBSERVATION_AVAILABLE"
    | "NAVIGATION_DEGRADED"
    | "NAVIGATION_RECOVERED"
    | "NAVIGATION_LOCKED"
    | "FAULT_INJECTED"
    | "FAULT_CLEARED"
    | "SIMULATION_RESET";
  readonly timestamp_s: number;
  readonly details: Record<string, unknown>;
}

/**
 * Structured Worker Error Notification.
 */
export interface WorkerErrorMessage {
  readonly type: "WORKER_ERROR";
  readonly category: WorkerErrorCategory;
  readonly message: string;
  readonly details?: unknown;
  readonly timestamp_s: number;
}

/**
 * Lifecycle State Transition Notification.
 */
export interface WorkerStateMessage {
  readonly type: "STATE_CHANGED";
  readonly state: WorkerLifecycleState;
  readonly previousState: WorkerLifecycleState;
}

/**
 * Command Acknowledgment.
 */
export interface WorkerCommandAckMessage {
  readonly type: "SIM_COMMAND_ACK";
  readonly commandId?: string;
  readonly commandType: WorkerCommandType;
  readonly status: "SUCCESS" | "IGNORED";
  readonly message?: string;
}

/**
 * Discriminated Union of all Worker -> Main Thread Messages.
 */
export type WorkerToMainMessage =
  | WorkerTelemetryFrame
  | WorkerAnalyticalTelemetry
  | WorkerEventMessage
  | WorkerErrorMessage
  | WorkerStateMessage
  | WorkerCommandAckMessage;

// ============================================================================
// Binary ArrayBuffer Layout Specification (Float64Array mapping)
// ============================================================================

/**
 * Total number of 64-bit IEEE 754 floats in a packed numerical telemetry buffer.
 * Total byte size = 34 * 8 = 272 bytes.
 */
export const TELEMETRY_FLOAT64_COUNT = 34;

export const TELEMETRY_LAYOUT = {
  SIMULATION_TIME_S: 0,
  TRUE_POS_X: 1,
  TRUE_POS_Y: 2,
  TRUE_POS_Z: 3,
  TRUE_VEL_X: 4,
  TRUE_VEL_Y: 5,
  TRUE_VEL_Z: 6,
  EST_POS_X: 7,
  EST_POS_Y: 8,
  EST_POS_Z: 9,
  EST_VEL_X: 10,
  EST_VEL_Y: 11,
  EST_VEL_Z: 12,
  POS_ERROR_M: 13,
  VEL_ERROR_MPS: 14,
  CLOCK_BIAS_S: 15,
  CLOCK_DRIFT_RATE: 16,
  CLOCK_BIAS_ERROR_S: 17,
  GDOP: 18,
  PDOP: 19,
  TDOP: 20,
  ACTIVE_PULSAR_MASK: 21,
  OBSERVATION_COUNT: 22,
  PHOTON_COUNT: 23,
  SIGMA1_X: 24,
  SIGMA1_Y: 25,
  SIGMA1_Z: 26,
  SIGMA2_X: 27,
  SIGMA2_Y: 28,
  SIGMA2_Z: 29,
  SIGMA3_X: 30,
  SIGMA3_Y: 31,
  SIGMA3_Z: 32,
  RMS_RESIDUAL_M: 33,
} as const;

/**
 * Packs numerical telemetry into a contiguous Float64Array for zero-allocation transmission.
 */
export function packTelemetryToFloat64Array(
  frame: WorkerTelemetryFrame,
  targetBuffer: Float64Array = new Float64Array(TELEMETRY_FLOAT64_COUNT)
): Float64Array {
  targetBuffer[TELEMETRY_LAYOUT.SIMULATION_TIME_S] = frame.simulationTime_s;
  targetBuffer[TELEMETRY_LAYOUT.TRUE_POS_X] = frame.spacecraftPosition_m.x;
  targetBuffer[TELEMETRY_LAYOUT.TRUE_POS_Y] = frame.spacecraftPosition_m.y;
  targetBuffer[TELEMETRY_LAYOUT.TRUE_POS_Z] = frame.spacecraftPosition_m.z;
  targetBuffer[TELEMETRY_LAYOUT.TRUE_VEL_X] = frame.spacecraftVelocity_mps.x;
  targetBuffer[TELEMETRY_LAYOUT.TRUE_VEL_Y] = frame.spacecraftVelocity_mps.y;
  targetBuffer[TELEMETRY_LAYOUT.TRUE_VEL_Z] = frame.spacecraftVelocity_mps.z;
  targetBuffer[TELEMETRY_LAYOUT.EST_POS_X] = frame.estimatedPosition_m.x;
  targetBuffer[TELEMETRY_LAYOUT.EST_POS_Y] = frame.estimatedPosition_m.y;
  targetBuffer[TELEMETRY_LAYOUT.EST_POS_Z] = frame.estimatedPosition_m.z;
  targetBuffer[TELEMETRY_LAYOUT.EST_VEL_X] = frame.estimatedVelocity_mps.x;
  targetBuffer[TELEMETRY_LAYOUT.EST_VEL_Y] = frame.estimatedVelocity_mps.y;
  targetBuffer[TELEMETRY_LAYOUT.EST_VEL_Z] = frame.estimatedVelocity_mps.z;
  targetBuffer[TELEMETRY_LAYOUT.POS_ERROR_M] = frame.positionError_m;
  targetBuffer[TELEMETRY_LAYOUT.VEL_ERROR_MPS] = frame.velocityError_mps;
  targetBuffer[TELEMETRY_LAYOUT.CLOCK_BIAS_S] = frame.clockBias_s;
  targetBuffer[TELEMETRY_LAYOUT.CLOCK_DRIFT_RATE] = frame.clockDrift_rate;
  targetBuffer[TELEMETRY_LAYOUT.CLOCK_BIAS_ERROR_S] = frame.clockBiasError_s;
  targetBuffer[TELEMETRY_LAYOUT.GDOP] = frame.gdop;
  targetBuffer[TELEMETRY_LAYOUT.PDOP] = frame.pdop;
  targetBuffer[TELEMETRY_LAYOUT.TDOP] = frame.tdop;
  targetBuffer[TELEMETRY_LAYOUT.ACTIVE_PULSAR_MASK] = frame.activePulsarMask;
  targetBuffer[TELEMETRY_LAYOUT.OBSERVATION_COUNT] = frame.observationCount;
  targetBuffer[TELEMETRY_LAYOUT.PHOTON_COUNT] = frame.photonCount;
  targetBuffer[TELEMETRY_LAYOUT.SIGMA1_X] = frame.uncertaintyAxes1Sigma_m.x;
  targetBuffer[TELEMETRY_LAYOUT.SIGMA1_Y] = frame.uncertaintyAxes1Sigma_m.y;
  targetBuffer[TELEMETRY_LAYOUT.SIGMA1_Z] = frame.uncertaintyAxes1Sigma_m.z;
  targetBuffer[TELEMETRY_LAYOUT.SIGMA2_X] = frame.uncertaintyAxes2Sigma_m.x;
  targetBuffer[TELEMETRY_LAYOUT.SIGMA2_Y] = frame.uncertaintyAxes2Sigma_m.y;
  targetBuffer[TELEMETRY_LAYOUT.SIGMA2_Z] = frame.uncertaintyAxes2Sigma_m.z;
  targetBuffer[TELEMETRY_LAYOUT.SIGMA3_X] = frame.uncertaintyAxes3Sigma_m.x;
  targetBuffer[TELEMETRY_LAYOUT.SIGMA3_Y] = frame.uncertaintyAxes3Sigma_m.y;
  targetBuffer[TELEMETRY_LAYOUT.SIGMA3_Z] = frame.uncertaintyAxes3Sigma_m.z;
  targetBuffer[TELEMETRY_LAYOUT.RMS_RESIDUAL_M] = frame.solverStatus.rmsResidual_m;
  return targetBuffer;
}
