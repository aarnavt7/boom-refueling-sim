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
          <p>
            The geometry is unforgiving: closure rate, lateral offset, and vertical alignment all have to stay inside a
            tight envelope while both aircraft keep moving.
          </p>
          <p>
            Air Mobility Command&apos;s Aug. 25, 2025 release summarized KC-46 boom mishaps from Oct. 15, 2022,
            Nov. 7, 2022, and Aug. 21, 2024 where nozzle binding, excessive closure, and instability damaged the boom
            and tanker during refueling attempts.
          </p>
          <p>Night, open water, and EMCON make the perception and alignment problem even harder.</p>
          <p>Live training is costly, weather-dependent, and hard to repeat on demand.</p>
          <p>
            Software rehearsal should mirror that exact spatial challenge — approach, passive sensing, alignment,
            closure management, and safety logic — without replacing certified instruction.
          </p>
        </div>
        <ProblemContextImage />
      </div>

      <div className="mt-10 sm:mt-12">
        <h2 className="max-w-3xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
          Practice the geometry before the boom hits metal.
        </h2>
        <p className="mt-5 max-w-2xl font-sans text-base leading-relaxed text-landing-muted sm:text-lg">
          Boom puts the 3D scene, passive visible / thermal sensor view, uploadable autonomy perturbations, mission
          profile controls, and post-run analytics in one place so teams can rehearse the exact offsets and closure
          trends that matter.
        </p>

        <div className="mt-6 flex justify-center sm:mt-7">
          <CaptureScene />
        </div>
      </div>
    </section>
  );
}
