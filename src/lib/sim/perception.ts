import * as THREE from "three";

import { SENSOR_RIGS } from "@/lib/sim/constants";
import { getBoomBasePose, getBoomTipPose } from "@/lib/sim/kinematics";
import {
  addVec3,
  clamp,
  harmonicNoise,
  lengthVec3,
  worldFromLocalOffset,
} from "@/lib/sim/math";
import type {
  BoomJointState,
  PerceptionEstimate,
  Pose,
  ScenarioPreset,
  SensorMountId,
  SensorModality,
  SensorObservation,
  SensorRigDefinition,
  SensorRole,
} from "@/lib/sim/types";

type PassivePerceptionInput = {
  boom: BoomJointState;
  targetPose: Pose;
  scenario: ScenarioPreset;
  simTime: number;
};

export type PassivePerceptionResult = {
  observations: SensorObservation[];
  estimate: PerceptionEstimate;
  primarySensorId: SensorMountId;
  primarySensorPose: Pose;
  preferredRole: SensorRole;
};

const scratchCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);

export function getSensorRigById(sensorId: SensorMountId) {
  return SENSOR_RIGS.find((sensor) => sensor.id === sensorId) ?? SENSOR_RIGS[0];
}

export function getSensorPose(sensor: SensorRigDefinition, boom: BoomJointState): Pose {
  const parentPose = sensor.role === "acquire" ? getBoomBasePose() : getBoomTipPose(boom);

  return {
    position: worldFromLocalOffset(parentPose.position, parentPose.rotation, sensor.localOffset),
    rotation: {
      x: parentPose.rotation.x + sensor.localRotation.x,
      y: parentPose.rotation.y + sensor.localRotation.y,
      z: parentPose.rotation.z + sensor.localRotation.z,
    },
  };
}

export function runPassivePerception({
  boom,
  targetPose,
  scenario,
  simTime,
}: PassivePerceptionInput): PassivePerceptionResult {
  const observations = SENSOR_RIGS.map((sensor, index) =>
    simulateSensorObservation({
      sensor,
      sensorPose: getSensorPose(sensor, boom),
      targetPose,
      scenario,
      simTime,
      seed: index + 1,
    }),
  );

  const preferredRole = choosePreferredRole(observations, scenario);
  const eligible = observations.filter(
    (observation) =>
      observation.visible &&
      observation.confidence > 0.18 &&
      (observation.role === preferredRole ||
        (preferredRole === "terminal" &&
          observation.role === "acquire" &&
          observation.range < scenario.sensorPolicy.reacquireRange)),
  );
  const selected = eligible.length > 0 ? eligible : observations.filter((observation) => observation.visible);

  const primary = [...selected].sort((left, right) => right.confidence - left.confidence)[0] ?? observations[0];
  const primarySensorPose = getSensorPose(getSensorRigById(primary.sensorId), boom);

  return {
    observations: observations.map((observation) => ({
      ...observation,
      usedForTrack: selected.some((candidate) => candidate.sensorId === observation.sensorId),
    })),
    estimate: {
      ...primary,
      usedForTrack: true,
    },
    primarySensorId: primary.sensorId,
    primarySensorPose,
    preferredRole,
  };
}

function choosePreferredRole(
  observations: SensorObservation[],
  scenario: ScenarioPreset,
): SensorRole {
  const terminal = observations.filter(
    (observation) =>
      observation.role === "terminal" &&
      observation.visible &&
      observation.confidence > 0.32 &&
      observation.range < scenario.sensorPolicy.terminalHandoffRange,
  );

  return terminal.length > 0 ? "terminal" : "acquire";
}

type SimulateInput = {
  sensor: SensorRigDefinition;
  sensorPose: Pose;
  targetPose: Pose;
  scenario: ScenarioPreset;
  simTime: number;
  seed: number;
};

