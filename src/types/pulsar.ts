/**
 * PULSAR-X: Scientific Reference Core
 * Pulsar astrometric definitions, timing models, observations, and photon events.
 */

import type { Vector3Like } from "./simulation";

/**
 * Operational tracking state of a navigation pulsar beacon.
 */
export type PulsarOperationalState =
  | "ACTIVE"
  | "OCCULTED"
  | "DEGRADED"
  | "SEARCHING";

/**
 * Physical pulsar timing parameters based on astronomical catalogs (ATNF / NICER).
 */
export interface PulsarTimingModel {
  /** Reference epoch t0 in Barycentric Coordinate Time seconds [s] */
  readonly epoch_s: number;
  /** Reference pulse phase at epoch t0 (dimensionless, cycles [0, 1)) */
  readonly referencePhase_cycles: number;
  /** Pulsar rotational spin frequency at epoch t0 in Hertz [Hz = s^-1] */
  readonly f0_hz: number;
  /** First spin frequency derivative (spin-down rate) in [s^-2] */
  readonly f1_hzps: number;
  /** Second spin frequency derivative in [s^-3] (default 0.0) */
  readonly f2_hzps2: number;
}

/**
 * Astrometric pulsar beacon definition in the ICRF / BCRS frame.
 */
export interface Pulsar {
  /** Unique astronomical designation (e.g. "PSR B1937+21") */
  readonly id: string;
  /** Common / colloquial name */
  readonly name: string;
  /** Right Ascension in radians [rad] */
  readonly ra_rad: number;
  /** Declination in radians [rad] */
  readonly dec_rad: number;
  /** Unit direction vector pointing from SSB outward toward the pulsar */
  readonly directionVector: Vector3Like;
  /** Approximate distance from Solar System in meters [m] (if known) */
  readonly distance_m?: number;
  /** Pulsar spin and timing model */
  readonly timing: PulsarTimingModel;
  /** Total high-energy X-ray photon flux at 1 AU [photons / cm^2 / s] */
  readonly flux_phcm2s: number;
  /** Characteristic pulse duty cycle / profile width (fraction of cycle) */
  readonly pulseWidth_cycles: number;
  /** Current operational tracking state */
  readonly state: PulsarOperationalState;
}

/**
 * Discrete X-ray photon arrival event registered by the detector.
 */
export interface PhotonEvent {
  /** Local spacecraft arrival time in seconds [s] */
  readonly timestamp_s: number;
  /** Target pulsar identifier */
  readonly pulsarId: string;
  /** True source attribution (signal from pulsar vs background count) */
  readonly isSignal: boolean;
  /** Normalized folded pulse phase [0, 1) computed at detection */
  readonly phase_cycles: number;
}

/**
 * Processed Time-of-Arrival (TOA) observation from a folded photon profile.
 */
export interface PulsarObservation {
  /** Pulsar identifier */
  readonly pulsarId: string;
  /** Predicted Time of Arrival at spacecraft receiver in seconds [s] */
  readonly predictedToa_s: number;
  /** Measured Time of Arrival at spacecraft receiver in seconds [s] */
  readonly observedToa_s: number;
  /** Timing residual (observed - predicted) in seconds [s] */
  readonly residual_s: number;
  /** Equivalent geometric pseudorange residual in meters [m] (c * residual_s) */
  readonly rangeResidual_m: number;
  /** Phase residual in fractional cycles [-0.5, 0.5) */
  readonly phaseResidual_cycles: number;
  /** Estimated 1-sigma timing uncertainty in seconds [s] */
  readonly uncertainty_s: number;
  /** Signal-to-noise ratio of the template correlation in decibels [dB] */
  readonly snr_db: number;
  /** Total photon counts accumulated in the observation batch */
  readonly photonCount: number;
}
