import { describe, expect, test } from "bun:test";

import {
  classifyGamepadDevice,
  createGamepadInputMemory,
  normalizeAxisWithDeadzone,
  sampleGamepadInput,
} from "./normalize.ts";

function createGamepad({
  id = "Xbox Wireless Controller",
  mapping = "standard",
  axes = [0, 0, 0, 0],
  pressed = {},
  values = {},
} = {}) {
  const buttons = Array.from({ length: 16 }, (_, index) => ({
    pressed: !!pressed[index],
    value: values[index] ?? (pressed[index] ? 1 : 0),
  }));

  return {
    id,
    mapping,
    axes,
    buttons,
  };
}

describe("gamepad normalization", () => {
  test("applies a deadzone before scaling stick input", () => {
    expect(normalizeAxisWithDeadzone(0.12)).toBe(0);
    expect(normalizeAxisWithDeadzone(-0.12)).toBe(0);
    expect(normalizeAxisWithDeadzone(0.5)).toBeGreaterThan(0.35);
    expect(normalizeAxisWithDeadzone(-0.5)).toBeLessThan(-0.35);
  });

  test("classifies Xbox-style controllers separately from generic pads", () => {
    expect(
      classifyGamepadDevice({ id: "Xbox Wireless Controller", mapping: "standard" }),
    ).toBe("xbox");
    expect(
      classifyGamepadDevice({ id: "Generic USB Joystick", mapping: "standard" }),
    ).toBe("standard-gamepad");
    expect(classifyGamepadDevice(null)).toBe("none");
  });

  test("marks just-pressed and repeated navigation actions", () => {
    const memory = createGamepadInputMemory();
    const baseGamepad = createGamepad({
      axes: [0.8, 0, 0, 0],
    });

    const first = sampleGamepadInput(baseGamepad, memory, 0);
    expect(first.state.actions.moveRight.justPressed).toBeTrue();
    expect(first.state.actions.moveRight.repeat).toBeFalse();

    const held = sampleGamepadInput(baseGamepad, first.memory, 200);
    expect(held.state.actions.moveRight.justPressed).toBeFalse();
    expect(held.state.actions.moveRight.repeat).toBeFalse();

    const repeated = sampleGamepadInput(baseGamepad, held.memory, 320);
    expect(repeated.state.actions.moveRight.repeat).toBeTrue();
  });

  test("tracks button release edges and trigger-based zoom", () => {
    const memory = createGamepadInputMemory();
    const pressed = sampleGamepadInput(
      createGamepad({
        values: { 7: 1 },
      }),
      memory,
      0,
    );
    expect(pressed.state.actions.zoomIn.pressed).toBeTrue();

    const released = sampleGamepadInput(createGamepad(), pressed.memory, 20);
    expect(released.state.actions.zoomIn.justReleased).toBeTrue();
    expect(released.state.actions.zoomIn.pressed).toBeFalse();
  });
});
