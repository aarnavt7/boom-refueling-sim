import { describe, expect, test } from "bun:test";

import { parseMissionJson } from "./autonomyUpload.ts";
import { runWorkerJob } from "./autonomyWorkerClient.ts";

describe("autonomy mission parsing", () => {
  test("parses and clamps timestamped mission disturbances", () => {
    const samples = parseMissionJson(
      JSON.stringify({
        samples: [
          { time: 1.5, positionDelta: { x: 0.5, y: -0.5, z: 0.02 }, note: "oversized" },
          { time: 0.5, positionDelta: { x: 0.02, y: 0.01, z: -0.01 } },
        ],
      }),
    );

    expect(samples).toHaveLength(2);
    expect(samples[0].time).toBe(0.5);
    expect(samples[1].positionDelta?.x).toBeCloseTo(0.08, 6);
    expect(samples[1].positionDelta?.y).toBeCloseTo(-0.08, 6);
  });
});

describe("autonomy worker client", () => {
  test("rejects when a worker job times out", async () => {
    let terminated = false;
    const worker = {
      onmessage: null,
      onerror: null,
      postMessage() {},
      terminate() {
        terminated = true;
      },
    };

    await expect(
      runWorkerJob({
        worker,
        message: { noop: true },
        timeoutMs: 10,
      }),
    ).rejects.toThrow(/timed out/i);
    expect(terminated).toBe(true);
  });

  test("rejects when the worker reports an error", async () => {
    const worker = {
      onmessage: null,
      onerror: null,
      postMessage() {
        queueMicrotask(() => {
          worker.onerror?.({ message: "synthetic worker failure" });
        });
      },
      terminate() {},
    };

    await expect(
      runWorkerJob({
        worker,
        message: { noop: true },
        timeoutMs: 100,
      }),
    ).rejects.toThrow(/synthetic worker failure/i);
  });
});
