export type Vec2 = {
  x: number;
  y: number;
};

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Euler3 = {
  x: number;
  y: number;
  z: number;
};

export type Pose = {
  position: Vec3;
  rotation: Euler3;
};

export type ControllerState =
  | "SEARCH"
  | "ACQUIRE"
  | "ALIGN"
  | "INSERT"
  | "DOCKED"
  | "ABORT";

export type BoomJointState = {
  yaw: number;
  pitch: number;
  extend: number;
};

export type BoomCommand = {
  yawRate: number;
  pitchRate: number;
  extendRate: number;
};

export type PerceptionEstimate = {
  visible: boolean;
  dropout: boolean;
  confidence: number;
  estimatedPosition: Vec3 | null;
  imagePoint: Vec2 | null;
  cameraSpacePosition: Vec3 | null;
};

export type TrackerState = {
  position: Vec3 | null;
  velocity: Vec3;
  confidence: number;
};

export type SafetyStatus = {
  abort: boolean;
  hold: boolean;
  reasons: string[];
};

export type SimMetrics = {
  positionError: number;
  lateralError: number;
  forwardError: number;
  closureRate: number;
  confidence: number;
  dockScore: number;
  alignmentError: number;
  dropoutCount: number;
  visibleTime: number;
};

export type MotionProfile = {
  translationAmplitude: Vec3;
  translationFrequency: Vec3;
  translationNoise: Vec3;
  rotationAmplitude: Euler3;
  rotationFrequency: Euler3;
};

export type PerceptionProfile = {
  positionNoise: number;
  pixelNoise: number;
  dropoutProbability: number;
  confidenceFloor: number;
};

export type ControllerProfile = {
  alignTolerance: number;
  insertTolerance: number;
  dockTolerance: number;
  standbyExtend: number;
};

export type SafetyProfile = {
  keepOutRadius: number;
  nearTargetDistance: number;
};

export type ScenarioPreset = {
  id: string;
  name: string;
  description: string;
  receiverBasePose: Pose;
  motion: MotionProfile;
  perception: PerceptionProfile;
  controller: ControllerProfile;
  safety: SafetyProfile;
};

export type SensorFrame = {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  updatedAt: number;
};

export type LiveSimState = {
  simTime: number;
  frame: number;
  receiverPose: Pose;
  targetPose: Pose;
  boom: BoomJointState;
  command: BoomCommand;
  controllerState: ControllerState;
  estimate: PerceptionEstimate;
  tracker: TrackerState;
  safety: SafetyStatus;
  metrics: SimMetrics;
  abortReason: string | null;
};

export type ReplaySample = LiveSimState & {
  recordedAt: number;
};
