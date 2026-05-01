import type {
  EnvironmentProfile,
  JourneyScenario,
  MissionProfile,
  ScenarioPreset,
  SensorPolicy,
} from "@/lib/sim/types";

const passiveSensorPolicy: SensorPolicy = {
  passiveOnly: true,
  allowVisible: true,
  allowThermal: true,
  terminalHandoffRange: 7.2,
  terminalCommitRange: 3.9,
  reacquireRange: 10.8,
  activeAssistanceEnabled: false,
};

const sharedEnvironment: EnvironmentProfile = {
  id: "airport-terminal-day",
  name: "Airport terminal / day",
  timeOfDay: "day",
  surfaceType: "land",
  emissionMode: "normal",
  description: "Indoor checkpoint and concourse routing with bright landmarks and mixed crowd density.",
  visibleSNR: 1,
  thermalContrast: 0.7,
  horizonAmbiguity: 0.08,
  glint: 0.02,
  clearColor: "#0d1116",
  fogColor: "#121a22",
  fogDensity: 0.008,
  ambientIntensity: 0.45,
  keyLightIntensity: 1.45,
  fillLightIntensity: 0.55,
  keyLightColor: "#e6dcc7",
  fillLightColor: "#7a93b3",
  keyLightAzimuth: 0.72,
  keyLightElevation: 0.84,
  backgroundPreset: "land",
};

const eveningEnvironment: EnvironmentProfile = {
  ...sharedEnvironment,
  id: "airport-terminal-evening",
  name: "Airport terminal / evening",
  description: "Lower-contrast terminal lighting where landmark clarity matters more for low-vision travel.",
  clearColor: "#090c11",
  fogColor: "#0f141c",
  ambientIntensity: 0.34,
  keyLightIntensity: 1.12,
  fillLightIntensity: 0.4,
};

const confidenceMission: MissionProfile = {
  id: "confidence-first",
  name: "Confidence-first mobility",
  description: "Choose routes that reduce ambiguity, surface landmarks early, and reroute before hazards become stressful.",
  emissionMode: "normal",
  passiveOnly: true,
  supportsNight: true,
  supportsWater: false,
  supportsEmcon: false,
};

const rerouteMission: MissionProfile = {
  id: "dynamic-reroute",
  name: "Dynamic hazard rerouting",
  description: "Timed closures and queue changes force the route planner to react while keeping prompts calm.",
  emissionMode: "normal",
  passiveOnly: true,
  supportsNight: true,
  supportsWater: false,
  supportsEmcon: false,
};

