import { readdir } from "node:fs/promises";
import path from "node:path";

import { loadPlatformConfig } from "../config/loaders";

export interface PlatformMatch {
  platformKey: string;
  pageType: string;
}

export async function matchPlatformForUrl(url: string): Promise<PlatformMatch | null> {
  const platformDir = path.join(process.cwd(), "configs", "platforms");
  const files = await readdir(platformDir);

  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }

    const platformKey = file.replace(/\.json$/i, "");
    const config = await loadPlatformConfig(platformKey);

    for (const rule of config.matchRules) {
      const matched = rule.urlPatterns.some((pattern: string) =>
        new RegExp(pattern, "i").test(url)
      );
      if (matched) {
        return {
          platformKey: config.platformKey,
          pageType: rule.pageType
        };
      }
    }
  }

  return null;
}
