import { describe, expect, test } from "bun:test";

import {
  EMPTY_COMMAND,
  EMPTY_ESTIMATE,
  EMPTY_METRICS,
  EMPTY_SAFETY,
  INITIAL_BOOM_STATE,
} from "./constants.ts";
import { updateController } from "./controller.ts";
import { getBoomTipPose } from "./kinematics.ts";
import { getScenarioById } from "./scenarios.ts";
import { evaluateSafety } from "./safety.ts";

describe("controller and safety", () => {
  const scenario = getScenarioById("steady-approach");

  test("controller keeps tracking through a transient low-confidence frame", () => {
    const boom = { ...INITIAL_BOOM_STATE };
    const boomTip = getBoomTipPose(boom).position;
    const target = { x: 0.25, y: 0.05, z: 11.4 };

    const result = updateController({
      state: "INSERT",
      scenario,
      boom,
      boomTip,
      trackedTarget: {
        position: target,
        velocity: { x: 0, y: 0, z: 0 },
        confidence: 0.72,
      },
      estimate: {
        visible: true,
        dropout: true,
        confidence: 0,
        estimatedPosition: null,
        imagePoint: null,
        cameraSpacePosition: null,
      },
      safety: EMPTY_SAFETY,
      simTime: 12,
    });

    expect(result.state).toBe("INSERT");
  });

  test("controller treats DOCKED as a terminal success state", () => {
    const boom = { ...INITIAL_BOOM_STATE };
    const result = updateController({
      state: "DOCKED",
      scenario,
      boom,
      boomTip: getBoomTipPose(boom).position,
      trackedTarget: {
        position: null,
        velocity: { x: 0, y: 0, z: 0 },
        confidence: 0,
      },
      estimate: EMPTY_ESTIMATE,
      safety: EMPTY_SAFETY,
      simTime: 15,
    });

    expect(result.state).toBe("DOCKED");
    expect(result.command).toEqual(EMPTY_COMMAND);
  });

  test("safety does not abort on a single dropout when tracker confidence is strong", () => {
    const safety = evaluateSafety({
      state: "INSERT",
      scenario,
      estimate: {
        visible: true,
        dropout: true,
        confidence: 0,
        estimatedPosition: null,
        imagePoint: null,
        cameraSpacePosition: null,
      },
      metrics: {
        ...EMPTY_METRICS,
        positionError: 0.7,
        lateralError: 0.2,
        forwardError: 0.1,
      },
      previousMetrics: {
        ...EMPTY_METRICS,
        positionError: 0.76,
      },
      boomTip: { x: 0, y: -0.2, z: 12.1 },
      receiverPose: {
        position: { x: 0, y: 0, z: 15.5 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      trackerConfidence: 0.71,
    });

    expect(safety.abort).toBeFalse();
    expect(safety.hold).toBeFalse();
  });

  test("safety aborts when near-target tracking confidence fully collapses", () => {
    const safety = evaluateSafety({
      state: "INSERT",
      scenario,
      estimate: EMPTY_ESTIMATE,
      metrics: {
        ...EMPTY_METRICS,
        positionError: 0.68,
      },
      previousMetrics: {
        ...EMPTY_METRICS,
        positionError: 0.72,
      },
      boomTip: { x: 0, y: -0.2, z: 12.1 },
      receiverPose: {
        position: { x: 0, y: 0, z: 15.5 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      trackerConfidence: 0.04,
    });

    expect(safety.abort).toBeTrue();
    expect(safety.reasons).toContain("Low confidence near target");
  });
});
