/**
 * PULSAR-X: Worker Protocol Unit Tests
 * Verifies command validation, structure, and error categorization.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidWorkerCommand, WorkerCommand } from "../../src/workers/protocol";
import { SimulationRuntime } from "../../src/workers/simulation-runtime";
import type { WorkerToMainMessage, WorkerErrorMessage } from "../../src/workers/telemetry";

test("Protocol: isValidWorkerCommand accepts valid commands", () => {
  const validCommands: WorkerCommand[] = [
    { type: "SIM_INIT", payload: { seed: 42 } },
    { type: "SIM_START" },
    { type: "SIM_PAUSE" },
    { type: "SIM_RESUME" },
    { type: "SIM_STEP", payload: { stepCount: 5 } },
    { type: "SIM_SET_PLAYBACK", payload: { playbackMultiplier: 2.0 } },
    { type: "SIM_UPDATE_PARAMS", payload: { activePulsarMask: 0b111 } },
    { type: "SIM_INJECT_FAULT", payload: { type: "PULSAR_DROPOUT", pulsarId: "PSR_1" } },
    { type: "SIM_RESET", payload: { preserveSeed: true } },
    { type: "SIM_STOP" },
  ];

  for (const cmd of validCommands) {
    assert.equal(isValidWorkerCommand(cmd), true, `Command should be valid: ${cmd.type}`);
  }
});

test("Protocol: isValidWorkerCommand rejects malformed or unknown commands", () => {
  assert.equal(isValidWorkerCommand(null), false);
  assert.equal(isValidWorkerCommand(undefined), false);
  assert.equal(isValidWorkerCommand("SIM_START"), false);
  assert.equal(isValidWorkerCommand({}), false);
  assert.equal(isValidWorkerCommand({ type: "UNKNOWN_COMMAND" }), false);
  assert.equal(isValidWorkerCommand({ type: 123 }), false);
});

test("Protocol: Runtime produces structured error on unknown command", () => {
  const messages: WorkerToMainMessage[] = [];
  const runtime = new SimulationRuntime((msg) => messages.push(msg));

  runtime.handleCommand({ type: "INVALID_FOO" as unknown as "SIM_START" });

  const errorMsg = messages.find((m): m is WorkerErrorMessage => m.type === "WORKER_ERROR");
  assert.ok(errorMsg, "Should emit a WORKER_ERROR message");
  assert.equal(errorMsg.category, "INVALID_COMMAND");
  assert.match(errorMsg.message, /Unknown command type received/);
});
