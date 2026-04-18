"use client";

import { create } from "zustand";

type UiStore = {
  selectedScenarioId: string;
  showDebug: boolean;
  replayMode: boolean;
  replayPlaying: boolean;
  replayIndex: number;
  /** When true, `SimulationWorld` stops advancing physics (marketing `/imgs` capture). */
  simFrozen: boolean;
  setScenarioId: (scenarioId: string) => void;
  toggleDebug: () => void;
  setReplayMode: (enabled: boolean) => void;
  setReplayPlaying: (enabled: boolean) => void;
  setReplayIndex: (index: number) => void;
  setSimFrozen: (frozen: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  selectedScenarioId: "steady-approach",
  showDebug: false,
  replayMode: false,
  replayPlaying: false,
  replayIndex: 0,
  simFrozen: false,
  setScenarioId: (selectedScenarioId) => set({ selectedScenarioId }),
  toggleDebug: () => set((state) => ({ showDebug: !state.showDebug })),
  setReplayMode: (replayMode) => set({ replayMode }),
  setReplayPlaying: (replayPlaying) => set({ replayPlaying }),
  setReplayIndex: (replayIndex) => set({ replayIndex }),
  setSimFrozen: (simFrozen) => set({ simFrozen }),
}));
