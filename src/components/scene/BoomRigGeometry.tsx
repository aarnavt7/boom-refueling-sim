"use client";

import type { ReactNode } from "react";

export type BoomRigGeometryProps = {
  yaw: number;
  pitch: number;
  extend: number;
  /** Mounted inside the pitch joint (e.g. sensor camera group) */
  children?: ReactNode;
};

/**
 * Presentational boom meshes only — kept in sync with the live sim rig ([`BoomRig`](./BoomRig.tsx)).
 */
export function BoomRigGeometry({ yaw, pitch, extend, children }: BoomRigGeometryProps) {
  const mainLength = Math.max(extend - 0.9, 4.1);
  const mainCenter = mainLength / 2;
  const tipLength = 0.82;
  const tipCenter = mainLength + tipLength / 2 - 0.04;
  const finZ = Math.max(mainLength - 1.1, 2.8);
  const stripeZ = mainLength + 0.18;

  return (
    <>
      <mesh
        castShadow
        receiveShadow
        position={[0, 0.03, 0.18]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.26, 0.34, 0.72, 32]} />
        <meshPhysicalMaterial
          color="#617182"
          metalness={0.42}
          roughness={0.46}
          clearcoat={0.08}
          clearcoatRoughness={0.4}
          envMapIntensity={0.58}
        />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.08, 0.44]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.9]} />
        <meshPhysicalMaterial
          color="#708292"
          metalness={0.26}
          roughness={0.56}
          envMapIntensity={0.46}
        />
      </mesh>

      <group rotation={[0, yaw, 0]}>
        <group rotation={[pitch, 0, 0]}>
          <mesh
            castShadow
            receiveShadow
            position={[0, -0.01, mainCenter]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.085, 0.15, mainLength, 36]} />
            <meshPhysicalMaterial
              color="#8b9aa6"
              metalness={0.36}
              roughness={0.4}
              clearcoat={0.12}
              clearcoatRoughness={0.34}
              envMapIntensity={0.62}
            />
          </mesh>

          <mesh
            castShadow
            receiveShadow
            position={[0, -0.03, tipCenter]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.042, 0.07, tipLength, 28]} />
            <meshPhysicalMaterial
              color="#c7d2d8"
              metalness={0.22}
              roughness={0.26}
              clearcoat={0.4}
              clearcoatRoughness={0.22}
              envMapIntensity={0.72}
            />
          </mesh>

          <mesh castShadow receiveShadow position={[0, -0.05, finZ]} rotation={[0, 0, Math.PI / 12]}>
            <boxGeometry args={[0.8, 0.028, 0.34]} />
            <meshPhysicalMaterial
              color="#738390"
              metalness={0.28}
              roughness={0.52}
              envMapIntensity={0.42}
            />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.05, finZ]} rotation={[0, 0, -Math.PI / 12]}>
            <boxGeometry args={[0.8, 0.028, 0.34]} />
            <meshPhysicalMaterial
              color="#738390"
              metalness={0.28}
              roughness={0.52}
              envMapIntensity={0.42}
            />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[0.18, -0.13, finZ - 0.12]}
            rotation={[0.32, 0, 0]}
          >
            <boxGeometry args={[0.06, 0.22, 0.34]} />
            <meshPhysicalMaterial
              color="#6d7f8d"
              metalness={0.24}
              roughness={0.54}
              envMapIntensity={0.4}
            />
          </mesh>
          <mesh
            castShadow
            receiveShadow
            position={[-0.18, -0.13, finZ - 0.12]}
            rotation={[0.32, 0, 0]}
          >
            <boxGeometry args={[0.06, 0.22, 0.34]} />
            <meshPhysicalMaterial
              color="#6d7f8d"
              metalness={0.24}
              roughness={0.54}
              envMapIntensity={0.4}
            />
          </mesh>

          <mesh castShadow receiveShadow position={[0, -0.03, stripeZ]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.058, 0.09, 24]} />
            <meshPhysicalMaterial color="#3dd496" metalness={0.18} roughness={0.34} envMapIntensity={0.55} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.03, stripeZ + 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.056, 0.09, 24]} />
            <meshPhysicalMaterial color="#e9c64a" metalness={0.16} roughness={0.3} envMapIntensity={0.55} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.03, stripeZ + 0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.046, 0.052, 0.09, 24]} />
            <meshPhysicalMaterial color="#d96a35" metalness={0.16} roughness={0.28} envMapIntensity={0.58} />
          </mesh>

          <mesh castShadow receiveShadow position={[0, -0.035, mainLength + 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.06, 0.28, 24]} />
            <meshPhysicalMaterial
              color="#d9e3e8"
              metalness={0.16}
              roughness={0.24}
              clearcoat={0.34}
              clearcoatRoughness={0.18}
              envMapIntensity={0.68}
            />
          </mesh>

          <mesh castShadow receiveShadow position={[0, -0.035, mainLength + 0.68]}>
            <sphereGeometry args={[0.065, 22, 22]} />
            <meshPhysicalMaterial
              color="#eef4f7"
              metalness={0.08}
              roughness={0.22}
              clearcoat={0.48}
              clearcoatRoughness={0.18}
              envMapIntensity={0.52}
            />
          </mesh>

          {children}
        </group>
      </group>
    </>
  );
}
