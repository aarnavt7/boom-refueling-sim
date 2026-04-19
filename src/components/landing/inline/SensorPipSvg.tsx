/**
 * Inlined copy of `public/landing/sensor-pip.svg` — renders without `<img>` fetch.
 */
export function SensorPipSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 500"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <rect width="800" height="500" fill="#050505" />
      <rect x="40" y="40" width="720" height="420" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <rect
        x="56"
        y="56"
        width="688"
        height="388"
        fill="#0a0a0c"
        stroke="rgba(126,179,200,0.2)"
        strokeWidth="1"
      />
      <circle cx="420" cy="250" r="120" stroke="rgba(126,179,200,0.25)" strokeWidth="1" fill="none" />
      <circle cx="420" cy="250" r="8" fill="#7eb3c8" opacity="0.9" />
      <path d="M420 130v240M300 250h240" stroke="rgba(126,179,200,0.2)" strokeWidth="1" />
      <rect x="56" y="56" width="120" height="24" fill="#050505" />
      <text
        x="64"
        y="74"
        fill="#a1a1aa"
        fontFamily="ui-monospace, monospace"
        fontSize="11"
        letterSpacing="0.14em"
      >
        VIS / THERMAL · SIM
      </text>
      <text
        x="64"
        y="430"
        fill="#8b98a8"
        fontFamily="ui-monospace, monospace"
        fontSize="10"
        letterSpacing="0.1em"
      >
        GEOMETRY-FIRST TARGET · NOT ML
      </text>
    </svg>
  );
}
