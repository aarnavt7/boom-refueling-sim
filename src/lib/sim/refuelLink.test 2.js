import { describe, expect, test } from "bun:test";

import { getRefuelLinkVisibility } from "./refuelLink.ts";

describe("refuel link visibility", () => {
  const insertTolerance = 0.2;

  test("shows a pre-link during late insert and a full link once mated", () => {
    expect(
      getRefuelLinkVisibility({
        controllerState: "INSERT",
        linkDistance: 0.18,
        insertTolerance,
      }),
    ).toEqual({
      showPreLink: true,
      showMatedLink: false,
      visible: true,
    });

    expect(
      getRefuelLinkVisibility({
        controllerState: "MATED",
        linkDistance: 0.5,
        insertTolerance,
      }),
    ).toEqual({
      showPreLink: false,
      showMatedLink: true,
      visible: true,
    });
  });

  test("drops the link immediately during safety or recovery states", () => {
    for (const controllerState of ["HOLD", "ABORT", "BREAKAWAY"]) {
      expect(
        getRefuelLinkVisibility({
          controllerState,
          linkDistance: 0.04,
          insertTolerance,
        }),
      ).toEqual({
        showPreLink: false,
        showMatedLink: false,
        visible: false,
      });
    }
  });
});
