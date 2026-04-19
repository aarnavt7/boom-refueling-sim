"use client";

import { useEffect, useMemo, useState } from "react";

import { formatControllerStateLabel } from "@/components/hud/controllerPresentation";
import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import type { LiveSimState } from "@/lib/sim/types";
import {
  listRunSummaries,
  loadReplay,
  saveLocalRunSnapshot,
  type SavedRunSummary,
} from "@/lib/storage/simStorage";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type ReplayPanelProps = {
  state: LiveSimState;
};

export function ReplayPanel({ state }: ReplayPanelProps) {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRunSummary[]>([]);
  const [busyRunId, setBusyRunId] = useState<string | null>(null);
  const replaySamples = useSimStore((store) => store.replaySamples);
  const scenario = useSimStore((store) => store.scenario);
  const persistStatus = useSimStore((store) => store.persistStatus);
  const persistMessage = useSimStore((store) => store.persistMessage);
  const setPersistStatus = useSimStore((store) => store.setPersistStatus);
  const setScenarioById = useSimStore((store) => store.setScenarioById);
  const setReplaySamples = useSimStore((store) => store.setReplaySamples);
  const replayMode = useUiStore((store) => store.replayMode);
  const replayPlaying = useUiStore((store) => store.replayPlaying);
  const replayIndex = useUiStore((store) => store.replayIndex);
  const liveRunState = useUiStore((store) => store.liveRunState);
  const pauseLiveRun = useUiStore((store) => store.pauseLiveRun);
  const setScenarioId = useUiStore((store) => store.setScenarioId);
  const setReplayMode = useUiStore((store) => store.setReplayMode);
  const setReplayPlaying = useUiStore((store) => store.setReplayPlaying);
  const setReplayIndex = useUiStore((store) => store.setReplayIndex);

  useEffect(() => {
    setSavedRuns(listRunSummaries());
  }, []);

  useEffect(() => {
    if (persistStatus !== "saved" && persistStatus !== "error") {
      return;
    }

    setSavedRuns(listRunSummaries());
    setSaveMessage(persistMessage);
  }, [persistMessage, persistStatus]);

  const storageLabel = useMemo(() => {
    if (persistStatus === "idle") {
      return "Session only";
    }

    if (persistStatus === "saving") {
      return "Saving local";
    }

    if (persistStatus === "saved") {
      return "Saved local";
    }

    return "Storage error";
  }, [persistStatus]);

  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [],
  );

  async function saveRun() {
    setPersistStatus("saving", null);
    setSaveMessage(null);

    try {
      const result = await saveLocalRunSnapshot({
        scenario,
        state,
        replaySamples,
      });

      setSavedRuns(result.summaries);
      setPersistStatus("saved", result.message);
      setSaveMessage(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown persistence error";
      setPersistStatus("error", message);
      setSaveMessage(message);
    }
  }

  async function openSavedReplay(run: SavedRunSummary) {
    setBusyRunId(run.id);
    setPersistStatus("saving", null);
    setSaveMessage(null);

    try {
      const replay = await loadReplay(run.id);

      if (!replay || replay.length === 0) {
        throw new Error("Saved replay archive is unavailable.");
      }

      setScenarioId(run.scenarioId);
      setReplayMode(false);
      setReplayPlaying(false);
      setReplayIndex(0);
      if (liveRunState === "running") {
        pauseLiveRun();
      }
      setScenarioById(run.scenarioId);
      setReplaySamples(replay);
      setReplayMode(true);

      const message = `Loaded ${run.scenarioName} replay.`;
      setPersistStatus("saved", message);
      setSaveMessage(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load saved replay.";
      setPersistStatus("error", message);
      setSaveMessage(message);
    } finally {
      setBusyRunId(null);
    }
  }

  async function exportSavedRun(run: SavedRunSummary) {
    setBusyRunId(run.id);
    setSaveMessage(null);

    try {
      const replay = run.hasReplay ? await loadReplay(run.id) : null;
      const blob = new Blob(
        [
          JSON.stringify(
            {
              summary: run,
              replay,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `boom-run-${run.scenarioId}-${run.id.slice(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      const message = `Exported ${run.scenarioName} run JSON.`;
      setPersistStatus("saved", message);
      setSaveMessage(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to export run JSON.";
      setPersistStatus("error", message);
      setSaveMessage(message);
    } finally {
      setBusyRunId(null);
    }
  }

  return (
    <TacticalPanel
      data-tour="replay-panel"
      className="min-h-0 lg:h-full"
      scrollBody
      title="Replay"
      subtitle="Playback & local save"
      headerRight={
        <span className="font-sans text-[11px] tabular-nums text-[color:var(--hud-muted)]">
          {replaySamples.length} samples
        </span>
      }
    >
      <div className="flex flex-wrap gap-2 border-b border-[color:var(--hud-line)] px-3 py-2">
        <HudButton
          variant="primary"
          disabled={replaySamples.length === 0 || busyRunId !== null || persistStatus === "saving"}
          onClick={() => {
            const nextReplayMode = !replayMode;
            if (nextReplayMode && liveRunState === "running") {
              pauseLiveRun();
            }
            setReplayMode(nextReplayMode);
            setReplayPlaying(false);
          }}
        >
          {replayMode ? "Live" : "Replay"}
        </HudButton>
        <HudButton
          variant="ghost"
          disabled={
            !replayMode || replaySamples.length === 0 || busyRunId !== null || persistStatus === "saving"
          }
          onClick={() => setReplayPlaying(!replayPlaying)}
        >
          {replayPlaying ? "Pause" : "Play"}
        </HudButton>
        <HudButton
          data-tour="save-run-button"
          variant="ghost"
          disabled={replaySamples.length === 0 || busyRunId !== null || persistStatus === "saving"}
          onClick={saveRun}
        >
          Save run
        </HudButton>
      </div>

      <div data-tour="replay-slider" className="px-3 py-3">
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
        <div className="mt-2 flex items-center justify-between font-sans text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-muted)]">
          <span className="tabular-nums">Index {replayIndex}</span>
          <span>{storageLabel}</span>
        </div>
      </div>

      <div className="border-t border-[color:var(--hud-line)] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Recent runs
          </p>
          <span className="font-sans text-[11px] text-[color:var(--hud-muted)]">
            {savedRuns.length}
          </span>
        </div>

        {savedRuns.length === 0 ? (
          <p className="mt-3 font-sans text-xs leading-relaxed text-[color:var(--hud-muted)]">
            No saved runs yet. Save a run to keep a local summary and an optional replay archive.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {savedRuns.map((run) => (
              <article
                key={run.id}
                className="overflow-hidden rounded-[var(--hud-radius-control)] border border-[color:var(--hud-line)] bg-black/15 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium text-[color:var(--hud-fg)]">
                      {run.scenarioName}
                    </p>
                    <p className="mt-1 font-sans text-[11px] text-[color:var(--hud-muted)]">
                      {timestampFormatter.format(new Date(run.completedAt))} · {formatControllerStateLabel(run.status)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-sans text-[10px] font-medium tracking-[0.02em] ${
                      run.hasReplay
                        ? "text-[color:var(--hud-ok)]"
                        : "text-[color:var(--hud-warn)]"
                    }`}
                  >
                    {run.hasReplay ? "Replay ready" : "Summary only"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[11px] text-[color:var(--hud-muted)]">
                  <span>Dock {run.summary.dockScore.toFixed(2)}</span>
                  <span>Err {run.summary.positionError.toFixed(2)} m</span>
                  <span>Conf {(run.summary.confidence * 100).toFixed(0)}%</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {run.hasReplay ? (
                    <HudButton
                      variant="primary"
                      disabled={busyRunId !== null}
                      onClick={() => openSavedReplay(run)}
                    >
                      {busyRunId === run.id ? "Loading..." : "Open replay"}
                    </HudButton>
                  ) : null}
                  <HudButton
                    variant="ghost"
                    disabled={busyRunId !== null}
                    onClick={() => exportSavedRun(run)}
                  >
                    {busyRunId === run.id ? "Working..." : "Export JSON"}
                  </HudButton>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {saveMessage ? (
        <p
          className={`border-t border-[color:var(--hud-line)] px-3 py-2 font-sans text-[11px] ${
            persistStatus === "error"
              ? "text-[color:var(--hud-danger-fg)]"
              : "text-[color:var(--hud-ok)]"
          }`}
        >
          {saveMessage}
        </p>
      ) : null}
    </TacticalPanel>
  );
}
