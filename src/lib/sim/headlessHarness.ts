import { getReceiverReceptacleWorld, getTankerPose } from "@/lib/sim/aircraftAttachments";
import { applyAutopilotCommand, toAutopilotCommandECEF } from "@/lib/sim/autopilot";
import { applyAutonomyOutputToPose } from "@/lib/sim/autonomyUpload";
import {
  EMPTY_METRICS,
  EMPTY_SAFETY,
  EMPTY_TRACKER,
  INITIAL_BOOM_STATE,
  SENSOR_RIGS,
} from "@/lib/sim/constants";
import { updateController } from "@/lib/sim/controller";
import { getBoomTipPose } from "@/lib/sim/kinematics";
import { computeMetrics } from "@/lib/sim/metrics";
import { sampleReceiverPose } from "@/lib/sim/motion";
import { runPassivePerception } from "@/lib/sim/perception";
import { createReplaySample } from "@/lib/sim/replay";
import { evaluateSafety } from "@/lib/sim/safety";
import { getScenarioById } from "@/lib/sim/scenarios";
import { updateTracker } from "@/lib/sim/tracker";
import type {
  AutonomyControllerOutput,
  ControllerState,
  ReplaySample,
  ScenarioPreset,
  SimMetrics,
} from "@/lib/sim/types";

type StateFrameCounts = Partial<Record<ControllerState, number>>;

type PreferredRoleFrameCounts = {
  acquire: number;
  terminal: number;
};

export type HeadlessRunOptions = {
  scenarioId?: string;
  scenario?: ScenarioPreset;
  durationSeconds?: number;
  dt?: number;
  stopOnDocked?: boolean;
  manualAbortAt?: number | null;
  collectReplay?: boolean;
  autonomyOutputs?: Array<AutonomyControllerOutput | null>;
};

export type HeadlessRunSummary = {
  scenarioId: string;
  scenarioName: string;
  framesSimulated: number;
  simulatedSeconds: number;
  finalState: ControllerState;
  abortReason: string | null;
  dockedAt: number | null;
  minPositionError: number;
  visibleFraction: number;
  dropoutCount: number;
  finalMetrics: SimMetrics;
  finalTrackerConfidence: number;
  stateFrameCounts: StateFrameCounts;
  firstStateAt: StateFrameCounts;
  preferredRoleFrameCounts: PreferredRoleFrameCounts;
  peakPositionError: number;
  peakLateralError: number;
  maxSensorDisagreement: number;
  dropoutRate: number;
  replaySamples: ReplaySample[];
};

