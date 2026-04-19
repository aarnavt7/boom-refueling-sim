import type {
  GamepadAction,
  GamepadDeviceType,
  Vec2,
} from "@/lib/sim/types";

export const GAMEPAD_DEADZONE = 0.18;
export const GAMEPAD_DIGITAL_THRESHOLD = 0.58;
export const GAMEPAD_REPEAT_DELAY_MS = 260;
export const GAMEPAD_REPEAT_INTERVAL_MS = 110;

export const GAMEPAD_ACTIONS: readonly GamepadAction[] = [
  "confirm",
  "back",
  "context",
  "cycleCamera",
  "groupPrev",
  "groupNext",
  "recenter",
  "moveUp",
  "moveDown",
  "moveLeft",
  "moveRight",
  "zoomIn",
  "zoomOut",
];

export type GamepadActionState = {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
  repeat: boolean;
  value: number;
};

export type NormalizedGamepadState = {
  connected: boolean;
  supported: boolean;
  deviceType: GamepadDeviceType;
  id: string | null;
  mapping: string | null;
  leftStick: Vec2;
  rightStick: Vec2;
  leftTrigger: number;
  rightTrigger: number;
  actions: Record<GamepadAction, GamepadActionState>;
};

type GamepadActionMemory = {
  wasPressed: boolean;
  heldSince: number | null;
  nextRepeatAt: number | null;
};

export type GamepadInputMemory = {
  actions: Record<GamepadAction, GamepadActionMemory>;
};

function createDefaultActionState(): GamepadActionState {
  return {
    pressed: false,
    justPressed: false,
    justReleased: false,
    repeat: false,
    value: 0,
  };
}

function createActionMemory(): GamepadActionMemory {
  return {
    wasPressed: false,
    heldSince: null,
    nextRepeatAt: null,
  };
}

export function createGamepadInputMemory(): GamepadInputMemory {
  return {
    actions: Object.fromEntries(
      GAMEPAD_ACTIONS.map((action) => [action, createActionMemory()]),
    ) as Record<GamepadAction, GamepadActionMemory>,
  };
}

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function normalizeAxisWithDeadzone(
  value: number,
  deadzone = GAMEPAD_DEADZONE,
) {
  const magnitude = Math.abs(value);
  if (magnitude <= deadzone) {
    return 0;
  }

  const normalized = (magnitude - deadzone) / Math.max(1 - deadzone, 1e-6);
  return Math.sign(value) * Math.min(1, normalized);
}

export function normalizeStick(
  x: number,
  y: number,
  deadzone = GAMEPAD_DEADZONE,
): Vec2 {
  const nx = normalizeAxisWithDeadzone(x, deadzone);
  const ny = normalizeAxisWithDeadzone(y, deadzone);
  const magnitude = Math.hypot(nx, ny);

  if (magnitude <= 1 || magnitude === 0) {
    return { x: nx, y: ny };
  }

  return {
    x: nx / magnitude,
    y: ny / magnitude,
  };
}

export function classifyGamepadDevice(
  gamepad: Pick<Gamepad, "id" | "mapping"> | null | undefined,
): GamepadDeviceType {
  if (!gamepad) {
    return "none";
  }

  const signature = `${gamepad.id} ${gamepad.mapping}`.toLowerCase();
  if (
    signature.includes("xbox") ||
    signature.includes("xinput") ||
    signature.includes("microsoft")
  ) {
    return "xbox";
  }

  return "standard-gamepad";
}

function getButtonValue(gamepad: Gamepad, index: number) {
  return clampUnit(gamepad.buttons[index]?.value ?? 0);
}

function getButtonPressed(gamepad: Gamepad, index: number) {
  return !!gamepad.buttons[index]?.pressed || getButtonValue(gamepad, index) > 0.5;
}

