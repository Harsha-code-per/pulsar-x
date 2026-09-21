/**
 * PULSAR-X: Scientific Reference Core
 * Unit conversion utilities between pulse phase, time, and range.
 * Eliminates implicit unit conversions and guarantees physical transparency.
 */

import { SPEED_OF_LIGHT_MPS } from "../constants/astronomy";
import { assertFinite } from "../math/finite";

/**
 * Converts phase offset in cycles [0, 1) to timing offset in seconds [s].
 * Equation: dt = dphi / f
 */
export function phaseCyclesToTime_s(phase_cycles: number, frequency_hz: number): number {
  assertFinite(phase_cycles, "phase_cycles");
  assertFinite(frequency_hz, "frequency_hz");
  if (frequency_hz <= 0) {
    throw new Error(`Frequency must be positive, received: ${frequency_hz}`);
  }
  return phase_cycles / frequency_hz;
}

/**
 * Converts timing offset in seconds [s] to pulse phase offset in cycles.
 * Equation: dphi = dt * f
 */
export function timeToPhaseCycles(time_s: number, frequency_hz: number): number {
  assertFinite(time_s, "time_s");
  assertFinite(frequency_hz, "frequency_hz");
  return time_s * frequency_hz;
}

/**
 * Converts light travel time in seconds [s] to equivalent metric distance in meters [m].
 * Equation: dr = c * dt
 */
export function timeToRange_m(time_s: number): number {
  assertFinite(time_s, "time_s");
  return time_s * SPEED_OF_LIGHT_MPS;
}

/**
 * Converts metric distance in meters [m] to equivalent light travel time in seconds [s].
 * Equation: dt = dr / c
 */
export function rangeToTime_s(range_m: number): number {
  assertFinite(range_m, "range_m");
  return range_m / SPEED_OF_LIGHT_MPS;
}

/**
 * Converts pulse phase offset in cycles directly to equivalent pseudorange in meters [m].
 * Equation: dr = c * (dphi / f)
 */
export function phaseCyclesToRange_m(phase_cycles: number, frequency_hz: number): number {
  const time_s = phaseCyclesToTime_s(phase_cycles, frequency_hz);
  return timeToRange_m(time_s);
}

/**
 * Converts pseudorange offset in meters [m] directly to pulse phase offset in cycles.
 * Equation: dphi = (dr / c) * f
 */
export function rangeToPhaseCycles(range_m: number, frequency_hz: number): number {
  const time_s = rangeToTime_s(range_m);
  return timeToPhaseCycles(time_s, frequency_hz);
}

/**
 * Wraps a pulse phase value into the standard interval [0.0, 1.0).
 */
export function wrapPhaseToCycle(phase: number): number {
  assertFinite(phase, "phase");
  const mod = phase % 1.0;
  return mod < 0.0 ? mod + 1.0 : mod;
}

/**
 * Wraps a phase residual into the symmetric principal interval [-0.5, 0.5).
 */
export function wrapPhaseResidual(phase: number): number {
  const wrapped = wrapPhaseToCycle(phase);
  return wrapped >= 0.5 ? wrapped - 1.0 : wrapped;
}

/**
 * Converts degrees to radians.
 */
export function degToRad(deg: number): number {
  return (assertFinite(deg, "degrees") * Math.PI) / 180.0;
}

/**
 * Converts radians to degrees.
 */
export function radToDeg(rad: number): number {
  return (assertFinite(rad, "radians") * 180.0) / Math.PI;
}
