import * as THREE from "three";

import {
  BOOM_BASE_POSITION,
  EMPTY_METRICS,
  EMPTY_SAFETY,
  EMPTY_TRACKER,
  INITIAL_BOOM_STATE,
  RECEIVER_RECEPTACLE_LOCAL,
} from "@/lib/sim/constants";
import { updateController } from "@/lib/sim/controller";
import { applyIncrementCommand, getBoomTipPose } from "@/lib/sim/kinematics";
import { worldFromLocalOffset } from "@/lib/sim/math";
import { computeMetrics } from "@/lib/sim/metrics";
import { sampleReceiverPose } from "@/lib/sim/motion";
import { runGeometryPerception } from "@/lib/sim/perception";
import { evaluateSafety } from "@/lib/sim/safety";
import { getScenarioById } from "@/lib/sim/scenarios";
import { updateTracker } from "@/lib/sim/tracker";
import type {
  BoomJointState,
  ControllerState,
  ScenarioPreset,
  SimMetrics,
} from "@/lib/sim/types";

type HeadlessSensorRig = {
  camera: THREE.PerspectiveCamera;
  update: (boom: BoomJointState) => void;
};

export type HeadlessRunOptions = {
  scenarioId?: string;
  scenario?: ScenarioPreset;
  durationSeconds?: number;
  dt?: number;
  stopOnDocked?: boolean;
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
};

function createHeadlessSensorRig(): HeadlessSensorRig {
  const root = new THREE.Object3D();
  root.position.set(BOOM_BASE_POSITION.x, BOOM_BASE_POSITION.y, BOOM_BASE_POSITION.z);

  const yawNode = new THREE.Object3D();
  const pitchNode = new THREE.Object3D();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.rotation.set(0, Math.PI, 0);
  camera.updateProjectionMatrix();

  root.add(yawNode);
  yawNode.add(pitchNode);
  pitchNode.add(camera);

  return {
    camera,
    update(boom) {
      yawNode.rotation.y = boom.yaw;
      pitchNode.rotation.x = boom.pitch;
      camera.position.set(0, 0.08, Math.max(boom.extend - 0.4, 0.8));
      root.updateMatrixWorld(true);
      camera.updateWorldMatrix(true, false);
    },
  };
}

export function runHeadlessScenario({
  scenarioId = "steady-approach",
  scenario: inputScenario,
  durationSeconds = 20,
  dt = 1 / 60,
  stopOnDocked = false,
}: HeadlessRunOptions = {}): HeadlessRunSummary {
  const scenario = inputScenario ?? getScenarioById(scenarioId);
  const rig = createHeadlessSensorRig();
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

  for (let frame = 0; frame < totalFrames; frame += 1) {
    framesSimulated = frame + 1;
    const simTime = framesSimulated * dt;
    const receiverPose = sampleReceiverPose(simTime, scenario);
    const targetPosition = worldFromLocalOffset(
      receiverPose.position,
      receiverPose.rotation,
      RECEIVER_RECEPTACLE_LOCAL,
    );

    rig.update(boom);
    const estimate = runGeometryPerception({
      camera: rig.camera,
      targetWorld: targetPosition,
      scenario,
      simTime,
    });

    if (estimate.visible) {
      visibleFrames += 1;
    }
    if (estimate.dropout) {
      dropoutCount += 1;
    }

    tracker = updateTracker(tracker, estimate, dt);

    const boomTipBefore = getBoomTipPose(boom).position;
    const metricsBefore = computeMetrics({
      boomTip: boomTipBefore,
      target: targetPosition,
      estimate,
      previousMetrics: metrics,
      dt,
    });

    let controller = updateController({
      state: controllerState,
      scenario,
      boom,
      boomTip: boomTipBefore,
      trackedTarget: tracker,
      estimate,
      safety: EMPTY_SAFETY,
      simTime,
    });

    let safety = evaluateSafety({
      state: controller.state,
      scenario,
      metrics: metricsBefore,
      previousMetrics: metrics,
      boomTip: boomTipBefore,
      receiverPose,
      trackerConfidence: tracker.confidence,
    });

    if (safety.abort) {
      controller = updateController({
        state: "ABORT",
        scenario,
        boom,
        boomTip: boomTipBefore,
        trackedTarget: tracker,
        estimate,
        safety,
        simTime,
      });
    } else if (safety.hold) {
      controller = {
        ...controller,
        command: {
          ...controller.command,
          extendRate: Math.min(controller.command.extendRate, 0),
        },
      };
    }

    boom = applyIncrementCommand(boom, controller.command, dt);
    const boomTipAfter = getBoomTipPose(boom).position;
    metrics = computeMetrics({
      boomTip: boomTipAfter,
      target: targetPosition,
      estimate,
      previousMetrics: metrics,
      dt,
    });

    safety = {
      ...safety,
      hold: safety.hold || tracker.confidence < 0.25,
    };

    controllerState = controller.state;
    minPositionError = Math.min(minPositionError, metrics.positionError);

    if (controllerState === "DOCKED" && dockedAt === null) {
      dockedAt = simTime;
      if (stopOnDocked) {
        break;
      }
    }

    if (controllerState === "ABORT") {
      abortReason = safety.reasons[0] ?? abortReason;
      break;
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
  };
}
