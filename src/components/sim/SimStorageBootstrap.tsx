"use client";

import { useEffect, useLayoutEffect, useState } from "react";

import { getScenarioById } from "@/lib/sim/scenarios";
import { loadUserPrefs, saveUserPrefs } from "@/lib/storage/simStorage";
import { useGamepadStore } from "@/lib/store/gamepadStore";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export function SimStorageBootstrap() {
  const selectedScenarioId = useUiStore((state) => state.selectedScenarioId);
  const selectedAircraftCardId = useUiStore((state) => state.selectedAircraftCardId);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const sensorViewportSource = useUiStore((state) => state.sensorViewportSource);
  const sensorViewportModality = useUiStore((state) => state.sensorViewportModality);
  const showDebug = useUiStore((state) => state.showDebug);
  const evaluationView = useUiStore((state) => state.evaluationView);
  const lastInputDevice = useGamepadStore((state) => state.lastInputDevice);
  const controllerHintsDismissed = useGamepadStore(
    (state) => state.controllerHintsDismissed,
  );
  const setScenarioId = useUiStore((state) => state.setScenarioId);
  const setSelectedAircraftCardId = useUiStore((state) => state.setSelectedAircraftCardId);
  const setCameraMode = useUiStore((state) => state.setCameraMode);
  const setSensorViewportSource = useUiStore((state) => state.setSensorViewportSource);
  const setSensorViewportModality = useUiStore((state) => state.setSensorViewportModality);
  const setShowDebug = useUiStore((state) => state.setShowDebug);
  const setEvaluationView = useUiStore((state) => state.setEvaluationView);
  const hydrateGamepadPrefs = useGamepadStore((state) => state.hydrateFromPrefs);
  const setScenarioById = useSimStore((state) => state.setScenarioById);
  const lastAutonomyUpload = useSimStore((state) => state.lastAutonomyUpload);
  const setLastAutonomyUpload = useSimStore((state) => state.setLastAutonomyUpload);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    const prefs = loadUserPrefs();

    if (prefs) {
      const safeScenarioId = getScenarioById(prefs.selectedScenarioId).id;

      if (safeScenarioId !== useUiStore.getState().selectedScenarioId) {
        setScenarioId(safeScenarioId);
        setScenarioById(safeScenarioId);
      }

      if (prefs.showDebug !== useUiStore.getState().showDebug) {
        setShowDebug(prefs.showDebug);
      }

      if (prefs.selectedAircraftCardId !== useUiStore.getState().selectedAircraftCardId) {
        setSelectedAircraftCardId(prefs.selectedAircraftCardId);
      }

      if (prefs.cameraMode !== useUiStore.getState().cameraMode) {
        setCameraMode(prefs.cameraMode);
      }

      if (prefs.sensorViewportSource !== useUiStore.getState().sensorViewportSource) {
        setSensorViewportSource(prefs.sensorViewportSource);
      }

      if (prefs.sensorViewportModality !== useUiStore.getState().sensorViewportModality) {
        setSensorViewportModality(prefs.sensorViewportModality);
      }

      if (prefs.evaluationView !== useUiStore.getState().evaluationView) {
        setEvaluationView(prefs.evaluationView);
      }

      hydrateGamepadPrefs({
        lastInputDevice: prefs.lastInputDevice,
        controllerHintsDismissed: prefs.controllerHintsDismissed,
      });

      if (prefs.lastAutonomyUpload) {
        setLastAutonomyUpload(prefs.lastAutonomyUpload);
      }
    }

    setHydrated(true);
  }, [
    hydrateGamepadPrefs,
    setCameraMode,
    setEvaluationView,
    setLastAutonomyUpload,
    setScenarioById,
    setScenarioId,
    setSensorViewportModality,
    setSensorViewportSource,
    setSelectedAircraftCardId,
    setShowDebug,
  ]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      saveUserPrefs({
        selectedScenarioId: getScenarioById(selectedScenarioId).id,
        selectedAircraftCardId,
        cameraMode,
        sensorViewportSource,
        sensorViewportModality,
        showDebug,
        evaluationView,
        lastInputDevice,
        controllerHintsDismissed,
        lastAutonomyUpload,
      });
    } catch {
      // Ignore storage write failures; the sim should keep running even in restricted browsers.
    }
  }, [
    cameraMode,
    evaluationView,
    hydrated,
    controllerHintsDismissed,
    lastAutonomyUpload,
    lastInputDevice,
    selectedAircraftCardId,
    selectedScenarioId,
    sensorViewportModality,
    sensorViewportSource,
    showDebug,
  ]);

  return null;
}
