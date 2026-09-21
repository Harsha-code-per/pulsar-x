/**
 * PULSAR-X: Store Domain
 * Ring-Buffered Telemetry Snapshot Store for 3D Visualizer and HUDs.
 */

import { create } from "zustand";
import type {
  WorkerTelemetryFrame,
  WorkerAnalyticalTelemetry,
  WorkerEventMessage,
} from "../workers/telemetry";
import { TelemetryAdapter } from "../rendering/adapter/telemetry-adapter";

interface TelemetryStoreState {
  latestFrame: WorkerTelemetryFrame | null;
  analyticalData: WorkerAnalyticalTelemetry | null;
  recentEvents: WorkerEventMessage[];
  telemetryRateHz: number;
  adapter: TelemetryAdapter;

  // Actions
  updateTelemetry: (frame: WorkerTelemetryFrame) => void;
  updateAnalytical: (data: WorkerAnalyticalTelemetry) => void;
  pushEvent: (event: WorkerEventMessage) => void;
}

let lastTelemetryTimeMs = 0;
let frameCounter = 0;
let currentRate = 0;

export const useTelemetryStore = create<TelemetryStoreState>((set, get) => {
  const adapter = new TelemetryAdapter();

  return {
    latestFrame: null,
    analyticalData: null,
    recentEvents: [],
    telemetryRateHz: 0,
    adapter,

    updateTelemetry: (frame: WorkerTelemetryFrame) => {
      adapter.pushFrame(frame);

      // Estimate incoming telemetry frequency
      const now = Date.now();
      frameCounter++;
      if (now - lastTelemetryTimeMs >= 1000) {
        currentRate = Math.round((frameCounter * 1000) / (now - lastTelemetryTimeMs));
        frameCounter = 0;
        lastTelemetryTimeMs = now;
      }

      set({
        latestFrame: frame,
        telemetryRateHz: currentRate,
      });
    },

    updateAnalytical: (data: WorkerAnalyticalTelemetry) => {
      set({ analyticalData: data });
    },

    pushEvent: (event: WorkerEventMessage) => {
      const events = [event, ...get().recentEvents].slice(0, 50); // Keep last 50 events
      set({ recentEvents: events });
    },
  };
});
