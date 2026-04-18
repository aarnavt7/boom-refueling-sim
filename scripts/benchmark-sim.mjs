import { runHeadlessScenario } from "../src/lib/sim/headlessHarness.ts";
import { scenarioPresets } from "../src/lib/sim/scenarios.ts";

const repetitions = Number(process.argv[2] ?? "25");
const durationSeconds = Number(process.argv[3] ?? "20");
const dt = Number(process.argv[4] ?? `${1 / 60}`);

const summaries = [];
const startedAt = performance.now();

for (let iteration = 0; iteration < repetitions; iteration += 1) {
  for (const scenario of scenarioPresets) {
    summaries.push(
      runHeadlessScenario({
        scenario,
        durationSeconds,
        dt,
      }),
    );
  }
}

const elapsedMs = performance.now() - startedAt;
const totalFrames = summaries.reduce((sum, summary) => sum + summary.framesSimulated, 0);
const runsPerSecond = summaries.length / (elapsedMs / 1000);
const framesPerSecond = totalFrames / (elapsedMs / 1000);

console.log("Headless Simulation Benchmark");
console.log(`repetitions: ${repetitions}`);
console.log(`scenario count: ${scenarioPresets.length}`);
console.log(`duration per run: ${durationSeconds.toFixed(2)} s`);
console.log(`dt: ${dt.toFixed(6)} s`);
console.log(`total runs: ${summaries.length}`);
console.log(`wall time: ${elapsedMs.toFixed(2)} ms`);
console.log(`throughput: ${runsPerSecond.toFixed(2)} runs/s`);
console.log(`frame throughput: ${framesPerSecond.toFixed(0)} frames/s`);
console.log("");

for (const scenario of scenarioPresets) {
  const scenarioSummaries = summaries.filter((summary) => summary.scenarioId === scenario.id);
  const reference = scenarioSummaries[0];
  const averageMinError =
    scenarioSummaries.reduce((sum, summary) => sum + summary.minPositionError, 0) /
    scenarioSummaries.length;
  const averageVisibleFraction =
    scenarioSummaries.reduce((sum, summary) => sum + summary.visibleFraction, 0) /
    scenarioSummaries.length;
  const averageDropouts =
    scenarioSummaries.reduce((sum, summary) => sum + summary.dropoutCount, 0) /
    scenarioSummaries.length;

  console.log(
    [
      `${scenario.id}:`,
      `final=${reference.finalState}`,
      `dockedAt=${reference.dockedAt === null ? "-" : `${reference.dockedAt.toFixed(2)}s`}`,
      `abort=${reference.abortReason ?? "-"}`,
      `avgMinError=${averageMinError.toFixed(3)}`,
      `avgVisible=${(averageVisibleFraction * 100).toFixed(1)}%`,
      `avgDropouts=${averageDropouts.toFixed(2)}`,
    ].join(" "),
  );
}
