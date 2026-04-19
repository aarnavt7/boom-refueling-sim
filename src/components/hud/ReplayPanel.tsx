"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { formatControllerStateLabel } from "@/components/hud/controllerPresentation";
import { HudButton, TacticalPanel } from "@/components/hud/tactical-ui";
import { runAutonomyEvaluation } from "@/lib/sim/autonomyEvaluation";
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
  panelDragHandle,
}: {
  className?: string;
  panelDragHandle?: ReactNode;
}) {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRunSummary[]>([]);
  const [busyRunId, setBusyRunId] = useState<string | null>(null);
  const replaySamples = useSimStore((store) => store.replaySamples);
  const scenario = useSimStore((store) => store.scenario);
  const live = useSimStore((store) => store.live);
  const autonomyEvaluation = useSimStore((store) => store.autonomyEvaluation);
  const lastAutonomyUpload = useSimStore((store) => store.lastAutonomyUpload);
  const persistStatus = useSimStore((store) => store.persistStatus);
  const persistMessage = useSimStore((store) => store.persistMessage);
  const setPersistStatus = useSimStore((store) => store.setPersistStatus);
  const setAutonomyEvaluation = useSimStore((store) => store.setAutonomyEvaluation);
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

  async function runUploadEval() {
    if (!lastAutonomyUpload) {
      setPersistStatus("error", "Upload controller.js or mission.json first.");
      return;
    }

    setPersistStatus("saving", "Running uploaded autonomy evaluation...");
    setSaveMessage(null);
    setReplayPlaying(false);
    setReplayIndex(0);
    if (liveRunState === "running") {
      pauseLiveRun();
    }

    try {
      const result = await runAutonomyEvaluation({
        scenario,
        manifest: lastAutonomyUpload,
      });

      setAutonomyEvaluation(result);
      setReplayDataSource("autonomy");
      setEvaluationView("overlay");
      setReplayMode(true);
      setPersistStatus("saved", "Autonomy evaluation ready.");
      setSaveMessage("Autonomy evaluation ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to run uploaded evaluation.";
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
      className={className}
      scrollBody
      title="Replay"
      subtitle="Playback & local save"
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
          disabled={
            !replayMode || activeReplayLength === 0 || busyRunId !== null || persistStatus === "saving"
          }
          onClick={() => setReplayPlaying(!replayPlaying)}
        >
          {replayPlaying ? "Pause" : "Play"}
        </HudButton>
        <HudButton
          data-tour="save-run-button"
          variant="ghost"
          data-gamepad-focus-id="replay-save"
          data-gamepad-group="replay-primary"
          data-gamepad-label="Save run locally"
          disabled={replaySamples.length === 0 || busyRunId !== null || persistStatus === "saving"}
          onClick={saveRun}
        >
          Save run
        </HudButton>
        <HudButton
          variant="ghost"
          data-gamepad-focus-id="replay-upload-eval"
          data-gamepad-group="replay-primary"
          data-gamepad-label="Run uploaded autonomy evaluation"
          disabled={busyRunId !== null || persistStatus === "saving" || !lastAutonomyUpload}
          onClick={runUploadEval}
        >
          Run upload eval
        </HudButton>
      </div>

      <div className="border-b border-[color:var(--hud-line)] px-3 py-2">
        <div className="flex flex-wrap gap-2">
          <HudButton
            variant={replayDataSource === "session" ? "primary" : "ghost"}
            data-gamepad-focus-id="replay-session-source"
            data-gamepad-group="replay-source"
            data-gamepad-label="Use session replay"
            onClick={() => {
              setReplayDataSource("session");
              setReplayMode(replaySamples.length > 0);
              setReplayPlaying(false);
            }}
          >
            Session replay
          </HudButton>
          <HudButton
            variant={replayDataSource === "autonomy" ? "primary" : "ghost"}
            data-gamepad-focus-id="replay-autonomy-source"
            data-gamepad-group="replay-source"
            data-gamepad-label="Use autonomy replay"
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
            Autonomy replay
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
                {view === "baseline"
                  ? "Baseline"
                  : view === "uploaded"
                    ? "Uploaded"
                    : "Overlay"}
              </HudButton>
            ))}
          </div>
        ) : null}
      </div>

      <div data-tour="replay-slider" className="px-3 py-3">
        <div className="flex items-center gap-2">
          <HudButton
            variant="ghost"
            data-gamepad-focus-id="replay-step-previous"
            data-gamepad-group="replay-scrub"
            data-gamepad-label="Step replay backward"
            disabled={!replayMode || activeReplayLength === 0 || replayIndex <= 0}
            onClick={() => setReplayIndex(Math.max(0, replayIndex - 1))}
          >
            Prev
          </HudButton>
          <input
            data-gamepad-focus-id="replay-slider"
            data-gamepad-group="replay-scrub"
            data-gamepad-label="Replay timeline scrubber"
            type="range"
            min={0}
            max={Math.max(activeReplayLength - 1, 0)}
            step={1}
            value={replayIndex}
            disabled={!replayMode || activeReplayLength === 0}
            onChange={(event) => setReplayIndex(Number(event.target.value))}
            className="tactical-range flex-1"
          />
          <HudButton
            variant="ghost"
            data-gamepad-focus-id="replay-step-next"
            data-gamepad-group="replay-scrub"
            data-gamepad-label="Step replay forward"
            disabled={!replayMode || activeReplayLength === 0 || replayIndex >= Math.max(activeReplayLength - 1, 0)}
            onClick={() => setReplayIndex(Math.min(Math.max(activeReplayLength - 1, 0), replayIndex + 1))}
          >
            Next
          </HudButton>
        </div>
        <div className="mt-2 flex items-center justify-between font-sans text-[11px] font-medium tracking-[0.02em] text-[color:var(--hud-muted)]">
          <span className="tabular-nums">Index {replayIndex}</span>
          <span>{storageLabel}</span>
        </div>
      </div>

      <div className="border-t border-[color:var(--hud-line)] px-3 py-3">
        <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
          Upload status
        </p>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-[color:var(--hud-fg)]">
          {lastAutonomyUpload?.controllerName ?? "No controller.js loaded"}
          {lastAutonomyUpload?.missionName ? ` · ${lastAutonomyUpload.missionName}` : ""}
        </p>
        <p className="mt-1 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
          {autonomyEvaluation
            ? `${autonomyEvaluation.report.summary.outcomeLabel} · avg offset ${autonomyEvaluation.report.summary.meanDistanceOffset.toFixed(3)} m`
            : "Run the uploaded evaluation to generate overlay playback and analytics."}
        </p>
      </div>

      {autonomyEvaluation ? (
        <div className="border-t border-[color:var(--hud-line)] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-sans text-[11px] font-medium tracking-[0.03em] text-[color:var(--hud-muted)]">
              Debrief analytics
            </p>
            <span
              className={`font-sans text-[11px] font-medium ${
                autonomyEvaluation.report.summary.success
                  ? "text-[color:var(--hud-ok)]"
                  : "text-[color:var(--hud-warn)]"
              }`}
            >
              {autonomyEvaluation.report.summary.outcomeLabel}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-sans text-[11px]">
            <div>
              <p className="text-[color:var(--hud-muted)]">Time to dock</p>
              <p className="text-[color:var(--hud-fg)]">
                {autonomyEvaluation.report.summary.timeToDock === null
                  ? "No dock"
                  : `${autonomyEvaluation.report.summary.timeToDock.toFixed(2)} s`}
              </p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Mean distance offset</p>
              <p className="text-[color:var(--hud-fg)]">
                {autonomyEvaluation.report.summary.meanDistanceOffset.toFixed(3)} m
              </p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">P95 lateral / vertical</p>
              <p className="text-[color:var(--hud-fg)]">
                {autonomyEvaluation.report.summary.p95LateralOffset.toFixed(3)} /{" "}
                {autonomyEvaluation.report.summary.p95VerticalOffset.toFixed(3)} m
              </p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Mean / max closure</p>
              <p className="text-[color:var(--hud-fg)]">
                {autonomyEvaluation.report.summary.meanClosureRate.toFixed(3)} /{" "}
                {autonomyEvaluation.report.summary.maxClosureRate.toFixed(3)} m/s
              </p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Miss distance</p>
              <p className="text-[color:var(--hud-fg)]">
                {autonomyEvaluation.report.summary.missDistance.toFixed(3)} m
              </p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Envelope / confidence</p>
              <p className="text-[color:var(--hud-fg)]">
                {autonomyEvaluation.report.summary.timeInEnvelope.toFixed(2)} s /{" "}
                {(autonomyEvaluation.report.summary.averageConfidence * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Dropout rate</p>
              <p className="text-[color:var(--hud-fg)]">
                {(autonomyEvaluation.report.summary.dropoutRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[color:var(--hud-muted)]">Safety / oscillation</p>
              <p className="text-[color:var(--hud-fg)]">
                {autonomyEvaluation.report.summary.safetyEventCount} /{" "}
                {autonomyEvaluation.report.summary.oscillationScore.toFixed(3)}
              </p>
            </div>
          </div>
          {autonomyEvaluation.report.notes.length > 0 ? (
            <p className="mt-3 font-sans text-[11px] leading-relaxed text-[color:var(--hud-muted)]">
              {autonomyEvaluation.report.notes.join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}

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
                      data-gamepad-focus-id={`saved-run-open-${run.id}`}
                      data-gamepad-group="saved-runs"
                      data-gamepad-label={`Open replay for ${run.scenarioName}`}
                      disabled={busyRunId !== null}
                      onClick={() => openSavedReplay(run)}
                    >
                      {busyRunId === run.id ? "Loading..." : "Open replay"}
                    </HudButton>
                  ) : null}
                  <HudButton
                    variant="ghost"
                    data-gamepad-focus-id={`saved-run-export-${run.id}`}
                    data-gamepad-group="saved-runs"
                    data-gamepad-label={`Export JSON for ${run.scenarioName}`}
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
