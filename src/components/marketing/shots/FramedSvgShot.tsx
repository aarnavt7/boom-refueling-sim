"use client";

import Image from "next/image";

type FramedSvgShotProps = {
  src: string;
  alt: string;
  /** e.g. 16/9 or 4/3 */
  aspectClass?: string;
};

export function FramedSvgShot({ src, alt, aspectClass = "aspect-video" }: FramedSvgShotProps) {
  return (
    <div
      className={`relative w-full max-w-[1600px] overflow-hidden rounded-xl border border-white/[0.08] bg-black ${aspectClass}`}
    >
      <Image src={src} alt={alt} fill className="object-cover object-center opacity-95" sizes="(max-width: 1600px) 100vw, 1600px" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
    </div>
  );
}
