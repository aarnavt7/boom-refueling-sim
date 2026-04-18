"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { MAIN_CAMERA_TARGET } from "@/lib/sim/aircraftVisualConfig";
import { useSimStore } from "@/lib/store/simStore";

/** Matches `SimCanvas` initial camera when `variant="landing"`. */
export const LANDING_HERO_CAMERA_POSITION: [number, number, number] = [-28, 8.5, 36];
export const LANDING_HERO_CAMERA_FOV = 48;

const INTRO_SECONDS = 6.2;
const EASE_OUT = (t: number) => 1 - (1 - t) ** 3;

function dampScalar(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/**
 * Scripted camera for the marketing hero: no orbit — a fly-by that plays in on load
 * and extends as the user scrolls the hero off-screen.
 */
export function LandingFlybyController() {
  const { camera } = useThree();
  const startTime = useRef<number | null>(null);
  const scroll01 = useRef(0);

  const path = useMemo(() => {
    const pts = [
      new THREE.Vector3(...LANDING_HERO_CAMERA_POSITION),
      new THREE.Vector3(-17, 6.2, 23),
      new THREE.Vector3(-9.5, 5.2, 14),
      new THREE.Vector3(-4.2, 4.1, 7.5),
      new THREE.Vector3(1.2, 3.2, 2.8),
    ];
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.65);
  }, []);

  const desiredPos = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());
  const tmpLook = useRef(new THREE.Vector3());

  useEffect(() => {
    const readScroll = () => {
      const el = document.querySelector("[data-landing-hero]");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const heroH = rect.height;
      const scrolled = Math.max(0, -rect.top);
      const span = Math.max(heroH * 0.35, vh * 0.2);
      scroll01.current = Math.min(1, scrolled / span);
    };
    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    return () => {
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
    };
  }, []);

  useFrame((state, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    if (startTime.current === null) {
      startTime.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startTime.current;
    const dt = Math.min(delta, 0.1);

    const introT = Math.min(1, elapsed / INTRO_SECONDS);
    const introEased = EASE_OUT(introT);

    const scrollT = EASE_OUT(scroll01.current);
    const pathU = Math.min(
      1,
      introEased * 0.62 + scrollT * 0.52 + introEased * scrollT * 0.18,
    );

    const rx = useSimStore.getState().live.receiverPose.position;
    const focusMix = pathU * 0.55;
    desiredLook.current.set(
      THREE.MathUtils.lerp(MAIN_CAMERA_TARGET.x, rx.x, focusMix),
      THREE.MathUtils.lerp(MAIN_CAMERA_TARGET.y, rx.y, focusMix * 0.85),
      THREE.MathUtils.lerp(MAIN_CAMERA_TARGET.z, rx.z, focusMix * 0.45),
    );

    const wobble =
      Math.sin(elapsed * 0.55) * 0.12 + Math.sin(elapsed * 1.1 + 1.7) * 0.06;

    path.getPointAt(pathU, desiredPos.current);
    desiredPos.current.y += wobble * 0.35;
    desiredPos.current.x += Math.cos(elapsed * 0.35) * 0.08;

    const lambda = 5.5;
    camera.position.x = dampScalar(camera.position.x, desiredPos.current.x, lambda, dt);
    camera.position.y = dampScalar(camera.position.y, desiredPos.current.y, lambda, dt);
    camera.position.z = dampScalar(camera.position.z, desiredPos.current.z, lambda, dt);

    tmpLook.current.copy(desiredLook.current);
    camera.lookAt(tmpLook.current);

    const targetFov = THREE.MathUtils.lerp(48, 38.5, pathU);
    camera.fov = dampScalar(camera.fov, targetFov, 4, dt);
    camera.updateProjectionMatrix();
  }, -1);

  return null;
}
