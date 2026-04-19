"use client";

import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";

type MissionCoachCardProps = {
  open: boolean;
  title: string;
  body: string;
  progressLabel?: string;
  layout?: "center" | "bottom";
  tone?: "default" | "success" | "warn";
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

function getToneClass(tone: MissionCoachCardProps["tone"]) {
  if (tone === "success") {
    return "border-[color:var(--hud-ok)]/55 text-[color:var(--hud-ok)]";
  }

  if (tone === "warn") {
    return "border-[color:var(--hud-warn)]/55 text-[color:var(--hud-warn)]";
  }

  return "border-[color:var(--hud-accent)]/45 text-[color:var(--hud-accent-fg)]";
}

export function MissionCoachCard({
  open,
  title,
  body,
  progressLabel,
  layout = "bottom",
  tone = "default",
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: MissionCoachCardProps) {
  if (!open) {
    return null;
  }

  const positionClass =
    layout === "center"
      ? "left-1/2 top-1/2 w-[min(32rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2"
      : "bottom-4 left-1/2 w-[min(30rem,calc(100vw-1.5rem))] -translate-x-1/2 sm:left-4 sm:w-[min(28rem,calc(100vw-2rem))] sm:translate-x-0";

  return (
    <div className={`pointer-events-auto fixed z-40 ${positionClass}`}>
      <TacticalPanel
        title="Guided run"
        subtitle={progressLabel ?? "Mission walkthrough"}
        className="animate-onboarding-fade-up rounded-[24px] shadow-[0_24px_72px_rgba(0,0,0,0.5)]"
        headerRight={
          <span
            className={`rounded-full border px-2 py-0.5 font-sans text-[10px] font-medium tracking-[0.03em] ${getToneClass(
              tone,
            )}`}
          >
            {tone === "success" ? "Docked" : tone === "warn" ? "Notice" : "Live"}
          </span>
        }
      >
        <div className="space-y-4 px-4 py-4">
          <div className="space-y-2">
            <h2 className="font-sans text-[1rem] font-semibold tracking-tight text-[color:var(--hud-fg)]">
              {title}
            </h2>
            <p className="font-sans text-sm leading-relaxed text-[color:var(--hud-muted)]">
              {body}
            </p>
          </div>

          {primaryActionLabel || secondaryActionLabel ? (
            <div className="flex flex-wrap gap-2">
              {primaryActionLabel && onPrimaryAction ? (
                <HudButton variant="primary" onClick={onPrimaryAction}>
                  {primaryActionLabel}
                </HudButton>
              ) : null}
              {secondaryActionLabel && onSecondaryAction ? (
                <HudButton variant="ghost" onClick={onSecondaryAction}>
                  {secondaryActionLabel}
                </HudButton>
              ) : null}
            </div>
          ) : null}
        </div>
      </TacticalPanel>
    </div>
  );
}
