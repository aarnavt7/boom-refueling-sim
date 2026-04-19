import { formatControllerStateLabel } from "@/components/hud/controllerPresentation";
import type { GuidedRunStageId } from "@/lib/onboarding/guidedRunConfig";
import type { OrientationTourStepId } from "@/lib/onboarding/tourConfig";
import type { ScenarioPreset } from "@/lib/sim/types";
import type { SergeantContextSnapshot, SergeantPausedOnboardingContext } from "@/lib/sergeant/types";

type BuildSergeantContextSnapshotInput = {
  onboarding: {
    status: SergeantContextSnapshot["onboarding"]["status"];
    isDismissed: boolean;
    hasCompleted: boolean;
    hasCompletedWelcome: boolean;
    hasCompletedOrientationTour: boolean;
    hasCompletedGuidedRun: boolean;
    hasCompletedReplayDebrief: boolean;
    tourCurrentStepId: OrientationTourStepId | null;
    guidedRunStage: GuidedRunStageId | null;
  };
  scenario: Pick<ScenarioPreset, "id" | "name" | "description">;
  scenarioUi: {
    aircraftCardId: string;
    cameraMode: string;
  };
  run: {
    liveRunState: SergeantContextSnapshot["run"]["liveRunState"];
    replayMode: boolean;
    replayPlaying: boolean;
    replayIndex: number;
    replayDataSource: string;
    evaluationView: string;
    controllerState: string;
    simTime: number;
    persistStatus: SergeantContextSnapshot["run"]["persistStatus"];
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

export function buildSergeantContextSnapshot({
  onboarding,
  scenario,
  scenarioUi,
  run,
  metrics,
  pausedOnboardingContext,
}: BuildSergeantContextSnapshotInput): SergeantContextSnapshot {
  return {
    onboarding: {
      ...onboarding,
      pausedBySergeant: pausedOnboardingContext !== null && onboarding.isDismissed,
    },
    scenario: {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description,
      aircraftCardId: scenarioUi.aircraftCardId,
      cameraMode: scenarioUi.cameraMode,
    },
    run: {
      ...run,
      controllerLabel: formatControllerStateLabel(run.controllerState),
      simTime: Number(run.simTime.toFixed(1)),
    },
    metrics: {
      positionError: Number(metrics.positionError.toFixed(3)),
      lateralError: Number(metrics.lateralError.toFixed(3)),
      dockScore: Number(metrics.dockScore.toFixed(3)),
      confidence: Number(metrics.confidence.toFixed(3)),
      trackRange: Number(metrics.trackRange.toFixed(3)),
    },
    pausedOnboardingContext,
  };
}
