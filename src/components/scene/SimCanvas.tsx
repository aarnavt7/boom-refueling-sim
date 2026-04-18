"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { BoomRig } from "@/components/scene/BoomRig";
import { DebugHelpers } from "@/components/scene/DebugHelpers";
import {
  LandingFlybyController,
  LANDING_HERO_CAMERA_FOV,
  LANDING_HERO_CAMERA_POSITION,
} from "@/components/scene/LandingFlybyController";
import { CaptureCameraRig } from "@/components/scene/CaptureCameraRig";
import { LandingSceneReadyNotifier } from "@/components/scene/LandingSceneReadyNotifier";
import {
  OuterEnvironment,
  type OuterEnvironmentVariant,
} from "@/components/scene/OuterEnvironment";
import { Receiver } from "@/components/scene/Receiver";
import { SceneLighting } from "@/components/scene/SceneLighting";
import { SimContentLayer } from "@/components/scene/SimContentLayer";
import {
  CANVAS_CLEAR,
  LANDING_CANVAS_CLEAR,
  LANDING_TONE_MAPPING_EXPOSURE,
} from "@/components/scene/sunConfig";
import { Tanker } from "@/components/scene/Tanker";
import {
  MAIN_CAMERA_POSITION,
  MAIN_CAMERA_TARGET,
} from "@/lib/sim/aircraftVisualConfig";
import {
  EMPTY_ESTIMATE,
  EMPTY_SAFETY,
  MAX_FRAME_DT,
  RECEIVER_RECEPTACLE_LOCAL,
  SENSOR_RESOLUTION,
} from "@/lib/sim/constants";
import { updateController } from "@/lib/sim/controller";
import { getBoomTipPose, applyIncrementCommand } from "@/lib/sim/kinematics";
import { worldFromLocalOffset } from "@/lib/sim/math";
import { computeMetrics } from "@/lib/sim/metrics";
import { sampleReceiverPose } from "@/lib/sim/motion";
import { runGeometryPerception } from "@/lib/sim/perception";
import {
  clampReplayIndex,
  createReplaySample,
  shouldRecordReplay,
} from "@/lib/sim/replay";
import { createSensorRenderTarget, readSensorFrame } from "@/lib/sim/renderTarget";
import { evaluateSafety } from "@/lib/sim/safety";
import { SIM_CONTENT_LAYER } from "@/lib/sim/sceneLayers";
import { updateTracker } from "@/lib/sim/tracker";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export type SimCanvasVariant = "sim" | "landing" | "capture";

type WorldProps = {
  sensorCameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  sensorTarget: THREE.WebGLRenderTarget;
  environmentVariant?: OuterEnvironmentVariant;
  simVariant?: SimCanvasVariant;
};

function MainCameraLayerSync() {
  const camera = useThree((s) => s.camera);

  useLayoutEffect(() => {
    camera.layers.enable(SIM_CONTENT_LAYER);
  }, [camera]);

  return null;
}

