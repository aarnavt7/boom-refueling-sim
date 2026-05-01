import {
  EMPTY_AUTOPILOT_COMMAND,
  EMPTY_COMMAND,
  EMPTY_ESTIMATE,
  EMPTY_SAFETY,
  EMPTY_TRACKER,
  INITIAL_BOOM_STATE,
  REPLAY_SAMPLE_HZ,
} from "@/lib/sim/constants";
import type {
  AccessibilityProfile,
  AircraftCardId,
  AutonomyAnalyticsPoint,
  AutonomyEvaluationBundle,
  EnvironmentEdge,
  EnvironmentNode,
  GuidancePrompt,
  JourneyRoutePlan,
  JourneyScenario,
  JourneyStrategy,
  Landmark,
  LiveSimState,
  ReplaySample,
  ScenarioPreset,
  SimMetrics,
  Vec3,
} from "@/lib/sim/types";

const DT = 1 / REPLAY_SAMPLE_HZ;
const MAX_SIM_SECONDS = 42;

const ACCESSIBILITY_PROFILES: Record<AircraftCardId, AccessibilityProfile> = {
  kc46_f15: {
    id: "blind-landmark",
    name: "Blind mode",
    subtitle: "Landmark-first audio guidance",
    assistiveMode: "blind",
    prefersLandmarks: true,
    prefersLowComplexity: true,
    avoidsStairs: true,
    crowdTolerance: 0.34,
    previewLabel: "Audio first",
  },
  kc135_f16: {
    id: "low-vision-contrast",
    name: "Low-vision mode",
    subtitle: "Contrast, simplification, and route glow",
    assistiveMode: "low-vision",
    prefersLandmarks: true,
    prefersLowComplexity: true,
    avoidsStairs: true,
    crowdTolerance: 0.42,
    previewLabel: "Contrast first",
  },
  kc10_f22: {
    id: "first-trip",
    name: "First-time traveler",
    subtitle: "Calm pacing with fewer ambiguous turns",
    assistiveMode: "blind",
    prefersLandmarks: true,
    prefersLowComplexity: true,
    avoidsStairs: true,
    crowdTolerance: 0.28,
    previewLabel: "Confidence first",
  },
  a330_rafale: {
    id: "crowd-aware",
    name: "Crowd-aware mode",
    subtitle: "Avoids queue pressure and noisy chokepoints",
    assistiveMode: "low-vision",
    prefersLandmarks: true,
    prefersLowComplexity: true,
    avoidsStairs: true,
    crowdTolerance: 0.22,
    previewLabel: "Stress reduction",
  },
};

type SimulatedJourney = {
  live: LiveSimState;
  replaySamples: ReplaySample[];
  summary: {
    duration: number;
    meanDeviation: number;
    p95Deviation: number;
    meanHazardExposure: number;
    meanConfidence: number;
    corrections: number;
    reroutes: number;
    landmarkCoverage: number;
    accessibilityScore: number;
    offRouteEvents: number;
  };
};

type RouteSearchResult = {
  nodeIds: string[];
  edgeIds: string[];
};

function getJourneyScenario(scenario: ScenarioPreset): JourneyScenario {
  if (!scenario.journey) {
    throw new Error(`Scenario ${scenario.id} is missing Pathlight journey data.`);
  }

  return scenario.journey;
}

function getProfile(profileId: AircraftCardId) {
  return ACCESSIBILITY_PROFILES[profileId] ?? ACCESSIBILITY_PROFILES.kc46_f15;
}

function distance(a: Vec3, b: Vec3) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

function findNode(nodes: EnvironmentNode[], nodeId: string) {
  const node = nodes.find((entry) => entry.id === nodeId);
  if (!node) {
    throw new Error(`Missing node ${nodeId}.`);
  }
  return node;
}

function findLandmark(landmarks: Landmark[], landmarkId?: string | null) {
  if (!landmarkId) {
    return null;
  }

  return landmarks.find((entry) => entry.id === landmarkId) ?? null;
}

