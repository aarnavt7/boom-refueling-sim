"use client";

import type * as THREE from "three";

import { BoomRigGeometry } from "@/components/scene/BoomRigGeometry";
import { SensorCamera } from "@/components/scene/SensorCamera";
import { getSensorRigById } from "@/lib/sim/perception";
import type { SensorMountId } from "@/lib/sim/types";

type BoomRigProps = {
  sensorCameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  sensorMountId: SensorMountId;
  boom: {
    yaw: number;
    pitch: number;
    extend: number;
  };
};

export function BoomRig({ sensorCameraRef, sensorMountId, boom }: BoomRigProps) {
  const activeSensor = getSensorRigById(sensorMountId);
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
