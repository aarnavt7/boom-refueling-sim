import { CaptureScene } from "@/components/marketing/shots/CaptureScene";

import { ProblemContextImage } from "@/components/landing/ProblemContextImage";

export function ProblemSectionEratos() {
  return (
    <section id="problem" className="landing-section mt-8 border-t border-landing-line pt-10 sm:mt-10 sm:pt-12">
      <p className="font-sans text-[11px] font-medium tracking-[0.04em] text-ember">Problem</p>

      <div className="mt-6 space-y-5 border-b border-landing-line pb-10 sm:pb-12">
        <h2 className="max-w-3xl font-sans text-2xl font-semibold leading-snug tracking-tight text-landing-fg sm:text-3xl">
          Why accessibility-aware indoor navigation matters
        </h2>
        <div className="max-w-2xl space-y-4 font-sans text-base leading-relaxed text-landing-muted sm:text-lg">
          <p>
            Blind and low-vision travelers still move through airports, transit hubs, hospitals, and campuses that were largely designed for sighted wayfinding.
          </p>
          <p>
            Generic navigation can tell someone where to go, but it rarely accounts for how stressful open spaces, queue lanes, weak landmarks, clutter, or surprise closures feel when vision is limited.
          </p>
          <p>
            The hardest part is not just distance. It is clarity: finding a route that is safer, easier to understand, and easier to trust in real time.
          </p>
          <p>
            In crowded public spaces, a route that is only slightly shorter can still be much worse if it requires confusing turns, open-floor crossings, or late hazard reactions.
          </p>
          <p>
            We wanted a way to simulate those barriers, compare baseline routing against accessibility-aware routing, and replay exactly where the improved guidance reduces uncertainty.
          </p>
        </div>
        <ProblemContextImage />
      </div>

      <div className="mt-10 sm:mt-12">
        <h2 className="max-w-3xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
          Test the journey before a real traveler has to trust it.
        </h2>
        <p className="mt-5 max-w-2xl font-sans text-base leading-relaxed text-landing-muted sm:text-lg">
          Pathlight puts a 3D terminal, landmark-guided prompts, low-vision scene treatment, before/after route comparison, and replayable metrics in one place so teams can test confidence-first mobility instead of shortest-path assumptions.
        </p>

        <div className="mt-6 flex justify-center sm:mt-7">
          <CaptureScene />
        </div>
      </div>
    </section>
  );
}
