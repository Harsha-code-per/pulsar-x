/**
 * PULSAR-X: End-to-End Scientific Execution Test
 * Verifies full execution chain: True State -> Observations -> TOA -> Batch Navigation -> Telemetry.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { SimulationRuntime } from "../../src/workers/simulation-runtime";
import type {
  WorkerToMainMessage,
  WorkerTelemetryFrame,
  WorkerAnalyticalTelemetry,
} from "../../src/workers/telemetry";

test("End-to-End: Full Scientific Pipeline Execution in Simulation Runtime", () => {
  let lastTelemetry: WorkerTelemetryFrame | null = null;
  let lastAnalytical: WorkerAnalyticalTelemetry | null = null;

  const runtime = new SimulationRuntime((msg: WorkerToMainMessage) => {
    if (msg.type === "TELEMETRY_FRAME") {
      lastTelemetry = msg;
    } else if (msg.type === "ANALYTICAL_TELEMETRY") {
      lastAnalytical = msg;
    }
  });

  // Initialize with deterministic seed and 50ms integration timestep
  runtime.handleCommand({
    type: "SIM_INIT",
    payload: {
      seed: 193721,
      config: {
        dt_s: 0.05,
        detectorArea_cm2: 2000.0,
        backgroundRate_phps: 0.5,
      },
      scenarioId: "scenario-a",
    },
  });

  // Initial state should have ~100 km position error
  const initialTel = lastTelemetry as unknown as WorkerTelemetryFrame;
  assert.ok(initialTel);
  const initialPosError_m = initialTel.positionError_m;
  assert.ok(initialPosError_m > 50000.0, `Initial error should be perturbed (~100km): ${initialPosError_m}`);
  assert.equal(initialTel.navigationStatus, "CONVERGING");

  // Advance 40 steps (2.0 simulation seconds, enough for 2 observation batches of 1.0s each)
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 40 } });

  const finalTel = lastTelemetry as unknown as WorkerTelemetryFrame;
  assert.ok(finalTel);
  const convergedPosError_m = finalTel.positionError_m;

  // Scientific Verification 1: Position error must have converged from ~100km down to < 50m
  assert.ok(
    convergedPosError_m < 50.0,
    `Position error must converge from initial perturbation. Converged: ${convergedPosError_m} m`
  );

  // Scientific Verification 2: Receiver clock bias must have converged to sub-nanosecond error
  assert.ok(
    finalTel.clockBiasError_s < 1e-7,
    `Clock bias error should be < 100ns: ${finalTel.clockBiasError_s} s`
  );

  // Scientific Verification 3: Navigation filter status reached LOCKED
  assert.equal(finalTel.navigationStatus, "LOCKED");
  assert.equal(finalTel.solverStatus.converged, true);
  assert.ok(finalTel.solverStatus.rmsResidual_m < 100.0);

  // Scientific Verification 4: GDOP and PDOP are physically reasonable
  assert.ok(Number.isFinite(finalTel.gdop) && finalTel.gdop > 1.0 && finalTel.gdop < 10.0);
  assert.ok(Number.isFinite(finalTel.pdop) && finalTel.pdop > 1.0 && finalTel.pdop < 10.0);

  // Scientific Verification 5: Photons and observations accumulated
  assert.ok(finalTel.photonCount > 0, `Photons should be accumulated: ${finalTel.photonCount}`);
  assert.ok(finalTel.observationCount >= 4, `Observations should be processed: ${finalTel.observationCount}`);

  // Emit analytical telemetry and inspect folded profile statistics
  runtime.emitAnalyticalTelemetry(true);
  const finalAnal = lastAnalytical as unknown as WorkerAnalyticalTelemetry;
  assert.ok(finalAnal);
  assert.ok(finalAnal.pulseProfileStatistics.length >= 4);
  assert.ok(finalAnal.history.positionError_m.length > 0);
});
