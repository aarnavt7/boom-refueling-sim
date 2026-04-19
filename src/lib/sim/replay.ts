import { REPLAY_SAMPLE_HZ } from "@/lib/sim/constants";
import type {
  EvaluationView,
  LiveSimState,
  ReplayDataSource,
  ReplaySample,
} from "@/lib/sim/types";

export function shouldRecordReplay(simTime: number, lastRecordedAt: number) {
  return simTime - lastRecordedAt >= 1 / REPLAY_SAMPLE_HZ;
}

export function createReplaySample(state: LiveSimState): ReplaySample {
  return {
    ...structuredClone(state),
    recordedAt: state.simTime,
  };
}

export function clampReplayIndex(index: number, sampleCount: number) {
  if (sampleCount === 0) {
    return 0;
  }
  return Math.min(sampleCount - 1, Math.max(0, index));
}

export function getDisplayedState(
  live: LiveSimState,
  replaySamples: ReplaySample[],
  replayMode: boolean,
  replayIndex: number,
) {
  if (!replayMode || replaySamples.length === 0) {
    return live;
  }

  return replaySamples[clampReplayIndex(replayIndex, replaySamples.length)];
}

export function getReplaySampleAt(
  replaySamples: ReplaySample[],
  replayIndex: number,
  fallback: LiveSimState | null = null,
) {
  if (replaySamples.length === 0) {
    return fallback;
  }

  return replaySamples[clampReplayIndex(replayIndex, replaySamples.length)];
}

export function getDisplayedReplayBundle({
  live,
  sessionReplaySamples,
  autonomyBaselineReplaySamples,
  autonomyUploadedReplaySamples,
  replayMode,
  replayIndex,
  replayDataSource,
  evaluationView,
}: {
  live: LiveSimState;
  sessionReplaySamples: ReplaySample[];
  autonomyBaselineReplaySamples: ReplaySample[];
  autonomyUploadedReplaySamples: ReplaySample[];
  replayMode: boolean;
  replayIndex: number;
  replayDataSource: ReplayDataSource;
  evaluationView: EvaluationView;
}) {
  const sessionState = getDisplayedState(live, sessionReplaySamples, replayMode, replayIndex);
  const baselineAutonomyState = getReplaySampleAt(autonomyBaselineReplaySamples, replayIndex, sessionState);
  const uploadedAutonomyState = getReplaySampleAt(
    autonomyUploadedReplaySamples,
    replayIndex,
    baselineAutonomyState,
  );

  if (!replayMode || replayDataSource === "session") {
    return {
      primary: sessionState,
      comparison: null,
      baseline: sessionState,
      uploaded: null,
    };
  }

  if (evaluationView === "uploaded") {
    return {
      primary: uploadedAutonomyState ?? sessionState,
      comparison: baselineAutonomyState,
      baseline: baselineAutonomyState,
      uploaded: uploadedAutonomyState,
    };
  }

  if (evaluationView === "overlay") {
    return {
      primary: uploadedAutonomyState ?? sessionState,
      comparison: baselineAutonomyState,
      baseline: baselineAutonomyState,
      uploaded: uploadedAutonomyState,
    };
  }

  return {
    primary: baselineAutonomyState ?? sessionState,
    comparison: uploadedAutonomyState,
    baseline: baselineAutonomyState,
    uploaded: uploadedAutonomyState,
  };
}
