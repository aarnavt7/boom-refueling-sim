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
    label: "KC-46 / F-15E",
    subtitle: "Current mishap framing",
    tanker: "KC-46A Pegasus",
    receiver: "F-15E Strike Eagle",
  },
  {
    id: "kc135_f16",
    label: "KC-135 / F-16",
    subtitle: "Legacy tanker pairing",
    tanker: "KC-135 Stratotanker",
    receiver: "F-16 Fighting Falcon",
  },
  {
    id: "kc10_f22",
    label: "KC-10 / F-22",
    subtitle: "High-end fighter intercept",
    tanker: "KC-10 Extender",
    receiver: "F-22 Raptor",
  },
  {
    id: "a330_rafale",
    label: "A330 MRTT / Rafale",
    subtitle: "Allied operator flavor",
    tanker: "A330 MRTT",
    receiver: "Dassault Rafale",
  },
];

export const CAMERA_MODE_OPTIONS: Array<{
  id: CameraMode;
  label: string;
  detail: string;
}> = [
  {
    id: "manual",
    label: "Manual",
    detail: "Orbit freely and inspect the full formation.",
  },
  {
    id: "receiver-lock",
    label: "Receiver lock",
    detail: "Track the receiver like a tactical chase camera.",
  },
  {
    id: "dock-lock",
    label: "Dock lock",
    detail: "Stay tight on the boom tip, receptacle, and mate envelope.",
  },
];

export const DEFAULT_AIRCRAFT_CARD_ID: AircraftCardId = "kc46_f15";
export const DEFAULT_CAMERA_MODE: CameraMode = "dock-lock";

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
  "Upload controller.js exporting step(input), plus optional mission.json with timestamped mock disturbances.";
