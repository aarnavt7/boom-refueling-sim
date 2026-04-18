"use client";

import {
  KvTable,
  SegmentedBar,
  StagePipeline,
  TacticalPanel,
  ViewportFrame,
} from "@/components/hud/tactical-ui";
import { CONTROLLER_SEQUENCE } from "@/lib/sim/constants";

/**
 * Static HUD composition for marketing screenshots (no sim).
 */
export function MockTacticalBoard() {
  return (
    <div className="w-full max-w-3xl border border-[color:var(--hud-line)] bg-[color:var(--hud-base)] p-1 shadow-2xl">
      <TacticalPanel
        title="Guidance"
        subtitle="INSERT · camera + track"
        headerRight={
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[color:var(--hud-warn)]">
            Hot
          </span>
        }
      >
        <div className="px-3 py-2 font-sans text-[12px] leading-relaxed text-[color:var(--hud-muted)]">
          Err <span className="tabular-nums text-[color:var(--hud-fg)]">0.42 m</span>
          <span className="mx-2 text-[color:var(--hud-line)]">|</span>
          Conf <span className="tabular-nums text-[color:var(--hud-fg)]">88%</span>
        </div>
        <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
          <p className="font-sans text-[11px] text-[color:var(--hud-muted)]">
            Synthetic EO/IR — geometry track (no ML)
          </p>
          <ViewportFrame className="mt-2 overflow-hidden bg-gradient-to-br from-[#1a2030] to-black">
            <div className="flex aspect-square w-full items-center justify-center font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--hud-muted)]">
              Raster placeholder
            </div>
          </ViewportFrame>
        </div>
        <SegmentedBar value={0.88} />
        <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
          <p className="mb-2 font-sans text-[11px] text-[color:var(--hud-muted)]">Controller states (left → right)</p>
          <StagePipeline sequence={CONTROLLER_SEQUENCE} active="INSERT" />
        </div>
      </TacticalPanel>
      <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--hud-muted)]">Live metrics</p>
        <KvTable
          rows={[
            { k: "Range", v: "11.2 m" },
            { k: "Closure", v: "−0.04 m/s", warn: false },
            { k: "Track", v: "LOCK", warn: false },
          ]}
        />
      </div>
    </div>
  );
}
