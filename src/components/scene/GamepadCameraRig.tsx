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
const baseTargetVector = new THREE.Vector3();
const baseOffsetVector = new THREE.Vector3();

const MANUAL_PAN_SPEED = 4.25;
const MANUAL_ORBIT_SPEED = 0.92;
const MANUAL_ZOOM_SPEED = 10.5;
const LOCK_PAN_SPEED = 2.1;
const LOCK_ORBIT_SPEED = 0.54;
const LOCK_PITCH_SPEED = 0.42;
const LOCK_ZOOM_SPEED = 5.75;
const CAMERA_RESPONSE_POWER = 2.1;
const CAMERA_STICK_EPSILON = 0.035;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shapeStick(value: number, power = CAMERA_RESPONSE_POWER) {
  const magnitude = Math.abs(value);
  if (magnitude <= CAMERA_STICK_EPSILON) {
    return 0;
  }

  return Math.sign(value) * magnitude ** power;
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
  const resetCountRef = useRef(0);

  useFrame((_, delta) => {
    const { input, uiMode, cameraResetCount } = useGamepadStore.getState();
    const dt = Math.min(delta, 0.1);
    const panX = shapeStick(input.leftStick.x, 1.6);
    const panY = shapeStick(input.leftStick.y, 1.6);
    const lookX = shapeStick(input.rightStick.x);
    const lookY = shapeStick(input.rightStick.y);

    if (!controls) {
      return;
    }

    if (cameraResetCount !== resetCountRef.current) {
      resetCountRef.current = cameraResetCount;
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
      const panScale = MANUAL_PAN_SPEED * dt;
      const zoomScale = MANUAL_ZOOM_SPEED * dt;
      const orbitScale = MANUAL_ORBIT_SPEED * dt;

      if (Math.abs(panX) > 0.001 || Math.abs(panY) > 0.001) {
        panTarget(
          targetVector,
          camera,
          panX * panScale,
          -panY * panScale,
        );
      }

      offsetVector.subVectors(camera.position, controls.target);
      spherical.setFromVector3(offsetVector);
      spherical.theta -= lookX * orbitScale;
      spherical.phi = clamp(
        spherical.phi + lookY * orbitScale * 0.72,
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

    baseTargetVector.copy(controls.target);
    baseOffsetVector.subVectors(camera.position, controls.target);
    targetVector.copy(baseTargetVector);

    if (Math.abs(panX) > 0.001 || Math.abs(panY) > 0.001) {
      panTarget(
        targetVector,
        camera,
        panX * LOCK_PAN_SPEED * dt,
        -panY * LOCK_PAN_SPEED * dt,
      );
    }

    spherical.setFromVector3(baseOffsetVector);
    spherical.theta -= lookX * LOCK_ORBIT_SPEED * dt;
    spherical.phi = clamp(
      spherical.phi + lookY * LOCK_PITCH_SPEED * dt,
      0.42,
      Math.PI - 0.42,
    );
    spherical.radius = clamp(
      spherical.radius + (input.leftTrigger - input.rightTrigger) * LOCK_ZOOM_SPEED * dt,
      8.5,
      42,
    );
    offsetVector.setFromSpherical(spherical);

    camera.position.copy(targetVector).add(offsetVector);
    controls.target.copy(targetVector);
    camera.lookAt(targetVector);
    controls.update();
  }, 1);

  return null;
}
