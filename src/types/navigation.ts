/**
 * PULSAR-X: Scientific Reference Core
 * Navigation states, covariance matrices, solver outputs, and telemetry contract.
 */

import type { Vector3Like } from "./simulation";

/**
 * Filter operational status.
 */
export type NavigationStatus =
  | "UNINITIALIZED"
  | "CONVERGING"
  | "LOCKED"
  | "DEGRADED"
  | "BLACKOUT"
  | "SINGULAR_GEOMETRY";

/**
 * 8-State Spacecraft Navigation State Vector.
 * State components: [r (3), v (3), c * delta_t (1), c * delta_t_dot (1)]
 */
export interface NavigationState {
  /** Estimated position from Solar System Barycenter in meters [m] */
  readonly position_m: Vector3Like;
  /** Estimated velocity in BCRS frame in meters per second [m/s] */
  readonly velocity_mps: Vector3Like;
  /** Estimated receiver clock bias in seconds [s] */
  readonly clockBias_s: number;
  /** Estimated receiver clock drift rate (dimensionless, s/s) */
  readonly clockDrift_rate: number;
}

/**
 * 8x8 Navigation Error Covariance Matrix components.
 */
export interface NavigationCovariance {
  /** Full 8x8 covariance matrix stored as flat 64-element array (row-major) */
  readonly matrix8x8: readonly number[];
  /** Trace of the 3x3 position error covariance in meters squared [m^2] */
  readonly positionVariance_m2: number;
  /** Trace of the 3x3 velocity error covariance in (m/s)^2 */
  readonly velocityVariance_mps2: number;
  /** Variance of receiver clock bias in seconds squared [s^2] */
  readonly clockBiasVariance_s2: number;
  /** Variance of receiver clock drift in (s/s)^2 */
  readonly clockDriftVariance_rate2: number;
}

/**
 * Principal axis decomposition of the 3D position uncertainty ellipsoid.
 */
export interface UncertaintyAxes {
  /** 1-sigma semi-major axes lengths in meters [m] (sorted: a >= b >= c) */
  readonly sigma1_m: Vector3Like;
  /** 2-sigma semi-major axes lengths in meters [m] */
  readonly sigma2_m: Vector3Like;
  /** 3-sigma semi-major axes lengths in meters [m] */
  readonly sigma3_m: Vector3Like;
  /** Orthonormal eigenvectors representing principal axis orientations */
  readonly eigenvectors: readonly [Vector3Like, Vector3Like, Vector3Like];
  /** Eigenvalues of the 3x3 position covariance matrix (m^2) */
  readonly eigenvalues_m2: readonly [number, number, number];
}

/**
 * Geometric Dilution of Precision metrics computed from active line-of-sight vectors.
 */
export interface GeometryMetrics {
  /** 3D Position Dilution of Precision (position only) */
  readonly pdop: number;
  /** 4D Geometric Dilution of Precision (position + receiver clock bias) */
  readonly gdop: number;
  /** Time Dilution of Precision (receiver clock dimension only) */
  readonly tdop: number;
  /** Condition number of the normal matrix */
  readonly conditionNumber: number;
  /** Estimated algebraic rank of the geometry matrix */
  readonly rank: number;
  /** Number of active non-occulted pulsars contributing to geometry */
  readonly activeCount: number;
}

/**
 * Output of a navigation filter or batch solver update step.
 */
export interface NavigationEstimate {
  /** Estimated state vector */
  readonly state: NavigationState;
  /** Associated error covariance */
  readonly covariance: NavigationCovariance;
  /** Geometric dilution metrics for the observation geometry */
  readonly geometry: GeometryMetrics;
  /** 3D spatial uncertainty ellipsoid decomposition */
  readonly uncertaintyAxes: UncertaintyAxes;
  /** Current operational status of the navigation suite */
  readonly status: NavigationStatus;
  /** Number of iterations taken by the solver */
  readonly iterations: number;
  /** Root-mean-square residual of post-fit observations in meters [m] */
  readonly rmsResidual_m: number;
}

/**
 * Comprehensive scientific telemetry structure for worker communication and analysis.
 */
export interface NavigationTelemetry {
  /** Simulation coordinate time in seconds [s] */
  readonly simulationTime_s: number;
  /** True physical position of the spacecraft in meters [m] */
  readonly truePosition_m: Vector3Like;
  /** True physical velocity of the spacecraft in meters per second [m/s] */
  readonly trueVelocity_mps: Vector3Like;
  /** Estimated position in meters [m] */
  readonly estimatedPosition_m: Vector3Like;
  /** Estimated velocity in meters per second [m/s] */
  readonly estimatedVelocity_mps: Vector3Like;
  /** True Euclidean position error ||r_true - r_est|| in meters [m] */
  readonly positionError_m: number;
  /** True Euclidean velocity error ||v_true - v_est|| in meters per second [m/s] */
  readonly velocityError_mps: number;
  /** True clock bias in seconds [s] */
  readonly trueClockBias_s: number;
  /** Estimated clock bias in seconds [s] */
  readonly estimatedClockBias_s: number;
  /** Clock bias estimation error in seconds [s] */
  readonly clockBiasError_s: number;
  /** Estimated clock drift rate [s/s] */
  readonly estimatedClockDrift_rate: number;
  /** Instantaneous Geometric Dilution of Precision */
  readonly gdop: number;
  /** Instantaneous Position Dilution of Precision */
  readonly pdop: number;
  /** Instantaneous Time Dilution of Precision */
  readonly tdop: number;
  /** Bitmask representing currently locked pulsars */
  readonly activePulsarMask: number;
  /** Total photon arrivals processed */
  readonly totalPhotonCount: number;
  /** Total valid TOA observations incorporated */
  readonly totalObservationCount: number;
  /** Filter status badge */
  readonly status: NavigationStatus;
  /** 3-sigma semi-major axes lengths in meters [m] */
  readonly uncertainty3Sigma_m: Vector3Like;
  /** Post-fit residual root-mean-square in meters [m] */
  readonly rmsResidual_m: number;
}
