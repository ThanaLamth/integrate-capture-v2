import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("tokenterminal platform config", () => {
  it("defines a project overview capture for explorer project pages", async () => {
    const config = await loadPlatformConfig("tokenterminal");

    expect(config.platformKey).toBe("tokenterminal");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "project_overview_card"
    ]);
    expect(config.captures[0]?.strategy).toBe("element_or_crop");
    expect(config.waitConditions.extraDelayMs).toBeGreaterThanOrEqual(15000);
  });
});
