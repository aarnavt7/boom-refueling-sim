"use client";

import { useCallback, useEffect, useState } from "react";

import { GamepadProvider } from "@/components/gamepad/GamepadProvider";
import { DockingHud } from "@/components/hud/DockingHud";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { SimCanvas } from "@/components/scene/SimCanvas";
import { SimStorageBootstrap } from "@/components/sim/SimStorageBootstrap";

function SimBootLoader() {
  return (
    <div className="flex flex-col items-center gap-5" role="status" aria-live="polite">
      <div className="relative h-[52px] w-[52px] sm:h-14 sm:w-14" aria-hidden>
        {/* Static track — thin ring, tactical / minimal */}
        <div className="absolute inset-0 rounded-full border-[1.5px] border-white/[0.1]" />
        {/* Indeterminate arc — brand ember, rotates */}
        <div
          className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[color:var(--brand-orange)] motion-safe:animate-spin motion-reduce:animate-none"
          style={{ animationDuration: "0.85s" }}
        />
      </div>
      <p className="font-sans text-[12px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">Loading</p>
      <span className="sr-only">Loading simulation</span>
    </div>
  );
}

const SIM_BOOT_FAILSAFE_MS = 3500;

/**
 * Dark first paint + minimal boot overlay until env/HDR report ready (see `LandingSceneReadyNotifier`).
 */
export function SimPageShell() {
  const [simReady, setSimReady] = useState(false);
  const onSimReady = useCallback(() => {
    setSimReady(true);
  }, []);

  useEffect(() => {
    if (simReady) {
      return;
    }

    const id = window.setTimeout(() => {
      setSimReady(true);
    }, SIM_BOOT_FAILSAFE_MS);

    return () => window.clearTimeout(id);
  }, [simReady]);

  return (
    <main className="relative m-0 h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-[#0a0a0c] p-0 text-[color:var(--hud-fg)]">
      <SimStorageBootstrap />
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0c] transition-opacity duration-[480ms] ease-out motion-reduce:transition-none ${
          simReady ? "pointer-events-none z-[-1] opacity-0" : "opacity-100"
        }`}
        aria-busy={!simReady}
        aria-hidden={simReady}
      >
        <SimBootLoader />
      </div>
      <OnboardingProvider>
        <GamepadProvider>
          <SimCanvas onSimReady={onSimReady} />
          <DockingHud />
        </GamepadProvider>
      </OnboardingProvider>
    </main>
  );
}
