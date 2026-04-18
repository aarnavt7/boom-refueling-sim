import type {
  BoomCommand,
  BoomJointState,
  ControllerState,
  PerceptionEstimate,
  Pose,
  SafetyStatus,
  SimMetrics,
  TrackerState,
  Vec3,
} from "@/lib/sim/types";
import {
  INITIAL_RECEIVER_VISUAL_POSE,
  RECEIVER_VISUAL_CONFIG,
  TANKER_VISUAL_CONFIG,
} from "@/lib/sim/aircraftVisualConfig";

export const SENSOR_RESOLUTION = 256;
export const REPLAY_SAMPLE_HZ = 20;
export const MAX_FRAME_DT = 1 / 30;
export const BOOM_BASE_POSITION: Vec3 = TANKER_VISUAL_CONFIG.boomRootAnchor ?? {
  x: 0,
  y: -0.62,
  z: 4.35,
};
export const RECEIVER_RECEPTACLE_LOCAL: Vec3 =
  RECEIVER_VISUAL_CONFIG.receptacleAnchor ?? {
    x: 0,
    y: 0.56,
    z: 1.95,
  };
export const EMPTY_COMMAND: BoomCommand = { yawRate: 0, pitchRate: 0, extendRate: 0 };
export const EMPTY_ESTIMATE: PerceptionEstimate = {
  visible: false,
  dropout: false,
  confidence: 0,
  estimatedPosition: null,
  imagePoint: null,
  cameraSpacePosition: null,
};
export const EMPTY_TRACKER: TrackerState = {
  position: null,
  velocity: { x: 0, y: 0, z: 0 },
  confidence: 0,
};
export const EMPTY_SAFETY: SafetyStatus = {
  abort: false,
  hold: false,
  reasons: [],
};
export const EMPTY_METRICS: SimMetrics = {
  positionError: 0,
  lateralError: 0,
  forwardError: 0,
  closureRate: 0,
  confidence: 0,
  dockScore: 0,
  alignmentError: 0,
  dropoutCount: 0,
  visibleTime: 0,
};

export const INITIAL_BOOM_STATE: BoomJointState = {
  yaw: 0,
  pitch: 0,
  extend: 7.25,
};

export const INITIAL_RECEIVER_POSE: Pose = INITIAL_RECEIVER_VISUAL_POSE;

export const JOINT_LIMITS = {
  yaw: { min: -0.9, max: 0.9 },
  pitch: { min: -0.55, max: 0.4 },
  extend: { min: 4.5, max: 16.5 },
};

export const RATE_LIMITS = {
  yawRate: 0.65,
  pitchRate: 0.5,
  extendRate: 1.8,
};

export const CONTROLLER_SEQUENCE: ControllerState[] = [
  "SEARCH",
  "ACQUIRE",
  "ALIGN",
  "INSERT",
  "DOCKED",
  "ABORT",
];
