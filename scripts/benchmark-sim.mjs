import {
  evaluateBenchmarkSummary,
  formatBenchmarkEvaluation,
  getScenarioBenchmarkContract,
} from "../src/lib/sim/benchmarkProfiles.ts";
import { runHeadlessScenario } from "../src/lib/sim/headlessHarness.ts";
import { scenarioPresets } from "../src/lib/sim/scenarios.ts";

const rawArgs = process.argv.slice(2);
const positional = [];
let jsonOutput = false;
let assertCorrectness = false;

for (const arg of rawArgs) {
  if (arg === "--json") {
    jsonOutput = true;
    continue;
  }

  if (arg === "--assert-correctness") {
    assertCorrectness = true;
    continue;
  }

  positional.push(arg);
}

const repetitions = parseNumberArg(positional[0], 25);
const requestedDurationSeconds = parseNumberArg(positional[1], 30);
const dt = parseNumberArg(positional[2], 1 / 60);

const summaries = [];
const startedAt = performance.now();

for (let iteration = 0; iteration < repetitions; iteration += 1) {
  for (const scenario of scenarioPresets) {
    const contract = getScenarioBenchmarkContract(scenario.id);
    summaries.push(
      runHeadlessScenario({
        scenario,
        durationSeconds: Math.max(requestedDurationSeconds, contract.mateBySeconds),
        dt,
        stopOnDocked: true,
      }),
    );
  }
}

const elapsedMs = performance.now() - startedAt;
const totalFrames = summaries.reduce((sum, summary) => sum + summary.framesSimulated, 0);
const runsPerSecond = summaries.length / (elapsedMs / 1000);
const framesPerSecond = totalFrames / (elapsedMs / 1000);
const scenarioReports = scenarioPresets.map((scenario) => {
  const scenarioSummaries = summaries.filter((summary) => summary.scenarioId === scenario.id);
  const evaluations = scenarioSummaries.map((summary) => evaluateBenchmarkSummary(summary));
  const contractPass = evaluations.every((evaluation) => evaluation.pass);
  const mateTimes = scenarioSummaries
    .map((summary) => summary.dockedAt)
    .filter((value) => value !== null);
  const terminalRoleFrameFraction = Math.min(
    ...scenarioSummaries.map(
      (summary) => summary.preferredRoleFrameCounts.terminal / Math.max(summary.framesSimulated, 1),
    ),
  );
  const failureDetails = evaluations
    .map((evaluation, index) =>
      evaluation.pass ? null : formatBenchmarkEvaluation(scenarioSummaries[index], evaluation),
    )
    .filter(Boolean);

  return {
    scenarioId: scenario.id,
    contractPass,
    mateBySeconds: getScenarioBenchmarkContract(scenario.id).mateBySeconds,
    mateTimeSeconds:
      mateTimes.length === scenarioSummaries.length ? Math.max(...mateTimes) : null,
    minPositionError: Math.max(...scenarioSummaries.map((summary) => summary.minPositionError)),
    finalTrackerConfidence: Math.min(
      ...scenarioSummaries.map((summary) => summary.finalTrackerConfidence),
    ),
    dropoutRate: Math.max(...scenarioSummaries.map((summary) => summary.dropoutRate)),
    terminalRoleFrameFraction,
    failureDetails,
  };
});
const report = {
  repetitions,
  scenarioCount: scenarioPresets.length,
  requestedDurationSeconds,
  dt,
  totalRuns: summaries.length,
  wallTimeMs: elapsedMs,
  runsPerSecond,
  frameThroughput: framesPerSecond,
  scenarioReports,
};
const failedScenarioReports = scenarioReports.filter((scenario) => !scenario.contractPass);

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("Headless Simulation Benchmark");
  console.log(`repetitions: ${repetitions}`);
  console.log(`scenario count: ${scenarioPresets.length}`);
  console.log(`requested duration per run: ${requestedDurationSeconds.toFixed(2)} s`);
  console.log(`effective duration per scenario: max(requested, contract mate window)`);
  console.log(`dt: ${dt.toFixed(6)} s`);
  console.log(`total runs: ${summaries.length}`);
  console.log(`wall time: ${elapsedMs.toFixed(2)} ms`);
  console.log(`throughput: ${runsPerSecond.toFixed(2)} runs/s`);
  console.log(`frame throughput: ${framesPerSecond.toFixed(0)} frames/s`);
  console.log("");

  for (const scenarioReport of scenarioReports) {
    console.log(
      [
        `${scenarioReport.scenarioId}:`,
        `contract=${scenarioReport.contractPass ? "PASS" : "FAIL"}`,
        `mateBy=${scenarioReport.mateBySeconds.toFixed(2)}s`,
        `mate=${scenarioReport.mateTimeSeconds === null ? "-" : `${scenarioReport.mateTimeSeconds.toFixed(2)}s`}`,
        `minError=${scenarioReport.minPositionError.toFixed(3)}`,
        `finalTracker=${scenarioReport.finalTrackerConfidence.toFixed(3)}`,
        `dropoutRate=${scenarioReport.dropoutRate.toFixed(3)}`,
        `terminalRole=${(scenarioReport.terminalRoleFrameFraction * 100).toFixed(1)}%`,
      ].join(" "),
    );

    if (!scenarioReport.contractPass) {
      for (const failureDetail of scenarioReport.failureDetails) {
        console.log(`  ${failureDetail}`);
      }
    }
  }
}

if (assertCorrectness && failedScenarioReports.length > 0) {
  console.error("");
  console.error(
    `Benchmark correctness failed for: ${failedScenarioReports.map((scenario) => scenario.scenarioId).join(", ")}`,
  );
  process.exit(1);
}

function parseNumberArg(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