function SimulationWorld({
  sensorCameraRef,
  sensorTarget,
  environmentVariant = "sim",
  simVariant = "sim",
}: WorldProps) {
  const clear =
    environmentVariant === "landing" ? LANDING_CANVAS_CLEAR : CANVAS_CLEAR;
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  const captureAccumulator = useRef(0);
  const replayAccumulator = useRef(0);

  useFrame((_, delta) => {
    const uiState = useUiStore.getState();
    const simState = useSimStore.getState();

    if (uiState.simFrozen) {
      return;
    }

    if (uiState.replayMode) {
      if (!uiState.replayPlaying || simState.replaySamples.length === 0) {
        return;
      }

      replayAccumulator.current += delta;
      if (replayAccumulator.current >= 1 / 20) {
        replayAccumulator.current = 0;
        const nextIndex = clampReplayIndex(uiState.replayIndex + 1, simState.replaySamples.length);
        useUiStore.getState().setReplayIndex(nextIndex);
        if (nextIndex === simState.replaySamples.length - 1) {
          useUiStore.getState().setReplayPlaying(false);
        }
      }
      return;
    }

    const dt = Math.min(delta, MAX_FRAME_DT);
    const previous = simState.live;
    const scenario = simState.scenario;
    const simTime = previous.simTime + dt;

    const receiverPose = sampleReceiverPose(simTime, scenario);
    const targetPosition = worldFromLocalOffset(
      receiverPose.position,
      receiverPose.rotation,
      RECEIVER_RECEPTACLE_LOCAL,
    );
    const targetPose = {
      position: targetPosition,
      rotation: receiverPose.rotation,
    };

    let estimate = EMPTY_ESTIMATE;
    const sensorCamera = sensorCameraRef.current;
    if (sensorCamera) {
      sensorCamera.updateWorldMatrix(true, false);
      const previousTarget = gl.getRenderTarget();
      gl.setRenderTarget(sensorTarget);
      gl.clear();
      gl.render(scene, sensorCamera);
      gl.setRenderTarget(previousTarget);

      estimate = runGeometryPerception({
        camera: sensorCamera,
        targetWorld: targetPosition,
        scenario,
        simTime,
      });

      captureAccumulator.current += delta;
      if (captureAccumulator.current >= 0.12) {
        captureAccumulator.current = 0;
        simState.setSensorFrame(readSensorFrame(gl, sensorTarget, SENSOR_RESOLUTION, SENSOR_RESOLUTION));
      }
    }

    const tracker = updateTracker(previous.tracker, estimate, dt);
    const boomTipBefore = getBoomTipPose(previous.boom).position;
    const metricsBefore = computeMetrics({
      boomTip: boomTipBefore,
      target: targetPosition,
      estimate,
      previousMetrics: previous.metrics,
      dt,
    });

    let controller = updateController({
      state: previous.controllerState,
      scenario,
      boom: previous.boom,
      boomTip: boomTipBefore,
      trackedTarget: tracker,
      estimate,
      safety: EMPTY_SAFETY,
      simTime,
    });

    let safety = evaluateSafety({
      state: controller.state,
      scenario,
      metrics: metricsBefore,
      previousMetrics: previous.metrics,
      boomTip: boomTipBefore,
      receiverPose,
      trackerConfidence: tracker.confidence,
    });

    if (safety.abort) {
      controller = updateController({
        state: "ABORT",
        scenario,
        boom: previous.boom,
        boomTip: boomTipBefore,
        trackedTarget: tracker,
        estimate,
        safety,
        simTime,
      });
    } else if (safety.hold) {
      controller = {
        ...controller,
        command: {
          ...controller.command,
          extendRate: Math.min(controller.command.extendRate, 0),
        },
      };
    }

    const nextBoom = applyIncrementCommand(previous.boom, controller.command, dt);
    const boomTipAfter = getBoomTipPose(nextBoom).position;
    const metrics = computeMetrics({
      boomTip: boomTipAfter,
      target: targetPosition,
      estimate,
      previousMetrics: previous.metrics,
      dt,
    });

    safety = {
      ...safety,
      hold: safety.hold || tracker.confidence < 0.25,
    };

    const live = {
      simTime,
      frame: previous.frame + 1,
      receiverPose,
      targetPose,
      boom: nextBoom,
      command: controller.command,
      controllerState: controller.state,
      estimate,
      tracker,
      safety,
      metrics,
      abortReason: controller.state === "ABORT" ? safety.reasons[0] ?? previous.abortReason : null,
    };

    simState.setLive(live);

    if (shouldRecordReplay(simTime, simState.lastRecordedAt)) {
      simState.pushReplaySample(createReplaySample(live));
      simState.setLastRecordedAt(simTime);
    }
  });

  return (
    <>
      <MainCameraLayerSync />
      <color attach="background" args={[clear]} />
      <OuterEnvironment variant={environmentVariant} />
      <SceneLighting />
      <SimContentLayer>
        <Tanker />
        <Receiver />
        <BoomRig sensorCameraRef={sensorCameraRef} />
      </SimContentLayer>
      <DebugHelpers />
      {environmentVariant === "landing" ? (
        <LandingFlybyController />
      ) : simVariant === "capture" ? (
        <CaptureCameraRig />
      ) : (
        <OrbitControls
          makeDefault
          target={[MAIN_CAMERA_TARGET.x, MAIN_CAMERA_TARGET.y, MAIN_CAMERA_TARGET.z]}
          minDistance={9}
          maxDistance={38}
          maxPolarAngle={Math.PI * 0.46}
        />
      )}
    </>
  );
}

