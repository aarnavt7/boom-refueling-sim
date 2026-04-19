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
  const nozzleConeCenter = Math.max(extend - 0.16, mainLength + 0.54);
  const nozzleTipCenter = Math.max(extend - 0.065, mainLength + 0.66);

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
          color="#687584"
          metalness={0.34}
          roughness={0.34}
          clearcoat={0.3}
          clearcoatRoughness={0.16}
          envMapIntensity={0.94}
        />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.08, 0.44]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.9]} />
        <meshPhysicalMaterial
          color="#4f5b67"
          metalness={0.52}
          roughness={0.3}
          clearcoat={0.12}
          clearcoatRoughness={0.14}
          envMapIntensity={0.82}
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
              color="#bcc6ce"
              metalness={0.82}
              roughness={0.28}
              clearcoat={0.14}
              clearcoatRoughness={0.1}
              envMapIntensity={1.08}
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
              color="#e8edf0"
              metalness={0.38}
              roughness={0.14}
              clearcoat={0.58}
              clearcoatRoughness={0.08}
              envMapIntensity={1.18}
            />
          </mesh>

          <mesh castShadow receiveShadow position={[0, -0.05, finZ]} rotation={[0, 0, Math.PI / 12]}>
            <boxGeometry args={[0.8, 0.028, 0.34]} />
            <meshPhysicalMaterial
              color="#5f6b76"
              metalness={0.2}
              roughness={0.48}
              clearcoat={0.1}
              clearcoatRoughness={0.2}
              envMapIntensity={0.72}
            />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.05, finZ]} rotation={[0, 0, -Math.PI / 12]}>
            <boxGeometry args={[0.8, 0.028, 0.34]} />
            <meshPhysicalMaterial
              color="#5f6b76"
              metalness={0.2}
              roughness={0.48}
              clearcoat={0.1}
              clearcoatRoughness={0.2}
              envMapIntensity={0.72}
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
              color="#6e7c88"
              metalness={0.28}
              roughness={0.44}
              envMapIntensity={0.68}
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
              color="#6e7c88"
              metalness={0.28}
              roughness={0.44}
              envMapIntensity={0.68}
            />
          </mesh>

          <mesh castShadow receiveShadow position={[0, -0.03, stripeZ]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.058, 0.09, 24]} />
            <meshPhysicalMaterial
              color="#39c98f"
              metalness={0.14}
              roughness={0.24}
              emissive="#0f2f21"
              emissiveIntensity={0.08}
              envMapIntensity={0.72}
            />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.03, stripeZ + 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.056, 0.09, 24]} />
            <meshPhysicalMaterial
              color="#e7be45"
              metalness={0.14}
              roughness={0.22}
              emissive="#3b2608"
              emissiveIntensity={0.05}
              envMapIntensity={0.72}
            />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.03, stripeZ + 0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.046, 0.052, 0.09, 24]} />
            <meshPhysicalMaterial
              color="#d46d39"
              metalness={0.16}
              roughness={0.22}
              emissive="#341207"
              emissiveIntensity={0.05}
              envMapIntensity={0.76}
            />
          </mesh>

          <mesh
            castShadow
            receiveShadow
            position={[0, -0.035, nozzleConeCenter]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <coneGeometry args={[0.06, 0.28, 24]} />
            <meshPhysicalMaterial
              color="#eef3f5"
              metalness={0.28}
              roughness={0.12}
              clearcoat={0.62}
              clearcoatRoughness={0.08}
              envMapIntensity={1.14}
            />
          </mesh>

          <mesh castShadow receiveShadow position={[0, -0.035, nozzleTipCenter]}>
            <sphereGeometry args={[0.065, 22, 22]} />
            <meshPhysicalMaterial
              color="#f4fbff"
              metalness={0.04}
              roughness={0.14}
              clearcoat={0.72}
              clearcoatRoughness={0.08}
              emissive="#10232f"
              emissiveIntensity={0.07}
              envMapIntensity={0.9}
            />
          </mesh>

          {children}
        </group>
      </group>
    </>
  );
}
