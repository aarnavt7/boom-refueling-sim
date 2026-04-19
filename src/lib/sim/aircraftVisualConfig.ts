import type { Euler3, Pose, Vec3 } from "@/lib/sim/types";

export type AircraftAssetSet = "legacy" | "realistic";

export type AircraftMaterialTreatment = "legacyTinted" | "authoredPbr";

export type AircraftMaterialProfile = {
  treatment: AircraftMaterialTreatment;
  baseColor: string;
  accentColor: string;
  darkColor: string;
  canopyColor: string;
  baseMetalness: number;
  baseRoughness: number;
  accentMetalness: number;
  accentRoughness: number;
  darkMetalness: number;
  darkRoughness: number;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
};

export type BoomSensorRigConfig = {
  x: number;
  y: number;
  zTipOffset: number;
  zMin: number;
};

export type BoomFairingConfig = {
  shroudPosition: Vec3;
  shroudRotation: Euler3;
  shroudScale: Vec3;
  bracePosition: Vec3;
  braceRotation: Euler3;
  braceScale: Vec3;
  collarPosition: Vec3;
  collarRotation: Euler3;
  collarRadiusTop: number;
  collarRadiusBottom: number;
  collarLength: number;
};

export type TankerAttachmentConfig = {
  pose: Pose;
  boomRootLocal: Vec3;
  boomSensorRig: BoomSensorRigConfig;
  boomFairing: BoomFairingConfig;
};

export type ReceiverAttachmentConfig = {
  receptacleLocal: Vec3;
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
  heatNameTokens: string[];
  lightNameTokens: string[];
  material: AircraftMaterialProfile;
};

export type FormationCameraConfig = {
  position: Vec3;
  target: Vec3;
};

// The current GLBs do not hold up reliably with the authored-PBR path in runtime,
// so we default to the stable tinted treatment until a fully compatible replacement set lands.
export const ACTIVE_AIRCRAFT_ASSET_SET: AircraftAssetSet = "legacy";

const TANKER_VISUAL_CONFIGS: Record<AircraftAssetSet, AircraftVisualConfig> = {
  legacy: {
    label: "tanker",
    assetPath: "/models/aircraft/legacy/airplane.glb",
    targetLength: 17.2,
    rootRotation: { x: 0, y: Math.PI, z: 0 },
    originNormalized: { x: 0.5, y: 0.28, z: 0.47 },
    modelOffset: { x: 0, y: 0, z: 0 },
    hiddenNameTokens: [],
    canopyNameTokens: ["glass", "window", "cockpit"],
    accentNameTokens: ["wing", "tail", "fin", "rudder"],
    darkNameTokens: ["engine", "exhaust", "nozzle", "intake", "wheel", "tire"],
    interiorNameTokens: [],
    heatNameTokens: ["exhaust", "nozzle"],
    lightNameTokens: ["beacon", "strobe", "light"],
    material: {
      treatment: "legacyTinted",
      baseColor: "#8a939b",
      accentColor: "#b9c3cb",
      darkColor: "#2a3239",
      canopyColor: "#95a68f",
      baseMetalness: 0.18,
      baseRoughness: 0.58,
      accentMetalness: 0.2,
      accentRoughness: 0.48,
      darkMetalness: 0.34,
      darkRoughness: 0.46,
      envMapIntensity: 0.52,
      clearcoat: 0.06,
      clearcoatRoughness: 0.34,
    },
  },
  realistic: {
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
    heatNameTokens: ["exhaust", "nozzle"],
    lightNameTokens: ["beacon", "strobe", "light"],
    material: {
      treatment: "authoredPbr",
      baseColor: "#e7edf2",
      accentColor: "#dce5ec",
      darkColor: "#1e242a",
      canopyColor: "#8aa6bb",
      baseMetalness: 0.16,
      baseRoughness: 0.5,
      accentMetalness: 0.22,
      accentRoughness: 0.44,
      darkMetalness: 0.42,
      darkRoughness: 0.38,
      envMapIntensity: 0.72,
      clearcoat: 0.12,
      clearcoatRoughness: 0.24,
    },
  },
};

const RECEIVER_VISUAL_CONFIGS: Record<AircraftAssetSet, AircraftVisualConfig> = {
  legacy: {
    label: "receiver",
    assetPath: "/models/aircraft/legacy/fighter-jet.glb",
    targetLength: 8.65,
    rootRotation: { x: 0, y: Math.PI, z: 0 },
    originNormalized: { x: 0.5, y: 0.28, z: 0.48 },
    modelOffset: { x: 0, y: 0.1, z: 2.97 },
    hiddenNameTokens: ["wheel", "wheelparts"],
    canopyNameTokens: ["glass", "helmet_glass", "canopy"],
    accentNameTokens: ["missile", "flap", "tail"],
    darkNameTokens: ["engine", "exhaust", "nozzle", "intake"],
    interiorNameTokens: ["interior", "pilot"],
    heatNameTokens: ["exhaust", "nozzle"],
    lightNameTokens: ["light", "emissive", "nav", "beacon"],
    material: {
      treatment: "legacyTinted",
      baseColor: "#747f87",
      accentColor: "#959fa8",
      darkColor: "#212830",
      canopyColor: "#9c9362",
      baseMetalness: 0.22,
      baseRoughness: 0.5,
      accentMetalness: 0.22,
      accentRoughness: 0.42,
      darkMetalness: 0.34,
      darkRoughness: 0.44,
      envMapIntensity: 0.64,
      clearcoat: 0.08,
      clearcoatRoughness: 0.32,
    },
  },
  realistic: {
    label: "receiver",
    assetPath: "/models/aircraft/fighter-jet.glb",
    targetLength: 8.65,
    rootRotation: { x: 0, y: Math.PI, z: 0 },
    originNormalized: { x: 0.5, y: 0.28, z: 0.48 },
    modelOffset: { x: 0, y: 0.1, z: 2.97 },
    hiddenNameTokens: ["wheel", "wheelparts"],
    canopyNameTokens: ["glass", "helmet_glass", "canopy"],
    accentNameTokens: ["missile", "flap", "tail"],
    darkNameTokens: ["engine", "exhaust", "nozzle", "intake"],
    interiorNameTokens: ["interior", "pilot"],
    heatNameTokens: ["exhaust", "nozzle"],
    lightNameTokens: ["light", "emissive", "nav", "beacon"],
    material: {
      treatment: "authoredPbr",
      baseColor: "#cfd8de",
      accentColor: "#b6c2cb",
      darkColor: "#20272d",
      canopyColor: "#9c9a72",
      baseMetalness: 0.2,
      baseRoughness: 0.52,
      accentMetalness: 0.24,
      accentRoughness: 0.4,
      darkMetalness: 0.42,
      darkRoughness: 0.32,
      envMapIntensity: 0.76,
      clearcoat: 0.12,
      clearcoatRoughness: 0.22,
    },
  },
};

