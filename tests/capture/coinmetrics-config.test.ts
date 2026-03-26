import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("coinmetrics platform config", () => {
  it("defines a crypto-data capture for the default chart panel", async () => {
    const config = await loadPlatformConfig("coinmetrics");
    const capture = config.captures.find((entry) => entry.captureKey === "price_chart");

    expect(config.platformKey).toBe("coinmetrics");
    expect(config.matchRules[0]?.pageType).toBe("crypto_data");
    expect(capture).toBeDefined();
    expect(capture?.selectors).toContain("div[class*='GridPanel-chartContainer']");
    expect(capture?.fallbackSelectors).toContain("body");
  });
});
