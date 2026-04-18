import Link from "next/link";

import { LandingHeroSlot } from "@/components/landing/LandingHeroSlot";
import { LandingNav } from "@/components/landing/LandingNav";

export function LandingHeroEratos() {
  return (
    <>
      <LandingNav />
      <section data-landing-hero className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <LandingHeroSlot />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/25 to-black/70"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_85%_55%_at_50%_42%,transparent_0%,rgba(0,0,0,0.35)_65%,rgba(0,0,0,0.82)_100%)]" />

        <div className="relative z-10 flex min-h-[100svh] flex-col pointer-events-none">
          <div className="flex flex-1 flex-col justify-center px-5 pb-12 pt-24 text-center sm:px-8 sm:pt-28">
            <h1 className="font-sans text-[clamp(3.75rem,14vw,8rem)] font-bold leading-[0.95] tracking-tight text-ember [text-shadow:0_0_48px_rgba(227,107,23,0.5),0_0_120px_rgba(227,107,23,0.22),0_2px_0_rgba(0,0,0,0.45)]">
              Boom.
            </h1>
            <p className="mt-6 font-sans text-[clamp(1.5rem,4.2vw,2.85rem)] font-semibold leading-tight tracking-tight text-landing-fg">
              Dock with confidence.
            </p>
            <p className="mx-auto mt-5 max-w-lg font-sans text-sm leading-relaxed text-landing-muted sm:text-base">
              A browser refueling boom simulator: fly the rig, watch the synthetic camera, and replay runs — same build as
              the full sim.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3">
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
            </div>
            <p className="mt-14 font-mono text-[10px] uppercase tracking-[0.2em] text-landing-muted">Scroll</p>
          </div>

          <div className="pointer-events-auto border-t border-white/[0.06] bg-black/40 px-5 py-5 backdrop-blur-sm sm:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="relative border border-landing-line bg-landing-panel/90 p-4 shadow-hud sm:p-5">
                <div className="absolute left-3 top-3 h-4 w-4 border-l-2 border-t-2 border-accent/70" />
                <div className="absolute right-3 top-3 h-4 w-4 border-r-2 border-t-2 border-accent/70" />
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">What you get</p>
                <ul className="mt-3 grid gap-0 divide-y divide-landing-line text-left text-sm text-landing-fg/90 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <li className="py-2.5 sm:py-2 sm:pr-4">Full 3D boom + receiver with orbit camera</li>
                  <li className="py-2.5 sm:px-4 sm:py-2">Synthetic camera feed and geometry-based tracking</li>
                  <li className="py-2.5 sm:pl-4 sm:py-2">Safety checks, metrics, replay, optional cloud save</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
