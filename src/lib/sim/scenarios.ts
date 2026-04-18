import { degToRad } from "@/lib/sim/math";
import type { ScenarioPreset } from "@/lib/sim/types";

export const scenarioPresets: ScenarioPreset[] = [
  {
    id: "steady-approach",
    name: "Steady Approach",
    description: "Low-noise baseline with a clean intercept window.",
    receiverBasePose: {
      position: { x: 0.35, y: -2.18, z: 12.55 },
      rotation: { x: 0.01, y: -0.022, z: 0.004 },
    },
    motion: {
      translationAmplitude: { x: 0.9, y: 0.45, z: 0.65 },
      translationFrequency: { x: 0.55, y: 0.8, z: 0.45 },
      translationNoise: { x: 0.1, y: 0.06, z: 0.08 },
      rotationAmplitude: { x: degToRad(1.4), y: degToRad(1.8), z: degToRad(1.1) },
      rotationFrequency: { x: 0.35, y: 0.28, z: 0.4 },
    },
    perception: {
      positionNoise: 0.09,
      pixelNoise: 0.015,
      dropoutProbability: 0.06,
      confidenceFloor: 0.45,
    },
    controller: {
      alignTolerance: 0.6,
      insertTolerance: 0.45,
      dockTolerance: 0.22,
      standbyExtend: 8.2,
    },
    safety: {
      keepOutRadius: 2.4,
      nearTargetDistance: 1.35,
    },
  },
  {
    id: "crosswind-chase",
    name: "Crosswind Chase",
    description: "Higher lateral drift and tighter alignment margins.",
    receiverBasePose: {
      position: { x: 1.05, y: -1.92, z: 13.15 },
      rotation: { x: degToRad(-0.4), y: degToRad(-2.8), z: degToRad(0.25) },
    },
    motion: {
      translationAmplitude: { x: 1.45, y: 0.72, z: 0.95 },
      translationFrequency: { x: 0.8, y: 0.95, z: 0.62 },
      translationNoise: { x: 0.18, y: 0.12, z: 0.12 },
      rotationAmplitude: { x: degToRad(2.3), y: degToRad(2.7), z: degToRad(1.8) },
      rotationFrequency: { x: 0.5, y: 0.42, z: 0.58 },
    },
    perception: {
      positionNoise: 0.14,
      pixelNoise: 0.02,
      dropoutProbability: 0.1,
      confidenceFloor: 0.34,
    },
    controller: {
      alignTolerance: 0.52,
      insertTolerance: 0.38,
      dockTolerance: 0.22,
      standbyExtend: 8.8,
    },
    safety: {
      keepOutRadius: 2.55,
      nearTargetDistance: 1.45,
    },
  },
  {
    id: "sensor-degraded",
    name: "Sensor Degraded",
    description: "A harsher perception environment with more dropouts.",
    receiverBasePose: {
      position: { x: -0.55, y: -2.32, z: 12.85 },
      rotation: { x: degToRad(0.6), y: degToRad(1.75), z: degToRad(-0.2) },
    },
    motion: {
      translationAmplitude: { x: 1.1, y: 0.58, z: 0.84 },
      translationFrequency: { x: 0.62, y: 0.9, z: 0.5 },
      translationNoise: { x: 0.2, y: 0.14, z: 0.14 },
      rotationAmplitude: { x: degToRad(2.1), y: degToRad(2.1), z: degToRad(1.6) },
      rotationFrequency: { x: 0.44, y: 0.4, z: 0.5 },
    },
    perception: {
      positionNoise: 0.18,
      pixelNoise: 0.03,
      dropoutProbability: 0.2,
      confidenceFloor: 0.25,
    },
    controller: {
      alignTolerance: 0.65,
      insertTolerance: 0.46,
      dockTolerance: 0.24,
      standbyExtend: 8.5,
    },
    safety: {
      keepOutRadius: 2.6,
      nearTargetDistance: 1.55,
    },
  },
];

export function getScenarioById(id: string) {
  return scenarioPresets.find((scenario) => scenario.id === id) ?? scenarioPresets[0];
}
