"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useRef } from "react";

const MIN_MS = 720;
const MAX_MS = 16_000;

/**
 * Fires once when drei reports all tracked assets loaded (GLTF, env, etc.), after a short
 * minimum hold so the boot screen never flashes away instantly.
 */
export function LandingSceneReadyNotifier({ onReady }: { onReady: () => void }) {
  const { active, loaded, total } = useProgress();
  const fired = useRef(false);
  const t0 = useRef(typeof performance !== "undefined" ? performance.now() : 0);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!fired.current) {
        fired.current = true;
        onReady();
      }
    }, MAX_MS);
    return () => clearTimeout(id);
  }, [onReady]);

  useEffect(() => {
    if (fired.current) return;
    if (total === 0) return;
    if (active) return;
    if (loaded < total) return;

    const elapsed = performance.now() - t0.current;
    const wait = Math.max(0, MIN_MS - elapsed);
    const id = window.setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onReady();
        });
      });
    }, wait);
    return () => clearTimeout(id);
  }, [active, loaded, total, onReady]);

  return null;
}
