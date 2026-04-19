import { getBoomTipPose } from "@/lib/sim/kinematics";
import {
  distanceVec3,
  mean,
  percentile,
} from "@/lib/sim/math";
import type {
  AutonomyAnalyticsPoint,
  AutonomyAnalyticsReport,
  ReplaySample,
  ScenarioPreset,
  UploadedAutonomyManifest,
} from "@/lib/sim/types";

function countSafetyEvents(replaySamples: readonly ReplaySample[]) {
  let events = 0;
  let previousState = replaySamples[0]?.controllerState ?? "SEARCH";

  for (const sample of replaySamples.slice(1)) {
    const nextState = sample.controllerState;
    if (
      nextState !== previousState &&
      (nextState === "HOLD" || nextState === "ABORT" || nextState === "BREAKAWAY")
    ) {
      events += 1;
    }
    previousState = nextState;
  }

  return events;
}

function computeOscillationScore(replaySamples: readonly ReplaySample[], dt: number) {
  if (replaySamples.length < 4) {
    return 0;
  }

  let signChanges = 0;
  let lastXSign = 0;
  let lastYSign = 0;

  for (let index = 1; index < replaySamples.length; index += 1) {
    const current = replaySamples[index].receiverPose.position;
    const previous = replaySamples[index - 1].receiverPose.position;
    const xSign = Math.sign(current.x - previous.x);
    const ySign = Math.sign(current.y - previous.y);

    if (xSign !== 0 && lastXSign !== 0 && xSign !== lastXSign) {
      signChanges += 1;
    }

    if (ySign !== 0 && lastYSign !== 0 && ySign !== lastYSign) {
      signChanges += 1;
    }

    if (xSign !== 0) {
      lastXSign = xSign;
    }

    if (ySign !== 0) {
      lastYSign = ySign;
    }
  }

  return signChanges * dt;
}

export function computeAutonomyAnalyticsReport({
  scenario,
  manifest,
  baselineReplaySamples,
  uploadedReplaySamples,
  notes = [],
}: {
  scenario: ScenarioPreset;
  manifest: UploadedAutonomyManifest | null;
  baselineReplaySamples: ReplaySample[];
  uploadedReplaySamples: ReplaySample[];
  notes?: string[];
}): AutonomyAnalyticsReport {
  const frameCount = Math.min(baselineReplaySamples.length, uploadedReplaySamples.length);
  const limitedBaseline = baselineReplaySamples.slice(0, frameCount);
  const limitedUploaded = uploadedReplaySamples.slice(0, frameCount);
  const dt =
    frameCount > 1
      ? Math.max(limitedUploaded[1].simTime - limitedUploaded[0].simTime, 1 / 60)
      : 1 / 60;

  const points: AutonomyAnalyticsPoint[] = [];
  const receiverOffsets: number[] = [];
  const lateralOffsets: number[] = [];
  const verticalOffsets: number[] = [];
  const forwardOffsets: number[] = [];
  const closureRates: number[] = [];
  const confidences: number[] = [];
  let timeInEnvelope = 0;

  for (let index = 0; index < frameCount; index += 1) {
    const baseline = limitedBaseline[index];
    const uploaded = limitedUploaded[index];
    const baselineBoomTip = getBoomTipPose(baseline.boom).position;
    const uploadedBoomTip = getBoomTipPose(uploaded.boom).position;
    const baselineVerticalOffset = baseline.targetPose.position.y - baselineBoomTip.y;
    const uploadedVerticalOffset = uploaded.targetPose.position.y - uploadedBoomTip.y;
    const receiverDistanceOffset = distanceVec3(
      baseline.receiverPose.position,
      uploaded.receiverPose.position,
    );

    receiverOffsets.push(receiverDistanceOffset);
    lateralOffsets.push(Math.abs(uploaded.metrics.lateralError));
    verticalOffsets.push(Math.abs(uploadedVerticalOffset));
    forwardOffsets.push(Math.abs(uploaded.metrics.forwardError));
    closureRates.push(Math.abs(uploaded.metrics.closureRate));
    confidences.push(uploaded.tracker.confidence);

    if (
      uploaded.metrics.lateralError <= scenario.controller.insertTolerance * 1.35 &&
      Math.abs(uploadedVerticalOffset) <= scenario.controller.insertTolerance * 1.15 &&
      Math.abs(uploaded.metrics.forwardError) <= scenario.controller.insertTolerance * 1.75
    ) {
      timeInEnvelope += dt;
    }

    points.push({
      simTime: uploaded.simTime,
      baselinePositionError: baseline.metrics.positionError,
      uploadedPositionError: uploaded.metrics.positionError,
      baselineLateralError: baseline.metrics.lateralError,
      uploadedLateralError: uploaded.metrics.lateralError,
      baselineForwardError: baseline.metrics.forwardError,
      uploadedForwardError: uploaded.metrics.forwardError,
      baselineVerticalOffset,
      uploadedVerticalOffset,
      baselineConfidence: baseline.tracker.confidence,
      uploadedConfidence: uploaded.tracker.confidence,
      receiverDistanceOffset,
    });
  }

  const firstDockedSample =
    limitedUploaded.find((sample) => sample.controllerState === "MATED") ?? null;
  const success = firstDockedSample !== null;

  return {
    manifest,
    generatedAt: Date.now(),
    notes:
      baselineReplaySamples.length !== uploadedReplaySamples.length
        ? [...notes, "Baseline and uploaded replay lengths differed; report used the shared window."]
        : notes,
    summary: {
      success,
      outcomeLabel: success ? "Docked" : "Missed envelope",
      timeToDock: firstDockedSample?.simTime ?? null,
      meanDistanceOffset: mean(receiverOffsets),
      p95DistanceOffset: percentile(receiverOffsets, 0.95),
      meanLateralOffset: mean(lateralOffsets),
      p95LateralOffset: percentile(lateralOffsets, 0.95),
      meanVerticalOffset: mean(verticalOffsets),
      p95VerticalOffset: percentile(verticalOffsets, 0.95),
      meanForwardOffset: mean(forwardOffsets),
      p95ForwardOffset: percentile(forwardOffsets, 0.95),
      missDistance:
        limitedUploaded.length > 0
          ? Math.min(...limitedUploaded.map((sample) => sample.metrics.positionError))
          : 0,
      meanClosureRate: mean(closureRates),
      maxClosureRate: closureRates.length > 0 ? Math.max(...closureRates) : 0,
      timeInEnvelope,
      averageConfidence: mean(confidences),
      dropoutRate:
        limitedUploaded.length > 0
          ? limitedUploaded[limitedUploaded.length - 1].metrics.dropoutCount / limitedUploaded.length
          : 0,
      safetyEventCount: countSafetyEvents(limitedUploaded),
      oscillationScore: computeOscillationScore(limitedUploaded, dt),
    },
    points,
  };
}
