"use client";

import { Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { LandingSceneReadyNotifier } from "@/components/scene/LandingSceneReadyNotifier";
import { MainCameraPostProcessing } from "@/components/scene/MainCameraPostProcessing";
import {
  CAPTURE_CANVAS_CLEAR,
  CAPTURE_TONE_MAPPING_EXPOSURE,
  LANDING_CANVAS_CLEAR,
  LANDING_TONE_MAPPING_EXPOSURE,
  SIM_CANVAS_CLEAR,
  SIM_TONE_MAPPING_EXPOSURE,
} from "@/components/scene/sunConfig";
import { REPLAY_SAMPLE_HZ } from "@/lib/sim/constants";
import { clampReplayIndex } from "@/lib/sim/replay";
import { useDisplayedReplayBundle } from "@/lib/sim/useDisplayedReplayBundle";
import type { Landmark, ReplaySample, Vec3 } from "@/lib/sim/types";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export type SimCanvasVariant = "sim" | "landing" | "capture";

function vecToArray(position: Vec3): [number, number, number] {
  return [position.x, position.y, position.z];
}

function findSampleIndex(samples: ReplaySample[], simTime: number) {
  if (samples.length === 0) {
    return 0;
  }

  for (let index = 0; index < samples.length; index += 1) {
    if ((samples[index]?.recordedAt ?? 0) >= simTime) {
      return index;
    }
  }

  return samples.length - 1;
}

function TerminalShell({ simplified }: { simplified: boolean }) {
  const propOpacity = simplified ? 0.18 : 0.55;
  const propColor = simplified ? "#30475e" : "#5c7594";

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={simplified ? "#0d141b" : "#111921"} roughness={0.92} metalness={0.04} />
      </mesh>

      <mesh position={[0, 2.5, 40]}>
        <boxGeometry args={[28, 5, 0.5]} />
        <meshStandardMaterial color="#182634" roughness={0.75} />
      </mesh>
      <mesh position={[14, 2.5, 20]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[40, 5, 0.5]} />
        <meshStandardMaterial color="#1c2a37" roughness={0.75} />
      </mesh>
      <mesh position={[-14, 2.5, 20]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[40, 5, 0.5]} />
        <meshStandardMaterial color="#1b2733" roughness={0.75} />
      </mesh>

      <mesh position={[0, 0.02, 11]}>
        <boxGeometry args={[4.5, 0.05, 10]} />
        <meshStandardMaterial color="#52331c" emissive="#8d5318" emissiveIntensity={0.4} />
      </mesh>

      {[[-5, 0.55, 6], [7.5, 0.55, 25], [-8, 0.55, 30.5], [10, 0.55, 34.5]].map((position, index) => (
        <mesh key={index} position={position as [number, number, number]}>
          <boxGeometry args={[2.4, 1.3, 0.15]} />
          <meshStandardMaterial color={simplified ? "#203347" : "#274965"} emissive="#f2b15b" emissiveIntensity={0.55} />
        </mesh>
      ))}

      {!simplified ? (
        <>
          {[[-3.2, 0.32, 8.2], [-1, 0.32, 8.2], [1.2, 0.32, 8.2], [3.4, 0.32, 8.2]].map((position, index) => (
            <group key={index} position={position as [number, number, number]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.65, 12]} />
                <meshStandardMaterial color={propColor} transparent opacity={propOpacity} />
              </mesh>
              <mesh position={[0, 0.25, 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.65, 12]} />
                <meshStandardMaterial color={propColor} transparent opacity={propOpacity} />
              </mesh>
            </group>
          ))}
          {[[-9, 0.24, 24], [-8, 0.24, 24], [-7, 0.24, 24], [8, 0.24, 28], [9, 0.24, 28]].map((position, index) => (
            <mesh key={`bench-${index}`} position={position as [number, number, number]} castShadow>
              <boxGeometry args={[0.8, 0.24, 1.6]} />
              <meshStandardMaterial color={propColor} transparent opacity={propOpacity} />
            </mesh>
          ))}
        </>
      ) : null}
    </group>
  );
}

