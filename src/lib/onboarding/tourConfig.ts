import type { Step } from "react-joyride";

export type OrientationTourStepId =
  | "sim-header"
  | "guidance-panel"
  | "sensor-feed"
  | "controller-pipeline"
  | "telemetry-panel"
  | "scenario-panel"
  | "run-controls"
  | "replay-panel";

export type OrientationTourStepDefinition = {
  id: OrientationTourStepId;
  selector: string;
  title: string;
  description: string;
  desktopPlacement: Step["placement"];
  mobilePlacement: Step["placement"];
};

export const ORIENTATION_TOUR_STEP_IDS: readonly OrientationTourStepId[] = [
  "sim-header",
  "guidance-panel",
  "sensor-feed",
  "controller-pipeline",
  "telemetry-panel",
  "scenario-panel",
  "run-controls",
  "replay-panel",
];

export const FIRST_ORIENTATION_TOUR_STEP_ID = ORIENTATION_TOUR_STEP_IDS[0];

const DESKTOP_TOUR_DEFINITIONS: readonly OrientationTourStepDefinition[] = [
  {
    id: "sim-header",
    selector: '[data-tour="sim-header"]',
    title: "Live sim header",
    description:
      "This is the simulation shell. The run controls on the right rail let you start, pause, or stop a pass whenever you want.",
    desktopPlacement: "bottom-start",
    mobilePlacement: "bottom",
  },
  {
    id: "guidance-panel",
    selector: '[data-tour="guidance-panel"]',
    title: "Guidance first",
    description:
      "Start here when you want the fastest read once a run is active. This panel tells you the controller state and whether the pass looks healthy.",
    desktopPlacement: "right-start",
    mobilePlacement: "center",
  },
  {
    id: "sensor-feed",
    selector: '[data-tour="sensor-feed"]',
    title: "Tracking view",
    description:
      "This synthetic EO/IR view shows what the tracking system is following. It gives context without making you read raw numbers first.",
    desktopPlacement: "right",
    mobilePlacement: "bottom",
  },
  {
    id: "controller-pipeline",
    selector: '[data-tour="controller-pipeline"]',
    title: "Run phase",
    description:
      "This strip shows the controller progression from SEARCH to DOCKED. Think of it as the run's current phase, not a manual checklist.",
    desktopPlacement: "right-start",
    mobilePlacement: "top",
  },
  {
    id: "telemetry-panel",
    selector: '[data-tour="telemetry-panel"]',
    title: "Metrics for inspection",
    description:
      "These metrics are useful for comparison and deeper inspection. They matter most after you already know what the guidance panel is saying.",
    desktopPlacement: "right-start",
    mobilePlacement: "center",
  },
  {
    id: "scenario-panel",
    selector: '[data-tour="scenario-panel"]',
    title: "Preset control",
    description:
      "Use presets to change the motion conditions. The selected preset becomes the starting point for the next live run.",
    desktopPlacement: "left-start",
    mobilePlacement: "top",
  },
  {
    id: "run-controls",
    selector: '[data-tour="run-controls"]',
    title: "Start, pause, stop",
    description:
      "Start launches a fresh pass, Pause holds the current one, and Stop returns the sim to the preset start so it only moves when you want it to.",
    desktopPlacement: "left-start",
    mobilePlacement: "top",
  },
  {
    id: "replay-panel",
    selector: '[data-tour="replay-panel"]',
    title: "Replay and save",
    description:
      "Replay and save-run live here. Once a run exists, this is where you revisit it without starting another live pass.",
    desktopPlacement: "left-start",
    mobilePlacement: "center",
  },
];

const COMPACT_TOUR_IDS: readonly OrientationTourStepId[] = [
  "sim-header",
  "guidance-panel",
  "sensor-feed",
  "controller-pipeline",
  "scenario-panel",
  "run-controls",
];

export function isOrientationTourStepId(value: unknown): value is OrientationTourStepId {
  return typeof value === "string" && ORIENTATION_TOUR_STEP_IDS.includes(value as OrientationTourStepId);
}

export function getOrientationTourDefinitions(isCompact: boolean) {
  if (!isCompact) {
    return [...DESKTOP_TOUR_DEFINITIONS];
  }

  return DESKTOP_TOUR_DEFINITIONS.filter((step) => COMPACT_TOUR_IDS.includes(step.id));
}
