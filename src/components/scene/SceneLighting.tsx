"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { getKeyLightPosition, getSunDirection, KEY_LIGHT_TARGET } from "@/components/scene/sunConfig";

export function SceneLighting() {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const keyPosition = useMemo(() => getKeyLightPosition(), []);
  const fillPosition = useMemo(() => getSunDirection().clone().multiplyScalar(-26), []);

  useLayoutEffect(() => {
    const light = keyRef.current;
    if (!light?.shadow?.camera) return;

    light.target.position.copy(KEY_LIGHT_TARGET);
    light.target.updateMatrixWorld();

    const cam = light.shadow.camera as THREE.OrthographicCamera;
    cam.top = 12;
    cam.bottom = -14;
    cam.left = -16;
    cam.right = 16;
    cam.near = 0.5;
    cam.far = 56;
    cam.updateProjectionMatrix();
    light.shadow.bias = -0.00015;
    light.shadow.normalBias = 0.035;
    light.shadow.radius = 2;
  }, []);

  return (
    <>
      <hemisphereLight args={["#c3dcf3", "#d6dde2", 0.3]} />
      <ambientLight intensity={0.02} color="#f2f7fb" />
      <directionalLight
        ref={keyRef}
        castShadow
        position={[keyPosition.x, keyPosition.y, keyPosition.z]}
        intensity={2.05}
        color="#f7fbff"
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[fillPosition.x, fillPosition.y, fillPosition.z]}
        intensity={0.14}
        color="#bfd3e0"
      />
    </>
  );
}
