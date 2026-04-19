import type { ReactNode } from "react";

type FramedLandingSvgProps = {
  alt: string;
  aspectClass?: string;
  className?: string;
  /** Inline SVG or other content — preferred over `<img src=".svg">` (avoids broken loads). */
  children: ReactNode;
};

/**
 * Rounded frame for landing vector art. Pass inline `<svg>` (e.g. `SensorPipSvg`).
 */
export function FramedLandingSvg({
  alt,
  aspectClass = "aspect-video",
  className = "",
  children,
}: FramedLandingSvgProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#080808] ring-1 ring-inset ring-white/[0.06] ${aspectClass} ${className}`}
    >
      <div className="absolute inset-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full">{children}</div>
    </div>
  );
}
