"use client";

import { computeAutonomyAnalyticsReport } from "@/lib/sim/autonomyAnalytics";
import { runHeadlessScenario } from "@/lib/sim/headlessHarness";
import { runUploadedAutonomyProgram } from "@/lib/sim/autonomyWorkerClient";
import {
  buildAutonomyFrameInputs,
  parseMissionJson,
} from "@/lib/sim/autonomyUpload";
import type {
  AutonomyEvaluationBundle,
  ScenarioPreset,
  UploadedAutonomyManifest,
} from "@/lib/sim/types";

const AUTONOMY_DT = 1 / 60;
const AUTONOMY_DURATION_SECONDS = 22;

export async function runAutonomyEvaluation({
  scenario,
  manifest,
}: {
  scenario: ScenarioPreset;
  manifest: UploadedAutonomyManifest;
}): Promise<AutonomyEvaluationBundle> {
  const missionSamples = parseMissionJson(manifest.missionJson);

  if (!manifest.controllerSource && missionSamples.length === 0) {
    throw new Error("Upload controller.js or mission.json before running an autonomy evaluation.");
  }

  const baseline = runHeadlessScenario({
    scenario,
    durationSeconds: AUTONOMY_DURATION_SECONDS,
    dt: AUTONOMY_DT,
    collectReplay: true,
  });

  const inputs = buildAutonomyFrameInputs(baseline.replaySamples, missionSamples, AUTONOMY_DT);
  const workerResult = await runUploadedAutonomyProgram({
    controllerSource: manifest.controllerSource,
    inputs,
  });
  const uploaded = runHeadlessScenario({
    scenario,
    durationSeconds: AUTONOMY_DURATION_SECONDS,
    dt: AUTONOMY_DT,
    collectReplay: true,
    autonomyOutputs: workerResult.outputs,
  });

  return {
    baselineReplaySamples: baseline.replaySamples,
    uploadedReplaySamples: uploaded.replaySamples,
    report: computeAutonomyAnalyticsReport({
      scenario,
      manifest,
      baselineReplaySamples: baseline.replaySamples,
      uploadedReplaySamples: uploaded.replaySamples,
      notes: workerResult.notes,
    }),
  };
}
