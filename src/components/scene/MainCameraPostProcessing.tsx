"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

type MainCameraPostProcessingProps = {
  variant?: "sim" | "landing" | "capture";
};

const BLOOM_BY_VARIANT = {
  sim: { strength: 0.16, radius: 0.54, threshold: 0.92 },
  landing: { strength: 0.2, radius: 0.62, threshold: 0.9 },
  capture: { strength: 0.18, radius: 0.58, threshold: 0.91 },
} as const;

export function MainCameraPostProcessing({
  variant = "sim",
}: MainCameraPostProcessingProps) {
  const { camera, gl, scene, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPass = useMemo(
    () => new UnrealBloomPass(new THREE.Vector2(1, 1), 0.16, 0.54, 0.92),
    [],
  );
  const outputPass = useMemo(() => new OutputPass(), []);

  useEffect(() => {
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      depthBuffer: true,
      stencilBuffer: false,
      type: THREE.HalfFloatType,
    });
    const composer = new EffectComposer(gl, renderTarget);

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloomPass);
    composer.addPass(outputPass);
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
    composerRef.current = composer;

    return () => {
      composer.dispose();
      renderTarget.dispose();
      composerRef.current = null;
    };
  }, [bloomPass, camera, gl, outputPass, scene, size.height, size.width]);

  useEffect(() => {
    const bloom = BLOOM_BY_VARIANT[variant];
    bloomPass.strength = bloom.strength;
    bloomPass.radius = bloom.radius;
    bloomPass.threshold = bloom.threshold;
  }, [bloomPass, variant]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;

    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [gl, size.height, size.width]);

  useFrame((_, delta) => {
    composerRef.current?.render(delta);
  }, 1);

  return null;
}