function simulateSensorObservation({
  sensor,
  sensorPose,
  targetPose,
  scenario,
  simTime,
  seed,
}: SimulateInput): SensorObservation {
  const modality = selectModality(sensor, scenario);
  const camera = scratchCamera;
  camera.fov = sensor.fovDeg;
  camera.aspect = sensor.aspect;
  camera.near = sensor.near;
  camera.far = sensor.far;
  camera.position.set(sensorPose.position.x, sensorPose.position.y, sensorPose.position.z);
  camera.rotation.set(
    sensorPose.rotation.x,
    sensorPose.rotation.y + Math.PI,
    sensorPose.rotation.z,
    "XYZ",
  );
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  const target = new THREE.Vector3(
    targetPose.position.x,
    targetPose.position.y,
    targetPose.position.z,
  );
  const projected = target.clone().project(camera);
  const cameraSpace = target.clone().applyMatrix4(camera.matrixWorldInverse);
  const range = lengthVec3({
    x: targetPose.position.x - sensorPose.position.x,
    y: targetPose.position.y - sensorPose.position.y,
    z: targetPose.position.z - sensorPose.position.z,
  });
  const visible =
    cameraSpace.z < 0 &&
    projected.z >= -1 &&
    projected.z <= 1 &&
    Math.abs(projected.x) <= 1 &&
    Math.abs(projected.y) <= 1 &&
    range <= sensor.maxRange;

  const dropoutBias =
    scenario.perception.dropoutProbability +
    (modality === "visible" ? 1 - scenario.environment.visibleSNR : 1 - scenario.environment.thermalContrast) * 0.06 +
    scenario.environment.horizonAmbiguity * 0.06 +
    scenario.environment.glint * (modality === "visible" ? 0.08 : 0.02);
  const dropoutSignal = (harmonicNoise(simTime * (1.1 + seed * 0.1), 7.4 + seed) + 1) * 0.5;
  const dropout = visible && dropoutSignal < dropoutBias;

  if (!visible || dropout) {
    return {
      sensorId: sensor.id,
      sensorName: sensor.name,
      role: sensor.role,
      modality,
      visible,
      dropout,
      confidence: 0,
      estimatedPosition: null,
      estimatedPose: null,
      imagePoint: visible ? { x: projected.x, y: projected.y } : null,
      cameraSpacePosition: visible
        ? { x: cameraSpace.x, y: cameraSpace.y, z: cameraSpace.z }
        : null,
      range,
      usedForTrack: false,
      notes: observationNotes(modality, scenario),
    };
  }

  const noiseScale = getPositionNoiseScale(sensor, modality, scenario, range);
  const noise = {
    x: harmonicNoise(simTime * 1.37, 1.2 + seed) * noiseScale,
    y: harmonicNoise(simTime * 1.61, 2.6 + seed) * noiseScale,
    z: harmonicNoise(simTime * 1.09, 3.7 + seed) * noiseScale * 0.65,
  };
  const estimatedPosition = addVec3(targetPose.position, noise);
  const edgePenalty = Math.max(Math.abs(projected.x), Math.abs(projected.y));
  const rangePenalty = range / Math.max(sensor.maxRange, 1);
  const modalityQuality =
    modality === "visible"
      ? scenario.environment.visibleSNR * (1 - scenario.environment.glint * 0.28)
      : scenario.environment.thermalContrast * (scenario.environment.timeOfDay === "night" ? 1 : 0.88);
  const noisePenalty = lengthVec3(noise) / Math.max(noiseScale * 2.8, 0.01);
  const confidence = clamp(
    modalityQuality +
      (sensor.role === "terminal" ? 0.12 : 0.04) -
      edgePenalty * 0.28 -
      rangePenalty * 0.32 -
      scenario.environment.horizonAmbiguity * 0.14 -
      noisePenalty * 0.16,
    scenario.perception.confidenceFloor,
    0.99,
  );

  return {
    sensorId: sensor.id,
    sensorName: sensor.name,
    role: sensor.role,
    modality,
    visible: true,
    dropout: false,
    confidence,
    estimatedPosition,
    estimatedPose: {
      position: estimatedPosition,
      rotation: {
        x: targetPose.rotation.x + harmonicNoise(simTime * 1.17, 4 + seed) * 0.01,
        y: targetPose.rotation.y + harmonicNoise(simTime * 1.21, 5 + seed) * 0.01,
        z: targetPose.rotation.z + harmonicNoise(simTime * 1.29, 6 + seed) * 0.008,
      },
    },
    imagePoint: {
      x: projected.x + harmonicNoise(simTime * 1.9, 8.2 + seed) * scenario.perception.pixelNoise,
      y: projected.y + harmonicNoise(simTime * 2.2, 9.4 + seed) * scenario.perception.pixelNoise,
    },
    cameraSpacePosition: {
      x: cameraSpace.x,
      y: cameraSpace.y,
      z: cameraSpace.z,
    },
    range,
    usedForTrack: false,
    notes: observationNotes(modality, scenario),
  };
}

function selectModality(
  sensor: SensorRigDefinition,
  scenario: ScenarioPreset,
): SensorModality {
  if (scenario.environment.timeOfDay === "night") {
    return "thermal";
  }

  if (scenario.environment.surfaceType === "water" && sensor.role === "terminal") {
    return "thermal";
  }

  return "visible";
}

function getPositionNoiseScale(
  sensor: SensorRigDefinition,
  modality: SensorModality,
  scenario: ScenarioPreset,
  range: number,
) {
  const modalityFactor = modality === "thermal" ? 1.12 : 1;
  const roleFactor = sensor.role === "terminal" ? 0.82 : 1;
  const rangeFactor = 1 + (range / Math.max(sensor.maxRange, 1)) * 0.6;

  return scenario.perception.positionNoise * modalityFactor * roleFactor * rangeFactor;
}

function observationNotes(
  modality: SensorModality,
  scenario: ScenarioPreset,
) {
  const notes = [modality === "thermal" ? "thermal-primary" : "visible-primary"];

  if (scenario.environment.emissionMode === "EMCON") {
    notes.push("emcon-passive-only");
  }
  if (scenario.environment.surfaceType === "water") {
    notes.push("water-background");
  }
  if (scenario.environment.timeOfDay === "night") {
    notes.push("night-ops");
  }

  return notes;
}