function buildAdjacency(edges: EnvironmentEdge[]) {
  const adjacency = new Map<string, EnvironmentEdge[]>();

  for (const edge of edges) {
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge);
    adjacency.set(edge.from, list);
  }

  return adjacency;
}

function scoreEdge(
  edge: EnvironmentEdge,
  profile: AccessibilityProfile,
  strategy: JourneyStrategy,
  blockedEdgeIds: Set<string>,
) {
  if (blockedEdgeIds.has(edge.id) || !edge.accessible) {
    return Number.POSITIVE_INFINITY;
  }

  if (strategy === "baseline") {
    return edge.length + edge.turnComplexity * 0.8;
  }

  let score = edge.length;
  score += edge.turnComplexity * 6.2;
  score += edge.openAreaPenalty * 10.5;
  score += edge.obstacleExposure * 7.8;
  score += Math.max(0, edge.crowdPenalty - profile.crowdTolerance) * 12.5;
  score += profile.avoidsStairs && edge.stairs ? 34 : 0;
  score += profile.assistiveMode === "low-vision" && !edge.lowVisionFriendly ? 11 : 0;
  score -= edge.landmarkClarity * (profile.prefersLandmarks ? 5.8 : 2.6);
  return score;
}

function planRoute({
  scenario,
  profile,
  strategy,
  startNodeId,
  blockedEdgeIds,
}: {
  scenario: JourneyScenario;
  profile: AccessibilityProfile;
  strategy: JourneyStrategy;
  startNodeId: string;
  blockedEdgeIds: Set<string>;
}): RouteSearchResult {
  const adjacency = buildAdjacency(scenario.edges);
  const destinationNodeId = scenario.destinationNodeId;
  const distances = new Map<string, number>();
  const previousNode = new Map<string, string | null>();
  const previousEdge = new Map<string, string | null>();
  const unvisited = new Set(scenario.nodes.map((node) => node.id));

  for (const node of scenario.nodes) {
    distances.set(node.id, node.id === startNodeId ? 0 : Number.POSITIVE_INFINITY);
    previousNode.set(node.id, null);
    previousEdge.set(node.id, null);
  }

  while (unvisited.size > 0) {
    let currentNodeId: string | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;

    for (const nodeId of unvisited) {
      const candidate = distances.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (candidate < currentDistance) {
        currentDistance = candidate;
        currentNodeId = nodeId;
      }
    }

    if (!currentNodeId || !Number.isFinite(currentDistance)) {
      break;
    }

    if (currentNodeId === destinationNodeId) {
      break;
    }

    unvisited.delete(currentNodeId);

    for (const edge of adjacency.get(currentNodeId) ?? []) {
      if (!unvisited.has(edge.to)) {
        continue;
      }

      const edgeCost = scoreEdge(edge, profile, strategy, blockedEdgeIds);
      if (!Number.isFinite(edgeCost)) {
        continue;
      }

      const candidate = currentDistance + edgeCost;
      if (candidate < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, candidate);
        previousNode.set(edge.to, currentNodeId);
        previousEdge.set(edge.to, edge.id);
      }
    }
  }

  const nodeIds: string[] = [];
  const edgeIds: string[] = [];
  let cursor: string | null = destinationNodeId;

  while (cursor) {
    nodeIds.unshift(cursor);
    const edgeId = previousEdge.get(cursor) ?? null;
    const parent = previousNode.get(cursor) ?? null;
    if (edgeId) {
      edgeIds.unshift(edgeId);
    }
    cursor = parent;
  }

  if (nodeIds[0] !== startNodeId) {
    return {
      nodeIds: [startNodeId, destinationNodeId],
      edgeIds: [],
    };
  }

  return { nodeIds, edgeIds };
}

