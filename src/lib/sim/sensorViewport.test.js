import { describe, expect, test } from "bun:test";

import {
  EMPTY_AUTOPILOT_COMMAND,
  EMPTY_COMMAND,
  EMPTY_METRICS,
  EMPTY_SAFETY,
  EMPTY_TRACKER,
} from "./constants.ts";
import {
  applySensorViewportModality,
  getSensorViewportRenderKey,
  resolveSensorViewportFeed,
} from "./sensorViewport.ts";

function createObservation({
  sensorId,
  sensorName,
  role,
  modality,
  visible = true,
  dropout = false,
  imagePoint = { x: 0, y: 0 },
}) {
  return {
    sensorId,
    sensorName,
    role,
    modality,
    visible,
    dropout,
    confidence: 0.72,
    estimatedPosition: { x: 0.1, y: -0.2, z: 14.5 },
    estimatedPose: {
      position: { x: 0.1, y: -0.2, z: 14.5 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    imagePoint,
    cameraSpacePosition: { x: 0.2, y: 0.1, z: -8.2 },
    range: 8.2,
    usedForTrack: true,
    notes: [modality === "thermal" ? "thermal-primary" : "visible-primary"],
  };
}

function createState() {
  const tailLeft = createObservation({
    sensorId: "tail-acq-left",
    sensorName: "Tail Acquire Left",
    role: "acquire",
    modality: "visible",
    imagePoint: { x: -0.4, y: 0.3 },
  });
  const terminalRight = createObservation({
    sensorId: "boom-term-right",
    sensorName: "Boom Terminal Right",
    role: "terminal",
    modality: "thermal",
    imagePoint: { x: 0.68, y: -0.12 },
  });

  return {
    simTime: 4.25,
    frame: 128,
    receiverPose: {
      position: { x: 0, y: -2.8, z: 14.9 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    targetPose: {
      position: { x: 0.1, y: -0.2, z: 14.5 },
      rotation: { x: 0, y: 0, z: 0 },
    },
    boom: { yaw: 0.05, pitch: -0.1, extend: 8.3 },
    autopilotCommand: EMPTY_AUTOPILOT_COMMAND,
    command: EMPTY_COMMAND,
    controllerState: "TRACK",
    sensorObservations: [tailLeft, terminalRight],
    estimate: tailLeft,
    tracker: {
      ...EMPTY_TRACKER,
      position: { x: 0.1, y: -0.2, z: 14.5 },
      confidence: 0.74,
      lost: false,
    },
    safety: EMPTY_SAFETY,
    metrics: EMPTY_METRICS,
    abortReason: null,
  };
}

describe("sensor viewport selection", () => {
  test("auto source follows the primary estimate sensor", () => {
    const state = createState();

    const resolved = resolveSensorViewportFeed({
      state,
      source: "auto",
      modality: "auto",
    });

    expect(resolved.effectiveSensorId).toBe("tail-acq-left");
    expect(resolved.observation.sensorId).toBe("tail-acq-left");
    expect(resolved.effectiveModality).toBe("visible");
  });

  test("manual source override selects the requested observation and image point", () => {
    const state = createState();

    const resolved = resolveSensorViewportFeed({
      state,
      source: "boom-term-right",
      modality: "auto",
    });

    expect(resolved.effectiveSensorId).toBe("boom-term-right");
    expect(resolved.observation.sensorId).toBe("boom-term-right");
    expect(resolved.observation.imagePoint).toEqual({ x: 0.68, y: -0.12 });
    expect(resolved.effectiveModality).toBe("thermal");
  });

  test("manual modality override changes the presentation modality only", () => {
    const state = createState();

    const resolved = resolveSensorViewportFeed({
      state,
      source: "tail-acq-left",
      modality: "thermal",
    });

    expect(resolved.observation.modality).toBe("visible");
    expect(resolved.effectiveModality).toBe("thermal");
    expect(resolved.hasManualModalityOverride).toBeTrue();
  });
});

describe("sensor viewport rendering helpers", () => {
  test("thermal transform produces a visibly different false-color buffer", () => {
    const pixels = new Uint8ClampedArray([
      20, 30, 50, 255,
      120, 130, 150, 255,
      230, 240, 250, 255,
      60, 90, 120, 255,
    ]);

    const visible = applySensorViewportModality(pixels, "visible");
    const thermal = applySensorViewportModality(pixels, "thermal");

    expect(Array.from(visible)).toEqual(Array.from(pixels));
    expect(Array.from(thermal)).not.toEqual(Array.from(pixels));
    expect(thermal[3]).toBe(255);
    expect(thermal[7]).toBe(255);
  });

  test("render key changes when the selected sensor or replay frame changes", () => {
    const state = createState();

    const baseKey = getSensorViewportRenderKey({
      state,
      source: "auto",
      modality: "auto",
      replayMode: false,
      replayIndex: 0,
      replayDataSource: "session",
      evaluationView: "baseline",
    });
    const manualSourceKey = getSensorViewportRenderKey({
      state,
      source: "boom-term-right",
      modality: "auto",
      replayMode: false,
      replayIndex: 0,
      replayDataSource: "session",
      evaluationView: "baseline",
    });
    const replayFrameKey = getSensorViewportRenderKey({
      state,
      source: "auto",
      modality: "auto",
      replayMode: true,
      replayIndex: 3,
      replayDataSource: "session",
      evaluationView: "baseline",
    });

    expect(manualSourceKey).not.toBe(baseKey);
    expect(replayFrameKey).not.toBe(baseKey);
  });
});
