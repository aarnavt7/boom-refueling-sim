"use client";

import { KvTable, TacticalPanel } from "@/components/hud/tactical-ui";
import type { LiveSimState } from "@/lib/sim/types";
import type { ReactNode } from "react";

type MetricsPanelProps = {
  state: LiveSimState;
  className?: string;
  bodyClassName?: string;
  scrollBody?: boolean;
  headerActions?: ReactNode;
  panelDragHandle?: ReactNode;
};

export function MetricsPanel({
  state,
  className = "min-h-0 lg:h-full",
  bodyClassName = "",
  scrollBody = true,
  headerActions,
  panelDragHandle,
}: MetricsPanelProps) {
  const profileLabel =
    state.journey?.assistiveMode === "low-vision" ? "Low-vision mode" : "Blind mode";
  const rows = [
    { k: "Distance left", v: `${(state.metrics.distanceRemaining ?? 0).toFixed(1)} m` },
    { k: "Route drift", v: `${state.metrics.positionError.toFixed(2)} m`, warn: state.metrics.positionError > 0.8 },
    { k: "Travel pace", v: `${state.metrics.closureRate.toFixed(2)} m/s` },
    { k: "Progress", v: `${((state.metrics.travelProgress ?? 0) * 100).toFixed(0)} %` },
    { k: "Confidence", v: `${(state.metrics.confidence * 100).toFixed(0)} %`, warn: state.metrics.confidence < 0.7 },
    { k: "Route clarity", v: `${((state.metrics.routeClarity ?? 0) * 100).toFixed(0)} %`, warn: (state.metrics.routeClarity ?? 1) < 0.58 },
    { k: "Access score", v: `${((state.metrics.accessibilityScore ?? 0) * 100).toFixed(0)} %` },
    { k: "Hazard load", v: `${(state.metrics.hazardExposure ?? 0).toFixed(2)}`, warn: (state.metrics.hazardExposure ?? 0) > 2.4 },
    { k: "Landmarks", v: `${(state.metrics.landmarkCoverage ?? 0).toFixed(1)} pts` },
    { k: "Corrections", v: String(state.metrics.correctionCount ?? 0), warn: (state.metrics.correctionCount ?? 0) > 2 },
    { k: "Reroutes", v: String(state.metrics.rerouteCount ?? 0), warn: (state.metrics.rerouteCount ?? 0) > 0 },
    { k: "Off-route", v: String(state.metrics.offRouteEvents ?? 0), warn: (state.metrics.offRouteEvents ?? 0) > 0 },
    { k: "Output mode", v: `${profileLabel} · ${state.journey?.guidancePrompt.previewLabel ?? "Assistive preview"}` },
    { k: "Next cue", v: `${state.journey?.guidancePrompt.clockHint ?? "Pending"} · ${state.journey?.guidancePrompt.distanceLabel ?? "Pending"}` },
  ];

  return (
    <TacticalPanel
      data-tour="telemetry-panel"
      className={className}
      bodyClassName={bodyClassName}
      scrollBody={scrollBody}
      title="Access Metrics"
      subtitle="Clarity, hazards, corrections"
      headerActions={headerActions}
      panelDragHandle={panelDragHandle}
      headerRight={
        <span className="font-sans text-[11px] tabular-nums text-[color:var(--hud-muted)]">
          T+{state.simTime.toFixed(1)}s
        </span>
      }
    >
      <KvTable rows={rows} />
      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
          Guidance quality
        </p>
        <p className="mt-1 font-sans text-[11px] leading-snug text-[color:var(--hud-fg)]">
          {state.journey?.notes.length ? state.journey.notes.join(" · ") : "The route is stable and confidence-first."}
        </p>
        <p className="mt-1 font-sans text-[11px] leading-snug text-[color:var(--hud-muted)]">
          {state.journey?.guidancePrompt.safetyNote ?? "Prompts will surface safety notes here when the route changes."}
        </p>
      </div>
    </TacticalPanel>
  );
}
