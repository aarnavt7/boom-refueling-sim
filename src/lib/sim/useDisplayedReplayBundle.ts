"use client";

import { useMemo } from "react";

import { getDisplayedReplayBundle } from "@/lib/sim/replay";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export function useDisplayedReplayBundle() {
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const autonomyEvaluation = useSimStore((state) => state.autonomyEvaluation);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);
  const replayDataSource = useUiStore((state) => state.replayDataSource);
  const evaluationView = useUiStore((state) => state.evaluationView);

  return useMemo(
    () =>
      getDisplayedReplayBundle({
        live,
        sessionReplaySamples: replaySamples,
        autonomyBaselineReplaySamples: autonomyEvaluation?.baselineReplaySamples ?? [],
        autonomyUploadedReplaySamples: autonomyEvaluation?.uploadedReplaySamples ?? [],
        replayMode,
        replayIndex,
        replayDataSource,
        evaluationView,
      }),
    [
      autonomyEvaluation?.baselineReplaySamples,
      autonomyEvaluation?.uploadedReplaySamples,
      evaluationView,
      live,
      replayDataSource,
      replayIndex,
      replayMode,
      replaySamples,
    ],
  );
}
