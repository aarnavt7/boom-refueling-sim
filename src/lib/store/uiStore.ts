"use client";

import { create } from "zustand";

import {
  DEFAULT_AIRCRAFT_CARD_ID,
  DEFAULT_CAMERA_MODE,
} from "@/lib/sim/autonomyCatalog";
import {
  DEFAULT_LIVE_RUN_RATE,
  stepLiveRunRate as getSteppedLiveRunRate,
  type LiveRunRate,
} from "@/lib/sim/runRate";
import type {
  AircraftCardId,
  CameraMode,
  EvaluationView,
  ReplayDataSource,
  SensorViewportModality,
  SensorViewportSource,
} from "@/lib/sim/types";

export type LiveRunState = "stopped" | "running" | "paused";

type UiStore = {
  selectedScenarioId: string;
  selectedAircraftCardId: AircraftCardId;
  cameraMode: CameraMode;
  sensorViewportSource: SensorViewportSource;
  sensorViewportModality: SensorViewportModality;
  showDebug: boolean;
  liveRunState: LiveRunState;
  liveRunRate: LiveRunRate;
  replayMode: boolean;
  replayDataSource: ReplayDataSource;
  evaluationView: EvaluationView;
  replayPlaying: boolean;
  replayIndex: number;
  manualAbort: boolean;
  /** When true, `SimulationWorld` stops advancing physics (marketing `/imgs` capture). */
  simFrozen: boolean;
  setScenarioId: (scenarioId: string) => void;
  setSelectedAircraftCardId: (aircraftCardId: AircraftCardId) => void;
  setCameraMode: (cameraMode: CameraMode) => void;
  setSensorViewportSource: (source: SensorViewportSource) => void;
  setSensorViewportModality: (modality: SensorViewportModality) => void;
  setShowDebug: (showDebug: boolean) => void;
  toggleDebug: () => void;
  setLiveRunState: (state: LiveRunState) => void;
  startLiveRun: () => void;
  pauseLiveRun: () => void;
  stopLiveRun: () => void;
  setLiveRunRate: (rate: LiveRunRate) => void;
  stepLiveRunRate: (direction: -1 | 1) => void;
  setReplayMode: (enabled: boolean) => void;
  setReplayDataSource: (source: ReplayDataSource) => void;
  setEvaluationView: (view: EvaluationView) => void;
  setReplayPlaying: (enabled: boolean) => void;
  setReplayIndex: (index: number) => void;
  requestManualAbort: () => void;
  clearManualAbort: () => void;
  setSimFrozen: (frozen: boolean) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  selectedScenarioId: "steady-approach",
  selectedAircraftCardId: DEFAULT_AIRCRAFT_CARD_ID,
  cameraMode: DEFAULT_CAMERA_MODE,
  sensorViewportSource: "auto",
  sensorViewportModality: "auto",
  showDebug: false,
  liveRunState: "stopped",
  liveRunRate: DEFAULT_LIVE_RUN_RATE,
  replayMode: false,
  replayDataSource: "session",
  evaluationView: "baseline",
  replayPlaying: false,
  replayIndex: 0,
  manualAbort: false,
  simFrozen: false,
  setScenarioId: (selectedScenarioId) => set({ selectedScenarioId }),
  setSelectedAircraftCardId: (selectedAircraftCardId) => set({ selectedAircraftCardId }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setSensorViewportSource: (sensorViewportSource) => set({ sensorViewportSource }),
  setSensorViewportModality: (sensorViewportModality) => set({ sensorViewportModality }),
  setShowDebug: (showDebug) => set({ showDebug }),
  toggleDebug: () => set((state) => ({ showDebug: !state.showDebug })),
  setLiveRunState: (liveRunState) => set({ liveRunState }),
  startLiveRun: () => set({ liveRunState: "running" }),
  pauseLiveRun: () => set({ liveRunState: "paused" }),
  stopLiveRun: () => set({ liveRunState: "stopped" }),
  setLiveRunRate: (liveRunRate) => set({ liveRunRate }),
  stepLiveRunRate: (direction) =>
    set((state) => ({
      liveRunRate: getSteppedLiveRunRate(state.liveRunRate, direction),
    })),
  setReplayMode: (replayMode) => set({ replayMode }),
  setReplayDataSource: (replayDataSource) => set({ replayDataSource }),
  setEvaluationView: (evaluationView) => set({ evaluationView }),
  setReplayPlaying: (replayPlaying) => set({ replayPlaying }),
  setReplayIndex: (replayIndex) => set({ replayIndex }),
  requestManualAbort: () => set({ manualAbort: true }),
  clearManualAbort: () => set({ manualAbort: false }),
  setSimFrozen: (simFrozen) => set({ simFrozen }),
}));
