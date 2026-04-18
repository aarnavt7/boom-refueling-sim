"use client";

import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import { scenarioPresets } from "@/lib/sim/scenarios";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export function ScenarioPanel() {
  const selectedScenarioId = useUiStore((state) => state.selectedScenarioId);
  const showDebug = useUiStore((state) => state.showDebug);
  const setScenarioId = useUiStore((state) => state.setScenarioId);
  const toggleDebug = useUiStore((state) => state.toggleDebug);
  const setReplayMode = useUiStore((state) => state.setReplayMode);
  const setReplayPlaying = useUiStore((state) => state.setReplayPlaying);
  const setReplayIndex = useUiStore((state) => state.setReplayIndex);
  const setScenarioById = useSimStore((state) => state.setScenarioById);
  const resetScenario = useSimStore((state) => state.resetScenario);

  const selectedScenario =
    scenarioPresets.find((scenario) => scenario.id === selectedScenarioId) ?? scenarioPresets[0];

  return (
    <TacticalPanel title="Scenario" subtitle={`${selectedScenario.name} · motion preset`}>
      <p className="border-b border-[color:var(--hud-line)] px-3 py-2 font-sans text-xs leading-relaxed text-[color:var(--hud-muted)]">
        {selectedScenario.description}
      </p>

      <div className="px-3 py-2">
        <label className="block font-mono text-[11px] uppercase tracking-[0.1em] text-[color:var(--hud-muted)]">
          Preset
        </label>
        <select
          className="tactical-select mt-1.5"
          value={selectedScenarioId}
          onChange={(event) => {
            const nextId = event.target.value;
            setScenarioId(nextId);
            setReplayMode(false);
            setReplayPlaying(false);
            setReplayIndex(0);
            setScenarioById(nextId);
          }}
        >
          {scenarioPresets.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-[color:var(--hud-line)] px-3 py-2">
        <HudButton
          variant="primary"
          onClick={() => {
            setReplayMode(false);
            setReplayPlaying(false);
            setReplayIndex(0);
            resetScenario(selectedScenarioId);
          }}
        >
          Reset
        </HudButton>
        <HudButton variant="ghost" onClick={toggleDebug}>
          {showDebug ? "Debug off" : "Debug on"}
        </HudButton>
      </div>
    </TacticalPanel>
  );
}
