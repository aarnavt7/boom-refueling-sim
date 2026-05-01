"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MissionCoachCard } from "@/components/onboarding/MissionCoachCard";
import { MissionPauseOverlay } from "@/components/onboarding/MissionPauseOverlay";
import { ReplayCoachStrip } from "@/components/onboarding/ReplayCoachStrip";
import { useOnboardingPresentation } from "@/lib/onboarding/useOnboardingPresentation";
import { saveLocalRunSnapshot } from "@/lib/storage/simStorage";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useSimStore } from "@/lib/store/simStore";
import { useUiStore } from "@/lib/store/uiStore";

type PauseOverlayState = {
  selector: string | null;
  title: string;
  body: string;
  progressLabel: string;
  tone?: "default" | "success";
};

type ReadyState = {
  title: string;
  body: string;
  tone: "default" | "success" | "warn";
};

const MISSION_FAILURE_MESSAGE =
  "The guided walkthrough did not complete cleanly, but the journey is reset and ready for another try.";

const TARGETS = {
  mainViewport: '[data-tour="main-viewport"]',
  guidancePanel: '[data-tour="guidance-panel"]',
  sensorFeed: '[data-tour="sensor-feed"]',
  replaySlider: '[data-tour="replay-slider"]',
  saveRunButton: '[data-tour="save-run-button"]',
} as const;

function getReplayMilestones(length: number, samples: ReturnType<typeof useSimStore.getState>["replaySamples"]) {
  if (length === 0) {
    return {
      track: 0,
      align: 0,
      dock: 0,
    };
  }

  const track =
    samples.findIndex(
      (sample) =>
        sample.controllerState === "ACQUIRE" || sample.controllerState === "TRACK",
    ) ?? 0;
  const align = samples.findIndex((sample) => sample.controllerState === "ALIGN");
  let dock = samples.length - 1;

  for (let index = samples.length - 1; index >= 0; index -= 1) {
    if (samples[index]?.controllerState === "MATED") {
      dock = index;
      break;
    }
  }

  return {
    track: track >= 0 ? track : 0,
    align: align >= 0 ? align : Math.max(0, Math.floor(length * 0.55)),
    dock,
  };
}

function getMissionCardCopy(stage: string, isRetrying: boolean): ReadyState | null {
  if (stage === "transition") {
    return {
      title: "Now watch one clean journey from entry to arrival.",
      body: "The walkthrough will start one guided trip for you and pause at a few meaningful moments so the route story stays easy to follow.",
      tone: "default",
    };
  }

  if (stage === "search") {
    return {
      title: isRetrying ? "Resetting for one cleaner attempt." : "Pathlight is locating the clearest starting route.",
      body: isRetrying
        ? "The first journey did not settle cleanly, so the sim is resetting once and starting the guided walkthrough again."
        : "Right now it is identifying nearby landmarks, checking the corridor layout, and preparing the first guidance cues.",
      tone: "default",
    };
  }

  if (stage === "acquire-track") {
    return {
      title: "The route plan is stabilizing.",
      body: "The assistive preview and phase strip matter most here. The journey is moving from locating the space to confidently guiding the traveler.",
      tone: "default",
    };
  }

  if (stage === "align") {
    return {
      title: "Guidance is centering on the best corridor.",
      body: "This is the clean handoff into active wayfinding. The trip guidance panel and main view are the fastest way to read what is happening.",
      tone: "default",
    };
  }

  if (stage === "insert") {
    return {
      title: "Pathlight is correcting in stride.",
      body: "The route engine is making smaller corrections now, so the journey should feel calmer than it did at the first decision point.",
      tone: "default",
    };
  }

  return null;
}

function getMissionProgressLabel(stage: string) {
  if (stage === "search") {
    return "1 of 5";
  }

  if (stage === "acquire-track") {
    return "2 of 5";
  }

  if (stage === "align") {
    return "3 of 5";
  }

  if (stage === "insert") {
    return "4 of 5";
  }

  if (stage === "dock") {
    return "5 of 5";
  }

  return "Guided journey";
}

