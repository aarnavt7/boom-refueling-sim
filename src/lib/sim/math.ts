import type { Euler3, Vec3 } from "@/lib/sim/types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function saturate(value: number) {
  return clamp(value, 0, 1);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function expSmoothing(dt: number, rate: number) {
  return 1 - Math.exp(-dt * rate);
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scaleVec3(v: Vec3, scalar: number): Vec3 {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
}

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

export function lengthVec3(v: Vec3) {
  return Math.hypot(v.x, v.y, v.z);
}

export function distanceVec3(a: Vec3, b: Vec3) {
  return lengthVec3(subVec3(a, b));
}

export function normalizeVec3(v: Vec3): Vec3 {
  const len = lengthVec3(v);
  if (len < 1e-6) {
    return vec3();
  }
  return scaleVec3(v, 1 / len);
}

export function wrapAngle(angle: number) {
  let wrapped = angle;
  while (wrapped > Math.PI) {
    wrapped -= Math.PI * 2;
  }
  while (wrapped < -Math.PI) {
    wrapped += Math.PI * 2;
  }
  return wrapped;
}

export function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

export function radToDeg(value: number) {
  return (value * 180) / Math.PI;
}

export function rotateVectorByEuler(vector: Vec3, rotation: Euler3): Vec3 {
  let x = vector.x;
  let y = vector.y;
  let z = vector.z;

  const cosZ = Math.cos(rotation.z);
  const sinZ = Math.sin(rotation.z);
  const x1 = x * cosZ - y * sinZ;
  const y1 = x * sinZ + y * cosZ;
  x = x1;
  y = y1;

  const cosY = Math.cos(rotation.y);
  const sinY = Math.sin(rotation.y);
  const x2 = x * cosY + z * sinY;
  const z2 = -x * sinY + z * cosY;
  x = x2;
  z = z2;

  const cosX = Math.cos(rotation.x);
  const sinX = Math.sin(rotation.x);
  const y3 = y * cosX - z * sinX;
  const z3 = y * sinX + z * cosX;

  return { x, y: y3, z: z3 };
}

export function worldFromLocalOffset(origin: Vec3, rotation: Euler3, localOffset: Vec3) {
  return addVec3(origin, rotateVectorByEuler(localOffset, rotation));
}

export function harmonicNoise(time: number, seed: number) {
  return (
    Math.sin(time * (0.61 + seed * 0.11) + seed * 2.1) * 0.55 +
    Math.sin(time * (1.73 + seed * 0.07) + seed * 1.4) * 0.3 +
    Math.sin(time * (3.42 + seed * 0.13) + seed * 0.73) * 0.15
  );
}
