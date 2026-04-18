import { REPLAY_SAMPLE_HZ } from "@/lib/sim/constants";
import type { LiveSimState, ReplaySample } from "@/lib/sim/types";

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
