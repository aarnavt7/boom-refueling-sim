import { vec3 } from "@/lib/sim/math";
import { getBoomBasePose } from "@/lib/sim/kinematics";
import {
  clamp,
  distanceVec3,
  localOffsetFromWorld,
} from "@/lib/sim/math";
import type {
  BoomJointState,
  ControllerState,
  DesiredTipMotion,
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
}: ControllerInput): { state: ControllerState; desiredTipMotion: DesiredTipMotion } {
  if (safety.breakaway) {
    return {
      state: "BREAKAWAY" as const,
      desiredTipMotion: breakawayMotion(),
    };
  }

  if (safety.abort) {
    return {
      state: "ABORT" as const,
      desiredTipMotion: retractMotion("retract", 1.2),
    };
  }

  if (state === "MATED") {
    return {
      state: "MATED" as const,
      desiredTipMotion: { deltaBody: vec3(), mode: "hold" },
    };
  }

  if (!trackedTarget.position) {
    return {
      state: "SEARCH" as const,
      desiredTipMotion: searchMotion(simTime, scenario, boom),
    };
  }

  const target = trackedTarget.position;
  const basePose = getBoomBasePose();
  const relTip = localOffsetFromWorld(boomTip, basePose.rotation, target);
  const lateralError = Math.hypot(relTip.x, relTip.y);
  const tipDistance = distanceVec3(target, boomTip);
  const stagingPoint = {
    x: target.x,
    y: target.y,
    z: target.z - 1.15,
  };
  const relStaging = localOffsetFromWorld(boomTip, basePose.rotation, stagingPoint);

  let nextState: ControllerState = state;

  if (safety.hold) {
    nextState = "HOLD";
  } else if (nextState === "HOLD" && trackedTarget.confidence > 0.34 && !safety.hold) {
    nextState = relTip.z > 0.9 ? "TRACK" : "ALIGN";
  } else if (nextState === "SEARCH" && estimate.confidence > 0.24) {
    nextState = "ACQUIRE";
  } else if (nextState === "ACQUIRE" && trackedTarget.confidence > 0.42) {
    nextState = "TRACK";
  } else if (
    nextState === "TRACK" &&
    lateralError < scenario.controller.alignTolerance * 1.4 &&
    relStaging.z > -0.25
  ) {
    nextState = "ALIGN";
  } else if (
    nextState === "ALIGN" &&
    lateralError < scenario.controller.insertTolerance * 1.15 &&
    relTip.z > 0.02
  ) {
    nextState = "INSERT";
  } else if (
    nextState === "INSERT" &&
    lateralError > scenario.controller.insertTolerance * 1.6
  ) {
    nextState = "ALIGN";
  } else if (nextState === "INSERT" && tipDistance < scenario.controller.mateTolerance) {
    nextState = "MATED";
  } else if (
    nextState !== "SEARCH" &&
    nextState !== "HOLD" &&
    trackedTarget.confidence < 0.12
  ) {
    nextState = "SEARCH";
  }

  let desiredTipMotion: DesiredTipMotion;

  switch (nextState) {
    case "SEARCH":
      desiredTipMotion = searchMotion(simTime, scenario, boom);
      break;
    case "ACQUIRE":
      desiredTipMotion = trackPointMotion(relStaging, scenario, 0.72, "track");
      break;
    case "TRACK":
      desiredTipMotion = trackPointMotion(relStaging, scenario, 0.78, "track");
      break;
    case "ALIGN":
      desiredTipMotion = trackPointMotion(relStaging, scenario, 0.86, "track");
      break;
    case "INSERT": {
      const aligned = lateralError < scenario.controller.insertTolerance;
      desiredTipMotion = aligned
        ? trackPointMotion(relTip, scenario, scenario.controller.closureGain, "track")
        : retractMotion("hold", 0.16);
      break;
    }
    case "MATED":
      desiredTipMotion = { deltaBody: vec3(), mode: "hold" };
      break;
    case "HOLD":
      desiredTipMotion = retractMotion("hold", 0.28);
      break;
    case "ABORT":
      desiredTipMotion = retractMotion("retract", 1.2);
      break;
    case "BREAKAWAY":
      desiredTipMotion = breakawayMotion();
      break;
  }

  return {
    state: nextState,
    desiredTipMotion,
  };
}

function searchMotion(
  simTime: number,
  scenario: ScenarioPreset,
  boom: BoomJointState,
): DesiredTipMotion {
  const standByError = scenario.controller.standbyExtend - boom.extend;

  return {
    deltaBody: {
      x: Math.sin(simTime * 0.72) * scenario.controller.searchAmplitude.x,
      y: Math.cos(simTime * 0.49) * scenario.controller.searchAmplitude.y,
      z: clamp(standByError * 0.08, -scenario.controller.maxBodyStep, scenario.controller.maxBodyStep),
    },
    mode: "track",
  };
}

function trackPointMotion(
  localDelta: Vec3,
  scenario: ScenarioPreset,
  gain: number,
  mode: DesiredTipMotion["mode"],
): DesiredTipMotion {
  return {
    deltaBody: {
      x: clamp(localDelta.x * gain, -scenario.controller.maxBodyStep, scenario.controller.maxBodyStep),
      y: clamp(localDelta.y * gain, -scenario.controller.maxBodyStep, scenario.controller.maxBodyStep),
      z: clamp(localDelta.z * gain, -scenario.controller.maxBodyStep, scenario.controller.maxBodyStep),
    },
    mode,
  };
}

function retractMotion(mode: DesiredTipMotion["mode"], rate: number): DesiredTipMotion {
  return {
    deltaBody: {
      x: 0,
      y: 0,
      z: -Math.abs(rate) * 0.08,
    },
    mode,
  };
}

function breakawayMotion(): DesiredTipMotion {
  return {
    deltaBody: {
      x: 0,
      y: -0.05,
      z: -0.18,
    },
    mode: "breakaway",
  };
}
