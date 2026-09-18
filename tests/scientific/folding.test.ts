/**
 * PULSAR-X: Scientific Reference Core Tests
 * Epoch Folding Algorithm Tests.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { foldPhotonEvents } from "../../src/simulation/folding/epoch-folder";
import type { PhotonEvent } from "../../src/types/pulsar";
import { SeededPRNG } from "../../src/simulation/random/prng";

test("Epoch Folding: Periodic Signal Peak Recovery", () => {
  const prng = new SeededPRNG(12345);
  const events: PhotonEvent[] = [];
  const expectedPeakPhase = 0.45;
  const pulseWidth = 0.05;

  // Generate 2,000 synthetic photons peaked around expectedPeakPhase = 0.45
  for (let i = 0; i < 2000; i++) {
    // 80% signal around 0.45, 20% uniform noise
    const isSignal = prng.nextFloat() < 0.8;
    let phase: number;
    if (isSignal) {
      phase = (expectedPeakPhase + prng.nextGaussian(0, pulseWidth / 2.355) + 1.0) % 1.0;
    } else {
      phase = prng.nextFloat();
    }

    events.push({
      timestamp_s: i * 0.001,
      pulsarId: "TEST_PSR",
      isSignal,
      phase_cycles: phase,
    });
  }

  const binCount = 64;
  const folded = foldPhotonEvents(events, binCount);

  assert.strictEqual(folded.totalPhotons, 2000);
  assert.strictEqual(folded.binCount, binCount);

  // Peak phase should be close to 0.45 (within 1 bin width: 1/64 ~ 0.015)
  assert.ok(
    Math.abs(folded.peakPhase_cycles - expectedPeakPhase) < 0.03,
    `Recovered peak phase ${folded.peakPhase_cycles} deviates from expected ${expectedPeakPhase}`
  );

  // Verify that peak bin count is significantly higher than average
  const avgCount = folded.totalPhotons / binCount;
  assert.ok(
    folded.counts[folded.peakBinIndex] > avgCount * 2.5,
    `Peak count ${folded.counts[folded.peakBinIndex]} not sufficiently prominent over average ${avgCount}`
  );
});
