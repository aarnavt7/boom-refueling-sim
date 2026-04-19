"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useRef } from "react";

const MAX_MS = 16_000;

/** If `useProgress` never sees assets (total stays 0), dismiss boot after this long — avoids hanging forever. */
const ZERO_ASSET_FALLBACK_MS = 2000;

/**
 * Fires once when drei reports all tracked assets loaded (GLTF, env, etc.), after a short
 * minimum hold so the boot screen never flashes away instantly.
 */
export function LandingSceneReadyNotifier({
  onReady,
  minHoldMs = 720,
}: {
  onReady: () => void;
  /** Minimum time before calling `onReady` after load completes (landing hero uses ~720ms). */
  minHoldMs?: number;
}) {
  const { active, loaded, total } = useProgress();
  const fired = useRef(false);
  const t0 = useRef(typeof performance !== "undefined" ? performance.now() : 0);

  /** If nothing registers with `useProgress` (total stays 0), still signal ready after a short delay. */
  useEffect(() => {
    if (fired.current) return;
    const id = window.setTimeout(() => {
      if (fired.current) return;
      if (total !== 0) return;
      fired.current = true;
      requestAnimationFrame(() => {
        onReady();
      });
    }, ZERO_ASSET_FALLBACK_MS);
    return () => window.clearTimeout(id);
  }, [total, onReady]);

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
    const wait = Math.max(0, minHoldMs - elapsed);
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
  }, [active, loaded, total, minHoldMs, onReady]);

  return null;
}
