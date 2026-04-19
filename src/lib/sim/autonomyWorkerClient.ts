"use client";

import type {
  AutonomyControllerOutput,
  AutonomyFrameInput,
} from "@/lib/sim/types";

export type WorkerLike = {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage: (message: unknown) => void;
  terminate: () => void;
};

type WorkerSuccessPayload = {
  type: "result";
  outputs: AutonomyControllerOutput[];
  notes: string[];
};

type WorkerErrorPayload = {
  type: "error";
  message: string;
};

type WorkerPayload = WorkerSuccessPayload | WorkerErrorPayload;

export function runWorkerJob<TMessage, TResult extends WorkerPayload>({
  worker,
  message,
  timeoutMs,
}: {
  worker: WorkerLike;
  message: TMessage;
  timeoutMs: number;
}) {
  return new Promise<TResult>((resolve, reject) => {
    const timeoutId = globalThis.setTimeout(() => {
      worker.terminate();
      reject(new Error(`Autonomy worker timed out after ${timeoutMs} ms.`));
    }, timeoutMs);

    worker.onmessage = (event) => {
      globalThis.clearTimeout(timeoutId);
      resolve(event.data as TResult);
    };

    worker.onerror = (event) => {
      globalThis.clearTimeout(timeoutId);
      worker.terminate();
      reject(
        event.error instanceof Error
          ? event.error
          : new Error(event.message ?? "Autonomy worker crashed."),
      );
    };

    worker.postMessage(message);
  });
}

export async function runUploadedAutonomyProgram({
  controllerSource,
  inputs,
  timeoutMs = 1800,
}: {
  controllerSource: string | null;
  inputs: AutonomyFrameInput[];
  timeoutMs?: number;
}) {
  const worker = new Worker(new URL("./autonomy.worker.ts", import.meta.url), {
    type: "module",
  });

  try {
    const payload = await runWorkerJob<
      {
        controllerSource: string | null;
        inputs: AutonomyFrameInput[];
      },
      WorkerPayload
    >({
      worker,
      timeoutMs,
      message: {
        controllerSource,
        inputs,
      },
    });

    if (payload.type === "error") {
      throw new Error(payload.message);
    }

    return payload;
  } finally {
    worker.terminate();
  }
}
