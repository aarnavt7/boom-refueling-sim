"use client";

import { useMemo } from "react";
import * as THREE from "three";

import { getBoomTipPose } from "@/lib/sim/kinematics";
import { distanceVec3 } from "@/lib/sim/math";
import { getRefuelLinkVisibility } from "@/lib/sim/refuelLink";
import { useDisplayedReplayBundle } from "@/lib/sim/useDisplayedReplayBundle";
import { useSimStore } from "@/lib/store/simStore";

const UP_AXIS = new THREE.Vector3(0, 1, 0);

export function RefuelLinkEffect() {
  const scenario = useSimStore((state) => state.scenario);
  const displayed = useDisplayedReplayBundle().primary;

  const boomTip = getBoomTipPose(displayed.boom).position;
  const target = displayed.targetPose.position;
  const linkDistance = distanceVec3(boomTip, target);
  const { showMatedLink, visible } = getRefuelLinkVisibility({
    controllerState: displayed.controllerState,
    linkDistance,
    insertTolerance: scenario.controller.insertTolerance,
  });

  const transform = useMemo(() => {
    const start = new THREE.Vector3(boomTip.x, boomTip.y, boomTip.z);
    const end = new THREE.Vector3(target.x, target.y, target.z);
    const direction = end.clone().sub(start);
    const length = Math.max(direction.length(), 0.001);
    const center = start.clone().lerp(end, 0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      UP_AXIS,
      direction.clone().normalize(),
    );

    return {
      center,
      quaternion,
      length,
      direction: direction.clone().normalize(),
      start,
    };
  }, [boomTip.x, boomTip.y, boomTip.z, target.x, target.y, target.z]);

  if (!visible) {
    return null;
  }

  const radius = showMatedLink ? 0.058 : 0.038;
  const bodyColor = showMatedLink ? "#f7c95b" : "#88d1ff";
  const glowOpacity = showMatedLink ? 0.62 : 0.26;

  return (
    <group>
      <mesh
        position={[transform.center.x, transform.center.y, transform.center.z]}
        quaternion={transform.quaternion}
      >
        <cylinderGeometry args={[radius, radius, transform.length, 18, 1, true]} />
        <meshBasicMaterial color={bodyColor} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {showMatedLink
        ? [0.18, 0.48, 0.78].map((offset) => {
            const pulseCenter = transform.start
              .clone()
              .addScaledVector(
                transform.direction,
                transform.length * ((displayed.simTime * 0.6 + offset) % 1),
              );

            return (
              <mesh
                key={offset}
                position={[pulseCenter.x, pulseCenter.y, pulseCenter.z]}
              >
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshBasicMaterial
                  color="#ffe39b"
                  transparent
                  opacity={glowOpacity}
                  depthWrite={false}
                />
              </mesh>
            );
          })
        : null}
    </group>
  );
}
