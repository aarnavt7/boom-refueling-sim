"use client";

import type * as THREE from "three";

import { BoomRig } from "@/components/scene/BoomRig";
import { Tanker } from "@/components/scene/Tanker";
import { getBoomMountLocalPosition, getTankerPose } from "@/lib/sim/aircraftAttachments";
import {
  TANKER_ATTACHMENT_CONFIG,
} from "@/lib/sim/aircraftVisualConfig";
import type { BoomJointState, SensorMountId } from "@/lib/sim/types";

type TankerAssemblyProps = {
  sensorCameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  sensorViewportSensorId: SensorMountId;
  boom: BoomJointState;
};

function BoomMountFairing() {
  const fairing = TANKER_ATTACHMENT_CONFIG.boomFairing;
  const braceHalfWidth = fairing.shroudScale.x * 0.18;

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
        scale={[
          fairing.shroudScale.x,
          fairing.shroudScale.y,
          fairing.shroudScale.z,
        ]}
      >
        <sphereGeometry args={[0.5, 30, 24]} />
        <meshPhysicalMaterial
          color="#7d8896"
          metalness={0.32}
          roughness={0.34}
          clearcoat={0.3}
          clearcoatRoughness={0.14}
          envMapIntensity={0.96}
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
        <capsuleGeometry
          args={[
            fairing.braceScale.x,
            Math.max(fairing.braceScale.y - fairing.braceScale.x * 2, 0.12),
            10,
            18,
          ]}
        />
        <meshPhysicalMaterial
          color="#66727d"
          metalness={0.48}
          roughness={0.3}
          clearcoat={0.12}
          clearcoatRoughness={0.12}
          envMapIntensity={0.88}
        />
      </mesh>

      {[-1, 1].map((side) => (
        <mesh
          key={side}
          castShadow
          receiveShadow
          position={[
            fairing.bracePosition.x + braceHalfWidth * side,
            fairing.bracePosition.y + 0.02,
            fairing.bracePosition.z - 0.05,
          ]}
          rotation={[
            fairing.braceRotation.x - 0.08,
            0,
            side * 0.22,
          ]}
        >
          <boxGeometry
            args={[
              fairing.braceScale.z,
              fairing.braceScale.y * 0.88,
              fairing.braceScale.x * 1.8,
            ]}
          />
          <meshPhysicalMaterial
            color="#5d6771"
            metalness={0.42}
            roughness={0.34}
            clearcoat={0.08}
            clearcoatRoughness={0.16}
            envMapIntensity={0.76}
          />
        </mesh>
      ))}

      <mesh
        castShadow
        receiveShadow
        position={[
          fairing.collarPosition.x,
          fairing.collarPosition.y + 0.09,
          fairing.collarPosition.z - 0.18,
        ]}
        rotation={[0.16, 0, 0]}
        scale={[1.02, 0.56, 1.18]}
      >
        <sphereGeometry args={[0.32, 28, 20]} />
        <meshPhysicalMaterial
          color="#5e6975"
          metalness={0.36}
          roughness={0.34}
          clearcoat={0.16}
          clearcoatRoughness={0.14}
          envMapIntensity={0.86}
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

      <mesh
        castShadow
        receiveShadow
        position={[
          fairing.collarPosition.x,
          fairing.collarPosition.y + 0.03,
          fairing.collarPosition.z + 0.08,
        ]}
        rotation={[0.08, 0, 0]}
      >
        <cylinderGeometry args={[0.1, 0.15, 0.34, 22]} />
        <meshPhysicalMaterial
          color="#d3dae1"
          metalness={0.68}
          roughness={0.18}
          clearcoat={0.24}
          clearcoatRoughness={0.1}
          envMapIntensity={1}
        />
      </mesh>
    </group>
  );
}

export function TankerAssembly({
  sensorCameraRef,
  sensorViewportSensorId,
  boom,
}: TankerAssemblyProps) {
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
        <BoomRig
          sensorCameraRef={sensorCameraRef}
          sensorMountId={sensorViewportSensorId}
          boom={boom}
        />
      </group>
    </group>
  );
}
