import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

export const listScenarios = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("scenarios").collect();
  },
});

export const upsertScenario = mutationGeneric({
  args: {
    scenarioId: v.string(),
    name: v.string(),
    description: v.string(),
    settingsJson: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("scenarios")
      .withIndex("by_scenario_id", (query) => query.eq("scenarioId", args.scenarioId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("scenarios", {
      ...args,
      updatedAt: Date.now(),
    });
  },
});
