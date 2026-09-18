/**
 * PULSAR-X: Scientific Reference Core
 * XNAV Observation Model (NASA SEXTANT First-Order Relationship).
 * Predicts and models pulsar phase and arrival times at the spacecraft receiver.
 */

import type { Pulsar } from "../../types/pulsar";
import type { SpacecraftState, ClockState } from "../../types/simulation";
import { calculateRoemerDelay_s } from "../timing/roemer";
import { evaluatePulsarPhase, evaluatePulsarPhaseNormalized } from "../pulsars/timing-model";
import {
  timeToRange_m,
  timeToPhaseCycles,
  wrapPhaseResidual,
} from "../units/conversions";
import { assertFinite } from "../math/finite";

/**
 * Predicts the continuous rotational phase of a pulsar observed at the spacecraft receiver at time t.
 * 
 * SEXTANT Relationship:
 *   phi_obs(t) = Phi0( t - clockBias(t) + (n_hat · r_sc(t)) / c )
 * 
 * Equivalent Barycentric Time evaluated:
 *   t_ssb_equiv = t_sc - clockBias + dt_Roemer
 */
export function predictPulsarPhase(
  pulsar: Pulsar,
  spacecraftState: SpacecraftState,
  clockState: ClockState
): number {
  const dt_Roemer = calculateRoemerDelay_s(
    pulsar.directionVector,
    spacecraftState.position_m
  );

  // Time shifted by clock bias and light travel delay
  const t_ssb_equiv =
    clockState.spacecraftTime_s - clockState.clockBias_s + dt_Roemer;

  return evaluatePulsarPhase(pulsar.timing, t_ssb_equiv);
}

/**
 * Predicts the normalized pulse phase in [0.0, 1.0) observed at the spacecraft receiver.
 */
export function predictPulsarPhaseNormalized(
  pulsar: Pulsar,
  spacecraftState: SpacecraftState,
  clockState: ClockState
): number {
  const dt_Roemer = calculateRoemerDelay_s(
    pulsar.directionVector,
    spacecraftState.position_m
  );

  const t_ssb_equiv =
    clockState.spacecraftTime_s - clockState.clockBias_s + dt_Roemer;

  return evaluatePulsarPhaseNormalized(pulsar.timing, t_ssb_equiv);
}

/**
 * Predicts the exact Time of Arrival (TOA) at the spacecraft receiver for a pulse that
 * passes the Solar System Barycenter at t_ssb_pulse:
 * 
 *   t_pred_sc = t_ssb_pulse - dt_Roemer + clockBias
 */
export function predictPulsarToa_s(
  pulsar: Pulsar,
  t_ssb_pulse_s: number,
  spacecraftState: SpacecraftState,
  clockState: ClockState
): number {
  assertFinite(t_ssb_pulse_s, "t_ssb_pulse_s");
  const dt_Roemer = calculateRoemerDelay_s(
    pulsar.directionVector,
    spacecraftState.position_m
  );

  return t_ssb_pulse_s - dt_Roemer + clockState.clockBias_s;
}

/**
 * Structure containing decomposed observation residuals.
 */
export interface ObservationResiduals {
  /** Timing residual (observed - predicted) in seconds [s] */
  readonly timingResidual_s: number;
  /** Equivalent pseudorange residual in meters [m] (c * timingResidual) */
  readonly rangeResidual_m: number;
  /** Normalized phase residual in fractional cycles [-0.5, 0.5) */
  readonly phaseResidual_cycles: number;
}

/**
 * Computes timing, range, and phase residuals comparing measured TOA against predicted TOA.
 */
export function computeToaResiduals(
  observedToa_s: number,
  predictedToa_s: number,
  pulsarFrequency_hz: number
): ObservationResiduals {
  assertFinite(observedToa_s, "observedToa_s");
  assertFinite(predictedToa_s, "predictedToa_s");
  assertFinite(pulsarFrequency_hz, "pulsarFrequency_hz");

  const timingResidual_s = observedToa_s - predictedToa_s;
  const rangeResidual_m = timeToRange_m(timingResidual_s);
  const rawPhaseResidual = timeToPhaseCycles(timingResidual_s, pulsarFrequency_hz);
  const phaseResidual_cycles = wrapPhaseResidual(rawPhaseResidual);

  return {
    timingResidual_s,
    rangeResidual_m,
    phaseResidual_cycles,
  };
}
