"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LandingHeroLoader } from "@/components/landing/LandingHeroLoader";

type LandingBootContextValue = {
  sceneReady: boolean;
  /** Call once when the landing WebGL scene has finished loading assets and is safe to reveal. */
  markSceneReady: () => void;
};

const LandingBootContext = createContext<LandingBootContextValue | null>(null);

export function LandingBootProvider({ children }: { children: ReactNode }) {
  const [sceneReady, setSceneReady] = useState(false);
  const [overlayMounted, setOverlayMounted] = useState(true);

  const markSceneReady = useCallback(() => {
    setSceneReady((prev) => (prev ? prev : true));
  }, []);

  const value = useMemo(
    () => ({ sceneReady, markSceneReady }),
    [sceneReady, markSceneReady],
  );

  useEffect(() => {
    if (sceneReady) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sceneReady]);

  useEffect(() => {
    if (!sceneReady) return;
    const id = window.setTimeout(() => setOverlayMounted(false), 520);
    return () => clearTimeout(id);
  }, [sceneReady]);

  return (
    <LandingBootContext.Provider value={value}>
      {children}
      {overlayMounted && (
        <div
          className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ease-out ${
            sceneReady ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          role="status"
          aria-live="polite"
          aria-label="Loading experience"
        >
          <LandingHeroLoader bare />
        </div>
      )}
    </LandingBootContext.Provider>
  );
}

export function useLandingBoot(): LandingBootContextValue | null {
  return useContext(LandingBootContext);
}
