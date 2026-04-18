"use client";

import { AircraftModel } from "@/components/scene/AircraftModel";
import { TankerProcedural } from "@/components/scene/procedural/TankerProcedural";
import { TANKER_VISUAL_CONFIG } from "@/lib/sim/aircraftVisualConfig";

export function Tanker() {
  return (
    <AircraftModel
      config={TANKER_VISUAL_CONFIG}
      fallback={<TankerProcedural />}
    />
  );
}
