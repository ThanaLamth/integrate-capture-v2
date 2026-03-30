import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  platformCatalogSchema,
  platformConfigSchema,
  platformHealthTargetsSchema,
  type EvidenceType,
  type PlatformCatalog,
  type PlatformConfig,
  type PlatformHealthTargets
} from "../config/schema";

export interface OnboardPlatformInput {
  platformKey: string;
  sampleUrl: string;
  siteName?: string;
  category?: string;
  supportsEvidence?: EvidenceType[];
}

export interface OnboardPlatformResult {
  platformKey: string;
  configPath: string;
  catalogPath: string;
  healthTargetsPath: string;
  usedSuggestedMetadata: boolean;
}

function titleCaseFromKey(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inferPageType(sampleUrl: string): string {
  const parsed = new URL(sampleUrl);
  const lastSegment = parsed.pathname.split("/").filter(Boolean).at(-1);
  if (!lastSegment) {
    return "page";
  }

  return `${lastSegment.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_page`;
}

function buildPlatformTemplate(input: {
  platformKey: string;
  siteName: string;
  sampleUrl: string;
}): PlatformConfig {
  const pageType = inferPageType(input.sampleUrl);

  return platformConfigSchema.parse({
    siteName: input.siteName,
    platformKey: input.platformKey,
    matchRules: [
      {
        pageType,
        urlPatterns: [`^${escapeRegExp(input.sampleUrl)}\\/?$`]
      }
    ],
    viewports: {
      default: {
        width: 1600,
        height: 1200,
        deviceScaleFactor: 1
      }
    },
    waitConditions: {
      networkIdleMs: 1500,
      extraDelayMs: 2500,
      requiredSelectors: ["main", "article", "body"]
    },
    captures: [
      {
        captureKey: "primary_view",
        pageType,
        strategy: "element_or_crop",
        selectors: ["main", "article", "body"],
        fallbackSelectors: ["body"],
        cropRules: {
          anchorSelector: "body",
          x: 80,
          y: 80,
          width: 1280,
          height: 900
        },
        scrollIntoView: true,
        retries: 1
      }
    ],
    output: {
      fileTemplate: "{site_id}__{asset_slug}__{platform_key}__{capture_key}__{timestamp}.png",
      metadataTemplate: "{site_id}__{asset_slug}__{platform_key}__{capture_key}__{timestamp}.json"
    }
  });
}

async function readJson<T>(filePath: string, parser: (value: unknown) => T): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return parser(JSON.parse(raw));
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function onboardPlatform(input: OnboardPlatformInput): Promise<OnboardPlatformResult> {
  const rootDir = process.cwd();
  const configDir = path.join(rootDir, "configs", "platforms");
  const catalogPath = path.join(rootDir, "configs", "platform-catalog.json");
  const healthTargetsPath = path.join(rootDir, "configs", "platform-health-targets.json");
  const configPath = path.join(configDir, `${input.platformKey}.json`);

  await mkdir(configDir, { recursive: true });

  const catalog = await readJson(catalogPath, (value) => platformCatalogSchema.parse(value));
  const healthTargets = await readJson(healthTargetsPath, (value) =>
    platformHealthTargetsSchema.parse(value)
  );

  const suggested = catalog.recommendedPlatforms.find(
    (platform) => platform.platformKey === input.platformKey
  );

  const siteName = input.siteName ?? titleCaseFromKey(input.platformKey);
  const category = input.category ?? "external";
  const supportsEvidence =
    input.supportsEvidence ??
    suggested?.supportsEvidence ??
    (["general_news"] as EvidenceType[]);

  const config = buildPlatformTemplate({
    platformKey: input.platformKey,
    siteName,
    sampleUrl: input.sampleUrl
  });
  await writeJson(configPath, config);

  const nextCatalog: PlatformCatalog = {
    currentPlatforms: [
      ...catalog.currentPlatforms.filter((platform) => platform.platformKey !== input.platformKey),
      {
        platformKey: input.platformKey,
        category,
        supportsEvidence,
        strengths: ["newly onboarded platform"],
        notes: suggested?.reason ?? "Scaffolded by onboarding workflow."
      }
    ].sort((left, right) => left.platformKey.localeCompare(right.platformKey)),
    recommendedPlatforms: catalog.recommendedPlatforms.filter(
      (platform) => platform.platformKey !== input.platformKey
    )
  };
  await writeJson(catalogPath, nextCatalog);

  const nextHealthTargets: PlatformHealthTargets = {
    targets: [
      ...healthTargets.targets.filter((target) => target.platformKey !== input.platformKey),
      {
        platformKey: input.platformKey,
        sampleUrl: input.sampleUrl
      }
    ].sort((left, right) => left.platformKey.localeCompare(right.platformKey))
  };
  await writeJson(healthTargetsPath, nextHealthTargets);

  return {
    platformKey: input.platformKey,
    configPath,
    catalogPath,
    healthTargetsPath,
    usedSuggestedMetadata: Boolean(suggested && !input.supportsEvidence && !input.category)
  };
}
