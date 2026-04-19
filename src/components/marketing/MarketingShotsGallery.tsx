"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { FramedLandingSvg } from "@/components/landing/FramedLandingSvg";
import { SensorPipSvg } from "@/components/landing/inline/SensorPipSvg";
import { MARKETING_SHOTS } from "@/components/marketing/marketingShotPresets";
import { CaptureScene } from "@/components/marketing/shots/CaptureScene";
import { MockTacticalBoard } from "@/components/marketing/shots/MockTacticalBoard";

export function MarketingShotsGallery() {
  const searchParams = useSearchParams();
  const [hideLabels, setHideLabels] = useState(false);

  const anchors = useMemo(() => MARKETING_SHOTS.map((s) => s.anchor), []);

  /** Authentic / WebGL mounts late; retry until the target section exists. */
  useEffect(() => {
    const shot = searchParams.get("shot");
    if (!shot) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 90;
    const tick = () => {
      if (cancelled) return;
      const el = document.getElementById(`shot-${shot}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#050505] text-[color:var(--landing-fg)]">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#050505]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-sans text-[11px] font-medium tracking-[0.04em] text-ember">Marketing captures</p>
            <h1 className="font-sans text-lg font-semibold text-white">/imgs</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 font-sans text-[11px] font-medium tracking-[0.02em] text-landing-muted">
              <input
                type="checkbox"
                checked={hideLabels}
                onChange={(e) => setHideLabels(e.target.checked)}
                className="accent-ember"
              />
              Hide chrome
            </label>
            <Link
              href="/"
              className="rounded-full border border-white/15 px-3 py-1.5 font-sans text-[12px] text-landing-fg/90 transition hover:border-ember/40"
            >
              Home
            </Link>
          </div>
        </div>
        <nav className="mx-auto mt-3 flex max-w-4xl flex-wrap gap-2 font-sans text-[11px] font-medium tracking-[0.03em]">
          {anchors.map((a) => (
            <a key={a} className="text-ember/90 underline-offset-4 hover:underline" href={`#shot-${a}`}>
              {a}
            </a>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-10">
        {MARKETING_SHOTS.map((meta) => (
          <section
            key={meta.id}
            id={`shot-${meta.anchor}`}
            className="scroll-mt-28 border-b border-white/[0.06] pb-16 last:border-0"
          >
            <div className={hideLabels ? "sr-only" : "mb-4"}>
              <p className="font-sans text-[11px] font-medium tracking-[0.04em] text-ember">{meta.title}</p>
              <p className="mt-1 max-w-2xl font-sans text-sm text-landing-muted">{meta.subtitle}</p>
              <p className="mt-2 font-sans text-[11px] text-landing-muted">
                Deep link:{" "}
                <code className="font-sans text-landing-fg/80">
                  /imgs?shot={meta.anchor}
                </code>
              </p>
            </div>

            <div className="flex justify-center">
              {meta.id === "authentic" ? <CaptureScene /> : null}
              {meta.id === "tactical" ? (
                <div className="flex w-full justify-center p-4">
                  <MockTacticalBoard />
                </div>
              ) : null}
              {meta.id === "sensor" ? (
                <FramedLandingSvg
                  alt="Sensor PIP vector — export reference"
                  aspectClass="aspect-[8/5] max-h-[520px]"
                >
                  <SensorPipSvg />
                </FramedLandingSvg>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
