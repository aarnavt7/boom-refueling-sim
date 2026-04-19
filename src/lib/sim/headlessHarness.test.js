import { describe, expect, test } from "bun:test";

import {
  BENCHMARK_SCENARIO_IDS,
  evaluateBenchmarkSummary,
  formatBenchmarkEvaluation,
  getScenarioBenchmarkContract,
} from "./benchmarkProfiles.ts";
import { runHeadlessScenario } from "./headlessHarness.ts";
import { getScenarioById } from "./scenarios.ts";

const DT = 1 / 60;

function runContractScenario(scenarioId) {
  const contract = getScenarioBenchmarkContract(scenarioId);

  return runHeadlessScenario({
    scenarioId,
    durationSeconds: contract.mateBySeconds,
    dt: DT,
    stopOnDocked: true,
  });
}

function expectStableNullableNumber(actual, expected, digits) {
  if (expected === null || actual === null) {
    expect(actual).toBe(expected);
    return;
  }

  expect(actual).toBeCloseTo(expected, digits);
}

describe("headless scenario contracts", () => {
  test("all benchmark scenarios satisfy the objective backend contract matrix", () => {
    const failures = [];

    for (const scenarioId of BENCHMARK_SCENARIO_IDS) {
      const summary = runContractScenario(scenarioId);
      const evaluation = evaluateBenchmarkSummary(summary);

      if (!evaluation.pass) {
        failures.push(formatBenchmarkEvaluation(summary, evaluation));
      }
    }

    if (failures.length > 0) {
      throw new Error(failures.join("\n"));
    }
  });
});

describe("headless scenario determinism", () => {
  for (const scenarioId of BENCHMARK_SCENARIO_IDS) {
    test(`${scenarioId} remains deterministic across repeated runs`, () => {
      const runs = Array.from({ length: 3 }, () => runContractScenario(scenarioId));
      const reference = runs[0];

      for (const current of runs.slice(1)) {
        expect(current.finalState).toBe(reference.finalState);
        expect(current.abortReason).toBe(reference.abortReason);
        expectStableNullableNumber(current.dockedAt, reference.dockedAt, 10);
        expect(current.minPositionError).toBeCloseTo(reference.minPositionError, 10);
        expect(current.dropoutCount).toBe(reference.dropoutCount);
        expect(current.finalTrackerConfidence).toBeCloseTo(reference.finalTrackerConfidence, 12);
        expect(current.visibleFraction).toBeCloseTo(reference.visibleFraction, 12);
        expect(current.stateFrameCounts).toEqual(reference.stateFrameCounts);
        expect(current.firstStateAt).toEqual(reference.firstStateAt);
        expect(current.preferredRoleFrameCounts).toEqual(reference.preferredRoleFrameCounts);
      }
    });
  }
});

describe("headless safety and negative cases", () => {
  test("manual abort forces breakaway and never allows a mated success", () => {
    const result = runHeadlessScenario({
      scenarioId: "steady-approach",
      durationSeconds: 12,
      dt: DT,
      manualAbortAt: 1.5,
      stopOnDocked: true,
    });

    expect(["BREAKAWAY", "ABORT"]).toContain(result.finalState);
    expect(result.finalState).not.toBe("MATED");
    expect(result.dockedAt).toBeNull();
    expect(result.abortReason).toBe("Manual breakaway commanded");
    expect(result.stateFrameCounts.MATED).toBeUndefined();
    expect(result.firstStateAt.MATED).toBeUndefined();
  });

  test("an impossible out-of-range scenario never reaches INSERT or MATED", () => {
    const baseScenario = getScenarioById("steady-approach");
    const impossibleScenario = {
      ...baseScenario,
      id: "impossible-out-of-range",
      name: "Impossible Out Of Range",
      receiverBasePose: {
        position: { x: 0.35, y: -2.82, z: 96 },
        rotation: { ...baseScenario.receiverBasePose.rotation },
      },
    };

    const result = runHeadlessScenario({
      scenario: impossibleScenario,
      durationSeconds: 10,
      dt: DT,
      stopOnDocked: true,
    });

    expect(result.finalState).not.toBe("MATED");
    expect(result.dockedAt).toBeNull();
    expect(result.visibleFraction).toBe(0);
    expect(result.finalTrackerConfidence).toBe(0);
    expect(result.stateFrameCounts.INSERT).toBeUndefined();
    expect(result.stateFrameCounts.MATED).toBeUndefined();
    expect(result.firstStateAt.INSERT).toBeUndefined();
    expect(result.firstStateAt.MATED).toBeUndefined();
  });
});
