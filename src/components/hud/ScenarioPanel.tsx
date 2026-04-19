"use client";

import { CycleControl } from "@/components/hud/CycleControl";
import { formatControllerStateLabel } from "@/components/hud/controllerPresentation";
import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import {
  AIRCRAFT_CARD_OPTIONS,
  CAMERA_MODE_OPTIONS,
} from "@/lib/sim/autonomyCatalog";
import { scenarioPresets } from "@/lib/sim/scenarios";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export function ScenarioPanel() {
  const selectedScenarioId = useUiStore((state) => state.selectedScenarioId);
  const selectedAircraftCardId = useUiStore((state) => state.selectedAircraftCardId);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const showDebug = useUiStore((state) => state.showDebug);
  const liveRunState = useUiStore((state) => state.liveRunState);
  const setScenarioId = useUiStore((state) => state.setScenarioId);
  const setCameraMode = useUiStore((state) => state.setCameraMode);
  const toggleDebug = useUiStore((state) => state.toggleDebug);
  const startLiveRun = useUiStore((state) => state.startLiveRun);
  const pauseLiveRun = useUiStore((state) => state.pauseLiveRun);
  const stopLiveRun = useUiStore((state) => state.stopLiveRun);
  const setReplayMode = useUiStore((state) => state.setReplayMode);
  const setReplayPlaying = useUiStore((state) => state.setReplayPlaying);
  const setReplayIndex = useUiStore((state) => state.setReplayIndex);
  const manualAbort = useUiStore((state) => state.manualAbort);
  const requestManualAbort = useUiStore((state) => state.requestManualAbort);
  const clearManualAbort = useUiStore((state) => state.clearManualAbort);
  const onboardingStatus = useOnboardingStore((state) => state.status);
  const onboardingDismissed = useOnboardingStore((state) => state.isDismissed);
  const guidedRunStage = useOnboardingStore((state) => state.guidedRunStage);
  const setScenarioById = useSimStore((state) => state.setScenarioById);
  const resetScenario = useSimStore((state) => state.resetScenario);
  const live = useSimStore((state) => state.live);
  const replayMode = useUiStore((state) => state.replayMode);

  const selectedScenario =
    scenarioPresets.find((scenario) => scenario.id === selectedScenarioId) ?? scenarioPresets[0];
  const selectedAircraftCard =
    AIRCRAFT_CARD_OPTIONS.find((option) => option.id === selectedAircraftCardId) ??
    AIRCRAFT_CARD_OPTIONS[0];
  const isMissionLocked =
    (onboardingStatus === "guided-run" || onboardingStatus === "replay-debrief") &&
    !onboardingDismissed &&
    guidedRunStage !== null;
  const runStatusLabel = replayMode
    ? "Replay open"
    : liveRunState === "running"
      ? "Running"
      : liveRunState === "paused"
        ? "Paused"
        : "Stopped";
  const runStatusClass = replayMode
    ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
    : liveRunState === "running"
      ? "border-[color:var(--hud-ok)]/45 text-[color:var(--hud-ok)]"
      : liveRunState === "paused"
        ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
        : "border-[color:var(--hud-line)] text-[color:var(--hud-muted)]";
  const runStatusCopy = isMissionLocked
    ? "The guided walkthrough is managing the run right now."
    : replayMode
      ? "Replay is open. Starting a live run will exit replay and launch a fresh pass."
      : liveRunState === "running"
        ? "The live pass is advancing and recording replay samples."
        : liveRunState === "paused"
          ? "Resume to keep this pass going from the current moment."
          : "Start launches a fresh pass from the beginning of the selected preset.";
  const capabilityRows = [
    { label: "Day", supported: selectedScenario.mission.supportsNight || selectedScenario.environment.timeOfDay === "day" },
    { label: "Night", supported: selectedScenario.mission.supportsNight },
    { label: "Land", supported: selectedScenario.mission.supportsWater || selectedScenario.environment.surfaceType === "land" },
    { label: "Water", supported: selectedScenario.mission.supportsWater },
    { label: "EMCON", supported: selectedScenario.mission.supportsEmcon },
  ];
  const selectedScenarioIndex = scenarioPresets.findIndex((scenario) => scenario.id === selectedScenario.id);
  const selectedCameraIndex = CAMERA_MODE_OPTIONS.findIndex((option) => option.id === cameraMode);

  function applyScenarioChange(nextId: string) {
    setScenarioId(nextId);
    setReplayMode(false);
    setReplayPlaying(false);
    setReplayIndex(0);
    clearManualAbort();
    stopLiveRun();
    setScenarioById(nextId);
  }

  function cycleScenario(delta: number) {
    const safeIndex = selectedScenarioIndex === -1 ? 0 : selectedScenarioIndex;
    const nextIndex =
      (safeIndex + delta + scenarioPresets.length) % scenarioPresets.length;
    applyScenarioChange(scenarioPresets[nextIndex]?.id ?? scenarioPresets[0].id);
  }

  function cycleCameraMode(delta: number) {
    const safeIndex = selectedCameraIndex === -1 ? 0 : selectedCameraIndex;
    const nextIndex =
      (safeIndex + delta + CAMERA_MODE_OPTIONS.length) % CAMERA_MODE_OPTIONS.length;
    const nextMode =
      CAMERA_MODE_OPTIONS[nextIndex]?.id ?? CAMERA_MODE_OPTIONS[0].id;
    setCameraMode(nextMode);
  }

  return (
    <TacticalPanel
      data-tour="scenario-panel"
      className="min-h-0 lg:h-full"
      scrollBody
      title="Scenario"
      subtitle={`${selectedScenario.environment.name} · ${selectedScenario.mission.name}`}
    >
      <p className="border-b border-[color:var(--hud-line)] px-3 py-2 font-sans text-xs leading-relaxed text-[color:var(--hud-muted)]">
        {selectedScenario.description}
      </p>

      <div className="px-3 py-2">
        <CycleControl
          label="Preset"
          valueLabel={selectedScenario.name}
          detail={`${selectedScenario.description} Aircraft card · ${selectedAircraftCard.label}`}
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
            Run controls
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
            data-gamepad-label={replayMode ? "Start live run" : liveRunState === "paused" ? "Resume run" : "Start run"}
            data-gamepad-default="true"
            disabled={isMissionLocked || (!replayMode && liveRunState === "running")}
            onClick={() => {
              setReplayMode(false);
              setReplayPlaying(false);
              setReplayIndex(0);
              clearManualAbort();

              if (liveRunState === "paused" && !replayMode) {
                startLiveRun();
                return;
              }

              resetScenario(selectedScenarioId);
              startLiveRun();
            }}
          >
            {replayMode ? "Start live run" : liveRunState === "paused" ? "Resume" : "Start"}
          </HudButton>
          <HudButton
            variant="ghost"
            data-gamepad-focus-id="run-pause"
            data-gamepad-group="scenario-run"
            data-gamepad-label="Pause run"
            disabled={isMissionLocked || replayMode || liveRunState !== "running"}
            onClick={pauseLiveRun}
          >
            Pause
          </HudButton>
          <HudButton
            variant="ghost"
            data-gamepad-focus-id="run-stop"
            data-gamepad-group="scenario-run"
            data-gamepad-label="Stop run"
            disabled={isMissionLocked || replayMode || liveRunState === "stopped"}
            onClick={() => {
              clearManualAbort();
              stopLiveRun();
              resetScenario(selectedScenarioId);
            }}
          >
            Stop
          </HudButton>
        </div>
      </div>

      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div>
            <p className="font-sans font-medium text-[color:var(--hud-muted)]">Mission</p>
            <p className="font-sans text-[color:var(--hud-fg)]">{selectedScenario.mission.description}</p>
          </div>
          <div>
            <p className="font-sans font-medium text-[color:var(--hud-muted)]">Environment</p>
            <p className="font-sans text-[color:var(--hud-fg)]">{selectedScenario.environment.description}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-fg)]">
            {selectedScenario.environment.timeOfDay === "night" ? "Night ops" : "Day ops"}
          </span>
          <span className="rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-fg)]">
            {selectedScenario.environment.surfaceType === "water" ? "Over water" : "Over land"}
          </span>
          <span className="rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-fg)]">
            {selectedScenario.environment.emissionMode === "EMCON" ? "EMCON" : "Normal emissions"}
          </span>
          <span className="rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-fg)]">
            {selectedScenario.sensorPolicy.passiveOnly ? "Passive only" : "Mixed mode"}
          </span>
        </div>
      </div>

      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Challenge matrix
          </p>
          <span className="font-sans text-[11px] text-[color:var(--hud-muted)]">
            {formatControllerStateLabel(live.controllerState)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {capabilityRows.map((item) => (
            <span
              key={item.label}
              className={`rounded-[var(--hud-radius-control)] border px-2 py-1 font-sans text-[10px] font-medium ${
                item.supported
                  ? "border-[color:var(--hud-ok)]/45 text-[color:var(--hud-ok)]"
                  : "border-[color:var(--hud-danger)]/45 text-[color:var(--hud-danger)]"
              }`}
            >
              {item.label}
            </span>
          ))}
        </div>
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
            clearManualAbort();
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
        <HudButton
          variant="danger"
          data-gamepad-focus-id="scenario-breakaway"
          data-gamepad-group="scenario-actions"
          data-gamepad-label={manualAbort ? "Breakaway queued" : "Manual breakaway"}
          disabled={manualAbort || replayMode || liveRunState !== "running" || isMissionLocked}
          onClick={requestManualAbort}
        >
          {manualAbort ? "Breakaway queued" : "Manual breakaway"}
        </HudButton>
      </div>
    </TacticalPanel>
  );
}
