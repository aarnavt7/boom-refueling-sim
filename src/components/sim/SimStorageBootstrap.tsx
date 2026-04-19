"use client";

import { useEffect, useLayoutEffect, useState } from "react";

import { getScenarioById } from "@/lib/sim/scenarios";
import { loadUserPrefs, saveUserPrefs } from "@/lib/storage/simStorage";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export function SimStorageBootstrap() {
  const selectedScenarioId = useUiStore((state) => state.selectedScenarioId);
  const showDebug = useUiStore((state) => state.showDebug);
  const setScenarioId = useUiStore((state) => state.setScenarioId);
  const setShowDebug = useUiStore((state) => state.setShowDebug);
  const setScenarioById = useSimStore((state) => state.setScenarioById);
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
    }

    setHydrated(true);
  }, [setScenarioById, setScenarioId, setShowDebug]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      saveUserPrefs({
        selectedScenarioId: getScenarioById(selectedScenarioId).id,
        showDebug,
      });
    } catch {
      // Ignore storage write failures; the sim should keep running even in restricted browsers.
    }
  }, [hydrated, selectedScenarioId, showDebug]);

  return null;
}
