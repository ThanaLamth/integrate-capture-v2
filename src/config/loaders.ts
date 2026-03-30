import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  assetMapSchema,
  captionProfilesSchema,
  platformCatalogSchema,
  platformHealthStatusSchema,
  platformHealthTargetsSchema,
  platformConfigSchema,
  sitePrioritySchema,
  type AssetMap,
  type CaptionProfiles,
  type PlatformCatalog,
  type PlatformHealthStatus,
  type PlatformHealthTargets,
  type PlatformConfig,
  type SitePriority
} from "./schema";

const rootDir = process.cwd();

async function readJsonFile<T>(filePath: string, parser: (input: unknown) => T): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return parser(JSON.parse(raw));
}

export async function loadPlatformConfig(platformKey: string): Promise<PlatformConfig> {
  const configPath = path.join(rootDir, "configs", "platforms", `${platformKey}.json`);
  return readJsonFile(configPath, (input) => platformConfigSchema.parse(input));
}

export async function loadAssetMap(): Promise<AssetMap> {
  const configPath = path.join(rootDir, "configs", "assets", "asset-map.json");
  return readJsonFile(configPath, (input) => assetMapSchema.parse(input));
}

export async function loadSitePriority(): Promise<SitePriority> {
  const configPath = path.join(rootDir, "configs", "site-priority.json");
  return readJsonFile(configPath, (input) => sitePrioritySchema.parse(input));
}

export async function loadPlatformCatalog(): Promise<PlatformCatalog> {
  const configPath = path.join(rootDir, "configs", "platform-catalog.json");
  return readJsonFile(configPath, (input) => platformCatalogSchema.parse(input));
}

export async function loadCaptionProfiles(): Promise<CaptionProfiles> {
  const configPath = path.join(rootDir, "configs", "caption-profiles.json");
  return readJsonFile(configPath, (input) => captionProfilesSchema.parse(input));
}

export async function loadPlatformHealthTargets(): Promise<PlatformHealthTargets> {
  const configPath = path.join(rootDir, "configs", "platform-health-targets.json");
  return readJsonFile(configPath, (input) => platformHealthTargetsSchema.parse(input));
}

export async function loadPlatformHealthStatus(): Promise<PlatformHealthStatus | null> {
  const dataPath = path.join(rootDir, "data", "platform-health-status.json");

  try {
    await access(dataPath);
  } catch {
    return null;
  }

  return readJsonFile(dataPath, (input) => platformHealthStatusSchema.parse(input));
}

export async function writePlatformHealthStatus(status: PlatformHealthStatus): Promise<string> {
  const dataDir = path.join(rootDir, "data");
  await mkdir(dataDir, { recursive: true });
  const dataPath = path.join(dataDir, "platform-health-status.json");
  await writeFile(dataPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
  return dataPath;
}
