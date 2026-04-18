"use client";

import type { ReactNode } from "react";

import { useLandingBoot } from "@/components/landing/LandingBootProvider";

/**
 * Landing `<main>`: solid black until the hero WebGL scene is ready, then applies `.landing` styling.
 */
export function LandingMain({ children }: { children: ReactNode }) {
  const boot = useLandingBoot();
  const ready = boot?.sceneReady ?? true;

  return (
    <main
      id="main-content"
      className={ready ? "landing min-h-screen" : "min-h-screen bg-black [color-scheme:dark]"}
      aria-busy={!ready}
    >
      {/* Keep content mounted so WebGL + assets load behind the boot overlay. */}
      <div
        className={`transition-opacity duration-500 ease-out ${
          ready ? "pointer-events-auto opacity-100" : "pointer-events-none select-none opacity-0"
        }`}
        aria-hidden={!ready}
      >
        {children}
      </div>
    </main>
  );
}
