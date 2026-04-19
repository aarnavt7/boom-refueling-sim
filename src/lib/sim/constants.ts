import type {
  AutopilotCommandECEF,
  BoomCommand,
  BoomJointState,
  ControllerState,
  PerceptionEstimate,
  Pose,
  SafetyStatus,
  SensorRigDefinition,
  SimMetrics,
  TrackerState,
} from "@/lib/sim/types";
import { INITIAL_RECEIVER_VISUAL_POSE } from "@/lib/sim/aircraftVisualConfig";
import { degToRad } from "@/lib/sim/math";

export const SENSOR_RESOLUTION = 256;
export const REPLAY_SAMPLE_HZ = 20;
export const MAX_FRAME_DT = 1 / 30;

export const EMPTY_AUTOPILOT_COMMAND: AutopilotCommandECEF = {
  dx: 0,
  dy: 0,
  dz: 0,
  magnitude: 0,
  clamped: false,
  mode: "hold",
};

export const EMPTY_COMMAND: BoomCommand = { yawRate: 0, pitchRate: 0, extendRate: 0 };

export const EMPTY_ESTIMATE: PerceptionEstimate = {
  sensorId: "tail-acq-left",
  sensorName: "Tail Acquire Left",
  role: "acquire",
  modality: "visible",
  visible: false,
  dropout: false,
  confidence: 0,
  estimatedPosition: null,
  estimatedPose: null,
  imagePoint: null,
  cameraSpacePosition: null,
  range: 0,
  usedForTrack: false,
  notes: [],
};

export const EMPTY_TRACKER: TrackerState = {
  pose: null,
  position: null,
  velocity: { x: 0, y: 0, z: 0 },
  confidence: 0,
  covariance: { x: 9, y: 9, z: 9 },
  activeSensorIds: [],
  preferredRole: "acquire",
  disagreement: 0,
  lost: true,
};

export const EMPTY_SAFETY: SafetyStatus = {
  abort: false,
  hold: false,
  breakaway: false,
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
  sensorDisagreement: 0,
  activeSensorCount: 0,
  trackRange: 0,
  commandMagnitude: 0,
};

export const INITIAL_BOOM_STATE: BoomJointState = {
  yaw: 0,
  pitch: 0,
  extend: 5.8,
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

export const SENSOR_RIGS: SensorRigDefinition[] = [
  {
    id: "tail-acq-left",
    name: "Tail Acquire Left",
    role: "acquire",
    supportedModalities: ["visible", "thermal"],
    localOffset: { x: -0.62, y: 0.22, z: -0.18 },
    localRotation: { x: degToRad(-2), y: degToRad(-4), z: 0 },
    fovDeg: 58,
    aspect: 1,
    near: 0.2,
    far: 55,
    maxRange: 28,
    stereoPartner: "tail-acq-right",
  },
  {
    id: "tail-acq-right",
    name: "Tail Acquire Right",
    role: "acquire",
    supportedModalities: ["visible", "thermal"],
    localOffset: { x: 0.62, y: 0.22, z: -0.18 },
    localRotation: { x: degToRad(-2), y: degToRad(4), z: 0 },
    fovDeg: 58,
    aspect: 1,
    near: 0.2,
    far: 55,
    maxRange: 28,
    stereoPartner: "tail-acq-left",
  },
  {
    id: "boom-term-left",
    name: "Boom Terminal Left",
    role: "terminal",
    supportedModalities: ["visible", "thermal"],
    localOffset: { x: -0.08, y: 0.03, z: -0.32 },
    localRotation: { x: degToRad(1.5), y: degToRad(-2.5), z: 0 },
    fovDeg: 24,
    aspect: 1,
    near: 0.08,
    far: 18,
    maxRange: 9,
    stereoPartner: "boom-term-right",
  },
  {
    id: "boom-term-right",
    name: "Boom Terminal Right",
    role: "terminal",
    supportedModalities: ["visible", "thermal"],
    localOffset: { x: 0.08, y: 0.03, z: -0.32 },
    localRotation: { x: degToRad(1.5), y: degToRad(2.5), z: 0 },
    fovDeg: 24,
    aspect: 1,
    near: 0.08,
    far: 18,
    maxRange: 9,
    stereoPartner: "boom-term-left",
  },
];

export const CONTROLLER_SEQUENCE: ControllerState[] = [
  "SEARCH",
  "ACQUIRE",
  "TRACK",
  "ALIGN",
  "INSERT",
  "MATED",
  "HOLD",
  "ABORT",
  "BREAKAWAY",
];
