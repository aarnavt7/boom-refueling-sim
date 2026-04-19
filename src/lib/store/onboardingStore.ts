"use client";

import { create } from "zustand";

import {
  isGuidedRunStageId,
  type GuidedRunStageId,
} from "@/lib/onboarding/guidedRunConfig";
import {
  FIRST_ORIENTATION_TOUR_STEP_ID,
  isOrientationTourStepId,
  type OrientationTourStepId,
} from "@/lib/onboarding/tourConfig";

export const ONBOARDING_VERSION = 4;
export const ONBOARDING_STORAGE_KEY = "boom.sim.onboarding";

export type OnboardingStatus =
  | "idle"
  | "welcome"
  | "tour"
  | "guided-run"
  | "replay-debrief"
  | "completed";

export type OnboardingChecklistId =
  | "guided-run"
  | "controller-docked"
  | "replay-scrubbed"
  | "run-saved"
  | "harder-scenario";

export type OnboardingChecklistItem = {
  id: OnboardingChecklistId;
  label: string;
  completed: boolean;
};

type PersistedOnboardingState = {
  version: number;
  status: OnboardingStatus;
  completedChecklistIds: OnboardingChecklistId[];
  isOpen: boolean;
  isDismissed: boolean;
  hasCompleted: boolean;
  allowOrbitControls: boolean;
  hasSeenWelcome: boolean;
  tourStepIndex: number;
  tourCurrentStepId: OrientationTourStepId | null;
  hasCompletedWelcome: boolean;
  hasCompletedOrientationTour: boolean;
  phase2DismissedAt: number | null;
  guidedRunStage: GuidedRunStageId | null;
  hasCompletedGuidedRun: boolean;
  hasCompletedReplayDebrief: boolean;
  autoSavedRunId: string | null;
  hasConsumedFirstPhase3Autostart: boolean;
};

type OnboardingStore = {
  version: number;
  status: OnboardingStatus;
  checklist: OnboardingChecklistItem[];
  isOpen: boolean;
  isDismissed: boolean;
  hasCompleted: boolean;
  allowOrbitControls: boolean;
  hasSeenWelcome: boolean;
  hasHydrated: boolean;
  tourStepIndex: number;
  tourCurrentStepId: OrientationTourStepId | null;
  hasCompletedWelcome: boolean;
  hasCompletedOrientationTour: boolean;
  phase2DismissedAt: number | null;
  guidedRunStage: GuidedRunStageId | null;
  hasCompletedGuidedRun: boolean;
  hasCompletedReplayDebrief: boolean;
  autoSavedRunId: string | null;
  hasConsumedFirstPhase3Autostart: boolean;
  hydrateFromStorage: () => void;
  startWelcome: () => void;
  startOrientationTour: () => void;
  resumeOrientationTour: () => void;
  setTourProgress: (stepIndex: number, stepId: OrientationTourStepId | null) => void;
  dismissOrientationTour: () => void;
  completeOrientationTour: () => void;
  startGuidedRun: () => void;
  resumeGuidedRun: () => void;
  setGuidedRunStage: (stage: GuidedRunStageId | null) => void;
  beginReplayDebrief: () => void;
  completeReplayDebrief: () => void;
  recordAutoSavedRun: (runId: string) => void;
  completePhase3: () => void;
  skipOnboarding: () => void;
  openPanel: () => void;
  closePanel: () => void;
  completeChecklistItem: (id: OnboardingChecklistId) => void;
  setStatus: (status: OnboardingStatus) => void;
  setAllowOrbitControls: (enabled: boolean) => void;
  markCompleted: () => void;
  resetOnboarding: () => void;
};

const DEFAULT_CHECKLIST: ReadonlyArray<Omit<OnboardingChecklistItem, "completed">> = [
  { id: "guided-run", label: "Watch a guided docking run" },
  { id: "controller-docked", label: "See the controller reach DOCKED" },
  { id: "replay-scrubbed", label: "Open replay and scrub the timeline" },
  { id: "run-saved", label: "Save your first run" },
  { id: "harder-scenario", label: "Try a harder scenario" },
];

function getAllChecklistIds(): OnboardingChecklistId[] {
  return DEFAULT_CHECKLIST.map((item) => item.id);
}

function createChecklist(completedIds: readonly OnboardingChecklistId[] = []) {
  const completedSet = new Set(completedIds);
  return DEFAULT_CHECKLIST.map((item) => ({
    ...item,
    completed: completedSet.has(item.id),
  }));
}

function createDefaultState() {
  return {
    version: ONBOARDING_VERSION,
    status: "welcome" as const,
    checklist: createChecklist(),
    isOpen: false,
    isDismissed: false,
    hasCompleted: false,
    allowOrbitControls: true,
    hasSeenWelcome: false,
    tourStepIndex: 0,
    tourCurrentStepId: null,
    hasCompletedWelcome: false,
    hasCompletedOrientationTour: false,
    phase2DismissedAt: null,
    guidedRunStage: null,
    hasCompletedGuidedRun: false,
    hasCompletedReplayDebrief: false,
    autoSavedRunId: null,
    hasConsumedFirstPhase3Autostart: false,
  };
}

