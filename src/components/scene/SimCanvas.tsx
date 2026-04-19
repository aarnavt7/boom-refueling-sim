"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { DebugHelpers } from "@/components/scene/DebugHelpers";
import {
  LandingFlybyController,
  LANDING_HERO_CAMERA_FOV,
  LANDING_HERO_CAMERA_POSITION,
} from "@/components/scene/LandingFlybyController";
import { MainCameraPostProcessing } from "@/components/scene/MainCameraPostProcessing";
import { CaptureCameraRig } from "@/components/scene/CaptureCameraRig";
import { LandingSceneReadyNotifier } from "@/components/scene/LandingSceneReadyNotifier";
import {
  OuterEnvironment,
  type OuterEnvironmentVariant,
} from "@/components/scene/OuterEnvironment";
import { Receiver } from "@/components/scene/Receiver";
import { RefuelLinkEffect } from "@/components/scene/RefuelLinkEffect";
import { SceneLighting } from "@/components/scene/SceneLighting";
import { SimContentLayer } from "@/components/scene/SimContentLayer";
import { TankerAssembly } from "@/components/scene/TankerAssembly";
import { GamepadCameraRig } from "@/components/scene/GamepadCameraRig";
import { TrackingCameraRig } from "@/components/scene/TrackingCameraRig";
import { TrackingOverlays } from "@/components/scene/TrackingOverlays";
import { TutorialCameraRig } from "@/components/scene/TutorialCameraRig";
import {
  CAPTURE_CANVAS_CLEAR,
  CAPTURE_TONE_MAPPING_EXPOSURE,
  LANDING_CANVAS_CLEAR,
  LANDING_TONE_MAPPING_EXPOSURE,
  SIM_CANVAS_CLEAR,
  SIM_TONE_MAPPING_EXPOSURE,
} from "@/components/scene/sunConfig";
import {
  MAIN_CAMERA_POSITION,
  MAIN_CAMERA_TARGET,
} from "@/lib/sim/aircraftVisualConfig";
import { getReceiverReceptacleWorld, getTankerPose } from "@/lib/sim/aircraftAttachments";
import {
  MAX_FRAME_DT,
  SENSOR_RESOLUTION,
} from "@/lib/sim/constants";
import { applyAutopilotCommand, toAutopilotCommandECEF } from "@/lib/sim/autopilot";
import { updateController } from "@/lib/sim/controller";
import { getBoomTipPose, solveBoomIK } from "@/lib/sim/kinematics";
import { computeMetrics } from "@/lib/sim/metrics";
import { sampleReceiverPose } from "@/lib/sim/motion";
import { runPassivePerception } from "@/lib/sim/perception";
import {
  clampReplayIndex,
  createReplaySample,
  shouldRecordReplay,
} from "@/lib/sim/replay";
import { createSensorRenderTarget, readSensorFrame } from "@/lib/sim/renderTarget";
import { evaluateSafety } from "@/lib/sim/safety";
import { SIM_CONTENT_LAYER } from "@/lib/sim/sceneLayers";
import { getSensorViewportRenderKey, resolveSensorViewportFeed } from "@/lib/sim/sensorViewport";
import { updateTracker } from "@/lib/sim/tracker";
import { useDisplayedReplayBundle } from "@/lib/sim/useDisplayedReplayBundle";
import { isCaptureSimDriverActive, registerCaptureSimDriver } from "@/lib/sim/simDriver";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
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
    environmentVariant === "landing"
      ? LANDING_CANVAS_CLEAR
      : environmentVariant === "capture"
        ? CAPTURE_CANVAS_CLEAR
        : SIM_CANVAS_CLEAR;
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  const captureAccumulator = useRef(0);
  const replayAccumulator = useRef(0);
  const lastSensorRenderKeyRef = useRef<string | null>(null);
  const allowOrbitControls = useOnboardingStore((state) => state.allowOrbitControls);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const setCameraMode = useUiStore((state) => state.setCameraMode);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayDataSource = useUiStore((state) => state.replayDataSource);
  const evaluationView = useUiStore((state) => state.evaluationView);
  const replayIndex = useUiStore((state) => state.replayIndex);
  const sensorViewportSource = useUiStore((state) => state.sensorViewportSource);
  const sensorViewportModality = useUiStore((state) => state.sensorViewportModality);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const autonomyEvaluation = useSimStore((state) => state.autonomyEvaluation);
  const displayed = useDisplayedReplayBundle().primary;
  const viewportFeed = resolveSensorViewportFeed({
    state: displayed,
    source: sensorViewportSource,
    modality: sensorViewportModality,
  });
  const sensorViewportRenderKey = getSensorViewportRenderKey({
    state: displayed,
    source: sensorViewportSource,
    modality: sensorViewportModality,
    replayMode,
    replayIndex,
    replayDataSource,
    evaluationView,
  });
  const activeReplaySampleCount =
    replayDataSource === "autonomy" && autonomyEvaluation
      ? Math.max(
          autonomyEvaluation.baselineReplaySamples.length,
          autonomyEvaluation.uploadedReplaySamples.length,
        )
      : replaySamples.length;
  const handleOrbitStart = useCallback(() => {
    if (simVariant !== "sim" || !allowOrbitControls) {
      return;
    }

    if (useUiStore.getState().cameraMode !== "manual") {
      setCameraMode("manual");
    }
  }, [allowOrbitControls, setCameraMode, simVariant]);

  useFrame((_, delta) => {
    if (simVariant === "landing" && isCaptureSimDriverActive()) {
      return;
    }

    const uiState = useUiStore.getState();
    const simState = useSimStore.getState();
    const sensorViewportChanged = lastSensorRenderKeyRef.current !== sensorViewportRenderKey;

    const refreshSensorFrame = (forceRead = false) => {
      const sensorCamera = sensorCameraRef.current;
      if (!sensorCamera) {
        return;
      }

      sensorCamera.updateWorldMatrix(true, false);
      const previousTarget = gl.getRenderTarget();
      gl.setRenderTarget(sensorTarget);
      gl.clear();
      gl.render(scene, sensorCamera);
      gl.setRenderTarget(previousTarget);

      captureAccumulator.current += delta;
      const needsFrame =
        forceRead || simState.sensorFrame === null || captureAccumulator.current >= 0.12;
      if (!needsFrame) {
        return;
      }

      captureAccumulator.current = 0;
      simState.setSensorFrame(readSensorFrame(gl, sensorTarget, SENSOR_RESOLUTION, SENSOR_RESOLUTION));
      lastSensorRenderKeyRef.current = sensorViewportRenderKey;
    };

    if (uiState.simFrozen) {
      /** Physics are paused but keep refreshing the sensor RTT read so the PIP stays valid (not stuck black). */
      refreshSensorFrame(sensorViewportChanged || uiState.simFrozen);
      return;
    }

    if (uiState.replayMode) {
      refreshSensorFrame(sensorViewportChanged || !uiState.replayPlaying);

      if (!uiState.replayPlaying || activeReplaySampleCount === 0) {
        return;
      }

      replayAccumulator.current += delta;
      if (replayAccumulator.current >= 1 / 20) {
        replayAccumulator.current = 0;
        const nextIndex = clampReplayIndex(uiState.replayIndex + 1, activeReplaySampleCount);
        useUiStore.getState().setReplayIndex(nextIndex);
        if (nextIndex === activeReplaySampleCount - 1) {
          useUiStore.getState().setReplayPlaying(false);
        }
      }
      return;
    }

    if (simVariant === "sim" && uiState.liveRunState !== "running") {
      if (simState.sensorFrame === null || sensorViewportChanged) {
        refreshSensorFrame(true);
      }
      return;
    }

    const dt = Math.min(delta, MAX_FRAME_DT);
    const previous = simState.live;
    const scenario = simState.scenario;
    const simTime = previous.simTime + dt;

    const receiverPose = sampleReceiverPose(simTime, scenario);
    const targetPosition = getReceiverReceptacleWorld(receiverPose);
    const targetPose = {
      position: targetPosition,
      rotation: receiverPose.rotation,
    };

    const perception = runPassivePerception({
      boom: previous.boom,
      targetPose,
      scenario,
      simTime,
    });
    const estimate = perception.estimate;
    refreshSensorFrame(sensorViewportChanged);

    const tracker = updateTracker(previous.tracker, perception.observations, dt);
    const boomTipBefore = getBoomTipPose(previous.boom).position;
    const receiverVelocity = {
      x: (receiverPose.position.x - previous.receiverPose.position.x) / Math.max(dt, 1e-3),
      y: (receiverPose.position.y - previous.receiverPose.position.y) / Math.max(dt, 1e-3),
      z: (receiverPose.position.z - previous.receiverPose.position.z) / Math.max(dt, 1e-3),
    };
    const metricsBefore = computeMetrics({
      boomTip: boomTipBefore,
      target: targetPosition,
      tracker,
      estimate,
      observations: perception.observations,
      autopilotCommand: previous.autopilotCommand,
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
      safety: previous.safety,
      simTime,
    });

    const safety = evaluateSafety({
      state: controller.state,
      scenario,
      metrics: metricsBefore,
      previousMetrics: previous.metrics,
      boomTip: boomTipBefore,
      receiverPose,
      receiverVelocity,
      tracker,
      observations: perception.observations,
      manualAbort: uiState.manualAbort,
    });

    if (safety.abort || safety.breakaway || safety.hold) {
      controller = updateController({
        state: previous.controllerState,
        scenario,
        boom: previous.boom,
        boomTip: boomTipBefore,
        trackedTarget: tracker,
        estimate,
        safety,
        simTime,
      });
    }

    const autopilotCommand = toAutopilotCommandECEF(controller.desiredTipMotion, getTankerPose());
    const plant = applyAutopilotCommand(previous.boom, autopilotCommand, getTankerPose(), dt);
    const nextBoom =
      controller.state === "MATED"
        ? solveBoomIK(targetPosition)
        : plant.nextBoom;
    const boomTipAfter = getBoomTipPose(nextBoom).position;
    const metrics = computeMetrics({
      boomTip: boomTipAfter,
      target: targetPosition,
      tracker,
      estimate,
      observations: perception.observations,
      autopilotCommand,
      previousMetrics: previous.metrics,
      dt,
    });

    if (uiState.manualAbort && (controller.state === "BREAKAWAY" || controller.state === "ABORT")) {
      useUiStore.getState().clearManualAbort();
    }

    const live = {
      simTime,
      frame: previous.frame + 1,
      receiverPose,
      targetPose,
      boom: nextBoom,
      autopilotCommand,
      command: plant.command,
      controllerState: controller.state,
      sensorObservations: perception.observations,
      estimate,
      tracker,
      safety,
      metrics,
      abortReason:
        controller.state === "ABORT" || controller.state === "BREAKAWAY"
          ? safety.reasons[0] ?? previous.abortReason
          : null,
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
        <TankerAssembly
          sensorCameraRef={sensorCameraRef}
          sensorViewportSensorId={viewportFeed.effectiveSensorId}
          boom={displayed.boom}
        />
        <Receiver />
        {simVariant === "sim" ? (
          <>
            <RefuelLinkEffect />
            <TrackingOverlays />
          </>
        ) : null}
      </SimContentLayer>
      <DebugHelpers />
      {environmentVariant === "landing" ? (
        <LandingFlybyController />
      ) : simVariant === "capture" ? (
        <CaptureCameraRig />
      ) : (
        <>
          <OrbitControls
            enabled={allowOrbitControls}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            screenSpacePanning
            target={[MAIN_CAMERA_TARGET.x, MAIN_CAMERA_TARGET.y, MAIN_CAMERA_TARGET.z]}
            minDistance={9}
            maxDistance={52}
            maxPolarAngle={Math.PI * 0.85}
            rotateSpeed={0.72}
            panSpeed={0.82}
            zoomSpeed={0.86}
            onStart={handleOrbitStart}
          />
          <TrackingCameraRig />
          <GamepadCameraRig />
          <TutorialCameraRig />
        </>
      )}
    </>
  );
}

export function SimCanvas({
  variant = "sim",
  onLandingReady,
  onSimReady,
  landingForceRender,
}: {
  variant?: SimCanvasVariant;
  /** Landing only: called once assets + first paints are ready (boot overlay dismisses). */
  onLandingReady?: () => void;
  /** Fullscreen `/sim` only: called once HDR/env assets report loaded (for boot overlay). */
  onSimReady?: () => void;
  /** Landing only: keep the render loop running (e.g. while boot overlay hides the hero). */
  landingForceRender?: boolean;
}) {
  const sensorCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sensorTarget = useMemo(() => createSensorRenderTarget(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);

  const clearColor =
    variant === "landing"
      ? LANDING_CANVAS_CLEAR
      : variant === "capture"
        ? CAPTURE_CANVAS_CLEAR
        : SIM_CANVAS_CLEAR;
  const toneExposure =
    variant === "landing"
      ? LANDING_TONE_MAPPING_EXPOSURE
      : variant === "capture"
        ? CAPTURE_TONE_MAPPING_EXPOSURE
        : SIM_TONE_MAPPING_EXPOSURE;

  const outerEnv: OuterEnvironmentVariant =
    variant === "landing" ? "landing" : variant === "capture" ? "capture" : "sim";

  useEffect(() => {
    return () => {
      sensorTarget.dispose();
    };
  }, [sensorTarget]);

  useLayoutEffect(() => {
    if (variant !== "capture") return;
    return registerCaptureSimDriver();
  }, [variant]);

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
      data-tour={variant === "sim" ? "main-viewport" : undefined}
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
          gl.toneMapping = THREE.AgXToneMapping;
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
        <MainCameraPostProcessing variant={variant} />
        {variant === "landing" && onLandingReady ? (
          <LandingSceneReadyNotifier onReady={onLandingReady} />
        ) : null}
        {variant === "sim" && onSimReady ? (
          <LandingSceneReadyNotifier onReady={onSimReady} minHoldMs={0} />
        ) : null}
      </Canvas>
    </div>
  );
}
