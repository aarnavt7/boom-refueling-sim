"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

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
import { HudIconButton, SegmentedBar, StagePipeline, TacticalPanel } from "@/components/hud/tactical-ui";
import { CONTROLLER_SEQUENCE } from "@/lib/sim/constants";
import { SENSOR_VIEWPORT_MODALITY_OPTIONS, SENSOR_VIEWPORT_SOURCE_OPTIONS } from "@/lib/sim/sensorViewport";
import { useDisplayedReplayBundle } from "@/lib/sim/useDisplayedReplayBundle";
import { registerOnboardingReveal } from "@/lib/onboarding/targeting";
import { useGamepadStore } from "@/lib/store/gamepadStore";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type DockingHudProps = {
  embedded?: boolean;
};

type HudSectionId = "guidance" | "telemetry" | "scenario" | "replay";

type CollapsedPanelState = Record<HudSectionId, boolean>;

const HUD_COLLAPSE_STORAGE_KEY = "pathlight:hud-collapsed:v1";

const DEFAULT_COLLAPSED_PANELS: CollapsedPanelState = {
  guidance: false,
  telemetry: false,
  scenario: false,
  replay: false,
};

function readCollapsedPanels() {
  if (typeof window === "undefined") {
    return DEFAULT_COLLAPSED_PANELS;
  }

  try {
    const raw = window.localStorage.getItem(HUD_COLLAPSE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_COLLAPSED_PANELS;
    }

    const parsed = JSON.parse(raw) as Partial<CollapsedPanelState>;
    return {
      ...DEFAULT_COLLAPSED_PANELS,
      ...Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "boolean")),
    } as CollapsedPanelState;
  } catch {
    return DEFAULT_COLLAPSED_PANELS;
  }
}

function writeCollapsedPanels(state: CollapsedPanelState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(HUD_COLLAPSE_STORAGE_KEY, JSON.stringify(state));
}

