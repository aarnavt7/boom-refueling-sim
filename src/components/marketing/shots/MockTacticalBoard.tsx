"use client";

import { useMemo } from "react";

import {
  formatControllerStateLabel,
  guidanceHeaderStatusClass,
  guidanceHeaderStatusLabel,
} from "@/components/hud/controllerPresentation";
import { MetricsPanel } from "@/components/hud/MetricsPanel";
import { SensorFeedViewport } from "@/components/hud/SensorFeedViewport";
import { SegmentedBar, StagePipeline, TacticalPanel } from "@/components/hud/tactical-ui";
import { CONTROLLER_SEQUENCE } from "@/lib/sim/constants";
import { getDisplayedState } from "@/lib/sim/replay";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

/**
 * Same Guidance + passive sensor + telemetry stack as `/sim` DockingHud (left column),
 * without global header / scenario / replay columns — for `/imgs` tactical section.
 * Requires `SimCanvas` (e.g. Authentic capture above) so `sensorFrame` is live.
 */
export function MockTacticalBoard() {
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const persistMessage = useSimStore((state) => state.persistMessage);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);

  const displayed = useMemo(
    () => getDisplayedState(live, replaySamples, replayMode, replayIndex),
    [live, replaySamples, replayMode, replayIndex],
  );

  const headerClass = guidanceHeaderStatusClass(displayed.controllerState);
  const headerLabel = guidanceHeaderStatusLabel(displayed.controllerState);

  return (
    <div className="w-full max-w-3xl border border-[color:var(--hud-line)] bg-[color:var(--hud-base)] p-1 shadow-2xl">
      <TacticalPanel
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
          <span className="tabular-nums text-[color:var(--hud-fg)]">{displayed.metrics.positionError.toFixed(2)} m</span>
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
          <SensorFeedViewport viewportFrameClassName="mt-2 bg-black" />
        </div>
        <SegmentedBar value={displayed.tracker.confidence} />
        <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
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
      <div className="border-t border-[color:var(--hud-line)]">
        <MetricsPanel state={displayed} />
      </div>
    </div>
  );
}
