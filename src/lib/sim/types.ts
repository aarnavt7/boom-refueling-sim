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

export type CameraMode = "manual" | "receiver-lock" | "dock-lock";

export type GamepadDeviceType = "none" | "xbox" | "standard-gamepad";

export type GamepadUiMode = "viewport" | "hud" | "overlay";

export type GamepadAction =
  | "confirm"
  | "back"
  | "context"
  | "cycleCamera"
  | "groupPrev"
  | "groupNext"
  | "recenter"
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "zoomIn"
  | "zoomOut";

export type ReplayDataSource = "session" | "autonomy";

export type EvaluationView = "baseline" | "uploaded" | "overlay";

export type AircraftCardId =
  | "kc46_f15"
  | "kc135_f16"
  | "kc10_f22"
  | "a330_rafale";

export type Pose = {
  position: Vec3;
  rotation: Euler3;
};

export type TimeOfDay = "day" | "night";

export type SurfaceType = "land" | "water";

export type EmissionMode = "normal" | "EMCON";

export type SensorMountId =
  | "tail-acq-left"
  | "tail-acq-right"
  | "boom-term-left"
  | "boom-term-right";

export type SensorRole = "acquire" | "terminal";

export type SensorModality = "visible" | "thermal";

export type SensorViewportSource = "auto" | SensorMountId;

export type SensorViewportModality = "auto" | SensorModality;

export type ControllerState =
  | "SEARCH"
  | "ACQUIRE"
  | "TRACK"
  | "ALIGN"
  | "INSERT"
  | "MATED"
  | "HOLD"
  | "ABORT"
  | "BREAKAWAY";

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

export type SensorRigDefinition = {
  id: SensorMountId;
  name: string;
  role: SensorRole;
  supportedModalities: SensorModality[];
  /** Local offset from either the boom root (`tail-*`) or boom tip (`boom-term-*`). */
  localOffset: Vec3;
  /** Local mount rotation relative to the parent frame. */
  localRotation: Euler3;
  fovDeg: number;
  aspect: number;
  near: number;
  far: number;
  maxRange: number;
  stereoPartner?: SensorMountId;
};

export type SensorObservation = {
  sensorId: SensorMountId;
  sensorName: string;
  role: SensorRole;
  modality: SensorModality;
  visible: boolean;
  dropout: boolean;
  confidence: number;
  estimatedPosition: Vec3 | null;
  estimatedPose: Pose | null;
  imagePoint: Vec2 | null;
  cameraSpacePosition: Vec3 | null;
  range: number;
  usedForTrack: boolean;
  notes: string[];
};

export type PerceptionEstimate = SensorObservation;

export type FusedReceptacleTrack = {
  pose: Pose | null;
  position: Vec3 | null;
  velocity: Vec3;
  confidence: number;
  covariance: Vec3;
  activeSensorIds: SensorMountId[];
  preferredRole: SensorRole;
  disagreement: number;
  lost: boolean;
};

export type TrackerState = FusedReceptacleTrack;

export type DesiredTipMotion = {
  deltaBody: Vec3;
  mode: "track" | "hold" | "retract" | "breakaway";
};

export type AutopilotCommandECEF = {
  dx: number;
  dy: number;
  dz: number;
  magnitude: number;
  clamped: boolean;
  mode: DesiredTipMotion["mode"];
};

export type EnvironmentProfile = {
  id: string;
  name: string;
  timeOfDay: TimeOfDay;
  surfaceType: SurfaceType;
  emissionMode: EmissionMode;
  description: string;
  /** Visible-spectrum quality multiplier. */
  visibleSNR: number;
  /** Thermal contrast quality multiplier. */
  thermalContrast: number;
  /** Horizon/background ambiguity penalty. */
  horizonAmbiguity: number;
  /** Water glint / reflection penalty. */
  glint: number;
  /** Scene styling helpers for the 3D view. */
  clearColor: string;
  fogColor: string;
  fogDensity: number;
  ambientIntensity: number;
  keyLightIntensity: number;
  fillLightIntensity: number;
  keyLightColor: string;
  fillLightColor: string;
  keyLightAzimuth: number;
  keyLightElevation: number;
  backgroundPreset: "land" | "water";
};

