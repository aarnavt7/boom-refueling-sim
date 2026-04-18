import { BOOM_BASE_POSITION, JOINT_LIMITS, RATE_LIMITS } from "@/lib/sim/constants";
import { addVec3, clamp, rotateVectorByEuler, scaleVec3, vec3 } from "@/lib/sim/math";
import type { BoomCommand, BoomJointState, Pose, Vec3 } from "@/lib/sim/types";

export function getBoomBasePose(): Pose {
  return {
    position: BOOM_BASE_POSITION,
    rotation: vec3(),
  };
}

export function getBoomDirection(joints: BoomJointState): Vec3 {
  return rotateVectorByEuler(
    { x: 0, y: 0, z: 1 },
    {
      x: joints.pitch,
      y: joints.yaw,
      z: 0,
    },
  );
}

export function getBoomTipPose(joints: BoomJointState): Pose {
  const direction = getBoomDirection(joints);
  return {
    position: addVec3(BOOM_BASE_POSITION, scaleVec3(direction, joints.extend)),
    rotation: { x: joints.pitch, y: joints.yaw, z: 0 },
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
