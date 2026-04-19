"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useOnboardingPresentation } from "@/lib/onboarding/useOnboardingPresentation";
import {
  MAIN_CAMERA_POSITION,
  MAIN_CAMERA_TARGET,
} from "@/lib/sim/aircraftVisualConfig";
import { useOnboardingStore } from "@/lib/store/onboardingStore";

type CameraPreset = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
};

const CAMERA_PRESETS: Record<"establish" | "focus" | "dock", CameraPreset> = {
  establish: {
    position: new THREE.Vector3(
      MAIN_CAMERA_POSITION.x,
      MAIN_CAMERA_POSITION.y,
      MAIN_CAMERA_POSITION.z,
    ),
    target: new THREE.Vector3(
      MAIN_CAMERA_TARGET.x,
      MAIN_CAMERA_TARGET.y,
      MAIN_CAMERA_TARGET.z,
    ),
    fov: 42,
  },
  focus: {
    position: new THREE.Vector3(-8.6, 3.25, 15.6),
    target: new THREE.Vector3(0.15, -1.55, 11.3),
    fov: 38,
  },
  dock: {
    position: new THREE.Vector3(-5.2, 2.2, 12.8),
    target: new THREE.Vector3(0.1, -1.65, 11.45),
    fov: 34,
  },
};

function getPresetId(stage: string | null) {
  if (stage === "transition" || stage === "mission-setup") {
    return "establish" as const;
  }

  if (stage === "acquire-track" || stage === "align") {
    return "focus" as const;
  }

  if (
    stage === "dock" ||
    stage === "replay-intro" ||
    stage === "replay-demo" ||
    stage === "save-handoff" ||
    stage === "ready"
  ) {
    return "dock" as const;
  }

  return null;
}

export function TutorialCameraRig() {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const controls = useThree((state) => state.controls as OrbitControlsImpl | undefined);
  const status = useOnboardingStore((state) => state.status);
  const guidedRunStage = useOnboardingStore((state) => state.guidedRunStage);
  const isDismissed = useOnboardingStore((state) => state.isDismissed);
  const allowOrbitControls = useOnboardingStore((state) => state.allowOrbitControls);
  const { cameraChoreographyEnabled } = useOnboardingPresentation();

  const preset = useMemo(() => {
    const presetId = getPresetId(guidedRunStage);
    return presetId ? CAMERA_PRESETS[presetId] : null;
  }, [guidedRunStage]);

  const active =
    cameraChoreographyEnabled &&
    !isDismissed &&
    !allowOrbitControls &&
    (status === "guided-run" || status === "replay-debrief") &&
    preset !== null;

  useFrame((_, delta) => {
    if (!active || !preset) {
      return;
    }

    const dampFactor = 1 - Math.exp(-delta * 3.8);
    camera.position.lerp(preset.position, dampFactor);
    camera.fov = THREE.MathUtils.damp(camera.fov, preset.fov, 5.5, delta);
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.lerp(preset.target, dampFactor);
      controls.update();
    } else {
      camera.lookAt(preset.target);
    }
  });

  return null;
}