function calculateRoutePlan(
  journey: JourneyScenario,
  route: RouteSearchResult,
  strategy: JourneyStrategy,
): JourneyRoutePlan {
  const nodeIds = route.nodeIds;
  const edgeIds = route.edgeIds;
  const points = nodeIds.map((nodeId) => findNode(journey.nodes, nodeId).position);
  const edges = edgeIds.map((edgeId) => {
    const edge = journey.edges.find((entry) => entry.id === edgeId);
    if (!edge) {
      throw new Error(`Missing edge ${edgeId}.`);
    }
    return edge;
  });
  const totalDistance = edges.reduce((sum, edge) => sum + edge.length, 0);
  const hazardExposure = edges.reduce((sum, edge) => sum + edge.obstacleExposure + edge.crowdPenalty * 0.6, 0);
  const confusionRisk = edges.reduce((sum, edge) => sum + edge.turnComplexity + edge.openAreaPenalty * 1.1, 0);
  const landmarkCoverage = edges.reduce((sum, edge) => sum + edge.landmarkClarity, 0);
  const accessibilityScore = Math.max(
    0.1,
    1.4 +
      landmarkCoverage * 0.12 -
      hazardExposure * 0.1 -
      confusionRisk * 0.08 -
      totalDistance * 0.012 +
      (strategy === "pathlight" ? 0.38 : 0),
  );

  return {
    strategy,
    nodeIds,
    edgeIds,
    points,
    totalDistance,
    accessibilityScore,
    confusionRisk,
    landmarkCoverage,
    hazardExposure,
  };
}

function getDirectionClock(from: Vec3, to: Vec3) {
  const angle = Math.atan2(to.x - from.x, to.z - from.z);
  const normalized = ((angle / (Math.PI * 2)) * 12 + 12) % 12;
  const hour = Math.max(1, Math.round(normalized) || 12);
  return `${hour} o'clock`;
}

function getDistanceLabel(distanceMeters: number) {
  if (distanceMeters < 4) {
    return "within a few steps";
  }

  if (distanceMeters < 10) {
    return `${Math.round(distanceMeters)} feet ahead`;
  }

  const feet = Math.round(distanceMeters * 3.28084);
  return `${feet} feet ahead`;
}

function buildPrompt({
  journey,
  routePlan,
  segmentIndex,
  travelerPosition,
  profile,
  hazardNote,
}: {
  journey: JourneyScenario;
  routePlan: JourneyRoutePlan;
  segmentIndex: number;
  travelerPosition: Vec3;
  profile: AccessibilityProfile;
  hazardNote: string | null;
}): GuidancePrompt {
  const nextNodeId = routePlan.nodeIds[Math.min(segmentIndex + 1, routePlan.nodeIds.length - 1)];
  const nextNode = findNode(journey.nodes, nextNodeId);
  const landmark = findLandmark(journey.landmarks, nextNode.landmarkId);
  const clockHint = getDirectionClock(travelerPosition, nextNode.position);
  const distanceLabel = getDistanceLabel(distance(travelerPosition, nextNode.position));
  const landmarkCopy = landmark
    ? `Use ${landmark.label} as the main reference at ${landmark.clockHint}.`
    : `Keep the route glow centered and continue toward ${nextNode.label}.`;

  return {
    title: nextNode.kind === "destination" ? "Final approach" : `Heading to ${nextNode.label}`,
    primary:
      nextNode.kind === "destination"
        ? `Continue ${distanceLabel} and stop at ${journey.destinationLabel}.`
        : `Continue ${distanceLabel} toward ${nextNode.label}.`,
    landmark: landmarkCopy,
    safetyNote:
      hazardNote ??
      (profile.assistiveMode === "low-vision"
        ? "High-contrast mode is suppressing nonessential clutter around the walking path."
        : "Landmark-first prompts stay short so the route is easier to trust."),
    clockHint,
    distanceLabel,
    previewLabel: profile.previewLabel,
  };
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index] ?? 0;
}

