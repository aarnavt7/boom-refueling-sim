"use client";

import { useEffect, type ReactNode } from "react";

import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import { GuidedRunDirector } from "@/components/onboarding/GuidedRunDirector";
import { GuidedTour } from "@/components/onboarding/GuidedTour";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { SergeantAssistant } from "../sergeant/SergeantAssistant";
import {
  persistOnboardingState,
  type OnboardingStatus,
  useOnboardingStore,
} from "@/lib/store/onboardingStore";
import { useSergeantStore } from "@/lib/store/sergeantStore";

function getStatusLabel(
  status: OnboardingStatus,
  hasCompleted: boolean,
  hasCompletedOrientationTour: boolean,
  hasCompletedPhase3: boolean,
  isDismissed: boolean,
  isMissionPaused: boolean,
) {
  if (hasCompleted || status === "completed") {
    return "Ready";
  }

  if (isMissionPaused) {
    return "Mission paused";
  }

  if (status === "tour" && isDismissed) {
    return "Paused";
  }

  if (hasCompletedPhase3) {
    return "Mission done";
  }

  if (hasCompletedOrientationTour || status === "guided-run" || status === "replay-debrief") {
    return "Mission queued";
  }

  if (status === "welcome") {
    return "Briefing";
  }

  return "Queued";
}

function getBodyCopy(
  status: OnboardingStatus,
  hasCompleted: boolean,
  hasCompletedOrientationTour: boolean,
  hasCompletedPhase3: boolean,
  isDismissed: boolean,
  isMissionPaused: boolean,
) {
  if (hasCompleted || status === "completed") {
    return "Onboarding progress is saved. The orientation, guided run, replay handoff, and any saved local run can all be revisited whenever you want.";
  }

  if (isMissionPaused) {
    return "The mission walkthrough is paused. Your stage is saved locally, so the beacon can bring you back to the same beat, replay handoff, or finish card.";
  }

  if (status === "tour" && isDismissed) {
    return "The orientation tour is paused. Your step is saved locally, so the beacon can bring you back to the exact place you left off.";
  }

  if (hasCompletedPhase3) {
    return "The low-stress orientation and the first choreographed mission pass are both complete. You can reopen either layer when you want a refresher.";
  }

  if (hasCompletedOrientationTour || status === "guided-run" || status === "replay-debrief") {
    return "The HUD orientation is done. The next layer is a guided mission walkthrough with one clean run, a replay debrief, and a local save handoff.";
  }

  if (status === "welcome") {
    return "The mission brief is queued. Start the quick tour when you want the sim to dim the noise and walk you through the interface one step at a time.";
  }

  return "A calm orientation tour is ready. It softly spotlights one panel at a time, explains what matters first, and keeps the next guided run staged for later.";
}

function getPanelSubtitle(
  status: OnboardingStatus,
  hasCompleted: boolean,
  hasCompletedOrientationTour: boolean,
  hasCompletedPhase3: boolean,
  isDismissed: boolean,
  isMissionPaused: boolean,
) {
  if (hasCompleted || status === "completed") {
    return "Onboarding complete";
  }

  if (isMissionPaused) {
    return "Mission paused";
  }

  if (status === "tour" && isDismissed) {
    return "Orientation paused";
  }

  if (hasCompletedPhase3) {
    return "Mission complete";
  }

  if (hasCompletedOrientationTour || status === "guided-run" || status === "replay-debrief") {
    return "Mission walkthrough";
  }

  return "Low-stress orientation";
}

function getPrimaryLabel(
  status: OnboardingStatus,
  hasCompleted: boolean,
  hasCompletedWelcome: boolean,
  hasCompletedOrientationTour: boolean,
  hasCompletedPhase3: boolean,
  isDismissed: boolean,
  isMissionPaused: boolean,
) {
  if (hasCompleted || hasCompletedPhase3 || status === "completed") {
    return "Review mission";
  }

  if (isMissionPaused) {
    return "Resume mission";
  }

  if (
    hasCompletedOrientationTour ||
    status === "guided-run" ||
    status === "replay-debrief"
  ) {
    return "Start mission";
  }

  if (status === "tour" && isDismissed) {
    return "Resume tour";
  }

  if (hasCompletedWelcome) {
    return "Resume tour";
  }

  return "Start";
}

function getSecondaryLabel(
  status: OnboardingStatus,
  hasCompleted: boolean,
  hasCompletedOrientationTour: boolean,
  hasCompletedPhase3: boolean,
  isDismissed: boolean,
  isMissionPaused: boolean,
) {
  if (
    hasCompleted ||
    hasCompletedPhase3 ||
    hasCompletedOrientationTour ||
    status === "guided-run" ||
    status === "replay-debrief" ||
    isDismissed ||
    isMissionPaused
  ) {
    return "Hide";
  }

  return "Skip";
}

