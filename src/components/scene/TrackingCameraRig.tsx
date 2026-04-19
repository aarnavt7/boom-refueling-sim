"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { getBoomTipPose } from "@/lib/sim/kinematics";
import { useDisplayedReplayBundle } from "@/lib/sim/useDisplayedReplayBundle";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useUiStore } from "@/lib/store/uiStore";

const desiredPosition = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();

export function TrackingCameraRig() {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const controls = useThree((state) => state.controls as OrbitControlsImpl | undefined);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const allowOrbitControls = useOnboardingStore((state) => state.allowOrbitControls);
  const displayed = useDisplayedReplayBundle().primary;

  useFrame((_, delta) => {
    if (cameraMode === "manual" || !allowOrbitControls) {
      return;
    }

    const boomTip = getBoomTipPose(displayed.boom).position;

    if (cameraMode === "receiver-lock") {
      desiredPosition.set(
        displayed.receiverPose.position.x - 6.4,
        displayed.receiverPose.position.y + 3.3,
        displayed.receiverPose.position.z + 8.2,
      );
      desiredTarget.set(
        displayed.receiverPose.position.x,
        displayed.receiverPose.position.y + 0.15,
        displayed.receiverPose.position.z,
      );
    } else {
      desiredPosition.set(
        (boomTip.x + displayed.targetPose.position.x) * 0.5 - 3.8,
        (boomTip.y + displayed.targetPose.position.y) * 0.5 + 1.8,
        (boomTip.z + displayed.targetPose.position.z) * 0.5 + 4.6,
      );
      desiredTarget.set(
        (boomTip.x + displayed.targetPose.position.x) * 0.5,
        (boomTip.y + displayed.targetPose.position.y) * 0.5,
        (boomTip.z + displayed.targetPose.position.z) * 0.5,
      );
    }

    const damp = 1 - Math.exp(-delta * 3.8);
    camera.position.lerp(desiredPosition, damp);
    camera.fov = THREE.MathUtils.damp(
      camera.fov,
      cameraMode === "dock-lock" ? 33 : 39,
      5.2,
      delta,
    );
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.lerp(desiredTarget, damp);
      controls.update();
    } else {
      camera.lookAt(desiredTarget);
    }
  });

  return null;
}
