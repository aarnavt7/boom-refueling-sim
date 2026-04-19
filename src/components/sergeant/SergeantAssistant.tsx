"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { FloatingHudPanel } from "@/components/hud/FloatingHudPanel";
import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import { useOnboardingPresentation } from "@/lib/onboarding/useOnboardingPresentation";
import { buildSergeantContextSnapshot } from "@/lib/sergeant/context";
import {
  createSergeantMessage,
  type SergeantMessage,
  type SergeantQuickActionId,
  type SergeantResponsePayload,
  type SergeantSystemHint,
} from "@/lib/sergeant/types";
import { getDisplayedState } from "@/lib/sim/replay";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import {
  persistSergeantState,
  useSergeantStore,
} from "@/lib/store/sergeantStore";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type QuickAction = {
  id: SergeantQuickActionId;
  label: string;
};

function isSergeantMessage(value: unknown): value is SergeantMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const maybeMessage = value as Partial<SergeantMessage>;
  return (
    (maybeMessage.role === "assistant" || maybeMessage.role === "user") &&
    typeof maybeMessage.content === "string" &&
    typeof maybeMessage.createdAt === "number" &&
    typeof maybeMessage.id === "string"
  );
}

function getMessageTone(message: SergeantMessage) {
  if (message.kind === "system") {
    return "system";
  }

  if (message.role === "user") {
    return "user";
  }

  return "assistant";
}

function normalizeHints(hints: SergeantSystemHint[] | undefined) {
  if (!Array.isArray(hints)) {
    return [] as SergeantSystemHint[];
  }

  return hints.filter(
    (hint) =>
      typeof hint?.id === "string" &&
      typeof hint?.label === "string" &&
      (hint.action === undefined ||
        hint.action === "resume-onboarding" ||
        hint.action === "start-quick-tour" ||
        hint.action === "start-mission-walkthrough"),
  );
}

function getDefaultPromptSuggestions(hasCompletedOrientationTour: boolean) {
  if (!hasCompletedOrientationTour) {
    return [
      "What am I looking at?",
      "How do I move around the scene?",
      "What should I do next?",
    ];
  }

  return [
    "What state is the controller in?",
    "How does replay work?",
    "What should I watch first?",
  ];
}

