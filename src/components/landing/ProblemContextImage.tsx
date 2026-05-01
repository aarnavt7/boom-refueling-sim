import Image from "next/image";

const SRC = "/img/image.png";

export function ProblemContextImage() {
  return (
    <figure className="mt-5 overflow-hidden rounded-xl border border-landing-line bg-black/25 ring-1 ring-inset ring-white/[0.06]">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={SRC}
          alt="Pathlight terminal environment showing the indoor navigation context"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, min(1152px, 100vw)"
          priority={false}
        />
      </div>
    </figure>
  );
}
