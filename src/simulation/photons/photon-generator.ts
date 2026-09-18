/**
 * PULSAR-X: Scientific Reference Core
 * Synthetic X-Ray Photon Generation.
 * Implements deterministic inhomogeneous Poisson arrival processes.
 */

import type { Pulsar, PhotonEvent } from "../../types/pulsar";
import type { SpacecraftState, ClockState } from "../../types/simulation";
import type { SeededPRNG } from "../random/prng";
import { predictPulsarPhaseNormalized } from "../observation/observation-model";
import { assertFinite } from "../math/finite";

export interface PhotonGeneratorConfig {
  /** Effective detector area in square centimeters [cm^2] */
  readonly detectorArea_cm2: number;
  /** Simulation time acceleration factor */
  readonly timeAcceleration: number;
  /** Background noise count rate per second [photons/s] */
  readonly backgroundRate_phps: number;
}

/**
 * Computes Gaussian pulse profile probability density as a function of phase phi in [0, 1):
 * Peak centered at phase 0.0 with characteristic duty cycle pulseWidth.
 */
export function evaluatePulseProfileDensity(phase_cycles: number, pulseWidth_cycles: number): number {
  // Distance to nearest pulse peak at integer cycles (phase 0.0 or 1.0)
  const dPhase = Math.min(phase_cycles, 1.0 - phase_cycles);
  const sigma = pulseWidth_cycles / 2.355; // FWHM to sigma conversion
  return Math.exp(-0.5 * (dPhase * dPhase) / (sigma * sigma));
}

/**
 * Generates a batch of deterministic synthetic photon events arriving over an observation window [t_start, t_start + duration_s].
 */
export function generatePhotonBatch(
  pulsar: Pulsar,
  spacecraftState: SpacecraftState,
  clockState: ClockState,
  duration_s: number,
  config: PhotonGeneratorConfig,
  prng: SeededPRNG
): PhotonEvent[] {
  assertFinite(duration_s, "duration_s");
  if (duration_s <= 0) {
    return [];
  }

  // Effective signal photon rate: flux * area * timeAcceleration
  const signalRate_phps =
    pulsar.flux_phcm2s * config.detectorArea_cm2 * config.timeAcceleration;
  const backgroundRate_phps = config.backgroundRate_phps * config.timeAcceleration;
  const maxTotalRate_phps = signalRate_phps + backgroundRate_phps;

  if (maxTotalRate_phps <= 0) {
    return [];
  }

  const events: PhotonEvent[] = [];
  let currentTime_s = spacecraftState.time_s;
  const endTime_s = currentTime_s + duration_s;

  // Thinning algorithm for inhomogeneous Poisson process
  while (currentTime_s < endTime_s) {
    // Draw next candidate inter-arrival time from homogeneous Poisson process at maximum rate
    const dtCandidate = prng.nextExponential(maxTotalRate_phps);
    currentTime_s += dtCandidate;

    if (currentTime_s >= endTime_s) {
      break;
    }

    // Evaluate phase at current candidate arrival time
    const syntheticClock: ClockState = {
      ...clockState,
      spacecraftTime_s: currentTime_s + clockState.clockBias_s,
    };
    const phase_cycles = predictPulsarPhaseNormalized(pulsar, spacecraftState, syntheticClock);

    // Rejection probability: background + signal * profile
    const profileVal = evaluatePulseProfileDensity(phase_cycles, pulsar.pulseWidth_cycles);
    const instantaneousRate = backgroundRate_phps + signalRate_phps * profileVal;
    const acceptanceProb = instantaneousRate / maxTotalRate_phps;

    if (prng.nextFloat() < acceptanceProb) {
      // Determine if signal or background
      const isSignal = prng.nextFloat() < (signalRate_phps * profileVal) / instantaneousRate;

      events.push({
        timestamp_s: currentTime_s,
        pulsarId: pulsar.id,
        isSignal,
        phase_cycles,
      });
    }
  }

  return events;
}