function createActionFrame(
  rawPressed: boolean,
  rawValue: number,
  memory: GamepadActionMemory,
  now: number,
) {
  const pressed = rawPressed || rawValue > 0.5;
  const justPressed = pressed && !memory.wasPressed;
  const justReleased = !pressed && memory.wasPressed;
  let repeat = false;

  if (justPressed) {
    memory.heldSince = now;
    memory.nextRepeatAt = now + GAMEPAD_REPEAT_DELAY_MS;
  } else if (pressed && memory.nextRepeatAt !== null && now >= memory.nextRepeatAt) {
    repeat = true;
    memory.nextRepeatAt = now + GAMEPAD_REPEAT_INTERVAL_MS;
  } else if (!pressed) {
    memory.heldSince = null;
    memory.nextRepeatAt = null;
  }

  memory.wasPressed = pressed;

  return {
    pressed,
    justPressed,
    justReleased,
    repeat,
    value: clampUnit(rawValue),
  } satisfies GamepadActionState;
}

function createDisconnectedState(): NormalizedGamepadState {
  return {
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
      GAMEPAD_ACTIONS.map((action) => [action, createDefaultActionState()]),
    ) as Record<GamepadAction, GamepadActionState>,
  };
}

export function sampleGamepadInput(
  gamepad: Gamepad | null | undefined,
  previousMemory: GamepadInputMemory,
  now: number,
) {
  if (!gamepad) {
    return {
      state: createDisconnectedState(),
      memory: createGamepadInputMemory(),
    };
  }

  const leftStick = normalizeStick(gamepad.axes[0] ?? 0, gamepad.axes[1] ?? 0);
  const rightStick = normalizeStick(gamepad.axes[2] ?? 0, gamepad.axes[3] ?? 0);
  const leftTrigger = getButtonValue(gamepad, 6);
  const rightTrigger = getButtonValue(gamepad, 7);
  const supported = gamepad.mapping === "standard";
  const deviceType = classifyGamepadDevice(gamepad);

  const nextMemory: GamepadInputMemory = {
    actions: Object.fromEntries(
      GAMEPAD_ACTIONS.map((action) => [
        action,
        { ...previousMemory.actions[action] },
      ]),
    ) as Record<GamepadAction, GamepadActionMemory>,
  };

  const rawActionValues: Record<GamepadAction, number> = {
    confirm: getButtonValue(gamepad, 0),
    back: getButtonValue(gamepad, 1),
    context: getButtonValue(gamepad, 2),
    cycleCamera: getButtonValue(gamepad, 3),
    groupPrev: getButtonValue(gamepad, 4),
    groupNext: getButtonValue(gamepad, 5),
    recenter: getButtonValue(gamepad, 11),
    moveUp: getButtonPressed(gamepad, 12) || leftStick.y <= -GAMEPAD_DIGITAL_THRESHOLD ? 1 : 0,
    moveDown: getButtonPressed(gamepad, 13) || leftStick.y >= GAMEPAD_DIGITAL_THRESHOLD ? 1 : 0,
    moveLeft: getButtonPressed(gamepad, 14) || leftStick.x <= -GAMEPAD_DIGITAL_THRESHOLD ? 1 : 0,
    moveRight: getButtonPressed(gamepad, 15) || leftStick.x >= GAMEPAD_DIGITAL_THRESHOLD ? 1 : 0,
    zoomIn: rightTrigger,
    zoomOut: leftTrigger,
  };

  const actions = Object.fromEntries(
    GAMEPAD_ACTIONS.map((action) => {
      const value = rawActionValues[action];
      const state = createActionFrame(
        value > 0.5,
        value,
        nextMemory.actions[action],
        now,
      );
      return [action, state];
    }),
  ) as Record<GamepadAction, GamepadActionState>;

  return {
    state: {
      connected: true,
      supported,
      deviceType,
      id: gamepad.id || null,
      mapping: gamepad.mapping || null,
      leftStick,
      rightStick,
      leftTrigger,
      rightTrigger,
      actions,
    } satisfies NormalizedGamepadState,
    memory: nextMemory,
  };
}

export function pickPrimaryGamepad(
  gamepads: ArrayLike<Gamepad | null> | null | undefined,
) {
  if (!gamepads) {
    return null;
  }

  let fallback: Gamepad | null = null;
  for (const gamepad of Array.from(gamepads)) {
    if (!gamepad) {
      continue;
    }

    if (gamepad.mapping === "standard") {
      return gamepad;
    }

    fallback ??= gamepad;
  }

  return fallback;
}
