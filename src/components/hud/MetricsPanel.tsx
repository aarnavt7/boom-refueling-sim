"use client";

import { formatMoveECEF } from "@/lib/sim/autopilot";
import { KvTable, TacticalPanel } from "@/components/hud/tactical-ui";
import type { LiveSimState } from "@/lib/sim/types";
import type { ReactNode } from "react";

type MetricsPanelProps = {
  state: LiveSimState;
  className?: string;
  panelDragHandle?: ReactNode;
};

export function MetricsPanel({ state, className = "min-h-0 lg:h-full", panelDragHandle }: MetricsPanelProps) {
  const rows = [
    { k: "Pos err", v: `${state.metrics.positionError.toFixed(3)} m` },
    { k: "Lat err", v: `${state.metrics.lateralError.toFixed(3)} m` },
    { k: "Fwd err", v: `${state.metrics.forwardError.toFixed(3)} m` },
    { k: "Closure", v: `${state.metrics.closureRate.toFixed(3)} m/s` },
    { k: "Mate score", v: `${(state.metrics.dockScore * 100).toFixed(1)} %` },
    { k: "Sensor mode", v: `${state.estimate.sensorName} · ${state.estimate.modality}` },
    { k: "Track role", v: `${state.tracker.preferredRole} · ${state.tracker.activeSensorIds.length} active` },
    { k: "Disagree", v: `${state.metrics.sensorDisagreement.toFixed(3)} m`, warn: state.metrics.sensorDisagreement > 0.4 },
    { k: "Track rng", v: `${state.metrics.trackRange.toFixed(2)} m` },
    { k: "Yaw", v: `${state.boom.yaw.toFixed(3)} rad` },
    { k: "Pitch", v: `${state.boom.pitch.toFixed(3)} rad` },
    { k: "Extend", v: `${state.boom.extend.toFixed(2)} m` },
    { k: "moveECEF", v: formatMoveECEF(state.autopilotCommand) },
    { k: "Cmd mag", v: `${(state.metrics.commandMagnitude * 100).toFixed(1)} cm` },
    { k: "Yaw rate", v: `${state.command.yawRate.toFixed(3)} rad/s` },
    { k: "Pitch rate", v: `${state.command.pitchRate.toFixed(3)} rad/s` },
    { k: "Ext rate", v: `${state.command.extendRate.toFixed(3)} m/s` },
    {
      k: "Fused conf",
      v: `${(state.tracker.confidence * 100).toFixed(0)} %`,
      warn: state.tracker.confidence < 0.35,
    },
    { k: "Dropouts", v: String(state.metrics.dropoutCount), warn: state.metrics.dropoutCount > 0 },
    { k: "Visible", v: `${state.metrics.visibleTime.toFixed(1)} s` },
  ];

  return (
    <TacticalPanel
      data-tour="telemetry-panel"
      className={className}
      scrollBody
      title="Telemetry"
      subtitle="Boom pose, errors, commands"
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
          Safety + emission state
        </p>
        <p className="mt-1 font-sans text-[11px] leading-snug text-[color:var(--hud-fg)]">
          {state.safety.reasons.length > 0 ? state.safety.reasons.join(" · ") : "Within envelope · no holds"}
        </p>
        <p className="mt-1 font-sans text-[11px] leading-snug text-[color:var(--hud-muted)]">
          {state.estimate.notes.join(" · ")}
        </p>
      </div>
    </TacticalPanel>
  );
}
