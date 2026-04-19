"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

import { useDisplayedReplayBundle } from "@/lib/sim/useDisplayedReplayBundle";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

function toLinePoints(points: Array<{ x: number; y: number; z: number }>) {
  return points.map((point) => [point.x, point.y, point.z] as [number, number, number]);
}

export function TrackingOverlays() {
  const replaySamples = useSimStore((state) => state.replaySamples);
  const autonomyEvaluation = useSimStore((state) => state.autonomyEvaluation);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);
  const replayDataSource = useUiStore((state) => state.replayDataSource);
  const evaluationView = useUiStore((state) => state.evaluationView);
  const { primary } = useDisplayedReplayBundle();

  const primaryTrail = useMemo(() => {
    if (replayDataSource === "autonomy" && autonomyEvaluation) {
      const source =
        evaluationView === "baseline"
          ? autonomyEvaluation.baselineReplaySamples
          : autonomyEvaluation.uploadedReplaySamples;
      const capped = replayMode ? source.slice(0, replayIndex + 1) : source;
      return capped.slice(Math.max(capped.length - 90, 0));
    }

    const capped = replayMode ? replaySamples.slice(0, replayIndex + 1) : replaySamples;
    return capped.slice(Math.max(capped.length - 90, 0));
  }, [
    autonomyEvaluation,
    evaluationView,
    replayDataSource,
    replayIndex,
    replayMode,
    replaySamples,
  ]);

  const comparisonTrail = useMemo(() => {
    if (replayDataSource !== "autonomy" || !autonomyEvaluation) {
      return [];
    }

    const source =
      evaluationView === "baseline"
        ? autonomyEvaluation.uploadedReplaySamples
        : autonomyEvaluation.baselineReplaySamples;
    const capped = replayMode ? source.slice(0, replayIndex + 1) : source;
    return capped.slice(Math.max(capped.length - 90, 0));
  }, [
    autonomyEvaluation,
    evaluationView,
    replayDataSource,
    replayIndex,
    replayMode,
  ]);

  const predictedPoint = primary.tracker.position
    ? {
        x: primary.tracker.position.x + primary.tracker.velocity.x * 1.2,
        y: primary.tracker.position.y + primary.tracker.velocity.y * 1.2,
        z: primary.tracker.position.z + primary.tracker.velocity.z * 1.2,
      }
    : null;

  return (
    <group>
      {primaryTrail.length > 1 ? (
        <Line
          points={toLinePoints(primaryTrail.map((sample) => sample.receiverPose.position))}
          color="#f59e0b"
          lineWidth={1.5}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      ) : null}

      {comparisonTrail.length > 1 ? (
        <Line
          points={toLinePoints(comparisonTrail.map((sample) => sample.receiverPose.position))}
          color="#8aa6bb"
          lineWidth={1.1}
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      ) : null}

      {primaryTrail
        .filter((_, index) => index % 10 === 0)
        .map((sample) => (
          <mesh
            key={`trail-${sample.recordedAt}`}
            position={[
              sample.receiverPose.position.x,
              sample.receiverPose.position.y,
              sample.receiverPose.position.z,
            ]}
          >
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshBasicMaterial color="#f6b74a" transparent opacity={0.48} depthWrite={false} />
          </mesh>
        ))}

      {predictedPoint ? (
        <>
          <Line
            points={[
              [primary.targetPose.position.x, primary.targetPose.position.y, primary.targetPose.position.z],
              [predictedPoint.x, predictedPoint.y, predictedPoint.z],
            ]}
            color="#6bb8ff"
            lineWidth={1}
            transparent
            opacity={0.28}
            depthWrite={false}
          />
          <mesh position={[predictedPoint.x, predictedPoint.y, predictedPoint.z]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#6bb8ff" transparent opacity={0.2} depthWrite={false} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}