function isOnboardingStatus(value: unknown): value is OnboardingStatus {
  return (
    value === "idle" ||
    value === "welcome" ||
    value === "tour" ||
    value === "guided-run" ||
    value === "replay-debrief" ||
    value === "completed"
  );
}

function isChecklistId(value: unknown): value is OnboardingChecklistId {
  return typeof value === "string" && getAllChecklistIds().includes(value as OnboardingChecklistId);
}

function readPersistedOnboardingState(): PersistedOnboardingState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedOnboardingState>;
    const completedChecklistIds = Array.isArray(parsed.completedChecklistIds)
      ? parsed.completedChecklistIds.filter(isChecklistId)
      : [];

    return {
      version: typeof parsed.version === "number" ? parsed.version : 0,
      status: isOnboardingStatus(parsed.status) ? parsed.status : "idle",
      completedChecklistIds,
      isOpen: typeof parsed.isOpen === "boolean" ? parsed.isOpen : true,
      isDismissed: typeof parsed.isDismissed === "boolean" ? parsed.isDismissed : false,
      hasCompleted: typeof parsed.hasCompleted === "boolean" ? parsed.hasCompleted : false,
      allowOrbitControls:
        typeof parsed.allowOrbitControls === "boolean" ? parsed.allowOrbitControls : true,
      hasSeenWelcome: typeof parsed.hasSeenWelcome === "boolean" ? parsed.hasSeenWelcome : false,
      tourStepIndex:
        typeof parsed.tourStepIndex === "number" && Number.isFinite(parsed.tourStepIndex)
          ? Math.max(0, Math.floor(parsed.tourStepIndex))
          : 0,
      tourCurrentStepId: isOrientationTourStepId(parsed.tourCurrentStepId)
        ? parsed.tourCurrentStepId
        : null,
      hasCompletedWelcome:
        typeof parsed.hasCompletedWelcome === "boolean" ? parsed.hasCompletedWelcome : false,
      hasCompletedOrientationTour:
        typeof parsed.hasCompletedOrientationTour === "boolean"
          ? parsed.hasCompletedOrientationTour
          : false,
      phase2DismissedAt:
        typeof parsed.phase2DismissedAt === "number" && Number.isFinite(parsed.phase2DismissedAt)
          ? parsed.phase2DismissedAt
          : null,
      guidedRunStage: isGuidedRunStageId(parsed.guidedRunStage) ? parsed.guidedRunStage : null,
      hasCompletedGuidedRun:
        typeof parsed.hasCompletedGuidedRun === "boolean" ? parsed.hasCompletedGuidedRun : false,
      hasCompletedReplayDebrief:
        typeof parsed.hasCompletedReplayDebrief === "boolean"
          ? parsed.hasCompletedReplayDebrief
          : false,
      autoSavedRunId: typeof parsed.autoSavedRunId === "string" ? parsed.autoSavedRunId : null,
      hasConsumedFirstPhase3Autostart:
        typeof parsed.hasConsumedFirstPhase3Autostart === "boolean"
          ? parsed.hasConsumedFirstPhase3Autostart
          : false,
    };
  } catch {
    return null;
  }
}

function createPersistedOnboardingState(
  state: Pick<
    OnboardingStore,
    | "version"
    | "status"
    | "checklist"
    | "isOpen"
    | "isDismissed"
    | "hasCompleted"
    | "allowOrbitControls"
    | "hasSeenWelcome"
    | "tourStepIndex"
    | "tourCurrentStepId"
    | "hasCompletedWelcome"
    | "hasCompletedOrientationTour"
    | "phase2DismissedAt"
    | "guidedRunStage"
    | "hasCompletedGuidedRun"
    | "hasCompletedReplayDebrief"
    | "autoSavedRunId"
    | "hasConsumedFirstPhase3Autostart"
  >,
): PersistedOnboardingState {
  return {
    version: state.version,
    status: state.status,
    completedChecklistIds: state.checklist.filter((item) => item.completed).map((item) => item.id),
    isOpen: state.isOpen,
    isDismissed: state.isDismissed,
    hasCompleted: state.hasCompleted,
    allowOrbitControls: state.allowOrbitControls,
    hasSeenWelcome: state.hasSeenWelcome,
    tourStepIndex: state.tourStepIndex,
    tourCurrentStepId: state.tourCurrentStepId,
    hasCompletedWelcome: state.hasCompletedWelcome,
    hasCompletedOrientationTour: state.hasCompletedOrientationTour,
    phase2DismissedAt: state.phase2DismissedAt,
    guidedRunStage: state.guidedRunStage,
    hasCompletedGuidedRun: state.hasCompletedGuidedRun,
    hasCompletedReplayDebrief: state.hasCompletedReplayDebrief,
    autoSavedRunId: state.autoSavedRunId,
    hasConsumedFirstPhase3Autostart: state.hasConsumedFirstPhase3Autostart,
  };
}

