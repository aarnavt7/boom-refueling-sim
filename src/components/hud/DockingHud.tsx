"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { MetricsPanel } from "@/components/hud/MetricsPanel";
import { ReplayPanel } from "@/components/hud/ReplayPanel";
import { ScenarioPanel } from "@/components/hud/ScenarioPanel";
import { SegmentedBar, StagePipeline, TacticalPanel, ViewportFrame } from "@/components/hud/tactical-ui";
import { CONTROLLER_SEQUENCE } from "@/lib/sim/constants";
import { getDisplayedState } from "@/lib/sim/replay";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

function controllerTone(state: string): "ok" | "warn" | "danger" | "neutral" {
  if (state === "ABORT") return "danger";
  if (state === "DOCKED") return "ok";
  if (state === "INSERT") return "warn";
  return "neutral";
}

export function DockingHud() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const sensorFrame = useSimStore((state) => state.sensorFrame);
  const persistMessage = useSimStore((state) => state.persistMessage);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);

  const displayed = useMemo(
    () => getDisplayedState(live, replaySamples, replayMode, replayIndex),
    [live, replaySamples, replayMode, replayIndex],
  );

  const tone = controllerTone(displayed.controllerState);

  useEffect(() => {
    if (!sensorFrame || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    canvas.width = sensorFrame.width;
    canvas.height = sensorFrame.height;
    const safePixels = new Uint8ClampedArray(sensorFrame.width * sensorFrame.height * 4);
    safePixels.set(sensorFrame.pixels);
    const image = new ImageData(safePixels, sensorFrame.width, sensorFrame.height);
    context.putImageData(image, 0, 0);
  }, [sensorFrame]);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col text-[color:var(--hud-fg)]">
      <header className="pointer-events-auto flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--hud-line)] bg-[color:var(--hud-panel)] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
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
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            className={`rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.08em] ${
              replayMode
                ? "border-[color:var(--hud-warn)]/60 text-[color:var(--hud-warn)]"
                : "border-[color:var(--hud-ok)]/50 text-[color:var(--hud-ok)]"
            }`}
          >
            {replayMode ? "Replay" : "Live"}
          </span>
          <span className="hidden font-mono text-[11px] tabular-nums text-[color:var(--hud-muted)] sm:inline">
            T+{displayed.simTime.toFixed(1)}s
          </span>
          <span className="hidden font-mono text-[11px] tabular-nums text-[color:var(--hud-muted)] md:inline">
            FR{displayed.frame}
          </span>
          <Link
            href="/"
            className="rounded border border-[color:var(--hud-line)] px-2 py-0.5 font-mono text-[11px] text-[color:var(--hud-muted)] transition hover:border-[color:var(--hud-accent)]/50 hover:text-[color:var(--hud-accent-fg)]"
          >
            Home
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden sm:gap-3 lg:flex-row lg:justify-between">
        <aside className="pointer-events-auto flex max-h-[46vh] min-h-0 w-full min-w-0 flex-col gap-2 overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3 lg:max-h-none lg:w-[min(22rem,40vw)] lg:pl-3 lg:pr-1 lg:pt-3 lg:pb-3">
          <TacticalPanel
            title="Guidance"
            subtitle={`${displayed.controllerState} · camera + track`}
            headerRight={
              <span
                className={`font-mono text-[11px] uppercase tracking-[0.1em] tabular-nums ${
                  tone === "danger"
                    ? "text-[color:var(--hud-danger)]"
                    : tone === "ok"
                      ? "text-[color:var(--hud-ok)]"
                      : tone === "warn"
                        ? "text-[color:var(--hud-warn)]"
                        : "text-[color:var(--hud-muted)]"
                }`}
              >
                {tone === "danger" ? "Fault" : tone === "ok" ? "Captured" : tone === "warn" ? "Hot" : "Nominal"}
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
                {(displayed.estimate.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
              <p className="font-sans text-[11px] text-[color:var(--hud-muted)]">Synthetic EO/IR — geometry track (no ML)</p>
              <ViewportFrame className="mt-2 overflow-hidden">
                <div className="relative aspect-square w-full">
                  <canvas ref={canvasRef} className="h-full w-full object-cover opacity-95" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-[62%] w-[62%] border border-[color:var(--hud-accent)]/25" />
                    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[color:var(--hud-accent)]/15" />
                    <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[color:var(--hud-accent)]/15" />
                  </div>
                </div>
              </ViewportFrame>
            </div>

            <SegmentedBar value={displayed.estimate.confidence} />

            <div className="border-t border-[color:var(--hud-line)] px-3 py-2">
              <p className="mb-2 font-sans text-[11px] text-[color:var(--hud-muted)]">Controller states (left → right)</p>
              <StagePipeline sequence={CONTROLLER_SEQUENCE} active={displayed.controllerState} />
            </div>

            {displayed.abortReason ? (
              <p className="border-t border-[color:var(--hud-line)] px-3 py-2 font-mono text-[11px] text-[color:var(--hud-danger)]">
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

        <aside className="pointer-events-auto flex max-h-[46vh] min-h-0 w-full min-w-0 flex-col gap-2 overflow-y-auto px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3 lg:max-h-none lg:w-[min(22rem,40vw)] lg:pl-1 lg:pr-3 lg:pt-3 lg:pb-3">
          <ScenarioPanel />
          <ReplayPanel state={displayed} />
        </aside>
      </div>

      <footer className="pointer-events-none hidden border-t border-[color:var(--hud-line)] bg-[color:var(--hud-panel)]/90 px-3 py-2 font-mono text-[11px] text-[color:var(--hud-muted)] sm:block">
        <div className="mx-auto flex max-w-[90rem] justify-between gap-4">
          <span>Bun · Next · R3F</span>
          <span>{replayMode ? "Replay buffer · scrub timeline" : "Live sim · save optional"}</span>
        </div>
      </footer>
    </div>
  );
}
