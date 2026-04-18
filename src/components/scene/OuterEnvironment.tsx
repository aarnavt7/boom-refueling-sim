"use client";

import { Environment } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import * as THREE from "three";

import {
  BACKGROUND_FILE,
  ENVIRONMENT_FILE,
  ENVIRONMENT_INTENSITY,
  ENVIRONMENT_ROTATION,
  FOG_COLOR,
  FOG_EXP2_DENSITY,
  LANDING_ENVIRONMENT_INTENSITY_FACTOR,
  LANDING_FOG_COLOR,
  LANDING_FOG_EXP2_DENSITY,
  LANDING_SKY_BACKGROUND_INTENSITY,
} from "@/components/scene/sunConfig";

export type OuterEnvironmentVariant = "sim" | "landing" | "capture";

function AerialFog({ variant }: { variant: OuterEnvironmentVariant }) {
  const fogColor = variant === "landing" ? LANDING_FOG_COLOR : FOG_COLOR;
  const density = variant === "landing" ? LANDING_FOG_EXP2_DENSITY : FOG_EXP2_DENSITY;

  const [fog] = useState(() => new THREE.FogExp2(fogColor, density));

  useEffect(() => {
    fog.color.set(fogColor);
    fog.density = density;
  }, [fog, fogColor, density]);

  return <primitive object={fog} attach="fog" />;
}

function SkyBackground({ variant }: { variant: OuterEnvironmentVariant }) {
  const scene = useThree((state) => state.scene);
  const [background, setBackground] = useState<THREE.Texture | null>(null);

  useEffect(() => {
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
  }, []);

  useLayoutEffect(() => {
    if (!background) return;

    const previousBackground = scene.background;
    const previousBlurriness = scene.backgroundBlurriness;
    const previousIntensity = scene.backgroundIntensity;
    const previousRotation = scene.backgroundRotation.clone();

    scene.background = background;
    scene.backgroundBlurriness = 0;
    scene.backgroundIntensity = variant === "landing" ? LANDING_SKY_BACKGROUND_INTENSITY : 1;
    scene.backgroundRotation.set(...ENVIRONMENT_ROTATION);

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
  const intensity =
    variant === "landing" ? ENVIRONMENT_INTENSITY * LANDING_ENVIRONMENT_INTENSITY_FACTOR : ENVIRONMENT_INTENSITY;

  return (
    <Environment
      files={ENVIRONMENT_FILE}
      background={false}
      environmentIntensity={intensity}
      environmentRotation={ENVIRONMENT_ROTATION}
    />
  );
}

export function OuterEnvironment({ variant = "sim" }: { variant?: OuterEnvironmentVariant }) {
  return (
    <>
      <AerialFog variant={variant} />
      <SkyBackground variant={variant} />
      <Suspense fallback={null}>
        <ReflectionEnvironment variant={variant} />
      </Suspense>
    </>
  );
}
