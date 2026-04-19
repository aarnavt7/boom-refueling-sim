"use client";

import { create } from "zustand";

import {
  EMPTY_COMMAND,
  EMPTY_ESTIMATE,
  EMPTY_METRICS,
  EMPTY_SAFETY,
  EMPTY_TRACKER,
  EMPTY_AUTOPILOT_COMMAND,
  INITIAL_BOOM_STATE,
} from "@/lib/sim/constants";
import { getReceiverReceptacleWorld } from "@/lib/sim/aircraftAttachments";
import { sampleReceiverPose } from "@/lib/sim/motion";
import { getScenarioById } from "@/lib/sim/scenarios";
import type {
  AutonomyEvaluationBundle,
  LiveSimState,
  ReplaySample,
  ScenarioPreset,
  SensorFrame,
  UploadedAutonomyManifest,
} from "@/lib/sim/types";

type PersistStatus = "idle" | "saving" | "saved" | "error";

type SimStore = {
  scenario: ScenarioPreset;
  live: LiveSimState;
  replaySamples: ReplaySample[];
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
  pushReplaySample: (sample: ReplaySample) => void;
  setAutonomyEvaluation: (bundle: AutonomyEvaluationBundle | null) => void;
  setLastAutonomyUpload: (manifest: UploadedAutonomyManifest | null) => void;
  setLastRecordedAt: (time: number) => void;
  setSensorFrame: (frame: SensorFrame) => void;
  setPersistStatus: (status: PersistStatus, message?: string | null) => void;
};

export function createInitialLiveState(scenarioId = "steady-approach"): LiveSimState {
  const scenario = getScenarioById(scenarioId);
  const receiverPose = sampleReceiverPose(0, scenario);
  const targetPosition = getReceiverReceptacleWorld(receiverPose);

  return {
    simTime: 0,
    frame: 0,
    receiverPose,
    targetPose: {
      position: targetPosition,
      rotation: receiverPose.rotation,
    },
    boom: INITIAL_BOOM_STATE,
    autopilotCommand: EMPTY_AUTOPILOT_COMMAND,
    command: EMPTY_COMMAND,
    controllerState: "SEARCH",
    sensorObservations: [EMPTY_ESTIMATE],
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
  autonomyEvaluation: null,
  lastAutonomyUpload: null,
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
      autonomyEvaluation: null,
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
    set({
      scenario,
      live: createInitialLiveState(activeId),
      replaySamples: [],
      autonomyEvaluation: null,
      lastAutonomyUpload: get().lastAutonomyUpload,
      sensorFrame: null,
      lastRecordedAt: 0,
      persistStatus: "idle",
      persistMessage: null,
    });
  },
  setLive: (live) => set({ live }),
  setReplaySamples: (replaySamples) => set({ replaySamples }),
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
