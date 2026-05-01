import { formatLiveRunRate } from "@/lib/sim/runRate";
import {
  createSergeantMessage,
  type SergeantClientAction,
  type SergeantContextSnapshot,
  type SergeantMessage,
  type SergeantRequestPayload,
  type SergeantResponsePayload,
  type SergeantSystemHint,
} from "@/lib/sergeant/types";

const PANEL_EXPLANATIONS = [
  {
    test: /\b(guidance|status|captured|docked|controller state)\b/,
    reply: (context: SergeantContextSnapshot) =>
      `Start with the guidance panel. It is the fastest read on whether the run looks healthy. Right now the controller is in ${context.run.controllerLabel}, which means ${describeControllerState(
        context.run.controllerState,
      )}.`,
  },
  {
    test: /\b(sensor|eo\/ir|tracking view|feed|camera)\b/,
    reply: () =>
      "The sensor feed is the synthetic tracking view. It helps you understand what the system is locking onto without making you decode raw metrics first.",
  },
  {
    test: /\b(telemetry|metrics|confidence|error|dock score|numbers)\b/,
    reply: (context: SergeantContextSnapshot) =>
      `The metrics panel is for inspection and comparison. Right now position error is ${context.metrics.positionError.toFixed(
        2,
      )} m, confidence is ${(context.metrics.confidence * 100).toFixed(
        0,
      )}%, and dock score is ${context.metrics.dockScore.toFixed(
        2,
      )}. It matters most after you already trust the guidance panel.`,
  },
  {
    test: /\b(scenario|preset|night|dark|emcon|water|reset)\b/,
    reply: () =>
      "The scenario panel is where you pick the mission conditions, adjust the live run rate, and launch a fresh pass. I can also start the selected run for you now.",
  },
  {
    test: /\b(replay|save|timeline|scrub)\b/,
    reply: () =>
      "Replay is where you revisit a pass without rerunning the scene. Save-run keeps a local summary and optional replay archive so you can reopen the run later.",
  },
];

const ACTION_REQUEST_RE =
  /\b(run|start|launch|resume|pause|stop|switch|change|set|reset|simulate|create|generate|use|speed|slow)\b/;
const START_RUN_RE = /\b(start|launch|begin|kick off|resume)\b.*\b(run|pass|sim|simulation)\b/;
const PAUSE_RUN_RE = /\b(pause|hold)\b(?:.*\b(run|pass|sim|simulation)\b)?/;
const STOP_RUN_RE = /\b(stop|reset|restart)\b.*\b(run|pass|sim|simulation)\b/;
const SPEED_UP_RE =
  /\b(speed up|speed(?:\s+\w+){0,2}\s+up|faster|accelerate|go quicker|go faster|increase speed)\b/;
const SLOW_DOWN_RE =
  /\b(slow down|slow(?:\s+\w+){0,2}\s+down|slower|decelerate|reduce speed|go slower)\b/;

function describeControllerState(state: string) {
  if (state === "SEARCH") {
    return "the system is still establishing geometry and looking for a clean track.";
  }

  if (state === "ACQUIRE" || state === "TRACK") {
    return "the system has a useful track and is stabilizing before final alignment.";
  }

  if (state === "ALIGN") {
    return "the boom controller is lining up for final approach.";
  }

  if (state === "INSERT") {
    return "the controller is making smaller corrective moves into the dock.";
  }

  if (state === "MATED" || state === "DOCKED") {
    return "the boom has reached a docked state.";
  }

  if (state === "BREAKAWAY" || state === "ABORT") {
    return "the run has faulted out and the system is protecting the geometry.";
  }

  return "the system is in a holding state.";
}

function getLatestUserMessage(messages: SergeantMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return messages[index];
    }
  }

  return null;
}

function createResponse(
  content: string,
  context: SergeantContextSnapshot,
  options: {
    clientActions?: SergeantClientAction[];
    systemHints?: SergeantSystemHint[];
    suggestedPrompts?: string[];
  } = {},
): SergeantResponsePayload {
  return {
    assistantMessage: createSergeantMessage({
      role: "assistant",
      kind: "assistant",
      content,
    }),
    clientActions: options.clientActions,
    systemHints: options.systemHints ?? getSystemHints(context),
    suggestedPrompts:
      options.suggestedPrompts ?? getSuggestedPrompts(context, content.toLowerCase()),
  };
}

function createRunControlBlockedReply() {
  return "The guided walkthrough is managing the run right now, so I am leaving the controls alone until that flow finishes or is dismissed.";
}

function createActionReply(context: SergeantContextSnapshot) {
  const guidance = [
    `the Scenario panel is still set to ${context.scenario.name}`,
    "I can start, pause, stop, or change the live run speed on command",
    "the Replay panel is still where you inspect a finished pass",
  ];

  return `I can drive the current run controls now. Right now, ${guidance.join(", ")}.`;
}

