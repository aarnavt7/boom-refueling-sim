"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useLandingHeroUnveil } from "@/components/landing/useLandingHeroUnveil";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = "780ms";
const DURATION_FAST = "220ms";

type LineProps = {
  show: boolean;
  delayMs: number;
  reduced: boolean;
  children: ReactNode;
  className?: string;
};

function EnterLine({ show, delayMs, reduced, children, className = "" }: LineProps) {
  const active = show;
  const dur = reduced ? DURATION_FAST : DURATION;

  return (
    <div
      className={className}
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translate3d(0,0,0) scale(1)" : "translate3d(0,22px,0) scale(0.985)",
        filter: reduced ? "none" : active ? "blur(0)" : "blur(7px)",
        transitionProperty: reduced ? "opacity, transform" : "opacity, transform, filter",
        transitionDuration: dur,
        transitionTimingFunction: EASE,
        transitionDelay: reduced ? "0ms" : active ? `${delayMs}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}

/**
 * Staggered hero copy after WebGL is ready — timed with the end of the fly-by.
 */
export function LandingHeroCopyReveal() {
  const { unveiled, reduced } = useLandingHeroUnveil();

  return (
    <div className="relative z-10 flex min-h-[100svh] flex-col pointer-events-none">
      <div className="flex flex-1 flex-col justify-center px-5 pb-12 pt-24 text-center sm:px-8 sm:pt-28">
        <EnterLine show={unveiled} reduced={reduced} delayMs={80} className="will-change-[opacity,transform]">
          <h1 className="font-sans text-[clamp(3.75rem,14vw,8rem)] font-bold leading-[0.95] tracking-tight text-ember [text-shadow:0_0_48px_rgba(227,107,23,0.5),0_0_120px_rgba(227,107,23,0.22),0_2px_0_rgba(0,0,0,0.45)]">
            Boom.
          </h1>
        </EnterLine>

        <EnterLine show={unveiled} reduced={reduced} delayMs={190} className="mt-6">
          <p className="font-sans text-[clamp(1.5rem,4.2vw,2.85rem)] font-semibold leading-tight tracking-tight text-landing-fg">
            Dock with confidence.
          </p>
        </EnterLine>

        <EnterLine show={unveiled} reduced={reduced} delayMs={300} className="mx-auto mt-5 max-w-lg">
          <p className="font-sans text-sm leading-relaxed text-landing-muted sm:text-base">
            A browser refueling boom simulator: passive visible / thermal sensing, ECEF boom commands, and replayable
            mission profiles for day, night, water, land, and EMCON.
          </p>
        </EnterLine>

        <EnterLine
          show={unveiled}
          reduced={reduced}
          delayMs={400}
          className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/sim"
            className="inline-flex items-center gap-2 rounded-full bg-ember px-6 py-3 font-sans text-[13px] font-semibold text-white shadow-[0_0_28px_rgba(227,107,23,0.35)] transition hover:bg-[#ea7a2c]"
          >
            Open sim
            <span aria-hidden>→</span>
          </Link>
          <a
            href="#pipeline"
            className="inline-flex rounded-full border border-white/20 bg-black/30 px-6 py-3 font-sans text-[13px] font-medium text-landing-fg/95 backdrop-blur-sm transition hover:border-ember/40"
          >
            How it works
          </a>
        </EnterLine>

        <EnterLine show={unveiled} reduced={reduced} delayMs={510} className="mt-14">
          <p className="font-sans text-[11px] font-medium tracking-[0.04em] text-landing-muted">Scroll</p>
        </EnterLine>
      </div>
    </div>
  );
}
