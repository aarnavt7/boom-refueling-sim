"use client";

import { useEffect, useRef, useState } from "react";

import { CycleControl } from "@/components/hud/CycleControl";
import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import {
  AIRCRAFT_CARD_OPTIONS,
  AUTONOMY_UPLOAD_HELP,
  CAMERA_MODE_OPTIONS,
  SAMPLE_CONTROLLER_SOURCE,
  SAMPLE_MISSION_JSON,
} from "@/lib/sim/autonomyCatalog";
import { scenarioPresets } from "@/lib/sim/scenarios";
import { createAutonomyManifest } from "@/lib/sim/autonomyUpload";
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
    label: "Aircraft",
    title: "Pick the aircraft card",
    detail:
      "Choose the pairing you want to present.",
  },
  {
    id: "scenario",
    label: "Scenario",
    title: "Set the mission preset",
    detail:
      "Dial in the environment and intercept profile.",
  },
  {
    id: "camera",
    label: "Camera",
    title: "Choose the scene camera",
    detail:
      "Manual orbit is the default so you can drag around the formation right away.",
  },
  {
    id: "autonomy",
    label: "Autonomy",
    title: "Optional upload",
    detail:
      "Add controller.js and mission.json, or skip this step.",
  },
  {
    id: "review",
    label: "Review",
    title: "Review and launch",
    detail:
      "Sanity-check the setup, then start the quick tour or jump straight into a live run.",
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
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
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
  const lastAutonomyUpload = useSimStore((state) => state.lastAutonomyUpload);
  const setLastAutonomyUpload = useSimStore((state) => state.setLastAutonomyUpload);
  const setAutonomyEvaluation = useSimStore((state) => state.setAutonomyEvaluation);

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
  const selectedScenario =
    scenarioPresets.find((scenario) => scenario.id === selectedScenarioId) ?? scenarioPresets[0];
  const selectedAircraftCard =
    AIRCRAFT_CARD_OPTIONS.find((option) => option.id === selectedAircraftCardId) ??
    AIRCRAFT_CARD_OPTIONS[0];
  const selectedCamera =
    CAMERA_MODE_OPTIONS.find((option) => option.id === cameraMode) ?? CAMERA_MODE_OPTIONS[0];
  const selectedScenarioIndex = scenarioPresets.findIndex(
    (scenario) => scenario.id === selectedScenarioId,
  );
  const hasAutonomyUpload = Boolean(
    lastAutonomyUpload?.controllerSource || lastAutonomyUpload?.missionJson,
  );
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

  async function readUpload(file: File | null, kind: "controller" | "mission") {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const nextManifest = createAutonomyManifest({
        ...(lastAutonomyUpload ?? {}),
        controllerName:
          kind === "controller" ? file.name : lastAutonomyUpload?.controllerName ?? null,
        controllerSource:
          kind === "controller" ? text : lastAutonomyUpload?.controllerSource ?? null,
        missionName: kind === "mission" ? file.name : lastAutonomyUpload?.missionName ?? null,
        missionJson: kind === "mission" ? text : lastAutonomyUpload?.missionJson ?? null,
        uploadedAt: Date.now(),
      });

      setLastAutonomyUpload(nextManifest);
      setAutonomyEvaluation(null);
      setUploadMessage(`Loaded ${file.name}.`);
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "Unable to read uploaded file.",
      );
    }
  }

  function launchMission() {
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
                Aircraft card
              </p>
           </div>

          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {AIRCRAFT_CARD_OPTIONS.map((option) => {
              const active = option.id === selectedAircraftCardId;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedAircraftCardId(option.id)}
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
                    {option.tanker} to {option.receiver}
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
            label="Scenario"
            valueLabel={selectedScenario.name}
            detail={selectedScenario.description}
            onPrevious={() => cycleScenario(-1)}
            onNext={() => cycleScenario(1)}
            previousLabel="Previous scenario"
            nextLabel="Next scenario"
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
                Upload autonomy
              </p>
              <p className="mt-1 max-w-[32rem] font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
                {AUTONOMY_UPLOAD_HELP}
              </p>
            </div>
            <HudButton
              variant="ghost"
              data-gamepad-focus-id="welcome-load-demo"
              data-gamepad-group="welcome-upload"
              data-gamepad-scope="overlay"
              data-gamepad-label="Load demo autonomy upload"
              onClick={() => {
                setLastAutonomyUpload(
                  createAutonomyManifest({
                    controllerName: "sample-controller.js",
                    controllerSource: SAMPLE_CONTROLLER_SOURCE,
                    missionName: "sample-mission.json",
                    missionJson: SAMPLE_MISSION_JSON,
                  }),
                );
                setAutonomyEvaluation(null);
                setUploadMessage("Loaded the built-in demo upload.");
              }}
            >
              Load demo
            </HudButton>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 font-sans text-[11px] text-[color:var(--hud-muted)]">
              controller.js
              <input
                type="file"
                accept=".js,text/javascript,application/javascript"
                className="tactical-file"
                onChange={(event) => {
                  void readUpload(event.target.files?.[0] ?? null, "controller");
                }}
              />
              <span className="text-[color:var(--hud-fg)]">
                {lastAutonomyUpload?.controllerName ?? "No controller loaded"}
              </span>
            </label>
            <label className="flex flex-col gap-1 font-sans text-[11px] text-[color:var(--hud-muted)]">
              mission.json
              <input
                type="file"
                accept=".json,application/json"
                className="tactical-file"
                onChange={(event) => {
                  void readUpload(event.target.files?.[0] ?? null, "mission");
                }}
              />
              <span className="text-[color:var(--hud-fg)]">
                {lastAutonomyUpload?.missionName ?? "No mission data loaded"}
              </span>
            </label>
          </div>

          {uploadMessage ? (
            <p className="mt-3 font-sans text-[11px] text-[color:var(--hud-accent-fg)]">
              {uploadMessage}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <HudButton
              variant="ghost"
              data-gamepad-focus-id="welcome-clear-upload"
              data-gamepad-group="welcome-upload"
              data-gamepad-scope="overlay"
              data-gamepad-label="Clear uploaded autonomy files"
              onClick={() => {
                setLastAutonomyUpload(null);
                setAutonomyEvaluation(null);
                setUploadMessage("Cleared uploaded autonomy files.");
              }}
            >
              Clear upload
            </HudButton>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-[18px] border border-[color:var(--hud-line)] bg-black/20 px-3 py-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Mission review
          </p>
          <div className="mt-2">
            <SetupSummaryRow label="Aircraft card" value={selectedAircraftCard.label} />
            <SetupSummaryRow label="Scenario" value={selectedScenario.name} />
            <SetupSummaryRow label="Camera mode" value={selectedCamera.label} />
            <SetupSummaryRow
              label="Autonomy upload"
              value={hasAutonomyUpload ? "Loaded" : "None"}
            />
          </div>
        </div>

        <div className="rounded-[18px] border border-[color:var(--hud-line)] bg-black/20 px-3 py-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Why the Xbox-style controller is here
          </p>
          <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-fg)]">
            Boom uses an Xbox-style controller because this is a simulator and debrief tool. Air Force aerial refueling already depends on simulator training, and defense organizations already use familiar commercial controller patterns when they reduce training friction.
          </p>
          <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
            In Boom, the controller is a low-cost operator console for inspection, scenario control, breakaway input, and replay review.
          </p>
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
          title="Mission setup"
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
                <div
                  className="h-full rounded-full bg-[color:var(--hud-accent)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h2
                id="onboarding-welcome-title"
                className="font-sans text-[1.05rem] font-semibold tracking-tight text-[color:var(--hud-fg)] sm:text-[1.15rem]"
              >
                {currentStep.title}
              </h2>
              <p className="max-w-[34rem] font-sans text-sm leading-relaxed text-[color:var(--hud-muted)]">
                {currentStep.detail}
              </p>
              {!isLastStep ? (
                <p className="max-w-[34rem] font-sans text-[12px] leading-relaxed text-[color:var(--hud-accent-fg)]">
                </p>
              ) : null}
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
                  {currentStep.id === "autonomy" ? "Review mission" : "Continue"}
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
                    data-gamepad-label="Launch live run"
                    onClick={launchMission}
                  >
                    Launch live run
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
