"use client";

import { useMemo } from "react";
import type * as THREE from "three";

import { BoomRigGeometry } from "@/components/scene/BoomRigGeometry";
import { SensorCamera } from "@/components/scene/SensorCamera";
import { getSensorRigById } from "@/lib/sim/perception";
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
  const activeSensor = getSensorRigById(displayed.estimate.sensorId);
  const terminalSensorLocal = {
    x: activeSensor.localOffset.x,
    y: activeSensor.localOffset.y,
    z: Math.max(boom.extend + activeSensor.localOffset.z, 0.8),
  };

  return (
    <>
      {activeSensor.role === "acquire" ? (
        <group
          position={[activeSensor.localOffset.x, activeSensor.localOffset.y, activeSensor.localOffset.z]}
          rotation={[
            activeSensor.localRotation.x,
            activeSensor.localRotation.y,
            activeSensor.localRotation.z,
          ]}
        >
          <SensorCamera ref={sensorCameraRef} fov={activeSensor.fovDeg} />
        </group>
      ) : null}
      <BoomRigGeometry yaw={boom.yaw} pitch={boom.pitch} extend={boom.extend}>
        {activeSensor.role === "terminal" ? (
          <group
            position={[terminalSensorLocal.x, terminalSensorLocal.y, terminalSensorLocal.z]}
            rotation={[
              activeSensor.localRotation.x,
              activeSensor.localRotation.y,
              activeSensor.localRotation.z,
            ]}
          >
            <SensorCamera ref={sensorCameraRef} fov={activeSensor.fovDeg} />
          </group>
        ) : null}
      </BoomRigGeometry>
    </>
  );
}
