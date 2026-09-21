/**
 * PULSAR-X: Web Worker Entry Point
 * Headless execution thread for deterministic astronomical and navigation physics.
 */

import { SimulationRuntime } from "./simulation-runtime";
import { isValidWorkerCommand } from "./protocol";
import type { WorkerToMainMessage } from "./telemetry";

interface WorkerScope {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: unknown): void;
}

// Safe reference to WorkerGlobalScope
const ctx = self as unknown as WorkerScope;

// Instantiate the single-source-of-truth runtime engine
const runtime = new SimulationRuntime((msg: WorkerToMainMessage) => {
  ctx.postMessage(msg);
});

// Primary command handler
ctx.onmessage = (event: MessageEvent<unknown>): void => {
  const data = event.data;
  if (!isValidWorkerCommand(data)) {
    ctx.postMessage({
      type: "WORKER_ERROR",
      category: "INVALID_COMMAND",
      message: "Received invalid or unparseable worker command.",
      details: data,
      timestamp_s: 0,
    } satisfies WorkerToMainMessage);
    return;
  }

  runtime.handleCommand(data);
};

// Global unhandled error guard
ctx.onerror = (event: ErrorEvent): void => {
  ctx.postMessage({
    type: "WORKER_ERROR",
    category: "WORKER_INTERNAL_ERROR",
    message: event.message || "Unhandled worker internal exception.",
    details: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
    timestamp_s: 0,
  } satisfies WorkerToMainMessage);
};

export {};
