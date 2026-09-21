/**
 * PULSAR-X: Web Worker Domain
 * Main-Thread Simulation Worker Client & Subscription Manager.
 *
 * Provides a clean, typed API for Zustand stores and UI components to orchestrate
 * the headless simulation worker without embedding scientific logic on the main thread.
 * Features an automated, resilient fallback to DirectWorker in environments where
 * Web Worker module loading is constrained.
 */

import type {
  WorkerCommand,
  WorkerLifecycleState,
  SimulationInitPayload,
  ParameterUpdatePayload,
  SimulationFault,
} from "./protocol";
import type {
  WorkerToMainMessage,
  WorkerTelemetryFrame,
  WorkerAnalyticalTelemetry,
  WorkerEventMessage,
  WorkerErrorMessage,
} from "./telemetry";
import { SimulationRuntime } from "./simulation-runtime";

export interface WorkerLike {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror?: ((event: ErrorEvent) => void) | null;
  terminate(): void;
}

export type TelemetryListener = (frame: WorkerTelemetryFrame) => void;
export type AnalyticalListener = (data: WorkerAnalyticalTelemetry) => void;
export type EventListener = (event: WorkerEventMessage) => void;
export type ErrorListener = (error: WorkerErrorMessage) => void;
export type StateChangeListener = (state: WorkerLifecycleState, previousState: WorkerLifecycleState) => void;

/**
 * Direct synchronous/microtask Worker fallback that executes SimulationRuntime
 * in headless mode adhering bit-for-bit to the worker protocol.
 */
export class DirectWorker implements WorkerLike {
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
    setTimeout(() => {
      this.runtime.handleCommand(message as WorkerCommand);
    }, 0);
  }

  public terminate(): void {
    this.onmessage = null;
  }
}

export class SimulationClient {
  private worker: WorkerLike | null = null;
  private state: WorkerLifecycleState = "UNINITIALIZED";
  private lastTelemetry: WorkerTelemetryFrame | null = null;
  private commandCounter = 0;
  private hasReceivedMessage = false;
  private lastInitPayload: SimulationInitPayload | undefined = undefined;
  private lastRequestedStart = false;

  // Pending command promises (commandId -> { resolve, reject })
  private pendingCommands: Map<string, { resolve: () => void; reject: (err: Error) => void }> = new Map();

  // Subscription listeners
  private telemetryListeners: Set<TelemetryListener> = new Set();
  private analyticalListeners: Set<AnalyticalListener> = new Set();
  private eventListeners: Set<EventListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private stateListeners: Set<StateChangeListener> = new Set();

  constructor(customWorker?: WorkerLike) {
    if (customWorker) {
      this.bindWorker(customWorker);
    }
  }

  /**
   * Lazily binds or creates the underlying Web Worker.
   * Employs DirectWorker failover if Web Worker fails to load.
   */
  public ensureWorker(): WorkerLike {
    if (!this.worker) {
      if (typeof window !== "undefined" && typeof Worker !== "undefined") {
        try {
          // Resolve relative module URL safely across bundlers
          const workerUrl = new URL("./simulation.worker.ts", window.location.href);
          const worker = new Worker(workerUrl, { type: "module" });
          this.bindWorker(worker);
        } catch {
          const fallback = new DirectWorker();
          this.bindWorker(fallback);
        }
      } else {
        const fallback = new DirectWorker();
        this.bindWorker(fallback);
      }
    }
    return this.worker!;
  }

  public bindWorker(worker: WorkerLike): void {
    if (this.worker) {
      this.worker.terminate();
    }
    this.worker = worker;
    this.worker.onmessage = (event: MessageEvent<unknown>): void => {
      this.hasReceivedMessage = true;
      this.handleWorkerMessage(event.data as WorkerToMainMessage);
    };

    if ("onerror" in worker) {
      worker.onerror = (event: ErrorEvent): void => {
        // If the worker encounters an unrecoverable load error before emitting messages, failover to DirectWorker
        if (!this.hasReceivedMessage) {
          console.warn("Worker script unreachable, failing over to resilient DirectWorker:", event.message);
          const fallback = new DirectWorker();
          this.bindWorker(fallback);
          if (this.lastInitPayload) {
            this.init(this.lastInitPayload).then(() => {
              if (this.lastRequestedStart) {
                this.start();
              }
            });
          }
          return;
        }

        const errPayload: WorkerErrorMessage = {
          type: "WORKER_ERROR",
          category: "WORKER_INTERNAL_ERROR",
          message: event.message || "Worker error event triggered",
          timestamp_s: this.lastTelemetry?.simulationTime_s ?? 0,
        };
        this.notifyErrors(errPayload);
      };
    }
  }

