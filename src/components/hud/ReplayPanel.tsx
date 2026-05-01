"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import {
  listRunSummaries,
  loadReplay,
  saveLocalRunSnapshot,
  type SavedRunSummary,
} from "@/lib/storage/simStorage";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

export function ReplayPanel({
  className = "min-h-0 lg:h-full",
  bodyClassName = "",
  scrollBody = true,
  headerActions,
  panelDragHandle,
}: {
  className?: string;
  bodyClassName?: string;
  scrollBody?: boolean;
  headerActions?: ReactNode;
  panelDragHandle?: ReactNode;
}) {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRunSummary[]>([]);
  const [busyRunId, setBusyRunId] = useState<string | null>(null);
  const replaySamples = useSimStore((store) => store.replaySamples);
  const scenario = useSimStore((store) => store.scenario);
  const live = useSimStore((store) => store.live);
  const autonomyEvaluation = useSimStore((store) => store.autonomyEvaluation);
  const persistStatus = useSimStore((store) => store.persistStatus);
  const persistMessage = useSimStore((store) => store.persistMessage);
  const setPersistStatus = useSimStore((store) => store.setPersistStatus);
  const setScenarioById = useSimStore((store) => store.setScenarioById);
  const setReplaySamples = useSimStore((store) => store.setReplaySamples);
  const replayMode = useUiStore((store) => store.replayMode);
  const replayDataSource = useUiStore((store) => store.replayDataSource);
  const evaluationView = useUiStore((store) => store.evaluationView);
  const replayPlaying = useUiStore((store) => store.replayPlaying);
  const replayIndex = useUiStore((store) => store.replayIndex);
  const liveRunState = useUiStore((store) => store.liveRunState);
  const pauseLiveRun = useUiStore((store) => store.pauseLiveRun);
  const setScenarioId = useUiStore((store) => store.setScenarioId);
  const setReplayMode = useUiStore((store) => store.setReplayMode);
  const setReplayDataSource = useUiStore((store) => store.setReplayDataSource);
  const setEvaluationView = useUiStore((store) => store.setEvaluationView);
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

  const activeReplayLength =
    replayDataSource === "autonomy" && autonomyEvaluation
      ? Math.max(
          autonomyEvaluation.baselineReplaySamples.length,
          autonomyEvaluation.uploadedReplaySamples.length,
        )
      : replaySamples.length;
  const hasAnyReplayData =
    replaySamples.length > 0 ||
    (autonomyEvaluation !== null &&
      (autonomyEvaluation.baselineReplaySamples.length > 0 ||
        autonomyEvaluation.uploadedReplaySamples.length > 0));

  async function saveRun() {
    setPersistStatus("saving", null);
    setSaveMessage(null);

    try {
      const result = await saveLocalRunSnapshot({
        scenario,
        state: live,
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
      setReplayDataSource("session");
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
      link.download = `pathlight-run-${run.scenarioId}-${run.id.slice(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      const message = `Exported ${run.scenarioName} journey JSON.`;
      setPersistStatus("saved", message);
      setSaveMessage(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to export journey JSON.";
      setPersistStatus("error", message);
      setSaveMessage(message);
    } finally {
      setBusyRunId(null);
    }
  }

  const compareSummary = autonomyEvaluation?.report.summary ?? null;
  const compareNotes = autonomyEvaluation?.report.notes ?? [];

  return (
    <TacticalPanel
      data-tour="replay-panel"
      className={className}
      bodyClassName={bodyClassName}
      scrollBody={scrollBody}
      title="Replay"
      subtitle="Before / after comparison and local save"
      headerActions={headerActions}
      panelDragHandle={panelDragHandle}
      headerRight={
        <span className="font-sans text-[11px] tabular-nums text-[color:var(--hud-muted)]">
          {activeReplayLength} samples
        </span>
      }
    >
      <div className="flex flex-wrap gap-2 border-b border-[color:var(--hud-line)] px-3 py-2">
        <HudButton
          variant="primary"
          data-gamepad-focus-id="replay-toggle"
          data-gamepad-group="replay-primary"
          data-gamepad-label={replayMode ? "Return to live view" : "Open replay"}
          disabled={!hasAnyReplayData || busyRunId !== null || persistStatus === "saving"}
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
          data-gamepad-focus-id="replay-play"
          data-gamepad-group="replay-primary"
          data-gamepad-label={replayPlaying ? "Pause replay playback" : "Play replay playback"}
          disabled={!replayMode || activeReplayLength === 0 || busyRunId !== null || persistStatus === "saving"}
          onClick={() => setReplayPlaying(!replayPlaying)}
        >
          {replayPlaying ? "Pause" : "Play"}
        </HudButton>
        <HudButton
          data-tour="save-run-button"
          variant="ghost"
          data-gamepad-focus-id="replay-save"
          data-gamepad-group="replay-primary"
          data-gamepad-label="Save journey locally"
          disabled={replaySamples.length === 0 || busyRunId !== null || persistStatus === "saving"}
          onClick={saveRun}
        >
          Save journey
        </HudButton>
      </div>

      <div className="border-b border-[color:var(--hud-line)] px-3 py-2">
        <div className="flex flex-wrap gap-2">
          <HudButton
            variant={replayDataSource === "session" ? "primary" : "ghost"}
            data-gamepad-focus-id="replay-session-source"
            data-gamepad-group="replay-source"
            data-gamepad-label="Use journey replay"
            onClick={() => {
              setReplayDataSource("session");
              setReplayMode(replaySamples.length > 0);
              setReplayPlaying(false);
            }}
          >
            Journey replay
          </HudButton>
          <HudButton
            variant={replayDataSource === "autonomy" ? "primary" : "ghost"}
            data-gamepad-focus-id="replay-compare-source"
            data-gamepad-group="replay-source"
            data-gamepad-label="Use compare replay"
            disabled={!autonomyEvaluation}
            onClick={() => {
              if (!autonomyEvaluation) {
                return;
              }

              setReplayDataSource("autonomy");
              setReplayMode(true);
              setReplayPlaying(false);
            }}
          >
            Compare replay
          </HudButton>
        </div>

        {autonomyEvaluation ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {(["baseline", "uploaded", "overlay"] as const).map((view) => (
              <HudButton
                key={view}
                variant={evaluationView === view ? "primary" : "ghost"}
                data-gamepad-focus-id={`replay-view-${view}`}
                data-gamepad-group="replay-views"
                data-gamepad-label={`Set replay view to ${view}`}
                disabled={replayDataSource !== "autonomy"}
                onClick={() => setEvaluationView(view)}
              >
                {view === "baseline" ? "Baseline" : view === "uploaded" ? "Pathlight" : "Overlay"}
              </HudButton>
            ))}
          </div>
        ) : null}
      </div>

      <div data-tour="replay-slider" className="border-b border-[color:var(--hud-line)] px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Scrub samples
          </p>
          <span className="font-sans text-[11px] tabular-nums text-[color:var(--hud-muted)]">
            {activeReplayLength === 0 ? "0 / 0" : `${Math.min(replayIndex + 1, activeReplayLength)} / ${activeReplayLength}`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, activeReplayLength - 1)}
          value={Math.min(replayIndex, Math.max(0, activeReplayLength - 1))}
          disabled={activeReplayLength === 0}
          onChange={(event) => {
            setReplayPlaying(false);
            setReplayIndex(Number(event.target.value));
          }}
          className="mt-3 w-full accent-[color:var(--hud-accent)]"
        />
      </div>

      {compareSummary ? (
        <div className="border-b border-[color:var(--hud-line)] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
                Compare summary
              </p>
              <p className="mt-1 font-sans text-sm font-medium text-[color:var(--hud-fg)]">
                {compareSummary.outcomeLabel}
              </p>
            </div>
            <span className="rounded-full border border-[color:var(--hud-ok)]/45 px-2 py-1 font-sans text-[10px] font-medium text-[color:var(--hud-ok)]">
              Before vs after
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 font-sans text-[11px]">
            <div>
              <p className="text-[color:var(--hud-muted)]">Deviation reduction</p>
              <p className="mt-1 text-[color:var(--hud-fg)]">{compareSummary.meanDistanceOffset.toFixed(2)} m</p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Confidence</p>
              <p className="mt-1 text-[color:var(--hud-fg)]">{(compareSummary.averageConfidence * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Reroutes</p>
              <p className="mt-1 text-[color:var(--hud-fg)]">{compareSummary.safetyEventCount}</p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Correction load</p>
              <p className="mt-1 text-[color:var(--hud-fg)]">{compareSummary.oscillationScore.toFixed(0)}</p>
            </div>
          </div>
          {compareNotes.length > 0 ? (
            <p className="mt-3 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
              {compareNotes.join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="border-b border-[color:var(--hud-line)] px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Local storage
          </p>
          <span className="rounded-full border border-[color:var(--hud-line)] px-2 py-0.5 font-sans text-[10px] font-medium text-[color:var(--hud-muted)]">
            {storageLabel}
          </span>
        </div>
        <p className="mt-2 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
          {saveMessage ?? "Save strong journeys locally so you can replay them without re-running the live experience."}
        </p>
      </div>

      <div className="space-y-2 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
            Saved journeys
          </p>
          <span className="font-sans text-[11px] tabular-nums text-[color:var(--hud-muted)]">
            {savedRuns.length}
          </span>
        </div>

        {savedRuns.length === 0 ? (
          <p className="rounded-[18px] border border-dashed border-[color:var(--hud-line)] px-3 py-3 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
            No saved journeys yet. Record a strong before/after story, then save it here for judging demos.
          </p>
        ) : (
          savedRuns.map((run) => (
            <div key={run.id} className="rounded-[18px] border border-[color:var(--hud-line)] bg-black/15 px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-sans text-[13px] font-medium text-[color:var(--hud-fg)]">
                    {run.scenarioName}
                  </p>
                  <p className="mt-1 font-sans text-[11px] text-[color:var(--hud-muted)]">
                    {timestampFormatter.format(run.completedAt)} · {run.durationSec.toFixed(1)}s · {run.replayLength} samples
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--hud-line)] px-2 py-0.5 font-sans text-[10px] font-medium text-[color:var(--hud-muted)]">
                  {run.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 font-sans text-[10px] text-[color:var(--hud-muted)]">
                <span>Deviation {run.summary.deviationMeters.toFixed(2)} m</span>
                <span>Access {(run.summary.accessScore * 100).toFixed(0)}%</span>
                <span>Confidence {(run.summary.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <HudButton
                  variant="primary"
                  data-gamepad-focus-id={`saved-run-open-${run.id}`}
                  data-gamepad-group="saved-runs"
                  data-gamepad-label={`Open ${run.scenarioName} replay`}
                  disabled={busyRunId !== null}
                  onClick={() => void openSavedReplay(run)}
                >
                  Open replay
                </HudButton>
                <HudButton
                  variant="ghost"
                  data-gamepad-focus-id={`saved-run-export-${run.id}`}
                  data-gamepad-group="saved-runs"
                  data-gamepad-label={`Export ${run.scenarioName} replay`}
                  disabled={busyRunId !== null}
                  onClick={() => void exportSavedRun(run)}
                >
                  Export JSON
                </HudButton>
              </div>
            </div>
          ))
        )}
      </div>
    </TacticalPanel>
  );
}
