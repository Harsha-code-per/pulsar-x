/**
 * PULSAR-X: Cinematic Domain - Audio Subsystem
 * AudioState: Reactive Zustand Store for Audio Telemetry and UI HUD Bindings.
 */

import { create } from "zustand";
import type { AudioBusType, AudioContextStatus, AudioStateSnapshot } from "./audioTypes";

interface AudioStoreState extends AudioStateSnapshot {
  setUnlocked: (unlocked: boolean) => void;
  setContextState: (status: AudioContextStatus) => void;
  setMuted: (muted: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setBusGain: (bus: AudioBusType, gain: number) => void;
  setActiveSceneId: (sceneId: number) => void;
  setActiveSourcesCount: (count: number) => void;
}

const initialBusGains: Record<AudioBusType, number> = {
  MASTER: 0.8,
  AMBIENCE: 0.3,
  SPACECRAFT: 0.5,
  PULSAR: 0.0,
  TELEMETRY: 0.4,
  ALERT: 0.0,
  CINEMATIC: 0.0,
};

export const useAudioStore = create<AudioStoreState>((set) => ({
  unlocked: false,
  contextState: "uninitialized",
  isMuted: false,
  masterVolume: 0.8,
  busGains: initialBusGains,
  activeSourcesCount: 0,
  activeSceneId: 1,

  setUnlocked: (unlocked) => set({ unlocked }),
  setContextState: (status) => set({ contextState: status }),
  setMuted: (muted) => set({ isMuted: muted }),
  setMasterVolume: (vol) => set({ masterVolume: Math.max(0, Math.min(1.0, vol)) }),
  setBusGain: (bus, gain) =>
    set((state) => ({
      busGains: {
        ...state.busGains,
        [bus]: Math.max(0, Math.min(2.0, gain)),
      },
    })),
  setActiveSceneId: (sceneId) => set({ activeSceneId: sceneId }),
  setActiveSourcesCount: (count) => set({ activeSourcesCount: count }),
}));
