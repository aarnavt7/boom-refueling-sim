"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getKeyLightPosition, getSunDirection, KEY_LIGHT_TARGET } from "@/components/scene/sunConfig";
import { useSimStore } from "@/lib/store/simStore";

export function SceneLighting() {
  const environment = useSimStore((state) => state.scenario.environment);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const keyPosition = useMemo(
    () => getKeyLightPosition(environment.keyLightAzimuth, environment.keyLightElevation),
    [environment.keyLightAzimuth, environment.keyLightElevation],
  );
  const fillPosition = useMemo(
    () =>
      getSunDirection(
        environment.keyLightAzimuth + Math.PI - 0.12,
        environment.keyLightElevation * 0.72,
      ).multiplyScalar(20),
    [environment.keyLightAzimuth, environment.keyLightElevation],
  );
  const rimPosition = useMemo(
    () =>
      getSunDirection(
        environment.keyLightAzimuth + Math.PI * 0.78,
        Math.max(environment.keyLightElevation * 0.48, 0.16),
      ).multiplyScalar(24),
    [environment.keyLightAzimuth, environment.keyLightElevation],
  );

  useLayoutEffect(() => {
    const light = keyRef.current;
    if (!light?.shadow?.camera) return;

    light.target.position.copy(KEY_LIGHT_TARGET);
    light.target.updateMatrixWorld();

    const cam = light.shadow.camera as THREE.OrthographicCamera;
    cam.top = 7;
    cam.bottom = -7.5;
    cam.left = -10.5;
    cam.right = 10.5;
    cam.near = 0.5;
    cam.far = 52;
    cam.updateProjectionMatrix();
    light.shadow.bias = -0.00008;
    light.shadow.normalBias = 0.018;
    light.shadow.radius = 1.6;
  }, []);

  return (
    <>
      <hemisphereLight
        args={[
          environment.timeOfDay === "night" ? "#324568" : "#d8ebff",
          environment.timeOfDay === "night" ? "#06090f" : "#8f98a1",
          environment.timeOfDay === "night" ? 0.12 : 0.22,
        ]}
      />
      <ambientLight
        intensity={environment.ambientIntensity * (environment.timeOfDay === "night" ? 1.2 : 0.8)}
        color={environment.keyLightColor}
      />
      <directionalLight
        ref={keyRef}
        castShadow
        position={[keyPosition.x, keyPosition.y, keyPosition.z]}
        intensity={environment.keyLightIntensity * 1.08}
        color={environment.keyLightColor}
        shadow-mapSize={[4096, 4096]}
      />
      <directionalLight
        position={[fillPosition.x, fillPosition.y, fillPosition.z]}
        intensity={environment.fillLightIntensity * 0.82}
        color={environment.fillLightColor}
      />
      <directionalLight
        position={[rimPosition.x, rimPosition.y, rimPosition.z]}
        intensity={environment.timeOfDay === "night" ? 0.04 : 0.06}
        color={environment.timeOfDay === "night" ? "#7ea1d1" : "#c7dff4"}
      />
    </>
  );
}
