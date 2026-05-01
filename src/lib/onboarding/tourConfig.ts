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
    title: "Live journey shell",
    description:
      "This is the Pathlight shell. The controls on the right let you start, pause, or reset a journey whenever you want.",
    desktopPlacement: "bottom-start",
    mobilePlacement: "bottom",
  },
  {
    id: "guidance-panel",
    selector: '[data-tour="guidance-panel"]',
    title: "Trip guidance first",
    description:
      "Start here when you want the fastest read during a live journey. This panel tells you the current guidance phase and whether the route is staying calm and clear.",
    desktopPlacement: "right-start",
    mobilePlacement: "center",
  },
  {
    id: "sensor-feed",
    selector: '[data-tour="sensor-feed"]',
    title: "Assistive preview",
    description:
      "This panel previews what the traveler would receive: landmark cues, safety notes, and low-vision simplification without making you parse raw metrics first.",
    desktopPlacement: "right",
    mobilePlacement: "bottom",
  },
  {
    id: "controller-pipeline",
    selector: '[data-tour="controller-pipeline"]',
    title: "Journey phases",
    description:
      "This strip shows the route progression from Locate to Arrive. Think of it as the current journey phase, not a manual checklist.",
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
    title: "Journey setup",
    description:
      "Use presets to change the environment, traveler profile, and route story. The selected setup becomes the starting point for the next live journey.",
    desktopPlacement: "left-start",
    mobilePlacement: "top",
  },
  {
    id: "run-controls",
    selector: '[data-tour="run-controls"]',
    title: "Start, pause, stop",
    description:
      "Start launches a fresh journey, Pause holds the current one, and Reset returns the traveler to the preset start so it only moves when you want it to.",
    desktopPlacement: "left-start",
    mobilePlacement: "top",
  },
  {
    id: "replay-panel",
    selector: '[data-tour="replay-panel"]',
    title: "Replay and save",
    description:
      "Replay, compare, and save live here. Once a journey exists, this is where you revisit it without starting another live journey.",
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
