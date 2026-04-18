"use client";

import { useMemo } from "react";
import type * as THREE from "three";

import { BoomRigGeometry } from "@/components/scene/BoomRigGeometry";
import { SensorCamera } from "@/components/scene/SensorCamera";
import { BOOM_BASE_POSITION } from "@/lib/sim/constants";
import { getDisplayedState } from "@/lib/sim/replay";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type BoomRigProps = {
  sensorCameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
};

export function BoomRig({ sensorCameraRef }: BoomRigProps) {
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);

  const displayed = useMemo(
    () => getDisplayedState(live, replaySamples, replayMode, replayIndex),
    [live, replaySamples, replayMode, replayIndex],
  );

  const { boom } = displayed;

  return (
    <group position={[BOOM_BASE_POSITION.x, BOOM_BASE_POSITION.y, BOOM_BASE_POSITION.z]}>
      <BoomRigGeometry yaw={boom.yaw} pitch={boom.pitch} extend={boom.extend}>
        <group position={[0, 0.06, Math.max(boom.extend - 0.65, 0.8)]}>
          <SensorCamera ref={sensorCameraRef} />
        </group>
      </BoomRigGeometry>
    </group>
  );
}
