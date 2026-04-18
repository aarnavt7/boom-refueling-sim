"use client";

import { useEffect } from "react";

import { DockingHud } from "@/components/hud/DockingHud";
import { SimCanvas } from "@/components/scene/SimCanvas";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

/**
 * Live sim + HUD at default hero framing; freezes after a few seconds for screenshots.
 */
export function CaptureScene() {
  useEffect(() => {
    useSimStore.getState().resetScenario("steady-approach");
    useUiStore.getState().setSimFrozen(false);
    const t = window.setTimeout(() => {
      useUiStore.getState().setSimFrozen(true);
    }, 4200);
    return () => {
      window.clearTimeout(t);
      useUiStore.getState().setSimFrozen(false);
    };
  }, []);

  return (
    <div className="relative aspect-video w-full max-w-[1600px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0b0d] shadow-2xl">
      <SimCanvas variant="capture" />
      <DockingHud embedded />
    </div>
  );
}
