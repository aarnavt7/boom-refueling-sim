"use client";

import { TacticalPanel } from "@/components/hud/tactical-ui";
import { SpotlightOverlay } from "@/components/onboarding/SpotlightOverlay";

type MissionPauseOverlayProps = {
  open: boolean;
  selector: string | null;
  compact: boolean;
  title: string;
  body: string;
  progressLabel: string;
  tone?: "default" | "success";
};

export function MissionPauseOverlay({
  open,
  selector,
  compact,
  title,
  body,
  progressLabel,
  tone = "default",
}: MissionPauseOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <SpotlightOverlay selector={selector} active={open} compact={compact} />
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-40 w-[min(28rem,calc(100vw-1.5rem))] -translate-x-1/2 sm:bottom-5">
        <TacticalPanel
          title="Journey beat"
          subtitle={progressLabel}
          className="animate-onboarding-fade-up rounded-[22px] shadow-[0_22px_60px_rgba(0,0,0,0.48)]"
          headerRight={
            <span
              className={`rounded-full border px-2 py-0.5 font-sans text-[10px] font-medium tracking-[0.03em] ${
                tone === "success"
                  ? "border-[color:var(--hud-ok)]/55 text-[color:var(--hud-ok)]"
                  : "border-[color:var(--hud-accent)]/45 text-[color:var(--hud-accent-fg)]"
              }`}
            >
              {tone === "success" ? "Arrived" : "Pause"}
            </span>
          }
        >
          <div className="space-y-2 px-4 py-4">
            <h2 className="font-sans text-[1rem] font-semibold tracking-tight text-[color:var(--hud-fg)]">
              {title}
            </h2>
            <p className="font-sans text-sm leading-relaxed text-[color:var(--hud-muted)]">
              {body}
            </p>
          </div>
        </TacticalPanel>
      </div>
    </>
  );
}