export function GuidedRunDirector() {
  const {
    isCompact,
    animatedReplayEnabled,
  } = useOnboardingPresentation();
  const hasHydrated = useOnboardingStore((state) => state.hasHydrated);
  const status = useOnboardingStore((state) => state.status);
  const isDismissed = useOnboardingStore((state) => state.isDismissed);
  const guidedRunStage = useOnboardingStore((state) => state.guidedRunStage);
  const hasCompletedGuidedRun = useOnboardingStore((state) => state.hasCompletedGuidedRun);
  const hasCompletedReplayDebrief = useOnboardingStore(
    (state) => state.hasCompletedReplayDebrief,
  );
  const autoSavedRunId = useOnboardingStore((state) => state.autoSavedRunId);
  const hasConsumedFirstPhase3Autostart = useOnboardingStore(
    (state) => state.hasConsumedFirstPhase3Autostart,
  );
  const startGuidedRun = useOnboardingStore((state) => state.startGuidedRun);
  const setGuidedRunStage = useOnboardingStore((state) => state.setGuidedRunStage);
  const beginReplayDebrief = useOnboardingStore((state) => state.beginReplayDebrief);
  const completeReplayDebrief = useOnboardingStore((state) => state.completeReplayDebrief);
  const recordAutoSavedRun = useOnboardingStore((state) => state.recordAutoSavedRun);
  const completePhase3 = useOnboardingStore((state) => state.completePhase3);
  const skipOnboarding = useOnboardingStore((state) => state.skipOnboarding);
  const openPanel = useOnboardingStore((state) => state.openPanel);
  const setStatus = useOnboardingStore((state) => state.setStatus);
  const setAllowOrbitControls = useOnboardingStore((state) => state.setAllowOrbitControls);

  const scenario = useSimStore((state) => state.scenario);
  const live = useSimStore((state) => state.live);
  const replaySamples = useSimStore((state) => state.replaySamples);
  const resetScenario = useSimStore((state) => state.resetScenario);
  const setPersistStatus = useSimStore((state) => state.setPersistStatus);

  const setScenarioId = useUiStore((state) => state.setScenarioId);
  const setShowDebug = useUiStore((state) => state.setShowDebug);
  const setReplayMode = useUiStore((state) => state.setReplayMode);
  const setReplayPlaying = useUiStore((state) => state.setReplayPlaying);
  const setReplayIndex = useUiStore((state) => state.setReplayIndex);
  const startLiveRun = useUiStore((state) => state.startLiveRun);
  const pauseLiveRun = useUiStore((state) => state.pauseLiveRun);
  const stopLiveRun = useUiStore((state) => state.stopLiveRun);
  const clearManualAbort = useUiStore((state) => state.clearManualAbort);
  const setSimFrozen = useUiStore((state) => state.setSimFrozen);

  const [pauseOverlay, setPauseOverlay] = useState<PauseOverlayState | null>(null);
  const [readyState, setReadyState] = useState<ReadyState | null>(null);
  const retryCountRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);
  const liveRef = useRef(live);
  const replaySamplesRef = useRef(replaySamples);
  const scenarioRef = useRef(scenario);
  const autoSavedRunIdRef = useRef(autoSavedRunId);
  const hasCompletedReplayDebriefRef = useRef(hasCompletedReplayDebrief);

  const isMissionActive =
    hasHydrated &&
    !isDismissed &&
    (status === "guided-run" || status === "replay-debrief") &&
    guidedRunStage !== null;

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  useEffect(() => {
    replaySamplesRef.current = replaySamples;
  }, [replaySamples]);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  useEffect(() => {
    autoSavedRunIdRef.current = autoSavedRunId;
  }, [autoSavedRunId]);

  useEffect(() => {
    hasCompletedReplayDebriefRef.current = hasCompletedReplayDebrief;
  }, [hasCompletedReplayDebrief]);

  useEffect(() => {
    if (
      !hasHydrated ||
      isDismissed ||
      status !== "guided-run" ||
      guidedRunStage !== null ||
      hasCompletedGuidedRun ||
      hasCompletedReplayDebrief ||
      hasConsumedFirstPhase3Autostart
    ) {
      return;
    }

    startGuidedRun();
  }, [
    guidedRunStage,
    hasCompletedGuidedRun,
    hasCompletedReplayDebrief,
    hasConsumedFirstPhase3Autostart,
    hasHydrated,
    isDismissed,
    startGuidedRun,
    status,
  ]);

  useEffect(() => {
    if (!isMissionActive) {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
      setPauseOverlay(null);
      setSimFrozen(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setReplayPlaying(false);
      setSimFrozen(false);
      pauseLiveRun();
      skipOnboarding();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMissionActive, pauseLiveRun, setReplayPlaying, setSimFrozen, skipOnboarding]);

  useEffect(() => {
    if (!isMissionActive || !guidedRunStage) {
      return;
    }

    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
    setPauseOverlay(null);

    const schedule = (fn: () => void | Promise<void>, delayMs: number) => {
      const timeoutId = window.setTimeout(fn, delayMs);
      timeoutsRef.current.push(timeoutId);
      return timeoutId;
    };

    if (status === "guided-run") {
      if (guidedRunStage === "transition") {
        setSimFrozen(true);
        setAllowOrbitControls(false);
        schedule(() => {
          setGuidedRunStage("mission-setup");
        }, 1200);
      }

      if (guidedRunStage === "mission-setup") {
        setReadyState(null);
        setSimFrozen(false);
        setAllowOrbitControls(false);
        setScenarioId("steady-approach");
        stopLiveRun();
        resetScenario("steady-approach");
        setReplayMode(false);
        setReplayPlaying(false);
        setReplayIndex(0);
        setShowDebug(false);
        clearManualAbort();
        startLiveRun();
        schedule(() => {
          setGuidedRunStage("search");
        }, 380);
      }

      if (guidedRunStage === "search") {
        setSimFrozen(false);
        setAllowOrbitControls(true);
      }

      if (guidedRunStage === "acquire-track") {
        setPauseOverlay({
          selector: TARGETS.sensorFeed,
          title: "The route is locked in.",
          body: "This is the moment the system has enough confidence to move from locating the environment to guiding the traveler.",
          progressLabel: "2 of 5",
        });
        setSimFrozen(true);
        setAllowOrbitControls(false);
        schedule(() => {
          setPauseOverlay(null);
          setSimFrozen(false);
          setAllowOrbitControls(true);
        }, 1000);
      }

      if (guidedRunStage === "align") {
        setPauseOverlay({
          selector: isCompact ? TARGETS.guidancePanel : TARGETS.mainViewport,
          title: "Guidance is clean.",
          body: "Now the trip guidance panel and main view explain the route faster than raw metrics.",
          progressLabel: "3 of 5",
        });
        setSimFrozen(true);
        setAllowOrbitControls(false);
        schedule(() => {
          setPauseOverlay(null);
          setSimFrozen(false);
          setAllowOrbitControls(true);
        }, 1000);
      }

      if (guidedRunStage === "insert") {
        setSimFrozen(false);
        setAllowOrbitControls(true);
      }

      if (guidedRunStage === "dock") {
        setPauseOverlay({
          selector: TARGETS.guidancePanel,
          title: "Arrived",
          body: "The route has reached a clean arrival state. Replay and save are what matter next.",
          progressLabel: "5 of 5",
          tone: "success",
        });
        setSimFrozen(true);
        setAllowOrbitControls(false);
        schedule(() => {
          setPauseOverlay(null);
          setSimFrozen(false);
          beginReplayDebrief();
        }, 1200);
      }
    }

    if (status === "replay-debrief") {
      const samples = replaySamplesRef.current;
      const milestones = getReplayMilestones(samples.length, samples);

      if (guidedRunStage === "replay-intro") {
        setSimFrozen(false);
        setAllowOrbitControls(false);
        pauseLiveRun();
        setReplayMode(true);
        setReplayPlaying(false);
        setReplayIndex(milestones.track);
        schedule(() => {
          setGuidedRunStage("replay-demo");
        }, 900);
      }

      if (guidedRunStage === "replay-demo") {
        setSimFrozen(false);
        setAllowOrbitControls(false);
        pauseLiveRun();
        setReplayMode(true);
        setReplayPlaying(false);

        if (samples.length > 0) {
          const replaySequence = animatedReplayEnabled
            ? [milestones.track, milestones.align, milestones.dock]
            : [milestones.track, milestones.dock];
          const stepDuration = animatedReplayEnabled ? 1100 : 550;

          replaySequence.forEach((index, sequenceIndex) => {
            schedule(() => {
              setReplayIndex(index);
            }, sequenceIndex * stepDuration);
          });

          schedule(() => {
            setGuidedRunStage("save-handoff");
          }, replaySequence.length * stepDuration + 150);
        } else {
          schedule(() => {
            setGuidedRunStage("save-handoff");
          }, 350);
        }
      }

      if (guidedRunStage === "save-handoff") {
        const shouldAutoSave =
          !hasCompletedReplayDebriefRef.current && autoSavedRunIdRef.current === null;

        setSimFrozen(false);
        setAllowOrbitControls(false);
        pauseLiveRun();
        setReplayMode(true);
        setReplayPlaying(false);

        schedule(async () => {
          if (!shouldAutoSave) {
            setReadyState({
              title: "You’re ready to explore.",
              body: "Replay is set up and save-run stays available here whenever you want to keep another journey locally.",
              tone: "default",
            });
            setGuidedRunStage("ready");
            return;
          }

          setPersistStatus("saving", null);

          try {
            const result = await saveLocalRunSnapshot({
              scenario: scenarioRef.current,
              state: liveRef.current,
              replaySamples: replaySamplesRef.current,
            });

            recordAutoSavedRun(result.runId);
            setPersistStatus("saved", "Saved locally. You can reopen this journey anytime.");
            setReadyState({
              title: "You’re ready to explore.",
              body: "Saved locally. You can reopen this journey anytime, then use Start in the setup rail whenever you want another live route.",
              tone: "success",
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unable to save the guided journey locally.";
            setPersistStatus("error", message);
            setReadyState({
              title: "You’re ready to explore.",
              body: "The replay walkthrough still completed cleanly, but local save did not finish this time. The save control stays available whenever you want to try again.",
              tone: "warn",
            });
          }

          setGuidedRunStage("ready");
        }, 220);
      }

      if (guidedRunStage === "ready") {
        setSimFrozen(false);
        setAllowOrbitControls(false);
        pauseLiveRun();
        setReplayMode(true);
        setReplayPlaying(false);
      }
    }

    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, [
    animatedReplayEnabled,
    beginReplayDebrief,
    clearManualAbort,
    guidedRunStage,
    isCompact,
    isMissionActive,
    recordAutoSavedRun,
    resetScenario,
    setAllowOrbitControls,
    setGuidedRunStage,
    setPersistStatus,
    setReplayIndex,
    setReplayMode,
    setReplayPlaying,
    setScenarioId,
    setShowDebug,
    setSimFrozen,
    pauseLiveRun,
    startLiveRun,
    stopLiveRun,
    status,
  ]);

  useEffect(() => {
    if (!isMissionActive || status !== "guided-run" || guidedRunStage !== "search") {
      return;
    }

    const isMatched = live.controllerState === "ACQUIRE" || live.controllerState === "TRACK";
    if (!isMatched) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGuidedRunStage("acquire-track");
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [guidedRunStage, isMissionActive, live.controllerState, setGuidedRunStage, status]);

  useEffect(() => {
    if (!isMissionActive || status !== "guided-run" || guidedRunStage !== "acquire-track") {
      return;
    }

    if (live.controllerState !== "ALIGN") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGuidedRunStage("align");
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [guidedRunStage, isMissionActive, live.controllerState, setGuidedRunStage, status]);

  useEffect(() => {
    if (!isMissionActive || status !== "guided-run" || guidedRunStage !== "align") {
      return;
    }

    if (live.controllerState !== "INSERT") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGuidedRunStage("insert");
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [guidedRunStage, isMissionActive, live.controllerState, setGuidedRunStage, status]);

  useEffect(() => {
    if (!isMissionActive || status !== "guided-run" || guidedRunStage !== "insert") {
      return;
    }

    if (live.controllerState !== "MATED") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGuidedRunStage("dock");
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [guidedRunStage, isMissionActive, live.controllerState, setGuidedRunStage, status]);

  useEffect(() => {
    if (
      !isMissionActive ||
      status !== "guided-run" ||
      !guidedRunStage ||
      guidedRunStage === "transition" ||
      guidedRunStage === "mission-setup" ||
      guidedRunStage === "dock" ||
      guidedRunStage === "ready"
    ) {
      return;
    }

    const hasFailed =
      live.controllerState === "ABORT" ||
      live.controllerState === "BREAKAWAY" ||
      live.simTime > 95;

    if (!hasFailed) {
      return;
    }

    if (retryCountRef.current < 1) {
      retryCountRef.current += 1;
      setPersistStatus("saved", "Resetting for one cleaner attempt.");
      setGuidedRunStage("mission-setup");
      return;
    }

    setReadyState({
      title: "The guided walkthrough did not finish cleanly.",
      body: MISSION_FAILURE_MESSAGE,
      tone: "warn",
    });
    setReplayPlaying(false);
    setReplayMode(false);
    setSimFrozen(true);
    setAllowOrbitControls(false);
    setGuidedRunStage("ready");
  }, [
    guidedRunStage,
    isMissionActive,
    live.controllerState,
    live.simTime,
    pauseLiveRun,
    setAllowOrbitControls,
    setGuidedRunStage,
    setPersistStatus,
    setReplayMode,
    setReplayPlaying,
    startLiveRun,
    setSimFrozen,
    stopLiveRun,
    status,
  ]);

  const missionCard = useMemo<ReadyState | null>(() => {
    if (!isMissionActive || !guidedRunStage) {
      return null;
    }

    if (guidedRunStage === "ready") {
      return readyState ?? {
        title: "You’re ready to explore.",
        body:
          autoSavedRunId !== null
            ? "Saved locally. You can reopen this journey anytime, then use Start in the setup rail whenever you want another live route."
            : "The guided walkthrough is complete. Replay and save-run stay available from the right rail, and Start launches another fresh journey whenever you want one.",
        tone: autoSavedRunId !== null ? "success" : "default",
      };
    }

    if (status !== "guided-run") {
      return null;
    }

    return getMissionCardCopy(guidedRunStage, retryCountRef.current > 0);
  }, [autoSavedRunId, guidedRunStage, isMissionActive, readyState, status]);

  const missionCardProgress = useMemo(() => {
    if (!guidedRunStage) {
      return "Guided journey";
    }

    if (guidedRunStage === "ready") {
      return readyState?.tone === "warn" ? "Journey reset" : "Journey complete";
    }

    return getMissionProgressLabel(guidedRunStage);
  }, [guidedRunStage, readyState?.tone]);

  const replayStrip = useMemo(() => {
    if (!isMissionActive || status !== "replay-debrief" || !guidedRunStage) {
      return null;
    }

    if (guidedRunStage === "replay-intro") {
      return {
        selector: TARGETS.replaySlider,
        title: "Replay picks up at the first confident route.",
        body: "This is the fastest way to revisit the journey without rerunning the whole scene.",
        progressLabel: "Replay 1 of 3",
        tone: "default" as const,
      };
    }

    if (guidedRunStage === "replay-demo") {
      return {
        selector: TARGETS.replaySlider,
        title: "The strip is stepping through the key route beats.",
        body: "You can scrub this same timeline manually any time you want a slower read.",
        progressLabel: "Replay 2 of 3",
        tone: "default" as const,
      };
    }

    if (guidedRunStage === "save-handoff") {
      return {
        selector: TARGETS.saveRunButton,
        title:
          !hasCompletedReplayDebrief && autoSavedRunId === null
            ? "Saving one clean first journey."
            : "Save-run stays here for later.",
        body:
          !hasCompletedReplayDebrief && autoSavedRunId === null
            ? "The walkthrough saves a single local journey on the first pass so you have something to reopen right away."
            : "Because this is a review step, saving is optional. Use it whenever you want to keep another local snapshot.",
        progressLabel: "Replay 3 of 3",
        tone:
          !hasCompletedReplayDebrief && autoSavedRunId === null ? ("default" as const) : ("warn" as const),
      };
    }

    return null;
  }, [
    autoSavedRunId,
    guidedRunStage,
    hasCompletedReplayDebrief,
    isMissionActive,
    status,
  ]);

  function handlePauseFlow() {
    setReplayPlaying(false);
    setSimFrozen(false);
    pauseLiveRun();
    skipOnboarding();
  }

  function handleCompleteSuccess() {
    retryCountRef.current = 0;
    setReplayPlaying(false);
    setReplayMode(false);
    setReplayIndex(0);
    setSimFrozen(false);
    setAllowOrbitControls(true);
    stopLiveRun();
    resetScenario(scenarioRef.current.id);
    completeReplayDebrief();
    completePhase3();
  }

  function handleFailureExit() {
    retryCountRef.current = 0;
    setReplayPlaying(false);
    setReplayMode(false);
    setReplayIndex(0);
    setSimFrozen(false);
    setAllowOrbitControls(true);
    stopLiveRun();
    resetScenario(scenarioRef.current.id);
    setStatus("idle");
    setGuidedRunStage(null);
    openPanel();
    setPersistStatus("error", MISSION_FAILURE_MESSAGE);
  }

  const isFailureReady =
    readyState?.title === "The guided walkthrough did not finish cleanly." &&
    guidedRunStage === "ready";

  return (
    <>
      <MissionPauseOverlay
        open={pauseOverlay !== null}
        selector={pauseOverlay?.selector ?? null}
        compact={isCompact}
        title={pauseOverlay?.title ?? ""}
        body={pauseOverlay?.body ?? ""}
        progressLabel={pauseOverlay?.progressLabel ?? "Journey beat"}
        tone={pauseOverlay?.tone}
      />

      <MissionCoachCard
        open={missionCard !== null && pauseOverlay === null}
        title={missionCard?.title ?? ""}
        body={missionCard?.body ?? ""}
        progressLabel={missionCardProgress}
        layout={guidedRunStage === "transition" ? "center" : "bottom"}
        tone={missionCard?.tone}
        primaryActionLabel={guidedRunStage === "ready" ? "Explore Pathlight" : undefined}
        onPrimaryAction={guidedRunStage === "ready" ? (isFailureReady ? handleFailureExit : handleCompleteSuccess) : undefined}
        secondaryActionLabel={guidedRunStage === "ready" ? undefined : "Skip"}
        onSecondaryAction={guidedRunStage === "ready" ? undefined : handlePauseFlow}
      />

      <ReplayCoachStrip
        open={replayStrip !== null && status === "replay-debrief"}
        selector={replayStrip?.selector ?? null}
        compact={isCompact}
        title={replayStrip?.title ?? ""}
        body={replayStrip?.body ?? ""}
        progressLabel={replayStrip?.progressLabel ?? "Replay"}
        secondaryActionLabel="Skip"
        onSecondaryAction={handlePauseFlow}
        tone={replayStrip?.tone}
      />
    </>
  );
}
