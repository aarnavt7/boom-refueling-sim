import { BOOM_BASE_POSITION, EMPTY_COMMAND } from "@/lib/sim/constants";
import {
  clamp,
  distanceVec3,
  lerp,
  subVec3,
  wrapAngle,
} from "@/lib/sim/math";
import type {
  BoomCommand,
  BoomJointState,
  ControllerState,
  PerceptionEstimate,
  SafetyStatus,
  ScenarioPreset,
  TrackerState,
  Vec3,
} from "@/lib/sim/types";

type ControllerInput = {
  state: ControllerState;
  scenario: ScenarioPreset;
  boom: BoomJointState;
  boomTip: Vec3;
  trackedTarget: TrackerState;
  estimate: PerceptionEstimate;
  safety: SafetyStatus;
  simTime: number;
};

export function updateController({
  state,
  scenario,
  boom,
  boomTip,
  trackedTarget,
  estimate,
  safety,
  simTime,
}: ControllerInput) {
  if (safety.abort) {
    return {
      state: "ABORT" as const,
      command: abortCommand(boom),
    };
  }

  if (state === "DOCKED") {
    return {
      state: "DOCKED" as const,
      command: EMPTY_COMMAND,
    };
  }

  if (!trackedTarget.position) {
    return {
      state: "SEARCH" as const,
      command: searchCommand(simTime, boom),
    };
  }

  const target = trackedTarget.position;
  const relBase = subVec3(target, BOOM_BASE_POSITION);
  const relTip = subVec3(target, boomTip);
  const desiredYaw = Math.atan2(relBase.x, Math.max(relBase.z, 0.01));
  const desiredPitch = Math.atan2(-relBase.y, Math.max(Math.hypot(relBase.x, relBase.z), 0.01));
  const yawError = wrapAngle(desiredYaw - boom.yaw);
  const pitchError = wrapAngle(desiredPitch - boom.pitch);
  const lateralError = Math.hypot(relTip.x, relTip.y);
  const tipDistance = distanceVec3(target, boomTip);

  let nextState: ControllerState = state;

  if (nextState === "SEARCH" && estimate.confidence > 0.28) {
    nextState = "ACQUIRE";
  } else if (nextState === "ACQUIRE" && estimate.confidence > 0.48) {
    nextState = "ALIGN";
  } else if (
    nextState === "ALIGN" &&
    lateralError < scenario.controller.alignTolerance &&
    Math.abs(yawError) < 0.08 &&
    Math.abs(pitchError) < 0.08
  ) {
    nextState = "INSERT";
  } else if (nextState === "INSERT" && tipDistance < scenario.controller.dockTolerance) {
    nextState = "DOCKED";
  } else if (nextState !== "SEARCH" && trackedTarget.confidence < 0.06) {
    nextState = "SEARCH";
  }

  let command: BoomCommand = EMPTY_COMMAND;

  switch (nextState) {
    case "SEARCH":
      command = searchCommand(simTime, boom);
      break;
    case "ACQUIRE":
      command = trackingCommand(yawError, pitchError, -0.5 * (boom.extend - scenario.controller.standbyExtend));
      break;
    case "ALIGN": {
      const desiredExtend = clamp(relBase.z - 2.2, 5.5, scenario.controller.standbyExtend + 1.4);
      command = trackingCommand(
        yawError,
        pitchError,
        clamp((desiredExtend - boom.extend) * 0.9, -0.8, 0.8),
      );
      break;
    }
    case "INSERT": {
      const aligned = lateralError < scenario.controller.insertTolerance;
      const extendRate = aligned ? clamp(relTip.z * 0.8 + 0.25, 0.1, 1.4) : -0.3;
      command = trackingCommand(yawError, pitchError, extendRate);
      break;
    }
    case "DOCKED":
      command = EMPTY_COMMAND;
      break;
    case "ABORT":
      command = abortCommand(boom);
      break;
  }

  if (safety.hold && nextState !== "DOCKED" && nextState !== "ABORT") {
    command = {
      ...command,
      extendRate: Math.min(0, command.extendRate),
    };
  }

  return {
    state: nextState,
    command,
  };
}

function searchCommand(simTime: number, boom: BoomJointState): BoomCommand {
  const centerBias = lerp(0, -boom.yaw, 0.15);
  return {
    yawRate: Math.sin(simTime * 0.8) * 0.28 + centerBias,
    pitchRate: Math.cos(simTime * 0.55) * 0.18 - boom.pitch * 0.12,
    extendRate: clamp((7.1 - boom.extend) * 0.45, -0.6, 0.6),
  };
}

function trackingCommand(yawError: number, pitchError: number, extendRate: number): BoomCommand {
  return {
    yawRate: clamp(yawError * 2.2, -0.55, 0.55),
    pitchRate: clamp(pitchError * 2.0, -0.42, 0.42),
    extendRate,
  };
}

function abortCommand(boom: BoomJointState): BoomCommand {
  return {
    yawRate: clamp(-boom.yaw * 1.3, -0.5, 0.5),
    pitchRate: clamp(-boom.pitch * 1.3, -0.45, 0.45),
    extendRate: -1.2,
  };
}