function createCompletedChecklist() {
  return createChecklist(getAllChecklistIds());
}

function getPausedStatus(status: OnboardingStatus) {
  if (status === "tour") {
    return "tour";
  }

  if (status === "guided-run" || status === "replay-debrief") {
    return status;
  }

  return "idle";
}

function completeChecklistItems(
  checklist: OnboardingChecklistItem[],
  ids: readonly OnboardingChecklistId[],
) {
  const completedSet = new Set(ids);
  return checklist.map((item) =>
    completedSet.has(item.id) ? { ...item, completed: true } : item,
  );
}

export function persistOnboardingState(
  state: Pick<
    OnboardingStore,
    | "version"
    | "status"
    | "checklist"
    | "isOpen"
    | "isDismissed"
    | "hasCompleted"
    | "allowOrbitControls"
    | "hasSeenWelcome"
    | "tourStepIndex"
    | "tourCurrentStepId"
    | "hasCompletedWelcome"
    | "hasCompletedOrientationTour"
    | "phase2DismissedAt"
    | "guidedRunStage"
    | "hasCompletedGuidedRun"
    | "hasCompletedReplayDebrief"
    | "autoSavedRunId"
    | "hasConsumedFirstPhase3Autostart"
  >,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ONBOARDING_STORAGE_KEY,
    JSON.stringify(createPersistedOnboardingState(state)),
  );
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  ...createDefaultState(),
  hasHydrated: false,
  hydrateFromStorage: () => {
    const defaults = createDefaultState();
    const persisted = readPersistedOnboardingState();

    if (!persisted || persisted.version !== ONBOARDING_VERSION) {
      set({
        ...defaults,
        hasHydrated: true,
      });
      return;
    }

    const completedChecklistIds =
      persisted.completedChecklistIds.length > 0
        ? persisted.completedChecklistIds
        : persisted.hasCompleted
          ? getAllChecklistIds()
          : [];

    set({
      ...defaults,
      ...persisted,
      checklist: createChecklist(completedChecklistIds),
      hasHydrated: true,
    });
  },
  startWelcome: () =>
    set({
      status: "welcome",
      isOpen: false,
      isDismissed: false,
      allowOrbitControls: true,
      phase2DismissedAt: null,
    }),
  startOrientationTour: () =>
    set((state) => ({
      status: "tour",
      isOpen: false,
      isDismissed: false,
      allowOrbitControls: false,
      hasSeenWelcome: true,
      hasCompletedWelcome: true,
      hasCompletedOrientationTour: state.hasCompletedOrientationTour,
      tourStepIndex: 0,
      tourCurrentStepId: FIRST_ORIENTATION_TOUR_STEP_ID,
      phase2DismissedAt: null,
      guidedRunStage: state.hasCompletedGuidedRun ? state.guidedRunStage : null,
    })),
  resumeOrientationTour: () =>
    set((state) => ({
      status: "tour",
      isOpen: false,
      isDismissed: false,
      allowOrbitControls: false,
      hasSeenWelcome: true,
      hasCompletedWelcome: true,
      tourStepIndex: Math.max(0, state.tourStepIndex),
      tourCurrentStepId: state.tourCurrentStepId ?? FIRST_ORIENTATION_TOUR_STEP_ID,
      phase2DismissedAt: null,
    })),
  setTourProgress: (tourStepIndex, tourCurrentStepId) =>
    set({
      tourStepIndex: Math.max(0, Math.floor(tourStepIndex)),
      tourCurrentStepId,
    }),
  dismissOrientationTour: () =>
    set((state) => ({
      status: state.hasCompletedOrientationTour
        ? state.hasCompletedGuidedRun && state.hasCompletedReplayDebrief
          ? state.hasCompleted
            ? "completed"
            : "idle"
          : "guided-run"
        : getPausedStatus(state.status),
      isOpen: false,
      isDismissed: state.hasCompletedOrientationTour ? false : true,
      allowOrbitControls: true,
      phase2DismissedAt: Date.now(),
    })),
  completeOrientationTour: () =>
    set((state) => ({
      hasSeenWelcome: true,
      hasCompletedWelcome: true,
      hasCompletedOrientationTour: true,
      status:
        state.hasCompletedGuidedRun && state.hasCompletedReplayDebrief
          ? state.hasCompleted
            ? "completed"
            : "idle"
          : "guided-run",
      isOpen: false,
      isDismissed: false,
      allowOrbitControls:
        state.hasCompletedGuidedRun && state.hasCompletedReplayDebrief ? true : false,
      phase2DismissedAt: null,
      guidedRunStage:
        state.hasCompletedGuidedRun && state.hasCompletedReplayDebrief ? null : "transition",
      hasConsumedFirstPhase3Autostart:
        state.hasConsumedFirstPhase3Autostart ||
        (!state.hasCompletedGuidedRun && !state.hasCompletedReplayDebrief),
    })),
  startGuidedRun: () =>
    set((state) => ({
      status: "guided-run",
      guidedRunStage: state.guidedRunStage ?? "transition",
      isOpen: false,
      isDismissed: false,
      allowOrbitControls: false,
      hasSeenWelcome: true,
      hasCompletedWelcome: true,
      hasCompletedOrientationTour: true,
      hasConsumedFirstPhase3Autostart: true,
    })),
  resumeGuidedRun: () =>
    set((state) => ({
      status: state.status === "replay-debrief" ? "replay-debrief" : "guided-run",
      guidedRunStage: state.guidedRunStage ?? "transition",
      isOpen: false,
      isDismissed: false,
      allowOrbitControls: false,
      hasSeenWelcome: true,
      hasCompletedWelcome: true,
      hasCompletedOrientationTour: true,
    })),
  setGuidedRunStage: (guidedRunStage) => set({ guidedRunStage }),
  beginReplayDebrief: () =>
    set((state) => ({
      checklist: completeChecklistItems(state.checklist, ["guided-run", "controller-docked"]),
      hasCompletedGuidedRun: true,
      status: "replay-debrief",
      guidedRunStage: "replay-intro",
      isOpen: false,
      isDismissed: false,
      allowOrbitControls: false,
    })),
  completeReplayDebrief: () =>
    set((state) => {
      const checklist = completeChecklistItems(state.checklist, ["replay-scrubbed"]);
      const hasCompleted = checklist.every((item) => item.completed);

      return {
        checklist,
        hasCompleted,
        hasCompletedReplayDebrief: true,
        status: hasCompleted ? "completed" : state.status,
      };
    }),
  recordAutoSavedRun: (runId) =>
    set((state) => {
      const checklist = completeChecklistItems(state.checklist, ["run-saved"]);
      const hasCompleted = checklist.every((item) => item.completed);

      return {
        checklist,
        hasCompleted,
        autoSavedRunId: runId,
        status: hasCompleted ? "completed" : state.status,
      };
    }),
  completePhase3: () =>
    set((state) => {
      const checklist = completeChecklistItems(state.checklist, [
        "guided-run",
        "controller-docked",
        "replay-scrubbed",
      ]);
      const hasCompleted = checklist.every((item) => item.completed);

      return {
        checklist,
        hasCompleted,
        hasCompletedGuidedRun: true,
        hasCompletedReplayDebrief: true,
        guidedRunStage: null,
        status: hasCompleted ? "completed" : "idle",
        isOpen: true,
        isDismissed: false,
        allowOrbitControls: true,
      };
    }),
  skipOnboarding: () =>
    set((state) => ({
      status: state.status === "welcome" ? "idle" : state.status,
      isOpen: false,
      isDismissed: true,
      allowOrbitControls: true,
      phase2DismissedAt: Date.now(),
    })),
  openPanel: () =>
    set((state) => ({
      isOpen: true,
      isDismissed: false,
      status:
        state.hasCompleted && state.status !== "guided-run" && state.status !== "replay-debrief"
          ? "completed"
          : state.status,
    })),
  closePanel: () => set({ isOpen: false }),
  completeChecklistItem: (id) =>
    set((state) => {
      const checklist = state.checklist.map((item) =>
        item.id === id ? { ...item, completed: true } : item,
      );
      const hasCompleted = checklist.every((item) => item.completed);

      return {
        checklist,
        hasCompleted,
        status: hasCompleted ? "completed" : state.status,
      };
    }),
  setStatus: (status) => set({ status }),
  setAllowOrbitControls: (allowOrbitControls) => set({ allowOrbitControls }),
  markCompleted: () =>
    set((state) => ({
      checklist: createCompletedChecklist(),
      hasCompleted: true,
      hasSeenWelcome: true,
      hasCompletedWelcome: true,
      hasCompletedOrientationTour: true,
      hasCompletedGuidedRun: true,
      hasCompletedReplayDebrief: true,
      autoSavedRunId: state.autoSavedRunId,
      status: "completed",
      isOpen: false,
      isDismissed: false,
      allowOrbitControls: true,
      phase2DismissedAt: null,
      guidedRunStage: null,
      hasConsumedFirstPhase3Autostart: true,
    })),
  resetOnboarding: () =>
    set({
      ...createDefaultState(),
      hasHydrated: get().hasHydrated,
    }),
}));
