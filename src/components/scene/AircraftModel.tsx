"use client";

import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  Component,
  Suspense,
  type ErrorInfo,
  type ReactNode,
  useMemo,
} from "react";
import * as THREE from "three";

import {
  RECEIVER_VISUAL_CONFIG,
  TANKER_VISUAL_CONFIG,
  type AircraftVisualConfig,
} from "@/lib/sim/aircraftVisualConfig";

type AircraftModelProps = {
  config: AircraftVisualConfig;
  fallback: ReactNode;
};

type MaterialRole = "base" | "accent" | "dark" | "interior" | "canopy";

type MaterialLike = THREE.Material & {
  alphaMap?: THREE.Texture | null;
  aoMap?: THREE.Texture | null;
  color?: THREE.Color;
  emissive?: THREE.Color;
  emissiveMap?: THREE.Texture | null;
  emissiveIntensity?: number;
  envMapIntensity?: number;
  ior?: number;
  map?: THREE.Texture | null;
  metalness?: number;
  metalnessMap?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  normalScale?: THREE.Vector2;
  opacity?: number;
  roughness?: number;
  roughnessMap?: THREE.Texture | null;
  transmission?: number;
  thickness?: number;
  transparent?: boolean;
  clearcoat?: number;
  clearcoatRoughness?: number;
  depthWrite?: boolean;
  toneMapped?: boolean;
};

const COLOR_TEXTURE_KEYS = ["map", "emissiveMap"] as const;
const DATA_TEXTURE_KEYS = ["normalMap", "roughnessMap", "metalnessMap", "aoMap", "alphaMap"] as const;

function matchesName(label: string, tokens: string[]) {
  return tokens.some((token) => label.includes(token));
}

function getTexture(material: MaterialLike, key: keyof MaterialLike) {
  const value = material[key];
  return value instanceof THREE.Texture ? value : null;
}

function applyTextureHints(material: MaterialLike, anisotropy: number) {
  for (const key of COLOR_TEXTURE_KEYS) {
    const texture = getTexture(material, key);
    if (!texture) continue;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
  }

  for (const key of DATA_TEXTURE_KEYS) {
    const texture = getTexture(material, key);
    if (!texture) continue;
    texture.anisotropy = anisotropy;
  }
}

function classifyMaterialRole(
  label: string,
  material: MaterialLike,
  config: AircraftVisualConfig,
): MaterialRole {
  if (material.transparent || matchesName(label, config.canopyNameTokens)) {
    return "canopy";
  }
  if (matchesName(label, config.interiorNameTokens)) {
    return "interior";
  }
  if (matchesName(label, config.darkNameTokens)) {
    return "dark";
  }
  if (matchesName(label, config.accentNameTokens)) {
    return "accent";
  }
  return "base";
}

function createCanopyMaterial(
  source: MaterialLike,
  config: AircraftVisualConfig,
  anisotropy: number,
) {
  const canopy = new THREE.MeshPhysicalMaterial({
    color: config.material.canopyColor,
    metalness: 0.04,
    roughness: 0.12,
    transmission: 0.42,
    thickness: 0.16,
    ior: 1.42,
    clearcoat: 0.85,
    clearcoatRoughness: 0.16,
    envMapIntensity: config.material.envMapIntensity + 0.18,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
  });

  canopy.map = getTexture(source, "map");
  canopy.alphaMap = getTexture(source, "alphaMap");
  canopy.normalMap = getTexture(source, "normalMap");
  canopy.normalScale = new THREE.Vector2(0.6, 0.6);
  canopy.depthWrite = false;
  canopy.toneMapped = true;
  applyTextureHints(canopy, anisotropy);

  return canopy;
}

