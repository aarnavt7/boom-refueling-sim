"use client";

import dynamic from "next/dynamic";

const LandingHeroSimCanvas = dynamic(
  () => import("@/components/landing/LandingHeroSimCanvas"),
  {
    ssr: false,
    loading: () => null,
  },
);

export function LandingHeroSlot() {
  return <LandingHeroSimCanvas />;
}
