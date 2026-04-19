"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { forwardRef, useCallback, useLayoutEffect, useRef, type MutableRefObject, type Ref } from "react";
import type * as THREE from "three";

import { SIM_CONTENT_LAYER } from "@/lib/sim/sceneLayers";

function assignRef<T>(ref: Ref<T> | null | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
  } else {
    (ref as MutableRefObject<T | null>).current = value;
  }
}

export const SensorCamera = forwardRef<THREE.PerspectiveCamera, { fov?: number }>(function SensorCamera(
  { fov = 34 },
  forwardedRef,
) {
  const innerRef = useRef<THREE.PerspectiveCamera | null>(null);

  const setRefs = useCallback(
    (node: THREE.PerspectiveCamera | null) => {
      innerRef.current = node;
      assignRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  useLayoutEffect(() => {
    const cam = innerRef.current;
    if (!cam) return;
    /** Match default camera: layer 0 + sim content so scene background / RTT match main view. */
    cam.layers.enable(0);
    cam.layers.enable(SIM_CONTENT_LAYER);
  }, []);

  return (
    <PerspectiveCamera
      ref={setRefs}
      manual
      fov={fov}
      near={0.1}
      far={40}
      position={[0, 0.05, 0]}
      rotation={[0, Math.PI, 0]}
    />
  );
});
