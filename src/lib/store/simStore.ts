"use client";

import { create } from "zustand";

import { buildPathlightLiveState } from "@/lib/sim/pathlightEngine";
import { getScenarioById } from "@/lib/sim/scenarios";
import type {
  AutonomyEvaluationBundle,
  LiveSimState,
  ReplaySample,
  ScenarioPreset,
  SensorFrame,
  UploadedAutonomyManifest,
} from "@/lib/sim/types";
import { useUiStore } from "@/lib/store/uiStore";

type PersistStatus = "idle" | "saving" | "saved" | "error";

type SimStore = {
  scenario: ScenarioPreset;
  live: LiveSimState;
  replaySamples: ReplaySample[];
  plannedRunSamples: ReplaySample[];
  autonomyEvaluation: AutonomyEvaluationBundle | null;
  lastAutonomyUpload: UploadedAutonomyManifest | null;
  sensorFrame: SensorFrame | null;
  lastRecordedAt: number;
  persistStatus: PersistStatus;
  persistMessage: string | null;
  setScenarioById: (scenarioId: string) => void;
  resetScenario: (scenarioId?: string) => void;
  setLive: (live: LiveSimState) => void;
  setReplaySamples: (samples: ReplaySample[]) => void;
  setPlannedRunSamples: (samples: ReplaySample[]) => void;
  pushReplaySample: (sample: ReplaySample) => void;
  setAutonomyEvaluation: (bundle: AutonomyEvaluationBundle | null) => void;
  setLastAutonomyUpload: (manifest: UploadedAutonomyManifest | null) => void;
  setLastRecordedAt: (time: number) => void;
  setSensorFrame: (frame: SensorFrame) => void;
  setPersistStatus: (status: PersistStatus, message?: string | null) => void;
};

export function createInitialLiveState(scenarioId = "steady-approach"): LiveSimState {
  const scenario = getScenarioById(scenarioId);
  const profileId = useUiStore.getState().selectedAircraftCardId;
  const seeded = buildPathlightLiveState({
    scenario,
    profileId,
  });
  return seeded.live;
}

export const useSimStore = create<SimStore>((set, get) => ({
  scenario: getScenarioById("steady-approach"),
  live: createInitialLiveState(),
  replaySamples: [],
  plannedRunSamples: buildPathlightLiveState({
    scenario: getScenarioById("steady-approach"),
    profileId: useUiStore.getState().selectedAircraftCardId,
  }).sessionPlan,
  autonomyEvaluation: buildPathlightLiveState({
    scenario: getScenarioById("steady-approach"),
    profileId: useUiStore.getState().selectedAircraftCardId,
  }).comparison,
  lastAutonomyUpload: null,
  sensorFrame: null,
  lastRecordedAt: 0,
  persistStatus: "idle",
  persistMessage: null,
  setScenarioById: (scenarioId) => {
    const scenario = getScenarioById(scenarioId);
    const profileId = useUiStore.getState().selectedAircraftCardId;
    const seeded = buildPathlightLiveState({
      scenario,
      profileId,
    });
    set({
      scenario,
      live: seeded.live,
      replaySamples: [],
      plannedRunSamples: seeded.sessionPlan,
      autonomyEvaluation: seeded.comparison,
      lastAutonomyUpload: get().lastAutonomyUpload,
      sensorFrame: null,
      lastRecordedAt: 0,
      persistStatus: "idle",
      persistMessage: null,
    });
  },
  resetScenario: (scenarioId) => {
    const activeId = scenarioId ?? get().scenario.id;
    const scenario = getScenarioById(activeId);
    const profileId = useUiStore.getState().selectedAircraftCardId;
    const seeded = buildPathlightLiveState({
      scenario,
      profileId,
    });
    set({
      scenario,
      live: seeded.live,
      replaySamples: [],
      plannedRunSamples: seeded.sessionPlan,
      autonomyEvaluation: seeded.comparison,
      lastAutonomyUpload: get().lastAutonomyUpload,
      sensorFrame: null,
      lastRecordedAt: 0,
      persistStatus: "idle",
      persistMessage: null,
    });
  },
  setLive: (live) => set({ live }),
  setReplaySamples: (replaySamples) => set({ replaySamples }),
  setPlannedRunSamples: (plannedRunSamples) => set({ plannedRunSamples }),
  pushReplaySample: (sample) =>
    set((state) => ({
      replaySamples: [...state.replaySamples.slice(-399), sample],
    })),
  setAutonomyEvaluation: (autonomyEvaluation) => set({ autonomyEvaluation }),
  setLastAutonomyUpload: (lastAutonomyUpload) => set({ lastAutonomyUpload }),
  setLastRecordedAt: (time) => set({ lastRecordedAt: time }),
  setSensorFrame: (frame) => set({ sensorFrame: frame }),
  setPersistStatus: (status, message = null) =>
    set({
      persistStatus: status,
      persistMessage: message,
    }),
}));
