/**
 * PULSAR-X: Main-Thread SimulationClient Tests
 * Verifies dispatch, event subscription, and lifecycle management via mock/direct worker bridge.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { SimulationClient, WorkerLike } from "../../src/workers/simulation-client";
import { SimulationRuntime } from "../../src/workers/simulation-runtime";
import type { WorkerToMainMessage, WorkerTelemetryFrame, WorkerEventMessage } from "../../src/workers/telemetry";
import type { WorkerCommand } from "../../src/workers/protocol";

/**
 * Direct synchronous Worker-like mock that forwards commands to SimulationRuntime.
 */
class DirectMockWorker implements WorkerLike {
  public onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  public onerror: ((event: ErrorEvent) => void) | null = null;
  private runtime: SimulationRuntime;

  constructor() {
    this.runtime = new SimulationRuntime((msg: WorkerToMainMessage) => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent("message", { data: msg }));
      }
    });
  }

  public postMessage(message: unknown): void {
    this.runtime.handleCommand(message as WorkerCommand);
  }

  public terminate(): void {
    this.onmessage = null;
  }
}

test("SimulationClient: Command dispatch and lifecycle tracking", async () => {
  const mockWorker = new DirectMockWorker();
  const client = new SimulationClient(mockWorker);

  const stateHistory: string[] = [];
  const unsubscribeState = client.onStateChange((state, prev) => {
    stateHistory.push(`${prev} -> ${state}`);
  });

  const telemetryReceived: WorkerTelemetryFrame[] = [];
  const unsubscribeTelemetry = client.onTelemetry((frame) => {
    telemetryReceived.push(frame);
  });

  const eventsReceived: string[] = [];
  const unsubscribeEvent = client.onEvent((evt: WorkerEventMessage) => {
    eventsReceived.push(evt.event);
  });

  assert.equal(client.getState(), "UNINITIALIZED");

  // Init
  await client.init({ seed: 42, config: { dt_s: 0.1 } });
  assert.equal(client.getState(), "READY");

  // Step
  await client.step(10);
  assert.ok(telemetryReceived.length >= 1);
  assert.ok(Math.abs((client.getLastTelemetry()?.simulationTime_s ?? 0) - 1.0) < 1e-10);

  // Set playback
  await client.setPlayback(5.0);

  // Inject fault
  await client.injectFault({ type: "PULSAR_DROPOUT", pulsarId: "PSR_1" });
  assert.ok(eventsReceived.includes("FAULT_INJECTED"));

  // Reset
  await client.reset();
  assert.ok(eventsReceived.includes("SIMULATION_RESET"));
  assert.equal(client.getState(), "READY");

  // Cleanup
  unsubscribeState();
  unsubscribeTelemetry();
  unsubscribeEvent();
  client.terminate();
  assert.equal(client.getState(), "STOPPED");
});
