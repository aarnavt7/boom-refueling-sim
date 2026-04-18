import { EMPTY_TRACKER } from "@/lib/sim/constants";
import { addVec3, expSmoothing, lerp, lerpVec3, scaleVec3, subVec3 } from "@/lib/sim/math";
import type { PerceptionEstimate, TrackerState } from "@/lib/sim/types";

export function updateTracker(
  previous: TrackerState,
  estimate: PerceptionEstimate,
  dt: number,
): TrackerState {
  if (estimate.estimatedPosition) {
    const alpha = expSmoothing(dt, 6.5);
    const nextPosition = previous.position
      ? lerpVec3(previous.position, estimate.estimatedPosition, alpha)
      : estimate.estimatedPosition;
    const velocity = previous.position
      ? scaleVec3(subVec3(nextPosition, previous.position), 1 / Math.max(dt, 1e-3))
      : EMPTY_TRACKER.velocity;

    return {
      position: nextPosition,
      velocity,
      confidence: lerp(previous.confidence, estimate.confidence, alpha),
    };
  }

  if (!previous.position) {
    return EMPTY_TRACKER;
  }

  return {
    position: addVec3(previous.position, scaleVec3(previous.velocity, dt)),
    velocity: scaleVec3(previous.velocity, 0.92),
    confidence: Math.max(previous.confidence - dt * 0.7, 0),
  };
}
