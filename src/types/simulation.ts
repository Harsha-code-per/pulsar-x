/**
 * PULSAR-X: Scientific Reference Core
 * Simulation state, configuration, and spacecraft types.
 * All properties strictly encode their physical units in their names.
 */

export interface Vector3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * 6-DoF True Spacecraft Kinematic State in the BCRS / ICRF frame.
 */
export interface SpacecraftState {
  /** Position from the Solar System Barycenter in meters [m] */
  readonly position_m: Vector3Like;
  /** Velocity in the BCRS frame in meters per second [m/s] */
  readonly velocity_mps: Vector3Like;
  /** Acceleration in the BCRS frame in meters per second squared [m/s^2] */
  readonly acceleration_mps2: Vector3Like;
  /** Current simulation coordinate time in seconds [s] */
  readonly time_s: number;
}

/**
 * Spacecraft onboard clock state.
 */
export interface ClockState {
  /** Clock bias relative to Barycentric Coordinate Time in seconds [s] */
  readonly clockBias_s: number;
  /** Fractional frequency offset / clock drift rate (dimensionless, s/s) */
  readonly clockDrift_rate: number;
  /** Elapsed clock time on spacecraft receiver in seconds [s] */
  readonly spacecraftTime_s: number;
}

/**
 * Deterministic configuration for the simulation run.
 */
export interface SimulationConfig {
  /** Fixed numerical integration step size in seconds [s] */
  readonly dt_s: number;
  /** Seed for the deterministic pseudo-random number generator */
  readonly seed: number;
  /** Time acceleration factor for photon rate and dynamics display */
  readonly timeAcceleration: number;
  /** Primary celestial gravitational bodies enabled in the propagator */
  readonly enablePlanetaryPerturbations: boolean;
  /** Effective X-ray detector collecting area in square centimeters [cm^2] */
  readonly detectorArea_cm2: number;
  /** Diffuse cosmic and instrumental background X-ray count rate [photons/s] */
  readonly backgroundRate_phps: number;
}
