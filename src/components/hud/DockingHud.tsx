"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

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
import { getDisplayedState } from "@/lib/sim/replay";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type DockingHudProps = {
  /** Use inside a `relative` container (e.g. `/imgs` capture) instead of full-viewport fixed. */
  embedded?: boolean;
};

export function DockingHud({ embedded = false }: DockingHudProps) {
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const persistMessage = useSimStore((state) => state.persistMessage);
  const liveRunState = useUiStore((state) => state.liveRunState);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);

  const displayed = useMemo(
    () => getDisplayedState(live, replaySamples, replayMode, replayIndex),
    [live, replaySamples, replayMode, replayIndex],
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
            <Link
              href="/"
              className="rounded-full border border-[color:var(--hud-line)] px-2 py-0.5 font-sans text-[11px] font-medium text-[color:var(--hud-muted)] transition hover:border-[color:var(--hud-accent)]/50 hover:text-[color:var(--hud-accent-fg)]"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-2 pb-3 pt-2 sm:gap-3 sm:px-3 sm:pb-4 sm:pt-3 lg:flex-row lg:justify-between">
        <aside
          className="pointer-events-auto flex min-h-0 min-w-0 basis-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain touch-pan-y pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] lg:grid lg:w-[min(22rem,40vw)] lg:flex-none lg:overflow-hidden lg:grid-rows-[minmax(0,1.2fr)_minmax(0,0.8fr)]"
        >
          <TacticalPanel
            data-tour="guidance-panel"
            className="min-h-0 lg:h-full"
            scrollBody
            title="Guidance"
            subtitle={`${formatControllerStateLabel(displayed.controllerState)} · passive multispectral track`}
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
                Passive visible / thermal handoff · {displayed.estimate.sensorName}
              </p>
              <p className="mt-1 font-sans text-[11px] text-[color:var(--hud-fg)]">
                {displayed.estimate.modality} · {displayed.tracker.preferredRole} track · {displayed.estimate.notes.join(" · ")}
              </p>
              <div data-tour="sensor-feed">
                <SensorFeedViewport viewportFrameClassName="mt-2 overflow-hidden" />
              </div>
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

          <MetricsPanel state={displayed} />
        </aside>

        <aside
          className="pointer-events-auto flex min-h-0 min-w-0 basis-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain touch-pan-y pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] lg:grid lg:w-[min(22rem,40vw)] lg:flex-none lg:overflow-hidden lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <ScenarioPanel />
          <ReplayPanel state={displayed} />
        </aside>
      </div>
    </div>
  );
}
