"use client";

import type { GamepadUiMode } from "@/lib/sim/types";
import { HudButton } from "@/components/hud/tactical-ui";

type CycleControlProps = {
  label: string;
  valueLabel: string;
  detail: string;
  onPrevious: () => void;
  onNext: () => void;
  previousLabel?: string;
  nextLabel?: string;
  gamepadBaseId: string;
  gamepadGroup: string;
  gamepadScope?: GamepadUiMode;
};

export function CycleControl({
  label,
  valueLabel,
  detail,
  onPrevious,
  onNext,
  previousLabel = "Previous",
  nextLabel = "Next",
  gamepadBaseId,
  gamepadGroup,
  gamepadScope = "hud",
}: CycleControlProps) {
  return (
    <div>
      <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
        {label}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <HudButton
          variant="ghost"
          data-gamepad-focus-id={`${gamepadBaseId}-previous`}
          data-gamepad-group={gamepadGroup}
          data-gamepad-scope={gamepadScope}
          data-gamepad-label={`${previousLabel} ${label}`}
          onClick={onPrevious}
        >
          Prev
        </HudButton>
        <div className="min-w-0 flex-1 rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] bg-black/20 px-3 py-2 text-center">
          <p className="truncate font-sans text-[12px] font-medium tracking-[0.02em] text-[color:var(--hud-fg)]">
            {valueLabel}
          </p>
        </div>
        <HudButton
          variant="ghost"
          data-gamepad-focus-id={`${gamepadBaseId}-next`}
          data-gamepad-group={gamepadGroup}
          data-gamepad-scope={gamepadScope}
          data-gamepad-label={`${nextLabel} ${label}`}
          onClick={onNext}
        >
          Next
        </HudButton>
      </div>
      <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
        {detail}
      </p>
    </div>
  );
}
