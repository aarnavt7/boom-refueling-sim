"use client";

import dynamic from "next/dynamic";

const LandingHeroSimCanvas = dynamic(
  () => import("@/components/landing/LandingHeroSimCanvas"),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[100svh] w-full items-center justify-center bg-landing-bg font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted"
        aria-hidden
      >
        Loading scene…
      </div>
    ),
  },
);

export function LandingHeroSlot() {
  return <LandingHeroSimCanvas />;
}
