/// <reference lib="webworker" />

import { sanitizeAutonomyOutput } from "@/lib/sim/autonomyUpload";
import type {
  AutonomyControllerOutput,
  AutonomyFrameInput,
} from "@/lib/sim/types";

declare const self: DedicatedWorkerGlobalScope;

type UploadedModule = {
  default?: (input: AutonomyFrameInput) => AutonomyControllerOutput | Promise<AutonomyControllerOutput>;
  step?: (input: AutonomyFrameInput) => AutonomyControllerOutput | Promise<AutonomyControllerOutput>;
};

function hardenWorkerRuntime() {
  const blocked = () => {
    throw new Error("Network and browser APIs are disabled inside uploaded autonomy programs.");
  };

  (self as typeof self & { fetch?: unknown }).fetch = blocked;
  (self as typeof self & { XMLHttpRequest?: unknown }).XMLHttpRequest = undefined;
  (self as typeof self & { WebSocket?: unknown }).WebSocket = undefined;
}

function normalizeControllerSource(controllerSource: string) {
  return controllerSource
    .replace(/export\s+function\s+step/g, "function step")
    .replace(/export\s+async\s+function\s+step/g, "async function step")
    .replace(/export\s+default\s+async\s+function/g, "const __default = async function")
    .replace(/export\s+default\s+function/g, "const __default = function")
    .replace(/export\s+default\s+\(/g, "const __default = (");
}

async function loadController(controllerSource: string | null) {
  if (!controllerSource) {
    return null;
  }

  const compiled = new Function(
    `${normalizeControllerSource(controllerSource)}
    return typeof step === "function"
      ? step
      : typeof __default === "function"
        ? __default
        : null;`,
  )() as UploadedModule["step"] | null;

  if (typeof compiled !== "function") {
    throw new Error("controller.js must export step(input) or a default function.");
  }

  return compiled;
}

self.onmessage = async (
  event: MessageEvent<{
    controllerSource: string | null;
    inputs: AutonomyFrameInput[];
  }>,
) => {
  try {
    hardenWorkerRuntime();
    const step = await loadController(event.data.controllerSource);
    const outputs: AutonomyControllerOutput[] = [];
    const notes: string[] = [];
    let previousOutput: AutonomyControllerOutput | null = null;

    for (const input of event.data.inputs) {
      const activeInput = {
        ...input,
        previousOutput,
      };

      const missionFallback = input.missionSample
        ? {
            positionDelta: input.missionSample.positionDelta,
            rotationDelta: input.missionSample.rotationDelta,
            label: input.missionSample.note,
          }
        : {};
      const rawOutput = step
        ? await Promise.resolve(step(activeInput))
        : missionFallback;
      const sanitized = sanitizeAutonomyOutput(rawOutput);

      if (
        sanitized.positionDelta &&
        (Math.abs(sanitized.positionDelta.x) >= 0.079 ||
          Math.abs(sanitized.positionDelta.y) >= 0.079 ||
          Math.abs(sanitized.positionDelta.z) >= 0.079)
      ) {
        notes.push(`Frame ${input.frame}: clamped position delta to safe bounds.`);
      }

      outputs.push(sanitized);
      previousOutput = sanitized;
    }

    self.postMessage({
      type: "result",
      outputs,
      notes,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : "Unknown uploaded-controller failure.",
    });
  }
};