export function OnboardingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const hasHydrated = useOnboardingStore((state) => state.hasHydrated);
  const version = useOnboardingStore((state) => state.version);
  const status = useOnboardingStore((state) => state.status);
  const checklist = useOnboardingStore((state) => state.checklist);
  const isOpen = useOnboardingStore((state) => state.isOpen);
  const isDismissed = useOnboardingStore((state) => state.isDismissed);
  const hasCompleted = useOnboardingStore((state) => state.hasCompleted);
  const allowOrbitControls = useOnboardingStore((state) => state.allowOrbitControls);
  const hasSeenWelcome = useOnboardingStore((state) => state.hasSeenWelcome);
  const tourStepIndex = useOnboardingStore((state) => state.tourStepIndex);
  const tourCurrentStepId = useOnboardingStore((state) => state.tourCurrentStepId);
  const hasCompletedWelcome = useOnboardingStore((state) => state.hasCompletedWelcome);
  const hasCompletedOrientationTour = useOnboardingStore(
    (state) => state.hasCompletedOrientationTour,
  );
  const phase2DismissedAt = useOnboardingStore((state) => state.phase2DismissedAt);
  const guidedRunStage = useOnboardingStore((state) => state.guidedRunStage);
  const hasCompletedGuidedRun = useOnboardingStore((state) => state.hasCompletedGuidedRun);
  const hasCompletedReplayDebrief = useOnboardingStore(
    (state) => state.hasCompletedReplayDebrief,
  );
  const autoSavedRunId = useOnboardingStore((state) => state.autoSavedRunId);
  const hasConsumedFirstPhase3Autostart = useOnboardingStore(
    (state) => state.hasConsumedFirstPhase3Autostart,
  );
  const hydrateFromStorage = useOnboardingStore((state) => state.hydrateFromStorage);
  const startWelcome = useOnboardingStore((state) => state.startWelcome);
  const startOrientationTour = useOnboardingStore((state) => state.startOrientationTour);
  const resumeOrientationTour = useOnboardingStore((state) => state.resumeOrientationTour);
  const startGuidedRun = useOnboardingStore((state) => state.startGuidedRun);
  const resumeGuidedRun = useOnboardingStore((state) => state.resumeGuidedRun);
  const skipOnboarding = useOnboardingStore((state) => state.skipOnboarding);
  const closePanel = useOnboardingStore((state) => state.closePanel);
  const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
  const openAssistant = useSergeantStore((state) => state.openAssistant);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistOnboardingState({
      version,
      status,
      checklist,
      isOpen,
      isDismissed,
      hasCompleted,
      allowOrbitControls,
      hasSeenWelcome,
      tourStepIndex,
      tourCurrentStepId,
      hasCompletedWelcome,
      hasCompletedOrientationTour,
      phase2DismissedAt,
      guidedRunStage,
      hasCompletedGuidedRun,
      hasCompletedReplayDebrief,
      autoSavedRunId,
      hasConsumedFirstPhase3Autostart,
    });
  }, [
    autoSavedRunId,
    allowOrbitControls,
    checklist,
    hasCompleted,
    hasCompletedGuidedRun,
    hasCompletedOrientationTour,
    hasCompletedReplayDebrief,
    hasCompletedWelcome,
    hasConsumedFirstPhase3Autostart,
    hasHydrated,
    hasSeenWelcome,
    guidedRunStage,
    isDismissed,
    isOpen,
    phase2DismissedAt,
    status,
    tourCurrentStepId,
    tourStepIndex,
    version,
  ]);

  const completedCount = checklist.filter((item) => item.completed).length;
  const hasCompletedPhase3 = hasCompletedGuidedRun && hasCompletedReplayDebrief;
  const isMissionPaused =
    (status === "guided-run" || status === "replay-debrief") && isDismissed;
  const statusLabel = getStatusLabel(
    status,
    hasCompleted,
    hasCompletedOrientationTour,
    hasCompletedPhase3,
    isDismissed,
    isMissionPaused,
  );
  const primaryLabel = getPrimaryLabel(
    status,
    hasCompleted,
    hasCompletedWelcome,
    hasCompletedOrientationTour,
    hasCompletedPhase3,
    isDismissed,
    isMissionPaused,
  );
  const secondaryLabel = getSecondaryLabel(
    status,
    hasCompleted,
    hasCompletedOrientationTour,
    hasCompletedPhase3,
    isDismissed,
    isMissionPaused,
  );
  const panelSubtitle = getPanelSubtitle(
    status,
    hasCompleted,
    hasCompletedOrientationTour,
    hasCompletedPhase3,
    isDismissed,
    isMissionPaused,
  );
  const isWelcomeOpen = status === "welcome";
  const isTourActive = status === "tour" && !isDismissed;
  const isMissionActive =
    (status === "guided-run" || status === "replay-debrief") &&
    !isDismissed &&
    guidedRunStage !== null;

  function handlePrimaryAction() {
    if (hasCompleted || hasCompletedPhase3 || status === "completed") {
      startGuidedRun();
      return;
    }

    if (isMissionPaused) {
      resumeGuidedRun();
      return;
    }

    if (
      hasCompletedOrientationTour ||
      status === "guided-run" ||
      status === "replay-debrief"
    ) {
      startGuidedRun();
      return;
    }

    if (status === "tour" && isDismissed) {
      resumeOrientationTour();
      return;
    }

    if (!hasCompletedWelcome) {
      startWelcome();
      return;
    }

    startOrientationTour();
  }

  function handleSecondaryAction() {
    if (
      hasCompleted ||
      hasCompletedPhase3 ||
      hasCompletedOrientationTour ||
      status === "guided-run" ||
      status === "replay-debrief" ||
      isDismissed ||
      isMissionPaused
    ) {
      closePanel();
      return;
    }

    skipOnboarding();
  }

  function handleOpenSergeant() {
    closePanel();
    openAssistant();
  }

  return (
    <>
      {children}
      <WelcomeModal
        open={hasHydrated && isWelcomeOpen}
        onStart={startOrientationTour}
        onSkip={skipOnboarding}
      />
      <GuidedTour />
      <GuidedRunDirector />

      {hasHydrated ? (
        <div className="pointer-events-none fixed inset-0 z-20">
          {isOpen && !isWelcomeOpen && !isTourActive && !isMissionActive ? (
            <div className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(23rem,calc(100vw-1.5rem))] -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0">
              <TacticalPanel
                title="Onboarding"
                subtitle={panelSubtitle}
                className="rounded-[24px] shadow-[0_24px_72px_rgba(0,0,0,0.52)]"
                data-tour="onboarding-panel"
                headerRight={
                  <span className="rounded-full border border-[color:var(--hud-line)] px-2 py-0.5 font-sans text-[10px] font-medium tracking-[0.02em] text-[color:var(--hud-muted)]">
                    {statusLabel}
                  </span>
                }
              >
                <div className="space-y-3 px-3 py-3">
                  <p className="font-sans text-xs leading-relaxed text-[color:var(--hud-muted)]">
                    {getBodyCopy(
                      status,
                      hasCompleted,
                      hasCompletedOrientationTour,
                      hasCompletedPhase3,
                      isDismissed,
                      isMissionPaused,
                    )}
                  </p>

                  <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[color:var(--hud-line)] bg-black/15 px-3 py-2">
                    <p className="font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
                      Need a guide? Sergeant can explain what you&apos;re seeing and recommend the next step.
                    </p>
                    <HudButton
                      variant="ghost"
                      data-gamepad-focus-id="onboarding-sergeant"
                      data-gamepad-group="onboarding-panel"
                      data-gamepad-scope="overlay"
                      data-gamepad-label="Ask Sergeant"
                      onClick={handleOpenSergeant}
                    >
                      Ask Sergeant
                    </HudButton>
                  </div>

                  <div className="overflow-hidden rounded-[18px] border border-[color:var(--hud-line)] bg-black/20">
                    <div className="flex items-center justify-between border-b border-[color:var(--hud-line)] px-3 py-2 font-sans text-[10px] font-medium tracking-[0.02em] text-[color:var(--hud-muted)]">
                      <span>Checklist scaffold</span>
                      <span className="tabular-nums">
                        {completedCount}/{checklist.length}
                      </span>
                    </div>
                    <div className="space-y-1 px-3 py-2">
                      {checklist.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 font-sans text-[11px] text-[color:var(--hud-fg)]"
                        >
                          <span
                            aria-hidden="true"
                            className={`h-2 w-2 rounded-full border ${
                              item.completed
                                ? "border-[color:var(--hud-ok)] bg-[color:var(--hud-ok)]"
                                : "border-[color:var(--hud-line)] bg-transparent"
                            }`}
                          />
                          <span className={item.completed ? "text-[color:var(--hud-muted)]" : ""}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <HudButton
                      variant="primary"
                      data-gamepad-focus-id="onboarding-primary"
                      data-gamepad-group="onboarding-panel"
                      data-gamepad-scope="overlay"
                      data-gamepad-label={primaryLabel}
                      data-gamepad-default="true"
                      onClick={handlePrimaryAction}
                    >
                      {primaryLabel}
                    </HudButton>
                    <HudButton
                      variant="ghost"
                      data-gamepad-focus-id="onboarding-secondary"
                      data-gamepad-group="onboarding-panel"
                      data-gamepad-scope="overlay"
                      data-gamepad-label={secondaryLabel}
                      data-gamepad-back-action="true"
                      onClick={handleSecondaryAction}
                    >
                      {secondaryLabel}
                    </HudButton>
                    <HudButton
                      variant="ghost"
                      data-gamepad-focus-id="onboarding-reset"
                      data-gamepad-group="onboarding-panel"
                      data-gamepad-scope="overlay"
                      data-gamepad-label="Reset onboarding"
                      onClick={resetOnboarding}
                    >
                      Reset
                    </HudButton>
                  </div>
                </div>
              </TacticalPanel>
            </div>
          ) : null}
        </div>
      ) : null}
      <SergeantAssistant />
    </>
  );
}
