import { EMPTY_TRACKER } from "@/lib/sim/constants";
import {
  addVec3,
  distanceVec3,
  expSmoothing,
  lerp,
  lerpVec3,
  scaleVec3,
  subVec3,
} from "@/lib/sim/math";
import type { SensorObservation, TrackerState } from "@/lib/sim/types";

export function updateTracker(
  previous: TrackerState,
  observations: SensorObservation[],
  dt: number,
): TrackerState {
  const used = observations.filter(
    (observation) => observation.usedForTrack && observation.estimatedPose && observation.estimatedPosition,
  );

  if (used.length > 0) {
    const totalWeight = used.reduce((sum, observation) => sum + observation.confidence + 0.05, 0);
    const fusedPosition = used.reduce(
      (acc, observation) => {
        const weight = (observation.confidence + 0.05) / totalWeight;
        return addVec3(acc, scaleVec3(observation.estimatedPosition!, weight));
      },
      { x: 0, y: 0, z: 0 },
    );
    const fusedRotation = used.reduce(
      (acc, observation) => {
        const weight = (observation.confidence + 0.05) / totalWeight;
        return {
          x: acc.x + observation.estimatedPose!.rotation.x * weight,
          y: acc.y + observation.estimatedPose!.rotation.y * weight,
          z: acc.z + observation.estimatedPose!.rotation.z * weight,
        };
      },
      { x: 0, y: 0, z: 0 },
    );
    const alpha = expSmoothing(dt, 5.6);
    const nextPosition = previous.position ? lerpVec3(previous.position, fusedPosition, alpha) : fusedPosition;
    const velocity = previous.position
      ? scaleVec3(subVec3(nextPosition, previous.position), 1 / Math.max(dt, 1e-3))
      : EMPTY_TRACKER.velocity;
    const disagreement = meanPairwiseDistance(used);
    const meanConfidence =
      used.reduce((sum, observation) => sum + observation.confidence, 0) / Math.max(used.length, 1);

    return {
      pose: {
        position: nextPosition,
        rotation: fusedRotation,
      },
      position: nextPosition,
      velocity,
      confidence: clampConfidence(lerp(previous.confidence, meanConfidence, alpha) - disagreement * 0.14),
      covariance: {
        x: 0.06 + disagreement * 0.4,
        y: 0.06 + disagreement * 0.4,
        z: 0.08 + disagreement * 0.46,
      },
      activeSensorIds: used.map((observation) => observation.sensorId),
      preferredRole: used.some((observation) => observation.role === "terminal") ? "terminal" : "acquire",
      disagreement,
      lost: false,
    };
  }

  if (!previous.position) {
    return EMPTY_TRACKER;
  }

  return {
    ...previous,
    pose: previous.pose
      ? {
          ...previous.pose,
          position: addVec3(previous.pose.position, scaleVec3(previous.velocity, dt)),
        }
      : null,
    position: addVec3(previous.position, scaleVec3(previous.velocity, dt)),
    velocity: scaleVec3(previous.velocity, 0.9),
    confidence: Math.max(previous.confidence - dt * 0.58, 0),
    covariance: {
      x: previous.covariance.x + dt * 0.16,
      y: previous.covariance.y + dt * 0.16,
      z: previous.covariance.z + dt * 0.18,
    },
    activeSensorIds: [],
    disagreement: previous.disagreement,
    lost: true,
  };
}

function meanPairwiseDistance(observations: SensorObservation[]) {
  if (observations.length < 2) {
    return 0;
  }

  let sum = 0;
  let pairs = 0;

  for (let index = 0; index < observations.length; index += 1) {
    for (let inner = index + 1; inner < observations.length; inner += 1) {
      sum += distanceVec3(
        observations[index].estimatedPosition!,
        observations[inner].estimatedPosition!,
      );
      pairs += 1;
    }
  }

  return sum / Math.max(pairs, 1);
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(0.99, value));
}
