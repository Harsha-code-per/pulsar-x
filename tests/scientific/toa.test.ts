/**
 * PULSAR-X: Scientific Reference Core Tests
 * TOA Estimator & Cross-Correlation Tests.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { foldPhotonEvents } from "../../src/simulation/folding/epoch-folder";
import { estimateToaFromFoldedProfile } from "../../src/simulation/toa/toa-estimator";
import { INITIAL_PULSAR_CATALOG } from "../../src/simulation/pulsars/catalog";
import type { PhotonEvent } from "../../src/types/pulsar";
import { SeededPRNG } from "../../src/simulation/random/prng";

test("TOA Estimator: Cross-Correlation and Residual Extraction", () => {
  const pulsar = INITIAL_PULSAR_CATALOG[0]; // PSR B1937+21 (f0 ~ 641.9 Hz)
  const prng = new SeededPRNG(54321);

  // Synthesize folded photons aligned with zero phase offset
  const events: PhotonEvent[] = [];
  for (let i = 0; i < 3000; i++) {
    // Phase peaked around 0.0
    const phase = (prng.nextGaussian(0, pulsar.pulseWidth_cycles / 2.355) + 1.0) % 1.0;
    events.push({
      timestamp_s: i * 0.001,
      pulsarId: pulsar.id,
      isSignal: true,
      phase_cycles: phase,
    });
  }

  const folded = foldPhotonEvents(events, 64);
  const predictedToa_s = 500.123456;

  const obs = estimateToaFromFoldedProfile(pulsar, folded, predictedToa_s);

  assert.strictEqual(obs.pulsarId, pulsar.id);
  assert.strictEqual(obs.predictedToa_s, predictedToa_s);
  assert.ok(obs.photonCount === 3000);

  // Timing residual should be very close to 0 (well under 1 pulse width ~ 60 microseconds)
  assert.ok(
    Math.abs(obs.residual_s) < 1.0e-4,
    `Residual ${obs.residual_s} s exceeds tolerance`
  );
  assert.ok(obs.uncertainty_s > 0, "Uncertainty must be strictly positive");
  assert.ok(obs.snr_db > 10.0, "SNR must be robust for 3,000 counts");
});
