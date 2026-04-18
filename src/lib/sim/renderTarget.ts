import * as THREE from "three";

import { SENSOR_RESOLUTION } from "@/lib/sim/constants";
import type { SensorFrame } from "@/lib/sim/types";

export function createSensorRenderTarget(width = SENSOR_RESOLUTION, height = SENSOR_RESOLUTION) {
  const target = new THREE.WebGLRenderTarget(width, height, {
    depthBuffer: true,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });

  target.texture.colorSpace = THREE.SRGBColorSpace;

  return target;
}

export function readSensorFrame(
  gl: THREE.WebGLRenderer,
  target: THREE.WebGLRenderTarget,
  width = SENSOR_RESOLUTION,
  height = SENSOR_RESOLUTION,
): SensorFrame {
  const raw = new Uint8Array(width * height * 4);
  gl.readRenderTargetPixels(target, 0, 0, width, height, raw);

  const flipped = new Uint8ClampedArray(raw.length);
  for (let row = 0; row < height; row += 1) {
    const source = row * width * 4;
    const targetRow = (height - row - 1) * width * 4;
    flipped.set(raw.subarray(source, source + width * 4), targetRow);
  }

  return {
    width,
    height,
    pixels: flipped,
    updatedAt: Date.now(),
  };
}
