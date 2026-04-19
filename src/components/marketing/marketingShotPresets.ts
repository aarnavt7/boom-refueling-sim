export type MarketingShotId = "tactical" | "sensor" | "authentic";

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
      "Waits ~4s then freezes sim for a clean screenshot. Crop the left column for “tactical diagram” or the sensor square for PIP.",
  },
  {
    id: "tactical",
    anchor: "tactical",
    title: "Tactical board (mock readouts)",
    subtitle: "Diagram-style frame — no WebGL. Good for crisp marketing SVG/PNG export.",
  },
  {
    id: "sensor",
    anchor: "svg-sensor",
    title: "Sensor PIP (SVG export)",
    subtitle:
      "Crisp PIP schematic in public/landing/sensor-pip.svg — pairs with the tactical mock; swap for sensor crops from Authentic when ready.",
  },
];
