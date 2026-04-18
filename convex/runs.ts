import { mutationGeneric, queryGeneric } from "convex/server";
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

export const listRuns = queryGeneric({
  args: {
    scenarioId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("runs").withIndex("by_completedAt").order("desc").take(25);

    return args.scenarioId
      ? rows.filter((row) => row.scenarioId === args.scenarioId)
      : rows;
  },
});

export const saveRun = mutationGeneric({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("runs", {
      ...args,
      completedAt: Date.now(),
    });
  },
});
