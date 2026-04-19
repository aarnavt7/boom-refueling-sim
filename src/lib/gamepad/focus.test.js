import { describe, expect, test } from "bun:test";

import {
  getDefaultFocusTargetId,
  getNextFocusTargetId,
  getNextGroupTargetId,
} from "./focus.ts";

const targets = [
  {
    id: "header-home",
    group: "header",
    scope: "hud",
    order: 0,
    rect: { left: 0, top: 0, right: 80, bottom: 32, width: 80, height: 32 },
  },
  {
    id: "start-run",
    group: "scenario",
    scope: "hud",
    order: 1,
    rect: { left: 0, top: 60, right: 120, bottom: 92, width: 120, height: 32 },
  },
  {
    id: "pause-run",
    group: "scenario",
    scope: "hud",
    order: 2,
    rect: { left: 140, top: 60, right: 260, bottom: 92, width: 120, height: 32 },
  },
  {
    id: "replay-toggle",
    group: "replay",
    scope: "hud",
    order: 3,
    rect: { left: 0, top: 140, right: 120, bottom: 172, width: 120, height: 32 },
  },
  {
    id: "overlay-next",
    group: "overlay",
    scope: "overlay",
    order: 0,
    rect: { left: 40, top: 40, right: 180, bottom: 72, width: 140, height: 32 },
  },
];

describe("gamepad focus helpers", () => {
  test("chooses the first sorted target as the default", () => {
    expect(getDefaultFocusTargetId(targets.filter((target) => target.scope === "hud"))).toBe(
      "header-home",
    );
  });

  test("moves to the nearest target in the requested direction", () => {
    const hudTargets = targets.filter((target) => target.scope === "hud");

    expect(
      getNextFocusTargetId({
        targets: hudTargets,
        currentId: "start-run",
        direction: "right",
      }),
    ).toBe("pause-run");

    expect(
      getNextFocusTargetId({
        targets: hudTargets,
        currentId: "start-run",
        direction: "down",
      }),
    ).toBe("replay-toggle");
  });

  test("cycles horizontally through siblings in the same button group", () => {
    const hudTargets = targets.filter((target) => target.scope === "hud");

    expect(
      getNextFocusTargetId({
        targets: hudTargets,
        currentId: "start-run",
        direction: "right",
      }),
    ).toBe("pause-run");

    expect(
      getNextFocusTargetId({
        targets: hudTargets,
        currentId: "pause-run",
        direction: "left",
      }),
    ).toBe("start-run");
  });

  test("jumps between ordered focus groups with bumpers", () => {
    const hudTargets = targets.filter((target) => target.scope === "hud");

    expect(
      getNextGroupTargetId({
        targets: hudTargets,
        currentGroup: "scenario",
        direction: "next",
      }),
    ).toBe("replay-toggle");

    expect(
      getNextGroupTargetId({
        targets: hudTargets,
        currentGroup: "scenario",
        direction: "previous",
      }),
    ).toBe("header-home");
  });

  test("overlay focus calculations stay trapped to overlay targets", () => {
    const overlayTargets = targets.filter((target) => target.scope === "overlay");

    expect(getDefaultFocusTargetId(overlayTargets)).toBe("overlay-next");
    expect(
      getNextGroupTargetId({
        targets: overlayTargets,
        currentGroup: "overlay",
        direction: "next",
      }),
    ).toBe("overlay-next");
  });
});
