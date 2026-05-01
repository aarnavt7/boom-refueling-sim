"use client";

import { useEffect, useRef, useState } from "react";

import { CycleControl } from "@/components/hud/CycleControl";
import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import { AIRCRAFT_CARD_OPTIONS, CAMERA_MODE_OPTIONS } from "@/lib/sim/autonomyCatalog";
import { scenarioPresets } from "@/lib/sim/scenarios";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type WelcomeModalProps = {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
};

type SetupStepId = "aircraft" | "scenario" | "camera" | "autonomy" | "review";

const SETUP_STEPS: Array<{
  id: SetupStepId;
  label: string;
  title: string;
  detail: string;
}> = [
  {
    id: "aircraft",
    label: "Profile",
    title: "Pick the traveler mode",
    detail: "Choose the accessibility profile you want to demonstrate first.",
  },
  {
    id: "scenario",
    label: "Preset",
    title: "Set the journey preset",
    detail: "Choose the airport situation you want to compare before and after Pathlight routing.",
  },
  {
    id: "camera",
    label: "Camera",
    title: "Choose the scene camera",
    detail: "Free orbit is the default so you can inspect the terminal and route graph immediately.",
  },
  {
    id: "autonomy",
    label: "Output",
    title: "Preview the assistive output",
    detail: "See how the same route turns into landmark-first blind guidance or a low-vision simplified scene.",
  },
  {
    id: "review",
    label: "Review",
    title: "Review and launch",
    detail: "Sanity-check the setup, then start the quick tour or jump straight into a live journey.",
  },
];

function SetupSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[color:var(--hud-line)] py-2 last:border-b-0 last:pb-0">
      <span className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
        {label}
      </span>
      <span className="text-right font-sans text-[11px] text-[color:var(--hud-fg)]">
        {value}
      </span>
    </div>
  );
}