export function SimCanvas({
  variant = "sim",
  onLandingReady,
  landingForceRender,
}: {
  variant?: SimCanvasVariant;
  /** Landing only: called once assets + first paints are ready (boot overlay dismisses). */
  onLandingReady?: () => void;
  /** Landing only: keep the render loop running (e.g. while boot overlay hides the hero). */
  landingForceRender?: boolean;
}) {
  const sensorCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sensorTarget = useMemo(() => createSensorRenderTarget(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);

  const clearColor =
    variant === "landing" ? LANDING_CANVAS_CLEAR : CANVAS_CLEAR;
  const toneExposure =
    variant === "landing" ? LANDING_TONE_MAPPING_EXPOSURE : 0.72;

  const outerEnv: OuterEnvironmentVariant =
    variant === "landing" ? "landing" : variant === "capture" ? "capture" : "sim";

  useEffect(() => {
    return () => {
      sensorTarget.dispose();
    };
  }, [sensorTarget]);

  useEffect(() => {
    if (variant !== "landing") return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        setHeroVisible(!!e?.isIntersecting);
      },
      { root: null, rootMargin: "120px 0px", threshold: 0.02 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [variant]);

  return (
    <div
      ref={containerRef}
      className={
        variant === "landing" || variant === "capture"
          ? variant === "capture"
            ? "absolute inset-0 z-0 h-full min-h-0 w-full overflow-hidden"
            : "pointer-events-none absolute inset-0 z-0 h-full min-h-0 w-full overflow-hidden"
          : "fixed inset-0 z-0 box-border min-h-0 w-screen max-w-[100vw] overflow-hidden"
      }
      style={{
        background: clearColor,
        height: variant === "landing" || variant === "capture" ? "100%" : "100dvh",
        minHeight: variant === "landing" || variant === "capture" ? "100%" : "100dvh",
      }}
    >
      <Canvas
        className="block h-full w-full touch-none"
        frameloop={
          variant === "landing"
            ? landingForceRender || heroVisible
              ? "always"
              : "never"
            : "always"
        }
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{
          position:
            variant === "landing"
              ? LANDING_HERO_CAMERA_POSITION
              : [
                  MAIN_CAMERA_POSITION.x,
                  MAIN_CAMERA_POSITION.y,
                  MAIN_CAMERA_POSITION.z,
                ],
          fov: variant === "landing" ? LANDING_HERO_CAMERA_FOV : 42,
        }}
        style={{ width: "100%", height: "100%" }}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={variant === "landing" ? [1, 1.5] : variant === "capture" ? [1, 2] : [1, 2]}
        onCreated={({ gl, scene, camera }) => {
          camera.layers.enable(SIM_CONTENT_LAYER);
          scene.background = new THREE.Color(clearColor);
          gl.setClearColor(clearColor, 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = toneExposure;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <SimulationWorld
          sensorCameraRef={sensorCameraRef}
          sensorTarget={sensorTarget}
          environmentVariant={outerEnv}
          simVariant={variant}
        />
        {variant === "landing" && onLandingReady ? (
          <LandingSceneReadyNotifier onReady={onLandingReady} />
        ) : null}
      </Canvas>
    </div>
  );
}
