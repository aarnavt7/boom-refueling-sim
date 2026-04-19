"use client";

import { AircraftModel } from "@/components/scene/AircraftModel";
import { ReceiverProcedural } from "@/components/scene/procedural/ReceiverProcedural";
import { RECEIVER_VISUAL_CONFIG } from "@/lib/sim/aircraftVisualConfig";
import { useDisplayedReplayBundle } from "@/lib/sim/useDisplayedReplayBundle";

export function Receiver() {
  const displayed = useDisplayedReplayBundle().primary;

  return (
    <group
      position={[
        displayed.receiverPose.position.x,
        displayed.receiverPose.position.y,
        displayed.receiverPose.position.z,
      ]}
      rotation={[
        displayed.receiverPose.rotation.x,
        displayed.receiverPose.rotation.y,
        displayed.receiverPose.rotation.z,
      ]}
    >
      <AircraftModel
        config={RECEIVER_VISUAL_CONFIG}
        fallback={<ReceiverProcedural />}
      />
    </group>
  );
}