export function WelcomeModal({ open, onStart, onSkip }: WelcomeModalProps) {
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const selectedScenarioId = useUiStore((state) => state.selectedScenarioId);
  const selectedAircraftCardId = useUiStore((state) => state.selectedAircraftCardId);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const setScenarioId = useUiStore((state) => state.setScenarioId);
  const setSelectedAircraftCardId = useUiStore((state) => state.setSelectedAircraftCardId);
  const setCameraMode = useUiStore((state) => state.setCameraMode);
  const clearManualAbort = useUiStore((state) => state.clearManualAbort);
  const setReplayDataSource = useUiStore((state) => state.setReplayDataSource);
  const setEvaluationView = useUiStore((state) => state.setEvaluationView);
  const setReplayMode = useUiStore((state) => state.setReplayMode);
  const setReplayPlaying = useUiStore((state) => state.setReplayPlaying);
  const setReplayIndex = useUiStore((state) => state.setReplayIndex);
  const startLiveRun = useUiStore((state) => state.startLiveRun);
  const stopLiveRun = useUiStore((state) => state.stopLiveRun);
  const setScenarioById = useSimStore((state) => state.setScenarioById);
  const resetScenario = useSimStore((state) => state.resetScenario);

  useEffect(() => {
    if (!open) {
      return;
    }

    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    primaryButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onSkip();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSkip, open, stepIndex]);

  if (!open) {
    return null;
  }

  const currentStep = SETUP_STEPS[stepIndex] ?? SETUP_STEPS[0];
  const selectedScenario = scenarioPresets.find((scenario) => scenario.id === selectedScenarioId) ?? scenarioPresets[0];
  const selectedProfile = AIRCRAFT_CARD_OPTIONS.find((option) => option.id === selectedAircraftCardId) ?? AIRCRAFT_CARD_OPTIONS[0];
  const selectedCamera = CAMERA_MODE_OPTIONS.find((option) => option.id === cameraMode) ?? CAMERA_MODE_OPTIONS[0];
  const selectedScenarioIndex = scenarioPresets.findIndex((scenario) => scenario.id === selectedScenarioId);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === SETUP_STEPS.length - 1;
  const progressPercent = ((stepIndex + 1) / SETUP_STEPS.length) * 100;

  function goToPreviousStep() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function goToNextStep() {
    setStepIndex((current) => Math.min(SETUP_STEPS.length - 1, current + 1));
  }

  function cycleScenario(delta: number) {
    const safeIndex = selectedScenarioIndex === -1 ? 0 : selectedScenarioIndex;
    const nextIndex = (safeIndex + delta + scenarioPresets.length) % scenarioPresets.length;
    const nextScenario = scenarioPresets[nextIndex] ?? scenarioPresets[0];
    setScenarioId(nextScenario.id);
    setScenarioById(nextScenario.id);
  }

  function launchJourney() {
    setReplayMode(false);
    setReplayPlaying(false);
    setReplayIndex(0);
    setReplayDataSource("session");
    setEvaluationView("baseline");
    clearManualAbort();
    stopLiveRun();
    resetScenario(selectedScenarioId);
    startLiveRun();
    onSkip();
  }

  function renderStepContent() {
    if (currentStep.id === "aircraft") {
      return (
        <div className="space-y-3 rounded-[18px] border border-[color:var(--hud-line)] bg-black/20 px-3 py-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Traveler mode
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {AIRCRAFT_CARD_OPTIONS.map((option) => {
              const active = option.id === selectedAircraftCardId;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedAircraftCardId(option.id);
                    resetScenario(selectedScenarioId);
                  }}
                  data-gamepad-focus-id={`welcome-aircraft-${option.id}`}
                  data-gamepad-group="welcome-aircraft"
                  data-gamepad-scope="overlay"
                  data-gamepad-label={`Select ${option.label}`}
                  className={`rounded-[16px] border px-3 py-3 text-left transition ${
                    active
                      ? "border-[color:var(--hud-accent)] bg-[color:var(--hud-accent)]/12"
                      : "border-[color:var(--hud-line)] bg-black/10 hover:border-[color:var(--hud-accent)]/35"
                  }`}
                >
                  <p className="font-sans text-sm font-medium text-[color:var(--hud-fg)]">
                    {option.label}
                  </p>
                  <p className="mt-1 font-sans text-[11px] text-[color:var(--hud-muted)]">
                    {option.subtitle}
                  </p>
                  <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
                    {option.tanker} · {option.receiver}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentStep.id === "scenario") {
      return (
        <div className="rounded-[18px] border border-[color:var(--hud-line)] bg-black/20 px-3 py-3">
          <CycleControl
            label="Journey preset"
            valueLabel={selectedScenario.name}
            detail={selectedScenario.description}
            onPrevious={() => cycleScenario(-1)}
            onNext={() => cycleScenario(1)}
            previousLabel="Previous journey preset"
            nextLabel="Next journey preset"
            gamepadBaseId="welcome-scenario"
            gamepadGroup="welcome-config"
            gamepadScope="overlay"
          />
        </div>
      );
    }

    if (currentStep.id === "camera") {
      return (
        <div className="rounded-[18px] border border-[color:var(--hud-line)] bg-black/20 px-3 py-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Camera mode
          </p>
          <div className="mt-2 grid gap-2">
            {CAMERA_MODE_OPTIONS.map((option) => {
              const active = option.id === cameraMode;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCameraMode(option.id)}
                  data-gamepad-focus-id={`welcome-camera-${option.id}`}
                  data-gamepad-group="welcome-camera"
                  data-gamepad-scope="overlay"
                  data-gamepad-label={`Use ${option.label} camera mode`}
                  className={`rounded-[14px] border px-3 py-3 text-left transition ${
                    active
                      ? "border-[color:var(--hud-accent)] bg-[color:var(--hud-accent)]/10"
                      : "border-[color:var(--hud-line)] bg-black/10 hover:border-[color:var(--hud-accent)]/35"
                  }`}
                >
                  <p className="font-sans text-[12px] font-medium text-[color:var(--hud-fg)]">
                    {option.label}
                  </p>
                  <p className="mt-1 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
                    {option.detail}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentStep.id === "autonomy") {
      return (
        <div className="rounded-[18px] border border-[color:var(--hud-line)] bg-black/20 px-3 py-3">
          <div className="space-y-2">
            <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
              Assistive output
            </p>
            <p className="max-w-[32rem] font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
              Pathlight keeps the exact same terminal journey but changes how the route is communicated depending on the traveler profile.
            </p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] border border-[color:var(--hud-line)] bg-black/15 px-3 py-3">
              <p className="font-sans text-[12px] font-medium text-[color:var(--hud-fg)]">Blind mode</p>
              <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
                Landmark-first prompts, short distance bands, and clock-direction hints reduce cognitive load in noisy spaces.
              </p>
            </div>
            <div className="rounded-[16px] border border-[color:var(--hud-line)] bg-black/15 px-3 py-3">
              <p className="font-sans text-[12px] font-medium text-[color:var(--hud-fg)]">Low-vision mode</p>
              <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
                The scene simplifies around the walking path, raises contrast, and highlights landmarks before the traveler reaches a decision point.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-[18px] border border-[color:var(--hud-line)] bg-black/20 px-3 py-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Journey review
          </p>
          <div className="mt-2">
            <SetupSummaryRow label="Traveler mode" value={selectedProfile.label} />
            <SetupSummaryRow label="Journey preset" value={selectedScenario.name} />
            <SetupSummaryRow label="Camera mode" value={selectedCamera.label} />
            <SetupSummaryRow label="Assistive output" value={selectedProfile.subtitle} />
          </div>
        </div>
      </div>
    );
  }

  const backdropStyle = {
    backdropFilter: "blur(10px) brightness(0.45)",
    WebkitBackdropFilter: "blur(10px) brightness(0.45)",
    backgroundColor: "rgba(4, 6, 9, 0.58)",
  } as const;

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={backdropStyle} aria-hidden="true" />
      <div className="relative w-full max-w-[35rem] animate-onboarding-fade-up">
        <TacticalPanel
          title="Pathlight setup"
          subtitle={currentStep.label}
          scrollBody
          className="max-h-[min(48rem,calc(100dvh-2rem))] rounded-[26px] shadow-[0_28px_80px_rgba(0,0,0,0.5)]"
          bodyClassName="overflow-y-auto"
          headerRight={
            <span className="rounded-full border border-[color:var(--hud-line)] px-2 py-0.5 font-sans text-[10px] text-[color:var(--hud-muted)]">
              {stepIndex + 1}/{SETUP_STEPS.length}
            </span>
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-welcome-title"
            className="space-y-4 px-4 py-4 sm:px-5 sm:py-5"
          >
            <div className="space-y-2 rounded-[18px] border border-[color:var(--hud-line)] bg-black/20 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
                  Step {stepIndex + 1} of {SETUP_STEPS.length}
                </p>
                <span className="font-sans text-[11px] text-[color:var(--hud-fg)]">
                  {currentStep.label}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-[color:var(--hud-accent)]" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <h2 id="onboarding-welcome-title" className="font-sans text-[1.05rem] font-semibold tracking-tight text-[color:var(--hud-fg)] sm:text-[1.15rem]">
                {currentStep.title}
              </h2>
              <p className="max-w-[34rem] font-sans text-sm leading-relaxed text-[color:var(--hud-muted)]">
                {currentStep.detail}
              </p>
            </div>

            {renderStepContent()}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {!isFirstStep ? (
                  <HudButton
                    variant="ghost"
                    data-gamepad-focus-id="welcome-back"
                    data-gamepad-group="welcome-actions"
                    data-gamepad-scope="overlay"
                    data-gamepad-label="Go back a step"
                    onClick={goToPreviousStep}
                  >
                    Back
                  </HudButton>
                ) : null}
                <HudButton
                  variant="ghost"
                  data-gamepad-focus-id="welcome-skip"
                  data-gamepad-group="welcome-actions"
                  data-gamepad-scope="overlay"
                  data-gamepad-label="Skip onboarding"
                  data-gamepad-back-action="true"
                  onClick={onSkip}
                >
                  Skip onboarding
                </HudButton>
              </div>

              {!isLastStep ? (
                <HudButton
                  ref={primaryButtonRef}
                  variant="primary"
                  data-gamepad-focus-id="welcome-next"
                  data-gamepad-group="welcome-actions"
                  data-gamepad-scope="overlay"
                  data-gamepad-label={`Continue to ${SETUP_STEPS[stepIndex + 1]?.label ?? "review"}`}
                  data-gamepad-default="true"
                  onClick={goToNextStep}
                >
                  {currentStep.id === "autonomy" ? "Review journey" : "Continue"}
                </HudButton>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <HudButton
                    ref={primaryButtonRef}
                    variant="primary"
                    data-gamepad-focus-id="welcome-start-tour"
                    data-gamepad-group="welcome-actions"
                    data-gamepad-scope="overlay"
                    data-gamepad-label="Start quick tour"
                    data-gamepad-default="true"
                    onClick={onStart}
                  >
                    Start quick tour
                  </HudButton>
                  <HudButton
                    variant="ghost"
                    data-gamepad-focus-id="welcome-launch-live"
                    data-gamepad-group="welcome-actions"
                    data-gamepad-scope="overlay"
                    data-gamepad-label="Launch live journey"
                    onClick={launchJourney}
                  >
                    Launch live journey
                  </HudButton>
                </div>
              )}
            </div>
          </div>
        </TacticalPanel>
      </div>
    </div>
  );
}
