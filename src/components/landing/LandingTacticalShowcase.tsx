"use client";

import { MockTacticalBoard } from "@/components/marketing/shots/MockTacticalBoard";

/**
 * Tactical column — reads live sensor data from the capture canvas above (same store as /sim).
 */
export function LandingTacticalShowcase() {
  return (
    <section
      id="tactical-mock"
      className="landing-section mt-14 border-t border-landing-line pt-12 sm:mt-16 sm:pt-14"
    >
      <p className="font-sans text-[11px] font-medium tracking-[0.04em] text-ember">Live panel</p>
      <h2 className="mt-3 max-w-3xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
        Check out the live panel readout.
      </h2>
      <p className="mt-5 max-w-2xl font-sans text-base leading-relaxed text-landing-muted sm:text-lg">
        The board below shows status text, a tiny camera view, and where you are in the sequence (for example search,
        align, dock). The values update in real time in your browser from the same run as the frozen capture
        above—not a prerecorded clip.
      </p>
      <div className="mt-8 flex justify-center">
        <div className="pointer-events-auto w-full max-w-3xl [&_.border]:border-landing-line">
          <MockTacticalBoard />
        </div>
      </div>
    </section>
  );
}
