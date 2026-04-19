import { CaptureScene } from "@/components/marketing/shots/CaptureScene";

import { ProblemContextImage } from "@/components/landing/ProblemContextImage";

export function ProblemSectionEratos() {
  return (
    <section id="problem" className="landing-section mt-8 border-t border-landing-line pt-10 sm:mt-10 sm:pt-12">
      <p className="font-sans text-[11px] font-medium tracking-[0.04em] text-ember">Problem</p>

      <div className="mt-6 space-y-5 border-b border-landing-line pb-10 sm:pb-12">
        <h2 className="max-w-3xl font-sans text-2xl font-semibold leading-snug tracking-tight text-landing-fg sm:text-3xl">
          Why a refueling boom exists
        </h2>
        <div className="max-w-2xl space-y-4 font-sans text-base leading-relaxed text-landing-muted sm:text-lg">
          <p>
            Fighter jets often need fuel without flying back to a runway — tankers carry that fuel in the air.
          </p>
          <p>
            The boom is the long, operator-steered arm that links the tanker to the receiving jet so fuel can flow at
            altitude.
          </p>
          <p>The real maneuver is demanding: speed, turbulence, and visibility all matter.</p>
          <p>Night, open water, and EMCON make the geometry and sensing problem even harder.</p>
          <p>Live training is costly, weather-dependent, and hard to repeat on demand.</p>
          <p>
            Software rehearsal should mirror the same spatial challenge — approach, passive sensing, alignment, and
            safety logic — without replacing certified instruction.
          </p>
        </div>
        <ProblemContextImage />
      </div>

      <div className="mt-10 sm:mt-12">
        <h2 className="max-w-3xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
          Practice makes perfect.
        </h2>
        <p className="mt-5 max-w-2xl font-sans text-base leading-relaxed text-landing-muted sm:text-lg">
          Practice shouldn&apos;t mean hopping between unrelated apps and folders. Boom puts the 3D scene, passive
          visible / thermal sensor view, mission profile controls, and replay in one place so you can review fast.
          Treat it as a training aid — not a replacement for official courses or certification.
        </p>

        <div className="mt-6 flex justify-center sm:mt-7">
          <CaptureScene />
        </div>
      </div>
    </section>
  );
}