  public getState(): WorkerLifecycleState {
    return this.state;
  }

  public getLastTelemetry(): WorkerTelemetryFrame | null {
    return this.lastTelemetry;
  }

  // ==========================================================================
  // Command Dispatch API
  // ==========================================================================

  public async init(payload?: SimulationInitPayload): Promise<void> {
    this.lastInitPayload = payload;
    this.ensureWorker();
    return this.dispatchCommand({ type: "SIM_INIT", payload });
  }

  public async start(): Promise<void> {
    this.lastRequestedStart = true;
    return this.dispatchCommand({ type: "SIM_START" });
  }

  public async pause(): Promise<void> {
    this.lastRequestedStart = false;
    return this.dispatchCommand({ type: "SIM_PAUSE" });
  }

  public async resume(): Promise<void> {
    this.lastRequestedStart = true;
    return this.dispatchCommand({ type: "SIM_RESUME" });
  }

  public async step(stepCount = 1): Promise<void> {
    return this.dispatchCommand({ type: "SIM_STEP", payload: { stepCount } });
  }

  public async setPlayback(playbackMultiplier: number): Promise<void> {
    return this.dispatchCommand({
      type: "SIM_SET_PLAYBACK",
      payload: { playbackMultiplier },
    });
  }

  public async updateParams(params: ParameterUpdatePayload): Promise<void> {
    return this.dispatchCommand({
      type: "SIM_UPDATE_PARAMS",
      payload: params,
    });
  }

  public async injectFault(fault: SimulationFault): Promise<void> {
    return this.dispatchCommand({
      type: "SIM_INJECT_FAULT",
      payload: fault,
    });
  }

  public async reset(preserveSeed = true): Promise<void> {
    return this.dispatchCommand({
      type: "SIM_RESET",
      payload: { preserveSeed },
    });
  }

  public async stop(): Promise<void> {
    this.lastRequestedStart = false;
    return this.dispatchCommand({ type: "SIM_STOP" });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    const prev = this.state;
    this.state = "STOPPED";
    this.notifyStateChange("STOPPED", prev);
    this.pendingCommands.clear();
  }

  // ==========================================================================
  // Subscription Listeners
  // ==========================================================================

  public onTelemetry(listener: TelemetryListener): () => void {
    this.telemetryListeners.add(listener);
    return () => this.telemetryListeners.delete(listener);
  }

  public onAnalyticalTelemetry(listener: AnalyticalListener): () => void {
    this.analyticalListeners.add(listener);
    return () => this.analyticalListeners.delete(listener);
  }

  public onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  public onStateChange(listener: StateChangeListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // ==========================================================================
  // Message Processing
  // ==========================================================================

  private handleWorkerMessage(msg: WorkerToMainMessage): void {
    if (!msg || typeof msg !== "object") return;

    switch (msg.type) {
      case "TELEMETRY_FRAME":
        this.lastTelemetry = msg;
        for (const listener of this.telemetryListeners) {
          listener(msg);
        }
        break;

      case "ANALYTICAL_TELEMETRY":
        for (const listener of this.analyticalListeners) {
          listener(msg);
        }
        break;

      case "WORKER_EVENT":
        for (const listener of this.eventListeners) {
          listener(msg);
        }
        break;

      case "WORKER_ERROR":
        this.notifyErrors(msg);
        break;

      case "STATE_CHANGED":
        this.notifyStateChange(msg.state, msg.previousState);
        break;

      case "SIM_COMMAND_ACK":
        if (msg.commandId && this.pendingCommands.has(msg.commandId)) {
          const pending = this.pendingCommands.get(msg.commandId)!;
          this.pendingCommands.delete(msg.commandId);
          pending.resolve();
        }
        break;
    }
  }

  private notifyErrors(err: WorkerErrorMessage): void {
    for (const listener of this.errorListeners) {
      listener(err);
    }
  }

  private notifyStateChange(state: WorkerLifecycleState, previousState: WorkerLifecycleState): void {
    this.state = state;
    for (const listener of this.stateListeners) {
      listener(state, previousState);
    }
  }

  private dispatchCommand(command: WorkerCommand): Promise<void> {
    const worker = this.ensureWorker();
    const commandId = `cmd_${++this.commandCounter}_${Date.now()}`;
    const messageWithId = { ...command, commandId } as WorkerCommand;

    return new Promise<void>((resolve, reject) => {
      this.pendingCommands.set(commandId, { resolve, reject });
      worker.postMessage(messageWithId);
    });
  }
}
