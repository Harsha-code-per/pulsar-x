/**
 * PULSAR-X: Scientific Reference Core Tests
 * Bit-for-Bit Deterministic Replay Test.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { getScenarioB } from "../../src/simulation/scenarios/scenarios";
import { stepSpacecraftStateRK4 } from "../../src/simulation/dynamics/orbit-propagator";
import { stepClockState } from "../../src/simulation/timing/clock-model";
import { generatePhotonBatch } from "../../src/simulation/photons/photon-generator";
import { SeededPRNG } from "../../src/simulation/random/prng";

test("Determinism: Bit-for-Bit Replay Parity", () => {
  const scenario = getScenarioB();
  const steps = 100;
  const dt_s = scenario.config.dt_s;

  const runSimulation = (seed: number) => {
    const prng = new SeededPRNG(seed);
    let scState = scenario.initialSpacecraftState;
    let clkState = scenario.initialClockState;
    const history: Array<{
      time_s: number;
      posX: number;
      posY: number;
      posZ: number;
      velX: number;
      bias: number;
      photonCount: number;
    }> = [];

    for (let step = 0; step < steps; step++) {
      // Propagate spacecraft state
      scState = stepSpacecraftStateRK4(scState, dt_s, { enablePerturbations: true });

      // Step clock state with noise
      clkState = stepClockState(clkState, scState.time_s, dt_s, prng, {
        qBias_s2: 1e-22,
        qDrift_rate2: 1e-26,
      });

      // Generate photon events for first pulsar
      const photons = generatePhotonBatch(
        scenario.pulsars[0],
        scState,
        clkState,
        dt_s,
        {
          detectorArea_cm2: scenario.config.detectorArea_cm2,
          timeAcceleration: scenario.config.timeAcceleration,
          backgroundRate_phps: scenario.config.backgroundRate_phps,
        },
        prng
      );

      history.push({
        time_s: scState.time_s,
        posX: scState.position_m.x,
        posY: scState.position_m.y,
        posZ: scState.position_m.z,
        velX: scState.velocity_mps.x,
        bias: clkState.clockBias_s,
        photonCount: photons.length,
      });
    }

    return history;
  };

  const seed = 42819;
  const run1 = runSimulation(seed);
  const run2 = runSimulation(seed);

  assert.strictEqual(run1.length, steps);
  assert.strictEqual(run2.length, steps);

  for (let i = 0; i < steps; i++) {
    const h1 = run1[i];
    const h2 = run2[i];

    assert.strictEqual(h1.time_s, h2.time_s, `Time mismatch at step ${i}`);
    assert.strictEqual(h1.posX, h2.posX, `Position X mismatch at step ${i}`);
    assert.strictEqual(h1.posY, h2.posY, `Position Y mismatch at step ${i}`);
    assert.strictEqual(h1.posZ, h2.posZ, `Position Z mismatch at step ${i}`);
    assert.strictEqual(h1.velX, h2.velX, `Velocity X mismatch at step ${i}`);
    assert.strictEqual(h1.bias, h2.bias, `Clock bias mismatch at step ${i}`);
    assert.strictEqual(h1.photonCount, h2.photonCount, `Photon count mismatch at step ${i}`);
  }
});
