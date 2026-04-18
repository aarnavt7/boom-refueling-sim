import { describe, expect, test } from "bun:test";
import * as THREE from "three";

import { rotateVectorByEuler, worldFromLocalOffset } from "./math.ts";

function expectVecClose(actual, expected, tolerance = 1e-9) {
  expect(Math.abs(actual.x - expected.x)).toBeLessThan(tolerance);
  expect(Math.abs(actual.y - expected.y)).toBeLessThan(tolerance);
  expect(Math.abs(actual.z - expected.z)).toBeLessThan(tolerance);
}

describe("sim math", () => {
  test("rotateVectorByEuler matches Three.js XYZ rotations", () => {
    const samples = [
      {
        vector: { x: 1, y: 2, z: 3 },
        rotation: { x: 0.2, y: -0.3, z: 0.4 },
      },
      {
        vector: { x: 0, y: 1, z: 0 },
        rotation: { x: 0.5, y: 0.25, z: -0.1 },
      },
      {
        vector: { x: -2, y: 0.3, z: 4.1 },
        rotation: { x: -0.7, y: 1.1, z: 0.9 },
      },
    ];

    for (const sample of samples) {
      const actual = rotateVectorByEuler(sample.vector, sample.rotation);
      const expected = new THREE.Vector3(
        sample.vector.x,
        sample.vector.y,
        sample.vector.z,
      ).applyEuler(
        new THREE.Euler(
          sample.rotation.x,
          sample.rotation.y,
          sample.rotation.z,
          "XYZ",
        ),
      );

      expectVecClose(actual, expected);
    }
  });

  test("worldFromLocalOffset matches translated Three.js transforms", () => {
    const origin = { x: 3.4, y: -1.2, z: 8.5 };
    const rotation = { x: 0.35, y: -0.18, z: 0.27 };
    const localOffset = { x: -0.8, y: 0.6, z: -3.3 };

    const actual = worldFromLocalOffset(origin, rotation, localOffset);
    const expected = new THREE.Vector3(
      localOffset.x,
      localOffset.y,
      localOffset.z,
    )
      .applyEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z, "XYZ"))
      .add(new THREE.Vector3(origin.x, origin.y, origin.z));

    expectVecClose(actual, expected);
  });
});
