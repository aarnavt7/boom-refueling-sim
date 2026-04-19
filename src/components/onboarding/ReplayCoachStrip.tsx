"use client";

import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import { SpotlightOverlay } from "@/components/onboarding/SpotlightOverlay";

type ReplayCoachStripProps = {
  open: boolean;
  selector: string | null;
  compact: boolean;
  title: string;
  body: string;
  progressLabel: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  tone?: "default" | "success" | "warn";
};

function getToneClass(tone: ReplayCoachStripProps["tone"]) {
  if (tone === "success") {
    return "border-[color:var(--hud-ok)]/55 text-[color:var(--hud-ok)]";
  }

  if (tone === "warn") {
    return "border-[color:var(--hud-warn)]/55 text-[color:var(--hud-warn)]";
  }

  return "border-[color:var(--hud-accent)]/45 text-[color:var(--hud-accent-fg)]";
}

export function ReplayCoachStrip({
  open,
  selector,
  compact,
  title,
  body,
  progressLabel,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  tone = "default",
}: ReplayCoachStripProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <SpotlightOverlay selector={selector} active={open} compact={compact} />
      <div className="pointer-events-auto fixed bottom-4 right-4 z-40 w-[min(24rem,calc(100vw-1.5rem))] sm:bottom-5 sm:right-5">
        <TacticalPanel
          title="Replay debrief"
          subtitle={progressLabel}
          className="animate-onboarding-fade-up rounded-[22px] shadow-[0_22px_60px_rgba(0,0,0,0.48)]"
          headerRight={
            <span
              className={`rounded-full border px-2 py-0.5 font-sans text-[10px] font-medium tracking-[0.03em] ${getToneClass(
                tone,
              )}`}
            >
              {tone === "success" ? "Saved" : tone === "warn" ? "Optional" : "Replay"}
            </span>
          }
        >
          <div className="space-y-4 px-4 py-4">
            <div className="space-y-2">
              <h2 className="font-sans text-[0.98rem] font-semibold tracking-tight text-[color:var(--hud-fg)]">
                {title}
              </h2>
              <p className="font-sans text-sm leading-relaxed text-[color:var(--hud-muted)]">
                {body}
              </p>
            </div>

            {primaryActionLabel || secondaryActionLabel ? (
              <div className="flex flex-wrap gap-2">
                {primaryActionLabel && onPrimaryAction ? (
                  <HudButton
                    variant="primary"
                    data-gamepad-focus-id="replay-coach-primary"
                    data-gamepad-group="replay-coach"
                    data-gamepad-scope="overlay"
                    data-gamepad-label={primaryActionLabel}
                    data-gamepad-default="true"
                    onClick={onPrimaryAction}
                  >
                    {primaryActionLabel}
                  </HudButton>
                ) : null}
                {secondaryActionLabel && onSecondaryAction ? (
                  <HudButton
                    variant="ghost"
                    data-gamepad-focus-id="replay-coach-secondary"
                    data-gamepad-group="replay-coach"
                    data-gamepad-scope="overlay"
                    data-gamepad-label={secondaryActionLabel}
                    data-gamepad-back-action="true"
                    onClick={onSecondaryAction}
                  >
                    {secondaryActionLabel}
                  </HudButton>
                ) : null}
              </div>
            ) : null}
          </div>
        </TacticalPanel>
      </div>
    </>
  );
}
