import type { Euler3, Pose, Vec3 } from "@/lib/sim/types";

export type AircraftMaterialProfile = {
  baseColor: string;
  accentColor: string;
  darkColor: string;
  canopyColor: string;
  baseMetalness: number;
  baseRoughness: number;
  accentMetalness: number;
  accentRoughness: number;
  envMapIntensity: number;
};

export type AircraftVisualConfig = {
  label: string;
  assetPath: string;
  targetLength: number;
  rootRotation: Euler3;
  /**
   * The imported assets are not authored around the flight-dynamics origin.
   * This lets us pin the render origin closer to the fuselage centerline.
   */
  originNormalized: Vec3;
  modelOffset: Vec3;
  hiddenNameTokens: string[];
  canopyNameTokens: string[];
  accentNameTokens: string[];
  darkNameTokens: string[];
  interiorNameTokens: string[];
  boomRootAnchor?: Vec3;
  receptacleAnchor?: Vec3;
  material: AircraftMaterialProfile;
};

export const TANKER_VISUAL_CONFIG: AircraftVisualConfig = {
  label: "tanker",
  assetPath: "/models/aircraft/airplane.glb",
  targetLength: 17.2,
  rootRotation: { x: 0, y: Math.PI, z: 0 },
  originNormalized: { x: 0.5, y: 0.28, z: 0.47 },
  modelOffset: { x: 0, y: 0, z: 0 },
  hiddenNameTokens: [],
  canopyNameTokens: ["glass", "window", "cockpit"],
  accentNameTokens: ["wing", "tail", "fin", "rudder"],
  darkNameTokens: ["engine", "exhaust", "nozzle", "intake", "wheel", "tire"],
  interiorNameTokens: [],
  boomRootAnchor: { x: 0, y: -0.62, z: 4.35 },
  material: {
    baseColor: "#727a82",
    accentColor: "#8b939b",
    darkColor: "#242b31",
    canopyColor: "#8ea49a",
    baseMetalness: 0.18,
    baseRoughness: 0.64,
    accentMetalness: 0.2,
    accentRoughness: 0.56,
    envMapIntensity: 0.48,
  },
};

export const RECEIVER_VISUAL_CONFIG: AircraftVisualConfig = {
  label: "receiver",
  assetPath: "/models/aircraft/fighter-jet.glb",
  targetLength: 8.65,
  rootRotation: { x: 0, y: Math.PI, z: 0 },
  originNormalized: { x: 0.5, y: 0.28, z: 0.48 },
  modelOffset: { x: 0, y: 0, z: 0 },
  hiddenNameTokens: ["wheel", "wheelparts"],
  canopyNameTokens: ["glass", "helmet_glass", "canopy"],
  accentNameTokens: ["missile", "flap", "tail"],
  darkNameTokens: ["engine", "exhaust", "nozzle", "intake"],
  interiorNameTokens: ["interior", "pilot"],
  receptacleAnchor: { x: 0, y: 0.56, z: 1.95 },
  material: {
    baseColor: "#5d646b",
    accentColor: "#7b848c",
    darkColor: "#1f252c",
    canopyColor: "#938e66",
    baseMetalness: 0.22,
    baseRoughness: 0.56,
    accentMetalness: 0.22,
    accentRoughness: 0.48,
    envMapIntensity: 0.6,
  },
};

export const INITIAL_RECEIVER_VISUAL_POSE: Pose = {
  position: { x: 0.35, y: -2.18, z: 12.55 },
  rotation: { x: 0.01, y: -0.022, z: 0.004 },
};

export const MAIN_CAMERA_POSITION: Vec3 = { x: -12.5, y: 4.8, z: 21.4 };
export const MAIN_CAMERA_TARGET: Vec3 = { x: 0.25, y: -1.2, z: 11.1 };
