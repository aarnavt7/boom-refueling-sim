"use client";

import { useMemo } from "react";

import { ViewportFrame } from "@/components/hud/tactical-ui";
import {
  SENSOR_VIEWPORT_MODALITY_OPTIONS,
  SENSOR_VIEWPORT_SOURCE_OPTIONS,
} from "@/lib/sim/sensorViewport";
import { useDisplayedReplayBundle } from "@/lib/sim/useDisplayedReplayBundle";
import { useUiStore } from "@/lib/store/uiStore";

type SensorFeedViewportProps = {
  viewportFrameClassName?: string;
  aspectClassName?: string;
  showViewportChrome?: boolean;
  rootClassName?: string;
};

function resolvePreviewCopy({
  source,
  modality,
  prompt,
}: {
  source: string;
  modality: string;
  prompt: NonNullable<ReturnType<typeof useDisplayedReplayBundle>["primary"]["journey"]>["guidancePrompt"] | null;
}) {
  if (!prompt) {
    return {
      title: "Assistive output idle",
      primary: "Start a journey to preview guidance prompts.",
      secondary: "Pathlight will surface route cues, landmarks, and hazard warnings here.",
      tone: "border-[color:var(--hud-line)] text-[color:var(--hud-muted)]",
    };
  }

  if (source === "tail-acq-left") {
    return {
      title: "Audio prompt",
      primary: prompt.primary,
      secondary: `${prompt.landmark} ${prompt.safetyNote}`,
      tone: "border-[color:var(--hud-accent)]/50 text-[color:var(--hud-accent-fg)]",
    };
  }

  if (source === "tail-acq-right") {
    return {
      title: "Landmark cue",
      primary: prompt.landmark,
      secondary: `${prompt.primary} ${prompt.safetyNote}`,
      tone: "border-[color:var(--hud-ok)]/45 text-[color:var(--hud-ok)]",
    };
  }

  if (source === "boom-term-left") {
    return {
      title: "Hazard focus",
      primary: prompt.safetyNote,
      secondary: `${prompt.primary} ${prompt.landmark}`,
      tone: "border-[color:var(--hud-warn)]/55 text-[color:var(--hud-warn)]",
    };
  }

  return {
    title: modality === "visible" ? "Low-vision route glow" : "Confidence-first output",
    primary: prompt.primary,
    secondary: `${prompt.clockHint} · ${prompt.distanceLabel}`,
    tone: "border-[color:var(--hud-accent)]/50 text-[color:var(--hud-accent-fg)]",
  };
}

export function SensorFeedViewport({
  viewportFrameClassName = "",
  aspectClassName = "aspect-square w-full",
  showViewportChrome = true,
  rootClassName = "",
}: SensorFeedViewportProps) {
  const displayed = useDisplayedReplayBundle().primary;
  const sensorViewportSource = useUiStore((state) => state.sensorViewportSource);
  const sensorViewportModality = useUiStore((state) => state.sensorViewportModality);
  const prompt = displayed.journey?.guidancePrompt ?? null;
  const assistiveMode = displayed.journey?.assistiveMode ?? "blind";

  const sourceLabel =
    SENSOR_VIEWPORT_SOURCE_OPTIONS.find((option) => option.id === sensorViewportSource)?.label ??
    SENSOR_VIEWPORT_SOURCE_OPTIONS[0].label;
  const modalityLabel =
    SENSOR_VIEWPORT_MODALITY_OPTIONS.find((option) => option.id === sensorViewportModality)?.label ??
    SENSOR_VIEWPORT_MODALITY_OPTIONS[0].label;

  const preview = useMemo(
    () =>
      resolvePreviewCopy({
        source: sensorViewportSource,
        modality: sensorViewportModality,
        prompt,
      }),
    [prompt, sensorViewportModality, sensorViewportSource],
  );

  const lowVisionMode = assistiveMode === "low-vision" || sensorViewportModality === "visible";

  const inner = (
    <div className={`relative overflow-hidden ${aspectClassName}`}>
      <div
        className={`absolute inset-0 ${
          lowVisionMode
            ? "bg-[radial-gradient(circle_at_50%_20%,rgba(255,208,122,0.32),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]"
            : "bg-[radial-gradient(circle_at_50%_20%,rgba(125,208,255,0.22),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
        }`}
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.95)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.95)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-3">
        <span className={`rounded-full border px-2 py-1 font-sans text-[10px] font-medium ${preview.tone}`}>
          {preview.title}
        </span>
        <span className="rounded-full border border-[color:var(--hud-line)] bg-black/45 px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-fg)]">
          {sourceLabel} · {modalityLabel}
        </span>
      </div>

      <div className="absolute inset-x-4 top-[4.2rem] rounded-[18px] border border-[color:var(--hud-line)] bg-black/35 p-3">
        <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
          Primary cue
        </p>
        <p className="mt-2 font-sans text-sm font-medium leading-relaxed text-[color:var(--hud-fg)]">
          {preview.primary}
        </p>
        <p className="mt-3 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
          {preview.secondary}
        </p>
      </div>

      <div className="absolute inset-x-4 bottom-4 grid gap-2">
        <div className="rounded-[18px] border border-[color:var(--hud-line)] bg-black/35 px-3 py-2">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Assistive output
          </p>
          <p className="mt-1 font-sans text-[11px] leading-relaxed text-[color:var(--hud-fg)]">
            {prompt ? `${prompt.clockHint} · ${prompt.distanceLabel}` : "Clock-direction and distance cues will appear here."}
          </p>
        </div>
        <div className="rounded-[18px] border border-[color:var(--hud-line)] bg-black/35 px-3 py-2">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Visual treatment
          </p>
          <p className="mt-1 font-sans text-[11px] leading-relaxed text-[color:var(--hud-fg)]">
            {lowVisionMode
              ? "Low-vision mode suppresses clutter, thickens the route, and strengthens landmark contrast."
              : "Blind mode keeps prompts concise and landmark-first so the traveler can build trust quickly."}
          </p>
        </div>
      </div>
    </div>
  );

  const frame = <ViewportFrame className={`overflow-hidden ${viewportFrameClassName}`}>{inner}</ViewportFrame>;

  if (!showViewportChrome) {
    return rootClassName ? <div className={rootClassName}>{inner}</div> : inner;
  }

  return rootClassName ? <div className={rootClassName}>{frame}</div> : frame;
}
