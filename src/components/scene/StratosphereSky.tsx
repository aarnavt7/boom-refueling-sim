"use client";

import { Sky } from "@react-three/drei";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import type * as THREE from "three";

import {
  getSkySunPosition,
  SKY_MIE_COEFFICIENT,
  SKY_MIE_DIRECTIONAL_G,
  SKY_RAYLEIGH,
  SKY_TURBIDITY,
} from "@/components/scene/sunConfig";
import { SIM_CONTENT_LAYER } from "@/lib/sim/sceneLayers";

function applySkyRenderRules(node: THREE.Mesh | null) {
  if (!node) return;
  node.frustumCulled = false;
  node.layers.enable(0);
  node.layers.enable(SIM_CONTENT_LAYER);
  const mat = node.material;
  if (mat && "toneMapped" in mat) {
    const shaderMat = mat as THREE.ShaderMaterial;
    shaderMat.toneMapped = false;
    shaderMat.fog = false;
  }
}

/**
 * Shared analytic sky for both the main camera and the boom sensor. We keep it procedural so
 * the visible atmosphere, fog, and direct light can stay in lockstep while reflections come from
 * a separate daylight HDRI.
 *
 * Notes:
 * - `material-fog={false}` — hint to R3F; we also force `fog=false` on the ShaderMaterial.
 * - `toneMapped={false}` — shader already includes `tonemapping_fragment`; skip renderer ACES pass.
 * - Layers **0 + SIM_CONTENT_LAYER**: default camera always sees layer 0; sim + sensor use layer 1.
 *   Using only `layers.set(1)` meant the first frames (before `MainCameraLayerSync`) could miss the sky.
 */
export function StratosphereSky() {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const sunPosition = useMemo(() => getSkySunPosition(), []);

  const skyRef = useCallback((node: THREE.Mesh | null) => {
    meshRef.current = node;
    applySkyRenderRules(node);
  }, []);

  useLayoutEffect(() => {
    applySkyRenderRules(meshRef.current);
  }, []);

  return (
    <Sky
      ref={skyRef}
      material-fog={false}
      sunPosition={sunPosition}
      turbidity={SKY_TURBIDITY}
      rayleigh={SKY_RAYLEIGH}
      mieCoefficient={SKY_MIE_COEFFICIENT}
      mieDirectionalG={SKY_MIE_DIRECTIONAL_G}
      distance={450000}
    />
  );
}
