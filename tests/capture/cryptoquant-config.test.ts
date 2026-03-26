import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("cryptoquant platform config", () => {
  it("defines explicit exchange reserve and netflow captures", async () => {
    const config = await loadPlatformConfig("cryptoquant");

    expect(config.platformKey).toBe("cryptoquant");
    expect(config.matchRules).toHaveLength(2);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "exchange_reserve_chart",
      "netflow_chart"
    ]);
    expect(
      config.captures.find((entry) => entry.captureKey === "exchange_reserve_chart")?.selectors
    ).toContain("div.highchart-content");
    expect(
      config.captures.find((entry) => entry.captureKey === "netflow_chart")?.selectors
    ).toContain("div.highchart-content");
  });
});
