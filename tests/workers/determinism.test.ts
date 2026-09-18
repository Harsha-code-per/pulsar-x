/**
 * PULSAR-X: Worker Determinism & Bit-for-Bit Replay Tests
 * Verifies that identical configs, seeds, and command sequences produce bit-for-bit identical telemetry.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { SimulationRuntime } from "../../src/workers/simulation-runtime";
import { packTelemetryToFloat64Array } from "../../src/workers/telemetry";
import type { WorkerTelemetryFrame } from "../../src/workers/telemetry";

function runSimulationSequence(seed: number): { frames: WorkerTelemetryFrame[]; binaryBuffers: Float64Array[] } {
  const frames: WorkerTelemetryFrame[] = [];
  const binaryBuffers: Float64Array[] = [];

  const runtime = new SimulationRuntime((msg) => {
    if (msg.type === "TELEMETRY_FRAME") {
      frames.push(msg);
      binaryBuffers.push(packTelemetryToFloat64Array(msg));
    }
  });

  runtime.handleCommand({
    type: "SIM_INIT",
    payload: {
      seed,
      config: { dt_s: 0.05 },
    },
  });

  // Step 50 steps
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 50 } });

  // Inject dropout fault
  runtime.handleCommand({
    type: "SIM_INJECT_FAULT",
    payload: { type: "PULSAR_DROPOUT", pulsarId: "PSR_B1937+21" },
  });

  // Step 30 steps
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 30 } });

  // Clear fault
  runtime.handleCommand({
    type: "SIM_INJECT_FAULT",
    payload: { type: "CLEAR_FAULT" },
  });

  // Step 40 steps
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 40 } });

  return { frames, binaryBuffers };
}

test("Determinism: Bit-for-Bit Replay Parity across Worker Telemetry Sequence", () => {
  const seed = 193721;

  const runA = runSimulationSequence(seed);
  const runB = runSimulationSequence(seed);

  assert.equal(runA.frames.length, runB.frames.length, "Both runs should produce identical frame counts");
  assert.ok(runA.frames.length > 0, "Must have produced telemetry frames");

  for (let i = 0; i < runA.frames.length; i++) {
    const fA = runA.frames[i];
    const fB = runB.frames[i];

    // Simulation time
    assert.equal(fA.simulationTime_s, fB.simulationTime_s, `Frame ${i} simulationTime_s mismatch`);

    // True spacecraft position
    assert.equal(fA.spacecraftPosition_m.x, fB.spacecraftPosition_m.x, `Frame ${i} truePos.x mismatch`);
    assert.equal(fA.spacecraftPosition_m.y, fB.spacecraftPosition_m.y, `Frame ${i} truePos.y mismatch`);
    assert.equal(fA.spacecraftPosition_m.z, fB.spacecraftPosition_m.z, `Frame ${i} truePos.z mismatch`);

    // Estimated position
    assert.equal(fA.estimatedPosition_m.x, fB.estimatedPosition_m.x, `Frame ${i} estPos.x mismatch`);
    assert.equal(fA.estimatedPosition_m.y, fB.estimatedPosition_m.y, `Frame ${i} estPos.y mismatch`);
    assert.equal(fA.estimatedPosition_m.z, fB.estimatedPosition_m.z, `Frame ${i} estPos.z mismatch`);

    // Position error & clock bias
    assert.equal(fA.positionError_m, fB.positionError_m, `Frame ${i} positionError_m mismatch`);
    assert.equal(fA.clockBias_s, fB.clockBias_s, `Frame ${i} clockBias_s mismatch`);
    assert.equal(fA.clockBiasError_s, fB.clockBiasError_s, `Frame ${i} clockBiasError_s mismatch`);

    // Geometry GDOP & PDOP
    assert.equal(fA.gdop, fB.gdop, `Frame ${i} gdop mismatch`);
    assert.equal(fA.pdop, fB.pdop, `Frame ${i} pdop mismatch`);

    // Uncertainty eigenvalues
    assert.equal(fA.eigenvalues_m2[0], fB.eigenvalues_m2[0], `Frame ${i} eigen0 mismatch`);
    assert.equal(fA.eigenvalues_m2[1], fB.eigenvalues_m2[1], `Frame ${i} eigen1 mismatch`);
    assert.equal(fA.eigenvalues_m2[2], fB.eigenvalues_m2[2], `Frame ${i} eigen2 mismatch`);

    // Packed binary ArrayBuffer representation
    const bufA = runA.binaryBuffers[i];
    const bufB = runB.binaryBuffers[i];
    assert.equal(bufA.length, bufB.length, `Frame ${i} binary buffer length mismatch`);
    for (let k = 0; k < bufA.length; k++) {
      assert.equal(bufA[k], bufB[k], `Frame ${i} binary element ${k} mismatch`);
    }
  }
});
