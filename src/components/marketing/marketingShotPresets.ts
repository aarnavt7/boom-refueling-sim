export type MarketingShotId = "problem" | "tactical" | "sensor" | "authentic";

export type MarketingShotMeta = {
  id: MarketingShotId;
  title: string;
  subtitle: string;
  /** Anchor for `?shot=` and hash links */
  anchor: string;
};

export const MARKETING_SHOTS: MarketingShotMeta[] = [
  {
    id: "authentic",
    anchor: "authentic",
    title: "Authentic — 3D + full HUD (freeze frame)",
    subtitle:
      "Use for Problem hero or full-width console. Waits ~4s then freezes sim for a clean screenshot. Crop the left column for “tactical diagram” or the sensor square for PIP.",
  },
  {
    id: "tactical",
    anchor: "tactical",
    title: "Tactical board (mock readouts)",
    subtitle: "Diagram-style frame — no WebGL. Good for crisp marketing SVG/PNG export.",
  },
  {
    id: "problem",
    anchor: "svg-console",
    title: "SVG — console (legacy art)",
    subtitle: "Large framed reference: same asset as current landing until you replace captures.",
  },
  {
    id: "sensor",
    anchor: "svg-sensor",
    title: "SVG — sensor schematic",
    subtitle: "Framed sensor-pip.svg for replacement comparison.",
  },
];
