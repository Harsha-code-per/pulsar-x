/**
 * PULSAR-X: Store Domain
 * Cinematic Store: State synchronization for Director, HUD, and Presentation Layer.
 */

import { create } from "zustand";
import type { DirectorState } from "../cinematic/director/DirectorState";

interface CinematicStoreState {
  directorState: DirectorState;
  activeSceneIndex: number;
  activeShotIndex: number;
  playhead_s: number;
  totalDuration_s: number;
  timelineProgress: number; // [0, 1]
  activeCaptions: readonly string[];
  activeAlert: string | null;
  isPresentationMode: boolean;
  isDirectorActive: boolean;
  isMuted: boolean;
  volume: number;
  playbackSpeed: number;

  // Actions
  setDirectorState: (state: DirectorState) => void;
  setActiveSceneIndex: (index: number) => void;
  setActiveShotIndex: (index: number) => void;
  setPlayhead: (time_s: number, total_s: number) => void;
  setCaptions: (captions: readonly string[]) => void;
  setAlert: (alert: string | null) => void;
  setPresentationMode: (active: boolean) => void;
  setDirectorActive: (active: boolean) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setPlaybackSpeed: (speed: number) => void;
}

export const useCinematicStore = create<CinematicStoreState>((set) => ({
  directorState: "IDLE",
  activeSceneIndex: 0,
  activeShotIndex: 0,
  playhead_s: 0.0,
  totalDuration_s: 0.0,
  timelineProgress: 0.0,
  activeCaptions: [],
  activeAlert: null,
  isPresentationMode: false,
  isDirectorActive: false,
  isMuted: false,
  volume: 0.8,
  playbackSpeed: 1.0,

  setDirectorState: (state) => set({ directorState: state }),
  setActiveSceneIndex: (index) => set({ activeSceneIndex: index }),
  setActiveShotIndex: (index) => set({ activeShotIndex: index }),
  setPlayhead: (time_s, total_s) =>
    set({
      playhead_s: time_s,
      totalDuration_s: total_s,
      timelineProgress: total_s > 0 ? Math.min(1.0, time_s / total_s) : 0.0,
    }),
  setCaptions: (captions) => set({ activeCaptions: captions }),
  setAlert: (alert) => set({ activeAlert: alert }),
  setPresentationMode: (active) => set({ isPresentationMode: active }),
  setDirectorActive: (active) => set({ isDirectorActive: active }),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
}));
