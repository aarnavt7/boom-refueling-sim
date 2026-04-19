"use client";

import type * as THREE from "three";

import { BoomRig } from "@/components/scene/BoomRig";
import { Tanker } from "@/components/scene/Tanker";
import { getBoomMountLocalPosition, getTankerPose } from "@/lib/sim/aircraftAttachments";
import {
  TANKER_ATTACHMENT_CONFIG,
} from "@/lib/sim/aircraftVisualConfig";

type TankerAssemblyProps = {
  sensorCameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
};

function BoomMountFairing() {
  const fairing = TANKER_ATTACHMENT_CONFIG.boomFairing;

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        position={[
          fairing.shroudPosition.x,
          fairing.shroudPosition.y,
          fairing.shroudPosition.z,
        ]}
        rotation={[
          fairing.shroudRotation.x,
          fairing.shroudRotation.y,
          fairing.shroudRotation.z,
        ]}
      >
        <boxGeometry
          args={[
            fairing.shroudScale.x,
            fairing.shroudScale.y,
            fairing.shroudScale.z,
          ]}
        />
        <meshPhysicalMaterial
          color="#788290"
          metalness={0.26}
          roughness={0.38}
          clearcoat={0.26}
          clearcoatRoughness={0.18}
          envMapIntensity={0.94}
        />
      </mesh>

      <mesh
        castShadow
        receiveShadow
        position={[
          fairing.bracePosition.x,
          fairing.bracePosition.y,
          fairing.bracePosition.z,
        ]}
        rotation={[
          fairing.braceRotation.x,
          fairing.braceRotation.y,
          fairing.braceRotation.z,
        ]}
      >
        <boxGeometry
          args={[
            fairing.braceScale.x,
            fairing.braceScale.y,
            fairing.braceScale.z,
          ]}
        />
        <meshPhysicalMaterial
          color="#5f6974"
          metalness={0.54}
          roughness={0.28}
          clearcoat={0.1}
          clearcoatRoughness={0.12}
          envMapIntensity={0.88}
        />
      </mesh>

      <mesh
        castShadow
        receiveShadow
        position={[
          fairing.collarPosition.x,
          fairing.collarPosition.y,
          fairing.collarPosition.z,
        ]}
        rotation={[
          fairing.collarRotation.x,
          fairing.collarRotation.y,
          fairing.collarRotation.z,
        ]}
      >
        <cylinderGeometry
          args={[
            fairing.collarRadiusTop,
            fairing.collarRadiusBottom,
            fairing.collarLength,
            28,
          ]}
        />
        <meshPhysicalMaterial
          color="#b4bcc6"
          metalness={0.78}
          roughness={0.18}
          clearcoat={0.18}
          clearcoatRoughness={0.1}
          envMapIntensity={1.12}
        />
      </mesh>
    </group>
  );
}

export function TankerAssembly({ sensorCameraRef }: TankerAssemblyProps) {
  const tankerPose = getTankerPose();
  const boomRoot = getBoomMountLocalPosition();

  return (
    <group
      position={[
        tankerPose.position.x,
        tankerPose.position.y,
        tankerPose.position.z,
      ]}
      rotation={[
        tankerPose.rotation.x,
        tankerPose.rotation.y,
        tankerPose.rotation.z,
      ]}
    >
      <Tanker />
      <BoomMountFairing />
      <group position={[boomRoot.x, boomRoot.y, boomRoot.z]}>
        <BoomRig sensorCameraRef={sensorCameraRef} />
      </group>
    </group>
  );
}