function CollapsedHudStrip({
  title,
  subtitle,
  onExpand,
  className,
  headerRight,
  panelDragHandle,
}: {
  title: string;
  subtitle: string;
  onExpand: () => void;
  className: string;
  headerRight?: ReactNode;
  panelDragHandle?: ReactNode;
}) {
  return (
    <section className={`relative overflow-hidden border border-[color:var(--hud-line)] bg-[color:var(--hud-panel)] ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:14px_14px]" />
      <div className="relative flex items-start justify-between gap-3 px-3 pb-2 pt-2.5">
        <div className="min-w-0">
          <p className="font-sans text-[11px] font-medium leading-none tracking-[0.03em] text-[color:var(--hud-muted)]">
            {title}
          </p>
          <p className="mt-1 truncate font-sans text-[13px] font-medium leading-tight tracking-tight text-[color:var(--hud-fg)]">
            {subtitle}
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
          {panelDragHandle ? <div className="shrink-0">{panelDragHandle}</div> : null}
          <HudIconButton aria-label={`Expand ${title} panel`} title={`Expand ${title}`} onClick={onExpand}>
            +
          </HudIconButton>
        </div>
      </div>
    </section>
  );
}

export function DockingHud({ embedded = false }: DockingHudProps) {
  const displayedBundle = useDisplayedReplayBundle();
  const displayed = displayedBundle.primary;
  const comparisonState = displayedBundle.comparison;
  const persistMessage = useSimStore((state) => state.persistMessage);
  const liveRunState = useUiStore((state) => state.liveRunState);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayDataSource = useUiStore((state) => state.replayDataSource);
  const evaluationView = useUiStore((state) => state.evaluationView);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const sensorViewportSource = useUiStore((state) => state.sensorViewportSource);
  const sensorViewportModality = useUiStore((state) => state.sensorViewportModality);
  const setSensorViewportSource = useUiStore((state) => state.setSensorViewportSource);
  const setSensorViewportModality = useUiStore((state) => state.setSensorViewportModality);
  const gamepadConnected = useGamepadStore((state) => state.connected);
  const gamepadDeviceType = useGamepadStore((state) => state.deviceType);
  const autonomyEvaluation = useSimStore((state) => state.autonomyEvaluation);
  const activeReplayLength =
    replayDataSource === "autonomy" && autonomyEvaluation
      ? Math.max(
          autonomyEvaluation.baselineReplaySamples.length,
          autonomyEvaluation.uploadedReplaySamples.length,
        )
      : replaySamples.length;
  const [collapsedPanels, setCollapsedPanels] = useState<CollapsedPanelState>(DEFAULT_COLLAPSED_PANELS);
  const [collapsedPanelsReady, setCollapsedPanelsReady] = useState(false);

  useEffect(() => {
    setCollapsedPanels(readCollapsedPanels());
    setCollapsedPanelsReady(true);
  }, []);

  useEffect(() => {
    if (!collapsedPanelsReady) {
      return;
    }
    writeCollapsedPanels(collapsedPanels);
  }, [collapsedPanels, collapsedPanelsReady]);

  const headerClass = guidanceHeaderStatusClass(displayed.controllerState);
  const headerLabel = guidanceHeaderStatusLabel(displayed.controllerState);
  const shellStatusLabel = replayMode
    ? "Replay"
    : liveRunState === "running"
      ? "Live"
      : liveRunState === "paused"
        ? "Paused"
        : "Ready";
  const shellStatusClass = replayMode
    ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
    : liveRunState === "running"
      ? "border-[color:var(--hud-ok)]/50 text-[color:var(--hud-ok)]"
      : liveRunState === "paused"
        ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
        : "border-[color:var(--hud-line)] text-[color:var(--hud-muted)]";

  const sourceIndex = SENSOR_VIEWPORT_SOURCE_OPTIONS.findIndex((option) => option.id === sensorViewportSource);
  const modalityIndex = SENSOR_VIEWPORT_MODALITY_OPTIONS.findIndex((option) => option.id === sensorViewportModality);

  function toggleCollapsedPanel(panelId: HudSectionId) {
    setCollapsedPanels((current) => ({ ...current, [panelId]: !current[panelId] }));
  }

  useEffect(() => {
    const revealPanel = (panelId: HudSectionId) => {
      setCollapsedPanels((current) =>
        current[panelId]
          ? {
              ...current,
              [panelId]: false,
            }
          : current,
      );
    };

    const unregisterCallbacks = [
      registerOnboardingReveal('[data-tour="guidance-panel"]', () => revealPanel("guidance")),
      registerOnboardingReveal('[data-tour="sensor-feed"]', () => revealPanel("guidance")),
      registerOnboardingReveal('[data-tour="controller-pipeline"]', () => revealPanel("guidance")),
      registerOnboardingReveal('[data-tour="telemetry-panel"]', () => revealPanel("telemetry")),
      registerOnboardingReveal('[data-tour="scenario-panel"]', () => revealPanel("scenario")),
      registerOnboardingReveal('[data-tour="run-controls"]', () => revealPanel("scenario")),
      registerOnboardingReveal('[data-tour="replay-panel"]', () => revealPanel("replay")),
      registerOnboardingReveal('[data-tour="replay-slider"]', () => revealPanel("replay")),
      registerOnboardingReveal('[data-tour="save-run-button"]', () => revealPanel("replay")),
    ];

    return () => unregisterCallbacks.forEach((unregister) => unregister());
  }, []);

  function createCollapseAction(panelId: HudSectionId, title: string) {
    return (
      <HudIconButton aria-label={`Collapse ${title} panel`} title={`Collapse ${title}`} onClick={() => toggleCollapsedPanel(panelId)}>
        -
      </HudIconButton>
    );
  }

  function cycleViewportSource(delta: number) {
    const safeIndex = sourceIndex === -1 ? 0 : sourceIndex;
    const nextIndex = (safeIndex + delta + SENSOR_VIEWPORT_SOURCE_OPTIONS.length) % SENSOR_VIEWPORT_SOURCE_OPTIONS.length;
    setSensorViewportSource(SENSOR_VIEWPORT_SOURCE_OPTIONS[nextIndex]?.id ?? SENSOR_VIEWPORT_SOURCE_OPTIONS[0].id);
  }

  function cycleViewportModality(delta: number) {
    const safeIndex = modalityIndex === -1 ? 0 : modalityIndex;
    const nextIndex = (safeIndex + delta + SENSOR_VIEWPORT_MODALITY_OPTIONS.length) % SENSOR_VIEWPORT_MODALITY_OPTIONS.length;
    setSensorViewportModality(SENSOR_VIEWPORT_MODALITY_OPTIONS[nextIndex]?.id ?? SENSOR_VIEWPORT_MODALITY_OPTIONS[0].id);
  }

  function renderGuidancePanel(
    className: string,
    panelDragHandle?: ReactNode,
    headerActions?: ReactNode,
    options?: { bodyClassName?: string; scrollBody?: boolean },
  ) {
    return (
      <TacticalPanel
        data-tour="guidance-panel"
        className={className}
        bodyClassName={options?.bodyClassName ?? ""}
        scrollBody={options?.scrollBody ?? true}
        title="Trip Guidance"
        subtitle={`${formatControllerStateLabel(displayed.controllerState)} · confidence-first mobility`}
        headerActions={headerActions}
        panelDragHandle={panelDragHandle}
        headerRight={
          <span className={`font-sans text-[11px] font-medium tracking-[0.02em] tabular-nums ${headerClass}`}>
            {headerLabel}
          </span>
        }
      >
        <div className="px-3 py-2 font-sans text-[12px] leading-relaxed text-[color:var(--hud-muted)]">
          Destination{" "}
          <span className="tabular-nums text-[color:var(--hud-fg)]">
            {displayed.journey?.guidancePrompt.title ?? "Queued"}
          </span>
          <span className="mx-2 text-[color:var(--hud-line)]">|</span>
          Confidence{" "}
          <span className="tabular-nums text-[color:var(--hud-fg)]">
            {(displayed.metrics.confidence * 100).toFixed(0)}%
          </span>
        </div>

        <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
          <p className="font-sans text-[11px] text-[color:var(--hud-muted)]">
            Assistive output preview
          </p>
          <p className="mt-1 font-sans text-[11px] text-[color:var(--hud-fg)]">
            {displayed.journey?.guidancePrompt.primary ?? "Launch a journey to preview the next cue."}
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <CycleControl
              label="Output focus"
              valueLabel={SENSOR_VIEWPORT_SOURCE_OPTIONS.find((option) => option.id === sensorViewportSource)?.label ?? SENSOR_VIEWPORT_SOURCE_OPTIONS[0].label}
              detail={SENSOR_VIEWPORT_SOURCE_OPTIONS.find((option) => option.id === sensorViewportSource)?.detail ?? SENSOR_VIEWPORT_SOURCE_OPTIONS[0].detail}
              onPrevious={() => cycleViewportSource(-1)}
              onNext={() => cycleViewportSource(1)}
              previousLabel="Previous output focus"
              nextLabel="Next output focus"
              gamepadBaseId="sensor-source"
              gamepadGroup="guidance-sensor"
            />
            <CycleControl
              label="Preview mode"
              valueLabel={SENSOR_VIEWPORT_MODALITY_OPTIONS.find((option) => option.id === sensorViewportModality)?.label ?? SENSOR_VIEWPORT_MODALITY_OPTIONS[0].label}
              detail={SENSOR_VIEWPORT_MODALITY_OPTIONS.find((option) => option.id === sensorViewportModality)?.detail ?? SENSOR_VIEWPORT_MODALITY_OPTIONS[0].detail}
              onPrevious={() => cycleViewportModality(-1)}
              onNext={() => cycleViewportModality(1)}
              previousLabel="Previous preview mode"
              nextLabel="Next preview mode"
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
            <p className="font-sans text-[11px] text-[color:var(--hud-muted)]">Next movement</p>
            <span
              className={`rounded-full border px-2 py-0.5 font-sans text-[10px] font-medium ${
                (displayed.metrics.routeClarity ?? 1) < 0.58
                  ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
                  : "border-[color:var(--hud-ok)]/45 text-[color:var(--hud-ok)]"
              }`}
            >
              {(displayed.metrics.routeClarity ?? 1) < 0.58 ? "Watch closely" : "Clear"}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-sans text-[11px]">
            <div>
              <p className="text-[color:var(--hud-muted)]">Clock hint</p>
              <p className="text-[color:var(--hud-fg)]">{displayed.journey?.guidancePrompt.clockHint ?? "Pending"}</p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Distance cue</p>
              <p className="text-[color:var(--hud-fg)]">{displayed.journey?.guidancePrompt.distanceLabel ?? "Pending"}</p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Landmark</p>
              <p className="text-[color:var(--hud-fg)]">{displayed.journey?.guidancePrompt.landmark ?? "Pending landmark cue"}</p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Compare view</p>
              <p className="text-[color:var(--hud-fg)]">
                {replayDataSource === "autonomy"
                  ? evaluationView === "overlay"
                    ? "Overlay"
                    : evaluationView === "uploaded"
                      ? "Pathlight"
                      : "Baseline"
                  : "Session"}
              </p>
            </div>
          </div>
          {comparisonState ? (
            <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
              Compare delta · route drift improves by{" "}
              {Math.max(0, comparisonState.metrics.positionError - displayed.metrics.positionError).toFixed(2)} m in the current view.
            </p>
          ) : null}
        </div>

        <SegmentedBar value={displayed.metrics.confidence} />

        <div data-tour="controller-pipeline" className="border-t border-[color:var(--hud-line)] px-3 py-2">
          <p className="mb-2 font-sans text-[11px] text-[color:var(--hud-muted)]">Journey phases (left → right)</p>
          <StagePipeline sequence={CONTROLLER_SEQUENCE} active={displayed.controllerState} />
        </div>

        {persistMessage ? (
          <p className="border-t border-[color:var(--hud-line)] px-3 py-2 font-sans text-[11px] text-[color:var(--hud-accent-fg)]">
            {persistMessage}
          </p>
        ) : null}
      </TacticalPanel>
    );
  }

  function renderGuidanceTelemetryGroup({ panelDragHandle }: { panelDragHandle?: ReactNode }) {
    return (
      <>
        {collapsedPanels.guidance ? (
          <CollapsedHudStrip
            title="Trip Guidance"
            subtitle={`${formatControllerStateLabel(displayed.controllerState)} · confidence-first mobility`}
            className="rounded-t-[var(--hud-radius-panel)] rounded-b-none border-b-0"
            headerRight={
              <span className={`font-sans text-[11px] font-medium tracking-[0.02em] tabular-nums ${headerClass}`}>
                {headerLabel}
              </span>
            }
            panelDragHandle={panelDragHandle}
            onExpand={() => toggleCollapsedPanel("guidance")}
          />
        ) : (
          renderGuidancePanel("shrink-0 rounded-b-none border-b-0", panelDragHandle, createCollapseAction("guidance", "Trip Guidance"), {
            bodyClassName: "flex-none",
            scrollBody: false,
          })
        )}

        {collapsedPanels.telemetry ? (
          <CollapsedHudStrip
            title="Access Metrics"
            subtitle="Clarity, hazards, corrections"
            className="rounded-b-[var(--hud-radius-panel)] rounded-t-none"
            headerRight={
              <span className="font-sans text-[11px] tabular-nums text-[color:var(--hud-muted)]">
                T+{displayed.simTime.toFixed(1)}s
              </span>
            }
            onExpand={() => toggleCollapsedPanel("telemetry")}
          />
        ) : (
          <MetricsPanel
            state={displayed}
            className="shrink-0 rounded-t-none"
            bodyClassName="flex-none"
            headerActions={createCollapseAction("telemetry", "Access Metrics")}
            scrollBody={false}
          />
        )}
      </>
    );
  }

  function renderScenarioReplayGroup({ panelDragHandle }: { panelDragHandle?: ReactNode }) {
    return (
      <>
        {collapsedPanels.scenario ? (
          <CollapsedHudStrip
            title="Journey Setup"
            subtitle="Preset, profile, camera"
            className="rounded-t-[var(--hud-radius-panel)] rounded-b-none border-b-0"
            panelDragHandle={panelDragHandle}
            onExpand={() => toggleCollapsedPanel("scenario")}
          />
        ) : (
          <ScenarioPanel
            className="shrink-0 rounded-b-none border-b-0"
            bodyClassName="flex-none"
            headerActions={createCollapseAction("scenario", "Journey Setup")}
            panelDragHandle={panelDragHandle}
            scrollBody={false}
          />
        )}

        {collapsedPanels.replay ? (
          <CollapsedHudStrip
            title="Replay"
            subtitle="Before / after debrief"
            className="rounded-b-[var(--hud-radius-panel)] rounded-t-none"
            headerRight={
              <span className="font-sans text-[11px] tabular-nums text-[color:var(--hud-muted)]">
                {activeReplayLength} samples
              </span>
            }
            onExpand={() => toggleCollapsedPanel("replay")}
          />
        ) : (
          <ReplayPanel
            className="shrink-0 rounded-t-none"
            bodyClassName="flex-none"
            headerActions={createCollapseAction("replay", "Replay")}
            scrollBody={false}
          />
        )}
      </>
    );
  }

  const guidanceTelemetryCollapsed = collapsedPanels.guidance && collapsedPanels.telemetry;
  const guidanceTelemetryPartiallyCollapsed = collapsedPanels.guidance !== collapsedPanels.telemetry;
  const scenarioReplayCollapsed = collapsedPanels.scenario && collapsedPanels.replay;
  const scenarioReplayPartiallyCollapsed = collapsedPanels.scenario !== collapsedPanels.replay;
  const guidanceTelemetryPanelClassName = guidanceTelemetryCollapsed
    ? "w-[21rem]"
    : guidanceTelemetryPartiallyCollapsed
      ? "h-[min(24rem,calc(100vh-8rem))] w-[21rem]"
      : "h-[min(36rem,calc(100vh-8rem))] w-[21rem]";
  const scenarioReplayPanelClassName = scenarioReplayCollapsed
    ? "w-[20rem]"
    : scenarioReplayPartiallyCollapsed
      ? "h-[min(20rem,calc(100vh-8rem))] w-[20rem]"
      : "h-[min(31rem,calc(100vh-8rem))] w-[20rem]";

  const rootLayout = embedded
    ? "pointer-events-none absolute inset-0 z-10 flex flex-col text-[color:var(--hud-fg)]"
    : "pointer-events-none fixed inset-0 z-10 flex flex-col text-[color:var(--hud-fg)]";

  return (
    <div className={rootLayout}>
      <header data-tour="sim-header" className="pointer-events-none shrink-0 px-2 pt-2 sm:px-3 sm:pt-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="pointer-events-auto inline-flex min-w-0 max-w-full items-center gap-2.5 rounded-full border border-[color:var(--hud-line)] bg-[color:var(--hud-panel)] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Image src="/boom-logo.svg" alt="" width={28} height={28} className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-sans text-[13px] font-semibold leading-tight tracking-tight text-[color:var(--hud-fg)]">
                Pathlight
              </p>
              <p className="truncate font-sans text-[11px] font-normal leading-snug text-[color:var(--hud-muted)]">
                Accessibility navigation digital twin
              </p>
            </div>
          </div>
          <div className="pointer-events-auto ml-auto inline-flex max-w-full items-center justify-end gap-2 rounded-full border border-[color:var(--hud-line)] bg-[color:var(--hud-panel)] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:gap-3">
            <span className={`rounded-full border px-2 py-0.5 font-sans text-[11px] font-medium tracking-[0.02em] ${shellStatusClass}`}>
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
          data-onboarding-scroll-container="true"
          data-gamepad-scroll-container="true"
          className="pointer-events-auto flex min-h-0 min-w-0 basis-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain touch-pan-y pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]"
        >
          {renderGuidanceTelemetryGroup({})}
        </aside>

        <aside
          data-onboarding-scroll-container="true"
          data-gamepad-scroll-container="true"
          className="pointer-events-auto flex min-h-0 min-w-0 basis-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain touch-pan-y pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]"
        >
          {renderScenarioReplayGroup({})}
        </aside>
      </div>

      <div className="pointer-events-none relative hidden min-h-0 flex-1 lg:block">
        <FloatingHudPanel panelId="guidance-telemetry" embedded={embedded} defaultPosition={{ top: 88, left: 12 }} className={guidanceTelemetryPanelClassName}>
          {(dragHandle) => (
            <div data-onboarding-scroll-container="true" data-gamepad-scroll-container="true" className={`overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] ${guidanceTelemetryCollapsed ? "" : "h-full pr-1"}`}>
              {renderGuidanceTelemetryGroup({ panelDragHandle: dragHandle })}
            </div>
          )}
        </FloatingHudPanel>

        <FloatingHudPanel panelId="scenario-replay" embedded={embedded} defaultPosition={{ top: 88, right: 12 }} className={scenarioReplayPanelClassName}>
          {(dragHandle) => (
            <div data-onboarding-scroll-container="true" data-gamepad-scroll-container="true" className={`overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] ${scenarioReplayCollapsed ? "" : "h-full pr-1"}`}>
              {renderScenarioReplayGroup({ panelDragHandle: dragHandle })}
            </div>
          )}
        </FloatingHudPanel>
      </div>
    </div>
  );
}
