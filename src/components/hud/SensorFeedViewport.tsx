"use client";

import { useEffect, useMemo, useRef } from "react";

import { ViewportFrame } from "@/components/hud/tactical-ui";
import { getDisplayedState } from "@/lib/sim/replay";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type SensorFeedViewportProps = {
  /** Passed to `ViewportFrame` (corner brackets). */
  viewportFrameClassName?: string;
  /** Outer aspect box wrapping the sensor canvas (sensor raster is square). */
  aspectClassName?: string;
  /** When false, only canvas + tracking overlay (use inside another frame). */
  showViewportChrome?: boolean;
  /** Outer wrapper (e.g. `h-full w-full` inside a framed shot). */
  rootClassName?: string;
};

/**
 * Live passive sensor viewport: same `sensorFrame` pipeline as `/sim` (driven by `SimCanvas`).
 * Renders the primary active sensor feed with a fused-track box + crosshairs.
 */
export function SensorFeedViewport({
  viewportFrameClassName = "",
  aspectClassName = "aspect-square w-full",
  showViewportChrome = true,
  rootClassName = "",
}: SensorFeedViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const sensorFrame = useSimStore((state) => state.sensorFrame);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);
  const displayed = useMemo(
    () => getDisplayedState(live, replaySamples, replayMode, replayIndex),
    [live, replayIndex, replayMode, replaySamples],
  );

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

  const inner = (
    <div className={`relative ${aspectClassName}`}>
      <canvas ref={canvasRef} className="h-full w-full object-cover opacity-95" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[62%] w-[62%] border border-[color:var(--hud-accent)]/25" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[color:var(--hud-accent)]/15" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[color:var(--hud-accent)]/15" />
      </div>
      {displayed.estimate.visible && displayed.estimate.imagePoint ? (
        <div
          className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 border border-[color:var(--hud-accent)]/65"
          style={{
            left: `${((displayed.estimate.imagePoint.x + 1) * 0.5 * 100).toFixed(2)}%`,
            top: `${((1 - (displayed.estimate.imagePoint.y + 1) * 0.5) * 100).toFixed(2)}%`,
          }}
        >
          <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-[color:var(--hud-accent)]" />
          <span className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-[color:var(--hud-accent)]" />
        </div>
      ) : null}
    </div>
  );

  const frame = <ViewportFrame className={`overflow-hidden ${viewportFrameClassName}`}>{inner}</ViewportFrame>;

  if (!showViewportChrome) {
    return rootClassName ? <div className={rootClassName}>{inner}</div> : inner;
  }

  return rootClassName ? <div className={rootClassName}>{frame}</div> : frame;
}
