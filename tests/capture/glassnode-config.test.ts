import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("glassnode platform config", () => {
  it("defines explicit public Glassnode chart captures", async () => {
    const config = await loadPlatformConfig("glassnode");

    expect(config.platformKey).toBe("glassnode");
    expect(config.matchRules).toHaveLength(2);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "monthly_returns_chart",
      "price_performance_since_ath_chart"
    ]);
    expect(
      config.captures.find((entry) => entry.captureKey === "monthly_returns_chart")?.selectors
    ).toContain("div.uplot_container-lvzWw");
    expect(
      config.captures.find((entry) => entry.captureKey === "price_performance_since_ath_chart")
        ?.selectors
    ).toContain("div.uplot_container-lvzWw");
  });
});