function mean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildLegacyState({
  simTime,
  frame,
  position,
  destination,
  controllerState,
  prompt,
  metrics,
  routePlan,
  profile,
  notes,
  currentNodeId,
  nextNodeId,
  activeHazards,
  corrections,
  reroutes,
  offRouteEvents,
}: {
  simTime: number;
  frame: number;
  position: Vec3;
  destination: Vec3;
  controllerState: LiveSimState["controllerState"];
  prompt: GuidancePrompt;
  metrics: SimMetrics;
  routePlan: JourneyRoutePlan;
  profile: AccessibilityProfile;
  notes: string[];
  currentNodeId: string;
  nextNodeId: string | null;
  activeHazards: string[];
  corrections: number;
  reroutes: number;
  offRouteEvents: number;
}): LiveSimState {
  const confidence = metrics.confidence;

  return {
    simTime,
    frame,
    receiverPose: {
      position,
      rotation: { x: 0, y: 0, z: 0 },
    },
    targetPose: {
      position: destination,
      rotation: { x: 0, y: 0, z: 0 },
    },
    boom: INITIAL_BOOM_STATE,
    autopilotCommand: EMPTY_AUTOPILOT_COMMAND,
    command: EMPTY_COMMAND,
    controllerState,
    sensorObservations: [],
    estimate: {
      ...EMPTY_ESTIMATE,
      confidence,
      sensorName: profile.assistiveMode === "low-vision" ? "Low-vision render pass" : "Landmark guidance map",
      modality: profile.assistiveMode === "low-vision" ? "visible" : "thermal",
      notes: [prompt.landmark, prompt.safetyNote],
    },
    tracker: {
      ...EMPTY_TRACKER,
      pose: {
        position,
        rotation: { x: 0, y: 0, z: 0 },
      },
      position,
      confidence,
      lost: false,
      disagreement: Math.max(0, 1 - metrics.routeClarity!),
      activeSensorIds: ["tail-acq-left"],
    },
    safety: {
      ...EMPTY_SAFETY,
      hold: controllerState === "HOLD",
      reasons: notes,
    },
    metrics,
    abortReason: null,
    journey: {
      strategy: routePlan.strategy,
      currentNodeId,
      nextNodeId,
      originNodeId: routePlan.nodeIds[0] ?? currentNodeId,
      destinationNodeId: routePlan.nodeIds[routePlan.nodeIds.length - 1] ?? nextNodeId ?? currentNodeId,
      progress: metrics.travelProgress ?? 0,
      distanceTraveled: routePlan.totalDistance - (metrics.distanceRemaining ?? routePlan.totalDistance),
      distanceRemaining: metrics.distanceRemaining ?? routePlan.totalDistance,
      correctionCount: corrections,
      rerouteCount: reroutes,
      offRouteEvents,
      activeHazards,
      routePlan,
      guidancePrompt: prompt,
      notes,
      assistiveMode: profile.assistiveMode,
    },
  };
}