function createOpaqueMaterial(
  source: MaterialLike,
  role: Exclude<MaterialRole, "canopy">,
  config: AircraftVisualConfig,
  anisotropy: number,
) {
  const material = source.clone() as MaterialLike;
  const paint = config.material;

  if (role === "base" && material.color) {
    material.color.set(paint.baseColor);
    material.metalness = paint.baseMetalness;
    material.roughness = paint.baseRoughness;
  } else if (role === "accent" && material.color) {
    material.color.set(paint.accentColor);
    material.metalness = paint.accentMetalness;
    material.roughness = paint.accentRoughness;
  } else if (role === "dark" && material.color) {
    material.color.set(paint.darkColor);
    material.metalness = 0.32;
    material.roughness = 0.5;
  } else if (role === "interior" && material.color) {
    material.color.set("#252b31");
    material.metalness = 0.12;
    material.roughness = 0.72;
    if (material.emissive) {
      material.emissive.set("#0f151a");
      material.emissiveIntensity = 0.08;
    }
  }

  material.envMapIntensity = paint.envMapIntensity;
  material.clearcoat = role === "accent" ? 0.12 : 0.05;
  material.clearcoatRoughness = 0.42;
  material.transparent = false;
  material.opacity = 1;
  material.depthWrite = true;
  material.toneMapped = true;

  if (material.normalMap) {
    material.normalScale = new THREE.Vector2(0.75, 0.75);
  }

  applyTextureHints(material, anisotropy);
  return material;
}

function buildPreparedScene(
  sourceScene: THREE.Group,
  config: AircraftVisualConfig,
  anisotropy: number,
) {
  const root = sourceScene.clone(true);
  const materialCache = new WeakMap<THREE.Material, THREE.Material>();

  root.traverse((node) => {
    const label = node.name.toLowerCase();

    if (matchesName(label, config.hiddenNameTokens)) {
      node.visible = false;
      return;
    }

    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }

    const assignMaterial = (material: THREE.Material) => {
      const cached = materialCache.get(material);
      if (cached) {
        return cached;
      }

      const typedMaterial = material as MaterialLike;
      const role = classifyMaterialRole(label, typedMaterial, config);
      const nextMaterial =
        role === "canopy"
          ? createCanopyMaterial(typedMaterial, config, anisotropy)
          : createOpaqueMaterial(typedMaterial, role, config, anisotropy);

      materialCache.set(material, nextMaterial);
      return nextMaterial;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(assignMaterial);
    } else if (mesh.material) {
      mesh.material = assignMaterial(mesh.material);
    }

    mesh.castShadow = !matchesName(label, config.canopyNameTokens);
    mesh.receiveShadow = true;
    mesh.frustumCulled = true;
  });

  root.rotation.set(
    config.rootRotation.x,
    config.rootRotation.y,
    config.rootRotation.z,
  );
  root.updateMatrixWorld(true);

  const bounds = new THREE.Box3().makeEmpty();
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible) {
      return;
    }

    const geometry = mesh.geometry as THREE.BufferGeometry;
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    if (!geometry.boundingBox) {
      return;
    }

    bounds.union(geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  });

  const size = bounds.getSize(new THREE.Vector3());
  const origin = new THREE.Vector3(
    THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, config.originNormalized.x),
    THREE.MathUtils.lerp(bounds.min.y, bounds.max.y, config.originNormalized.y),
    THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, config.originNormalized.z),
  );
  const scale = config.targetLength / Math.max(size.z, 0.001);

  root.position.sub(origin);
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);

  return root;
}

function LoadedAircraft({ config }: { config: AircraftVisualConfig }) {
  const gl = useThree((state) => state.gl);
  const result = useGLTF(config.assetPath) as { scene: THREE.Group };
  const anisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);
  const prepared = useMemo(
    () => buildPreparedScene(result.scene, config, anisotropy),
    [anisotropy, config, result.scene],
  );

  return (
    <group
      position={[config.modelOffset.x, config.modelOffset.y, config.modelOffset.z]}
    >
      <primitive object={prepared} dispose={null} />
    </group>
  );
}

type AircraftAssetBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type AircraftAssetBoundaryState = {
  hasError: boolean;
};

class AircraftAssetBoundary extends Component<
  AircraftAssetBoundaryProps,
  AircraftAssetBoundaryState
> {
  override state: AircraftAssetBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Aircraft asset failed to render", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function AircraftModel({ config, fallback }: AircraftModelProps) {
  return (
    <AircraftAssetBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <LoadedAircraft config={config} />
      </Suspense>
    </AircraftAssetBoundary>
  );
}

useGLTF.preload(TANKER_VISUAL_CONFIG.assetPath);
useGLTF.preload(RECEIVER_VISUAL_CONFIG.assetPath);
