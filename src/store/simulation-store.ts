/**
 * PULSAR-X: Store Domain
 * Simulation Lifecycle, Configuration, and Worker Command Bridge.
 */

import { create } from "zustand";
import { SimulationClient } from "../workers/simulation-client";
import type { WorkerLifecycleState, SimulationFault } from "../workers/protocol";
import { useTelemetryStore } from "./telemetry-store";

interface SimulationStoreState {
  client: SimulationClient | null;
  lifecycleState: WorkerLifecycleState;
  playbackMultiplier: number;
  activeScenarioId: string;
  isInitialized: boolean;

  // Actions
  setupClient: () => Promise<void>;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  step: (count?: number) => Promise<void>;
  setPlayback: (multiplier: number) => Promise<void>;
  reset: () => Promise<void>;
  injectFault: (fault: SimulationFault) => Promise<void>;
  setScenario: (scenarioId: string) => Promise<void>;
}

export const useSimulationStore = create<SimulationStoreState>((set, get) => ({
  client: null,
  lifecycleState: "UNINITIALIZED",
  playbackMultiplier: 1.0,
  activeScenarioId: "scenario-a",
  isInitialized: false,

  setupClient: async () => {
    let client = get().client;
    if (!client) {
      client = new SimulationClient();
      set({ client });

      // Bind telemetry and events to telemetry store
      client.onTelemetry((frame) => {
        useTelemetryStore.getState().updateTelemetry(frame);
      });

      client.onAnalyticalTelemetry((data) => {
        useTelemetryStore.getState().updateAnalytical(data);
      });

      client.onEvent((evt) => {
        useTelemetryStore.getState().pushEvent(evt);
      });

      client.onStateChange((state) => {
        set({ lifecycleState: state });
      });
    }

    await client.init({
      scenarioId: get().activeScenarioId,
      seed: 193721,
      playbackMultiplier: get().playbackMultiplier,
    });

    set({ isInitialized: true, lifecycleState: client.getState() });
  },

  start: async () => {
    const client = get().client;
    if (client) {
      await client.start();
    }
  },

  pause: async () => {
    const client = get().client;
    if (client) {
      await client.pause();
    }
  },

  resume: async () => {
    const client = get().client;
    if (client) {
      await client.resume();
    }
  },

  step: async (count = 1) => {
    const client = get().client;
    if (client) {
      await client.step(count);
    }
  },

  setPlayback: async (multiplier: number) => {
    set({ playbackMultiplier: multiplier });
    const client = get().client;
    if (client) {
      await client.setPlayback(multiplier);
    }
  },

  reset: async () => {
    const client = get().client;
    if (client) {
      await client.reset();
    }
  },

  injectFault: async (fault: SimulationFault) => {
    const client = get().client;
    if (client) {
      await client.injectFault(fault);
    }
  },

  setScenario: async (scenarioId: string) => {
    set({ activeScenarioId: scenarioId });
    const client = get().client;
    if (client) {
      await client.init({ scenarioId, seed: 193721 });
    }
  },
}));
