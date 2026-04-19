export type GuidedRunStageId =
  | "transition"
  | "mission-setup"
  | "search"
  | "acquire-track"
  | "align"
  | "insert"
  | "dock"
  | "replay-intro"
  | "replay-demo"
  | "save-handoff"
  | "ready";

export const GUIDED_RUN_STAGE_IDS: readonly GuidedRunStageId[] = [
  "transition",
  "mission-setup",
  "search",
  "acquire-track",
  "align",
  "insert",
  "dock",
  "replay-intro",
  "replay-demo",
  "save-handoff",
  "ready",
];

export const GUIDED_RUN_MISSION_STAGES: readonly GuidedRunStageId[] = [
  "transition",
  "mission-setup",
  "search",
  "acquire-track",
  "align",
  "insert",
  "dock",
];

export function isGuidedRunStageId(value: unknown): value is GuidedRunStageId {
  return typeof value === "string" && GUIDED_RUN_STAGE_IDS.includes(value as GuidedRunStageId);
}