function LandmarkHalos({
  landmarks,
  assistiveMode,
}: {
  landmarks: Landmark[];
  assistiveMode: "blind" | "low-vision";
}) {
  return (
    <group>
      {landmarks.map((landmark) => (
        <group key={landmark.id} position={vecToArray(landmark.position)}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.42, 0.78, 48]} />
            <meshBasicMaterial
              color={assistiveMode === "low-vision" ? "#ffbf66" : "#8bd8ff"}
              transparent
              opacity={assistiveMode === "low-vision" ? 0.88 : 0.54}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color="#f9f3d2" emissive="#ffe3a0" emissiveIntensity={0.65} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HazardMarkers({
  activeHazards,
  scenarioHazards,
  edges,
  nodes,
}: {
  activeHazards: string[];
  scenarioHazards: NonNullable<ReturnType<typeof useSimStore.getState>["scenario"]["journey"]>["hazards"];
  edges: NonNullable<ReturnType<typeof useSimStore.getState>["scenario"]["journey"]>["edges"];
  nodes: NonNullable<ReturnType<typeof useSimStore.getState>["scenario"]["journey"]>["nodes"];
}) {
  return (
    <group>
      {scenarioHazards
        .filter((hazard) => activeHazards.includes(hazard.id))
        .map((hazard) => {
          const edge = edges.find((entry) => entry.id === hazard.edgeId);
          if (!edge) {
            return null;
          }

          const from = nodes.find((node) => node.id === edge.from);
          const to = nodes.find((node) => node.id === edge.to);
          if (!from || !to) {
            return null;
          }

          const position = {
            x: (from.position.x + to.position.x) * 0.5,
            y: 0.12,
            z: (from.position.z + to.position.z) * 0.5,
          };

          return (
            <group key={hazard.id} position={vecToArray(position)}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.35, 1.35]} />
                <meshBasicMaterial color="#c54e30" transparent opacity={0.8} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, 0.18, 0]}>
                <boxGeometry args={[0.5, 0.32, 0.08]} />
                <meshStandardMaterial color="#ffe0c2" emissive="#ff8f4d" emissiveIntensity={0.65} />
              </mesh>
            </group>
          );
        })}
    </group>
  );
}

