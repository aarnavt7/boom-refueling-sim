"use client";

/**
 * Stylized tanker / boom platform for AAR sim. Massing cues loosely follow the KC-135
 * Stratotanker (swept low wing, cylindrical boom well aft, T-style tail volume) —
 * simplified kitbash, not a Boeing-licensed model.
 */

const fuse = {
  color: "#8aa0b0" as const,
  metalness: 0.4,
  roughness: 0.36,
  clearcoat: 0.14,
  clearcoatRoughness: 0.38,
  envMapIntensity: 0.8,
};

const wing = {
  color: "#7a92a4" as const,
  metalness: 0.26,
  roughness: 0.44,
  clearcoat: 0.1,
  envMapIntensity: 0.68,
};

export function TankerProcedural() {
  return (
    <group position={[0, 0, 0]}>
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
        <capsuleGeometry args={[0.7, 7.9, 10, 32]} />
        <meshPhysicalMaterial {...fuse} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.06, 0.15]} rotation={[0, -0.42, 0]}>
        <boxGeometry args={[4.6, 0.11, 1.95]} />
        <meshPhysicalMaterial {...wing} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.06, 0.15]} rotation={[0, 0.42, 0]}>
        <boxGeometry args={[4.6, 0.11, 1.95]} />
        <meshPhysicalMaterial {...wing} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.38, -2.55]} rotation={[0.06, 0, 0]}>
        <boxGeometry args={[2.45, 0.09, 1.65]} />
        <meshPhysicalMaterial color="#8ca2b2" metalness={0.22} roughness={0.42} envMapIntensity={0.62} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.82, 6.75]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.32, 1.35, 22]} />
        <meshPhysicalMaterial color="#c8dce8" metalness={0.14} roughness={0.34} clearcoat={0.32} envMapIntensity={0.88} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, -0.08, -2.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.24, 1.85, 28]} />
        <meshPhysicalMaterial
          color="#5e7a8c"
          metalness={0.52}
          roughness={0.26}
          emissive="#0a1218"
          emissiveIntensity={0.12}
          envMapIntensity={0.72}
        />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.52, -4.95]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.11, 1.05, 0.78]} />
        <meshPhysicalMaterial color="#778899" metalness={0.34} roughness={0.42} envMapIntensity={0.52} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.22, -5.05]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[2.4, 0.07, 0.38]} />
        <meshPhysicalMaterial {...wing} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.95, 0.04, -1.2]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[0.45, 0.12, 0.85]} />
        <meshPhysicalMaterial color="#6a7c8a" metalness={0.3} roughness={0.48} envMapIntensity={0.48} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.95, 0.04, -1.2]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.45, 0.12, 0.85]} />
        <meshPhysicalMaterial color="#6a7c8a" metalness={0.3} roughness={0.48} envMapIntensity={0.48} />
      </mesh>
    </group>
  );
}
