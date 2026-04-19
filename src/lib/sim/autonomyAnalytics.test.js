import { describe, expect, test } from "bun:test";

import { computeAutonomyAnalyticsReport } from "./autonomyAnalytics.ts";
import { runHeadlessScenario } from "./headlessHarness.ts";
import { getScenarioById } from "./scenarios.ts";

const DT = 1 / 60;

describe("autonomy analytics", () => {
  test("summarizes uploaded replay offsets and debrief metrics", () => {
    const scenario = getScenarioById("steady-approach");
    const baseline = runHeadlessScenario({
      scenario,
      durationSeconds: 6,
      dt: DT,
      collectReplay: true,
    });
    const perturbations = baseline.replaySamples.map((sample, index) =>
      index > 20
        ? {
            positionDelta: {
              x: Math.sin(sample.simTime * 1.2) * 0.018,
              y: Math.cos(sample.simTime * 1.7) * 0.01,
              z: 0,
            },
          }
        : null,
    );
    const uploaded = runHeadlessScenario({
      scenario,
      durationSeconds: 6,
      dt: DT,
      collectReplay: true,
      autonomyOutputs: perturbations,
    });

    const report = computeAutonomyAnalyticsReport({
      scenario,
      manifest: {
        controllerName: "test-controller.js",
        controllerSource: "export function step() { return {}; }",
        missionName: null,
        missionJson: null,
        uploadedAt: Date.now(),
      },
      baselineReplaySamples: baseline.replaySamples,
      uploadedReplaySamples: uploaded.replaySamples,
    });

    expect(report.points.length).toBeGreaterThan(100);
    expect(report.summary.meanDistanceOffset).toBeGreaterThan(0.001);
    expect(report.summary.p95LateralOffset).toBeGreaterThan(0.001);
    expect(report.summary.averageConfidence).toBeGreaterThan(0);
  });
});
