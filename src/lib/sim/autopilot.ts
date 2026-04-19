import { EMPTY_COMMAND } from "@/lib/sim/constants";
import { applyIncrementCommand, getBoomTipPose, solveBoomIK } from "@/lib/sim/kinematics";
import {
  lengthVec3,
  localOffsetFromWorld,
  rotateVectorByEuler,
  vec3,
} from "@/lib/sim/math";
import type {
  AutopilotCommandECEF,
  BoomCommand,
  BoomJointState,
  DesiredTipMotion,
  Pose,
  Vec3,
} from "@/lib/sim/types";

const MAX_ECEF_STEP_METERS = 0.08;

export function tankerBodyToEcef(deltaBody: Vec3, tankerPose: Pose): Vec3 {
  return rotateVectorByEuler(deltaBody, tankerPose.rotation);
}

export function ecefToTankerBody(deltaEcef: Vec3, tankerPose: Pose): Vec3 {
  return localOffsetFromWorld(vec3(), tankerPose.rotation, deltaEcef);
}

export function toAutopilotCommandECEF(
  desiredTipMotion: DesiredTipMotion,
  tankerPose: Pose,
): AutopilotCommandECEF {
  const ecef = tankerBodyToEcef(desiredTipMotion.deltaBody, tankerPose);
  const magnitude = lengthVec3(ecef);
  const clampScale = magnitude > MAX_ECEF_STEP_METERS ? MAX_ECEF_STEP_METERS / magnitude : 1;
  const clamped = clampScale < 0.999;

  return {
    dx: ecef.x * clampScale,
    dy: ecef.y * clampScale,
    dz: ecef.z * clampScale,
    magnitude: magnitude * clampScale,
    clamped,
    mode: desiredTipMotion.mode,
  };
}

export function applyAutopilotCommand(
  boom: BoomJointState,
  autopilotCommand: AutopilotCommandECEF,
  tankerPose: Pose,
  dt: number,
) {
  const currentTip = getBoomTipPose(boom).position;
  const desiredTipWorld = {
    x: currentTip.x + autopilotCommand.dx,
    y: currentTip.y + autopilotCommand.dy,
    z: currentTip.z + autopilotCommand.dz,
  };
  const desiredJoints = solveBoomIK(desiredTipWorld);
  const rawPlantCommand: BoomCommand = {
    yawRate: (desiredJoints.yaw - boom.yaw) / Math.max(dt, 1e-3),
    pitchRate: (desiredJoints.pitch - boom.pitch) / Math.max(dt, 1e-3),
    extendRate: (desiredJoints.extend - boom.extend) / Math.max(dt, 1e-3),
  };
  const nextBoom = applyIncrementCommand(boom, rawPlantCommand, dt);

  return {
    nextBoom,
    command: {
      yawRate: (nextBoom.yaw - boom.yaw) / Math.max(dt, 1e-3),
      pitchRate: (nextBoom.pitch - boom.pitch) / Math.max(dt, 1e-3),
      extendRate: (nextBoom.extend - boom.extend) / Math.max(dt, 1e-3),
    } satisfies BoomCommand,
    desiredTipWorld,
    bodyCommand: ecefToTankerBody(
      {
        x: autopilotCommand.dx,
        y: autopilotCommand.dy,
        z: autopilotCommand.dz,
      },
      tankerPose,
    ),
  };
}

export function formatMoveECEF(command: AutopilotCommandECEF) {
  return `moveECEF(${(command.dx * 100).toFixed(1)}, ${(command.dy * 100).toFixed(1)}, ${(command.dz * 100).toFixed(1)}) cm`;
}

export function emptyPlantCommand() {
  return EMPTY_COMMAND;
}
