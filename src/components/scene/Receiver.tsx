"use client";

import * as THREE from "three";

import { AircraftModel } from "@/components/scene/AircraftModel";
import { ReceiverProcedural } from "@/components/scene/procedural/ReceiverProcedural";
import { getReceiverReceptacleLocal } from "@/lib/sim/aircraftAttachments";
import { RECEIVER_VISUAL_CONFIG } from "@/lib/sim/aircraftVisualConfig";
import { useDisplayedReplayBundle } from "@/lib/sim/useDisplayedReplayBundle";

export function Receiver() {
  const displayed = useDisplayedReplayBundle().primary;
  const receptacle = getReceiverReceptacleLocal();
  const isLateStage =
    displayed.controllerState === "ALIGN" ||
    displayed.controllerState === "INSERT" ||
    displayed.controllerState === "MATED";
  const isLocked = displayed.controllerState === "MATED";
  const glowColor = isLocked ? "#7ef0ff" : isLateStage ? "#ffd36f" : "#7cc7ff";
  const guideOpacity = isLocked ? 0.82 : isLateStage ? 0.56 : 0.24;
  const tunnelLength = isLocked ? 0.6 : 0.44;

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
      <group position={[receptacle.x, receptacle.y, receptacle.z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.092, 0.108, 0.2, 28, 1, true]} />
          <meshPhysicalMaterial
            color="#1e2e3d"
            metalness={0.86}
            roughness={0.34}
            envMapIntensity={0.9}
            clearcoat={0.32}
            clearcoatRoughness={0.16}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.12]}>
          <cylinderGeometry args={[0.12, 0.15, tunnelLength, 28, 1, true]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={guideOpacity * 0.24}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <torusGeometry args={[0.124, 0.018, 18, 36]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={guideOpacity}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0, -0.16]}>
          <sphereGeometry args={[0.055, 18, 18]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={guideOpacity * 0.4}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