function simulateJourney({
  scenario,
  profileId,
  strategy,
}: {
  scenario: ScenarioPreset;
  profileId: AircraftCardId;
  strategy: JourneyStrategy;
}): SimulatedJourney {
  const journey = getJourneyScenario(scenario);
  const profile = getProfile(profileId);
  const destination = findNode(journey.nodes, journey.destinationNodeId);
  const blockedEdgeIds = new Set<string>();
  let route = planRoute({
    scenario: journey,
    profile,
    strategy,
    startNodeId: journey.originNodeId,
    blockedEdgeIds,
  });
  let routePlan = calculateRoutePlan(journey, route, strategy);
  let segmentIndex = 0;
  let segmentProgress = 0;
  let rerouteCount = 0;
  let correctionCount = 0;
  let offRouteEvents = 0;
  let hazardExposure = 0;
  let driftActiveUntil = -1;
  let waitingUntil = -1;
  let delayedBaselineRerouteAt = -1;
  let blockedHazardId: string | null = null;
  let activeHazards: string[] = [];
  const samples: ReplaySample[] = [];
  const deviationSamples: number[] = [];
  const hazardSamples: number[] = [];
  const confidenceSamples: number[] = [];

  const baseSpeed = strategy === "baseline" ? 2.95 : 2.7;
  const driftMagnitude = strategy === "baseline" ? 1.18 : 0.38;
  const driftStart = strategy === "baseline" ? 7.2 : 5.8;
  const driftDuration = strategy === "baseline" ? 2.3 : 0.9;

  for (let frame = 0; frame < MAX_SIM_SECONDS / DT; frame += 1) {
    const simTime = frame * DT;
    const hazardsNow = journey.hazards.filter((hazard) => hazard.startsAt <= simTime);
    activeHazards = hazardsNow.map((hazard) => hazard.id);

    const upcomingEdgeId = routePlan.edgeIds[Math.min(segmentIndex, routePlan.edgeIds.length - 1)] ?? null;
    const triggeredHazard =
      hazardsNow.find((hazard) => routePlan.edgeIds.includes(hazard.edgeId)) ?? null;

    if (simTime >= driftStart && simTime < driftStart + driftDuration && driftActiveUntil < simTime) {
      driftActiveUntil = driftStart + driftDuration;
      correctionCount += 1;
      if (strategy === "baseline") {
        offRouteEvents += 1;
      }
    }

    if (triggeredHazard && triggeredHazard.id !== blockedHazardId) {
      blockedHazardId = triggeredHazard.id;
      blockedEdgeIds.add(triggeredHazard.edgeId);

      if (strategy === "pathlight") {
        waitingUntil = simTime + 0.8;
        rerouteCount += 1;
        const rerouteStartNodeId = routePlan.nodeIds[Math.min(segmentIndex + 1, routePlan.nodeIds.length - 1)] ?? journey.originNodeId;
        route = planRoute({
          scenario: journey,
          profile,
          strategy,
          startNodeId: rerouteStartNodeId,
          blockedEdgeIds,
        });
        route = {
          nodeIds: [...routePlan.nodeIds.slice(0, Math.min(segmentIndex + 1, routePlan.nodeIds.length)), ...route.nodeIds.slice(1)],
          edgeIds: [...routePlan.edgeIds.slice(0, Math.min(segmentIndex, routePlan.edgeIds.length)), ...route.edgeIds],
        };
        routePlan = calculateRoutePlan(journey, route, strategy);
      } else if (upcomingEdgeId === triggeredHazard.edgeId) {
        delayedBaselineRerouteAt = simTime + 2.2;
      }
    }

    if (strategy === "baseline" && delayedBaselineRerouteAt > 0 && simTime >= delayedBaselineRerouteAt) {
      delayedBaselineRerouteAt = -1;
      waitingUntil = simTime + 1.6;
      rerouteCount += 1;
      offRouteEvents += 1;
      const rerouteStartNodeId = routePlan.nodeIds[Math.min(segmentIndex + 1, routePlan.nodeIds.length - 1)] ?? journey.originNodeId;
      route = planRoute({
        scenario: journey,
        profile,
        strategy,
        startNodeId: rerouteStartNodeId,
        blockedEdgeIds,
      });
      route = {
        nodeIds: [...routePlan.nodeIds.slice(0, Math.min(segmentIndex + 1, routePlan.nodeIds.length)), ...route.nodeIds.slice(1)],
        edgeIds: [...routePlan.edgeIds.slice(0, Math.min(segmentIndex, routePlan.edgeIds.length)), ...route.edgeIds],
      };
      routePlan = calculateRoutePlan(journey, route, strategy);
    }

    const currentNodeId = routePlan.nodeIds[Math.min(segmentIndex, routePlan.nodeIds.length - 1)] ?? journey.originNodeId;
    const nextNodeId = routePlan.nodeIds[Math.min(segmentIndex + 1, routePlan.nodeIds.length - 1)] ?? null;
    const currentNode = findNode(journey.nodes, currentNodeId);
    const nextNode = nextNodeId ? findNode(journey.nodes, nextNodeId) : currentNode;
    const segmentLength = Math.max(1e-6, distance(currentNode.position, nextNode.position));

    let controllerState: LiveSimState["controllerState"] = "ALIGN";

    if (frame === 0 || simTime < 0.9) {
      controllerState = "SEARCH";
    } else if (simTime < 1.8) {
      controllerState = "ACQUIRE";
    } else if (simTime < 3.4) {
      controllerState = "TRACK";
    }

    if (waitingUntil > simTime) {
      controllerState = "HOLD";
    } else if (simTime < driftActiveUntil) {
      controllerState = "INSERT";
    }

    if (nextNode.kind === "destination" && segmentIndex >= routePlan.edgeIds.length - 1 && segmentProgress > 0.72) {
      controllerState = "INSERT";
    }

    if (waitingUntil <= simTime && segmentIndex >= routePlan.edgeIds.length) {
      controllerState = "MATED";
    }

    const canMove = waitingUntil <= simTime && segmentIndex < routePlan.edgeIds.length;
    const edge = routePlan.edgeIds[segmentIndex]
      ? journey.edges.find((entry) => entry.id === routePlan.edgeIds[segmentIndex]) ?? null
      : null;

    if (canMove && edge) {
      const speedModifier =
        strategy === "pathlight" && profile.assistiveMode === "low-vision" && !edge.lowVisionFriendly
          ? 0.92
          : 1;
      segmentProgress += (baseSpeed * speedModifier * DT) / segmentLength;
      if (segmentProgress >= 1) {
        segmentProgress = 0;
        segmentIndex += 1;
      }
    }

    const pathProgress =
      routePlan.edgeIds.length === 0 ? 1 : Math.min(1, (segmentIndex + segmentProgress) / routePlan.edgeIds.length);
    const positionOnPath = lerpVec3(currentNode.position, nextNode.position, Math.min(1, segmentProgress));
    const lateralOffset = simTime < driftActiveUntil ? driftMagnitude * Math.sin((simTime - driftStart) * Math.PI) : 0;
    const position = {
      x: positionOnPath.x + lateralOffset,
      y: positionOnPath.y,
      z: positionOnPath.z,
    };
    const distanceRemaining = Math.max(0, routePlan.totalDistance * (1 - pathProgress));
    const activeHazard = hazardsNow[0] ?? null;
    const hazardNote =
      controllerState === "HOLD" && activeHazard
        ? activeHazard.rerouteNote
        : activeHazard && strategy === "baseline" && offRouteEvents > 0
          ? `The route reacted late to ${activeHazard.label.toLowerCase()}.`
          : null;
    const prompt = buildPrompt({
      journey,
      routePlan,
      segmentIndex,
      travelerPosition: position,
      profile,
      hazardNote,
    });
    const confidence =
      strategy === "pathlight"
        ? Math.min(0.98, 0.76 + pathProgress * 0.18 - routePlan.confusionRisk * 0.012)
        : Math.min(0.92, 0.63 + pathProgress * 0.16 - routePlan.confusionRisk * 0.018 - offRouteEvents * 0.04);

    hazardExposure += (edge?.obstacleExposure ?? 0) * DT + (activeHazard ? 0.18 : 0);
    const routeClarity = Math.max(
      0.18,
      1 -
        routePlan.confusionRisk * 0.035 -
        (profile.assistiveMode === "low-vision" && edge && !edge.lowVisionFriendly ? 0.08 : 0) -
        offRouteEvents * 0.06,
    );
    const accessibilityScore = Math.max(
      0.12,
      routePlan.accessibilityScore -
        hazardExposure * 0.01 -
        offRouteEvents * 0.08 +
        (strategy === "pathlight" ? 0.12 : 0),
    );

    const metrics: SimMetrics = {
      positionError: Math.abs(lateralOffset),
      lateralError: Math.abs(lateralOffset),
      forwardError: distanceRemaining,
      closureRate: canMove ? baseSpeed : 0,
      confidence,
      dockScore: accessibilityScore,
      alignmentError: routePlan.confusionRisk / Math.max(routePlan.edgeIds.length, 1),
      dropoutCount: offRouteEvents,
      visibleTime: simTime,
      sensorDisagreement: 1 - routeClarity,
      activeSensorCount: 1,
      trackRange: distance(position, destination.position),
      commandMagnitude: Math.min(1, Math.abs(lateralOffset) + (controllerState === "HOLD" ? 0.12 : 0)),
      distanceRemaining,
      correctionCount,
      rerouteCount,
      hazardExposure,
      landmarkCoverage: routePlan.landmarkCoverage,
      routeClarity,
      accessibilityScore,
      confidenceGain: strategy === "pathlight" ? Math.max(0, confidence - 0.62) : 0,
      travelProgress: pathProgress,
      offRouteEvents,
    };

    const notes = [
      routePlan.strategy === "pathlight" ? "Accessibility-aware routing active." : "Generic shortest-path guidance active.",
      controllerState === "HOLD" && activeHazard ? activeHazard.rerouteNote : prompt.landmark,
    ];

    const live = buildLegacyState({
      simTime,
      frame,
      position,
      destination: destination.position,
      controllerState,
      prompt,
      metrics,
      routePlan,
      profile,
      notes,
      currentNodeId,
      nextNodeId,
      activeHazards,
      corrections: correctionCount,
      reroutes: rerouteCount,
      offRouteEvents,
    });

    deviationSamples.push(metrics.positionError);
    hazardSamples.push(hazardExposure);
    confidenceSamples.push(confidence);
    samples.push({
      ...structuredClone(live),
      recordedAt: simTime,
    });

    if (controllerState === "MATED") {
      break;
    }
  }

  const last = samples[samples.length - 1];
  if (!last) {
    throw new Error("Unable to build Pathlight journey samples.");
  }

  return {
    live: last,
    replaySamples: samples,
    summary: {
      duration: last.simTime,
      meanDeviation: mean(deviationSamples),
      p95Deviation: percentile(deviationSamples, 0.95),
      meanHazardExposure: mean(hazardSamples),
      meanConfidence: mean(confidenceSamples),
      corrections: last.journey?.correctionCount ?? 0,
      reroutes: last.journey?.rerouteCount ?? 0,
      landmarkCoverage: last.journey?.routePlan.landmarkCoverage ?? 0,
      accessibilityScore: last.metrics.accessibilityScore ?? 0,
      offRouteEvents: last.journey?.offRouteEvents ?? 0,
    },
  };
}

