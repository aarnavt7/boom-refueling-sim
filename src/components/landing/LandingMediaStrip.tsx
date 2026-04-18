"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

const VIDEO_SRC = "/landing/demo.mp4";

export function LandingMediaStrip() {
  const [videoOk, setVideoOk] = useState(true);

  const onVideoError = useCallback(() => {
    setVideoOk(false);
  }, []);

  return (
    <div className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative overflow-hidden border border-landing-line bg-black">
        <Image
          src="/landing/console-hud.svg"
          alt="Diagram of a tactical console frame with readouts"
          width={1200}
          height={675}
          className="h-auto w-full object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
          loading="lazy"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div className="relative overflow-hidden border border-landing-line bg-black">
          <Image
            src="/landing/sensor-pip.svg"
            alt="Synthetic sensor viewport schematic"
            width={800}
            height={500}
            className="h-auto w-full object-cover"
            sizes="(max-width: 1024px) 50vw, 28vw"
            loading="lazy"
          />
        </div>
        <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden border border-landing-line bg-landing-elev">
          {videoOk ? (
            <video
              className="h-full w-full object-cover opacity-90"
              src={VIDEO_SRC}
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
              onError={onVideoError}
            />
          ) : (
            <div className="px-4 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-landing-muted">
              Add looped footage as{" "}
              <span className="text-landing-fg/90">public/landing/demo.mp4</span>
              <br />
              MP4 recommended over GIF for clarity and size.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
