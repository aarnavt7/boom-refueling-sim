import * as THREE from "three";

/** Sun elevation above horizon (radians). Bright midday read for a clear refueling pass. */
const SUN_ELEVATION = 0.94;
/** Slight camera-left bias so the fuselage keeps directional shape and readable shadows. */
const SUN_AZIMUTH = 0.68;

const SKY_SUN_DISTANCE = 450_000;
const KEY_LIGHT_DISTANCE = 44;

export const SKY_TURBIDITY = 2.1;
export const SKY_RAYLEIGH = 2.85;
export const SKY_MIE_COEFFICIENT = 0.0032;
export const SKY_MIE_DIRECTIONAL_G = 0.8;

export function getSunDirection(): THREE.Vector3 {
  const cosEl = Math.cos(SUN_ELEVATION);
  return new THREE.Vector3(
    cosEl * Math.sin(SUN_AZIMUTH),
    Math.sin(SUN_ELEVATION),
    cosEl * Math.cos(SUN_AZIMUTH),
  ).normalize();
}

/** Drei `Sky` expects a distant position along the sun ray, not a unit vector. */
export function getSkySunPosition(): THREE.Vector3 {
  return getSunDirection().clone().multiplyScalar(SKY_SUN_DISTANCE);
}

export function getKeyLightPosition(): THREE.Vector3 {
  return getSunDirection().clone().multiplyScalar(KEY_LIGHT_DISTANCE);
}

export const KEY_LIGHT_TARGET = new THREE.Vector3(0.25, -1.1, 11.1);

/** Sky-matched fallback so first paint and resize flashes stay close to the final atmosphere. */
export const CANVAS_CLEAR = "#96b4d1";

/** Horizon haze tint pulled toward the pale lower-atmosphere band in the reference image. */
export const FOG_COLOR = "#dfe7eb";

/** Light atmospheric wash so the lower half blooms softly instead of reading as a hard white void. */
export const FOG_EXP2_DENSITY = 0.00042;

/** Darker grade for marketing hero — same HDR sky, moodier fog + exposure in `OuterEnvironment` + `SimCanvas`. */
export const LANDING_CANVAS_CLEAR = "#06080d";
export const LANDING_FOG_COLOR = "#0c1018";
export const LANDING_FOG_EXP2_DENSITY = 0.00072;
export const LANDING_SKY_BACKGROUND_INTENSITY = 0.42;
export const LANDING_ENVIRONMENT_INTENSITY_FACTOR = 0.62;
export const LANDING_TONE_MAPPING_EXPOSURE = 0.5;

export const BACKGROUND_FILE = "/backgrounds/farm-field-puresky.jpg";
export const ENVIRONMENT_FILE = "/environments/farm-field-puresky-2k.hdr";
export const ENVIRONMENT_INTENSITY = 0.34;
export const ENVIRONMENT_ROTATION = [0, 2.18, 0] as const;
