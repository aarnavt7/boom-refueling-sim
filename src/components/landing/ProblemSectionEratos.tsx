import Image from "next/image";

export function ProblemSectionEratos() {
  return (
    <section id="problem" className="landing-section mt-20 border-t border-landing-line pt-16 sm:mt-28 sm:pt-20">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">Problem</p>
      <h2 className="mt-3 max-w-3xl font-sans text-3xl font-semibold leading-tight tracking-tight text-landing-fg sm:text-4xl">
        Rehearsal shouldn&apos;t be scattered.
      </h2>
      <p className="mt-5 max-w-2xl font-sans text-base text-landing-muted sm:text-lg">
        Practicing a contact sequence shouldn&apos;t mean juggling a dozen tools. Boom puts the 3D scene, synthetic camera,
        and replay in one loop so you can rehearse and review quickly — a training aid, not a certified trainer.
      </p>

      <div className="relative mt-8 overflow-hidden rounded-3xl border border-white/[0.07] bg-black">
        <Image
          src="/landing/console-hud.svg"
          alt="Console preview"
          width={1600}
          height={900}
          className="h-auto w-full object-cover opacity-95"
          sizes="(max-width: 1024px) 100vw, 896px"
          priority
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    </section>
  );
}
