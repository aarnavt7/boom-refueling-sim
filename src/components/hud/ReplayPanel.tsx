"use client";

import { useState } from "react";

import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import type { LiveSimState } from "@/lib/sim/types";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type ReplayPanelProps = {
  state: LiveSimState;
};

export function ReplayPanel({ state }: ReplayPanelProps) {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const replaySamples = useSimStore((store) => store.replaySamples);
  const scenario = useSimStore((store) => store.scenario);
  const persistStatus = useSimStore((store) => store.persistStatus);
  const setPersistStatus = useSimStore((store) => store.setPersistStatus);
  const replayMode = useUiStore((store) => store.replayMode);
  const replayPlaying = useUiStore((store) => store.replayPlaying);
  const replayIndex = useUiStore((store) => store.replayIndex);
  const setReplayMode = useUiStore((store) => store.setReplayMode);
  const setReplayPlaying = useUiStore((store) => store.setReplayPlaying);
  const setReplayIndex = useUiStore((store) => store.setReplayIndex);

  async function saveRun() {
    setPersistStatus("saving", null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scenarioId: scenario.id,
          status: state.controllerState,
          durationSec: Number(state.simTime.toFixed(2)),
          replayLength: replaySamples.length,
          summary: {
            positionError: state.metrics.positionError,
            dockScore: state.metrics.dockScore,
            confidence: state.metrics.confidence,
            abortReason: state.abortReason,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to persist run");
      }

      const payload = (await response.json()) as { mode: string };
      setPersistStatus("saved", payload.mode);
      setSaveMessage(`Stored (${payload.mode})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown persistence error";
      setPersistStatus("error", message);
      setSaveMessage(message);
    }
  }

  return (
    <TacticalPanel
      title="Replay"
      subtitle="Playback & save"
      headerRight={
        <span className="font-mono text-[11px] tabular-nums text-[color:var(--hud-muted)]">
          {replaySamples.length} smp
        </span>
      }
    >
      <div className="flex flex-wrap gap-2 border-b border-[color:var(--hud-line)] px-3 py-2">
        <HudButton
          variant="primary"
          disabled={replaySamples.length === 0}
          onClick={() => {
            setReplayMode(!replayMode);
            setReplayPlaying(false);
          }}
        >
          {replayMode ? "Live" : "Replay"}
        </HudButton>
        <HudButton
          variant="ghost"
          disabled={!replayMode || replaySamples.length === 0}
          onClick={() => setReplayPlaying(!replayPlaying)}
        >
          {replayPlaying ? "Pause" : "Play"}
        </HudButton>
        <HudButton variant="ghost" disabled={replaySamples.length === 0} onClick={saveRun}>
          Save run
        </HudButton>
      </div>

      <div className="px-3 py-3">
        <input
          type="range"
          min={0}
          max={Math.max(replaySamples.length - 1, 0)}
          step={1}
          value={replayIndex}
          disabled={!replayMode || replaySamples.length === 0}
          onChange={(event) => setReplayIndex(Number(event.target.value))}
          className="tactical-range"
        />
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-[color:var(--hud-muted)]">
          <span className="tabular-nums">Idx {replayIndex}</span>
          <span>{persistStatus === "idle" ? "Volatile" : persistStatus}</span>
        </div>
      </div>

      {saveMessage ? (
        <p className="border-t border-[color:var(--hud-line)] px-3 py-2 font-mono text-[11px] text-[color:var(--hud-ok)]">
          {saveMessage}
        </p>
      ) : null}
    </TacticalPanel>
  );
}
