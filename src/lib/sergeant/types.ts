import type { GuidedRunStageId } from "@/lib/onboarding/guidedRunConfig";
import type { OrientationTourStepId } from "@/lib/onboarding/tourConfig";
import type {
  AircraftCardId,
  CameraMode,
  EvaluationView,
  ReplayDataSource,
} from "@/lib/sim/types";

export const SERGEANT_STORAGE_KEY = "boom.sergeant.session.v1";
export const SERGEANT_SESSION_VERSION = 1;

export type SergeantOnboardingStatus =
  | "idle"
  | "welcome"
  | "tour"
  | "guided-run"
  | "replay-debrief"
  | "completed";

export type SergeantLiveRunState = "stopped" | "running" | "paused";

export type SergeantMessageRole = "user" | "assistant";
export type SergeantMessageKind = "user" | "assistant" | "system";
export type SergeantConversationStatus = "idle" | "sending" | "error";
export type SergeantClientAction =
  | { type: "start-live-run" }
  | { type: "pause-live-run" }
  | { type: "stop-live-run" }
  | { type: "adjust-live-run-rate"; direction: "slower" | "faster" }
  | { type: "set-scenario"; scenarioId: string }
  | { type: "set-camera-mode"; cameraMode: CameraMode }
  | { type: "set-aircraft-card"; aircraftCardId: AircraftCardId }
  | { type: "set-debug"; enabled: boolean }
  | { type: "request-manual-breakaway" }
  | { type: "set-replay-mode"; enabled: boolean }
  | { type: "set-replay-source"; source: ReplayDataSource }
  | { type: "set-evaluation-view"; view: EvaluationView }
  | { type: "save-run" }
  | { type: "run-uploaded-evaluation" };

export type SergeantMessage = {
  id: string;
  role: SergeantMessageRole;
  content: string;
  createdAt: number;
  kind?: SergeantMessageKind;
};

export type SergeantPausedOnboardingContext = {
  status: SergeantOnboardingStatus;
  tourCurrentStepId: OrientationTourStepId | null;
  guidedRunStage: GuidedRunStageId | null;
  pausedAt: number;
};

export type SergeantContextSnapshot = {
  onboarding: {
    status: SergeantOnboardingStatus;
    isDismissed: boolean;
    hasCompleted: boolean;
    hasCompletedWelcome: boolean;
    hasCompletedOrientationTour: boolean;
    hasCompletedGuidedRun: boolean;
    hasCompletedReplayDebrief: boolean;
    tourCurrentStepId: OrientationTourStepId | null;
    guidedRunStage: GuidedRunStageId | null;
    pausedBySergeant: boolean;
  };
  scenario: {
    id: string;
    name: string;
    description: string;
    aircraftCardId: string;
    cameraMode: string;
    showDebug: boolean;
  };
  run: {
    liveRunState: SergeantLiveRunState;
    liveRunRate: number;
    replayMode: boolean;
    replayPlaying: boolean;
    replayIndex: number;
    replayDataSource: string;
    evaluationView: string;
    controllerState: string;
    controllerLabel: string;
    simTime: number;
    persistStatus: "idle" | "saving" | "saved" | "error";
    persistMessage: string | null;
    runControlsLocked: boolean;
    replaySampleCount: number;
    hasAutonomyUpload: boolean;
    hasAutonomyEvaluation: boolean;
  };
  metrics: {
    positionError: number;
    lateralError: number;
    dockScore: number;
    confidence: number;
    trackRange: number;
  };
  pausedOnboardingContext: SergeantPausedOnboardingContext | null;
};

export type SergeantQuickActionId =
  | "resume-onboarding"
  | "start-quick-tour"
  | "start-mission-walkthrough"
  | "start-live-run"
  | "pause-live-run"
  | "stop-live-run"
  | "slow-live-run"
  | "speed-up-live-run"
  | "set-manual-camera"
  | "set-receiver-camera"
  | "set-dock-camera"
  | "open-replay"
  | "return-live"
  | "save-run"
  | "run-uploaded-evaluation"
  | "manual-breakaway"
  | "debug-on"
  | "debug-off";

export type SergeantSystemHint = {
  id: string;
  label: string;
  action?: SergeantQuickActionId;
};

export type SergeantConversationState = {
  version: number;
  isOpen: boolean;
  messages: SergeantMessage[];
  draft: string;
  status: SergeantConversationStatus;
  lastContextSnapshot: SergeantContextSnapshot | null;
  hasUnreadSystemHint: boolean;
  pausedOnboardingContext: SergeantPausedOnboardingContext | null;
};

export type SergeantRequestPayload = {
  messages: SergeantMessage[];
  context: SergeantContextSnapshot;
};

export type SergeantResponsePayload = {
  assistantMessage: SergeantMessage;
  systemHints?: SergeantSystemHint[];
  suggestedPrompts?: string[];
  clientActions?: SergeantClientAction[];
};

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `sergeant-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function createSergeantMessage({
  id,
  role,
  content,
  createdAt = Date.now(),
  kind,
}: {
  id?: string;
  role: SergeantMessageRole;
  content: string;
  createdAt?: number;
  kind?: SergeantMessageKind;
}): SergeantMessage {
  return {
    id: id ?? createMessageId(),
    role,
    content,
    createdAt,
    kind: kind ?? role,
  };
}

export function createSergeantWelcomeMessage() {
  return createSergeantMessage({
    role: "assistant",
    kind: "system",
    content:
      "Sergeant online. Ask about the current run, replay, controls, or tell me to start a pass.",
  });
}
