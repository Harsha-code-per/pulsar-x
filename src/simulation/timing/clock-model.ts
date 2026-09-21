/**
 * PULSAR-X: Scientific Reference Core
 * Spacecraft Onboard Clock Integration and Noise Model.
 */

import type { ClockState } from "../../types/simulation";
import type { SeededPRNG } from "../random/prng";
import { assertFinite } from "../math/finite";

export interface ClockNoiseConfig {
  /** White frequency noise intensity (Allan deviation parameter) [s / sqrt(s)] */
  readonly qBias_s2: number;
  /** Random walk frequency drift noise intensity [(s/s) / sqrt(s)] */
  readonly qDrift_rate2: number;
}

/**
 * Creates an initial clock state.
 */
export function createClockState(
  initialBias_s = 0.0,
  initialDrift_rate = 0.0,
  initialTime_s = 0.0
): ClockState {
  return {
    clockBias_s: assertFinite(initialBias_s, "initialBias_s"),
    clockDrift_rate: assertFinite(initialDrift_rate, "initialDrift_rate"),
    spacecraftTime_s: assertFinite(initialTime_s, "initialTime_s"),
  };
}

/**
 * Steps the spacecraft clock state forward by dt_s using a deterministic state integration.
 * 
 * Equations:
 *   bias(t + dt) = bias(t) + drift(t) * dt + w_bias
 *   drift(t + dt) = drift(t) + w_drift
 *   spacecraftTime(t + dt) = coordinateTime + bias(t + dt)
 */
export function stepClockState(
  current: ClockState,
  coordinateTime_s: number,
  dt_s: number,
  prng?: SeededPRNG,
  noise?: ClockNoiseConfig
): ClockState {
  assertFinite(dt_s, "dt_s");
  assertFinite(coordinateTime_s, "coordinateTime_s");

  let wBias = 0.0;
  let wDrift = 0.0;

  if (prng && noise) {
    if (noise.qBias_s2 > 0) {
      wBias = prng.nextGaussian(0, Math.sqrt(noise.qBias_s2 * dt_s));
    }
    if (noise.qDrift_rate2 > 0) {
      wDrift = prng.nextGaussian(0, Math.sqrt(noise.qDrift_rate2 * dt_s));
    }
  }

  const nextDrift_rate = current.clockDrift_rate + wDrift;
  const nextBias_s = current.clockBias_s + current.clockDrift_rate * dt_s + wBias;
  const nextSpacecraftTime_s = coordinateTime_s + dt_s + nextBias_s;

  return {
    clockBias_s: nextBias_s,
    clockDrift_rate: nextDrift_rate,
    spacecraftTime_s: nextSpacecraftTime_s,
  };
}
