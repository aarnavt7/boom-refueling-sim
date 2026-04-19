import { describe, expect, test } from "bun:test";

import { EMPTY_ESTIMATE, EMPTY_METRICS, EMPTY_SAFETY, EMPTY_TRACKER, INITIAL_BOOM_STATE } from "./constants.ts";
import { updateController } from "./controller.ts";
import { getBoomTipPose } from "./kinematics.ts";
import { getScenarioById } from "./scenarios.ts";
import { evaluateSafety } from "./safety.ts";

describe("controller and safety", () => {
  const scenario = getScenarioById("steady-approach");

  test("controller keeps inserting through a transient low-confidence frame when fused track is still strong", () => {
    const boom = { ...INITIAL_BOOM_STATE };
    const boomTip = getBoomTipPose(boom).position;
    const target = { x: 0.25, y: -0.2, z: 15.4 };

    const result = updateController({
      state: "INSERT",
      scenario,
      boom,
      boomTip,
      trackedTarget: {
        ...EMPTY_TRACKER,
        pose: { position: target, rotation: { x: 0, y: 0, z: 0 } },
        position: target,
        confidence: 0.72,
        lost: false,
      },
      estimate: {
        ...EMPTY_ESTIMATE,
        visible: true,
        dropout: true,
      },
      safety: EMPTY_SAFETY,
      simTime: 12,
    });

    expect(result.state).toBe("ALIGN");
  });

  test("controller treats MATED as a terminal success state", () => {
    const boom = { ...INITIAL_BOOM_STATE };
    const result = updateController({
      state: "MATED",
      scenario,
      boom,
      boomTip: getBoomTipPose(boom).position,
      trackedTarget: EMPTY_TRACKER,
      estimate: EMPTY_ESTIMATE,
      safety: EMPTY_SAFETY,
      simTime: 15,
    });

    expect(result.state).toBe("MATED");
    expect(result.desiredTipMotion.mode).toBe("hold");
    expect(result.desiredTipMotion.deltaBody).toEqual({ x: 0, y: 0, z: 0 });
  });

  test("safety holds on moderate passive disagreement near the receptacle", () => {
    const safety = evaluateSafety({
      state: "ALIGN",
      scenario,
      metrics: {
        ...EMPTY_METRICS,
        positionError: 0.78,
        sensorDisagreement: 0.5,
      },
      previousMetrics: {
        ...EMPTY_METRICS,
        positionError: 0.8,
      },
      boomTip: { x: 0, y: -1, z: 14.1 },
      receiverPose: {
        position: { x: 0, y: -2.8, z: 14.8 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      receiverVelocity: { x: 0.1, y: 0.1, z: 0.12 },
      tracker: {
        ...EMPTY_TRACKER,
        confidence: 0.3,
      },
      observations: [EMPTY_ESTIMATE],
      manualAbort: false,
    });

    expect(safety.hold).toBeTrue();
    expect(safety.breakaway).toBeFalse();
  });

  test("manual abort immediately triggers breakaway", () => {
    const safety = evaluateSafety({
      state: "INSERT",
      scenario,
      metrics: {
        ...EMPTY_METRICS,
        positionError: 0.68,
      },
      previousMetrics: {
        ...EMPTY_METRICS,
        positionError: 0.72,
      },
      boomTip: { x: 0, y: -1, z: 14.2 },
      receiverPose: {
        position: { x: 0, y: -2.8, z: 14.9 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      receiverVelocity: { x: 0.08, y: 0.03, z: 0.09 },
      tracker: {
        ...EMPTY_TRACKER,
        confidence: 0.64,
      },
      observations: [EMPTY_ESTIMATE],
      manualAbort: true,
    });

    expect(safety.breakaway).toBeTrue();
    expect(safety.reasons).toContain("Manual breakaway commanded");
  });
});
