import type { AircraftCardId, CameraMode } from "@/lib/sim/types";

export const AIRCRAFT_CARD_OPTIONS: Array<{
  id: AircraftCardId;
  label: string;
  subtitle: string;
  tanker: string;
  receiver: string;
}> = [
  {
    id: "kc46_f15",
    label: "Blind mode",
    subtitle: "Landmark-first prompting",
    tanker: "Audio cue stack",
    receiver: "Clock-direction guidance",
  },
  {
    id: "kc135_f16",
    label: "Low-vision mode",
    subtitle: "Contrast + simplification",
    tanker: "High-contrast route glow",
    receiver: "Reduced visual clutter",
  },
  {
    id: "kc10_f22",
    label: "First-trip mode",
    subtitle: "Confidence-first pacing",
    tanker: "Longer lead prompts",
    receiver: "Lower ambiguity route",
  },
  {
    id: "a330_rafale",
    label: "Crowd-aware mode",
    subtitle: "Stress reduction under pressure",
    tanker: "Queue avoidance",
    receiver: "Calmer corridor choice",
  },
];

export const CAMERA_MODE_OPTIONS: Array<{
  id: CameraMode;
  label: string;
  detail: string;
}> = [
  {
    id: "manual",
    label: "Free orbit",
    detail: "Inspect the full terminal and route graph from any angle.",
  },
  {
    id: "receiver-lock",
    label: "Traveler follow",
    detail: "Follow the traveler and keep the next turn centered.",
  },
  {
    id: "dock-lock",
    label: "Route focus",
    detail: "Frame the traveler, destination, and highlighted route together.",
  },
];

export const DEFAULT_AIRCRAFT_CARD_ID: AircraftCardId = "kc46_f15";
export const DEFAULT_CAMERA_MODE: CameraMode = "manual";

export const SAMPLE_CONTROLLER_SOURCE = `export function step(input) {
  const phase = input.simTime;
  const missionDelta = input.missionSample?.positionDelta ?? { x: 0, y: 0, z: 0 };
  const lateralWeave = Math.sin(phase * 1.4) * 0.02;
  const verticalPulse = Math.sin(phase * 0.9 + 0.7) * 0.012;

  return {
    label: input.controllerState === "INSERT" ? "terminal-weave" : "offset-demo",
    positionDelta: {
      x: missionDelta.x + lateralWeave,
      y: missionDelta.y + verticalPulse,
      z: missionDelta.z,
    },
    rotationDelta: input.missionSample?.rotationDelta,
  };
}`;

export const SAMPLE_MISSION_JSON = JSON.stringify(
  {
    samples: [
      { time: 1.5, positionDelta: { x: 0.015, y: 0.005, z: -0.01 }, note: "gust-front" },
      { time: 3.0, positionDelta: { x: -0.02, y: 0.01, z: 0.012 }, note: "pilot-correct" },
      { time: 5.2, positionDelta: { x: 0.012, y: -0.014, z: 0 }, note: "closure-bump" },
    ],
  },
  null,
  2,
);

export const AUTONOMY_UPLOAD_HELP =
  "Unused in the TSA competition branch.";
