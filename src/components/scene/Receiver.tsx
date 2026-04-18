"use client";

import { useMemo } from "react";

import { AircraftModel } from "@/components/scene/AircraftModel";
import { ReceiverProcedural } from "@/components/scene/procedural/ReceiverProcedural";
import { RECEIVER_VISUAL_CONFIG } from "@/lib/sim/aircraftVisualConfig";
import { getDisplayedState } from "@/lib/sim/replay";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export function Receiver() {
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);

  const displayed = useMemo(
    () => getDisplayedState(live, replaySamples, replayMode, replayIndex),
    [live, replaySamples, replayMode, replayIndex],
  );

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
