import { describe, expect, test } from "bun:test";
import * as THREE from "three";

import { INITIAL_BOOM_STATE, JOINT_LIMITS, RATE_LIMITS } from "./constants.ts";
import { applyIncrementCommand, getBoomDirection, getBoomTipPose, solveBoomIK } from "./kinematics.ts";

function expectVecClose(actual, expected, tolerance = 1e-9) {
  expect(Math.abs(actual.x - expected.x)).toBeLessThan(tolerance);
  expect(Math.abs(actual.y - expected.y)).toBeLessThan(tolerance);
  expect(Math.abs(actual.z - expected.z)).toBeLessThan(tolerance);
}

describe("sim kinematics", () => {
  test("getBoomDirection matches the rendered yaw/pitch hierarchy", () => {
    const boom = {
      yaw: 0.32,
      pitch: -0.24,
      extend: INITIAL_BOOM_STATE.extend,
    };

    const actual = getBoomDirection(boom);
    const expected = new THREE.Vector3(0, 0, 1).applyEuler(
      new THREE.Euler(boom.pitch, boom.yaw, 0, "XYZ"),
    );

    expectVecClose(actual, expected);
  });

  test("applyIncrementCommand clamps rate commands and joint limits", () => {
    const next = applyIncrementCommand(
      {
        yaw: JOINT_LIMITS.yaw.max - 0.01,
        pitch: JOINT_LIMITS.pitch.min + 0.01,
        extend: JOINT_LIMITS.extend.max - 0.02,
      },
      {
        yawRate: RATE_LIMITS.yawRate * 4,
        pitchRate: -RATE_LIMITS.pitchRate * 4,
        extendRate: RATE_LIMITS.extendRate * 4,
      },
      1,
    );

    expect(next.yaw).toBe(JOINT_LIMITS.yaw.max);
    expect(next.pitch).toBe(JOINT_LIMITS.pitch.min);
    expect(next.extend).toBe(JOINT_LIMITS.extend.max);
  });

  test("solveBoomIK reconstructs the current boom tip pose", () => {
    const joints = {
      yaw: 0.18,
      pitch: -0.22,
      extend: 8.9,
    };

    const target = getBoomTipPose(joints).position;
    const solved = solveBoomIK(target);

    expect(solved.yaw).toBeCloseTo(joints.yaw, 2);
    expect(solved.pitch).toBeCloseTo(joints.pitch, 2);
    expect(solved.extend).toBeCloseTo(joints.extend, 2);
  });
});
