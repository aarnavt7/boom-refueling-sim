import * as THREE from "three";

import { addVec3, clamp, harmonicNoise, lengthVec3 } from "@/lib/sim/math";
import type { PerceptionEstimate, ScenarioPreset, Vec3 } from "@/lib/sim/types";

type PerceptionInput = {
  camera: THREE.Camera;
  targetWorld: Vec3;
  scenario: ScenarioPreset;
  simTime: number;
};

export function runGeometryPerception({
  camera,
  targetWorld,
  scenario,
  simTime,
}: PerceptionInput): PerceptionEstimate {
  const target = new THREE.Vector3(targetWorld.x, targetWorld.y, targetWorld.z);
  const projected = target.clone().project(camera);
  const cameraSpace = target.clone().applyMatrix4(camera.matrixWorldInverse);

  const visible =
    cameraSpace.z < 0 &&
    projected.z >= -1 &&
    projected.z <= 1 &&
    Math.abs(projected.x) <= 1 &&
    Math.abs(projected.y) <= 1;

  const dropoutSignal = (harmonicNoise(simTime * 1.2, 7.4) + 1) * 0.5;
  const dropout = visible && dropoutSignal < scenario.perception.dropoutProbability;

  if (!visible || dropout) {
    return {
      visible,
      dropout,
      confidence: 0,
      estimatedPosition: null,
      imagePoint: visible ? { x: projected.x, y: projected.y } : null,
      cameraSpacePosition: visible
        ? { x: cameraSpace.x, y: cameraSpace.y, z: cameraSpace.z }
        : null,
    };
  }

  const noise = {
    x: harmonicNoise(simTime * 1.4, 1.3) * scenario.perception.positionNoise,
    y: harmonicNoise(simTime * 1.7, 2.1) * scenario.perception.positionNoise,
    z: harmonicNoise(simTime * 1.1, 3.6) * scenario.perception.positionNoise * 0.55,
  };

  const estimatedPosition = addVec3(targetWorld, noise);
  const edgePenalty = Math.max(Math.abs(projected.x), Math.abs(projected.y));
  const noisePenalty = lengthVec3(noise) / Math.max(scenario.perception.positionNoise * 2.8, 0.01);

  return {
    visible: true,
    dropout: false,
    confidence: clamp(
      1 - edgePenalty * 0.35 - noisePenalty * 0.18,
      scenario.perception.confidenceFloor,
      0.98,
    ),
    estimatedPosition,
    imagePoint: {
      x: projected.x + harmonicNoise(simTime * 1.9, 8.2) * scenario.perception.pixelNoise,
      y: projected.y + harmonicNoise(simTime * 2.2, 9.4) * scenario.perception.pixelNoise,
    },
    cameraSpacePosition: {
      x: cameraSpace.x,
      y: cameraSpace.y,
      z: cameraSpace.z,
    },
  };
}
