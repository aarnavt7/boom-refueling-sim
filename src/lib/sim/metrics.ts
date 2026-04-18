import { distanceVec3, saturate, subVec3 } from "@/lib/sim/math";
import type { PerceptionEstimate, SimMetrics, Vec3 } from "@/lib/sim/types";

type MetricsInput = {
  boomTip: Vec3;
  target: Vec3;
  estimate: PerceptionEstimate;
  previousMetrics: SimMetrics;
  dt: number;
};

export function computeMetrics({
  boomTip,
  target,
  estimate,
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
    confidence: estimate.confidence,
    dockScore: saturate(1 - positionError / 8 + estimate.confidence * 0.35),
    alignmentError: lateralError,
    dropoutCount: previousMetrics.dropoutCount + (estimate.dropout ? 1 : 0),
    visibleTime: previousMetrics.visibleTime + (estimate.visible ? dt : 0),
  };
}
