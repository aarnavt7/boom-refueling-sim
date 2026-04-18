"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

import { getBoomTipPose } from "@/lib/sim/kinematics";
import { getDisplayedState } from "@/lib/sim/replay";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export function DebugHelpers() {
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);
  const showDebug = useUiStore((state) => state.showDebug);

  const displayed = useMemo(
    () => getDisplayedState(live, replaySamples, replayMode, replayIndex),
    [live, replaySamples, replayMode, replayIndex],
  );

  if (!showDebug) {
    return null;
  }

  const boomTip = getBoomTipPose(displayed.boom).position;

  return (
    <group>
      <axesHelper args={[2.5]} />
      <gridHelper args={[60, 60, "#2a4a5c", "#152535"]} position={[0, -2.2, 18]} />
      <Line
        points={[
          [boomTip.x, boomTip.y, boomTip.z],
          [displayed.targetPose.position.x, displayed.targetPose.position.y, displayed.targetPose.position.z],
        ]}
        color="#5a8a7a"
        lineWidth={1}
        transparent
        opacity={0.38}
        depthWrite={false}
      />
      <mesh
        position={[
          displayed.targetPose.position.x,
          displayed.targetPose.position.y,
          displayed.targetPose.position.z,
        ]}
      >
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshBasicMaterial color="#5a8a7a" transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  );
}
