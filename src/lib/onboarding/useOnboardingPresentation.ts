"use client";

import { useEffect, useState } from "react";

const COMPACT_BREAKPOINT = 1024;

function getViewportFlags() {
  if (typeof window === "undefined") {
    return {
      isCompact: false,
      prefersReducedMotion: false,
    };
  }

  return {
    isCompact: window.innerWidth < COMPACT_BREAKPOINT,
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

export function useOnboardingPresentation() {
  const [flags, setFlags] = useState(getViewportFlags);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateFlags = () => {
      setFlags(getViewportFlags());
    };

    updateFlags();
    window.addEventListener("resize", updateFlags);
    mediaQuery.addEventListener("change", updateFlags);

    return () => {
      window.removeEventListener("resize", updateFlags);
      mediaQuery.removeEventListener("change", updateFlags);
    };
  }, []);

  return {
    isCompact: flags.isCompact,
    prefersReducedMotion: flags.prefersReducedMotion,
    cameraChoreographyEnabled: !flags.isCompact && !flags.prefersReducedMotion,
    animatedReplayEnabled: !flags.isCompact && !flags.prefersReducedMotion,
  };
}