const TANKER_ATTACHMENT_CONFIGS: Record<AircraftAssetSet, TankerAttachmentConfig> = {
  legacy: {
    pose: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    boomRootLocal: { x: 0, y: -0.94, z: 7.82 },
    boomSensorRig: {
      x: 0,
      y: 0.06,
      zTipOffset: -0.65,
      zMin: 0.8,
    },
    boomFairing: {
      shroudPosition: { x: 0, y: -0.46, z: 7.2 },
      shroudRotation: { x: 0.34, y: 0, z: 0 },
      shroudScale: { x: 0.7, y: 0.34, z: 1.28 },
      bracePosition: { x: 0, y: -0.3, z: 6.9 },
      braceRotation: { x: 0.3, y: 0, z: 0 },
      braceScale: { x: 0.28, y: 0.14, z: 0.74 },
      collarPosition: { x: 0, y: -0.93, z: 7.72 },
      collarRotation: { x: Math.PI / 2, y: 0, z: 0 },
      collarRadiusTop: 0.16,
      collarRadiusBottom: 0.24,
      collarLength: 0.66,
    },
  },
  realistic: {
    pose: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    boomRootLocal: { x: 0, y: -0.94, z: 7.82 },
    boomSensorRig: {
      x: 0,
      y: 0.06,
      zTipOffset: -0.65,
      zMin: 0.8,
    },
    boomFairing: {
      shroudPosition: { x: 0, y: -0.46, z: 7.2 },
      shroudRotation: { x: 0.34, y: 0, z: 0 },
      shroudScale: { x: 0.7, y: 0.34, z: 1.28 },
      bracePosition: { x: 0, y: -0.3, z: 6.9 },
      braceRotation: { x: 0.3, y: 0, z: 0 },
      braceScale: { x: 0.28, y: 0.14, z: 0.74 },
      collarPosition: { x: 0, y: -0.93, z: 7.72 },
      collarRotation: { x: Math.PI / 2, y: 0, z: 0 },
      collarRadiusTop: 0.16,
      collarRadiusBottom: 0.24,
      collarLength: 0.66,
    },
  },
};

const RECEIVER_ATTACHMENT_CONFIGS: Record<AircraftAssetSet, ReceiverAttachmentConfig> = {
  legacy: {
    receptacleLocal: { x: 0, y: 0.56, z: 1.95 },
  },
  realistic: {
    receptacleLocal: { x: 0, y: 0.56, z: 1.95 },
  },
};

const FORMATION_CAMERA_CONFIGS: Record<AircraftAssetSet, FormationCameraConfig> = {
  legacy: {
    position: { x: -12.5, y: 4.8, z: 21.4 },
    target: { x: 0.25, y: -1.2, z: 11.1 },
  },
  realistic: {
    position: { x: -12.3, y: 4.6, z: 21 },
    target: { x: 0.18, y: -1.05, z: 11.25 },
  },
};

export const TANKER_VISUAL_CONFIG = TANKER_VISUAL_CONFIGS[ACTIVE_AIRCRAFT_ASSET_SET];
export const RECEIVER_VISUAL_CONFIG = RECEIVER_VISUAL_CONFIGS[ACTIVE_AIRCRAFT_ASSET_SET];
export const TANKER_ATTACHMENT_CONFIG = TANKER_ATTACHMENT_CONFIGS[ACTIVE_AIRCRAFT_ASSET_SET];
export const RECEIVER_ATTACHMENT_CONFIG = RECEIVER_ATTACHMENT_CONFIGS[ACTIVE_AIRCRAFT_ASSET_SET];
export const FORMATION_CAMERA_CONFIG = FORMATION_CAMERA_CONFIGS[ACTIVE_AIRCRAFT_ASSET_SET];

export const INITIAL_RECEIVER_VISUAL_POSE: Pose = {
  position: { x: 0.35, y: -2.18, z: 12.55 },
  rotation: { x: 0.01, y: -0.022, z: 0.004 },
};

export const MAIN_CAMERA_POSITION: Vec3 = FORMATION_CAMERA_CONFIG.position;
export const MAIN_CAMERA_TARGET: Vec3 = FORMATION_CAMERA_CONFIG.target;

export const AIRCRAFT_ASSET_PATHS = Array.from(
  new Set([
    ...Object.values(TANKER_VISUAL_CONFIGS).map((config) => config.assetPath),
    ...Object.values(RECEIVER_VISUAL_CONFIGS).map((config) => config.assetPath),
  ]),
);