function makeBaseJourney({
  destinationNodeId,
  destinationLabel,
  blockedEdgeId,
  hazardStartsAt,
  baselineSummary,
  pathlightSummary,
}: {
  destinationNodeId: string;
  destinationLabel: string;
  blockedEdgeId: string | null;
  hazardStartsAt?: number;
  baselineSummary: string;
  pathlightSummary: string;
}): JourneyScenario {
  return {
    originNodeId: "curb-entry",
    destinationNodeId,
    environmentLabel: "Terminal A checkpoint and concourse",
    destinationLabel,
    landmarks: [
      {
        id: "help-desk",
        label: "Help desk",
        kind: "service",
        position: { x: -5, y: 0.2, z: 6 },
        clockHint: "10 o'clock",
        visibilityBoost: 0.95,
      },
      {
        id: "security-arch",
        label: "Security arch",
        kind: "checkpoint",
        position: { x: 0, y: 0.2, z: 13.6 },
        clockHint: "12 o'clock",
        visibilityBoost: 0.9,
      },
      {
        id: "elevator-bank",
        label: "Elevator bank",
        kind: "elevator",
        position: { x: -6.4, y: 0.2, z: 23.5 },
        clockHint: "9 o'clock",
        visibilityBoost: 0.86,
      },
      {
        id: "window-wall",
        label: "Window wall",
        kind: "landmark",
        position: { x: 9.8, y: 0.2, z: 27 },
        clockHint: "2 o'clock",
        visibilityBoost: 0.78,
      },
      {
        id: "charging-lounge",
        label: "Charging lounge",
        kind: "service",
        position: { x: -8, y: 0.2, z: 30.4 },
        clockHint: "8 o'clock",
        visibilityBoost: 0.7,
      },
      {
        id: "gate-beacon",
        label: destinationLabel,
        kind: "gate",
        position: destinationNodeId === "gate-b12" ? { x: 10, y: 0.2, z: 35 } : { x: -10, y: 0.2, z: 35 },
        clockHint: destinationNodeId === "gate-b12" ? "2 o'clock" : "10 o'clock",
        visibilityBoost: 1,
      },
    ],
    nodes: [
      { id: "curb-entry", label: "Curb entry", kind: "origin", position: { x: 0, y: 0, z: 0 }, landmarkId: "help-desk", openAreaPenalty: 0.35, signageClarity: 0.55 },
      { id: "checkin", label: "Check-in spine", kind: "corridor", position: { x: 0, y: 0, z: 7 }, landmarkId: "help-desk", openAreaPenalty: 0.42, signageClarity: 0.58 },
      { id: "checkpoint-entry", label: "Security queue", kind: "checkpoint", position: { x: 0, y: 0, z: 12 }, landmarkId: "security-arch", openAreaPenalty: 0.2, signageClarity: 0.8 },
      { id: "checkpoint-exit", label: "Post-checkpoint junction", kind: "junction", position: { x: 0, y: 0, z: 18 }, landmarkId: "security-arch", openAreaPenalty: 0.38, signageClarity: 0.74 },
      { id: "elevator-lobby", label: "Elevator lobby", kind: "elevator", position: { x: -6, y: 0, z: 23 }, landmarkId: "elevator-bank", openAreaPenalty: 0.18, signageClarity: 0.9 },
      { id: "north-corridor", label: "North corridor", kind: "corridor", position: { x: 7, y: 0, z: 25 }, landmarkId: "window-wall", openAreaPenalty: 0.65, signageClarity: 0.46 },
      { id: "south-corridor", label: "South corridor", kind: "corridor", position: { x: -7, y: 0, z: 29 }, landmarkId: "charging-lounge", openAreaPenalty: 0.22, signageClarity: 0.76 },
      { id: "gate-b12", label: "Gate B12", kind: "destination", position: { x: 10, y: 0, z: 35 }, landmarkId: "gate-beacon", openAreaPenalty: 0.08, signageClarity: 0.92 },
      { id: "gate-c4", label: "Gate C4", kind: "destination", position: { x: -10, y: 0, z: 35 }, landmarkId: "gate-beacon", openAreaPenalty: 0.08, signageClarity: 0.92 },
    ],
    edges: [
      { id: "entry-checkin", from: "curb-entry", to: "checkin", length: 7, turnComplexity: 0.1, obstacleExposure: 0.12, crowdPenalty: 0.22, landmarkClarity: 0.9, lowVisionFriendly: true, accessible: true, stairs: false, elevator: false, openAreaPenalty: 0.3 },
      { id: "checkin-checkpoint", from: "checkin", to: "checkpoint-entry", length: 5, turnComplexity: 0.15, obstacleExposure: 0.18, crowdPenalty: 0.36, landmarkClarity: 0.88, lowVisionFriendly: true, accessible: true, stairs: false, elevator: false, openAreaPenalty: 0.26 },
      { id: "checkpoint-lanes", from: "checkpoint-entry", to: "checkpoint-exit", length: 6, turnComplexity: 0.18, obstacleExposure: 0.42, crowdPenalty: 0.55, landmarkClarity: 0.8, lowVisionFriendly: true, accessible: true, stairs: false, elevator: false, openAreaPenalty: 0.18 },
      { id: "checkpoint-north", from: "checkpoint-exit", to: "north-corridor", length: 10, turnComplexity: 0.55, obstacleExposure: 0.66, crowdPenalty: 0.7, landmarkClarity: 0.42, lowVisionFriendly: false, accessible: true, stairs: false, elevator: false, openAreaPenalty: 0.72 },
      { id: "checkpoint-elevator", from: "checkpoint-exit", to: "elevator-lobby", length: 7.5, turnComplexity: 0.2, obstacleExposure: 0.16, crowdPenalty: 0.24, landmarkClarity: 0.92, lowVisionFriendly: true, accessible: true, stairs: false, elevator: true, openAreaPenalty: 0.14 },
      { id: "elevator-south", from: "elevator-lobby", to: "south-corridor", length: 6.2, turnComplexity: 0.18, obstacleExposure: 0.12, crowdPenalty: 0.18, landmarkClarity: 0.86, lowVisionFriendly: true, accessible: true, stairs: false, elevator: true, openAreaPenalty: 0.16 },
      { id: "north-gate-b12", from: "north-corridor", to: "gate-b12", length: 10.5, turnComplexity: 0.16, obstacleExposure: 0.18, crowdPenalty: 0.34, landmarkClarity: 0.64, lowVisionFriendly: true, accessible: true, stairs: false, elevator: false, openAreaPenalty: 0.28 },
      { id: "south-gate-c4", from: "south-corridor", to: "gate-c4", length: 6.5, turnComplexity: 0.12, obstacleExposure: 0.12, crowdPenalty: 0.2, landmarkClarity: 0.92, lowVisionFriendly: true, accessible: true, stairs: false, elevator: false, openAreaPenalty: 0.12 },
      { id: "south-connector", from: "south-corridor", to: "gate-b12", length: 17, turnComplexity: 0.38, obstacleExposure: 0.22, crowdPenalty: 0.18, landmarkClarity: 0.84, lowVisionFriendly: true, accessible: true, stairs: false, elevator: false, openAreaPenalty: 0.18 },
    ],
    hazards: blockedEdgeId && hazardStartsAt
      ? [
          {
            id: `${blockedEdgeId}-closure`,
            label: "temporary corridor closure",
            edgeId: blockedEdgeId,
            startsAt: hazardStartsAt,
            severity: "warn",
            note: "A temporary barrier changes the usual walking path.",
            rerouteNote: "Barrier detected ahead. Pathlight is switching to a calmer, landmark-rich route before the closure becomes confusing.",
          },
        ]
      : [],
    baselineSummary,
    pathlightSummary,
  };
}

