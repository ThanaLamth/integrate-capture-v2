import { access } from "node:fs/promises";
import path from "node:path";

import type { AssetMap, SitePriority } from "../config/schema";

export interface ResolveTargetInput {
  siteId: string;
  assetKey: string;
  assetMap: AssetMap;
  sitePriority: SitePriority;
}

export interface ResolvedTarget {
  platformKey: string;
  url: string;
}

async function hasPlatformConfig(platformKey: string): Promise<boolean> {
  const configPath = path.join(process.cwd(), "configs", "platforms", `${platformKey}.json`);

  try {
    await access(configPath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveTargetsForAsset(
  input: ResolveTargetInput
): Promise<ResolvedTarget | null> {
  const asset = input.assetMap[input.assetKey];
  if (!asset) {
    return null;
  }

  const preferredCapturePlatforms = asset.preferredCapturePlatforms ?? [];
  const preferredPlatforms = input.sitePriority[input.siteId] ?? [];

  for (const platformKey of preferredCapturePlatforms) {
    const targetUrl = asset.platformTargets[platformKey];
    if (!targetUrl) {
      continue;
    }

    if (await hasPlatformConfig(platformKey)) {
      return {
        platformKey,
        url: targetUrl
      };
    }
  }

  for (const platformKey of preferredPlatforms) {
    const targetUrl = asset.platformTargets[platformKey];
    if (!targetUrl) {
      continue;
    }

    if (await hasPlatformConfig(platformKey)) {
      return {
        platformKey,
        url: targetUrl
      };
    }
  }

  for (const [platformKey, url] of Object.entries(asset.platformTargets) as Array<
    [string, string]
  >) {
    if (await hasPlatformConfig(platformKey)) {
      return {
        platformKey,
        url
      };
    }
  }

  return null;
}
