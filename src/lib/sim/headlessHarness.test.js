import { describe, expect, test } from "bun:test";

import { buildPathlightComparisonBundle, buildPathlightLiveState } from "./pathlightEngine.ts";
import { getScenarioById } from "./scenarios.ts";

const SCENARIO_IDS = [
  "steady-approach",
  "crosswind-chase",
  "sensor-degraded",
  "night-water-passive",
];

function getLastSample(samples) {
  const sample = samples.at(-1);
  expect(sample).toBeDefined();
  return sample;
}

function meanMetric(samples, selector) {
  return (
    samples.reduce((sum, sample) => sum + selector(sample), 0) /
    Math.max(samples.length, 1)
  );
}

describe("Pathlight journey contracts", () => {
  for (const scenarioId of SCENARIO_IDS) {
    test(`${scenarioId} completes both the baseline and accessibility-aware journeys`, () => {
      const comparison = buildPathlightComparisonBundle({
        scenario: getScenarioById(scenarioId),
        profileId: "kc46_f15",
      });

      const baselineLast = getLastSample(comparison.baselineReplaySamples);
      const uploadedLast = getLastSample(comparison.uploadedReplaySamples);

      expect(baselineLast.controllerState).toBe("MATED");
      expect(uploadedLast.controllerState).toBe("MATED");
      expect(baselineLast.journey?.distanceRemaining).toBeLessThanOrEqual(0.001);
      expect(uploadedLast.journey?.distanceRemaining).toBeLessThanOrEqual(0.001);
    });
  }
});

describe("Pathlight journey determinism", () => {
  for (const scenarioId of SCENARIO_IDS) {
    test(`${scenarioId} remains deterministic across repeated comparison builds`, () => {
      const scenario = getScenarioById(scenarioId);
      const first = buildPathlightComparisonBundle({
        scenario,
        profileId: "kc46_f15",
      });
      const second = buildPathlightComparisonBundle({
        scenario,
        profileId: "kc46_f15",
      });

      expect(first.report.summary.meanDistanceOffset).toBeCloseTo(
        second.report.summary.meanDistanceOffset,
        10,
      );
      expect(first.report.summary.averageConfidence).toBeCloseTo(
        second.report.summary.averageConfidence,
        10,
      );
      expect(first.uploadedReplaySamples.length).toBe(second.uploadedReplaySamples.length);
      expect(first.baselineReplaySamples.length).toBe(second.baselineReplaySamples.length);

      const firstLast = getLastSample(first.uploadedReplaySamples);
      const secondLast = getLastSample(second.uploadedReplaySamples);
      expect(firstLast.metrics.accessibilityScore).toBeCloseTo(
        secondLast.metrics.accessibilityScore,
        10,
      );
      expect(firstLast.journey?.rerouteCount).toBe(secondLast.journey?.rerouteCount);
    });
  }
});

describe("Pathlight route selection and rerouting", () => {
  test("prefers the calmer landmark-rich route over the shortest corridor in the normal trip", () => {
    const comparison = buildPathlightComparisonBundle({
      scenario: getScenarioById("steady-approach"),
      profileId: "kc46_f15",
    });

    const baselineLast = getLastSample(comparison.baselineReplaySamples);
    const uploadedLast = getLastSample(comparison.uploadedReplaySamples);

    expect(baselineLast.journey?.routePlan.nodeIds).toContain("north-corridor");
    expect(uploadedLast.journey?.routePlan.nodeIds).toContain("elevator-lobby");
    expect(uploadedLast.journey?.routePlan.nodeIds).toContain("south-corridor");
    expect(uploadedLast.journey?.routePlan.accessibilityScore).toBeGreaterThan(
      baselineLast.journey?.routePlan.accessibilityScore ?? 0,
    );
  });

  test("reroutes earlier and finishes with lower hazard load during a corridor closure", () => {
    const comparison = buildPathlightComparisonBundle({
      scenario: getScenarioById("crosswind-chase"),
      profileId: "kc46_f15",
    });

    const baselineLast = getLastSample(comparison.baselineReplaySamples);
    const uploadedLast = getLastSample(comparison.uploadedReplaySamples);

    expect(baselineLast.journey?.routePlan.edgeIds).toContain("checkpoint-north");
    expect(uploadedLast.journey?.routePlan.edgeIds).not.toContain("checkpoint-north");
    expect(uploadedLast.journey?.offRouteEvents ?? Infinity).toBeLessThan(
      baselineLast.journey?.offRouteEvents ?? -1,
    );
    expect(
      meanMetric(
        comparison.uploadedReplaySamples,
        (sample) => sample.metrics.confidence,
      ),
    ).toBeGreaterThan(
      meanMetric(
        comparison.baselineReplaySamples,
        (sample) => sample.metrics.confidence,
      ),
    );
    expect(uploadedLast.metrics.accessibilityScore ?? 0).toBeGreaterThan(
      baselineLast.metrics.accessibilityScore ?? 0,
    );
  });
});

describe("Pathlight guidance prompts", () => {
  test("emits structured low-vision guidance with landmark and safety language", () => {
    const seeded = buildPathlightLiveState({
      scenario: getScenarioById("sensor-degraded"),
      profileId: "kc135_f16",
    });

    const prompt = seeded.live.journey?.guidancePrompt;
    expect(prompt).toBeDefined();
    expect(prompt?.title.length).toBeGreaterThan(0);
    expect(prompt?.primary.length).toBeGreaterThan(0);
    expect(prompt?.landmark.length).toBeGreaterThan(0);
    expect(prompt?.clockHint).toContain("o'clock");
    expect(prompt?.distanceLabel).toContain("ahead");
    expect(prompt?.safetyNote).toContain("High-contrast mode");
  });
});
