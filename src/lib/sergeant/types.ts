import type { GuidedRunStageId } from "@/lib/onboarding/guidedRunConfig";
import type { OrientationTourStepId } from "@/lib/onboarding/tourConfig";

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
  };
  run: {
    liveRunState: SergeantLiveRunState;
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
  | "start-mission-walkthrough";

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
      "Sergeant online. I can explain the sim, the onboarding flow, replay, and what to do next.",
  });
}