export function runHeadlessScenario({
  scenarioId = "steady-approach",
  scenario: inputScenario,
  durationSeconds = 20,
  dt = 1 / 60,
  stopOnDocked = false,
  manualAbortAt = null,
  collectReplay = false,
  autonomyOutputs = [],
}: HeadlessRunOptions = {}): HeadlessRunSummary {
  const scenario = inputScenario ?? getScenarioById(scenarioId);
  const totalFrames = Math.ceil(durationSeconds / dt);

  let boom = { ...INITIAL_BOOM_STATE };
  let tracker = EMPTY_TRACKER;
  let metrics = EMPTY_METRICS;
  let controllerState: ControllerState = "SEARCH";
  let abortReason: string | null = null;
  let dockedAt: number | null = null;
  let minPositionError = Number.POSITIVE_INFINITY;
  let visibleFrames = 0;
  let dropoutCount = 0;
  let framesSimulated = 0;
  let previousReceiverPose = sampleReceiverPose(0, scenario);
  const stateFrameCounts: StateFrameCounts = {};
  const firstStateAt: StateFrameCounts = {};
  const preferredRoleFrameCounts: PreferredRoleFrameCounts = {
    acquire: 0,
    terminal: 0,
  };
  let peakPositionError = 0;
  let peakLateralError = 0;
  let maxSensorDisagreement = 0;
  const replaySamples: ReplaySample[] = [];

  for (let frame = 0; frame < totalFrames; frame += 1) {
    framesSimulated = frame + 1;
    const simTime = framesSimulated * dt;
    const receiverPose = applyAutonomyOutputToPose(
      sampleReceiverPose(simTime, scenario),
      autonomyOutputs[frame] ?? null,
    );
    const targetPose = {
      position: getReceiverReceptacleWorld(receiverPose),
      rotation: receiverPose.rotation,
    };
    const perception = runPassivePerception({
      boom,
      targetPose,
      scenario,
      simTime,
    });

    if (perception.estimate.visible) {
      visibleFrames += 1;
    }
    dropoutCount += perception.observations.filter((observation) => observation.dropout).length;
    preferredRoleFrameCounts[perception.preferredRole] += 1;

    tracker = updateTracker(tracker, perception.observations, dt);

    const boomTipBefore = getBoomTipPose(boom).position;
    const receiverVelocity = {
      x: (receiverPose.position.x - previousReceiverPose.position.x) / Math.max(dt, 1e-3),
      y: (receiverPose.position.y - previousReceiverPose.position.y) / Math.max(dt, 1e-3),
      z: (receiverPose.position.z - previousReceiverPose.position.z) / Math.max(dt, 1e-3),
    };
    const metricsBefore = computeMetrics({
      boomTip: boomTipBefore,
      target: targetPose.position,
      tracker,
      estimate: perception.estimate,
      observations: perception.observations,
      autopilotCommand: {
        dx: 0,
        dy: 0,
        dz: 0,
        magnitude: 0,
        clamped: false,
        mode: "hold",
      },
      previousMetrics: metrics,
      dt,
    });

    let controller = updateController({
      state: controllerState,
      scenario,
      boom,
      boomTip: boomTipBefore,
      trackedTarget: tracker,
      estimate: perception.estimate,
      safety: EMPTY_SAFETY,
      simTime,
    });

    const safety = evaluateSafety({
      state: controller.state,
      scenario,
      metrics: metricsBefore,
      previousMetrics: metrics,
      boomTip: boomTipBefore,
      receiverPose,
      receiverVelocity,
      tracker,
      observations: perception.observations,
      manualAbort: manualAbortAt !== null && simTime >= manualAbortAt,
    });

    if (safety.abort || safety.breakaway || safety.hold) {
      controller = updateController({
        state: controllerState,
        scenario,
        boom,
        boomTip: boomTipBefore,
        trackedTarget: tracker,
        estimate: perception.estimate,
        safety,
        simTime,
      });
    }

    const autopilotCommand = toAutopilotCommandECEF(controller.desiredTipMotion, getTankerPose());
    const plant = applyAutopilotCommand(boom, autopilotCommand, getTankerPose(), dt);
    boom = plant.nextBoom;
    const boomTipAfter = getBoomTipPose(boom).position;
    metrics = computeMetrics({
      boomTip: boomTipAfter,
      target: targetPose.position,
      tracker,
      estimate: perception.estimate,
      observations: perception.observations,
      autopilotCommand,
      previousMetrics: metrics,
      dt,
    });

    controllerState = controller.state;
    previousReceiverPose = receiverPose;
    minPositionError = Math.min(minPositionError, metrics.positionError);
    peakPositionError = Math.max(peakPositionError, metrics.positionError);
    peakLateralError = Math.max(peakLateralError, metrics.lateralError);
    maxSensorDisagreement = Math.max(maxSensorDisagreement, metrics.sensorDisagreement);
    stateFrameCounts[controllerState] = (stateFrameCounts[controllerState] ?? 0) + 1;
    if (firstStateAt[controllerState] === undefined) {
      firstStateAt[controllerState] = simTime;
    }

    if (controllerState === "MATED" && dockedAt === null) {
      dockedAt = simTime;
      if (stopOnDocked) {
        if (collectReplay) {
          replaySamples.push(
            createReplaySample({
              simTime,
              frame: framesSimulated,
              receiverPose,
              targetPose,
              boom,
              autopilotCommand,
              command: plant.command,
              controllerState,
              sensorObservations: perception.observations,
              estimate: perception.estimate,
              tracker,
              safety,
              metrics,
              abortReason,
            }),
          );
        }
        break;
      }
    }

    if (controllerState === "ABORT" || controllerState === "BREAKAWAY") {
      abortReason = safety.reasons[0] ?? abortReason;
      if (collectReplay) {
        replaySamples.push(
          createReplaySample({
            simTime,
            frame: framesSimulated,
            receiverPose,
            targetPose,
            boom,
            autopilotCommand,
            command: plant.command,
            controllerState,
            sensorObservations: perception.observations,
            estimate: perception.estimate,
            tracker,
            safety,
            metrics,
            abortReason,
          }),
        );
      }
      break;
    }

    if (collectReplay) {
      replaySamples.push(
          createReplaySample({
            simTime,
            frame: framesSimulated,
            receiverPose,
            targetPose,
            boom,
          autopilotCommand,
          command: plant.command,
          controllerState,
          sensorObservations: perception.observations,
          estimate: perception.estimate,
          tracker,
          safety,
          metrics,
          abortReason,
        }),
      );
    }
  }

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    framesSimulated,
    simulatedSeconds: framesSimulated * dt,
    finalState: controllerState,
    abortReason,
    dockedAt,
    minPositionError,
    visibleFraction: visibleFrames / Math.max(framesSimulated, 1),
    dropoutCount,
    finalMetrics: metrics,
    finalTrackerConfidence: tracker.confidence,
    stateFrameCounts,
    firstStateAt,
    preferredRoleFrameCounts,
    peakPositionError,
    peakLateralError,
    maxSensorDisagreement,
    dropoutRate: dropoutCount / Math.max(framesSimulated * SENSOR_RIGS.length, 1),
    replaySamples,
  };
}

export function runMissionMatrix(scenarioIds: string[]) {
  return scenarioIds.map((scenarioId) =>
    runHeadlessScenario({
      scenarioId,
      durationSeconds: 30,
      stopOnDocked: true,
    }),
  );
}
