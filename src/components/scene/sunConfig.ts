import * as THREE from "three";

/** Sun elevation above horizon (radians). Bright midday read for a clear refueling pass. */
const DEFAULT_SUN_ELEVATION = 0.94;
/** Slight camera-left bias so the fuselage keeps directional shape and readable shadows. */
const DEFAULT_SUN_AZIMUTH = 0.68;

const SKY_SUN_DISTANCE = 450_000;
const KEY_LIGHT_DISTANCE = 42;

export const SKY_TURBIDITY = 2;
export const SKY_RAYLEIGH = 2.95;
export const SKY_MIE_COEFFICIENT = 0.0028;
export const SKY_MIE_DIRECTIONAL_G = 0.82;

export function getSunDirection(
  azimuth = DEFAULT_SUN_AZIMUTH,
  elevation = DEFAULT_SUN_ELEVATION,
): THREE.Vector3 {
  const cosEl = Math.cos(elevation);
  return new THREE.Vector3(
    cosEl * Math.sin(azimuth),
    Math.sin(elevation),
    cosEl * Math.cos(azimuth),
  ).normalize();
}

/** Drei `Sky` expects a distant position along the sun ray, not a unit vector. */
export function getSkySunPosition(
  azimuth = DEFAULT_SUN_AZIMUTH,
  elevation = DEFAULT_SUN_ELEVATION,
): THREE.Vector3 {
  return getSunDirection(azimuth, elevation).clone().multiplyScalar(SKY_SUN_DISTANCE);
}

export function getKeyLightPosition(
  azimuth = DEFAULT_SUN_AZIMUTH,
  elevation = DEFAULT_SUN_ELEVATION,
): THREE.Vector3 {
  return getSunDirection(azimuth, elevation).clone().multiplyScalar(KEY_LIGHT_DISTANCE);
}

export const KEY_LIGHT_TARGET = new THREE.Vector3(0.18, -1.02, 11.25);

/** Sky-matched fallback so first paint and resize flashes stay close to the final atmosphere. */
export const SIM_CANVAS_CLEAR = "#96b4d1";

/**
 * Darker grade for the landing hero so the foreground UI and highlights stay readable.
 */
export const LANDING_CANVAS_CLEAR = "#06080d";

/**
 * Capture HUD (`SimCanvas` `variant="capture"`): same dark first paint as landing.
 */
export const CAPTURE_CANVAS_CLEAR = LANDING_CANVAS_CLEAR;

export const SIM_TONE_MAPPING_EXPOSURE = 0.68;
export const CAPTURE_TONE_MAPPING_EXPOSURE = 0.62;
export const LANDING_TONE_MAPPING_EXPOSURE = 0.5;

export const DAY_FOG_DENSITY_FACTOR = 0.9;
export const NIGHT_FOG_DENSITY_FACTOR = 0.92;
export const LANDING_FOG_DENSITY_FACTOR = 1.55;
export const CAPTURE_FOG_DENSITY_FACTOR = 1.1;

export const DAY_ENVIRONMENT_INTENSITY = 0.34;
export const NIGHT_ENVIRONMENT_INTENSITY = 0.16;
export const LANDING_ENVIRONMENT_FACTOR = 0.62;
export const CAPTURE_ENVIRONMENT_FACTOR = 0.72;
export const LANDING_SKY_BACKGROUND_INTENSITY = 1;

export const BACKGROUND_FILE = "/backgrounds/farm-field-puresky.jpg";
export const ENVIRONMENT_FILE = "/environments/farm-field-puresky-2k.hdr";
export const ENVIRONMENT_ROTATION = [0, 2.18, 0] as const;
