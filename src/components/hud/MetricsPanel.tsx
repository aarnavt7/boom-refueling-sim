"use client";

import { KvTable, TacticalPanel } from "@/components/hud/tactical-ui";
import type { LiveSimState } from "@/lib/sim/types";

type MetricsPanelProps = {
  state: LiveSimState;
};

export function MetricsPanel({ state }: MetricsPanelProps) {
  const rows = [
    { k: "Pos err", v: `${state.metrics.positionError.toFixed(3)} m` },
    { k: "Lat err", v: `${state.metrics.lateralError.toFixed(3)} m` },
    { k: "Fwd err", v: `${state.metrics.forwardError.toFixed(3)} m` },
    { k: "Closure", v: `${state.metrics.closureRate.toFixed(3)} m/s` },
    { k: "Align err", v: `${state.metrics.alignmentError.toFixed(3)} rad` },
    { k: "Dock score", v: `${(state.metrics.dockScore * 100).toFixed(1)} %` },
    { k: "Yaw", v: `${state.boom.yaw.toFixed(3)} rad` },
    { k: "Pitch", v: `${state.boom.pitch.toFixed(3)} rad` },
    { k: "Extend", v: `${state.boom.extend.toFixed(2)} m` },
    { k: "Cmd yaw", v: `${state.command.yawRate.toFixed(3)} rad/s` },
    { k: "Cmd pitch", v: `${state.command.pitchRate.toFixed(3)} rad/s` },
    { k: "Cmd ext", v: `${state.command.extendRate.toFixed(3)} m/s` },
    {
      k: "Track σ",
      v: `${(state.tracker.confidence * 100).toFixed(0)} %`,
      warn: state.tracker.confidence < 0.35,
    },
    { k: "Dropouts", v: String(state.metrics.dropoutCount), warn: state.metrics.dropoutCount > 0 },
    { k: "Visible", v: `${state.metrics.visibleTime.toFixed(1)} s` },
  ];

  return (
    <TacticalPanel
      title="Telemetry"
      subtitle="Boom pose, errors, commands"
      headerRight={
        <span className="font-mono text-[11px] tabular-nums text-[color:var(--hud-muted)]">
          T+{state.simTime.toFixed(1)}s
        </span>
      }
    >
      <KvTable rows={rows} />
      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--hud-muted)]">
          Safety interlocks
        </p>
        <p className="mt-1 font-mono text-[11px] leading-snug text-[color:var(--hud-fg)]">
          {state.safety.reasons.length > 0 ? state.safety.reasons.join(" · ") : "Within envelope · no holds"}
        </p>
      </div>
    </TacticalPanel>
  );
}
