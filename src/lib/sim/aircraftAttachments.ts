import {
  RECEIVER_ATTACHMENT_CONFIG,
  TANKER_ATTACHMENT_CONFIG,
} from "@/lib/sim/aircraftVisualConfig";
import {
  worldFromLocalOffset,
} from "@/lib/sim/math";
import type { BoomJointState, Pose, Vec3 } from "@/lib/sim/types";

export function getTankerPose(): Pose {
  return TANKER_ATTACHMENT_CONFIG.pose;
}

export function getBoomMountLocalPosition(): Vec3 {
  return TANKER_ATTACHMENT_CONFIG.boomRootLocal;
}

export function getBoomMountPose(): Pose {
  const tankerPose = getTankerPose();
  return {
    position: worldFromLocalOffset(
      tankerPose.position,
      tankerPose.rotation,
      TANKER_ATTACHMENT_CONFIG.boomRootLocal,
    ),
    rotation: tankerPose.rotation,
  };
}

export function getBoomSensorLocalPosition(extend: BoomJointState["extend"]): Vec3 {
  const rig = TANKER_ATTACHMENT_CONFIG.boomSensorRig;
  return {
    x: rig.x,
    y: rig.y,
    z: Math.max(extend + rig.zTipOffset, rig.zMin),
  };
}

export function getReceiverReceptacleLocal(): Vec3 {
  return RECEIVER_ATTACHMENT_CONFIG.receptacleLocal;
}

export function getReceiverReceptacleWorld(receiverPose: Pose): Vec3 {
  return worldFromLocalOffset(
    receiverPose.position,
    receiverPose.rotation,
    RECEIVER_ATTACHMENT_CONFIG.receptacleLocal,
  );
}