export type MissionProfile = {
  id: string;
  name: string;
  description: string;
  emissionMode: EmissionMode;
  passiveOnly: boolean;
  supportsNight: boolean;
  supportsWater: boolean;
  supportsEmcon: boolean;
};

export type SensorPolicy = {
  passiveOnly: boolean;
  allowVisible: boolean;
  allowThermal: boolean;
  terminalHandoffRange: number;
  terminalCommitRange: number;
  reacquireRange: number;
  activeAssistanceEnabled: boolean;
};

export type SafetyStatus = {
  abort: boolean;
  hold: boolean;
  breakaway: boolean;
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
  sensorDisagreement: number;
  activeSensorCount: number;
  trackRange: number;
  commandMagnitude: number;
  distanceRemaining?: number;
  correctionCount?: number;
  rerouteCount?: number;
  hazardExposure?: number;
  landmarkCoverage?: number;
  routeClarity?: number;
  accessibilityScore?: number;
  confidenceGain?: number;
  travelProgress?: number;
  offRouteEvents?: number;
};

export type UploadedAutonomyManifest = {
  controllerName: string | null;
  controllerSource: string | null;
  missionName: string | null;
  missionJson: string | null;
  uploadedAt: number | null;
};

export type AutonomyMissionSample = {
  time: number;
  positionDelta?: Vec3;
  rotationDelta?: Euler3;
  note?: string;
};

export type AutonomyControllerOutput = {
  positionDelta?: Vec3;
  rotationDelta?: Euler3;
  label?: string;
};

export type Landmark = {
  id: string;
  label: string;
  kind: "landmark" | "checkpoint" | "service" | "elevator" | "gate" | "hazard";
  position: Vec3;
  clockHint: string;
  visibilityBoost: number;
};

export type EnvironmentNode = {
  id: string;
  label: string;
  kind:
    | "origin"
    | "junction"
    | "checkpoint"
    | "corridor"
    | "elevator"
    | "gate"
    | "service"
    | "destination";
  position: Vec3;
  landmarkId?: string | null;
  openAreaPenalty: number;
  signageClarity: number;
};

export type EnvironmentEdge = {
  id: string;
  from: string;
  to: string;
  length: number;
  turnComplexity: number;
  obstacleExposure: number;
  crowdPenalty: number;
  landmarkClarity: number;
  lowVisionFriendly: boolean;
  accessible: boolean;
  stairs: boolean;
  elevator: boolean;
  openAreaPenalty: number;
};

export type HazardEvent = {
  id: string;
  label: string;
  edgeId: string;
  startsAt: number;
  severity: "notice" | "warn" | "critical";
  note: string;
  rerouteNote: string;
};

export type AccessibilityProfile = {
  id: string;
  name: string;
  subtitle: string;
  assistiveMode: "blind" | "low-vision";
  prefersLandmarks: boolean;
  prefersLowComplexity: boolean;
  avoidsStairs: boolean;
  crowdTolerance: number;
  previewLabel: string;
};

export type GuidancePrompt = {
  title: string;
  primary: string;
  landmark: string;
  safetyNote: string;
  clockHint: string;
  distanceLabel: string;
  previewLabel: string;
};

export type JourneyStrategy = "baseline" | "pathlight";

export type JourneyRoutePlan = {
  strategy: JourneyStrategy;
  nodeIds: string[];
  edgeIds: string[];
  points: Vec3[];
  totalDistance: number;
  accessibilityScore: number;
  confusionRisk: number;
  landmarkCoverage: number;
  hazardExposure: number;
};

