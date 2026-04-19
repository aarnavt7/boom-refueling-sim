"use client";

import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";

import {
  BACKGROUND_FILE,
  CAPTURE_FOG_DENSITY_FACTOR,
  CAPTURE_ENVIRONMENT_FACTOR,
  DAY_ENVIRONMENT_INTENSITY,
  DAY_FOG_DENSITY_FACTOR,
  ENVIRONMENT_FILE,
  ENVIRONMENT_ROTATION,
  LANDING_ENVIRONMENT_FACTOR,
  LANDING_FOG_DENSITY_FACTOR,
  LANDING_SKY_BACKGROUND_INTENSITY,
  NIGHT_ENVIRONMENT_INTENSITY,
  NIGHT_FOG_DENSITY_FACTOR,
} from "@/components/scene/sunConfig";
import { useSimStore } from "@/lib/store/simStore";

export type OuterEnvironmentVariant = "sim" | "landing" | "capture";

function AerialFog({ variant }: { variant: OuterEnvironmentVariant }) {
  const environment = useSimStore((state) => state.scenario.environment);
  const densityFactor =
    variant === "landing"
      ? LANDING_FOG_DENSITY_FACTOR
      : variant === "capture"
        ? CAPTURE_FOG_DENSITY_FACTOR
        : environment.timeOfDay === "night"
          ? NIGHT_FOG_DENSITY_FACTOR
          : DAY_FOG_DENSITY_FACTOR;
  const [fog] = useState(() => new THREE.FogExp2(environment.fogColor, environment.fogDensity * densityFactor));

  fog.color.set(environment.fogColor);
  fog.density = environment.fogDensity * densityFactor;

  return <primitive object={fog} attach="fog" />;
}

function SkyBackground({ variant }: { variant: OuterEnvironmentVariant }) {
  const environment = useSimStore((state) => state.scenario.environment);
  const scene = useThree((state) => state.scene);
  const [background, setBackground] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (environment.timeOfDay !== "day") {
      setBackground(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    let disposed = false;

    loader.load(
      BACKGROUND_FILE,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.name = "farm-field-puresky-background";
        setBackground(texture);
      },
      undefined,
      (error) => {
        console.error("Failed to load sky background", error);
      },
    );

    return () => {
      disposed = true;
      setBackground((current) => {
        current?.dispose();
        return null;
      });
    };
  }, [environment.timeOfDay]);

  useLayoutEffect(() => {
    const previousBackground = scene.background;
    const previousBlurriness = scene.backgroundBlurriness;
    const previousIntensity = scene.backgroundIntensity;
    const previousRotation = scene.backgroundRotation.clone();

    if (background) {
      scene.background = background;
      scene.backgroundBlurriness = 0;
      scene.backgroundIntensity =
        variant === "landing" ? LANDING_SKY_BACKGROUND_INTENSITY : 1;
      scene.backgroundRotation.set(...ENVIRONMENT_ROTATION);
    } else {
      scene.background = null;
      scene.backgroundBlurriness = 0;
      scene.backgroundIntensity = 1;
    }

    return () => {
      scene.background = previousBackground;
      scene.backgroundBlurriness = previousBlurriness;
      scene.backgroundIntensity = previousIntensity;
      scene.backgroundRotation.copy(previousRotation);
    };
  }, [background, scene, variant]);

  return null;
}

function ReflectionEnvironment({ variant }: { variant: OuterEnvironmentVariant }) {
  const environment = useSimStore((state) => state.scenario.environment);
  const intensityBase =
    environment.timeOfDay === "night" ? NIGHT_ENVIRONMENT_INTENSITY : DAY_ENVIRONMENT_INTENSITY;
  const factor =
    variant === "landing"
      ? LANDING_ENVIRONMENT_FACTOR
      : variant === "capture"
        ? CAPTURE_ENVIRONMENT_FACTOR
        : 1;

  return (
    <Environment
      files={ENVIRONMENT_FILE}
      background={false}
      environmentIntensity={intensityBase * factor}
      environmentRotation={ENVIRONMENT_ROTATION}
    />
  );
}

function WaterSheet() {
  const environment = useSimStore((state) => state.scenario.environment);
  const color = useMemo(
    () => (environment.timeOfDay === "night" ? "#091523" : "#4d7ba0"),
    [environment.timeOfDay],
  );

  if (environment.backgroundPreset !== "water") {
    return null;
  }

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 28]} receiveShadow>
      <planeGeometry args={[280, 280, 1, 1]} />
      <meshPhysicalMaterial
        color={color}
        metalness={0.12}
        roughness={environment.timeOfDay === "night" ? 0.2 : 0.14}
        clearcoat={0.42}
        clearcoatRoughness={0.08}
        reflectivity={0.6}
        transparent
        opacity={environment.timeOfDay === "night" ? 0.8 : 0.88}
      />
    </mesh>
  );
}

export function OuterEnvironment({ variant = "sim" }: { variant?: OuterEnvironmentVariant }) {
  return (
    <>
      <AerialFog variant={variant} />
      <SkyBackground variant={variant} />
      <WaterSheet />
      <Suspense fallback={null}>
        <ReflectionEnvironment variant={variant} />
      </Suspense>
    </>
  );
}
