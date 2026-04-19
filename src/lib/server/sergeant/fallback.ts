import "server-only";

import {
  createSergeantMessage,
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
      "The scenario panel is where you pick the mission conditions and launch a fresh live run. If you want darker conditions today, the night presets are the closest manual match until direct Sergeant execution lands in Phase 2.",
  },
  {
    test: /\b(replay|save|timeline|scrub)\b/,
    reply: () =>
      "Replay is where you revisit a pass without rerunning the scene. Save-run keeps a local summary and optional replay archive so you can reopen the run later.",
  },
];

const ACTION_REQUEST_RE =
  /\b(run|start|launch|switch|change|set|reset|simulate|create|generate|use)\b/;

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

function createActionReply(context: SergeantContextSnapshot) {
  const manualGuidance = [
    `use the Scenario panel to pick a preset, which is currently set to ${context.scenario.name}`,
    "use Start live run to launch a fresh pass",
    "use Debug on if you want more instrumentation",
    "use the Replay panel once a run exists",
  ];

  return `I can help plan that, but I cannot directly run or reconfigure the sim yet. In Phase 1 I stay read-only and grounded in what is already on screen. For now, ${manualGuidance.join(
    ", ",
  )}. Phase 2 is where I start actually driving the setup for you.`;
}

function createSceneReply(context: SergeantContextSnapshot) {
  const modeLabel = context.run.replayMode ? "replay" : "live";
  const runLabel =
    context.run.liveRunState === "running"
      ? "The live run is advancing."
      : context.run.liveRunState === "paused"
        ? "The live run is paused."
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
    return `You are ready for a manual pass. Pick a scenario, then use Start live run. ${context.scenario.name} is already selected if you want the current setup.`;
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
  }

  return hints;
}

function getSuggestedPrompts(context: SergeantContextSnapshot, userMessage: string) {
  if (ACTION_REQUEST_RE.test(userMessage)) {
    return [
      "What preset is closest to a dark run right now?",
      "What does the guidance panel matter for first?",
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
    "What should I pay attention to first?",
    "How do replay and save-run work?",
  ];
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
    content = "Sergeant online. Ask what the current state means, what a panel does, or what the best next step is and I will keep it grounded in the sim you are actually looking at.";
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

  return {
    assistantMessage: createSergeantMessage({
      role: "assistant",
      kind: "assistant",
      content,
    }),
    systemHints: getSystemHints(context),
    suggestedPrompts: getSuggestedPrompts(context, normalized),
  };
}
