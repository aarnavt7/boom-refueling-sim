import { LandingHeroCopyReveal } from "@/components/landing/LandingHeroCopyReveal";
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

        <LandingHeroCopyReveal />
      </section>
    </>
  );
}
