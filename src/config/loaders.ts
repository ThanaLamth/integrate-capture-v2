import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  assetMapSchema,
  platformConfigSchema,
  sitePrioritySchema,
  type AssetMap,
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
