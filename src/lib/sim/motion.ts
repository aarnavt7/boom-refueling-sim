import { addVec3, harmonicNoise } from "@/lib/sim/math";
import type { Pose, ScenarioPreset } from "@/lib/sim/types";

export function sampleReceiverPose(time: number, scenario: ScenarioPreset): Pose {
  const { receiverBasePose, motion } = scenario;

  const sinusoid = {
    x:
      motion.translationAmplitude.x *
      Math.sin(time * motion.translationFrequency.x + Math.PI * 0.25),
    y:
      motion.translationAmplitude.y *
      Math.sin(time * motion.translationFrequency.y + Math.PI * 0.5),
    z:
      motion.translationAmplitude.z *
      Math.sin(time * motion.translationFrequency.z + Math.PI * 0.85),
  };

  const drift = {
    x: harmonicNoise(time, 1.2) * motion.translationNoise.x,
    y: harmonicNoise(time, 2.4) * motion.translationNoise.y,
    z: harmonicNoise(time, 3.1) * motion.translationNoise.z,
  };

  return {
    position: addVec3(receiverBasePose.position, addVec3(sinusoid, drift)),
    rotation: {
      x:
        receiverBasePose.rotation.x +
        motion.rotationAmplitude.x *
          Math.sin(time * motion.rotationFrequency.x + Math.PI * 0.15),
      y:
        receiverBasePose.rotation.y +
        motion.rotationAmplitude.y *
          Math.sin(time * motion.rotationFrequency.y + Math.PI * 0.45),
      z:
        receiverBasePose.rotation.z +
        motion.rotationAmplitude.z *
          Math.sin(time * motion.rotationFrequency.z + Math.PI * 0.72),
    },
  };
}
