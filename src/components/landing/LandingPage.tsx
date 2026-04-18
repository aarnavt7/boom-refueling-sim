import Image from "next/image";
import Link from "next/link";

import { LandingBootProvider } from "@/components/landing/LandingBootProvider";
import { LandingHeroEratos } from "@/components/landing/LandingHeroEratos";
import { LandingMain } from "@/components/landing/LandingMain";
import { LandingMediaStrip } from "@/components/landing/LandingMediaStrip";
import { LandingPipelineCards } from "@/components/landing/LandingPipelineCards";
import { ProblemSectionEratos } from "@/components/landing/ProblemSectionEratos";

const proofMetrics = [
  { label: "Scene", value: "R3F + Three.js", note: "Same boom meshes as /sim" },
  { label: "Sensor", value: "Geometry track", note: "No ML API in the loop" },
  { label: "Replay", value: "20 Hz", note: "From sim store" },
  { label: "Stack", value: "Bun · Next", note: "Convex optional" },
];

const whyItems = [
  {
    title: "One screen",
    body: "Scenario, camera, metrics, and replay stay in one place.",
  },
  {
    title: "Explainable sensing",
    body: "Geometry-based estimates you can trace step by step.",
  },
  {
    title: "No ML required",
    body: "Runs fully in the browser without a model API.",
  },
  {
    title: "Save runs (optional)",
    body: "Add Convex when you want runs stored in the cloud.",
  },
];

const techLayers = [
  { name: "Runtime", detail: "Bun, Next.js App Router, TypeScript." },
  { name: "3D", detail: "React Three Fiber, drei, capped DPR." },
  { name: "State", detail: "Zustand for sim + UI." },
  { name: "Perception", detail: "Offscreen render + estimates." },
  { name: "Safety", detail: "Limits + staged controller states." },
  { name: "Save", detail: "Convex hook for completed runs." },
];

export function LandingPage() {
  return (
    <LandingBootProvider>
      <LandingMain>
        <LandingHeroEratos />

        <div className="mx-auto flex max-w-6xl flex-col px-5 pb-16 pt-6 sm:px-8">
          <ProblemSectionEratos />

          <section
            id="pipeline"
            className="landing-section mt-20 border-t border-landing-line pt-16 sm:mt-28 sm:pt-20"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
              Pipeline
            </p>
            <h2 className="mt-3 max-w-2xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
              Four steps.
            </h2>
            <p className="mt-4 max-w-xl font-sans text-base text-landing-muted">
              From setup to replay — the path the sim walks.
            </p>
            <LandingPipelineCards />
          </section>

          <section
            id="proof"
            className="landing-section mt-20 border-t border-landing-line pt-16 sm:mt-24 sm:pt-20"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
              Facts
            </p>
            <h2 className="mt-3 max-w-2xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
              At a glance.
            </h2>
            <p className="mt-4 max-w-xl font-sans text-base text-landing-muted">
              How the app is put together — stack and data flow, not flight
              certification.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {proofMetrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl border border-landing-line bg-landing-elev px-4 py-5"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-landing-muted">
                    {m.label}
                  </p>
                  <p className="mt-2 font-sans text-lg font-semibold text-landing-fg">
                    {m.value}
                  </p>
                  <p className="mt-2 font-sans text-xs text-landing-muted">
                    {m.note}
                  </p>
                </div>
              ))}
            </div>
            <LandingMediaStrip />
          </section>

          <section
            id="why"
            className="landing-section mt-20 border-t border-landing-line pt-16 sm:mt-24 sm:pt-20"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
              Why Boom
            </p>
            <h2 className="mt-3 max-w-2xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
              Why this shape.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {whyItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-landing-line bg-black/30 p-5"
                >
                  <h3 className="font-sans text-base font-semibold text-landing-fg">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-landing-muted">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="technology"
            className="landing-section mt-20 border-t border-landing-line pt-16 sm:mt-24 sm:pt-20"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
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
                  <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ember">
                    {layer.name}
                  </span>
                  <span className="font-sans text-sm text-landing-muted">
                    {layer.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="landing-section mt-20 border-t border-landing-line pt-12 pb-6 sm:mt-24">
            <div className="flex flex-col gap-6 rounded-2xl border border-landing-line bg-landing-panel px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ember">
                  Try it
                </p>
                <h2 className="mt-2 font-sans text-xl font-semibold text-landing-fg sm:text-2xl">
                  Open the sim.
                </h2>
                <p className="mt-2 max-w-md font-sans text-sm text-landing-muted sm:text-base">
                  Runs in the browser — fullscreen works best for flying the
                  boom.
                </p>
              </div>
              <Link
                href="/sim"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-ember px-8 py-3 font-sans text-[13px] font-semibold text-white shadow-[0_0_24px_rgba(227,107,23,0.25)] transition hover:bg-[#ea7a2c]"
              >
                Open sim
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3 border-t border-landing-line pt-8">
              <Image src="/boom-logo.svg" alt="" width={28} height={28} />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-landing-muted">
                Boom
              </span>
            </div>
          </section>
        </div>
      </LandingMain>
    </LandingBootProvider>
  );
}
