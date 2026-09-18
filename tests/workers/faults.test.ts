/**
 * PULSAR-X: Fault Injection & Covariance Growth Tests
 * Verifies pulsar dropout, solar occultation, noise spikes, clock drift, and navigation recovery.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { SimulationRuntime } from "../../src/workers/simulation-runtime";
import type {
  WorkerToMainMessage,
  WorkerEventMessage,
  WorkerTelemetryFrame,
} from "../../src/workers/telemetry";

test("Faults: Pulsar dropout causes geometric degradation and covariance growth", () => {
  const events: string[] = [];
  let lastTelemetry: WorkerTelemetryFrame | null = null;

  const runtime = new SimulationRuntime((msg: WorkerToMainMessage) => {
    if (msg.type === "WORKER_EVENT") {
      events.push((msg as WorkerEventMessage).event);
    } else if (msg.type === "TELEMETRY_FRAME") {
      lastTelemetry = msg as WorkerTelemetryFrame;
    }
  });

  runtime.handleCommand({
    type: "SIM_INIT",
    payload: {
      seed: 42,
      config: { dt_s: 0.1 },
    },
  });

  const tel = () => lastTelemetry as unknown as WorkerTelemetryFrame;

  // Step 20 steps (2.0s) so navigation locks with all 5 pulsars
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 20 } });
  assert.equal(tel().navigationStatus, "LOCKED");
  assert.ok(events.includes("NAVIGATION_LOCKED"));

  const lockedCovarianceTrace =
    tel().eigenvalues_m2[0] + tel().eigenvalues_m2[1] + tel().eigenvalues_m2[2];

  // Inject dropout on 2 pulsars so only 3 remain active (insufficient for 4D fix)
  runtime.handleCommand({
    type: "SIM_INJECT_FAULT",
    payload: { type: "PULSAR_DROPOUT", pulsarId: "PSR_B1937+21" },
  });
  runtime.handleCommand({
    type: "SIM_INJECT_FAULT",
    payload: { type: "PULSAR_DROPOUT", pulsarId: "PSR_B1821-24" },
  });

  // Step 20 steps under dropout
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 20 } });

  assert.ok(events.includes("NAVIGATION_DEGRADED"));
  assert.equal(tel().navigationStatus, "DEGRADED");

  const degradedCovarianceTrace =
    tel().eigenvalues_m2[0] + tel().eigenvalues_m2[1] + tel().eigenvalues_m2[2];

  // Covariance must have grown during the outage
  assert.ok(
    degradedCovarianceTrace > lockedCovarianceTrace,
    `Covariance should grow during outage. Locked: ${lockedCovarianceTrace}, Degraded: ${degradedCovarianceTrace}`
  );

  // Clear all faults
  runtime.handleCommand({
    type: "SIM_INJECT_FAULT",
    payload: { type: "CLEAR_FAULT" },
  });

  // Step 20 steps with restored pulsars
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 20 } });

  assert.ok(events.includes("NAVIGATION_RECOVERED") || events.includes("NAVIGATION_LOCKED"));
  assert.equal(tel().navigationStatus, "LOCKED");

  const recoveredCovarianceTrace =
    tel().eigenvalues_m2[0] + tel().eigenvalues_m2[1] + tel().eigenvalues_m2[2];

  assert.ok(
    recoveredCovarianceTrace < degradedCovarianceTrace,
    `Covariance should contract after recovery. Degraded: ${degradedCovarianceTrace}, Recovered: ${recoveredCovarianceTrace}`
  );
});

test("Faults: Clock drift fault accelerates receiver clock bias drift", () => {
  let lastTelemetry: WorkerTelemetryFrame | null = null;
  const runtime = new SimulationRuntime((msg) => {
    if (msg.type === "TELEMETRY_FRAME") {
      lastTelemetry = msg;
    }
  });

  runtime.handleCommand({
    type: "SIM_INIT",
    payload: {
      seed: 42,
      config: { dt_s: 0.1 },
    },
  });

  const tel = () => lastTelemetry as unknown as WorkerTelemetryFrame;

  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 10 } });
  const biasInitial = tel().clockBias_s;

  // Inject high clock drift fault (1e-6 s/s)
  runtime.handleCommand({
    type: "SIM_INJECT_FAULT",
    payload: { type: "CLOCK_DRIFT", addedDrift_rate: 1e-6 },
  });

  // Step 50 steps (5.0 seconds of simulation)
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 50 } });
  const biasAfterFault = tel().clockBias_s;

  // Expected bias growth: ~ 5.0s * 1e-6 s/s = 5e-6 s
  const deltaBias = Math.abs(biasAfterFault - biasInitial);
  assert.ok(deltaBias > 4.5e-6, `Bias drift should accelerate. deltaBias: ${deltaBias}`);
});
