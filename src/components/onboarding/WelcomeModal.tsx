"use client";

import { useEffect, useRef } from "react";

import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";

type WelcomeModalProps = {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
};

export function WelcomeModal({ open, onStart, onSkip }: WelcomeModalProps) {
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    primaryButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onSkip();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSkip, open]);

  if (!open) {
    return null;
  }

  const backdropStyle = {
    backdropFilter: "blur(10px) brightness(0.45)",
    WebkitBackdropFilter: "blur(10px) brightness(0.45)",
    backgroundColor: "rgba(4, 6, 9, 0.58)",
  } as const;

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={backdropStyle} aria-hidden="true" />
      <div className="relative w-full max-w-[34rem] animate-onboarding-fade-up">
        <TacticalPanel
          title="Orientation"
          subtitle="Quick mission brief"
          className="rounded-[26px] shadow-[0_28px_80px_rgba(0,0,0,0.5)]"
        >
          <div role="dialog" aria-modal="true" aria-labelledby="onboarding-welcome-title" className="px-4 py-4 sm:px-5 sm:py-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2
                  id="onboarding-welcome-title"
                  className="font-sans text-[1.05rem] font-semibold tracking-tight text-[color:var(--hud-fg)] sm:text-[1.15rem]"
                >
                  Learn the sim without the stress
                </h2>
                <p className="max-w-[34rem] font-sans text-sm leading-relaxed text-[color:var(--hud-muted)]">
                  This quick tour points out the parts of the interface that matter most first, including
                  the controls that start, pause, and stop each live run.
                </p>
                <p className="max-w-[34rem] font-sans text-sm leading-relaxed text-[color:var(--hud-muted)]">
                  It takes under a minute, keeps the steps gentle, and leaves you in a calm place where
                  you can launch a run only when you are ready.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <HudButton ref={primaryButtonRef} variant="primary" onClick={onStart}>
                  Start quick tour
                </HudButton>
                <HudButton variant="ghost" onClick={onSkip}>
                  Skip for now
                </HudButton>
              </div>
            </div>
          </div>
        </TacticalPanel>
      </div>
    </div>
  );
}
