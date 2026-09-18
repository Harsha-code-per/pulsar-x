/**
 * PULSAR-X: Scientific Reference Core
 * Pulsar Rotational Timing Model.
 * Evaluates rotational phase evolution and instantaneous spin frequencies.
 */

import type { PulsarTimingModel } from "../../types/pulsar";
import { assertFinite } from "../math/finite";
import { wrapPhaseToCycle } from "../units/conversions";

/**
 * Evaluates the total accumulated rotational phase of a pulsar at time t (in seconds):
 * Phi(t) = Phi0 + f0*(t - t0) + 0.5*f1*(t - t0)^2 + (1/6)*f2*(t - t0)^3
 */
export function evaluatePulsarPhase(model: PulsarTimingModel, time_s: number): number {
  assertFinite(time_s, "time_s");
  const dt = time_s - model.epoch_s;

  const phase =
    model.referencePhase_cycles +
    model.f0_hz * dt +
    0.5 * model.f1_hzps * dt * dt +
    (1.0 / 6.0) * (model.f2_hzps2 || 0.0) * dt * dt * dt;

  return phase;
}

/**
 * Returns the normalized fractional pulse phase in [0.0, 1.0) at time t.
 */
export function evaluatePulsarPhaseNormalized(model: PulsarTimingModel, time_s: number): number {
  const totalPhase = evaluatePulsarPhase(model, time_s);
  return wrapPhaseToCycle(totalPhase);
}

/**
 * Evaluates the instantaneous spin frequency of the pulsar in Hertz [Hz = s^-1] at time t:
 * nu(t) = f0 + f1*(t - t0) + 0.5*f2*(t - t0)^2
 */
export function evaluatePulsarFrequency(model: PulsarTimingModel, time_s: number): number {
  assertFinite(time_s, "time_s");
  const dt = time_s - model.epoch_s;

  return model.f0_hz + model.f1_hzps * dt + 0.5 * (model.f2_hzps2 || 0.0) * dt * dt;
}

/**
 * Evaluates the instantaneous pulse period in seconds [s] at time t:
 * P(t) = 1 / nu(t)
 */
export function evaluatePulsarPeriod_s(model: PulsarTimingModel, time_s: number): number {
  const f = evaluatePulsarFrequency(model, time_s);
  if (f <= 0) {
    throw new Error(`Non-positive pulsar frequency: ${f}`);
  }
  return 1.0 / f;
}
