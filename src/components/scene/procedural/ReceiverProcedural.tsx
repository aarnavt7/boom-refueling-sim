"use client";

/**
 * Stylized receiver aircraft for boom-docking sim. Silhouette and layout cues loosely
 * follow the F-16 Fighting Falcon family (blended wing root, single vertical tail, nose
 * radome, dorsal receptacle aft) — not a scale-accurate model; for hackathon / demo context.
 */

const hullMat = {
  color: "#aabcc8" as const,
  metalness: 0.22,
  roughness: 0.4,
  clearcoat: 0.18,
  clearcoatRoughness: 0.32,
  envMapIntensity: 0.72,
};

const wingMat = {
  color: "#8fa3b0" as const,
  metalness: 0.2,
  roughness: 0.46,
  clearcoat: 0.1,
  envMapIntensity: 0.62,
};

export function ReceiverProcedural() {
  return (
    <group>
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.52, 5.85, 10, 32]} />
        <meshPhysicalMaterial {...hullMat} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.02, 3.32]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.38, 0.95, 20]} />
        <meshPhysicalMaterial color="#c5d4de" metalness={0.12} roughness={0.32} clearcoat={0.45} envMapIntensity={0.78} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.28, 1.95]} scale={[0.62, 0.34, 0.88]}>
        <sphereGeometry args={[0.38, 20, 16]} />
        <meshPhysicalMaterial
          color="#1a2530"
          metalness={0.08}
          roughness={0.18}
          clearcoat={0.85}
          clearcoatRoughness={0.08}
          envMapIntensity={1.1}
        />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.08, 0.42]}>
        <boxGeometry args={[5.45, 0.1, 1.78]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.52, 0.06, 0.85]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.85, 0.06, 1.15]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.52, 0.06, 0.85]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.85, 0.06, 1.15]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>

      <mesh castShadow receiveShadow position={[0.58, -0.02, 0.95]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[0.22, 0.18, 0.55]} />
        <meshPhysicalMaterial color="#6a7a88" metalness={0.35} roughness={0.42} envMapIntensity={0.5} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.58, -0.02, 0.95]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[0.22, 0.18, 0.55]} />
        <meshPhysicalMaterial color="#6a7a88" metalness={0.35} roughness={0.42} envMapIntensity={0.5} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.12, -0.35]}>
        <boxGeometry args={[0.14, 0.08, 2.1]} />
        <meshPhysicalMaterial color="#7a8894" metalness={0.28} roughness={0.48} envMapIntensity={0.45} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.48, -3.05]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.09, 0.88, 0.62]} />
        <meshPhysicalMaterial color="#8a9aaa" metalness={0.32} roughness={0.4} envMapIntensity={0.55} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.18, -3.22]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[2.2, 0.06, 0.42]} />
        <meshPhysicalMaterial {...wingMat} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.08, -3.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.036, 16, 48]} />
        <meshPhysicalMaterial
          color="#5a8068"
          metalness={0.38}
          roughness={0.3}
          clearcoat={0.5}
          clearcoatRoughness={0.18}
          emissive="#142820"
          emissiveIntensity={0.08}
          envMapIntensity={0.52}
        />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0, -3.32]}>
        <sphereGeometry args={[0.062, 18, 18]} />
        <meshPhysicalMaterial
          color="#e8f2f5"
          metalness={0.06}
          roughness={0.22}
          emissive="#284038"
          emissiveIntensity={0.22}
          envMapIntensity={0.42}
        />
      </mesh>
    </group>
  );
}