export type JourneySnapshot = {
  strategy: JourneyStrategy;
  currentNodeId: string;
  nextNodeId: string | null;
  originNodeId: string;
  destinationNodeId: string;
  progress: number;
  distanceTraveled: number;
  distanceRemaining: number;
  correctionCount: number;
  rerouteCount: number;
  offRouteEvents: number;
  activeHazards: string[];
  routePlan: JourneyRoutePlan;
  guidancePrompt: GuidancePrompt;
  notes: string[];
  assistiveMode: AccessibilityProfile["assistiveMode"];
};

export type JourneyScenario = {
  originNodeId: string;
  destinationNodeId: string;
  environmentLabel: string;
  destinationLabel: string;
  landmarks: Landmark[];
  nodes: EnvironmentNode[];
  edges: EnvironmentEdge[];
  hazards: HazardEvent[];
  baselineSummary: string;
  pathlightSummary: string;
};

export type AutonomyFrameInput = {
  frame: number;
  simTime: number;
  controllerState: ControllerState;
  receiverPose: Pose;
  targetPose: Pose;
  tracker: TrackerState;
  metrics: SimMetrics;
  missionSample: AutonomyMissionSample | null;
  previousOutput: AutonomyControllerOutput | null;
};

export type AutonomyAnalyticsPoint = {
  simTime: number;
  baselinePositionError: number;
  uploadedPositionError: number;
  baselineLateralError: number;
  uploadedLateralError: number;
  baselineForwardError: number;
  uploadedForwardError: number;
  baselineVerticalOffset: number;
  uploadedVerticalOffset: number;
  baselineConfidence: number;
  uploadedConfidence: number;
  receiverDistanceOffset: number;
};

export type AutonomyAnalyticsSummary = {
  success: boolean;
  outcomeLabel: string;
  timeToDock: number | null;
  meanDistanceOffset: number;
  p95DistanceOffset: number;
  meanLateralOffset: number;
  p95LateralOffset: number;
  meanVerticalOffset: number;
  p95VerticalOffset: number;
  meanForwardOffset: number;
  p95ForwardOffset: number;
  missDistance: number;
  meanClosureRate: number;
  maxClosureRate: number;
  timeInEnvelope: number;
  averageConfidence: number;
  dropoutRate: number;
  safetyEventCount: number;
  oscillationScore: number;
};

export type AutonomyAnalyticsReport = {
  manifest: UploadedAutonomyManifest | null;
  generatedAt: number;
  notes: string[];
  summary: AutonomyAnalyticsSummary;
  points: AutonomyAnalyticsPoint[];
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
  mateTolerance: number;
  standbyExtend: number;
  searchAmplitude: Vec3;
  closureGain: number;
  maxBodyStep: number;
};

export type SafetyProfile = {
  keepOutRadius: number;
  nearTargetDistance: number;
  maxClosureRate: number;
  sensorDisagreementAbort: number;
  sensorDisagreementHold: number;
  receiverMotionSpike: number;
};

export type ScenarioPreset = {
  id: string;
  name: string;
  description: string;
  receiverBasePose: Pose;
  motion: MotionProfile;
  environment: EnvironmentProfile;
  mission: MissionProfile;
  sensorPolicy: SensorPolicy;
  perception: PerceptionProfile;
  controller: ControllerProfile;
  safety: SafetyProfile;
  journey?: JourneyScenario;
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
  autopilotCommand: AutopilotCommandECEF;
  command: BoomCommand;
  controllerState: ControllerState;
  sensorObservations: SensorObservation[];
  estimate: PerceptionEstimate;
  tracker: TrackerState;
  safety: SafetyStatus;
  metrics: SimMetrics;
  abortReason: string | null;
  journey?: JourneySnapshot;
};

export type ReplaySample = LiveSimState & {
  recordedAt: number;
};

export type AutonomyEvaluationBundle = {
  baselineReplaySamples: ReplaySample[];
  uploadedReplaySamples: ReplaySample[];
  report: AutonomyAnalyticsReport;
};
