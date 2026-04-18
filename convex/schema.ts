import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const replayMetricValidator = v.object({
  positionError: v.number(),
  confidence: v.number(),
  dockScore: v.number(),
});

const replayFrameValidator = v.object({
  recordedAt: v.number(),
  simTime: v.number(),
  controllerState: v.string(),
  metrics: replayMetricValidator,
});

export default defineSchema({
  runs: defineTable({
    scenarioId: v.string(),
    scenarioName: v.string(),
    status: v.string(),
    durationSec: v.number(),
    summary: v.object({
      positionError: v.number(),
      dockScore: v.number(),
      confidence: v.number(),
      abortReason: v.union(v.string(), v.null()),
    }),
    replay: v.array(replayFrameValidator),
    completedAt: v.number(),
  })
    .index("by_scenario", ["scenarioId"])
    .index("by_completedAt", ["completedAt"]),
  scenarios: defineTable({
    scenarioId: v.string(),
    name: v.string(),
    description: v.string(),
    settingsJson: v.string(),
    updatedAt: v.number(),
  }).index("by_scenario_id", ["scenarioId"]),
});
