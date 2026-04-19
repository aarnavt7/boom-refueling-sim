"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";

import { CycleControl } from "@/components/hud/CycleControl";
import { FloatingHudPanel } from "@/components/hud/FloatingHudPanel";
import {
  formatControllerStateLabel,
  guidanceHeaderStatusClass,
  guidanceHeaderStatusLabel,
} from "@/components/hud/controllerPresentation";
import { MetricsPanel } from "@/components/hud/MetricsPanel";
import { ReplayPanel } from "@/components/hud/ReplayPanel";
import { ScenarioPanel } from "@/components/hud/ScenarioPanel";
import { SensorFeedViewport } from "@/components/hud/SensorFeedViewport";
import { SegmentedBar, StagePipeline, TacticalPanel } from "@/components/hud/tactical-ui";
import { CONTROLLER_SEQUENCE } from "@/lib/sim/constants";
import { getDisplayedReplayBundle } from "@/lib/sim/replay";
import {
  resolveSensorViewportFeed,
  SENSOR_VIEWPORT_MODALITY_OPTIONS,
  SENSOR_VIEWPORT_SOURCE_OPTIONS,
} from "@/lib/sim/sensorViewport";
import { useGamepadStore } from "@/lib/store/gamepadStore";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type DockingHudProps = {
  /** Use inside a `relative` container (e.g. `/imgs` capture) instead of full-viewport fixed. */
  embedded?: boolean;
};