const scenarioPresets: ScenarioPreset[] = [
  {
    id: "steady-approach",
    name: "Normal route",
    description: "A clean trip from terminal entry to Gate B12. The improved route favors landmarks and calmer turns instead of pure shortest distance.",
    receiverBasePose: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
    motion: {
      translationAmplitude: { x: 0, y: 0, z: 0 },
      translationFrequency: { x: 0, y: 0, z: 0 },
      translationNoise: { x: 0, y: 0, z: 0 },
      rotationAmplitude: { x: 0, y: 0, z: 0 },
      rotationFrequency: { x: 0, y: 0, z: 0 },
    },
    environment: sharedEnvironment,
    mission: confidenceMission,
    sensorPolicy: passiveSensorPolicy,
    perception: {
      positionNoise: 0.03,
      pixelNoise: 0.01,
      dropoutProbability: 0.01,
      confidenceFloor: 0.55,
    },
    controller: {
      alignTolerance: 0.3,
      insertTolerance: 0.2,
      mateTolerance: 0.12,
      standbyExtend: 0,
      searchAmplitude: { x: 0, y: 0, z: 0 },
      closureGain: 0,
      maxBodyStep: 0,
    },
    safety: {
      keepOutRadius: 0,
      nearTargetDistance: 0,
      maxClosureRate: 1,
      sensorDisagreementAbort: 1,
      sensorDisagreementHold: 1,
      receiverMotionSpike: 1,
    },
    journey: makeBaseJourney({
      destinationNodeId: "gate-b12",
      destinationLabel: "Gate B12",
      blockedEdgeId: null,
      baselineSummary: "Baseline chooses the shorter north corridor even though it is visually ambiguous and easier to drift through.",
      pathlightSummary: "Pathlight slightly lengthens the trip to stay landmark-rich, lower stress, and easier to follow.",
    }),
  },
  {
    id: "crosswind-chase",
    name: "Blocked corridor",
    description: "The usual north corridor closes mid-journey. Pathlight reroutes early toward the elevator lobby and south corridor before the traveler reaches the barrier.",
    receiverBasePose: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
    motion: {
      translationAmplitude: { x: 0, y: 0, z: 0 },
      translationFrequency: { x: 0, y: 0, z: 0 },
      translationNoise: { x: 0, y: 0, z: 0 },
      rotationAmplitude: { x: 0, y: 0, z: 0 },
      rotationFrequency: { x: 0, y: 0, z: 0 },
    },
    environment: sharedEnvironment,
    mission: rerouteMission,
    sensorPolicy: passiveSensorPolicy,
    perception: {
      positionNoise: 0.04,
      pixelNoise: 0.012,
      dropoutProbability: 0.02,
      confidenceFloor: 0.52,
    },
    controller: {
      alignTolerance: 0.3,
      insertTolerance: 0.2,
      mateTolerance: 0.12,
      standbyExtend: 0,
      searchAmplitude: { x: 0, y: 0, z: 0 },
      closureGain: 0,
      maxBodyStep: 0,
    },
    safety: {
      keepOutRadius: 0,
      nearTargetDistance: 0,
      maxClosureRate: 1,
      sensorDisagreementAbort: 1,
      sensorDisagreementHold: 1,
      receiverMotionSpike: 1,
    },
    journey: makeBaseJourney({
      destinationNodeId: "gate-b12",
      destinationLabel: "Gate B12",
      blockedEdgeId: "checkpoint-north",
      hazardStartsAt: 8.2,
      baselineSummary: "Baseline commits to the short route, reaches the closure late, and spends extra time correcting.",
      pathlightSummary: "Pathlight sees the closure early and shifts the traveler to the elevator-side corridor before confusion spikes.",
    }),
  },
  {
    id: "sensor-degraded",
    name: "Elevator reroute",
    description: "Evening lighting and stronger low-vision penalties make the route planner value simpler geometry and elevator access over the shortest open-floor path.",
    receiverBasePose: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
    motion: {
      translationAmplitude: { x: 0, y: 0, z: 0 },
      translationFrequency: { x: 0, y: 0, z: 0 },
      translationNoise: { x: 0, y: 0, z: 0 },
      rotationAmplitude: { x: 0, y: 0, z: 0 },
      rotationFrequency: { x: 0, y: 0, z: 0 },
    },
    environment: eveningEnvironment,
    mission: confidenceMission,
    sensorPolicy: passiveSensorPolicy,
    perception: {
      positionNoise: 0.05,
      pixelNoise: 0.018,
      dropoutProbability: 0.02,
      confidenceFloor: 0.5,
    },
    controller: {
      alignTolerance: 0.3,
      insertTolerance: 0.2,
      mateTolerance: 0.12,
      standbyExtend: 0,
      searchAmplitude: { x: 0, y: 0, z: 0 },
      closureGain: 0,
      maxBodyStep: 0,
    },
    safety: {
      keepOutRadius: 0,
      nearTargetDistance: 0,
      maxClosureRate: 1,
      sensorDisagreementAbort: 1,
      sensorDisagreementHold: 1,
      receiverMotionSpike: 1,
    },
    journey: makeBaseJourney({
      destinationNodeId: "gate-c4",
      destinationLabel: "Gate C4",
      blockedEdgeId: null,
      baselineSummary: "Baseline still prefers the wider, lower-signage corridor even though it is harder to visually parse at dusk.",
      pathlightSummary: "Pathlight stays near elevator and lounge landmarks so low-vision wayfinding stays readable under lower contrast.",
    }),
  },
  {
    id: "night-water-passive",
    name: "Checkpoint congestion",
    description: "Queue pressure and a crowded checkpoint exit make the improved route favor a slightly longer but calmer corridor after security.",
    receiverBasePose: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
    motion: {
      translationAmplitude: { x: 0, y: 0, z: 0 },
      translationFrequency: { x: 0, y: 0, z: 0 },
      translationNoise: { x: 0, y: 0, z: 0 },
      rotationAmplitude: { x: 0, y: 0, z: 0 },
      rotationFrequency: { x: 0, y: 0, z: 0 },
    },
    environment: sharedEnvironment,
    mission: rerouteMission,
    sensorPolicy: passiveSensorPolicy,
    perception: {
      positionNoise: 0.04,
      pixelNoise: 0.015,
      dropoutProbability: 0.015,
      confidenceFloor: 0.54,
    },
    controller: {
      alignTolerance: 0.3,
      insertTolerance: 0.2,
      mateTolerance: 0.12,
      standbyExtend: 0,
      searchAmplitude: { x: 0, y: 0, z: 0 },
      closureGain: 0,
      maxBodyStep: 0,
    },
    safety: {
      keepOutRadius: 0,
      nearTargetDistance: 0,
      maxClosureRate: 1,
      sensorDisagreementAbort: 1,
      sensorDisagreementHold: 1,
      receiverMotionSpike: 1,
    },
    journey: makeBaseJourney({
      destinationNodeId: "gate-b12",
      destinationLabel: "Gate B12",
      blockedEdgeId: "checkpoint-lanes",
      hazardStartsAt: 5.6,
      baselineSummary: "Baseline stays in the densest flow and piles up correction prompts while the crowd compresses the route.",
      pathlightSummary: "Pathlight transitions earlier toward the calmer side corridor to keep cognitive load and hazard exposure lower.",
    }),
  },
];

export { scenarioPresets };

export function getScenarioById(scenarioId: string) {
  return scenarioPresets.find((scenario) => scenario.id === scenarioId) ?? scenarioPresets[0];
}

export function getDefaultScenario() {
  return scenarioPresets[0];
}

export const JOURNEY_STATE_SEQUENCE = [
  "SEARCH",
  "ACQUIRE",
  "TRACK",
  "ALIGN",
  "INSERT",
  "MATED",
] as const;
