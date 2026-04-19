import { JOINT_LIMITS, RATE_LIMITS } from "@/lib/sim/constants";
import { getBoomMountPose } from "@/lib/sim/aircraftAttachments";
import {
  addVec3,
  clamp,
  localOffsetFromWorld,
  rotateVectorByEuler,
  scaleVec3,
} from "@/lib/sim/math";
import type { BoomCommand, BoomJointState, Pose, Vec3 } from "@/lib/sim/types";

export function getBoomBasePose(): Pose {
  return getBoomMountPose();
}

export function getBoomDirection(joints: BoomJointState): Vec3 {
  const base = getBoomBasePose();
  const localDirection = rotateVectorByEuler(
    { x: 0, y: 0, z: 1 },
    {
      x: joints.pitch,
      y: joints.yaw,
      z: 0,
    },
  );

  return rotateVectorByEuler(
    localDirection,
    base.rotation,
  );
}

export function getBoomTipPose(joints: BoomJointState): Pose {
  const base = getBoomBasePose();
  const direction = getBoomDirection(joints);
  return {
    position: addVec3(base.position, scaleVec3(direction, joints.extend)),
    rotation: {
      x: base.rotation.x + joints.pitch,
      y: base.rotation.y + joints.yaw,
      z: base.rotation.z,
    },
  };
}

export function solveBoomIK(targetTip: Vec3): BoomJointState {
  const base = getBoomBasePose();
  const relative = localOffsetFromWorld(base.position, base.rotation, targetTip);

  const extend = clamp(
    Math.hypot(relative.x, relative.y, relative.z),
    JOINT_LIMITS.extend.min,
    JOINT_LIMITS.extend.max,
  );
  const yaw = clamp(
    Math.atan2(relative.x, Math.max(relative.z, 1e-3)),
    JOINT_LIMITS.yaw.min,
    JOINT_LIMITS.yaw.max,
  );
  const pitch = clamp(
    Math.atan2(-relative.y, Math.max(Math.hypot(relative.x, relative.z), 1e-3)),
    JOINT_LIMITS.pitch.min,
    JOINT_LIMITS.pitch.max,
  );

  return {
    yaw,
    pitch,
    extend,
  };
}

export function applyIncrementCommand(
  joints: BoomJointState,
  command: BoomCommand,
  dt: number,
): BoomJointState {
  const yawRate = clamp(command.yawRate, -RATE_LIMITS.yawRate, RATE_LIMITS.yawRate);
  const pitchRate = clamp(command.pitchRate, -RATE_LIMITS.pitchRate, RATE_LIMITS.pitchRate);
  const extendRate = clamp(command.extendRate, -RATE_LIMITS.extendRate, RATE_LIMITS.extendRate);

  return {
    yaw: clamp(joints.yaw + yawRate * dt, JOINT_LIMITS.yaw.min, JOINT_LIMITS.yaw.max),
    pitch: clamp(joints.pitch + pitchRate * dt, JOINT_LIMITS.pitch.min, JOINT_LIMITS.pitch.max),
    extend: clamp(joints.extend + extendRate * dt, JOINT_LIMITS.extend.min, JOINT_LIMITS.extend.max),
  };
}
