import type { PlatformConfig } from "../config/schema";

export interface NavigationPlan {
  url: string;
  viewport: PlatformConfig["viewports"]["default"];
  waitConditions: PlatformConfig["waitConditions"];
}

export function buildNavigationPlan(config: PlatformConfig, url: string): NavigationPlan {
  return {
    url,
    viewport: config.viewports.default,
    waitConditions: config.waitConditions
  };
}
