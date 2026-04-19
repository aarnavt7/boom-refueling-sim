import { distanceVec3, lengthVec3 } from "@/lib/sim/math";
import type {
  ControllerState,
  Pose,
  SafetyStatus,
  ScenarioPreset,
  SensorObservation,
  SimMetrics,
  TrackerState,
  Vec3,
} from "@/lib/sim/types";

type SafetyInput = {
  state: ControllerState;
  scenario: ScenarioPreset;
  metrics: SimMetrics;
  previousMetrics: SimMetrics;
  boomTip: Vec3;
  receiverPose: Pose;
  receiverVelocity: Vec3;
  tracker: TrackerState;
  observations: SensorObservation[];
  manualAbort: boolean;
};

export function evaluateSafety({
  state,
  scenario,
  metrics,
  previousMetrics,
  boomTip,
  receiverPose,
  receiverVelocity,
  tracker,
  observations,
  manualAbort,
}: SafetyInput): SafetyStatus {
  const reasons: string[] = [];
  let abort = false;
  let hold = false;
  let breakaway = false;

  if (manualAbort) {
    breakaway = true;
    reasons.push("Manual breakaway commanded");
  }

  if (
    state !== "MATED" &&
    metrics.positionError < scenario.safety.nearTargetDistance &&
    tracker.confidence < 0.05
  ) {
    abort = true;
    reasons.push("Track confidence collapse near receptacle");
  }

  if (
    state === "INSERT" &&
    previousMetrics.positionError > 0 &&
    metrics.positionError > previousMetrics.positionError + 0.03
  ) {
    abort = true;
    reasons.push("Insertion divergence");
  }

  if (
    state !== "MATED" &&
    metrics.sensorDisagreement > scenario.safety.sensorDisagreementAbort &&
    metrics.positionError < scenario.safety.nearTargetDistance * 1.6
  ) {
    abort = true;
    reasons.push("Passive sensor disagreement");
  }

  if (Math.abs(metrics.closureRate) > scenario.safety.maxClosureRate && metrics.positionError < 2.4) {
    breakaway = true;
    reasons.push("Closure envelope exceeded");
  }

  const keepOutDistance = distanceVec3(boomTip, receiverPose.position);
  if (
    state !== "MATED" &&
    keepOutDistance < scenario.safety.keepOutRadius &&
    metrics.positionError < scenario.safety.nearTargetDistance * 0.75 &&
    metrics.lateralError > scenario.controller.insertTolerance * 1.8
  ) {
    breakaway = true;
    reasons.push("Keep-out zone violation");
  }

  if (lengthVec3(receiverVelocity) > scenario.safety.receiverMotionSpike) {
    breakaway = true;
    reasons.push("Receiver motion spike");
  }

  if (
    state !== "MATED" &&
    (tracker.confidence < 0.22 || metrics.sensorDisagreement > scenario.safety.sensorDisagreementHold) &&
    metrics.positionError < scenario.safety.nearTargetDistance * 1.9
  ) {
    hold = true;
    reasons.push("Passive track hold");
  }

  if (state === "MATED") {
    hold = false;
    abort = false;
    breakaway = false;
  }

  if (
    observations.every((observation) => !observation.visible || observation.dropout) &&
    state !== "SEARCH" &&
    state !== "MATED"
  ) {
    hold = true;
    reasons.push("All passive sensors lost");
  }

  return {
    abort,
    hold,
    breakaway,
    reasons,
  };
}