function createSceneReply(context: SergeantContextSnapshot) {
  const modeLabel = context.run.replayMode ? "replay" : "live";
  const runLabel =
    context.run.liveRunState === "running"
      ? `The live run is advancing at ${formatLiveRunRate(context.run.liveRunRate)}.`
      : context.run.liveRunState === "paused"
        ? `The live run is paused at ${formatLiveRunRate(context.run.liveRunRate)}.`
        : "The live run is stopped.";

  return `You are looking at the ${modeLabel} view for ${context.scenario.name}. ${runLabel} The controller is in ${context.run.controllerLabel}, so ${describeControllerState(
    context.run.controllerState,
  )} Start with the guidance panel for the shortest read, then use the sensor feed for visual context and replay if you want to inspect the pass more slowly.`;
}

function createNextStepReply(context: SergeantContextSnapshot) {
  if (context.onboarding.pausedBySergeant && context.pausedOnboardingContext) {
    return "I paused the onboarding flow for you. If you want to continue the walkthrough, use Resume onboarding. If you would rather stay manual, keep the guidance panel, scenario panel, and replay panel in that order.";
  }

  if (!context.onboarding.hasCompletedWelcome || context.onboarding.status === "welcome") {
    return "The cleanest next step is Start quick tour. That gives you the interface map before the scene gets noisy.";
  }

  if (!context.onboarding.hasCompletedOrientationTour) {
    return "Finish the quick tour first. It explains the panels in the order that matters most when the sim feels intimidating.";
  }

  if (!context.onboarding.hasCompletedGuidedRun || !context.onboarding.hasCompletedReplayDebrief) {
    return "The next meaningful step is Start mission walkthrough. That pass shows one full autonomous run, then hands you into replay and save-run.";
  }

  if (context.run.liveRunState === "stopped") {
    return `You are ready for a live pass. ${context.scenario.name} is already selected, and I can start it for you if you want.`;
  }

  return "You are in free exploration now. Watch the guidance panel first, then open replay if you want a slower read of the same pass.";
}

function getSystemHints(context: SergeantContextSnapshot): SergeantSystemHint[] {
  const hints: SergeantSystemHint[] = [];

  if (context.onboarding.pausedBySergeant && context.pausedOnboardingContext) {
    hints.push({
      id: "resume-onboarding",
      label: "Resume onboarding",
      action: "resume-onboarding",
    });
  } else if (!context.onboarding.hasCompletedOrientationTour) {
    hints.push({
      id: "start-quick-tour",
      label: "Start quick tour",
      action: "start-quick-tour",
    });
  } else if (!context.onboarding.hasCompletedGuidedRun || !context.onboarding.hasCompletedReplayDebrief) {
    hints.push({
      id: "start-mission-walkthrough",
      label: "Start mission walkthrough",
      action: "start-mission-walkthrough",
    });
  } else if (!context.run.runControlsLocked && context.run.liveRunState !== "running") {
    hints.push({
      id: "start-live-run",
      label: context.run.liveRunState === "paused" ? "Resume live run" : "Start live run",
      action: "start-live-run",
    });
  }

  return hints;
}

function getSuggestedPrompts(context: SergeantContextSnapshot, userMessage: string) {
  if (ACTION_REQUEST_RE.test(userMessage)) {
    return [
      "Start the run",
      "Slow the run down",
      "What should I watch in replay after a run?",
    ];
  }

  if (!context.onboarding.hasCompletedOrientationTour) {
    return [
      "What am I looking at right now?",
      "What does the guidance panel mean?",
      "What should I do next?",
    ];
  }

  return [
    "What state is the controller in?",
    "Start the run",
    "How do replay and save-run work?",
  ];
}

function createStartRunResponse(context: SergeantContextSnapshot): SergeantResponsePayload {
  if (context.run.runControlsLocked) {
    return createResponse(createRunControlBlockedReply(), context);
  }

  if (context.run.liveRunState === "running" && !context.run.replayMode) {
    return createResponse(
      "The live run is already advancing. I can pause it, slow it down, or keep explaining what the controller is doing.",
      context,
      {
        systemHints: [
          {
            id: "pause-live-run",
            label: "Pause live run",
            action: "pause-live-run",
          },
          {
            id: "slow-live-run",
            label: "Slow live run",
            action: "slow-live-run",
          },
        ],
        suggestedPrompts: [
          "Slow the run down",
          "Pause the run",
          "What state is the controller in?",
        ],
      },
    );
  }

  return createResponse(
    context.run.replayMode
      ? `Exiting replay and launching a fresh ${context.scenario.name} live run now.`
      : context.run.liveRunState === "paused"
        ? "Resuming the paused live run now."
        : `Starting a fresh ${context.scenario.name} live run now.`,
    context,
    {
      clientActions: [{ type: "start-live-run" }],
      systemHints: [
        {
          id: "pause-live-run",
          label: "Pause live run",
          action: "pause-live-run",
        },
        {
          id: "slow-live-run",
          label: "Slow live run",
          action: "slow-live-run",
        },
      ],
      suggestedPrompts: [
        "Slow the run down",
        "Pause the run",
        "What should I watch first?",
      ],
    },
  );
}

