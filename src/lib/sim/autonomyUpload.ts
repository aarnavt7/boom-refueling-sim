import { addVec3, clamp } from "@/lib/sim/math";
import type {
  AutonomyControllerOutput,
  AutonomyFrameInput,
  AutonomyMissionSample,
  Euler3,
  Pose,
  ReplaySample,
  UploadedAutonomyManifest,
  Vec3,
} from "@/lib/sim/types";

const MAX_POSITION_DELTA = 0.08;
const MAX_ROTATION_DELTA = 0.08;

function sanitizeVec3(value: unknown, maxMagnitude: number): Vec3 | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as Partial<Vec3>;
  const x = typeof candidate.x === "number" && Number.isFinite(candidate.x) ? candidate.x : 0;
  const y = typeof candidate.y === "number" && Number.isFinite(candidate.y) ? candidate.y : 0;
  const z = typeof candidate.z === "number" && Number.isFinite(candidate.z) ? candidate.z : 0;

  return {
    x: clamp(x, -maxMagnitude, maxMagnitude),
    y: clamp(y, -maxMagnitude, maxMagnitude),
    z: clamp(z, -maxMagnitude, maxMagnitude),
  };
}

function sanitizeEuler3(value: unknown, maxMagnitude: number): Euler3 | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as Partial<Euler3>;
  const x = typeof candidate.x === "number" && Number.isFinite(candidate.x) ? candidate.x : 0;
  const y = typeof candidate.y === "number" && Number.isFinite(candidate.y) ? candidate.y : 0;
  const z = typeof candidate.z === "number" && Number.isFinite(candidate.z) ? candidate.z : 0;

  return {
    x: clamp(x, -maxMagnitude, maxMagnitude),
    y: clamp(y, -maxMagnitude, maxMagnitude),
    z: clamp(z, -maxMagnitude, maxMagnitude),
  };
}

export function sanitizeAutonomyOutput(value: unknown): AutonomyControllerOutput {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const candidate = value as Partial<AutonomyControllerOutput>;

  return {
    label: typeof candidate.label === "string" ? candidate.label.slice(0, 64) : undefined,
    positionDelta: sanitizeVec3(candidate.positionDelta, MAX_POSITION_DELTA),
    rotationDelta: sanitizeEuler3(candidate.rotationDelta, MAX_ROTATION_DELTA),
  };
}

export function parseMissionJson(json: string | null | undefined): AutonomyMissionSample[] {
  if (!json) {
    return [];
  }

  const parsed = JSON.parse(json) as
    | { samples?: unknown[] }
    | unknown[];
  const rawSamples = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.samples)
      ? parsed.samples
      : [];

  return rawSamples
    .map<AutonomyMissionSample | null>((sample) => {
      if (typeof sample !== "object" || sample === null) {
        return null;
      }

      const candidate = sample as {
        time?: unknown;
        positionDelta?: unknown;
        rotationDelta?: unknown;
        note?: unknown;
      };

      if (typeof candidate.time !== "number" || !Number.isFinite(candidate.time)) {
        return null;
      }

      return {
        time: candidate.time,
        positionDelta: sanitizeVec3(candidate.positionDelta, MAX_POSITION_DELTA),
        rotationDelta: sanitizeEuler3(candidate.rotationDelta, MAX_ROTATION_DELTA),
        note: typeof candidate.note === "string" ? candidate.note.slice(0, 80) : undefined,
      } satisfies AutonomyMissionSample;
    })
    .filter((value): value is AutonomyMissionSample => value !== null)
    .sort((left, right) => left.time - right.time);
}

export function sampleMissionAtTime(
  missionSamples: readonly AutonomyMissionSample[],
  simTime: number,
  dt: number,
) {
  const tolerance = Math.max(dt * 0.55, 1 / 120);

  return (
    missionSamples.find((sample) => Math.abs(sample.time - simTime) <= tolerance) ?? null
  );
}

export function buildAutonomyFrameInputs(
  replaySamples: readonly ReplaySample[],
  missionSamples: readonly AutonomyMissionSample[],
  dt: number,
): AutonomyFrameInput[] {
  return replaySamples.map((sample) => {
    const input: AutonomyFrameInput = {
      frame: sample.frame,
      simTime: sample.simTime,
      controllerState: sample.controllerState,
      receiverPose: sample.receiverPose,
      targetPose: sample.targetPose,
      tracker: sample.tracker,
      metrics: sample.metrics,
      missionSample: sampleMissionAtTime(missionSamples, sample.simTime, dt),
      previousOutput: null,
    };
    return input;
  });
}

export function applyAutonomyOutputToPose(
  pose: Pose,
  output: AutonomyControllerOutput | null | undefined,
): Pose {
  if (!output) {
    return pose;
  }

  return {
    position: addVec3(
      pose.position,
      output.positionDelta ?? { x: 0, y: 0, z: 0 },
    ),
    rotation: {
      x: pose.rotation.x + (output.rotationDelta?.x ?? 0),
      y: pose.rotation.y + (output.rotationDelta?.y ?? 0),
      z: pose.rotation.z + (output.rotationDelta?.z ?? 0),
    },
  };
}

export function createAutonomyManifest(
  partial: Partial<UploadedAutonomyManifest>,
): UploadedAutonomyManifest {
  return {
    controllerName: partial.controllerName ?? null,
    controllerSource: partial.controllerSource ?? null,
    missionName: partial.missionName ?? null,
    missionJson: partial.missionJson ?? null,
    uploadedAt: partial.uploadedAt ?? Date.now(),
  };
}