export function SergeantAssistant() {
  const { isCompact, prefersReducedMotion } = useOnboardingPresentation();
  const hasHydrated = useOnboardingStore((state) => state.hasHydrated);
  const onboardingStatus = useOnboardingStore((state) => state.status);
  const onboardingOpen = useOnboardingStore((state) => state.isOpen);
  const onboardingDismissed = useOnboardingStore((state) => state.isDismissed);
  const hasCompleted = useOnboardingStore((state) => state.hasCompleted);
  const hasCompletedWelcome = useOnboardingStore((state) => state.hasCompletedWelcome);
  const hasCompletedOrientationTour = useOnboardingStore(
    (state) => state.hasCompletedOrientationTour,
  );
  const hasCompletedGuidedRun = useOnboardingStore((state) => state.hasCompletedGuidedRun);
  const hasCompletedReplayDebrief = useOnboardingStore(
    (state) => state.hasCompletedReplayDebrief,
  );
  const tourCurrentStepId = useOnboardingStore((state) => state.tourCurrentStepId);
  const guidedRunStage = useOnboardingStore((state) => state.guidedRunStage);
  const startWelcome = useOnboardingStore((state) => state.startWelcome);
  const startOrientationTour = useOnboardingStore((state) => state.startOrientationTour);
  const resumeOrientationTour = useOnboardingStore((state) => state.resumeOrientationTour);
  const startGuidedRun = useOnboardingStore((state) => state.startGuidedRun);
  const resumeGuidedRun = useOnboardingStore((state) => state.resumeGuidedRun);
  const skipOnboarding = useOnboardingStore((state) => state.skipOnboarding);
  const closeOnboardingPanel = useOnboardingStore((state) => state.closePanel);

  const scenario = useSimStore((state) => state.scenario);
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const persistStatus = useSimStore((state) => state.persistStatus);
  const persistMessage = useSimStore((state) => state.persistMessage);

  const selectedAircraftCardId = useUiStore((state) => state.selectedAircraftCardId);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const liveRunState = useUiStore((state) => state.liveRunState);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayDataSource = useUiStore((state) => state.replayDataSource);
  const evaluationView = useUiStore((state) => state.evaluationView);
  const replayPlaying = useUiStore((state) => state.replayPlaying);
  const replayIndex = useUiStore((state) => state.replayIndex);

  const sergeantHydrated = useSergeantStore((state) => state.hasHydrated);
  const isAssistantOpen = useSergeantStore((state) => state.isOpen);
  const messages = useSergeantStore((state) => state.messages);
  const draft = useSergeantStore((state) => state.draft);
  const status = useSergeantStore((state) => state.status);
  const lastContextSnapshot = useSergeantStore((state) => state.lastContextSnapshot);
  const hasUnreadSystemHint = useSergeantStore((state) => state.hasUnreadSystemHint);
  const pausedOnboardingContext = useSergeantStore((state) => state.pausedOnboardingContext);
  const hydrateFromStorage = useSergeantStore((state) => state.hydrateFromStorage);
  const openAssistant = useSergeantStore((state) => state.openAssistant);
  const closeAssistant = useSergeantStore((state) => state.closeAssistant);
  const setDraft = useSergeantStore((state) => state.setDraft);
  const setStatus = useSergeantStore((state) => state.setStatus);
  const setLastContextSnapshot = useSergeantStore((state) => state.setLastContextSnapshot);
  const appendMessage = useSergeantStore((state) => state.appendMessage);
  const appendSystemMessage = useSergeantStore((state) => state.appendSystemMessage);
  const clearConversation = useSergeantStore((state) => state.clearConversation);
  const setPausedOnboardingContext = useSergeantStore(
    (state) => state.setPausedOnboardingContext,
  );

  const [responseHints, setResponseHints] = useState<SergeantSystemHint[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const displayedState = useMemo(
    () => getDisplayedState(live, replaySamples, replayMode, replayIndex),
    [live, replayIndex, replayMode, replaySamples],
  );
  const isWelcomeOpen = onboardingStatus === "welcome";
  const isTourActive = onboardingStatus === "tour" && !onboardingDismissed;
  const isMissionActive =
    (onboardingStatus === "guided-run" || onboardingStatus === "replay-debrief") &&
    !onboardingDismissed &&
    guidedRunStage !== null;
  const isPanelVisible =
    onboardingOpen && !isWelcomeOpen && !isTourActive && !isMissionActive;

  const currentContextSnapshot = useMemo(
    () =>
      buildSergeantContextSnapshot({
        onboarding: {
          status: onboardingStatus,
          isDismissed: onboardingDismissed,
          hasCompleted,
          hasCompletedWelcome,
          hasCompletedOrientationTour,
          hasCompletedGuidedRun,
          hasCompletedReplayDebrief,
          tourCurrentStepId,
          guidedRunStage,
        },
        scenario,
        scenarioUi: {
          aircraftCardId: selectedAircraftCardId,
          cameraMode,
        },
        run: {
          liveRunState,
          replayMode,
          replayPlaying,
          replayIndex,
          replayDataSource,
          evaluationView,
          controllerState: displayedState.controllerState,
          simTime: displayedState.simTime,
          persistStatus,
          persistMessage,
        },
        metrics: {
          positionError: displayedState.metrics.positionError,
          lateralError: displayedState.metrics.lateralError,
          dockScore: displayedState.metrics.dockScore,
          confidence: displayedState.tracker.confidence,
          trackRange: displayedState.metrics.trackRange,
        },
        pausedOnboardingContext,
      }),
    [
      cameraMode,
      displayedState,
      evaluationView,
      guidedRunStage,
      hasCompleted,
      hasCompletedGuidedRun,
      hasCompletedOrientationTour,
      hasCompletedReplayDebrief,
      hasCompletedWelcome,
      liveRunState,
      onboardingDismissed,
      onboardingStatus,
      pausedOnboardingContext,
      persistMessage,
      persistStatus,
      replayDataSource,
      replayIndex,
      replayMode,
      replayPlaying,
      scenario,
      selectedAircraftCardId,
      tourCurrentStepId,
    ],
  );

  const actionOptions = useMemo(() => {
    const options = new Map<string, QuickAction>();

    if (
      pausedOnboardingContext &&
      onboardingDismissed &&
      (onboardingStatus === "tour" ||
        onboardingStatus === "guided-run" ||
        onboardingStatus === "replay-debrief")
    ) {
      options.set("resume-onboarding", {
        id: "resume-onboarding",
        label: "Resume walkthrough",
      });
    } else if (!hasCompletedOrientationTour) {
      options.set("start-quick-tour", {
        id: "start-quick-tour",
        label: "Quick tour",
      });
    } else if (!hasCompletedGuidedRun || !hasCompletedReplayDebrief) {
      options.set("start-mission-walkthrough", {
        id: "start-mission-walkthrough",
        label: "Mission walkthrough",
      });
    }

    for (const hint of responseHints) {
      if (!hint.action) {
        continue;
      }

      options.set(hint.action, {
        id: hint.action,
        label: hint.label,
      });
    }

    return [...options.values()].slice(0, 2);
  }, [
    hasCompletedGuidedRun,
    hasCompletedOrientationTour,
    hasCompletedReplayDebrief,
    onboardingDismissed,
    onboardingStatus,
    pausedOnboardingContext,
    responseHints,
  ]);

  const promptOptions = useMemo(
    () =>
      (
        suggestedPrompts.length > 0
          ? suggestedPrompts
          : getDefaultPromptSuggestions(hasCompletedOrientationTour)
      ).slice(0, 3),
    [hasCompletedOrientationTour, suggestedPrompts],
  );

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!sergeantHydrated) {
      return;
    }

    persistSergeantState({
      version: 1,
      isOpen: isAssistantOpen,
      messages,
      draft,
      status,
      lastContextSnapshot,
      hasUnreadSystemHint,
      pausedOnboardingContext,
    });
  }, [
    draft,
    hasUnreadSystemHint,
    isAssistantOpen,
    lastContextSnapshot,
    messages,
    pausedOnboardingContext,
    sergeantHydrated,
    status,
  ]);

  useEffect(() => {
    if (!isAssistantOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 40);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isAssistantOpen]);

  useEffect(() => {
    const node = messageListRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [isAssistantOpen, messages, prefersReducedMotion]);

  useEffect(() => {
    if (
      pausedOnboardingContext !== null &&
      !onboardingDismissed &&
      (onboardingStatus === "tour" ||
        onboardingStatus === "guided-run" ||
        onboardingStatus === "replay-debrief")
    ) {
      setPausedOnboardingContext(null);
    }
  }, [onboardingDismissed, onboardingStatus, pausedOnboardingContext, setPausedOnboardingContext]);

  useEffect(() => {
    if (!isAssistantOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeAssistant();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAssistant, isAssistantOpen]);

  function openSergeantFromUi(shouldPauseOnboarding: boolean) {
    closeOnboardingPanel();

    if (shouldPauseOnboarding) {
      setPausedOnboardingContext({
        status: onboardingStatus,
        tourCurrentStepId,
        guidedRunStage,
        pausedAt: Date.now(),
      });
      openAssistant();
      appendSystemMessage("I paused the walkthrough. Ask me anything, or resume when you're ready.");
      skipOnboarding();
      return;
    }

    openAssistant();
  }

  function handleLauncherClick() {
    openSergeantFromUi(isTourActive || isMissionActive);
  }

  function triggerQuickAction(action: SergeantQuickActionId) {
    closeAssistant();

    if (action === "resume-onboarding") {
      if (onboardingStatus === "tour") {
        resumeOrientationTour();
      } else {
        resumeGuidedRun();
      }
      setPausedOnboardingContext(null);
      return;
    }

    if (action === "start-quick-tour") {
      if (!hasCompletedWelcome && onboardingStatus !== "welcome") {
        startWelcome();
      }
      startOrientationTour();
      setPausedOnboardingContext(null);
      return;
    }

    startGuidedRun();
    setPausedOnboardingContext(null);
  }

  async function sendMessage(nextPrompt?: string) {
    const content = (nextPrompt ?? draft).trim();
    if (!content || status === "sending") {
      return;
    }

    const snapshot = currentContextSnapshot;
    const userMessage = createSergeantMessage({
      role: "user",
      kind: "user",
      content,
    });
    const nextMessages = [...messages, userMessage];

    appendMessage(userMessage);
    setLastContextSnapshot(snapshot);
    setStatus("sending");
    setResponseHints([]);
    if (!nextPrompt) {
      setDraft("");
    }

    try {
      const response = await fetch("/api/sergeant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
          context: snapshot,
        }),
      });

      const payload = (await response.json()) as Partial<SergeantResponsePayload>;
      if (isSergeantMessage(payload.assistantMessage)) {
        appendMessage(payload.assistantMessage);
      } else {
        appendSystemMessage(
          "I had trouble shaping that reply cleanly. Ask again and I will stay grounded in the current sim view.",
        );
      }

      setResponseHints(normalizeHints(payload.systemHints));
      setSuggestedPrompts(
        Array.isArray(payload.suggestedPrompts)
          ? payload.suggestedPrompts.filter((prompt): prompt is string => typeof prompt === "string")
          : [],
      );
      setStatus(response.ok ? "idle" : "error");
    } catch {
      appendSystemMessage(
        "I lost the local response channel. I can help again as soon as the Sergeant route is reachable.",
      );
      setStatus("error");
    }
  }

  if (!hasHydrated || !sergeantHydrated) {
    return null;
  }

  const mobilePanelShellClass =
    "pointer-events-auto fixed inset-x-2 bottom-2 z-[60] max-h-[min(32rem,calc(100vh-5rem))]";
  const showLauncher = !isAssistantOpen && !isWelcomeOpen && !isPanelVisible;
  const launcherHasAttention = hasUnreadSystemHint || pausedOnboardingContext !== null;

  function renderAssistantPanel(panelClassName: string, panelDragHandle?: ReactNode) {
    return (
      <TacticalPanel
        title="Sergeant"
        subtitle={`${currentContextSnapshot.run.controllerLabel} · ${scenario.name}`}
        className={panelClassName}
        bodyClassName="flex h-full min-h-0 flex-col"
        panelDragHandle={panelDragHandle}
        headerRight={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="font-sans text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-muted)] transition hover:text-[color:var(--hud-accent-fg)]"
              onClick={() => {
                setResponseHints([]);
                setSuggestedPrompts([]);
                clearConversation();
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="font-sans text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-muted)] transition hover:text-[color:var(--hud-accent-fg)]"
              onClick={closeAssistant}
            >
              Close
            </button>
          </div>
        }
      >
        <div className="border-b border-[color:var(--hud-line)] px-3 py-3">
          <p className="font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
            Ask about the current state, replay, controls, or what to do next.
          </p>
          {actionOptions.length > 0 || promptOptions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {actionOptions.map((action) => (
                <HudButton
                  key={action.id}
                  variant="ghost"
                  onClick={() => triggerQuickAction(action.id)}
                >
                  {action.label}
                </HudButton>
              ))}
              {promptOptions.map((prompt) => (
                <HudButton
                  key={prompt}
                  variant="ghost"
                  onClick={() => void sendMessage(prompt)}
                >
                  {prompt}
                </HudButton>
              ))}
            </div>
          ) : null}
        </div>

        <div
          ref={messageListRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
        >
          {messages.map((message) => {
            const tone = getMessageTone(message);

            return (
              <article
                key={message.id}
                className={`max-w-[92%] rounded-[16px] border px-3 py-2 ${
                  tone === "user"
                    ? "ml-auto border-[color:var(--hud-accent)]/35 bg-[color:var(--hud-accent)]/10"
                    : tone === "system"
                      ? "w-full max-w-full border-[color:var(--hud-line)] bg-black/20"
                      : "border-[color:var(--hud-line)] bg-black/15"
                }`}
              >
                <p className="font-sans text-[10px] font-medium uppercase tracking-[0.06em] text-[color:var(--hud-muted)]">
                  {tone === "user"
                    ? "You"
                    : tone === "system"
                      ? "System"
                      : "Sergeant"}
                </p>
                <p className="mt-1 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[color:var(--hud-fg)]">
                  {message.content}
                </p>
              </article>
            );
          })}
        </div>

        <form
          className="border-t border-[color:var(--hud-line)] px-3 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <label className="sr-only" htmlFor="sergeant-input">
            Ask Sergeant
          </label>
          <div className="flex items-center gap-2">
            <input
              id="sergeant-input"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about the sim or current state."
              className="min-w-0 flex-1 rounded-[14px] border border-[color:var(--hud-line)] bg-black/20 px-3 py-2 font-sans text-[13px] leading-relaxed text-[color:var(--hud-fg)] outline-none transition placeholder:text-[color:var(--hud-muted)] focus:border-[color:var(--hud-accent)]/45"
            />
            <HudButton
              type="submit"
              variant="primary"
              disabled={status === "sending" || draft.trim().length === 0}
            >
              Send
            </HudButton>
          </div>
          <p className="mt-2 font-sans text-[11px] text-[color:var(--hud-muted)]">
            {status === "sending"
              ? "Thinking through the current sim state."
              : status === "error"
                ? "Local reply channel unavailable. Try again."
                : "Read-only helper grounded in the current sim and replay state."}
          </p>
        </form>
      </TacticalPanel>
    );
  }

  return (
    <>
      {isAssistantOpen ? (
        <>
          <div className={`${mobilePanelShellClass} lg:hidden`}>
            {renderAssistantPanel("h-full rounded-[20px] shadow-[0_24px_60px_rgba(0,0,0,0.42)]")}
          </div>
          <FloatingHudPanel
            panelId="sergeant"
            defaultPosition={{ top: 88, left: 388 }}
            className="z-[60] hidden h-[min(40rem,calc(100vh-7.5rem))] w-[24rem] lg:block"
          >
            {(dragHandle) =>
              renderAssistantPanel(
                "h-full rounded-[20px] shadow-[0_24px_60px_rgba(0,0,0,0.42)]",
                dragHandle,
              )
            }
          </FloatingHudPanel>
        </>
      ) : null}

      {showLauncher ? (
        <button
          type="button"
          data-tour="onboarding-beacon"
          className="pointer-events-auto fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2 rounded-full border border-[color:var(--hud-line)] bg-[color:var(--hud-panel)] px-3 py-2 font-sans text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-fg)] shadow-[0_16px_40px_rgba(0,0,0,0.32)] transition hover:border-[color:var(--hud-accent)]/45 hover:text-[color:var(--hud-accent-fg)]"
          onClick={handleLauncherClick}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--hud-accent)]/35 bg-[color:var(--hud-accent)]/10 font-sans text-[10px] font-semibold text-[color:var(--hud-accent-fg)]">
            S
          </span>
          <span>Chat with Sergeant</span>
          {launcherHasAttention ? (
            <span className="h-2 w-2 rounded-full bg-[color:var(--hud-warn)]" />
          ) : null}
        </button>
      ) : null}
    </>
  );
}
