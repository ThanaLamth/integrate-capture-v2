import { z } from "zod";

const viewportSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  deviceScaleFactor: z.number().positive().default(1)
});

const matchRuleSchema = z.object({
  pageType: z.string().min(1),
  urlPatterns: z.array(z.string().min(1)).min(1)
});

const cropRulesSchema = z.object({
  anchorSelector: z.string().min(1),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive()
});

const waitConditionsSchema = z.object({
  networkIdleMs: z.number().int().nonnegative(),
  extraDelayMs: z.number().int().nonnegative(),
  requiredSelectors: z.array(z.string().min(1)).min(1)
});

const captureSchema = z.object({
  captureKey: z.string().min(1),
  pageType: z.string().min(1),
  strategy: z.enum(["element", "crop", "element_or_crop"]),
  selectors: z.array(z.string().min(1)).min(1),
  fallbackSelectors: z.array(z.string().min(1)).default([]),
  cropRules: cropRulesSchema.optional(),
  scrollIntoView: z.boolean().default(true),
  retries: z.number().int().nonnegative().default(0)
});

const outputSchema = z.object({
  fileTemplate: z.string().min(1),
  metadataTemplate: z.string().min(1)
});

export const platformConfigSchema = z.object({
  siteName: z.string().min(1),
  platformKey: z.string().min(1),
  matchRules: z.array(matchRuleSchema).min(1),
  viewports: z.object({
    default: viewportSchema
  }),
  waitConditions: waitConditionsSchema,
  captures: z.array(captureSchema).min(1),
  output: outputSchema
});

const assetTargetSchema = z.object({
  aliases: z.array(z.string().min(1)).min(1),
  preferredCapturePlatforms: z.array(z.string().min(1)).optional(),
  platformTargets: z.record(z.string().min(1), z.string().url())
});

export const assetMapSchema = z.record(z.string().min(1), assetTargetSchema);

export const sitePrioritySchema = z.record(
  z.string().min(1),
  z.array(z.string().min(1))
);

export type PlatformConfig = z.infer<typeof platformConfigSchema>;
export type AssetMap = z.infer<typeof assetMapSchema>;
export type SitePriority = z.infer<typeof sitePrioritySchema>;
