"use client";

import { useLandingBoot } from "@/components/landing/LandingBootProvider";
import { SimCanvas } from "@/components/scene/SimCanvas";

/** Same scene as `/sim`, graded for the landing hero (see `SimCanvas` + `OuterEnvironment` `landing`). */
export default function LandingHeroSimCanvas() {
  const boot = useLandingBoot();
  const markReady = boot?.markSceneReady;
  const forceRender = boot ? !boot.sceneReady : true;

  return (
    <div className="animate-landing-canvas-reveal h-full min-h-[100svh] w-full">
      <SimCanvas
        variant="landing"
        onLandingReady={markReady}
        landingForceRender={forceRender}
      />
    </div>
  );
}
