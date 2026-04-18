"use client";

import { Environment } from "@react-three/drei";

/**
 * IBL only. Contact shadows were removed: their ground plane read as a flat grey “deck” with a
 * hard horizon and fought the stratosphere sky read.
 */
export function SceneStaging() {
  return <Environment preset="studio" background={false} environmentIntensity={0.18} />;
}
