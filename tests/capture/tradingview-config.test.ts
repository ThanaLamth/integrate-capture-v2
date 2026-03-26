import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("tradingview platform config", () => {
  it("defines an advanced chart capture for TradingView chart pages", async () => {
    const config = await loadPlatformConfig("tradingview");

    expect(config.platformKey).toBe("tradingview");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual(["advanced_chart"]);
    expect(config.captures[0]?.selectors).toContain("div.chart-container-border");
  });
});
