import { createSergeantMessage } from "../../sergeant/types.ts";
import { buildSergeantFallbackResponse } from "./fallback.ts";

function createContext(overrides = {}) {
  return {
    onboarding: {
      status: "completed",
      isDismissed: true,
      hasCompleted: true,
      hasCompletedWelcome: true,
      hasCompletedOrientationTour: true,
      hasCompletedGuidedRun: true,
      hasCompletedReplayDebrief: true,
      tourCurrentStepId: null,
      guidedRunStage: null,
      pausedBySergeant: false,
    },
    scenario: {
      id: "steady-approach",
      name: "Steady Approach",
      description: "Baseline day approach.",
      aircraftCardId: "kc46_f15",
      cameraMode: "receiver-lock",
    },
    run: {
      liveRunState: "stopped",
      liveRunRate: 1,
      replayMode: false,
      replayPlaying: false,
      replayIndex: 0,
      replayDataSource: "session",
      evaluationView: "baseline",
      controllerState: "SEARCH",
      controllerLabel: "Search",
      simTime: 0,
      persistStatus: "idle",
      persistMessage: null,
      runControlsLocked: false,
    },
    metrics: {
      positionError: 0,
      lateralError: 0,
      dockScore: 0,
      confidence: 0,
      trackRange: 0,
    },
    pausedOnboardingContext: null,
    ...overrides,
  };
}

test("start run requests emit a live-run client action", () => {
  const response = buildSergeantFallbackResponse({
    messages: [
      createSergeantMessage({
        role: "user",
        content: "start the run",
      }),
    ],
    context: createContext(),
  });

  expect(response.clientActions).toEqual([{ type: "start-live-run" }]);
  expect(response.assistantMessage.content).toContain("Starting");
});

test("slow-down requests emit a live-run rate action", () => {
  const response = buildSergeantFallbackResponse({
    messages: [
      createSergeantMessage({
        role: "user",
        content: "slow the run down",
      }),
    ],
    context: createContext({
      run: {
        ...createContext().run,
        liveRunState: "running",
        liveRunRate: 1.5,
      },
    }),
  });

  expect(response.clientActions).toEqual([
    { type: "adjust-live-run-rate", direction: "slower" },
  ]);
  expect(response.assistantMessage.content).toContain("Slowing");
});
