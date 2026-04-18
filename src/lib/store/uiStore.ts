"use client";

import { create } from "zustand";

type UiStore = {
  selectedScenarioId: string;
  showDebug: boolean;
  replayMode: boolean;
  replayPlaying: boolean;
  replayIndex: number;
  setScenarioId: (scenarioId: string) => void;
  toggleDebug: () => void;
  setReplayMode: (enabled: boolean) => void;
  setReplayPlaying: (enabled: boolean) => void;
  setReplayIndex: (index: number) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  selectedScenarioId: "steady-approach",
  showDebug: false,
  replayMode: false,
  replayPlaying: false,
  replayIndex: 0,
  setScenarioId: (selectedScenarioId) => set({ selectedScenarioId }),
  toggleDebug: () => set((state) => ({ showDebug: !state.showDebug })),
  setReplayMode: (replayMode) => set({ replayMode }),
  setReplayPlaying: (replayPlaying) => set({ replayPlaying }),
  setReplayIndex: (replayIndex) => set({ replayIndex }),
}));
