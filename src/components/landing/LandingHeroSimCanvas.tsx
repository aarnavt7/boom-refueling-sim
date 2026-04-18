"use client";

import { SimCanvas } from "@/components/scene/SimCanvas";

/** Same scene as `/sim`, graded for the landing hero (see `SimCanvas` + `OuterEnvironment` `landing`). */
export default function LandingHeroSimCanvas() {
  return <SimCanvas variant="landing" />;
}
