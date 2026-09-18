/**
 * PULSAR-X: Worker Lifecycle & State Machine Tests
 * Verifies explicit lifecycle transitions, timer control, and illegal state rejection.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { SimulationRuntime } from "../../src/workers/simulation-runtime";
import type {
  WorkerToMainMessage,
  WorkerStateMessage,
  WorkerTelemetryFrame,
  WorkerErrorMessage,
} from "../../src/workers/telemetry";

test("Lifecycle: Valid State Machine Transitions", () => {
  const stateTransitions: string[] = [];
  const runtime = new SimulationRuntime((msg: WorkerToMainMessage) => {
    if (msg.type === "STATE_CHANGED") {
      stateTransitions.push(`${(msg as WorkerStateMessage).previousState} -> ${(msg as WorkerStateMessage).state}`);
    }
  });

  assert.equal(runtime.getState(), "UNINITIALIZED");

  // 1. INIT -> INITIALIZING -> READY
  runtime.handleCommand({ type: "SIM_INIT", payload: { seed: 100 } });
  assert.equal(runtime.getState(), "READY");

  // 2. START -> RUNNING
  runtime.handleCommand({ type: "SIM_START" });
  assert.equal(runtime.getState(), "RUNNING");

  // 3. PAUSE -> PAUSED
  runtime.handleCommand({ type: "SIM_PAUSE" });
  assert.equal(runtime.getState(), "PAUSED");

  // 4. RESUME -> RUNNING
  runtime.handleCommand({ type: "SIM_RESUME" });
  assert.equal(runtime.getState(), "RUNNING");

  // 5. PAUSE -> PAUSED
  runtime.handleCommand({ type: "SIM_PAUSE" });
  assert.equal(runtime.getState(), "PAUSED");

  // 6. RESET -> READY
  runtime.handleCommand({ type: "SIM_RESET" });
  assert.equal(runtime.getState(), "READY");

  // 7. STOP -> STOPPED
  runtime.handleCommand({ type: "SIM_STOP" });
  assert.equal(runtime.getState(), "STOPPED");

  assert.deepEqual(stateTransitions, [
    "UNINITIALIZED -> INITIALIZING",
    "INITIALIZING -> READY",
    "READY -> RUNNING",
    "RUNNING -> PAUSED",
    "PAUSED -> RUNNING",
    "RUNNING -> PAUSED",
    "PAUSED -> READY",
    "READY -> STOPPED",
  ]);
});

test("Lifecycle: Illegal transitions produce structured errors", () => {
  const messages: WorkerToMainMessage[] = [];
  const runtime = new SimulationRuntime((msg) => messages.push(msg));

  // Cannot START or STEP when UNINITIALIZED
  runtime.handleCommand({ type: "SIM_START" });
  assert.equal(runtime.getState(), "UNINITIALIZED");

  let error = messages.find((m): m is WorkerErrorMessage => m.type === "WORKER_ERROR");
  assert.ok(error);
  assert.equal(error.category, "INVALID_COMMAND");
  assert.match(error.message, /Cannot start simulation from state: UNINITIALIZED/);

  messages.length = 0;
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 1 } });
  error = messages.find((m): m is WorkerErrorMessage => m.type === "WORKER_ERROR");
  assert.ok(error);
  assert.equal(error.category, "INVALID_COMMAND");
  assert.match(error.message, /Cannot step simulation from state: UNINITIALIZED/);
});

test("Lifecycle: Single-stepping advances simulation time accurately", () => {
  const telemetryFrames: WorkerTelemetryFrame[] = [];
  const runtime = new SimulationRuntime((msg) => {
    if (msg.type === "TELEMETRY_FRAME") {
      telemetryFrames.push(msg);
    }
  });

  runtime.handleCommand({
    type: "SIM_INIT",
    payload: {
      seed: 42,
      config: { dt_s: 0.1 },
    },
  });

  assert.equal(runtime.getState(), "READY");
  assert.equal(telemetryFrames.length, 1);
  assert.equal(telemetryFrames[0].simulationTime_s, 0.0);

  // Step 10 steps of 0.1s
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 10 } });
  assert.equal(telemetryFrames.length, 2);
  assert.ok(Math.abs(telemetryFrames[1].simulationTime_s - 1.0) < 1e-12);
});

test("Lifecycle: Playback multiplier and parameter updates", () => {
  let lastTelemetry: WorkerTelemetryFrame | null = null;
  const runtime = new SimulationRuntime((msg) => {
    if (msg.type === "TELEMETRY_FRAME") {
      lastTelemetry = msg;
    }
  });

  runtime.handleCommand({ type: "SIM_INIT", payload: { seed: 42 } });

  const tel = () => lastTelemetry as unknown as WorkerTelemetryFrame;

  // Update playback multiplier
  runtime.handleCommand({ type: "SIM_SET_PLAYBACK", payload: { playbackMultiplier: 10.0 } });
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 1 } });
  assert.equal(tel().playbackMultiplier, 10.0);

  // Update active pulsar mask to 4 pulsars (0b01111 = 15)
  runtime.handleCommand({ type: "SIM_UPDATE_PARAMS", payload: { activePulsarMask: 15 } });
  runtime.handleCommand({ type: "SIM_STEP", payload: { stepCount: 1 } });
  assert.equal(tel().activePulsarMask, 15);
});
