"use client";

import type {
  AircraftCardId,
  CameraMode,
  ControllerState,
  EvaluationView,
  GamepadDeviceType,
  LiveSimState,
  ReplaySample,
  SensorViewportModality,
  SensorViewportSource,
  UploadedAutonomyManifest,
  ScenarioPreset,
} from "@/lib/sim/types";
import {
  DEFAULT_AIRCRAFT_CARD_ID,
  DEFAULT_CAMERA_MODE,
} from "@/lib/sim/autonomyCatalog";

const USER_PREFS_KEY = "boom:user-prefs:v1";
const RUN_SUMMARIES_KEY = "boom:run-summaries:v1";
const REPLAY_DB_NAME = "boom-replays:v1";
const REPLAY_STORE_NAME = "saved-replays";
const MAX_RUN_SUMMARIES = 12;

export type UserPrefs = {
  selectedScenarioId: string;
  selectedAircraftCardId: AircraftCardId;
  cameraMode: CameraMode;
  sensorViewportSource: SensorViewportSource;
  sensorViewportModality: SensorViewportModality;
  showDebug: boolean;
  evaluationView: EvaluationView;
  lastInputDevice: GamepadDeviceType;
  controllerHintsDismissed: boolean;
  lastAutonomyUpload: UploadedAutonomyManifest | null;
};

export type RunSummaryMetrics = {
  positionError: number;
  dockScore: number;
  confidence: number;
  abortReason: string | null;
};

export type SavedRunSummary = {
  id: string;
  scenarioId: string;
  scenarioName: string;
  status: ControllerState;
  durationSec: number;
  replayLength: number;
  completedAt: number;
  hasReplay: boolean;
  summary: RunSummaryMetrics;
};

export type SaveLocalRunSnapshotInput = {
  scenario: Pick<ScenarioPreset, "id" | "name">;
  state: Pick<LiveSimState, "controllerState" | "simTime" | "metrics" | "abortReason">;
  replaySamples: ReplaySample[];
  runId?: string;
};

export type SaveLocalRunSnapshotResult = {
  runId: string;
  hasReplay: boolean;
  message: string;
  summaries: SavedRunSummary[];
};

type ReplayArchiveRecord = {
  replaySamples: ReplaySample[];
  savedAt: number;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function requireLocalStorage() {
  const storage = getLocalStorage();
  if (!storage) {
    throw new Error("Local storage is unavailable in this browser.");
  }
  return storage;
}

function readJson(key: string): unknown | null {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function sortRunSummaries(summaries: SavedRunSummary[]) {
  return [...summaries]
    .sort((left, right) => right.completedAt - left.completedAt)
    .slice(0, MAX_RUN_SUMMARIES);
}

function parseUserPrefs(value: unknown): UserPrefs | null {
  if (!isObject(value)) {
    return null;
  }

  const {
    selectedScenarioId,
    selectedAircraftCardId,
    cameraMode,
    sensorViewportSource,
    sensorViewportModality,
    showDebug,
    evaluationView,
    lastInputDevice,
    controllerHintsDismissed,
  } = value;
  if (typeof selectedScenarioId !== "string" || typeof showDebug !== "boolean") {
    return null;
  }

  return {
    selectedScenarioId,
    selectedAircraftCardId:
      typeof selectedAircraftCardId === "string"
        ? (selectedAircraftCardId as AircraftCardId)
        : DEFAULT_AIRCRAFT_CARD_ID,
    cameraMode:
      cameraMode === "manual" || cameraMode === "receiver-lock" || cameraMode === "dock-lock"
        ? (cameraMode as CameraMode)
        : DEFAULT_CAMERA_MODE,
    sensorViewportSource:
      sensorViewportSource === "auto" ||
      sensorViewportSource === "tail-acq-left" ||
      sensorViewportSource === "tail-acq-right" ||
      sensorViewportSource === "boom-term-left" ||
      sensorViewportSource === "boom-term-right"
        ? (sensorViewportSource as SensorViewportSource)
        : "auto",
    sensorViewportModality:
      sensorViewportModality === "auto" ||
      sensorViewportModality === "visible" ||
      sensorViewportModality === "thermal"
        ? (sensorViewportModality as SensorViewportModality)
        : "auto",
    showDebug,
    evaluationView:
      evaluationView === "baseline" || evaluationView === "uploaded" || evaluationView === "overlay"
        ? (evaluationView as EvaluationView)
        : "baseline",
    lastInputDevice:
      lastInputDevice === "xbox" ||
      lastInputDevice === "standard-gamepad" ||
      lastInputDevice === "none"
        ? (lastInputDevice as GamepadDeviceType)
        : "none",
    controllerHintsDismissed:
      typeof controllerHintsDismissed === "boolean" ? controllerHintsDismissed : false,
    lastAutonomyUpload: parseUploadedAutonomyManifest(value.lastAutonomyUpload),
  };
}

function parseUploadedAutonomyManifest(value: unknown): UploadedAutonomyManifest | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!isObject(value)) {
    return null;
  }

  const { controllerName, controllerSource, missionName, missionJson, uploadedAt } = value;

  if (
    !(typeof controllerName === "string" || controllerName === null || controllerName === undefined) ||
    !(typeof controllerSource === "string" || controllerSource === null || controllerSource === undefined) ||
    !(typeof missionName === "string" || missionName === null || missionName === undefined) ||
    !(typeof missionJson === "string" || missionJson === null || missionJson === undefined) ||
    !(isFiniteNumber(uploadedAt) || uploadedAt === null || uploadedAt === undefined)
  ) {
    return null;
  }

  return {
    controllerName: typeof controllerName === "string" ? controllerName : null,
    controllerSource: typeof controllerSource === "string" ? controllerSource : null,
    missionName: typeof missionName === "string" ? missionName : null,
    missionJson: typeof missionJson === "string" ? missionJson : null,
    uploadedAt: isFiniteNumber(uploadedAt) ? uploadedAt : null,
  };
}

