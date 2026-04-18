"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { MAIN_CAMERA_POSITION, MAIN_CAMERA_TARGET } from "@/lib/sim/aircraftVisualConfig";

const LOOK = new THREE.Vector3(MAIN_CAMERA_TARGET.x, MAIN_CAMERA_TARGET.y, MAIN_CAMERA_TARGET.z);

/** Locks the default `/sim` hero framing — no orbit — for `/imgs` marketing capture. */
export function CaptureCameraRig() {
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    camera.position.set(MAIN_CAMERA_POSITION.x, MAIN_CAMERA_POSITION.y, MAIN_CAMERA_POSITION.z);
    camera.lookAt(LOOK);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 42;
      camera.updateProjectionMatrix();
    }
  }, -1);

  return null;
}