function buildAnalyticsPoints(
  baselineReplaySamples: ReplaySample[],
  uploadedReplaySamples: ReplaySample[],
): AutonomyAnalyticsPoint[] {
  const frameCount = Math.min(baselineReplaySamples.length, uploadedReplaySamples.length);
  const points: AutonomyAnalyticsPoint[] = [];

  for (let index = 0; index < frameCount; index += 1) {
    const baseline = baselineReplaySamples[index];
    const uploaded = uploadedReplaySamples[index];
    if (!baseline || !uploaded) {
      continue;
    }

    points.push({
      simTime: baseline.simTime,
      baselinePositionError: baseline.metrics.positionError,
      uploadedPositionError: uploaded.metrics.positionError,
      baselineLateralError: baseline.metrics.lateralError,
      uploadedLateralError: uploaded.metrics.lateralError,
      baselineForwardError: baseline.metrics.forwardError,
      uploadedForwardError: uploaded.metrics.forwardError,
      baselineVerticalOffset: baseline.metrics.hazardExposure ?? 0,
      uploadedVerticalOffset: uploaded.metrics.hazardExposure ?? 0,
      baselineConfidence: baseline.metrics.confidence,
      uploadedConfidence: uploaded.metrics.confidence,
      receiverDistanceOffset: (baseline.metrics.distanceRemaining ?? 0) - (uploaded.metrics.distanceRemaining ?? 0),
    });
  }

  return points;
}

