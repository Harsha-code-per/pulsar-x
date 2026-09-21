/**
 * PULSAR-X: Scientific Reference Core Tests
 * Timing, Pulsar Phase Evolution, Canonical Rømer Delay, and Clock Drift Tests.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Vector3 } from "../../src/simulation/math/vector3";
import { ASTRONOMICAL_UNIT_M, SPEED_OF_LIGHT_MPS } from "../../src/simulation/constants/astronomy";
import {
  calculateRoemerDelay_s,
  spacecraftTimeToBarycentricTime_s,
  barycentricTimeToSpacecraftTime_s,
} from "../../src/simulation/timing/roemer";
import {
  evaluatePulsarPhase,
  evaluatePulsarFrequency,
  evaluatePulsarPeriod_s,
} from "../../src/simulation/pulsars/timing-model";
import { createClockState, stepClockState } from "../../src/simulation/timing/clock-model";
import { SeededPRNG } from "../../src/simulation/random/prng";

test("Canonical Rømer Delay: Worked 1 AU Example", () => {
  // Pulsar along +X
  const n_hat = new Vector3(1, 0, 0);
  // Spacecraft at 1 AU along +X
  const r_sc = new Vector3(ASTRONOMICAL_UNIT_M, 0, 0);

  const dt_R = calculateRoemerDelay_s(n_hat, r_sc);
  const expectedDelay_s = ASTRONOMICAL_UNIT_M / SPEED_OF_LIGHT_MPS; // ~499.0047838 s

  assert.ok(
    Math.abs(dt_R - expectedDelay_s) < 1e-6,
    `Rømer delay mismatch: ${dt_R} vs expected ${expectedDelay_s}`
  );
  assert.ok(
    Math.abs(dt_R - 499.0047838) < 1e-4,
    `Rømer delay does not match worked benchmark: ${dt_R}`
  );

  // Sign verification: pulse reaches spacecraft earlier
  const t_ssb = 1000.0;
  const t_sc_true = barycentricTimeToSpacecraftTime_s(t_ssb, n_hat, r_sc);
  assert.ok(t_sc_true < t_ssb, "Signal must reach spacecraft before SSB when (n · r) > 0");
  assert.ok(Math.abs(t_sc_true - (1000.0 - expectedDelay_s)) < 1e-9);

  // Round trip conversion
  const backToSSB = spacecraftTimeToBarycentricTime_s(t_sc_true, n_hat, r_sc);
  assert.ok(Math.abs(backToSSB - t_ssb) < 1e-9);
});

test("Pulsar Rotational Timing Model: Phase Evolution and Spin-Down", () => {
  const model = {
    epoch_s: 100.0,
    referencePhase_cycles: 0.25,
    f0_hz: 640.0,
    f1_hzps: -1.0e-12,
    f2_hzps2: 0.0,
  };

  // At epoch t = 100 s
  assert.strictEqual(evaluatePulsarPhase(model, 100.0), 0.25);
  assert.strictEqual(evaluatePulsarFrequency(model, 100.0), 640.0);
  assert.strictEqual(evaluatePulsarPeriod_s(model, 100.0), 1.0 / 640.0);

  // At t = 101 s (dt = 1 s)
  // Phi = 0.25 + 640*1 - 0.5 * 1e-12 * 1^2 = 640.2499999999995
  const phase1s = evaluatePulsarPhase(model, 101.0);
  const expectedPhase1s = 0.25 + 640.0 * 1.0 - 0.5 * 1.0e-12 * 1.0;
  assert.ok(Math.abs(phase1s - expectedPhase1s) < 1e-9);

  // Frequency after 1000 s
  const freq1000s = evaluatePulsarFrequency(model, 1100.0);
  assert.ok(Math.abs(freq1000s - (640.0 - 1.0e-12 * 1000.0)) < 1e-12);
});

test("Clock State: Deterministic Bias and Drift Integration", () => {
  const initialBias = 1.0e-5; // 10 microseconds
  const driftRate = 2.0e-11; // 20 ps/s drift
  const clock0 = createClockState(initialBias, driftRate, 0.0);

  // Step forward by 100 seconds with zero noise
  const clock1 = stepClockState(clock0, 0.0, 100.0);
  assert.strictEqual(clock1.clockDrift_rate, driftRate);
  const expectedBias = initialBias + driftRate * 100.0;
  assert.ok(Math.abs(clock1.clockBias_s - expectedBias) < 1e-15);

  // Step forward with deterministic noise
  const prng = new SeededPRNG(42);
  const noiseConfig = { qBias_s2: 1e-20, qDrift_rate2: 1e-24 };
  const clockWithNoise = stepClockState(clock0, 0.0, 100.0, prng, noiseConfig);
  assert.notStrictEqual(clockWithNoise.clockBias_s, expectedBias);
  assert.ok(Math.abs(clockWithNoise.clockBias_s - expectedBias) < 1e-7);
});
