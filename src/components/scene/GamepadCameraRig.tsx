"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import {
  MAIN_CAMERA_POSITION,
  MAIN_CAMERA_TARGET,
} from "@/lib/sim/aircraftVisualConfig";
import { useGamepadStore } from "@/lib/store/gamepadStore";
import { useUiStore } from "@/lib/store/uiStore";

const targetVector = new THREE.Vector3();
const offsetVector = new THREE.Vector3();
const forwardVector = new THREE.Vector3();
const rightVector = new THREE.Vector3();
const upVector = new THREE.Vector3();
const spherical = new THREE.Spherical();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function panTarget(
  target: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  deltaRight: number,
  deltaUp: number,
) {
  forwardVector.subVectors(target, camera.position).normalize();
  rightVector.crossVectors(forwardVector, camera.up).normalize();
  upVector.crossVectors(rightVector, forwardVector).normalize();

  target
    .addScaledVector(rightVector, deltaRight)
    .addScaledVector(upVector, deltaUp);
}

export function GamepadCameraRig() {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const controls = useThree((state) => state.controls as OrbitControlsImpl | undefined);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const lockOffsetsRef = useRef({
    yaw: 0,
    pitch: 0,
    panX: 0,
    panY: 0,
    distance: 0,
  });
  const resetCountRef = useRef(0);

  useFrame((_, delta) => {
    const { input, uiMode, cameraResetCount } = useGamepadStore.getState();
    const dt = Math.min(delta, 0.1);

    if (!controls) {
      return;
    }

    if (cameraResetCount !== resetCountRef.current) {
      resetCountRef.current = cameraResetCount;
      lockOffsetsRef.current = {
        yaw: 0,
        pitch: 0,
        panX: 0,
        panY: 0,
        distance: 0,
      };

      controls.target.set(
        MAIN_CAMERA_TARGET.x,
        MAIN_CAMERA_TARGET.y,
        MAIN_CAMERA_TARGET.z,
      );
      camera.position.set(
        MAIN_CAMERA_POSITION.x,
        MAIN_CAMERA_POSITION.y,
        MAIN_CAMERA_POSITION.z,
      );
      camera.lookAt(controls.target);
      controls.update();
    }

    if (!input.connected || uiMode !== "viewport") {
      return;
    }

    if (cameraMode === "manual") {
      targetVector.copy(controls.target);
      const panScale = 5 * dt;
      const zoomScale = 16 * dt;
      const orbitScale = 1.9 * dt;

      if (Math.abs(input.leftStick.x) > 0.01 || Math.abs(input.leftStick.y) > 0.01) {
        panTarget(
          targetVector,
          camera,
          input.leftStick.x * panScale,
          -input.leftStick.y * panScale,
        );
      }

      offsetVector.subVectors(camera.position, controls.target);
      spherical.setFromVector3(offsetVector);
      spherical.theta -= input.rightStick.x * orbitScale;
      spherical.phi = clamp(
        spherical.phi + input.rightStick.y * orbitScale * 0.9,
        0.42,
        Math.PI - 0.42,
      );
      spherical.radius = clamp(
        spherical.radius + (input.leftTrigger - input.rightTrigger) * zoomScale,
        9,
        38,
      );
      offsetVector.setFromSpherical(spherical);

      camera.position.copy(targetVector).add(offsetVector);
      controls.target.copy(targetVector);
      camera.lookAt(targetVector);
      controls.update();
      return;
    }

    lockOffsetsRef.current.yaw = clamp(
      lockOffsetsRef.current.yaw + input.rightStick.x * dt * 1.5,
      -0.8,
      0.8,
    );
    lockOffsetsRef.current.pitch = clamp(
      lockOffsetsRef.current.pitch + input.rightStick.y * dt * 1.1,
      -0.42,
      0.42,
    );
    lockOffsetsRef.current.panX = clamp(
      lockOffsetsRef.current.panX + input.leftStick.x * dt * 2.4,
      -2.6,
      2.6,
    );
    lockOffsetsRef.current.panY = clamp(
      lockOffsetsRef.current.panY + input.leftStick.y * dt * 1.8,
      -1.8,
      1.8,
    );
    lockOffsetsRef.current.distance = clamp(
      lockOffsetsRef.current.distance + (input.leftTrigger - input.rightTrigger) * dt * 10,
      -6,
      8,
    );

    targetVector.copy(controls.target);
    panTarget(
      targetVector,
      camera,
      lockOffsetsRef.current.panX,
      -lockOffsetsRef.current.panY,
    );

    offsetVector.subVectors(camera.position, controls.target);
    spherical.setFromVector3(offsetVector);
    spherical.theta -= lockOffsetsRef.current.yaw;
    spherical.phi = clamp(
      spherical.phi + lockOffsetsRef.current.pitch,
      0.42,
      Math.PI - 0.42,
    );
    spherical.radius = clamp(spherical.radius + lockOffsetsRef.current.distance, 8.5, 42);
    offsetVector.setFromSpherical(spherical);

    camera.position.copy(targetVector).add(offsetVector);
    controls.target.copy(targetVector);
    camera.lookAt(targetVector);
    controls.update();
  }, 1);

  return null;
}
