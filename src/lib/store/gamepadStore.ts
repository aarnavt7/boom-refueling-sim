"use client";

import { create } from "zustand";

import { createGamepadInputMemory } from "@/lib/gamepad/normalize";
import type { NormalizedGamepadState } from "@/lib/gamepad/normalize";
import type { GamepadDeviceType, GamepadUiMode } from "@/lib/sim/types";

const EMPTY_GAMEPAD_STATE: NormalizedGamepadState = {
  connected: false,
  supported: false,
  deviceType: "none",
  id: null,
  mapping: null,
  leftStick: { x: 0, y: 0 },
  rightStick: { x: 0, y: 0 },
  leftTrigger: 0,
  rightTrigger: 0,
  actions: Object.fromEntries(
    Object.keys(createGamepadInputMemory().actions).map((key) => [
      key,
      {
        pressed: false,
        justPressed: false,
        justReleased: false,
        repeat: false,
        value: 0,
      },
    ]),
  ) as NormalizedGamepadState["actions"],
};

type GamepadStore = {
  connected: boolean;
  supported: boolean;
  deviceType: GamepadDeviceType;
  lastInputDevice: GamepadDeviceType;
  rawId: string | null;
  uiMode: GamepadUiMode;
  focusedId: string | null;
  focusedGroup: string | null;
  focusedLabel: string | null;
  controllerHintsDismissed: boolean;
  cameraResetCount: number;
  input: NormalizedGamepadState;
  hydrateFromPrefs: (prefs: {
    lastInputDevice?: GamepadDeviceType;
    controllerHintsDismissed?: boolean;
  }) => void;
  setConnection: (connection: {
    connected: boolean;
    supported: boolean;
    deviceType: GamepadDeviceType;
    rawId: string | null;
  }) => void;
  setUiMode: (mode: GamepadUiMode) => void;
  setFocusedTarget: (target: {
    id: string | null;
    group: string | null;
    label?: string | null;
  }) => void;
  setControllerHintsDismissed: (dismissed: boolean) => void;
  requestCameraReset: () => void;
  setInput: (input: NormalizedGamepadState) => void;
};

export const useGamepadStore = create<GamepadStore>((set) => ({
  connected: false,
  supported: false,
  deviceType: "none",
  lastInputDevice: "none",
  rawId: null,
  uiMode: "viewport",
  focusedId: null,
  focusedGroup: null,
  focusedLabel: null,
  controllerHintsDismissed: false,
  cameraResetCount: 0,
  input: EMPTY_GAMEPAD_STATE,
  hydrateFromPrefs: (prefs) =>
    set({
      lastInputDevice: prefs.lastInputDevice ?? "none",
      controllerHintsDismissed: prefs.controllerHintsDismissed ?? false,
    }),
  setConnection: ({ connected, supported, deviceType, rawId }) =>
    set((state) => ({
      connected,
      supported,
      deviceType,
      rawId,
      lastInputDevice: connected ? deviceType : state.lastInputDevice,
      input: connected ? state.input : EMPTY_GAMEPAD_STATE,
    })),
  setUiMode: (uiMode) => set({ uiMode }),
  setFocusedTarget: ({ id, group, label = null }) =>
    set({
      focusedId: id,
      focusedGroup: group,
      focusedLabel: label,
    }),
  setControllerHintsDismissed: (controllerHintsDismissed) =>
    set({ controllerHintsDismissed }),
  requestCameraReset: () =>
    set((state) => ({
      cameraResetCount: state.cameraResetCount + 1,
    })),
  setInput: (input) => set({ input }),
}));
