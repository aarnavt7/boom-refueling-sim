"use client";

import type { ReactNode } from "react";

import { CycleControl } from "@/components/hud/CycleControl";
import { formatControllerStateLabel } from "@/components/hud/controllerPresentation";
import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import {
  AIRCRAFT_CARD_OPTIONS,
  CAMERA_MODE_OPTIONS,
} from "@/lib/sim/autonomyCatalog";
import { formatLiveRunRate, LIVE_RUN_RATE_OPTIONS } from "@/lib/sim/runRate";
import { scenarioPresets } from "@/lib/sim/scenarios";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export function ScenarioPanel({
  className = "min-h-0 lg:h-full",
  bodyClassName = "",
  scrollBody = true,
  headerActions,
  panelDragHandle,
}: {
  className?: string;
  bodyClassName?: string;
  scrollBody?: boolean;
  headerActions?: ReactNode;
  panelDragHandle?: ReactNode;
}) {
  const selectedScenarioId = useUiStore((state) => state.selectedScenarioId);
  const selectedAircraftCardId = useUiStore((state) => state.selectedAircraftCardId);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const showDebug = useUiStore((state) => state.showDebug);
  const liveRunState = useUiStore((state) => state.liveRunState);
  const liveRunRate = useUiStore((state) => state.liveRunRate);
  const setScenarioId = useUiStore((state) => state.setScenarioId);
  const setSelectedAircraftCardId = useUiStore((state) => state.setSelectedAircraftCardId);
  const setCameraMode = useUiStore((state) => state.setCameraMode);
  const toggleDebug = useUiStore((state) => state.toggleDebug);
  const startLiveRun = useUiStore((state) => state.startLiveRun);
  const pauseLiveRun = useUiStore((state) => state.pauseLiveRun);
  const stopLiveRun = useUiStore((state) => state.stopLiveRun);
  const stepLiveRunRate = useUiStore((state) => state.stepLiveRunRate);
  const setReplayMode = useUiStore((state) => state.setReplayMode);
  const setReplayPlaying = useUiStore((state) => state.setReplayPlaying);
  const setReplayIndex = useUiStore((state) => state.setReplayIndex);
  const onboardingStatus = useOnboardingStore((state) => state.status);
  const onboardingDismissed = useOnboardingStore((state) => state.isDismissed);
  const guidedRunStage = useOnboardingStore((state) => state.guidedRunStage);
  const setScenarioById = useSimStore((state) => state.setScenarioById);
  const resetScenario = useSimStore((state) => state.resetScenario);
  const live = useSimStore((state) => state.live);
  const replayMode = useUiStore((state) => state.replayMode);

  const selectedScenario =
    scenarioPresets.find((scenario) => scenario.id === selectedScenarioId) ?? scenarioPresets[0];
  const selectedProfile =
    AIRCRAFT_CARD_OPTIONS.find((option) => option.id === selectedAircraftCardId) ??
    AIRCRAFT_CARD_OPTIONS[0];
  const isJourneyLocked =
    (onboardingStatus === "guided-run" || onboardingStatus === "replay-debrief") &&
    !onboardingDismissed &&
    guidedRunStage !== null;
  const runStatusLabel = replayMode
    ? "Replay open"
    : liveRunState === "running"
      ? "Journey live"
      : liveRunState === "paused"
        ? "Paused"
        : "Ready";
  const runStatusClass = replayMode
    ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
    : liveRunState === "running"
      ? "border-[color:var(--hud-ok)]/45 text-[color:var(--hud-ok)]"
      : liveRunState === "paused"
        ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
        : "border-[color:var(--hud-line)] text-[color:var(--hud-muted)]";
  const runStatusCopy = isJourneyLocked
    ? "The guided walkthrough is controlling this journey right now."
    : replayMode
      ? "Replay is open. Starting a fresh journey will exit replay and begin a new guided trip."
      : liveRunState === "running"
        ? "The traveler is moving along the selected route and recording replay samples."
        : liveRunState === "paused"
          ? "Resume to continue from the current traveler position."
          : "Start launches a fresh Pathlight journey from the beginning of the selected preset.";

  const selectedScenarioIndex = scenarioPresets.findIndex((scenario) => scenario.id === selectedScenario.id);
  const selectedProfileIndex = AIRCRAFT_CARD_OPTIONS.findIndex((option) => option.id === selectedAircraftCardId);
  const selectedCameraIndex = CAMERA_MODE_OPTIONS.findIndex((option) => option.id === cameraMode);
  const liveRunRateIndex = LIVE_RUN_RATE_OPTIONS.indexOf(liveRunRate);

  function applyScenarioChange(nextId: string) {
    setScenarioId(nextId);
    setReplayMode(false);
    setReplayPlaying(false);
    setReplayIndex(0);
    stopLiveRun();
    setScenarioById(nextId);
  }

  function cycleScenario(delta: number) {
    const safeIndex = selectedScenarioIndex === -1 ? 0 : selectedScenarioIndex;
    const nextIndex = (safeIndex + delta + scenarioPresets.length) % scenarioPresets.length;
    applyScenarioChange(scenarioPresets[nextIndex]?.id ?? scenarioPresets[0].id);
  }

  function cycleProfile(delta: number) {
    const safeIndex = selectedProfileIndex === -1 ? 0 : selectedProfileIndex;
    const nextIndex = (safeIndex + delta + AIRCRAFT_CARD_OPTIONS.length) % AIRCRAFT_CARD_OPTIONS.length;
    const nextProfile = AIRCRAFT_CARD_OPTIONS[nextIndex] ?? AIRCRAFT_CARD_OPTIONS[0];
    setSelectedAircraftCardId(nextProfile.id);
    resetScenario(selectedScenarioId);
  }

  function cycleCameraMode(delta: number) {
    const safeIndex = selectedCameraIndex === -1 ? 0 : selectedCameraIndex;
    const nextIndex = (safeIndex + delta + CAMERA_MODE_OPTIONS.length) % CAMERA_MODE_OPTIONS.length;
    setCameraMode(CAMERA_MODE_OPTIONS[nextIndex]?.id ?? CAMERA_MODE_OPTIONS[0].id);
  }

  return (
    <TacticalPanel
      data-tour="scenario-panel"
      className={className}
      bodyClassName={bodyClassName}
      scrollBody={scrollBody}
      title="Journey Setup"
      subtitle={`${selectedScenario.environment.name} · ${selectedProfile.label}`}
      headerActions={headerActions}
      panelDragHandle={panelDragHandle}
    >
      <p className="border-b border-[color:var(--hud-line)] px-3 py-2 font-sans text-xs leading-relaxed text-[color:var(--hud-muted)]">
        {selectedScenario.description}
      </p>

      <div className="px-3 py-2">
        <CycleControl
          label="Preset"
          valueLabel={selectedScenario.name}
          detail={selectedScenario.journey?.pathlightSummary ?? selectedScenario.description}
          onPrevious={() => cycleScenario(-1)}
          onNext={() => cycleScenario(1)}
          previousLabel="Previous preset"
          nextLabel="Next preset"
          gamepadBaseId="scenario-preset"
          gamepadGroup="scenario-config"
        />
      </div>

      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <CycleControl
          label="Traveler mode"
          valueLabel={selectedProfile.label}
          detail={`${selectedProfile.subtitle} · ${selectedProfile.tanker} · ${selectedProfile.receiver}`}
          onPrevious={() => cycleProfile(-1)}
          onNext={() => cycleProfile(1)}
          previousLabel="Previous traveler mode"
          nextLabel="Next traveler mode"
          gamepadBaseId="scenario-profile"
          gamepadGroup="scenario-config"
        />
      </div>

      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <CycleControl
          label="Camera"
          valueLabel={CAMERA_MODE_OPTIONS.find((option) => option.id === cameraMode)?.label ?? CAMERA_MODE_OPTIONS[0].label}
          detail={CAMERA_MODE_OPTIONS.find((option) => option.id === cameraMode)?.detail ?? CAMERA_MODE_OPTIONS[0].detail}
          onPrevious={() => cycleCameraMode(-1)}
          onNext={() => cycleCameraMode(1)}
          previousLabel="Previous camera mode"
          nextLabel="Next camera mode"
          gamepadBaseId="scenario-camera"
          gamepadGroup="scenario-config"
        />
      </div>

      <div data-tour="run-controls" className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Journey controls
          </p>
          <span className={`rounded-full border px-2 py-0.5 font-sans text-[10px] font-medium tracking-[0.02em] ${runStatusClass}`}>
            {runStatusLabel}
          </span>
        </div>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
          {runStatusCopy}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <HudButton
            variant="primary"
            data-gamepad-focus-id="run-start"
            data-gamepad-group="scenario-run"
            data-gamepad-label={replayMode ? "Start live journey" : liveRunState === "paused" ? "Resume journey" : "Start journey"}
            data-gamepad-default="true"
            disabled={isJourneyLocked || (!replayMode && liveRunState === "running")}
            onClick={() => {
              setReplayMode(false);
              setReplayPlaying(false);
              setReplayIndex(0);

              if (liveRunState === "paused" && !replayMode) {
                startLiveRun();
                return;
              }

              resetScenario(selectedScenarioId);
              startLiveRun();
            }}
          >
            {replayMode ? "Start live journey" : liveRunState === "paused" ? "Resume" : "Start"}
          </HudButton>
          <HudButton
            variant="ghost"
            data-gamepad-focus-id="run-pause"
            data-gamepad-group="scenario-run"
            data-gamepad-label="Pause journey"
            disabled={isJourneyLocked || replayMode || liveRunState !== "running"}
            onClick={pauseLiveRun}
          >
            Pause
          </HudButton>
          <HudButton
            variant="ghost"
            data-gamepad-focus-id="run-stop"
            data-gamepad-group="scenario-run"
            data-gamepad-label="Reset journey"
            disabled={isJourneyLocked || replayMode || liveRunState === "stopped"}
            onClick={() => {
              stopLiveRun();
              resetScenario(selectedScenarioId);
            }}
          >
            Reset
          </HudButton>
        </div>
      </div>

      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
          Live rate
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <HudButton
            variant="ghost"
            data-gamepad-focus-id="run-rate-slower"
            data-gamepad-group="scenario-run"
            data-gamepad-label="Slow live run"
            disabled={isJourneyLocked || liveRunRateIndex <= 0}
            onClick={() => stepLiveRunRate(-1)}
          >
            Slower
          </HudButton>
          <div className="min-w-0 flex-1 rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] bg-black/20 px-3 py-2 text-center">
            <p className="truncate font-sans text-[12px] font-medium tracking-[0.02em] text-[color:var(--hud-fg)]">
              {formatLiveRunRate(liveRunRate)}
            </p>
          </div>
          <HudButton
            variant="ghost"
            data-gamepad-focus-id="run-rate-faster"
            data-gamepad-group="scenario-run"
            data-gamepad-label="Speed up live run"
            disabled={isJourneyLocked || liveRunRateIndex >= LIVE_RUN_RATE_OPTIONS.length - 1}
            onClick={() => stepLiveRunRate(1)}
          >
            Faster
          </HudButton>
        </div>
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
          {isJourneyLocked
            ? "The guided walkthrough locks the timing so the teaching beats stay aligned."
            : replayMode
              ? "This sets the speed for the next live journey after you leave replay."
              : liveRunState === "running"
                ? "Changes apply immediately while the traveler is moving."
                : "Set the pace before launch, or tune it while the journey is active."}
        </p>
      </div>

      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div>
            <p className="font-sans font-medium text-[color:var(--hud-muted)]">Value promise</p>
            <p className="font-sans text-[color:var(--hud-fg)]">{selectedScenario.mission.description}</p>
          </div>
          <div>
            <p className="font-sans font-medium text-[color:var(--hud-muted)]">Setting</p>
            <p className="font-sans text-[color:var(--hud-fg)]">{selectedScenario.environment.description}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-fg)]">
            Blind + low-vision support
          </span>
          <span className="rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-fg)]">
            Landmark-guided routing
          </span>
          <span className="rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-fg)]">
            Dynamic hazard rerouting
          </span>
          <span className="rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-fg)]">
            Confidence-first mobility
          </span>
        </div>
      </div>

      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Journey phase
          </p>
          <span className="font-sans text-[11px] text-[color:var(--hud-muted)]">
            {formatControllerStateLabel(live.controllerState)}
          </span>
        </div>
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-fg)]">
          {selectedScenario.journey?.baselineSummary}
        </p>
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
          {selectedScenario.journey?.pathlightSummary}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[color:var(--hud-line)] px-3 py-2">
        <HudButton
          data-tour="scenario-reset-button"
          variant="ghost"
          data-gamepad-focus-id="scenario-reset"
          data-gamepad-group="scenario-actions"
          data-gamepad-label="Reset setup"
          onClick={() => {
            setReplayMode(false);
            setReplayPlaying(false);
            setReplayIndex(0);
            stopLiveRun();
            resetScenario(selectedScenarioId);
          }}
        >
          Reset setup
        </HudButton>
        <HudButton
          data-tour="scenario-debug-button"
          variant="ghost"
          data-gamepad-focus-id="scenario-debug"
          data-gamepad-group="scenario-actions"
          data-gamepad-label={showDebug ? "Disable debug" : "Enable debug"}
          onClick={toggleDebug}
        >
          {showDebug ? "Debug off" : "Debug on"}
        </HudButton>
      </div>
    </TacticalPanel>
  );
}
