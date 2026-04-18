"use client";

import Image from "next/image";
import { useEffect } from "react";

import { RECEIVER_VISUAL_CONFIG, TANKER_VISUAL_CONFIG } from "@/lib/sim/aircraftVisualConfig";

const GLB_URLS = [TANKER_VISUAL_CONFIG.assetPath, RECEIVER_VISUAL_CONFIG.assetPath];

type LandingHeroLoaderProps = {
  /** When true, no solid panel background — parent supplies black (boot overlay). */
  bare?: boolean;
};

/**
 * Branded tactical loader. Warms HTTP cache for aircraft GLBs (fetch only — small bundle).
 */
export function LandingHeroLoader({ bare = false }: LandingHeroLoaderProps) {
  useEffect(() => {
    for (const url of GLB_URLS) {
      void fetch(url, { mode: "cors", credentials: "same-origin", cache: "force-cache" });
    }
  }, []);
  return (
    <div
      className={`landing-hero-loader relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden ${
        bare ? "bg-transparent" : "bg-[#030305]"
      }`}
      role={bare ? undefined : "status"}
      aria-live="polite"
      aria-label={bare ? undefined : "Initializing 3D scene"}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 55% at 50% 38%, rgba(227, 107, 23, 0.09) 0%, transparent 52%),
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 28px 28px, 28px 28px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,transparent_0%,rgba(0,0,0,0.75)_100%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col items-center px-6">
        <div className="landing-hero-loader__rings relative h-40 w-40 sm:h-44 sm:w-44">
          <span
            className="landing-hero-loader__ring-ccw absolute inset-0 rounded-full border border-ember/25"
            aria-hidden
          />
          <span
            className="landing-hero-loader__ring-cw absolute inset-[10%] rounded-full border border-white/[0.07]"
            aria-hidden
          />
          <span
            className="absolute inset-[22%] rounded-full border border-ember/40 shadow-[0_0_40px_rgba(227,107,23,0.12)]"
            aria-hidden
          />
          <span className="landing-hero-loader__sweep absolute inset-0 rounded-full" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/boom-logo.svg"
              alt=""
              width={56}
              height={56}
              className="opacity-95 drop-shadow-[0_0_28px_rgba(227,107,23,0.35)]"
              priority
            />
          </div>
        </div>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.28em] text-ember/90">
          Initializing
        </p>
        <p className="mt-2 max-w-xs text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-landing-muted">
          Synthetic ops · standby
        </p>
      </div>

      <div
        className="pointer-events-none absolute bottom-10 left-0 right-0 flex justify-center"
        aria-hidden
      >
        <div className="h-px w-32 max-w-[40vw] overflow-hidden rounded-full bg-white/[0.08]">
          <div className="landing-hero-loader__bar h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-ember/80 to-transparent" />
        </div>
      </div>
    </div>
  );
}
