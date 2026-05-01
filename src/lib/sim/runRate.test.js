import {
  DEFAULT_LIVE_RUN_RATE,
  formatLiveRunRate,
  stepLiveRunRate,
} from "./runRate.ts";

test("stepLiveRunRate moves through the supported rate ladder and clamps at the ends", () => {
  expect(stepLiveRunRate(DEFAULT_LIVE_RUN_RATE, -1)).toBe(0.5);
  expect(stepLiveRunRate(DEFAULT_LIVE_RUN_RATE, 1)).toBe(1.5);
  expect(stepLiveRunRate(2, 1)).toBe(2);
  expect(stepLiveRunRate(0.5, -1)).toBe(0.5);
});

test("formatLiveRunRate renders a compact HUD label", () => {
  expect(formatLiveRunRate(1)).toBe("1.0x");
  expect(formatLiveRunRate(1.5)).toBe("1.5x");
});