function createPauseRunResponse(context: SergeantContextSnapshot): SergeantResponsePayload {
  if (context.run.runControlsLocked) {
    return createResponse(createRunControlBlockedReply(), context);
  }

  if (context.run.replayMode) {
    return createResponse("Replay is open right now, so there is no live run to pause.", context);
  }

  if (context.run.liveRunState !== "running") {
    return createResponse("The live run is not currently advancing, so there is nothing to pause.", context);
  }

  return createResponse("Pausing the live run now.", context, {
    clientActions: [{ type: "pause-live-run" }],
    systemHints: [
      {
        id: "start-live-run",
        label: "Resume live run",
        action: "start-live-run",
      },
      {
        id: "speed-up-live-run",
        label: "Speed up run",
        action: "speed-up-live-run",
      },
    ],
    suggestedPrompts: [
      "Resume the run",
      "Speed it up",
      "What happened just before the pause?",
    ],
  });
}

function createStopRunResponse(context: SergeantContextSnapshot): SergeantResponsePayload {
  if (context.run.runControlsLocked) {
    return createResponse(createRunControlBlockedReply(), context);
  }

  if (context.run.replayMode || context.run.liveRunState === "stopped") {
    return createResponse("The live run is already stopped.", context);
  }

  return createResponse("Stopping the live run and resetting the current setup now.", context, {
    clientActions: [{ type: "stop-live-run" }],
    systemHints: [
      {
        id: "start-live-run",
        label: "Start live run",
        action: "start-live-run",
      },
    ],
    suggestedPrompts: [
      "Start the run again",
      "What preset is selected?",
      "What conditions does this scenario cover?",
    ],
  });
}

function createRunRateResponse(
  context: SergeantContextSnapshot,
  direction: "slower" | "faster",
): SergeantResponsePayload {
  if (context.run.runControlsLocked) {
    return createResponse(createRunControlBlockedReply(), context);
  }

  if (context.run.replayMode) {
    return createResponse(
      "Replay is open, so the live rate control will apply once you return to a live pass.",
      context,
    );
  }

  const rate = context.run.liveRunRate;
  const atBoundary =
    (direction === "slower" && rate <= 0.5) || (direction === "faster" && rate >= 2);
  if (atBoundary) {
    return createResponse(
      direction === "slower"
        ? `The live run is already at the slowest rate, ${formatLiveRunRate(rate)}.`
        : `The live run is already at the fastest rate, ${formatLiveRunRate(rate)}.`,
      context,
    );
  }

  return createResponse(
    `${direction === "slower" ? "Slowing" : "Speeding up"} the live run from ${formatLiveRunRate(
      rate,
    )} now.`,
    context,
    {
      clientActions: [{ type: "adjust-live-run-rate", direction }],
      systemHints: [
        {
          id: direction === "slower" ? "speed-up-live-run" : "slow-live-run",
          label: direction === "slower" ? "Speed up run" : "Slow live run",
          action: direction === "slower" ? "speed-up-live-run" : "slow-live-run",
        },
        {
          id: context.run.liveRunState === "running" ? "pause-live-run" : "start-live-run",
          label: context.run.liveRunState === "running" ? "Pause live run" : "Start live run",
          action: context.run.liveRunState === "running" ? "pause-live-run" : "start-live-run",
        },
      ],
      suggestedPrompts: [
        direction === "slower" ? "Speed it up again" : "Slow it down",
        context.run.liveRunState === "running" ? "Pause the run" : "Start the run",
        "What should I watch first?",
      ],
    },
  );
}

export function buildSergeantFallbackResponse({
  messages,
  context,
}: SergeantRequestPayload): SergeantResponsePayload {
  const latestUserMessage = getLatestUserMessage(messages);
  const userText = latestUserMessage?.content.trim() ?? "";
  const normalized = userText.toLowerCase();

  let content = createSceneReply(context);

  if (!userText) {
    content =
      "Sergeant online. Ask what the current state means, what a panel does, what the best next step is, or tell me to start a pass.";
  } else if (START_RUN_RE.test(normalized)) {
    return createStartRunResponse(context);
  } else if (PAUSE_RUN_RE.test(normalized)) {
    return createPauseRunResponse(context);
  } else if (STOP_RUN_RE.test(normalized)) {
    return createStopRunResponse(context);
  } else if (SPEED_UP_RE.test(normalized)) {
    return createRunRateResponse(context, "faster");
  } else if (SLOW_DOWN_RE.test(normalized)) {
    return createRunRateResponse(context, "slower");
  } else if (ACTION_REQUEST_RE.test(normalized)) {
    content = createActionReply(context);
  } else if (
    /\b(what('| i)s going on|what am i looking at|what is happening|where do i start)\b/.test(
      normalized,
    )
  ) {
    content = createSceneReply(context);
  } else if (/\b(next|what should i do|what now|where next)\b/.test(normalized)) {
    content = createNextStepReply(context);
  } else {
    const panelExplanation = PANEL_EXPLANATIONS.find((entry) => entry.test.test(normalized));
    if (panelExplanation) {
      content = panelExplanation.reply(context);
    }
  }

  return createResponse(content, context, {
    suggestedPrompts: getSuggestedPrompts(context, normalized),
  });
}
