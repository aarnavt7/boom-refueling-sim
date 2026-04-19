import { distanceVec3, saturate, subVec3 } from "@/lib/sim/math";
import type {
  AutopilotCommandECEF,
  SensorObservation,
  SimMetrics,
  TrackerState,
  Vec3,
} from "@/lib/sim/types";

type MetricsInput = {
  boomTip: Vec3;
  target: Vec3;
  tracker: TrackerState;
  estimate: SensorObservation;
  observations: SensorObservation[];
  autopilotCommand: AutopilotCommandECEF;
  previousMetrics: SimMetrics;
  dt: number;
};

export function computeMetrics({
  boomTip,
  target,
  tracker,
  estimate,
  observations,
  autopilotCommand,
  previousMetrics,
  dt,
}: MetricsInput): SimMetrics {
  const delta = subVec3(target, boomTip);
  const positionError = distanceVec3(target, boomTip);
  const lateralError = Math.hypot(delta.x, delta.y);
  const forwardError = delta.z;
  const closureRate =
    previousMetrics.positionError > 0
      ? (previousMetrics.positionError - positionError) / Math.max(dt, 1e-3)
      : 0;

  return {
    positionError,
    lateralError,
    forwardError,
    closureRate,
    confidence: tracker.confidence,
    dockScore: saturate(1 - positionError / 8 + tracker.confidence * 0.45),
    alignmentError: lateralError,
    dropoutCount: previousMetrics.dropoutCount + observations.filter((observation) => observation.dropout).length,
    visibleTime: previousMetrics.visibleTime + (estimate.visible ? dt : 0),
    sensorDisagreement: tracker.disagreement,
    activeSensorCount: tracker.activeSensorIds.length,
    trackRange: estimate.range,
    commandMagnitude: autopilotCommand.magnitude,
  };
}
