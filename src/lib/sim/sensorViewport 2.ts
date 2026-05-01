import { EMPTY_ESTIMATE, SENSOR_RIGS } from "@/lib/sim/constants";
import type {
  EvaluationView,
  LiveSimState,
  ReplayDataSource,
  SensorModality,
  SensorMountId,
  SensorObservation,
  SensorViewportModality,
  SensorViewportSource,
} from "@/lib/sim/types";

export const SENSOR_VIEWPORT_SOURCE_OPTIONS: Array<{
  id: SensorViewportSource;
  label: string;
  detail: string;
}> = [
  {
    id: "auto",
    label: "Auto",
    detail: "Follow the current perception handoff sensor.",
  },
  {
    id: "tail-acq-left",
    label: "Tail L",
    detail: "Left wide-FOV acquisition camera.",
  },
  {
    id: "tail-acq-right",
    label: "Tail R",
    detail: "Right wide-FOV acquisition camera.",
  },
  {
    id: "boom-term-left",
    label: "Term L",
    detail: "Left narrow-FOV terminal camera.",
  },
  {
    id: "boom-term-right",
    label: "Term R",
    detail: "Right narrow-FOV terminal camera.",
  },
];

export const SENSOR_VIEWPORT_MODALITY_OPTIONS: Array<{
  id: SensorViewportModality;
  label: string;
  detail: string;
}> = [
  {
    id: "auto",
    label: "Auto",
    detail: "Follow the selected sensor's current modality.",
  },
  {
    id: "visible",
    label: "Visible",
    detail: "Show the raw visible-spectrum viewport.",
  },
  {
    id: "thermal",
    label: "Thermal",
    detail: "Apply the false-color thermal presentation.",
  },
];

export type ResolvedSensorViewportFeed = {
  observation: SensorObservation;
  effectiveSensorId: SensorMountId;
  effectiveModality: SensorModality;
  sourceMode: SensorViewportSource;
  modalityMode: SensorViewportModality;
  hasManualSourceOverride: boolean;
  hasManualModalityOverride: boolean;
};

function getSensorLabel(sensorId: SensorMountId) {
  return SENSOR_RIGS.find((sensor) => sensor.id === sensorId)?.name ?? EMPTY_ESTIMATE.sensorName;
}

function getSensorRole(sensorId: SensorMountId) {
  return SENSOR_RIGS.find((sensor) => sensor.id === sensorId)?.role ?? EMPTY_ESTIMATE.role;
}

function getObservationForSensor(state: LiveSimState, sensorId: SensorMountId): SensorObservation {
  const fromObservations = state.sensorObservations.find((observation) => observation.sensorId === sensorId);

  if (fromObservations) {
    return fromObservations;
  }

  if (state.estimate.sensorId === sensorId) {
    return state.estimate;
  }

  return {
    ...EMPTY_ESTIMATE,
    sensorId,
    sensorName: getSensorLabel(sensorId),
    role: getSensorRole(sensorId),
    modality: state.estimate.modality,
    notes: [],
  };
}

export function resolveSensorViewportFeed({
  state,
  source,
  modality,
}: {
  state: LiveSimState;
  source: SensorViewportSource;
  modality: SensorViewportModality;
}): ResolvedSensorViewportFeed {
  const effectiveSensorId = source === "auto" ? state.estimate.sensorId : source;
  const observation = getObservationForSensor(state, effectiveSensorId);
  const effectiveModality = modality === "auto" ? observation.modality : modality;

  return {
    observation,
    effectiveSensorId,
    effectiveModality,
    sourceMode: source,
    modalityMode: modality,
    hasManualSourceOverride: source !== "auto",
    hasManualModalityOverride: modality !== "auto",
  };
}

export function getSensorViewportRenderKey({
  state,
  source,
  modality,
  replayMode,
  replayIndex,
  replayDataSource,
  evaluationView,
}: {
  state: LiveSimState;
  source: SensorViewportSource;
  modality: SensorViewportModality;
  replayMode: boolean;
  replayIndex: number;
  replayDataSource: ReplayDataSource;
  evaluationView: EvaluationView;
}) {
  const resolved = resolveSensorViewportFeed({
    state,
    source,
    modality,
  });

  return [
    replayMode ? "replay" : "live",
    replayDataSource,
    evaluationView,
    replayIndex,
    state.frame,
    state.simTime.toFixed(3),
    resolved.effectiveSensorId,
    resolved.effectiveModality,
  ].join("|");
}

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

function thermalPalette(intensity: number): [number, number, number] {
  const t = clampUnit(intensity);

  if (t < 0.2) {
    const local = t / 0.2;
    return [
      Math.round(12 + local * 38),
      Math.round(local * 10),
      Math.round(42 + local * 110),
    ];
  }

  if (t < 0.45) {
    const local = (t - 0.2) / 0.25;
    return [
      Math.round(50 - local * 30),
      Math.round(10 + local * 160),
      Math.round(152 + local * 103),
    ];
  }

  if (t < 0.7) {
    const local = (t - 0.45) / 0.25;
    return [
      Math.round(20 + local * 235),
      Math.round(170 + local * 55),
      Math.round(255 - local * 255),
    ];
  }

  if (t < 0.88) {
    const local = (t - 0.7) / 0.18;
    return [
      255,
      Math.round(225 - local * 140),
      Math.round(local * 20),
    ];
  }

  const local = (t - 0.88) / 0.12;
  return [
    255,
    Math.round(85 + local * 170),
    Math.round(20 + local * 225),
  ];
}

function getLuminance(r: number, g: number, b: number) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

export function applySensorViewportModality(
  pixels: Uint8ClampedArray,
  modality: SensorModality,
): Uint8ClampedArray {
  if (modality === "visible") {
    return new Uint8ClampedArray(pixels);
  }

  const output = new Uint8ClampedArray(pixels.length);
  let minLuma = 255;
  let maxLuma = 0;

  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) {
      continue;
    }

    const luma = getLuminance(pixels[index], pixels[index + 1], pixels[index + 2]);
    minLuma = Math.min(minLuma, luma);
    maxLuma = Math.max(maxLuma, luma);
  }

  const range = Math.max(maxLuma - minLuma, 1);

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3];

    if (alpha === 0) {
      output[index + 3] = 0;
      continue;
    }

    const luma = getLuminance(pixels[index], pixels[index + 1], pixels[index + 2]);
    const normalized = clampUnit((luma - minLuma) / range);
    const emphasized = Math.pow(normalized, 0.82);
    const [r, g, b] = thermalPalette(emphasized);

    output[index] = r;
    output[index + 1] = g;
    output[index + 2] = b;
    output[index + 3] = alpha;
  }

  return output;
}
