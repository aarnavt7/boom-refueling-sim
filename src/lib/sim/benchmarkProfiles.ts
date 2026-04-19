import type { HeadlessRunSummary } from "@/lib/sim/headlessHarness";

export type ScenarioBenchmarkContract = {
  scenarioId: string;
  mateBySeconds: number;
  maxMinPositionError: number;
};

export type BenchmarkEvaluation = {
  scenarioId: string;
  pass: boolean;
  failures: string[];
  contract: ScenarioBenchmarkContract;
};

const COMMON_BENCHMARK_INVARIANTS = {
  minVisibleFraction: 0.99,
  minFinalTrackerConfidence: 0.2,
  minFinalActiveSensorCount: 2,
};

export const SCENARIO_BENCHMARK_CONTRACTS: Record<string, ScenarioBenchmarkContract> = {
  "steady-approach": {
    scenarioId: "steady-approach",
    mateBySeconds: 6.0,
    maxMinPositionError: 0.17,
  },
  "crosswind-chase": {
    scenarioId: "crosswind-chase",
    mateBySeconds: 15.0,
    maxMinPositionError: 0.15,
  },
  "sensor-degraded": {
    scenarioId: "sensor-degraded",
    mateBySeconds: 3.5,
    maxMinPositionError: 0.17,
  },
  "night-water-passive": {
    scenarioId: "night-water-passive",
    mateBySeconds: 30.0,
    maxMinPositionError: 0.23,
  },
  "day-land-emcon": {
    scenarioId: "day-land-emcon",
    mateBySeconds: 8.0,
    maxMinPositionError: 0.21,
  },
  "night-water-emcon": {
    scenarioId: "night-water-emcon",
    mateBySeconds: 12.0,
    maxMinPositionError: 0.16,
  },
};

export const BENCHMARK_SCENARIO_IDS = Object.keys(SCENARIO_BENCHMARK_CONTRACTS);

export function getScenarioBenchmarkContract(scenarioId: string): ScenarioBenchmarkContract {
  const contract = SCENARIO_BENCHMARK_CONTRACTS[scenarioId];

  if (!contract) {
    throw new Error(`Missing benchmark contract for scenario "${scenarioId}"`);
  }

  return contract;
}

export function evaluateBenchmarkSummary(summary: HeadlessRunSummary): BenchmarkEvaluation {
  const contract = getScenarioBenchmarkContract(summary.scenarioId);
  const failures: string[] = [];

  if (summary.finalState !== "MATED") {
    failures.push(`finalState=${summary.finalState} (expected MATED)`);
  }

  if (summary.abortReason !== null) {
    failures.push(`abortReason=${summary.abortReason}`);
  }

  if (summary.dockedAt === null) {
    failures.push("dockedAt=null");
  } else if (summary.dockedAt > contract.mateBySeconds) {
    failures.push(
      `dockedAt=${summary.dockedAt.toFixed(2)}s exceeds ${contract.mateBySeconds.toFixed(2)}s`,
    );
  }

  if (summary.minPositionError > contract.maxMinPositionError) {
    failures.push(
      `minPositionError=${summary.minPositionError.toFixed(3)} exceeds ${contract.maxMinPositionError.toFixed(3)}`,
    );
  }

  if (summary.visibleFraction < COMMON_BENCHMARK_INVARIANTS.minVisibleFraction) {
    failures.push(
      `visibleFraction=${summary.visibleFraction.toFixed(3)} below ${COMMON_BENCHMARK_INVARIANTS.minVisibleFraction.toFixed(2)}`,
    );
  }

  if (summary.finalTrackerConfidence < COMMON_BENCHMARK_INVARIANTS.minFinalTrackerConfidence) {
    failures.push(
      `finalTrackerConfidence=${summary.finalTrackerConfidence.toFixed(3)} below ${COMMON_BENCHMARK_INVARIANTS.minFinalTrackerConfidence.toFixed(2)}`,
    );
  }

  if (summary.finalMetrics.activeSensorCount < COMMON_BENCHMARK_INVARIANTS.minFinalActiveSensorCount) {
    failures.push(
      `finalActiveSensors=${summary.finalMetrics.activeSensorCount} below ${COMMON_BENCHMARK_INVARIANTS.minFinalActiveSensorCount}`,
    );
  }

  if (summary.preferredRoleFrameCounts.terminal <= 0) {
    failures.push("terminal preferred role never engaged");
  }

  if (summary.firstStateAt.INSERT === undefined) {
    failures.push("INSERT was never reached");
  }

  if (summary.firstStateAt.MATED === undefined) {
    failures.push("MATED was never reached");
  } else if (
    summary.firstStateAt.INSERT !== undefined &&
    summary.firstStateAt.MATED <= summary.firstStateAt.INSERT
  ) {
    failures.push(
      `firstStateAt.MATED=${summary.firstStateAt.MATED.toFixed(2)}s not after INSERT=${summary.firstStateAt.INSERT.toFixed(2)}s`,
    );
  }

  return {
    scenarioId: summary.scenarioId,
    pass: failures.length === 0,
    failures,
    contract,
  };
}

export function formatBenchmarkEvaluation(summary: HeadlessRunSummary, evaluation: BenchmarkEvaluation) {
  return [
    `${summary.scenarioId}: ${evaluation.pass ? "PASS" : "FAIL"}`,
    evaluation.failures.length > 0 ? `reasons=${evaluation.failures.join("; ")}` : "reasons=-",
    `state=${summary.finalState}`,
    `dockedAt=${summary.dockedAt === null ? "-" : `${summary.dockedAt.toFixed(2)}s`}`,
    `minError=${summary.minPositionError.toFixed(3)}`,
    `tracker=${summary.finalTrackerConfidence.toFixed(3)}`,
    `visible=${(summary.visibleFraction * 100).toFixed(1)}%`,
    `abort=${summary.abortReason ?? "-"}`,
  ].join(" | ");
}
