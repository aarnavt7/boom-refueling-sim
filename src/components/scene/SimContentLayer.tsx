"use client";

import { useLayoutEffect, useRef } from "react";
import type * as THREE from "three";

import { SIM_CONTENT_LAYER } from "@/lib/sim/sceneLayers";

function applyLayer(root: THREE.Object3D, layer: number) {
  root.traverse((obj) => {
    if ("isMesh" in obj && obj.isMesh) {
      obj.layers.set(layer);
    }
    if ("isLine" in obj && obj.isLine) {
      obj.layers.set(layer);
    }
    if ("isLineSegments" in obj && obj.isLineSegments) {
      obj.layers.set(layer);
    }
    if ("isLineLoop" in obj && obj.isLineLoop) {
      obj.layers.set(layer);
    }
    if ("isPoints" in obj && obj.isPoints) {
      obj.layers.set(layer);
    }
  });
}

export function SimContentLayer({ children }: { children: React.ReactNode }) {
  const root = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const apply = () => {
      if (!root.current) return;
      root.current.layers.set(SIM_CONTENT_LAYER);
      applyLayer(root.current, SIM_CONTENT_LAYER);
    };
    apply();
    const id = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(id);
  }, []);

  return <group ref={root}>{children}</group>;
}