function Traveler({
  position,
  assistiveMode,
}: {
  position: Vec3;
  assistiveMode: "blind" | "low-vision";
}) {
  return (
    <group position={vecToArray(position)}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.26, 0.72, 6, 12]} />
        <meshStandardMaterial
          color={assistiveMode === "low-vision" ? "#ffcf6e" : "#7dd0ff"}
          emissive={assistiveMode === "low-vision" ? "#ff9e3d" : "#4ca7d9"}
          emissiveIntensity={0.45}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.78, 48]} />
        <meshBasicMaterial
          color={assistiveMode === "low-vision" ? "#ffd784" : "#93d9ff"}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function DestinationBeacon({ position }: { position: Vec3 }) {
  return (
    <group position={vecToArray(position)}>
      <mesh position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 2.4, 16]} />
        <meshStandardMaterial color="#fdf2ce" emissive="#ffcf7a" emissiveIntensity={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.8, 1.2, 64]} />
        <meshBasicMaterial color="#ffbf66" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CameraDirector({
  enabledOrbitControls,
}: {
  enabledOrbitControls: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const displayed = useDisplayedReplayBundle().primary;
  const cameraMode = useUiStore((state) => state.cameraMode);

  useFrame((_, delta) => {
    if (enabledOrbitControls || !displayed.journey) {
      return;
    }

    const traveler = displayed.receiverPose.position;
    const destination = displayed.targetPose.position;
    const routeMid = {
      x: (traveler.x + destination.x) * 0.5,
      y: 0,
      z: (traveler.z + destination.z) * 0.5,
    };

    const targetPosition =
      cameraMode === "receiver-lock"
        ? new THREE.Vector3(traveler.x - 4.8, 4.6, traveler.z - 6.2)
        : new THREE.Vector3(routeMid.x + 7.2, 9.5, routeMid.z + 6.6);
    const targetLook =
      cameraMode === "receiver-lock"
        ? new THREE.Vector3(traveler.x, 0.8, traveler.z + 2.4)
        : new THREE.Vector3(routeMid.x, 0.6, routeMid.z + 4.4);

    camera.position.lerp(targetPosition, 1 - Math.exp(-delta * 2.6));
    camera.lookAt(targetLook);
  });

  return null;
}

function SimulationWorld({
  simVariant,
}: {
  simVariant: SimCanvasVariant;
}) {
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const displayedBundle = useDisplayedReplayBundle();
  const displayed = displayedBundle.primary;
  const comparison = displayedBundle.comparison;
  const allowOrbitControls = useOnboardingStore((state) => state.allowOrbitControls);
  const replayMode = useUiStore((state) => state.replayMode);
  const replayIndex = useUiStore((state) => state.replayIndex);
  const replayPlaying = useUiStore((state) => state.replayPlaying);
  const replayDataSource = useUiStore((state) => state.replayDataSource);
  const evaluationView = useUiStore((state) => state.evaluationView);
  const liveRunState = useUiStore((state) => state.liveRunState);
  const liveRunRate = useUiStore((state) => state.liveRunRate);
  const simFrozen = useUiStore((state) => state.simFrozen);
  const setReplayIndex = useUiStore((state) => state.setReplayIndex);
  const setReplayPlaying = useUiStore((state) => state.setReplayPlaying);
  const stopLiveRun = useUiStore((state) => state.stopLiveRun);
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const plannedRunSamples = useSimStore((state) => state.plannedRunSamples);
  const autonomyEvaluation = useSimStore((state) => state.autonomyEvaluation);
  const setLive = useSimStore((state) => state.setLive);
  const pushReplaySample = useSimStore((state) => state.pushReplaySample);
  const setLastRecordedAt = useSimStore((state) => state.setLastRecordedAt);
  const scenario = useSimStore((state) => state.scenario);
  const sensorViewportModality = useUiStore((state) => state.sensorViewportModality);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const sampleCursorRef = useRef(0);
  const previewTimeRef = useRef(0);
  const replayAccumulator = useRef(0);
  const scenarioJourney = scenario.journey;

  useLayoutEffect(() => {
    if (simVariant !== "landing") {
      return;
    }

    camera.position.set(14.5, 10.6, -7.5);
    camera.lookAt(0, 0.8, 18);
  }, [camera, simVariant]);

  useEffect(() => {
    sampleCursorRef.current = 0;
    previewTimeRef.current = 0;
  }, [plannedRunSamples, scenario.id]);

  useFrame((_, delta) => {
    if (simFrozen) {
      return;
    }

    if (replayMode) {
      if (!replayPlaying) {
        return;
      }

      const activeReplayLength =
        replayDataSource === "autonomy" && autonomyEvaluation
          ? Math.max(
              autonomyEvaluation.baselineReplaySamples.length,
              autonomyEvaluation.uploadedReplaySamples.length,
            )
          : replaySamples.length;

      if (activeReplayLength === 0) {
        return;
      }

      replayAccumulator.current += delta;
      if (replayAccumulator.current >= 1 / REPLAY_SAMPLE_HZ) {
        replayAccumulator.current = 0;
        const nextIndex = clampReplayIndex(replayIndex + 1, activeReplayLength);
        setReplayIndex(nextIndex);
        if (nextIndex >= activeReplayLength - 1) {
          setReplayPlaying(false);
        }
      }
      return;
    }

    if (simVariant === "sim") {
      if (liveRunState !== "running" || plannedRunSamples.length === 0) {
        return;
      }

      const currentTime = live.simTime;
      const nextTime = Math.min(
        plannedRunSamples[plannedRunSamples.length - 1]?.recordedAt ?? currentTime,
        currentTime + delta * liveRunRate,
      );
      const nextIndex = findSampleIndex(plannedRunSamples, nextTime);
      const nextSample = plannedRunSamples[nextIndex];
      if (!nextSample) {
        return;
      }

      setLive(structuredClone(nextSample));

      while (sampleCursorRef.current <= nextIndex) {
        const sample = plannedRunSamples[sampleCursorRef.current];
        if (!sample) {
          break;
        }
        pushReplaySample(structuredClone(sample));
        setLastRecordedAt(sample.recordedAt);
        sampleCursorRef.current += 1;
      }

      if (nextIndex >= plannedRunSamples.length - 1) {
        stopLiveRun();
      }

      return;
    }

    const previewSamples =
      evaluationView === "baseline" && autonomyEvaluation
        ? autonomyEvaluation.baselineReplaySamples
        : autonomyEvaluation?.uploadedReplaySamples ?? plannedRunSamples;

    if (previewSamples.length === 0) {
      return;
    }

    previewTimeRef.current += delta * 0.8;
    const previewIndex = Math.floor(previewTimeRef.current * REPLAY_SAMPLE_HZ) % previewSamples.length;
    const previewSample = previewSamples[previewIndex];

    if (previewSample) {
      setLive(structuredClone(previewSample));
    }
  });

  useEffect(() => {
    scene.background = new THREE.Color(simVariant === "landing" ? LANDING_CANVAS_CLEAR : simVariant === "capture" ? CAPTURE_CANVAS_CLEAR : SIM_CANVAS_CLEAR);
    gl.setClearColor(scene.background, 1);
  }, [gl, scene, simVariant]);

  const simplified =
    displayed.journey?.assistiveMode === "low-vision" || sensorViewportModality === "visible";
  const primaryRoute = displayed.journey?.routePlan.points ?? [];
  const comparisonRoute = comparison?.journey?.routePlan.points ?? [];
  const activeHazards = displayed.journey?.activeHazards ?? [];

  return (
    <>
      <ambientLight intensity={simplified ? 0.66 : 0.56} color="#e6dcc7" />
      <directionalLight
        position={[10, 16, -6]}
        intensity={1.6}
        color="#f8d7a1"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-12, 8, 12]} intensity={0.66} color="#6f90b6" />

      <TerminalShell simplified={simplified} />

      {primaryRoute.length >= 2 ? (
        <Line
          points={primaryRoute.map(vecToArray)}
          color="#ffb55b"
          lineWidth={simplified ? 7 : 5}
          transparent
          opacity={0.95}
        />
      ) : null}

      {comparisonRoute.length >= 2 && replayDataSource === "autonomy" ? (
        <Line
          points={comparisonRoute.map(vecToArray)}
          color={evaluationView === "overlay" ? "#7dd0ff" : evaluationView === "baseline" ? "#7dd0ff" : "#5c6f84"}
          lineWidth={4}
          transparent
          opacity={evaluationView === "overlay" ? 0.68 : 0.92}
        />
      ) : null}

      {scenarioJourney ? (
        <>
          <LandmarkHalos
            landmarks={scenarioJourney.landmarks}
            assistiveMode={displayed.journey?.assistiveMode ?? "blind"}
          />
          <HazardMarkers
            activeHazards={activeHazards}
            scenarioHazards={scenarioJourney.hazards}
            edges={scenarioJourney.edges}
            nodes={scenarioJourney.nodes}
          />
        </>
      ) : null}

      <DestinationBeacon position={displayed.targetPose.position} />
      <Traveler position={displayed.receiverPose.position} assistiveMode={displayed.journey?.assistiveMode ?? "blind"} />

      <OrbitControls
        enabled={allowOrbitControls && cameraMode === "manual"}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        screenSpacePanning
        target={[0, 0.8, 18]}
        minDistance={8}
        maxDistance={48}
        maxPolarAngle={Math.PI * 0.48}
        rotateSpeed={0.75}
        panSpeed={0.85}
        zoomSpeed={0.9}
      />
      <CameraDirector enabledOrbitControls={allowOrbitControls && cameraMode === "manual"} />
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
  onLandingReady?: () => void;
  onSimReady?: () => void;
  landingForceRender?: boolean;
}) {
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

  useEffect(() => {
    if (variant !== "landing") {
      return;
    }

    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(!!entry?.isIntersecting);
      },
      { root: null, rootMargin: "120px 0px", threshold: 0.02 },
    );
    observer.observe(element);
    return () => observer.disconnect();
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
        frameloop={variant === "landing" ? (landingForceRender || heroVisible ? "always" : "never") : "always"}
        shadows
        camera={{
          position: variant === "landing" ? [14.5, 10.6, -7.5] : [16, 11, -4],
          fov: variant === "landing" ? 34 : 42,
        }}
        resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        dpr={variant === "landing" ? [1, 1.5] : variant === "capture" ? [1, 2] : [1, 2]}
        onCreated={({ gl, scene }) => {
          scene.background = new THREE.Color(clearColor);
          gl.setClearColor(clearColor, 1);
          gl.toneMapping = THREE.AgXToneMapping;
          gl.toneMappingExposure = toneExposure;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <SimulationWorld simVariant={variant} />
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