function parseRunSummaryMetrics(value: unknown): RunSummaryMetrics | null {
  if (!isObject(value)) {
    return null;
  }

  const { positionError, dockScore, confidence, abortReason } = value;
  if (
    !isFiniteNumber(positionError) ||
    !isFiniteNumber(dockScore) ||
    !isFiniteNumber(confidence) ||
    !(typeof abortReason === "string" || abortReason === null)
  ) {
    return null;
  }

  return {
    positionError,
    dockScore,
    confidence,
    abortReason,
  };
}

function parseRunSummary(value: unknown): SavedRunSummary | null {
  if (!isObject(value)) {
    return null;
  }

  const summary = parseRunSummaryMetrics(value.summary);
  if (!summary) {
    return null;
  }

  const {
    id,
    scenarioId,
    scenarioName,
    status,
    durationSec,
    replayLength,
    completedAt,
    hasReplay,
  } = value;

  if (
    typeof id !== "string" ||
    typeof scenarioId !== "string" ||
    typeof scenarioName !== "string" ||
    typeof status !== "string" ||
    !isFiniteNumber(durationSec) ||
    !isFiniteNumber(replayLength) ||
    !isFiniteNumber(completedAt) ||
    typeof hasReplay !== "boolean"
  ) {
    return null;
  }

  return {
    id,
    scenarioId,
    scenarioName,
    status: status as ControllerState,
    durationSec,
    replayLength,
    completedAt,
    hasReplay,
    summary,
  };
}

export function createRunId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `run-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function loadUserPrefs() {
  return parseUserPrefs(readJson(USER_PREFS_KEY));
}

export function saveUserPrefs(prefs: UserPrefs) {
  const storage = requireLocalStorage();
  storage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
}

export function listRunSummaries() {
  const raw = readJson(RUN_SUMMARIES_KEY);
  if (!Array.isArray(raw)) {
    return [] as SavedRunSummary[];
  }

  return sortRunSummaries(raw.map(parseRunSummary).filter((value): value is SavedRunSummary => value !== null));
}

export function saveRunSummary(summary: SavedRunSummary) {
  const storage = requireLocalStorage();
  const current = listRunSummaries().filter((row) => row.id !== summary.id);
  const next = sortRunSummaries([summary, ...current]);
  storage.setItem(RUN_SUMMARIES_KEY, JSON.stringify(next));
  return next;
}

export async function saveLocalRunSnapshot({
  scenario,
  state,
  replaySamples,
  runId = createRunId(),
}: SaveLocalRunSnapshotInput): Promise<SaveLocalRunSnapshotResult> {
  let hasReplay = false;
  let replayWarning: string | null = null;

  try {
    await saveReplay(runId, replaySamples);
    hasReplay = true;
  } catch (error) {
    replayWarning = error instanceof Error ? error.message : "Replay archive unavailable.";
  }

  const summaries = saveRunSummary({
    id: runId,
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    status: state.controllerState,
    durationSec: Number(state.simTime.toFixed(2)),
    replayLength: replaySamples.length,
    completedAt: Date.now(),
    hasReplay,
    summary: {
      positionError: Number(state.metrics.positionError.toFixed(3)),
      dockScore: Number(state.metrics.dockScore.toFixed(3)),
      confidence: Number(state.metrics.confidence.toFixed(3)),
      abortReason: state.abortReason,
    },
  });

  const message = hasReplay
    ? "Saved locally with replay archive."
    : replayWarning
      ? `Saved summary locally. ${replayWarning}`
      : "Saved summary locally.";

  return {
    runId,
    hasReplay,
    message,
    summaries,
  };
}

async function openReplayDb() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("Replay archive is unavailable in this browser.");
  }

  return await new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(REPLAY_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(REPLAY_STORE_NAME)) {
        db.createObjectStore(REPLAY_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open replay archive."));
  });
}

export async function saveReplay(runId: string, replaySamples: ReplaySample[]) {
  const db = await openReplayDb();

  return await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(REPLAY_STORE_NAME, "readwrite");

    tx.oncomplete = () => {
      db.close();
      resolve();
    };

    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("Unable to save replay archive."));
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Unable to save replay archive."));
    };

    tx.objectStore(REPLAY_STORE_NAME).put(
      {
        replaySamples,
        savedAt: Date.now(),
      } satisfies ReplayArchiveRecord,
      runId,
    );
  });
}

export async function loadReplay(runId: string) {
  const db = await openReplayDb();

  return await new Promise<ReplaySample[] | null>((resolve, reject) => {
    const tx = db.transaction(REPLAY_STORE_NAME, "readonly");
    const request = tx.objectStore(REPLAY_STORE_NAME).get(runId);

    request.onsuccess = () => {
      const record = request.result as ReplayArchiveRecord | undefined;
      resolve(Array.isArray(record?.replaySamples) ? record.replaySamples : null);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Unable to load replay archive."));
    };

    tx.oncomplete = () => {
      db.close();
    };

    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("Unable to load replay archive."));
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Unable to load replay archive."));
    };
  });
}
