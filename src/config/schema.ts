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

const evidenceTypeSchema = z.enum([
  "onchain_transfer",
  "derivatives_market",
  "exchange_positioning",
  "options_market",
  "defi_metrics",
  "spot_market",
  "etf_flow",
  "structured_product",
  "filing_regulatory",
  "policy_regulatory",
  "macro_rates",
  "commodities_fx",
  "equities_public_company",
  "ai_company_news",
  "funding_mna",
  "governance",
  "claim_check",
  "geopolitics_security",
  "protocol_technical",
  "airdrop_sybil",
  "token_holder_concentration",
  "index_product",
  "legal_security",
  "general_news"
]);

const platformCatalogEntrySchema = z.object({
  platformKey: z.string().min(1),
  category: z.string().min(1),
  supportsEvidence: z.array(evidenceTypeSchema).min(1),
  strengths: z.array(z.string().min(1)).default([]),
  notes: z.string().min(1).optional()
});

const recommendedPlatformSchema = z.object({
  platformKey: z.string().min(1),
  supportsEvidence: z.array(evidenceTypeSchema).min(1),
  reason: z.string().min(1)
});

const captionProfileSchema = z.object({
  tone: z.string().min(1),
  maxWords: z.number().int().positive(),
  sentenceCount: z.number().int().positive(),
  sourcePrefix: z.string().min(1),
  linkPosition: z.enum(["end", "inline"]),
  emphasizeData: z.boolean().default(false),
  emphasizeExplanation: z.boolean().default(false),
  emphasizeRegionalAngle: z.boolean().default(false),
  emphasizeConflict: z.boolean().default(false),
  forbiddenPhrases: z.array(z.string().min(1)).default([])
});

const healthTargetSchema = z.object({
  platformKey: z.string().min(1),
  sampleUrl: z.string().url()
});

const platformHealthEntrySchema = z.object({
  status: z.enum(["healthy", "blocked", "broken", "unknown"]),
  checkedAt: z.string().min(1),
  detail: z.string().min(1).optional(),
  sampleUrl: z.string().url(),
  finalUrl: z.string().url().optional(),
  title: z.string().min(1).optional(),
  captureChecks: z
    .array(
      z.object({
        captureKey: z.string().min(1),
        pageType: z.string().min(1),
        status: z.enum(["ready", "missing_selector", "missing_anchor", "error"]),
        selector: z.string().min(1).optional(),
        detail: z.string().min(1).optional()
      })
    )
    .optional()
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

export const platformCatalogSchema = z.object({
  currentPlatforms: z.array(platformCatalogEntrySchema).min(1),
  recommendedPlatforms: z.array(recommendedPlatformSchema).min(1)
});

export const platformHealthTargetsSchema = z.object({
  targets: z.array(healthTargetSchema).min(1)
});

export const platformHealthStatusSchema = z.object({
  platforms: z.record(z.string().min(1), platformHealthEntrySchema)
});

export const captionProfilesSchema = z.record(z.string().min(1), captionProfileSchema);

export type PlatformConfig = z.infer<typeof platformConfigSchema>;
export type AssetMap = z.infer<typeof assetMapSchema>;
export type SitePriority = z.infer<typeof sitePrioritySchema>;
export type PlatformCatalog = z.infer<typeof platformCatalogSchema>;
export type PlatformCatalogEntry = z.infer<typeof platformCatalogEntrySchema>;
export type RecommendedPlatform = z.infer<typeof recommendedPlatformSchema>;
export type EvidenceType = z.infer<typeof evidenceTypeSchema>;
export type PlatformHealthTargets = z.infer<typeof platformHealthTargetsSchema>;
export type PlatformHealthTarget = z.infer<typeof healthTargetSchema>;
export type PlatformHealthStatus = z.infer<typeof platformHealthStatusSchema>;
export type PlatformHealthEntry = z.infer<typeof platformHealthEntrySchema>;
export type CaptionProfiles = z.infer<typeof captionProfilesSchema>;
export type CaptionProfile = z.infer<typeof captionProfileSchema>;
