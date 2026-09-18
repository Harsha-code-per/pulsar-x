/**
 * PULSAR-X: Scientific Reference Core Tests
 * Synthetic X-Ray Photon Generation Tests.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { Vector3 } from "../../src/simulation/math/vector3";
import { INITIAL_PULSAR_CATALOG } from "../../src/simulation/pulsars/catalog";
import { generatePhotonBatch } from "../../src/simulation/photons/photon-generator";
import { SeededPRNG } from "../../src/simulation/random/prng";
import type { SpacecraftState, ClockState } from "../../src/types/simulation";

test("Photon Generation: Determinism and Seed Reproducibility", () => {
  const pulsar = INITIAL_PULSAR_CATALOG[0]; // PSR B1937+21
  const spacecraftState: SpacecraftState = {
    position_m: new Vector3(1e11, 0, 0),
    velocity_mps: new Vector3(0, 30000, 0),
    acceleration_mps2: Vector3.zero(),
    time_s: 0.0,
  };
  const clockState: ClockState = {
    clockBias_s: 0.0,
    clockDrift_rate: 0.0,
    spacecraftTime_s: 0.0,
  };

  const config = {
    detectorArea_cm2: 2000.0,
    timeAcceleration: 50.0,
    backgroundRate_phps: 0.05,
  };

  const seed = 98765;
  const prng1 = new SeededPRNG(seed);
  const events1 = generatePhotonBatch(pulsar, spacecraftState, clockState, 10.0, config, prng1);

  const prng2 = new SeededPRNG(seed);
  const events2 = generatePhotonBatch(pulsar, spacecraftState, clockState, 10.0, config, prng2);

  assert.ok(events1.length > 0, "Must generate non-zero photons");
  assert.strictEqual(events1.length, events2.length, "Identical seeds must yield identical photon counts");

  for (let i = 0; i < events1.length; i++) {
    assert.strictEqual(events1[i].timestamp_s, events2[i].timestamp_s);
    assert.strictEqual(events1[i].isSignal, events2[i].isSignal);
    assert.strictEqual(events1[i].phase_cycles, events2[i].phase_cycles);
  }
});
