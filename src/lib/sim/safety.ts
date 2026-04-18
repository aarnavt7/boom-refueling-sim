import { distanceVec3 } from "@/lib/sim/math";
import type {
  ControllerState,
  Pose,
  SafetyStatus,
  ScenarioPreset,
  SimMetrics,
  Vec3,
} from "@/lib/sim/types";

type SafetyInput = {
  state: ControllerState;
  scenario: ScenarioPreset;
  metrics: SimMetrics;
  previousMetrics: SimMetrics;
  boomTip: Vec3;
  receiverPose: Pose;
  trackerConfidence: number;
};

export function evaluateSafety({
  state,
  scenario,
  metrics,
  previousMetrics,
  boomTip,
  receiverPose,
  trackerConfidence,
}: SafetyInput): SafetyStatus {
  const reasons: string[] = [];
  let abort = false;
  let hold = false;

  if (
    state !== "DOCKED" &&
    metrics.positionError < scenario.safety.nearTargetDistance &&
    trackerConfidence < 0.08
  ) {
    abort = true;
    reasons.push("Low confidence near target");
  }

  if (
    state === "INSERT" &&
    previousMetrics.positionError > 0 &&
    metrics.positionError > previousMetrics.positionError + 0.035
  ) {
    abort = true;
    reasons.push("Error increasing during insert");
  }

  const keepOutDistance = distanceVec3(boomTip, receiverPose.position);
  if (
    state !== "DOCKED" &&
    keepOutDistance < scenario.safety.keepOutRadius &&
    metrics.positionError > scenario.controller.dockTolerance * 1.5
  ) {
    abort = true;
    reasons.push("Keep-out zone violation");
  }

  if (
    state !== "DOCKED" &&
    trackerConfidence < 0.3 &&
    metrics.positionError < scenario.safety.nearTargetDistance * 1.75
  ) {
    hold = true;
    reasons.push("Confidence hold");
  }

  return {
    abort,
    hold,
    reasons,
  };
}
