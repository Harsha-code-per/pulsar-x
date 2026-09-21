/**
 * PULSAR-X: Scientific Reference Core
 * Reference Time-of-Arrival (TOA) Estimator.
 * Cross-correlates a folded pulse profile with a standard template to estimate TOA and uncertainty.
 */

import type { Pulsar, PulsarObservation } from "../../types/pulsar";
import type { FoldedProfile } from "../folding/epoch-folder";
import { evaluatePulseProfileDensity } from "../photons/photon-generator";
import { phaseCyclesToTime_s, wrapPhaseResidual } from "../units/conversions";
import { computeToaResiduals } from "../observation/observation-model";
import { assertFinite } from "../math/finite";

/**
 * Generates an analytical standard template profile across N bins.
 */
export function generateTemplateProfile(binCount: number, pulseWidth_cycles: number): number[] {
  const template = new Array<number>(binCount);
  for (let b = 0; b < binCount; b++) {
    const phase = (b + 0.5) / binCount;
    template[b] = evaluatePulseProfileDensity(phase, pulseWidth_cycles);
  }
  return template;
}

/**
 * Cross-correlates a folded profile against a template across all discrete circular bin shifts,
 * performing quadratic peak interpolation for sub-bin phase resolution.
 */
export function estimatePhaseOffsetCrossCorrelation(
  folded: FoldedProfile,
  template: readonly number[]
): { phaseOffset_cycles: number; correlationPeak: number } {
  const N = folded.binCount;
  if (N !== template.length) {
    throw new Error(`Dimension mismatch: folded has ${N} bins, template has ${template.length}`);
  }

  const crossCorr = new Array<number>(N).fill(0);

  // Discrete circular cross-correlation
  for (let shift = 0; shift < N; shift++) {
    let sum = 0;
    for (let b = 0; b < N; b++) {
      const templateIdx = (b + shift) % N;
      sum += folded.normalized[b] * template[templateIdx];
    }
    crossCorr[shift] = sum;
  }

  // Find maximum cross-correlation shift
  let bestShift = 0;
  let maxCorr = crossCorr[0];
  for (let s = 1; s < N; s++) {
    if (crossCorr[s] > maxCorr) {
      maxCorr = crossCorr[s];
      bestShift = s;
    }
  }

  // Sub-bin refinement using parabolic peak interpolation around bestShift
  const y1 = crossCorr[(bestShift - 1 + N) % N];
  const y2 = crossCorr[bestShift];
  const y3 = crossCorr[(bestShift + 1) % N];

  const denom = 2.0 * (2.0 * y2 - y1 - y3);
  const deltaShift = Math.abs(denom) > 1e-12 ? (y1 - y3) / denom : 0.0;
  const refinedShift = (bestShift + deltaShift + N) % N;

  // Convert shift to phase offset: a circular shift of s bins corresponds to - (s/N) in phase
  const rawPhaseOffset = -(refinedShift / N);
  const phaseOffset_cycles = wrapPhaseResidual(rawPhaseOffset);

  return {
    phaseOffset_cycles,
    correlationPeak: maxCorr,
  };
}

/**
 * Reference pedagogical TOA Estimator.
 * Combines folded photon counts with predicted arrival times to yield a valid PulsarObservation.
 */
export function estimateToaFromFoldedProfile(
  pulsar: Pulsar,
  folded: FoldedProfile,
  predictedToa_s: number
): PulsarObservation {
  assertFinite(predictedToa_s, "predictedToa_s");

  const template = generateTemplateProfile(folded.binCount, pulsar.pulseWidth_cycles);
  const { phaseOffset_cycles, correlationPeak } = estimatePhaseOffsetCrossCorrelation(
    folded,
    template
  );

  // Convert measured phase offset to timing offset: dt = dphi / f0
  const timingOffset_s = phaseCyclesToTime_s(phaseOffset_cycles, pulsar.timing.f0_hz);
  const observedToa_s = predictedToa_s + timingOffset_s;

  const residuals = computeToaResiduals(
    observedToa_s,
    predictedToa_s,
    pulsar.timing.f0_hz
  );

  // Approximate 1-sigma uncertainty: sigma_t ~ W / (2 * sqrt(N_photons))
  const pulseWidth_s = phaseCyclesToTime_s(pulsar.pulseWidth_cycles, pulsar.timing.f0_hz);
  const effectiveCount = Math.max(1, folded.totalPhotons);
  const uncertainty_s = pulseWidth_s / (2.0 * Math.sqrt(effectiveCount));

  // Compute SNR approximation in decibels
  const snr_linear = Math.max(1.0, Math.sqrt(effectiveCount) * (correlationPeak / folded.binCount));
  const snr_db = 10.0 * Math.log10(snr_linear);

  return {
    pulsarId: pulsar.id,
    predictedToa_s,
    observedToa_s,
    residual_s: residuals.timingResidual_s,
    rangeResidual_m: residuals.rangeResidual_m,
    phaseResidual_cycles: residuals.phaseResidual_cycles,
    uncertainty_s,
    snr_db,
    photonCount: folded.totalPhotons,
  };
}
