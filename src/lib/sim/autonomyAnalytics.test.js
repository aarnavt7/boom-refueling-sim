import { describe, expect, test } from "bun:test";

import { buildPathlightComparisonBundle } from "./pathlightEngine.ts";
import { getScenarioById } from "./scenarios.ts";

describe("Pathlight comparison analytics", () => {
  test("summarizes accessibility-aware improvements over the baseline route", () => {
    const comparison = buildPathlightComparisonBundle({
      scenario: getScenarioById("steady-approach"),
      profileId: "kc46_f15",
    });

    expect(comparison.report.points.length).toBeGreaterThan(100);
    expect(comparison.report.summary.meanDistanceOffset).toBeGreaterThan(0);
    expect(comparison.report.summary.p95LateralOffset).toBeGreaterThan(0);
    expect(comparison.report.summary.averageConfidence).toBeGreaterThan(0.7);
    expect(comparison.report.notes.length).toBeGreaterThan(1);
  });
});
