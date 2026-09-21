/**
 * PULSAR-X: Scientific Reference Core
 * Epoch Folding of Sparse X-Ray Photons.
 * Accumulates photon timestamps into a phase histogram to recover the underlying pulse profile.
 */

import type { PhotonEvent } from "../../types/pulsar";
import { wrapPhaseToCycle } from "../units/conversions";

export interface FoldedProfile {
  /** Number of phase bins across the [0.0, 1.0) cycle */
  readonly binCount: number;
  /** Raw integer counts accumulated in each phase bin */
  readonly counts: readonly number[];
  /** Normalized profile values (counts divided by mean count, mean ~ 1.0) */
  readonly normalized: readonly number[];
  /** Total number of photons folded */
  readonly totalPhotons: number;
  /** Bin index containing the maximum count */
  readonly peakBinIndex: number;
  /** Estimated pulse phase corresponding to the peak [0, 1) */
  readonly peakPhase_cycles: number;
}

/**
 * Folds an array of photon events into a normalized phase histogram.
 */
export function foldPhotonEvents(
  events: readonly PhotonEvent[],
  binCount = 64
): FoldedProfile {
  if (binCount <= 0) {
    throw new Error(`Invalid binCount: ${binCount}`);
  }

  const counts = new Array<number>(binCount).fill(0);
  let totalPhotons = 0;

  for (let i = 0; i < events.length; i++) {
    const phase = wrapPhaseToCycle(events[i].phase_cycles);
    const bin = Math.min(binCount - 1, Math.floor(phase * binCount));
    counts[bin]++;
    totalPhotons++;
  }

  // Find peak bin
  let peakBin = 0;
  let maxCount = -1;
  for (let b = 0; b < binCount; b++) {
    if (counts[b] > maxCount) {
      maxCount = counts[b];
      peakBin = b;
    }
  }

  // Normalized profile relative to mean count
  const meanCount = totalPhotons > 0 ? totalPhotons / binCount : 1.0;
  const normalized = counts.map((c) => (meanCount > 0 ? c / meanCount : 0.0));

  const peakPhase_cycles = (peakBin + 0.5) / binCount;

  return {
    binCount,
    counts,
    normalized,
    totalPhotons,
    peakBinIndex: peakBin,
    peakPhase_cycles,
  };
}
