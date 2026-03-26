import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("l2beat platform config", () => {
  it("defines a primary card capture for scaling project pages", async () => {
    const config = await loadPlatformConfig("l2beat");

    expect(config.platformKey).toBe("l2beat");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "project_primary_card"
    ]);
    expect(config.captures[0]?.strategy).toBe("element_or_crop");
    expect(config.captures[0]?.selectors[0]).toBe("div.mt-4.mb-3");
  });
});
