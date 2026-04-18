"use client";

import { useEffect, useState } from "react";

import { useLandingBoot } from "@/components/landing/LandingBootProvider";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Fires shortly after the 3D scene is ready — syncs typography/nav with the fly-by settle. */
export function useLandingHeroUnveil() {
  const boot = useLandingBoot();
  const sceneReady = boot?.sceneReady ?? true;
  const reduced = usePrefersReducedMotion();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!sceneReady) return;
    if (reduced) {
      setPulse(true);
      return;
    }
    const id = window.setTimeout(() => setPulse(true), 130);
    return () => clearTimeout(id);
  }, [sceneReady, reduced]);

  const unveiled = sceneReady && pulse;

  return { unveiled, reduced };
}
