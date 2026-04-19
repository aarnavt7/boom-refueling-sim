"use client";

import { useEffect, useState } from "react";
import {
  ACTIONS,
  EVENTS,
  Joyride,
  ORIGIN,
  STATUS,
  type EventData,
  type Step,
  type TooltipRenderProps,
} from "react-joyride";

import { HudButton } from "@/components/hud/tactical-ui";
import { SpotlightOverlay } from "@/components/onboarding/SpotlightOverlay";
import {
  getOrientationTourDefinitions,
  type OrientationTourStepDefinition,
} from "@/lib/onboarding/tourConfig";
import { useOnboardingStore } from "@/lib/store/onboardingStore";

const COMPACT_TOUR_BREAKPOINT = 1024;

function getIsCompactViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth < COMPACT_TOUR_BREAKPOINT;
}

function getResolvedIndex(
  definitions: readonly OrientationTourStepDefinition[],
  tourStepIndex: number,
  tourCurrentStepId: string | null,
) {
  if (definitions.length === 0) {
    return 0;
  }

  if (tourCurrentStepId) {
    const matchingIndex = definitions.findIndex((definition) => definition.id === tourCurrentStepId);

    if (matchingIndex !== -1) {
      return matchingIndex;
    }
  }

  return Math.min(Math.max(0, tourStepIndex), definitions.length - 1);
}

function hasTarget(selector: string) {
  if (typeof document === "undefined") {
    return false;
  }

  return document.querySelector(selector) instanceof HTMLElement;
}

