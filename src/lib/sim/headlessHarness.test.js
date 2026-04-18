import { describe, expect, test } from "bun:test";

import { runHeadlessScenario } from "./headlessHarness.ts";

describe("headless scenario harness", () => {
  test("steady approach docks without aborting", () => {
    const result = runHeadlessScenario({
      scenarioId: "steady-approach",
      durationSeconds: 20,
      stopOnDocked: true,
    });

    expect(result.finalState).toBe("DOCKED");
    expect(result.abortReason).toBeNull();
    expect(result.dockedAt).not.toBeNull();
    expect(result.minPositionError).toBeLessThan(0.25);
  });

  test("sensor degraded still reaches a docked solution", () => {
    const result = runHeadlessScenario({
      scenarioId: "sensor-degraded",
      durationSeconds: 20,
      stopOnDocked: true,
    });

    expect(result.finalState).toBe("DOCKED");
    expect(result.abortReason).toBeNull();
    expect(result.dockedAt).not.toBeNull();
    expect(result.minPositionError).toBeLessThan(0.26);
  });
});