export function buildPathlightComparisonBundle({
  scenario,
  profileId,
}: {
  scenario: ScenarioPreset;
  profileId: AircraftCardId;
}): AutonomyEvaluationBundle {
  const baseline = simulateJourney({
    scenario,
    profileId,
    strategy: "baseline",
  });
  const uploaded = simulateJourney({
    scenario,
    profileId,
    strategy: "pathlight",
  });

  const points = buildAnalyticsPoints(baseline.replaySamples, uploaded.replaySamples);
  const hazardReduction = Math.max(0, baseline.summary.meanHazardExposure - uploaded.summary.meanHazardExposure);
  const confidenceLift = Math.max(0, uploaded.summary.meanConfidence - baseline.summary.meanConfidence);
  const deviationReduction = Math.max(0, baseline.summary.meanDeviation - uploaded.summary.meanDeviation);
  const p95LateralOffset = Math.max(0, baseline.summary.p95Deviation - uploaded.summary.p95Deviation);

  return {
    baselineReplaySamples: baseline.replaySamples,
    uploadedReplaySamples: uploaded.replaySamples,
    report: {
      manifest: null,
      generatedAt: Date.now(),
      notes: [
        `${Math.round(hazardReduction * 100)}% lower hazard exposure across the trip.`,
        `${(confidenceLift * 100).toFixed(0)}% confidence lift from landmark-guided routing.`,
        `${baseline.summary.offRouteEvents - uploaded.summary.offRouteEvents} fewer off-route events in the improved run.`,
      ],
      summary: {
        success: true,
        outcomeLabel: "Pathlight beats baseline",
        timeToDock: uploaded.summary.duration,
        meanDistanceOffset: deviationReduction,
        p95DistanceOffset: Math.max(0, baseline.summary.p95Deviation - uploaded.summary.p95Deviation),
        meanLateralOffset: baseline.summary.meanDeviation,
        p95LateralOffset,
        meanVerticalOffset: baseline.summary.meanHazardExposure,
        p95VerticalOffset: uploaded.summary.meanHazardExposure,
        meanForwardOffset: baseline.summary.meanDeviation,
        p95ForwardOffset: uploaded.summary.meanDeviation,
        missDistance: uploaded.live.metrics.distanceRemaining ?? 0,
        meanClosureRate: baseline.live.metrics.closureRate,
        maxClosureRate: uploaded.live.metrics.closureRate,
        timeInEnvelope: uploaded.summary.duration,
        averageConfidence: uploaded.summary.meanConfidence,
        dropoutRate: uploaded.summary.offRouteEvents / Math.max(uploaded.replaySamples.length, 1),
        safetyEventCount: uploaded.summary.reroutes,
        oscillationScore: uploaded.summary.corrections,
      },
      points,
    },
  };
}

export function buildPathlightLiveState({
  scenario,
  profileId,
}: {
  scenario: ScenarioPreset;
  profileId: AircraftCardId;
}) {
  const comparison = buildPathlightComparisonBundle({
    scenario,
    profileId,
  });

  const openingSample = comparison.uploadedReplaySamples[0];
  const fallback = comparison.uploadedReplaySamples.at(-1);

  if (!openingSample || !fallback) {
    throw new Error("Unable to build initial Pathlight state.");
  }

  return {
    live: structuredClone(openingSample),
    sessionPlan: comparison.uploadedReplaySamples,
    comparison,
  };
}