export function GuidedTour() {
  const hasHydrated = useOnboardingStore((state) => state.hasHydrated);
  const status = useOnboardingStore((state) => state.status);
  const isDismissed = useOnboardingStore((state) => state.isDismissed);
  const tourStepIndex = useOnboardingStore((state) => state.tourStepIndex);
  const tourCurrentStepId = useOnboardingStore((state) => state.tourCurrentStepId);
  const setTourProgress = useOnboardingStore((state) => state.setTourProgress);
  const dismissOrientationTour = useOnboardingStore((state) => state.dismissOrientationTour);
  const completeOrientationTour = useOnboardingStore((state) => state.completeOrientationTour);
  const [isCompact, setIsCompact] = useState(getIsCompactViewport);

  useEffect(() => {
    const updateViewportMode = () => {
      setIsCompact(getIsCompactViewport());
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    return () => window.removeEventListener("resize", updateViewportMode);
  }, []);

  const definitions = getOrientationTourDefinitions(isCompact);
  const resolvedIndex = getResolvedIndex(definitions, tourStepIndex, tourCurrentStepId);
  const activeDefinition = definitions[resolvedIndex] ?? null;
  const run = hasHydrated && status === "tour" && !isDismissed && definitions.length > 0;

  useEffect(() => {
    if (!run || !activeDefinition) {
      return;
    }

    if (tourStepIndex === resolvedIndex && tourCurrentStepId === activeDefinition.id) {
      return;
    }

    setTourProgress(resolvedIndex, activeDefinition.id);
  }, [
    activeDefinition,
    resolvedIndex,
    run,
    setTourProgress,
    tourCurrentStepId,
    tourStepIndex,
  ]);

  useEffect(() => {
    if (!run) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      dismissOrientationTour();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissOrientationTour, run]);

  const steps: Step[] = definitions.map((definition) => {
    const targetExists = hasTarget(definition.selector);

    return {
      target: targetExists ? definition.selector : "body",
      placement: targetExists
        ? isCompact
          ? definition.mobilePlacement
          : definition.desktopPlacement
        : "center",
      title: definition.title,
      content: definition.description,
      hideOverlay: true,
      overlayClickAction: false,
      dismissKeyAction: false,
      skipBeacon: true,
      skipScroll: true,
      blockTargetInteraction: true,
      isFixed: true,
      spotlightPadding: 0,
      offset: targetExists ? 16 : 0,
      buttons: ["back", "primary"],
      floatingOptions: {
        hideArrow: !targetExists,
      },
      styles: {
        floater: {
          filter: "drop-shadow(0 22px 60px rgba(0, 0, 0, 0.48))",
        },
      },
    };
  });

  function handleTourEvent(data: EventData) {
    const { action, index, status: tourStatus, type } = data;

    if (tourStatus === STATUS.FINISHED) {
      completeOrientationTour();
      return;
    }

    if (tourStatus === STATUS.SKIPPED) {
      dismissOrientationTour();
      return;
    }

    if (type !== EVENTS.STEP_AFTER) {
      return;
    }

    const direction = action === ACTIONS.PREV ? -1 : 1;
    const nextIndex = index + direction;

    if (nextIndex >= steps.length) {
      completeOrientationTour();
      return;
    }

    if (nextIndex < 0) {
      setTourProgress(0, definitions[0]?.id ?? null);
      return;
    }

    setTourProgress(nextIndex, definitions[nextIndex]?.id ?? null);
  }

  const activeSelector =
    run && activeDefinition && hasTarget(activeDefinition.selector) ? activeDefinition.selector : null;

  function Tooltip({ index, size, step, tooltipProps, controls }: TooltipRenderProps) {
    return (
      <div
        {...tooltipProps}
        className="animate-onboarding-fade-up w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-[24px] border border-[color:var(--hud-line)] bg-[color:var(--hud-panel)] shadow-[0_24px_72px_rgba(0,0,0,0.52)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--hud-line)] px-4 py-3">
          <div className="min-w-0">
            <p className="font-sans text-[10px] font-medium tracking-[0.08em] text-[color:var(--hud-muted)] uppercase">
              Orientation
            </p>
            <p className="mt-1 font-sans text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-fg)]">
              {index + 1} of {size}
            </p>
          </div>
          <button
            type="button"
            className="font-sans text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-muted)] transition hover:text-[color:var(--hud-accent-fg)]"
            onClick={() => dismissOrientationTour()}
          >
            Close
          </button>
        </div>

        <div className="space-y-2 px-4 py-4">
          <h2 className="font-sans text-[1rem] font-semibold tracking-tight text-[color:var(--hud-fg)]">
            {step.title}
          </h2>
          <div className="font-sans text-sm leading-relaxed text-[color:var(--hud-muted)]">
            {step.content}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[color:var(--hud-line)] px-4 py-3">
          <HudButton
            variant="ghost"
            disabled={index === 0}
            onClick={() => controls.prev(ORIGIN.BUTTON_BACK)}
          >
            Back
          </HudButton>
          <div className="flex items-center gap-2">
            <HudButton variant="ghost" onClick={() => dismissOrientationTour()}>
              Skip
            </HudButton>
            <HudButton variant="primary" onClick={() => controls.next(ORIGIN.BUTTON_PRIMARY)}>
              Next
            </HudButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SpotlightOverlay selector={activeSelector} active={run} compact={isCompact} />
      <Joyride
        continuous
        locale={{
          back: "Back",
          close: "Close",
          last: "Next",
          next: "Next",
          skip: "Skip",
        }}
        onEvent={handleTourEvent}
        options={{
          arrowColor: "rgba(16, 17, 22, 0.98)",
          backgroundColor: "rgba(16, 17, 22, 0.98)",
          overlayColor: "transparent",
          primaryColor: "#e36b17",
          spotlightPadding: 0,
          textColor: "#eef1f5",
          width: 384,
          zIndex: 60,
        }}
        run={run}
        scrollToFirstStep={false}
        stepIndex={resolvedIndex}
        steps={steps}
        styles={{
          arrow: {
            color: "rgba(16, 17, 22, 0.98)",
          },
          tooltip: {
            backgroundColor: "transparent",
            borderRadius: 0,
            boxShadow: "none",
            padding: 0,
          },
          tooltipContainer: {
            padding: 0,
          },
          tooltipContent: {
            padding: 0,
          },
        }}
        tooltipComponent={Tooltip}
      />
    </>
  );
}
