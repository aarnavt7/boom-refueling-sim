"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import type * as THREE from "three";

import { SIM_CONTENT_LAYER } from "@/lib/sim/sceneLayers";

export const SensorCamera = forwardRef<THREE.PerspectiveCamera>(function SensorCamera(_, forwardedRef) {
  const innerRef = useRef<THREE.PerspectiveCamera>(null);

  useImperativeHandle(forwardedRef, () => innerRef.current as THREE.PerspectiveCamera, []);

  useLayoutEffect(() => {
    const cam = innerRef.current;
    if (!cam) return;
    cam.layers.disableAll();
    cam.layers.enable(SIM_CONTENT_LAYER);
  }, []);

  return (
    <PerspectiveCamera
      ref={innerRef}
      manual
      fov={34}
      near={0.1}
      far={40}
      position={[0, 0.05, 0]}
      rotation={[0, Math.PI, 0]}
    />
  );
});
