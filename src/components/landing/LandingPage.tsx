import Image from "next/image";
import Link from "next/link";

import { LandingBootProvider } from "@/components/landing/LandingBootProvider";
import { LandingHeroEratos } from "@/components/landing/LandingHeroEratos";
import { LandingMain } from "@/components/landing/LandingMain";
import { LandingPipelineCards } from "@/components/landing/LandingPipelineCards";
import { LandingTacticalShowcase } from "@/components/landing/LandingTacticalShowcase";
import { ProblemSectionEratos } from "@/components/landing/ProblemSectionEratos";

const techLayers = [
  { name: "Runtime", detail: "Bun, Next.js App Router, TypeScript." },
  { name: "3D", detail: "React Three Fiber, drei, capped DPR." },
  { name: "State", detail: "Zustand for sim + UI." },
  { name: "Routing", detail: "Weighted pathfinding with landmark clarity, hazard load, crowd pressure, and low-vision penalties." },
  { name: "Guidance", detail: "Clock-direction prompts, landmark callouts, reroute notes, and low-vision scene treatment." },
  { name: "Compare", detail: "Baseline vs Pathlight replay overlays and before/after accessibility metrics." },
  { name: "Save", detail: "localStorage summaries + IndexedDB replay archives." },
];

const mathCards = [
  {
    title: "Route scoring",
    body: "Pathlight does not just minimize distance. It scores each corridor on ambiguity, crowd pressure, landmark richness, hazard exposure, and low-vision readability.",
  },
  {
    title: "Guidance",
    body: "Every route step turns into an assistive prompt: action, distance band, landmark cue, clock-direction hint, and safety note timed for the next decision point.",
  },
  {
    title: "Rerouting",
    body: "When a corridor closes or a queue swells, Pathlight reacts before the traveler reaches the stress point, shifting to a calmer route instead of forcing late recovery.",
  },
];

export function LandingPage() {
  return (
    <LandingBootProvider>
      <LandingMain>
        <LandingHeroEratos />

        <div className="mx-auto flex max-w-6xl flex-col px-5 pb-16 pt-2 sm:px-8">
          <ProblemSectionEratos />

          <LandingTacticalShowcase />

          <section
            id="pipeline"
            className="landing-section mt-14 border-t border-landing-line pt-12 sm:mt-16 sm:pt-14"
          >
            <p className="font-sans text-[11px] font-medium tracking-[0.04em] text-ember">
              Pipeline
            </p>
            <h2 className="mt-3 max-w-2xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
              Four steps.
            </h2>
            <p className="mt-4 max-w-xl font-sans text-base text-landing-muted">
              Choose a traveler mode, compare routes, experience the journey, and replay the improvement.
            </p>
            <LandingPipelineCards />
          </section>

          <section
            id="technology"
            className="landing-section mt-14 border-t border-landing-line pt-12 sm:mt-16 sm:pt-14"
          >
            <p className="font-sans text-[11px] font-medium tracking-[0.04em] text-ember">
              Stack
            </p>
            <h2 className="mt-3 max-w-2xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
              Under the hood.
            </h2>
            <ul className="mt-8 space-y-0 divide-y divide-landing-line rounded-xl border border-landing-line">
              {techLayers.map((layer) => (
                <li
                  key={layer.name}
                  className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <span className="shrink-0 font-sans text-[11px] font-medium tracking-[0.03em] text-ember">
                    {layer.name}
                  </span>
                  <span className="font-sans text-sm text-landing-muted">
                    {layer.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="math"
            className="landing-section mt-14 border-t border-landing-line pt-12 sm:mt-16 sm:pt-14"
          >
            <p className="font-sans text-[11px] font-medium tracking-[0.04em] text-ember">
              Guidance engine
            </p>
            <h2 className="mt-3 max-w-2xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-landing-muted">
              This system is about confidence-first mobility, not shortest-path routing. The hard part is choosing a route a blind or low-vision traveler can actually follow calmly when landmarks are weak and hazards shift mid-journey.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {mathCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-landing-line bg-landing-panel/85 px-5 py-5"
                >
                  <h3 className="font-sans text-base font-semibold text-landing-fg">{card.title}</h3>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-landing-muted">{card.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-section mt-14 border-t border-landing-line pt-10 pb-6 sm:mt-16">
            <div className="flex flex-col gap-6 rounded-2xl border border-landing-line bg-landing-panel px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-ember">
                  Try it
                </p>
                <h2 className="mt-2 font-sans text-xl font-semibold text-landing-fg sm:text-2xl">
                  Open the twin.
                </h2>
                <p className="mt-2 max-w-md font-sans text-sm text-landing-muted sm:text-base">
                  Runs in the browser. Fullscreen works best for comparing the live journey, route overlays, and assistive output.
                </p>
              </div>
              <Link
                href="/sim"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-ember px-8 py-3 font-sans text-[13px] font-semibold text-white shadow-[0_0_24px_rgba(227,107,23,0.25)] transition hover:bg-[#ea7a2c]"
              >
                Open Pathlight
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3 border-t border-landing-line pt-8">
              <Image src="/boom-logo.svg" alt="" width={28} height={28} />
              <span className="font-sans text-[13px] font-semibold tracking-tight text-landing-fg">
                Pathlight
              </span>
            </div>
          </section>
        </div>
      </LandingMain>
    </LandingBootProvider>
  );
}
