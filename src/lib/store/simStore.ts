"use client";

import { create } from "zustand";

import {
  EMPTY_COMMAND,
  EMPTY_ESTIMATE,
  EMPTY_METRICS,
  EMPTY_SAFETY,
  EMPTY_TRACKER,
  INITIAL_BOOM_STATE,
  RECEIVER_RECEPTACLE_LOCAL,
} from "@/lib/sim/constants";
import { worldFromLocalOffset } from "@/lib/sim/math";
import { getScenarioById } from "@/lib/sim/scenarios";
import type {
  LiveSimState,
  ReplaySample,
  ScenarioPreset,
  SensorFrame,
} from "@/lib/sim/types";

type PersistStatus = "idle" | "saving" | "saved" | "error";

type SimStore = {
  scenario: ScenarioPreset;
  live: LiveSimState;
  replaySamples: ReplaySample[];
  sensorFrame: SensorFrame | null;
  lastRecordedAt: number;
  persistStatus: PersistStatus;
  persistMessage: string | null;
  setScenarioById: (scenarioId: string) => void;
  resetScenario: (scenarioId?: string) => void;
  setLive: (live: LiveSimState) => void;
  pushReplaySample: (sample: ReplaySample) => void;
  setLastRecordedAt: (time: number) => void;
  setSensorFrame: (frame: SensorFrame) => void;
  setPersistStatus: (status: PersistStatus, message?: string | null) => void;
};

export function createInitialLiveState(scenarioId = "steady-approach"): LiveSimState {
  const scenario = getScenarioById(scenarioId);
  const receiverPose = scenario.receiverBasePose;
  const targetPosition = worldFromLocalOffset(
    receiverPose.position,
    receiverPose.rotation,
    RECEIVER_RECEPTACLE_LOCAL,
  );

  return {
    simTime: 0,
    frame: 0,
    receiverPose,
    targetPose: {
      position: targetPosition,
      rotation: receiverPose.rotation,
    },
    boom: INITIAL_BOOM_STATE,
    command: EMPTY_COMMAND,
    controllerState: "SEARCH",
    estimate: EMPTY_ESTIMATE,
    tracker: EMPTY_TRACKER,
    safety: EMPTY_SAFETY,
    metrics: EMPTY_METRICS,
    abortReason: null,
  };
}

export const useSimStore = create<SimStore>((set, get) => ({
  scenario: getScenarioById("steady-approach"),
  live: createInitialLiveState(),
  replaySamples: [],
  sensorFrame: null,
  lastRecordedAt: 0,
  persistStatus: "idle",
  persistMessage: null,
  setScenarioById: (scenarioId) => {
    const scenario = getScenarioById(scenarioId);
    set({
      scenario,
      live: createInitialLiveState(scenario.id),
      replaySamples: [],
      sensorFrame: null,
      lastRecordedAt: 0,
      persistStatus: "idle",
      persistMessage: null,
    });
  },
  resetScenario: (scenarioId) => {
    const activeId = scenarioId ?? get().scenario.id;
    const scenario = getScenarioById(activeId);
    set({
      scenario,
      live: createInitialLiveState(activeId),
      replaySamples: [],
      sensorFrame: null,
      lastRecordedAt: 0,
      persistStatus: "idle",
      persistMessage: null,
    });
  },
  setLive: (live) => set({ live }),
  pushReplaySample: (sample) =>
    set((state) => ({
      replaySamples: [...state.replaySamples.slice(-399), sample],
    })),
  setLastRecordedAt: (time) => set({ lastRecordedAt: time }),
  setSensorFrame: (frame) => set({ sensorFrame: frame }),
  setPersistStatus: (status, message = null) =>
    set({
      persistStatus: status,
      persistMessage: message,
    }),
}));
