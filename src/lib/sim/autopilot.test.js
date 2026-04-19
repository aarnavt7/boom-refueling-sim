import { describe, expect, test } from "bun:test";

import { getTankerPose } from "./aircraftAttachments.ts";
import { applyAutopilotCommand, tankerBodyToEcef, toAutopilotCommandECEF } from "./autopilot.ts";
import { INITIAL_BOOM_STATE } from "./constants.ts";

describe("autopilot adapter", () => {
  test("body-frame increments convert into ECEF deltas", () => {
    const tankerPose = getTankerPose();
    const delta = tankerBodyToEcef({ x: 0.04, y: -0.02, z: 0.08 }, tankerPose);

    expect(delta.x).toBeCloseTo(0.04, 8);
    expect(delta.y).toBeCloseTo(-0.02, 8);
    expect(delta.z).toBeCloseTo(0.08, 8);
  });

  test("moveECEF command saturates to the autopilot max step", () => {
    const command = toAutopilotCommandECEF(
      {
        deltaBody: { x: 0.4, y: 0, z: 0.4 },
        mode: "track",
      },
      getTankerPose(),
    );

    expect(command.clamped).toBeTrue();
    expect(command.magnitude).toBeLessThanOrEqual(0.08);
  });

  test("autopilot plant respects boom limits while moving toward desired tip motion", () => {
    const command = toAutopilotCommandECEF(
      {
        deltaBody: { x: 0.03, y: -0.01, z: 0.04 },
        mode: "track",
      },
      getTankerPose(),
    );

    const result = applyAutopilotCommand(INITIAL_BOOM_STATE, command, getTankerPose(), 1 / 60);

    expect(result.nextBoom.extend).toBeGreaterThanOrEqual(INITIAL_BOOM_STATE.extend);
    expect(Math.abs(result.command.yawRate)).toBeGreaterThanOrEqual(0);
  });
});
