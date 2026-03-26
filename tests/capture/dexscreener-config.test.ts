import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("dexscreener platform config", () => {
  it("defines a pair chart capture for pair pages", async () => {
    const config = await loadPlatformConfig("dexscreener");

    expect(config.platformKey).toBe("dexscreener");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual(["pair_chart"]);
    expect(config.captures[0]?.selectors).toContain("div.tv-chart-container");
  });
});