export function DockingHud({ embedded = false }: DockingHudProps) {
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const autonomyEvaluation = useSimStore((state) => state.autonomyEvaluation);
  const persistMessage = useSimStore((state) => state.persistMessage);
  const liveRunState = useUiStore((state) => state.liveRunState);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayDataSource = useUiStore((state) => state.replayDataSource);
  const evaluationView = useUiStore((state) => state.evaluationView);
  const replayIndex = useUiStore((state) => state.replayIndex);
  const sensorViewportSource = useUiStore((state) => state.sensorViewportSource);
  const sensorViewportModality = useUiStore((state) => state.sensorViewportModality);
  const setSensorViewportSource = useUiStore((state) => state.setSensorViewportSource);
  const setSensorViewportModality = useUiStore((state) => state.setSensorViewportModality);
  const gamepadConnected = useGamepadStore((state) => state.connected);
  const gamepadDeviceType = useGamepadStore((state) => state.deviceType);

  const displayedBundle = useMemo(
    () =>
      getDisplayedReplayBundle({
        live,
        sessionReplaySamples: replaySamples,
        autonomyBaselineReplaySamples: autonomyEvaluation?.baselineReplaySamples ?? [],
        autonomyUploadedReplaySamples: autonomyEvaluation?.uploadedReplaySamples ?? [],
        replayMode,
        replayIndex,
        replayDataSource,
        evaluationView,
      }),
    [
      autonomyEvaluation?.baselineReplaySamples,
      autonomyEvaluation?.uploadedReplaySamples,
      evaluationView,
      live,
      replayDataSource,
      replayIndex,
      replayMode,
      replaySamples,
    ],
  );
  const displayed = displayedBundle.primary;
  const comparisonState = displayedBundle.comparison;
  const viewportFeed = useMemo(
    () =>
      resolveSensorViewportFeed({
        state: displayed,
        source: sensorViewportSource,
        modality: sensorViewportModality,
      }),
    [displayed, sensorViewportModality, sensorViewportSource],
  );
  const viewportSourceDetail =
    SENSOR_VIEWPORT_SOURCE_OPTIONS.find((option) => option.id === sensorViewportSource)?.detail ??
    SENSOR_VIEWPORT_SOURCE_OPTIONS[0].detail;
  const viewportModalityDetail =
    SENSOR_VIEWPORT_MODALITY_OPTIONS.find((option) => option.id === sensorViewportModality)?.detail ??
    SENSOR_VIEWPORT_MODALITY_OPTIONS[0].detail;
  const sensorViewportSourceIndex = SENSOR_VIEWPORT_SOURCE_OPTIONS.findIndex(
    (option) => option.id === sensorViewportSource,
  );
  const sensorViewportModalityIndex = SENSOR_VIEWPORT_MODALITY_OPTIONS.findIndex(
    (option) => option.id === sensorViewportModality,
  );

  const headerClass = guidanceHeaderStatusClass(displayed.controllerState);
  const headerLabel = guidanceHeaderStatusLabel(displayed.controllerState);
  const shellStatusLabel = replayMode
    ? "Replay"
    : liveRunState === "running"
      ? "Live"
      : liveRunState === "paused"
        ? "Paused"
        : "Stopped";
  const shellStatusClass = replayMode
    ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
    : liveRunState === "running"
      ? "border-[color:var(--hud-ok)]/50 text-[color:var(--hud-ok)]"
      : liveRunState === "paused"
        ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
        : "border-[color:var(--hud-line)] text-[color:var(--hud-muted)]";

  function renderGuidancePanel(className: string, panelDragHandle?: ReactNode) {
    return (
      <TacticalPanel
        data-tour="guidance-panel"
        className={className}
        scrollBody
        title="Guidance"
        subtitle={`${formatControllerStateLabel(displayed.controllerState)} · passive multispectral track`}
        panelDragHandle={panelDragHandle}
        headerRight={
          <span className={`font-sans text-[11px] font-medium tracking-[0.02em] tabular-nums ${headerClass}`}>
            {headerLabel}
          </span>
        }
      >
        <div className="px-3 py-2 font-sans text-[12px] leading-relaxed text-[color:var(--hud-muted)]">
          Err{" "}
          <span className="tabular-nums text-[color:var(--hud-fg)]">
            {displayed.metrics.positionError.toFixed(2)} m
          </span>
          <span className="mx-2 text-[color:var(--hud-line)]">|</span>
          Conf{" "}
          <span className="tabular-nums text-[color:var(--hud-fg)]">
            {(displayed.tracker.confidence * 100).toFixed(0)}%
          </span>
        </div>

        <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
          <p className="font-sans text-[11px] text-[color:var(--hud-muted)]">
            Passive sensor viewport · {viewportFeed.hasManualSourceOverride ? "manual override" : "auto handoff"}
          </p>
          <p className="mt-1 font-sans text-[11px] text-[color:var(--hud-fg)]">
            {viewportFeed.observation.sensorName} · {viewportFeed.effectiveModality}
            {viewportFeed.hasManualModalityOverride ? " viewport override" : ""} · controller {displayed.estimate.sensorName}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <CycleControl
              label="Source"
              valueLabel={
                SENSOR_VIEWPORT_SOURCE_OPTIONS.find((option) => option.id === sensorViewportSource)?.label ??
                SENSOR_VIEWPORT_SOURCE_OPTIONS[0].label
              }
              detail={viewportSourceDetail}
              onPrevious={() => cycleViewportSource(-1)}
              onNext={() => cycleViewportSource(1)}
              previousLabel="Previous sensor source"
              nextLabel="Next sensor source"
              gamepadBaseId="sensor-source"
              gamepadGroup="guidance-sensor"
            />
            <CycleControl
              label="Modality"
              valueLabel={
                SENSOR_VIEWPORT_MODALITY_OPTIONS.find((option) => option.id === sensorViewportModality)?.label ??
                SENSOR_VIEWPORT_MODALITY_OPTIONS[0].label
              }
              detail={`${viewportModalityDetail} The autonomy stack stays on scenario-driven sensing.`}
              onPrevious={() => cycleViewportModality(-1)}
              onNext={() => cycleViewportModality(1)}
              previousLabel="Previous sensor modality"
              nextLabel="Next sensor modality"
              gamepadBaseId="sensor-modality"
              gamepadGroup="guidance-sensor"
            />
          </div>
          <div data-tour="sensor-feed">
            <SensorFeedViewport viewportFrameClassName="mt-2 overflow-hidden" />
          </div>
        </div>

        <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="font-sans text-[11px] text-[color:var(--hud-muted)]">Track entity</p>
            <span
              className={`rounded-full border px-2 py-0.5 font-sans text-[10px] font-medium ${
                displayed.tracker.lost
                  ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
                  : "border-[color:var(--hud-ok)]/45 text-[color:var(--hud-ok)]"
              }`}
            >
              {displayed.tracker.lost ? "Recovering" : "Tracked"}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-sans text-[11px]">
            <div>
              <p className="text-[color:var(--hud-muted)]">Entity ID</p>
              <p className="text-[color:var(--hud-fg)]">aar.receiver.track-01</p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Active sensors</p>
              <p className="text-[color:var(--hud-fg)]">
                {displayed.tracker.activeSensorIds.length} · {displayed.estimate.sensorName}
              </p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Predicted intercept</p>
              <p className="text-[color:var(--hud-fg)]">
                {displayed.metrics.closureRate > 0.001
                  ? `${(displayed.metrics.positionError / Math.max(displayed.metrics.closureRate, 1e-3)).toFixed(1)} s`
                  : "Holding"}
              </p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Replay view</p>
              <p className="text-[color:var(--hud-fg)]">
                {replayDataSource === "autonomy"
                  ? evaluationView === "overlay"
                    ? "Overlay"
                    : evaluationView === "uploaded"
                      ? "Uploaded"
                      : "Baseline"
                  : "Session"}
              </p>
            </div>
          </div>
          {comparisonState ? (
            <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
              Comparison delta · receiver offset{" "}
              {Math.hypot(
                comparisonState.receiverPose.position.x - displayed.receiverPose.position.x,
                comparisonState.receiverPose.position.y - displayed.receiverPose.position.y,
                comparisonState.receiverPose.position.z - displayed.receiverPose.position.z,
              ).toFixed(3)}{" "}
              m
            </p>
          ) : null}
        </div>

        <SegmentedBar value={displayed.tracker.confidence} />

        <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
          <p className="font-sans text-[11px] text-[color:var(--hud-muted)]">Autopilot output</p>
          <p className="mt-1 font-sans text-[11px] leading-relaxed text-[color:var(--hud-fg)]">
            moveECEF({(displayed.autopilotCommand.dx * 100).toFixed(1)}, {(displayed.autopilotCommand.dy * 100).toFixed(1)}, {(displayed.autopilotCommand.dz * 100).toFixed(1)}) cm
          </p>
        </div>

        <div data-tour="controller-pipeline" className="border-t border-[color:var(--hud-line)] px-3 py-2">
          <p className="mb-2 font-sans text-[11px] text-[color:var(--hud-muted)]">Controller states (left → right)</p>
          <StagePipeline sequence={CONTROLLER_SEQUENCE} active={displayed.controllerState} />
        </div>

        {displayed.abortReason ? (
          <p className="border-t border-[color:var(--hud-line)] px-3 py-2 font-sans text-[11px] text-[color:var(--hud-danger)]">
            Abort: {displayed.abortReason}
          </p>
        ) : null}
        {persistMessage ? (
          <p className="border-t border-[color:var(--hud-line)] px-3 py-2 font-sans text-[11px] text-[color:var(--hud-accent-fg)]">
            {persistMessage}
          </p>
        ) : null}
      </TacticalPanel>
    );
  }

  function cycleViewportSource(delta: number) {
    const safeIndex = sensorViewportSourceIndex === -1 ? 0 : sensorViewportSourceIndex;
    const nextIndex =
      (safeIndex + delta + SENSOR_VIEWPORT_SOURCE_OPTIONS.length) %
      SENSOR_VIEWPORT_SOURCE_OPTIONS.length;
    setSensorViewportSource(
      SENSOR_VIEWPORT_SOURCE_OPTIONS[nextIndex]?.id ??
        SENSOR_VIEWPORT_SOURCE_OPTIONS[0].id,
    );
  }

  function cycleViewportModality(delta: number) {
    const safeIndex =
      sensorViewportModalityIndex === -1 ? 0 : sensorViewportModalityIndex;
    const nextIndex =
      (safeIndex + delta + SENSOR_VIEWPORT_MODALITY_OPTIONS.length) %
      SENSOR_VIEWPORT_MODALITY_OPTIONS.length;
    setSensorViewportModality(
      SENSOR_VIEWPORT_MODALITY_OPTIONS[nextIndex]?.id ??
        SENSOR_VIEWPORT_MODALITY_OPTIONS[0].id,
    );
  }

  const rootLayout = embedded
    ? "pointer-events-none absolute inset-0 z-10 flex flex-col text-[color:var(--hud-fg)]"
    : "pointer-events-none fixed inset-0 z-10 flex flex-col text-[color:var(--hud-fg)]";
  return (
    <div className={rootLayout}>
      <header
        data-tour="sim-header"
        className="pointer-events-none shrink-0 px-2 pt-2 sm:px-3 sm:pt-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="pointer-events-auto inline-flex min-w-0 max-w-full items-center gap-2.5 rounded-full border border-[color:var(--hud-line)] bg-[color:var(--hud-panel)] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Image src="/boom-logo.svg" alt="" width={28} height={28} className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-sans text-[13px] font-semibold leading-tight tracking-tight text-[color:var(--hud-fg)]">
                Boom
              </p>
              <p className="truncate font-sans text-[11px] font-normal leading-snug text-[color:var(--hud-muted)]">
                Refueling dock sim
              </p>
            </div>
          </div>
          <div className="pointer-events-auto ml-auto inline-flex max-w-full items-center justify-end gap-2 rounded-full border border-[color:var(--hud-line)] bg-[color:var(--hud-panel)] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:gap-3">
            <span
              className={`rounded-full border px-2 py-0.5 font-sans text-[11px] font-medium tracking-[0.02em] ${shellStatusClass}`}
            >
              {shellStatusLabel}
            </span>
            <span className="hidden font-sans text-[11px] tabular-nums text-[color:var(--hud-muted)] sm:inline">
              T+{displayed.simTime.toFixed(1)}s
            </span>
            <span className="hidden font-sans text-[11px] tabular-nums text-[color:var(--hud-muted)] md:inline">
              Frame {displayed.frame}
            </span>
            {gamepadConnected ? (
              <span className="rounded-full border border-[color:var(--hud-accent)]/45 px-2 py-0.5 font-sans text-[11px] font-medium text-[color:var(--hud-accent-fg)]">
                {gamepadDeviceType === "xbox" ? "Xbox connected" : "Controller connected"}
              </span>
            ) : null}
            <Link
              href="/"
              data-gamepad-focus-id="sim-home"
              data-gamepad-group="sim-header"
              data-gamepad-label="Return home"
              className="rounded-full border border-[color:var(--hud-line)] px-2 py-0.5 font-sans text-[11px] font-medium text-[color:var(--hud-muted)] transition hover:border-[color:var(--hud-accent)]/50 hover:text-[color:var(--hud-accent-fg)]"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-2 pb-3 pt-2 sm:gap-3 sm:px-3 sm:pb-4 sm:pt-3 lg:hidden">
        <aside
          className="pointer-events-auto flex min-h-0 min-w-0 basis-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain touch-pan-y pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] lg:grid lg:w-[min(22rem,40vw)] lg:flex-none lg:overflow-hidden lg:grid-rows-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
        >
          {renderGuidancePanel("min-h-0")}

          <MetricsPanel state={displayed} className="min-h-0" />
        </aside>

        <aside
          className="pointer-events-auto flex min-h-0 min-w-0 basis-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain touch-pan-y pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] lg:grid lg:w-[min(22rem,40vw)] lg:flex-none lg:overflow-hidden lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <ScenarioPanel className="min-h-0" />
          <ReplayPanel className="min-h-0" />
        </aside>
      </div>

      <div className="pointer-events-none relative hidden min-h-0 flex-1 lg:block">
        <FloatingHudPanel
          panelId="guidance"
          embedded={embedded}
          defaultPosition={{ top: 88, left: 12 }}
          className="h-[min(40rem,calc(100vh-7.5rem))] w-[22rem]"
        >
          {(dragHandle) => renderGuidancePanel("h-full", dragHandle)}
        </FloatingHudPanel>

        <FloatingHudPanel
          panelId="telemetry"
          embedded={embedded}
          defaultPosition={{ top: 520, left: 12 }}
          className="h-[min(23rem,calc(100vh-9rem))] w-[22rem]"
        >
          {(dragHandle) => (
            <MetricsPanel state={displayed} className="h-full" panelDragHandle={dragHandle} />
          )}
        </FloatingHudPanel>

        <FloatingHudPanel
          panelId="scenario"
          embedded={embedded}
          defaultPosition={{ top: 88, right: 12 }}
          className="h-[min(27rem,calc(100vh-7.5rem))] w-[22rem]"
        >
          {(dragHandle) => (
            <ScenarioPanel className="h-full" panelDragHandle={dragHandle} />
          )}
        </FloatingHudPanel>

        <FloatingHudPanel
          panelId="replay"
          embedded={embedded}
          defaultPosition={{ top: 392, right: 12 }}
          className="h-[min(27rem,calc(100vh-9rem))] w-[22rem]"
        >
          {(dragHandle) => (
            <ReplayPanel className="h-full" panelDragHandle={dragHandle} />
          )}
        </FloatingHudPanel>
      </div>
    </div>
  );
}
